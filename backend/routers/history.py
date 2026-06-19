from fastapi import APIRouter, Query, HTTPException
from database import get_connection
from typing import Optional

router = APIRouter()


@router.get("/history")
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    risk_level: Optional[str] = Query(None),
    search_age: Optional[int] = Query(None),
    sort_by: str = Query("created_at"),
    order: str = Query("desc"),
):
    try:
        conn = get_connection()
        cur = conn.cursor()

        allowed_sort = ["created_at", "risk_score", "age"]
        if sort_by not in allowed_sort:
            sort_by = "created_at"
        order = "DESC" if order.lower() == "desc" else "ASC"

        conditions = []
        params = []

        if risk_level:
            conditions.append("risk_level = %s")
            params.append(risk_level.upper())
        if search_age:
            conditions.append("age = %s")
            params.append(search_age)

        where = f"WHERE {' AND '.join(conditions)}" if conditions else ""

        cur.execute(f"""
            SELECT id, age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang,
                   oldpeak, slope, ca, thal, risk_score, risk_level, 
                   xgb_prob, rf_prob, knn_prob, recommendation, created_at
            FROM heart_predictions
            {where}
            ORDER BY {sort_by} {order}
            LIMIT %s OFFSET %s
        """, params + [limit, offset])

        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) as total FROM heart_predictions {where}", params)
        total = cur.fetchone()["total"]

        cur.close()
        conn.close()

        return {
            "data": [dict(r) for r in rows],
            "total": total,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{prediction_id}")
async def delete_prediction(prediction_id: int):
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM heart_predictions WHERE id = %s", (prediction_id,))
        conn.commit()
        cur.close()
        conn.close()
        return {"message": "Deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
