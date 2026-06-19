from fastapi import APIRouter, HTTPException
from schemas import HeartInput, PredictionResponse
from services.ml_service import predict_risk
from database import get_connection
import traceback

router = APIRouter()


@router.post("/heart-predict", response_model=PredictionResponse)
async def predict_heart_risk(data: HeartInput):
    try:
        features = data.model_dump()
        result = predict_risk(features)

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO heart_predictions 
            (age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal,
             risk_score, risk_level, xgb_prob, rf_prob, knn_prob,
             xgb_prediction, rf_prediction, knn_prediction, ensemble_prediction, recommendation)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
        """, (
            features["age"], features["sex"], features["cp"], features["trestbps"],
            features["chol"], features["fbs"], features["restecg"], features["thalach"],
            features["exang"], features["oldpeak"], features["slope"], features["ca"], features["thal"],
            result["risk_score"], result["risk_level"],
            result["xgb_prob"], result["rf_prob"], result["knn_prob"],
            result["xgb_prediction"], result["rf_prediction"], result["knn_prediction"],
            result["ensemble_prediction"], result["recommendation"]
        ))
        prediction_id = cur.fetchone()["id"]
        conn.commit()
        cur.close()
        conn.close()

        return PredictionResponse(
            risk_score=result["risk_score"],
            risk_level=result["risk_level"],
            risk_percentage=result["risk_percentage"],
            model_results=result["model_results"],
            recommendation=result["recommendation"],
            doctor_referral=result["doctor_referral"],
            feature_importance=result["feature_importance"],
            prediction_id=prediction_id,
        )
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
