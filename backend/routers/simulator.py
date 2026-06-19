from fastapi import APIRouter, HTTPException
from schemas import SimulatorRequest, SimulatorResponse
from services.ml_service import predict_risk

router = APIRouter()

FIELD_INSIGHTS = {
    "age": "Age is a major non-modifiable risk factor. Every 10-year increase raises risk significantly.",
    "chol": "Reducing cholesterol by 40mg/dl can lower heart disease risk by up to 25%.",
    "trestbps": "Lowering systolic BP by 10mmHg reduces cardiovascular events by ~20%.",
    "thalach": "Higher maximum heart rate during exercise indicates better cardiovascular fitness.",
    "oldpeak": "Lower ST depression values indicate healthier cardiac response to exercise.",
    "ca": "Fewer blocked vessels correlates strongly with reduced heart disease risk.",
    "cp": "Chest pain type is a key diagnostic indicator — asymptomatic can be deceptive.",
    "exang": "Exercise-induced angina is a strong predictor of coronary artery disease.",
    "thal": "Thalassemia type significantly influences oxygen delivery to cardiac tissue.",
    "slope": "The slope of peak exercise ST segment reflects cardiac stress response.",
    "fbs": "Elevated fasting blood sugar indicates diabetes risk, compounding cardiac risk.",
    "restecg": "ECG abnormalities at rest can reveal pre-existing cardiac conditions.",
    "sex": "Biological sex influences hormonal risk factors and symptom presentation.",
}


@router.post("/simulate", response_model=SimulatorResponse)
async def simulate_what_if(data: SimulatorRequest):
    try:
        original_features = data.base_input.model_dump()
        original_result = predict_risk(original_features)

        modified_features = original_features.copy()
        modified_features[data.modified_field] = data.modified_value
        modified_result = predict_risk(modified_features)

        delta = modified_result["risk_score"] - original_result["risk_score"]
        insight = FIELD_INSIGHTS.get(
            data.modified_field,
            f"Adjusting {data.modified_field} has a measurable impact on your predicted risk."
        )

        return SimulatorResponse(
            original_risk=original_result["risk_score"],
            new_risk=modified_result["risk_score"],
            risk_delta=round(delta, 2),
            risk_level=modified_result["risk_level"],
            insight=insight,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
