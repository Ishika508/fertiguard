import sys
import json
import joblib
import numpy as np
import pandas as pd

model = joblib.load("ml/clog_model.pkl")
anomaly_model = joblib.load("ml/anomaly_model.pkl")
data = json.loads(sys.argv[1])

s = data["sensors"]

ph = s["ph"]
turbidity = s["turbidity"]
startFlow = s["startFlow"]
endFlow = s["endFlow"]

# Guard against invalid/zero start flow so inference never crashes.
safe_start_flow = max(float(startFlow), 1e-6)

flowDiff = ((startFlow - endFlow) / safe_start_flow) * 100
flowRatio = endFlow / safe_start_flow
phDeviation = abs(ph - 6.5)


X = pd.DataFrame([{
    "ph": ph,
    "turbidity": turbidity,
    "startFlow": startFlow,
    "endFlow": endFlow,
    "flowDiff": flowDiff,
    "flowRatio": flowRatio,
    "phDeviation": phDeviation
}])
anomaly_score = anomaly_model.predict(X)[0]  # -1 = anomaly, 1 = normal
is_anomaly = 1 if anomaly_score == -1 else 0
prob = model.predict_proba(X)[0][1]

# Confidence calibration (range 0.20 - 0.70):
# Keeps values realistic and avoids very high confidence on noisy field data.
base_confidence = abs(prob - 0.5) * 2  # 0..1
confidence = 0.25 + (base_confidence * 0.45)

# LOGIC LAYER (important)
leak = 0
sensor_fault = 0

# leak detection
branch_flows = data.get("branches", {})

total_branch = 0
for b in branch_flows.values():
    if isinstance(b, dict):
        total_branch += b.get("flow", 0)
    elif isinstance(b, (int, float)):
        total_branch += b

# anomaly classification
anomaly_type = "normal"
anomaly_severity = "low"
anomaly_reason = "All parameters within expected range"

if is_anomaly:
    if total_branch > 0 and startFlow > total_branch * 1.5:
        anomaly_type = "leak"
        anomaly_severity = "high"
        anomaly_reason = "Input flow significantly higher than output (possible leakage)"

    elif ph < 4 or ph > 9:
        anomaly_type = "sensor_fault"
        anomaly_severity = "medium"
        anomaly_reason = "pH values outside safe operating range"

    elif turbidity > 5:
        anomaly_type = "blockage"
        anomaly_severity = "medium"
        anomaly_reason = "High turbidity indicates particle accumulation"

    else:
        anomaly_type = "unknown"
        anomaly_severity = "low"
        anomaly_reason = "Unusual pattern detected by ML model"

if anomaly_type == "unknown":
    confidence = max(0.20, confidence - 0.08)

confidence = round(float(np.clip(confidence, 0.20, 0.70)), 2)

# recommendation
if prob > 0.7:
    action = "Flush for 2 minutes immediately"
elif prob > 0.4:
    action = "Monitor closely, possible clog forming"
else:
    action = "System normal"

result = {
    "clogProbability": round(prob * 100, 2),
    "recommendedAction": action,
    "anomaly": is_anomaly,
    "anomalyType": anomaly_type,
    "severity": anomaly_severity,
    "reason": anomaly_reason,
    "confidence": confidence
}


print(json.dumps(result))