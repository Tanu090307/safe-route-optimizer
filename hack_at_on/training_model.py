import pandas as pd
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error

# -----------------------------
# Load dataset
# -----------------------------
df = pd.read_csv("route_safety_dataset.csv")

X = df[["pos_score", "neg_score", "light_score"]]
y = df["safety"]

# -----------------------------
# Train / validation split
# -----------------------------
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# -----------------------------
# Scaling
# -----------------------------
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_val_scaled = scaler.transform(X_val)

# -----------------------------
# Model
# -----------------------------
model = RandomForestRegressor(
    n_estimators=400,
    max_depth=12,
    min_samples_leaf=5,
    random_state=42
)

model.fit(X_train_scaled, y_train)

# -----------------------------
# Validation sanity check
# -----------------------------
val_preds = model.predict(X_val_scaled)
mae = mean_absolute_error(y_val, val_preds)

print(f"Validation MAE: {mae:.4f}")
print(f"Prediction range: {val_preds.min():.2f} → {val_preds.max():.2f}")

# -----------------------------
# Save artifacts
# -----------------------------
joblib.dump(model, "route_safety_model.pkl")
joblib.dump(scaler, "route_safety_scaler.pkl")

print("Model trained & saved successfully")
