let sourceCoords = null;
let destinationCoords = null;
let osrmRoutes = [];
let map, routeLayer = null;
let poiLayer = null;

// -------------------------------
// MAP INIT
// -------------------------------
function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
}

function resetScoreBox() {
  document.getElementById("poiScoreBox").textContent =
    "POS POI: --\nNEG POI: --\nLIGHT : --";
}

// -------------------------------
// RESET EVERYTHING
// -------------------------------
function resetRoutes() {
  osrmRoutes = [];
  document.getElementById("routes").innerHTML = "";
  document.getElementById("routeCoordsBox").textContent = "";
  document.getElementById("streetLightBox").textContent = "";
  resetScoreBox();

  if (routeLayer) map.removeLayer(routeLayer);
  if (poiLayer) map.removeLayer(poiLayer);

  routeLayer = null;
  poiLayer = null;
}

// -------------------------------
// WAYPOINTS
// -------------------------------
function generateWaypoints(src, dst) {
  const mlat = (src.lat + dst.lat) / 2;
  const mlon = (src.lon + dst.lon) / 2;
  const o = 0.003;

  return [
    null,
    { lat: mlat + o, lon: mlon },
    { lat: mlat - o, lon: mlon },
    { lat: mlat, lon: mlon + o },
    { lat: mlat, lon: mlon - o }
  ];
}

// -------------------------------
// REMOVE LOOPS
// -------------------------------
function removeClosedLoops(coords) {
  const seen = new Map();
  const clean = [];

  for (let c of coords) {
    const key = `${c[0].toFixed(6)},${c[1].toFixed(6)}`;
    if (seen.has(key)) clean.splice(seen.get(key));
    seen.set(key, clean.length);
    clean.push(c);
  }
  return clean;
}

// -------------------------------
// NORMALIZE ROUTE
// -------------------------------
function normalizeRoute(coords) {
  const step = Math.max(1, Math.floor(coords.length / 25));
  return coords
    .filter((_, i) => i % step === 0)
    .map(c => `${c[0].toFixed(4)},${c[1].toFixed(4)}`)
    .join("|");
}

// -------------------------------
// AUTOCOMPLETE
// -------------------------------
function initAutocomplete() {
  initMap();

  const s = new google.maps.places.Autocomplete(document.getElementById("source"));
  const d = new google.maps.places.Autocomplete(document.getElementById("destination"));

  s.addListener("place_changed", () => {
    const p = s.getPlace();
    if (!p.geometry) return;
    sourceCoords = { lat: p.geometry.location.lat(), lon: p.geometry.location.lng() };
    fetchRoutesFromOSRM();
  });

  d.addListener("place_changed", () => {
    const p = d.getPlace();
    if (!p.geometry) return;
    destinationCoords = { lat: p.geometry.location.lat(), lon: p.geometry.location.lng() };
    fetchRoutesFromOSRM();
  });

  document.getElementById("mode").addEventListener("change", fetchRoutesFromOSRM);
}

window.initAutocomplete = initAutocomplete;

// -------------------------------
// FETCH ROUTES
// -------------------------------
function fetchRoutesFromOSRM() {
  if (!sourceCoords || !destinationCoords) return;

  resetRoutes();

  const mode = document.getElementById("mode").value;
  const waypoints = generateWaypoints(sourceCoords, destinationCoords);
  const seenShapes = new Set();

  waypoints.forEach(wp => {
    const url = wp
      ? `https://router.project-osrm.org/route/v1/${mode}/${sourceCoords.lon},${sourceCoords.lat};${wp.lon},${wp.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=full&geometries=geojson`
      : `https://router.project-osrm.org/route/v1/${mode}/${sourceCoords.lon},${sourceCoords.lat};${destinationCoords.lon},${destinationCoords.lat}?overview=full&geometries=geojson`;

    fetch(url)
      .then(r => r.json())
      .then(d => {
        if (!d.routes?.length) return;

        const coords = removeClosedLoops(d.routes[0].geometry.coordinates);
        const sig = normalizeRoute(coords);

        if (seenShapes.has(sig)) return;
        seenShapes.add(sig);

        osrmRoutes.push({
          coords,
          distance: d.routes[0].distance
        });

        displayRouteButtons();
      });
  });
}

// -------------------------------
// ROUTE BUTTONS
// -------------------------------
function displayRouteButtons() {
  const div = document.getElementById("routes");
  div.innerHTML = "<b>Select a route:</b><br>";

  osrmRoutes.forEach((_, i) => {
    const b = document.createElement("button");
    b.textContent = `Route ${i + 1}`;
    b.onclick = () => drawRoute(i);
    div.appendChild(b);
  });
}

// -------------------------------
// DRAW ROUTE + POI + LIGHT
// -------------------------------
function drawRoute(i) {
  const r = osrmRoutes[i];
  const latlngs = r.coords.map(c => [c[1], c[0]]);

  if (routeLayer) map.removeLayer(routeLayer);
  if (poiLayer) map.removeLayer(poiLayer);

  poiLayer = L.layerGroup().addTo(map);

  routeLayer = L.polyline(latlngs, { color: "blue", weight: 5 }).addTo(map);
  map.fitBounds(routeLayer.getBounds());

  document.getElementById("routeCoordsBox").textContent =
    `Route ${i + 1} Coordinates\n\n` +
    latlngs.map((p, idx) => `${idx + 1}. ${p[0]}, ${p[1]}`).join("\n");

  document.getElementById("streetLightBox").textContent =
    "Fetching POI + lighting data...";

  fetch("http://localhost:5000/analyze_route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ coords: latlngs })
  })
  .then(res => res.json())
  .then(data => {
    const routeKm = r.distance / 1000;

    const posNorm = Math.min(1, data.positive_poi_count / (routeKm * 5));
    const negNorm = Math.min(1, data.negative_poi_count / (routeKm * 5));

    document.getElementById("poiScoreBox").textContent =
      `POS POI: ${posNorm.toFixed(2)}\n` +
      `NEG POI: ${negNorm.toFixed(2)}\n` +
      `LIGHT : ${data.lighting_score.toFixed(2)}`;

    document.getElementById("streetLightBox").textContent =
      `SUMMARY\nPositive: ${data.positive_poi_count}\nNegative: ${data.negative_poi_count}`;
  });
}
