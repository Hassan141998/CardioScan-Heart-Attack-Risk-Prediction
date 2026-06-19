from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime


class HeartInput(BaseModel):
    age: int = Field(..., ge=20, le=100, description="Age in years")
    sex: int = Field(..., ge=0, le=1, description="0=Female, 1=Male")
    cp: int = Field(..., ge=0, le=3, description="Chest pain type 0-3")
    trestbps: int = Field(..., ge=80, le=200, description="Resting blood pressure mmHg")
    chol: int = Field(..., ge=100, le=600, description="Serum cholesterol mg/dl")
    fbs: int = Field(..., ge=0, le=1, description="Fasting blood sugar >120mg/dl")
    restecg: int = Field(..., ge=0, le=2, description="Resting ECG results")
    thalach: int = Field(..., ge=60, le=220, description="Maximum heart rate achieved")
    exang: int = Field(..., ge=0, le=1, description="Exercise induced angina")
    oldpeak: float = Field(..., ge=0.0, le=10.0, description="ST depression")
    slope: int = Field(..., ge=0, le=2, description="Slope of peak exercise ST")
    ca: int = Field(..., ge=0, le=4, description="Major vessels colored by flourosopy")
    thal: int = Field(..., ge=0, le=3, description="Thal: 0=normal, 1=fixed defect, 2=reversable defect")


class ModelResult(BaseModel):
    model_name: str
    probability: float
    prediction: int
    accuracy: float
    f1_score: float
    roc_auc: float


class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str
    risk_percentage: float
    model_results: List[ModelResult]
    recommendation: str
    doctor_referral: bool
    feature_importance: dict
    prediction_id: int


class HistoryItem(BaseModel):
    id: int
    age: int
    sex: int
    cp: int
    trestbps: int
    chol: int
    risk_score: float
    risk_level: str
    created_at: datetime


class SimulatorRequest(BaseModel):
    base_input: HeartInput
    modified_field: str
    modified_value: float


class SimulatorResponse(BaseModel):
    original_risk: float
    new_risk: float
    risk_delta: float
    risk_level: str
    insight: str
