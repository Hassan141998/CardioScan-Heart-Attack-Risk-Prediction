from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

load_dotenv()

from database import create_tables
from routers import predict, history, stats, simulator

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(
    title="CardioScan API",
    description="Heart Attack Risk Prediction API powered by XGBoost + Random Forest + KNN Ensemble",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(history.router, prefix="/api", tags=["History"])
app.include_router(stats.router, prefix="/api", tags=["Statistics"])
app.include_router(simulator.router, prefix="/api", tags=["Simulator"])

@app.get("/")
async def root():
    return {
        "app": "CardioScan",
        "version": "2.0.0",
        "status": "operational",
        "endpoints": ["/api/heart-predict", "/api/history", "/api/stats", "/api/simulate"]
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}
