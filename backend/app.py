from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import find_safe_route

app = FastAPI()

# 🚨 VERY IMPORTANT FOR FRONTEND
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5500", "http://localhost:5500"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Safe Route Optimizer API is running"}

@app.get("/route")
def get_route(start: str, end: str):
    route = find_safe_route(start, end)
    return {"route": route}
