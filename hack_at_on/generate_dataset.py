import numpy as np
import pandas as pd

np.random.seed(42)
rows = []

def scale_pos_neg(pos, neg, km):
    pos_density = pos / km
    neg_density = neg / km

    pos_score = 1 - np.exp(-pos_density / 6)
    neg_score = 1 - np.exp(-neg_density / 4.5)

    return np.clip(pos_score, 0, 1), np.clip(neg_score, 0, 1)

NUM_SAMPLES = 8000

for _ in range(NUM_SAMPLES):
    # Route length (urban)
    km = np.random.uniform(1.5, 6.0)

    # Positive POIs (police, hospitals, ATMs)
    pos = int(np.random.normal(loc=5.8 * km, scale=1.0 * km))
    pos = max(0, pos)

    # Negative POIs (bars, liquor shops)
    neg = int(np.random.normal(loc=1.3 * km, scale=0.6 * km))
    neg = max(0, neg)

    # Lighting (VIIRS-like)
    light = np.clip(
        np.random.normal(loc=0.58, scale=0.10),
        0.30,
        0.75
    )

    pos_s, neg_s = scale_pos_neg(pos, neg, km)

    # 🧠 Teacher rule (this encodes YOUR intuition)
    safety = (
        0.6 * pos_s +
        0.5 * light -
        0.25 * neg_s
    )

    safety = np.clip(safety, 0, 1)

    rows.append([pos_s, neg_s, light, safety])

df = pd.DataFrame(
    rows,
    columns=["pos_score", "neg_score", "light_score", "safety"]
)

df.to_csv("route_safety_dataset.csv", index=False)
print("Dataset generated:", len(df))
