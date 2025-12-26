from flask import Flask, request, jsonify
from flask_cors import CORS
import googlemaps
import rasterio
import numpy as np

# -------------------------------
# Flask App
# -------------------------------
app = Flask(__name__)
CORS(app)

# -------------------------------
# Google Maps Client
# -------------------------------
gmaps = googlemaps.Client(
    key="AIzaSyDXQLZRCndqHH_N_Axkjet29WWgjt948gc"
)

# -------------------------------
# VIIRS DATASET
# -------------------------------
VIIRS_FILE = r"C:\spider\hack_at_on\data\SVDNB_npp_20251001-20251031_75N060E_vcmslcfg_v10_c202511071000.avg_rade9h.tif"
viirs_ds = rasterio.open(VIIRS_FILE)

def get_brightness(lat, lon):
    try:
        row, col = viirs_ds.index(lon, lat)
        val = viirs_ds.read(1)[row, col]
        if np.isnan(val) or val < 0:
            return 0.0
        return float(val)
    except:
        return 0.0

def route_lighting_score(coords):
    values = []
    for lat, lon in coords[::10]:
        values.append(get_brightness(lat, lon))

    if not values:
        return 0.0

    avg = np.mean(values)
    return min(avg / 60.0, 1.0)

# -------------------------------
# POI Categories (24×7 assumption)
# -------------------------------
POSITIVE_POIS = [
    "police",
    "hospital",
    "fire_station",
    "atm",
    "gas_station",
    "lodging"
]

NEGATIVE_POIS = [
    "bar",
    "night_club",
    "liquor_store"
]

# -------------------------------
# API
# -------------------------------
@app.route("/analyze_route", methods=["POST"])
def analyze_route():
    data = request.get_json()
    coords = data["coords"]

    positive_count = 0
    negative_count = 0
    poi_set = set()
    poi_coords = []

    sampled = coords[::10]

    for lat, lon in sampled:

        # POSITIVE POIs
        for poi in POSITIVE_POIS:
            res = gmaps.places_nearby(
                location=(lat, lon),
                radius=150,
                type=poi
            )

            for p in res.get("results", []):
                pid = p["place_id"]
                if pid in poi_set:
                    continue

                poi_set.add(pid)
                loc = p["geometry"]["location"]

                poi_coords.append({
                    "lat": loc["lat"],
                    "lon": loc["lng"],
                    "type": poi,
                    "signal": "positive"
                })
                positive_count += 1

        # NEGATIVE POIs
        for poi in NEGATIVE_POIS:
            res = gmaps.places_nearby(
                location=(lat, lon),
                radius=150,
                type=poi
            )

            for p in res.get("results", []):
                pid = p["place_id"]
                if pid in poi_set:
                    continue

                poi_set.add(pid)
                loc = p["geometry"]["location"]

                poi_coords.append({
                    "lat": loc["lat"],
                    "lon": loc["lng"],
                    "type": poi,
                    "signal": "negative"
                })
                negative_count += 1

    lighting_score = route_lighting_score(coords)

    return jsonify({
        "positive_poi_count": positive_count,
        "negative_poi_count": negative_count,
        "poi_coords": poi_coords,
        "lighting_score": lighting_score
    })

# -------------------------------
# Run
# -------------------------------
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
