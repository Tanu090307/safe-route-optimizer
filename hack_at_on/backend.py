from flask import Flask, request, jsonify
from flask_cors import CORS
import googlemaps
import rasterio
import numpy as np
import joblib

app = Flask(__name__)
CORS(app)

# -------------------------------
# Load ML
# -------------------------------
model = joblib.load("route_safety_model.pkl")
scaler = joblib.load("route_safety_scaler.pkl")

# -------------------------------
# Google Maps
# -------------------------------
gmaps = googlemaps.Client(key="api_key")

# -------------------------------
# VIIRS (OPEN ONCE)
# -------------------------------
VIIRS_FILE = r"C:\spider\hack_at_on\data\SVDNB_npp_20251001-20251031_75N060E_vcmslcfg_v10_c202511071000.avg_rade9h.tif"
viirs_ds = rasterio.open(VIIRS_FILE)

def get_brightness(lat, lon):
    try:
        row, col = viirs_ds.index(lon, lat)
        val = viirs_ds.read(1)[row, col]
        return float(val) if val > 0 and not np.isnan(val) else 0.0
    except:
        return 0.0

def route_lighting_score(coords):
    values = []
    for lat, lon in coords[::10]:
        v = get_brightness(lat, lon)
        if v > 0:
            values.append(v)

    if not values:
        return 0.0

    p75 = np.percentile(values, 75)
    return min(p75 / 50.0, 1.0)

# -------------------------------
# POI TYPES
# -------------------------------
POSITIVE_POIS = ["police", "hospital", "fire_station", "atm", "gas_station"]
NEGATIVE_POIS = ["bar", "night_club", "liquor_store"]

# -------------------------------
# ANALYZE ROUTE
# -------------------------------
@app.route("/analyze_route", methods=["POST"])
def analyze_route():
    coords = request.json["coords"]  # MUST be [lat, lon]

    pos, neg = 0, 0
    seen = set()

    for lat, lon in coords[::20]:
        for p in POSITIVE_POIS:
            for r in gmaps.places_nearby(location=(lat, lon), radius=150, type=p).get("results", []):
                if r["place_id"] not in seen:
                    seen.add(r["place_id"])
                    pos += 1

        for p in NEGATIVE_POIS:
            for r in gmaps.places_nearby(location=(lat, lon), radius=150, type=p).get("results", []):
                if r["place_id"] not in seen:
                    seen.add(r["place_id"])
                    neg += 1

    return jsonify({
        "positive_poi_count": pos,
        "negative_poi_count": neg,
        "lighting_score": route_lighting_score(coords)
    })

# -------------------------------
# ML PREDICTION
# -------------------------------
@app.route("/predict_routes", methods=["POST"])
def predict_routes():
    routes = request.json["routes"]

    X = np.array([[r["pos_score"], r["neg_score"], r["light_score"]] for r in routes])
    preds = model.predict(scaler.transform(X))

    for i, p in enumerate(preds):
        routes[i]["safety_score"] = float(p)

    routes.sort(key=lambda r: r["safety_score"], reverse=True)
    return jsonify(routes)

# -------------------------------
if __name__ == "__main__":
    app.run(port=5000, debug=True)
