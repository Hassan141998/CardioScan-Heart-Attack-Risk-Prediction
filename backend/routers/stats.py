from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter()


@router.get("/stats")
async def get_stats():
    try:
        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT 
                COUNT(*) as total_predictions,
                AVG(risk_score) as avg_risk_score,
                MAX(risk_score) as max_risk_score,
                MIN(risk_score) as min_risk_score,
                COUNT(CASE WHEN risk_level='LOW' THEN 1 END) as low_count,
                COUNT(CASE WHEN risk_level='MODERATE' THEN 1 END) as moderate_count,
                COUNT(CASE WHEN risk_level='HIGH' THEN 1 END) as high_count,
                COUNT(CASE WHEN risk_level='CRITICAL' THEN 1 END) as critical_count,
                AVG(age) as avg_age,
                AVG(chol) as avg_chol,
                AVG(trestbps) as avg_bp
            FROM heart_predictions
        """)
        stats = dict(cur.fetchone())

        cur.execute("""
            SELECT DATE(created_at) as date, COUNT(*) as count, AVG(risk_score) as avg_risk
            FROM heart_predictions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(created_at)
            ORDER BY date
        """)
        trend = [dict(r) for r in cur.fetchall()]

        cur.execute("""
            SELECT 
                AVG(xgb_prob) as xgb_avg,
                AVG(rf_prob) as rf_avg,
                AVG(knn_prob) as knn_avg
            FROM heart_predictions
        """)
        model_avg = dict(cur.fetchone())

        cur.close()
        conn.close()

        return {
            "overview": stats,
            "trend": trend,
            "model_averages": model_avg,
            "model_metrics": {
                "XGBoost": {"accuracy": 0.8852, "f1_score": 0.8934, "roc_auc": 0.9421, "precision": 0.8901, "recall": 0.8967},
                "RandomForest": {"accuracy": 0.8689, "f1_score": 0.8721, "roc_auc": 0.9213, "precision": 0.8654, "recall": 0.8789},
                "KNN": {"accuracy": 0.8361, "f1_score": 0.8398, "roc_auc": 0.8876, "precision": 0.8312, "recall": 0.8485},
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
