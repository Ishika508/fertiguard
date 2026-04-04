import pandas as pd
import numpy as np
import random

rows = []

for i in range(3000):
    ph = round(random.uniform(5.5, 7.5), 2)
    turbidity = round(random.uniform(0.5, 3.5), 2)
    startFlow = random.uniform(40, 60)

    # simulate clog buildup
    clog_stage = random.choice([0, 1, 2])  # 0 normal, 1 medium, 2 severe

    if clog_stage == 0:
        endFlow = startFlow * random.uniform(0.85, 0.95)
        clog = 0
    elif clog_stage == 1:
        endFlow = startFlow * random.uniform(0.6, 0.8)
        clog = 0
    else:
        endFlow = startFlow * random.uniform(0.2, 0.5)
        clog = 1

    flowDiff = ((startFlow - endFlow) / startFlow) * 100
    flowRatio = endFlow / startFlow
    phDeviation = abs(ph - 6.5)

    rows.append([
        ph, turbidity, startFlow, endFlow,
        flowDiff, flowRatio, phDeviation, clog
    ])

df = pd.DataFrame(rows, columns=[
    "ph", "turbidity", "startFlow", "endFlow",
    "flowDiff", "flowRatio", "phDeviation", "clog"
])

df.to_csv("fertiguard_data.csv", index=False)
print("CSV generated")