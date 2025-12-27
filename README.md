# Safe Route Selection Using Machine Learning

A safety-aware route recommendation system that ranks multiple routes between a source and destination based on environmental and contextual safety factors, rather than distance or travel time alone.

---

## Problem Statement

Traditional navigation systems optimize for speed and distance but ignore personal safety, especially during night travel. This project aims to identify and recommend safer routes in urban environments using real-world data and machine learning.

---

## Solution Overview

The system performs the following steps:

1. Generates multiple alternative routes between source and destination  
2. Removes closed loops and near-duplicate routes  
3. Extracts safety-related features from each route  
4. Uses a trained ML model to predict a safety score  
5. Ranks routes from safest to least safe  
6. Visualizes routes with safety-based color coding  

---

## Safety Factors Considered

- **Positive POIs**  
  Police stations, hospitals, fire stations, ATMs, gas stations  

- **Negative POIs**  
  Bars, night clubs, liquor stores  

- **Street Lighting**  
  Night-time brightness from NASA VIIRS satellite data  

- **Route Length**  
  Used for normalization of POI density  

All features are normalized to the range **0–1**.

---

## System Architecture

**Frontend**
- HTML, JavaScript
- Leaflet for map visualization
- Google Places Autocomplete

**Backend**
- Flask (Python)
- Feature extraction and ML inference

**Routing**
- OSRM public routing API

**Machine Learning**
- RandomForest Regressor (scikit-learn)

---

## Machine Learning Model

- **Input Features**
[pos_score, neg_score, light_score]

- **Output**
safety_score ∈ [0, 1]


- **Model Type**
Regression (continuous scoring for ranking)

- **Training Data**
Synthetic but realistic urban route data

---

## Safety Classification

| Safety Score | Category  | Color  |
|-------------|-----------|--------|
| ≥ 0.66      | Safe      | Green  |
| 0.33–0.66   | Moderate  | Orange |
| < 0.33      | Unsafe    | Red    |

---

## APIs and Data Sources

### Google Cloud APIs (Billing Required)
- Maps JavaScript API
- Places API

### External APIs
- OSRM Routing API (public)

### Offline Datasets
- NASA VIIRS Night-Time Lights (GeoTIFF)

---
