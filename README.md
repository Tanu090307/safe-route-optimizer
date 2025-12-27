# safe-route-optimizer

Safe Route Selection using Machine Learning

This project implements a safety-aware route recommendation system that ranks multiple routes between a source and destination based on environmental safety factors rather than distance or time alone.

Problem

Conventional navigation systems optimize for speed and distance but ignore personal safety, especially during night travel. This project focuses on identifying and ranking safer routes in urban environments.

Solution Overview

The system:

Generates multiple alternative routes between two locations

Removes loops and near-duplicate routes

Extracts safety-related features from each route

Uses a trained machine learning model to score route safety

Ranks routes from safest to least safe

Visualizes routes with safety-based color coding

Safety Factors Used

Positive POIs: Police stations, hospitals, ATMs, fire stations

Negative POIs: Bars, night clubs, liquor stores

Street Lighting: Night-time brightness from NASA VIIRS data

Route Length: Used for normalization

All features are normalized to a 0–1 range before inference.

Architecture

Frontend: HTML, JavaScript, Leaflet

Backend: Flask (Python)

Routing: OSRM public API

POI Data: Google Places API

Lighting Data: NASA VIIRS GeoTIFF

ML Model: RandomForest Regressor (scikit-learn)

Machine Learning Model

Input: [pos_score, neg_score, light_score]

Output: safety_score ∈ [0, 1]

Model type: Regression (not classification) to allow continuous safety ranking

Training data: Synthetic but realistic urban route data

Safety Classification
Safety Score	Category
≥ 0.60	Safe
0.33 – 0.59	Moderate
< 0.33	Unsafe
APIs Used
Google Cloud APIs (billing required)

Maps JavaScript API

Places API

External APIs

OSRM Routing API (public)

Offline Data

NASA VIIRS Night-Time Lights (GeoTIFF)

How to Run
Backend
pip install flask flask-cors googlemaps rasterio numpy joblib scikit-learn
python app.py


Backend runs on http://localhost:5000.

Frontend

Open index.html in a browser and provide source, destination, and transport mode.

Features

Multiple route generation

Route de-duplication

Safety-based ranking

Color-coded route visualization

Per-route feature breakdown

Deterministic, explainable ML output

Limitations

Dependent on Google Places API quotas

VIIRS lighting resolution (~500 m)

OSRM public routing constraints