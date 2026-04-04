import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import joblib

df = pd.read_csv("fertiguard_data.csv")

X = df.drop("clog", axis=1)
y = df["clog"]

model = RandomForestClassifier(n_estimators=100)
model.fit(X, y)

joblib.dump(model, "clog_model.pkl")

print("Model trained and saved")
from sklearn.ensemble import IsolationForest

# anomaly model (unsupervised)
anomaly_model = IsolationForest(contamination=0.05, random_state=42)

anomaly_model.fit(X)

joblib.dump(anomaly_model, "anomaly_model.pkl")

print("Anomaly model trained")