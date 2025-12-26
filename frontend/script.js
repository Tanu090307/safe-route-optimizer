async function getRoute() {
  const response = await fetch(
    "http://127.0.0.1:8000/route?start=A&end=B"
  );
  const data = await response.json();

  document.getElementById("output").innerText =
    JSON.stringify(data, null, 2);
}
