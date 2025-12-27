let sourceCoords = null;
let destinationCoords = null;

let routes = [];
let map;
let activeRouteLayer = null;

/* ================= DEBUG ================= */
function log(msg) {
  const box = document.getElementById("debugBox");
  box.textContent += msg + "\n";
  box.scrollTop = box.scrollHeight;
}

/* ================= MAP ================= */
function initMap() {
  map = L.map("map").setView([20.5937, 78.9629], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);
  log("🗺 Map initialized");
}

function updateScoreBox(route) {
  document.getElementById("poiScoreBox").textContent =
    `POS POI: ${route.features.pos_score.toFixed(2)}\n` +
    `NEG POI: ${route.features.neg_score.toFixed(2)}\n` +
    `LIGHT : ${route.features.light_score.toFixed(2)}\n` +
    `SAFE  : ${route.safety_score.toFixed(2)}`;
}

/* ================= AUTOCOMPLETE ================= */
function initAutocomplete() {
  initMap();

  const s = new google.maps.places.Autocomplete(document.getElementById("source"));
  const d = new google.maps.places.Autocomplete(document.getElementById("destination"));

  s.addListener("place_changed", () => {
    const p = s.getPlace();
    if (!p.geometry) return;
    sourceCoords = { lat: p.geometry.location.lat(), lon: p.geometry.location.lng() };
    log("📍 Source selected");
    fetchAllRoutes();
  });

  d.addListener("place_changed", () => {
    const p = d.getPlace();
    if (!p.geometry) return;
    destinationCoords = { lat: p.geometry.location.lat(), lon: p.geometry.location.lng() };
    log("🏁 Destination selected");
    fetchAllRoutes();
  });

  document.getElementById("mode").addEventListener("change", () => {
    log("🔁 Mode changed");
    fetchAllRoutes();
  });
}

/* ================= RESET ================= */
function resetAll() {
  routes = [];
  document.getElementById("routeList").innerHTML = "";
  document.getElementById("debugBox").textContent = "";

  if (activeRouteLayer) {
    map.removeLayer(activeRouteLayer);
    activeRouteLayer = null;
  }
}

/* ================= WAYPOINT OFFSETS ================= */
function generateWaypoints(src, dst) {
  const mlat = (src.lat + dst.lat) / 2;
  const mlon = (src.lon + dst.lon) / 2;
  const o = 0.004; // ~400m offset

  return [
    null,
    { lat: mlat + o, lon: mlon },
    { lat: mlat - o, lon: mlon },
    { lat: mlat, lon: mlon + o },
    { lat: mlat, lon: mlon - o }
  ];
}

/* ================= FETCH ROUTES ================= */
async function fetchAllRoutes() {
  if (!sourceCoords || !destinationCoords) return;

  resetAll();
  log("🔄 Forcing multiple routes using waypoint offsets...");

  const mode = document.getElementById("mode").value;
  const waypoints = generateWaypoints(sourceCoords, destinationCoords);
  const seen = new Set();

  for (let i = 0; i < waypoints.length; i++) {
    const wp = waypoints[i];

    const url = wp
      ? `https://router.project-osrm.org/route/v1/${mode}/` +
        `${sourceCoords.lon},${sourceCoords.lat};` +
        `${wp.lon},${wp.lat};` +
        `${destinationCoords.lon},${destinationCoords.lat}` +
        `?overview=full&geometries=geojson`
      : `https://router.project-osrm.org/route/v1/${mode}/` +
        `${sourceCoords.lon},${sourceCoords.lat};` +
        `${destinationCoords.lon},${destinationCoords.lat}` +
        `?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) continue;

    const coords = data.routes[0].geometry.coordinates;
    const sig = coords.length + "_" + coords[0][0].toFixed(4);

    if (seen.has(sig)) {
      log("⚠ Duplicate route skipped");
      continue;
    }

    seen.add(sig);

    routes.push({
      index: routes.length,
      coords,
      distance: data.routes[0].distance
    });

    log(`✅ Route ${routes.length} forced`);
  }

  if (!routes.length) {
    log("❌ No routes generated");
    return;
  }

  await extractFeaturesSequential();
  await runML();
  renderButtons();
}

/* ================= FEATURE EXTRACTION ================= */
async function extractFeaturesSequential() {
  log("🔍 Extracting route features...");

  for (let i = 0; i < routes.length; i++) {
    const r = routes[i];
    const latlngs = r.coords.map(c => [c[1], c[0]]);

    const res = await fetch("http://localhost:5000/analyze_route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coords: latlngs })
    });

    const data = await res.json();
    const km = r.distance / 1000;

    const pos = 1 - Math.exp(-(data.positive_poi_count / km) / 6);
    const neg = 1 - Math.exp(-(data.negative_poi_count / km) / 5);

    r.features = {
      pos_score: Math.min(1, pos),
      neg_score: Math.min(1, neg),
      light_score: data.lighting_score
    };

    log(
      `📊 Route ${i + 1} → POS:${r.features.pos_score.toFixed(2)} ` +
      `NEG:${r.features.neg_score.toFixed(2)} ` +
      `LIGHT:${r.features.light_score.toFixed(2)}`
    );
  }
}

/* ================= ML ================= */
async function runML() {
  log("🧠 Running ML safety model...");

  const res = await fetch("http://localhost:5000/predict_routes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      routes: routes.map(r => ({
        index: r.index,
        ...r.features
      }))
    })
  });

  const ranked = await res.json();

  ranked.forEach(r => {
    routes[r.index].safety_score = r.safety_score;
  });

  routes.sort((a, b) => b.safety_score - a.safety_score);
}

/* ================= UI ================= */
function routeColor(score) {
  if (score >= 0.6) return "green";
  if (score >= 0.33) return "orange";
  return "red";
}

function renderButtons() {
  log("🎨 Routes ready for selection");

  const list = document.getElementById("routeList");
  list.innerHTML = "";

  routes.forEach((r, i) => {
    const btn = document.createElement("button");
    btn.textContent =
      `Route ${i + 1} → ${routeColor(r.safety_score).toUpperCase()} (${r.safety_score.toFixed(2)})`;

    btn.onclick = () => drawRoute(r);
    list.appendChild(btn);
  });
}

/* ================= DRAW ================= */
function drawRoute(route) {
  if (activeRouteLayer) map.removeLayer(activeRouteLayer);

  activeRouteLayer = L.polyline(
    route.coords.map(c => [c[1], c[0]]),
    { color: routeColor(route.safety_score), weight: 7 }
  ).addTo(map);

  map.fitBounds(activeRouteLayer.getBounds());
  updateScoreBox(route);

  log(`🗺 Displayed Route ${route.index + 1}`);
}

window.initAutocomplete = initAutocomplete;
