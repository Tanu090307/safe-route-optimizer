import joblib
import pandas as pd

# -------------------------------
# Load trained model & scaler
# -------------------------------
model = joblib.load("route_safety_model.pkl")
scaler = joblib.load("route_safety_scaler.pkl")

# -------------------------------
# Realistic test routes
# (MATCH training data distribution)
# -------------------------------
routes = pd.DataFrame(
    [
        [0.70, 0.15, 0.60],  # SAFE: good lighting, low crime
        [0.45, 0.30, 0.45],  # MODERATE
        [0.25, 0.60, 0.30],  # UNSAFE: high crime, low light
    ],
    columns=["pos_score", "neg_score", "light_score"]
)

# -------------------------------
# Scale features
# -------------------------------
X_scaled = scaler.transform(routes)

# -------------------------------
# Predict safety score
# -------------------------------
scores = model.predict(X_scaled)

# -------------------------------
# Interpret results
# -------------------------------
for i, s in enumerate(scores):
    if s >= 0.66:
        label = "SAFE"
    elif s >= 0.33:
        label = "MODERATE"
    else:
        label = "UNSAFE"

    print(f"Route {i+1}: {s:.2f} → {label}")
