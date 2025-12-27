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
