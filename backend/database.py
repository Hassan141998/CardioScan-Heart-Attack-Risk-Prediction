import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def create_tables():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS heart_predictions (
            id SERIAL PRIMARY KEY,
            age INTEGER,
            sex INTEGER,
            cp INTEGER,
            trestbps INTEGER,
            chol INTEGER,
            fbs INTEGER,
            restecg INTEGER,
            thalach INTEGER,
            exang INTEGER,
            oldpeak FLOAT,
            slope INTEGER,
            ca INTEGER,
            thal INTEGER,
            risk_score FLOAT,
            risk_level VARCHAR(20),
            xgb_prob FLOAT,
            rf_prob FLOAT,
            knn_prob FLOAT,
            xgb_prediction INTEGER,
            rf_prediction INTEGER,
            knn_prediction INTEGER,
            ensemble_prediction INTEGER,
            recommendation TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS model_metrics (
            id SERIAL PRIMARY KEY,
            model_name VARCHAR(50),
            accuracy FLOAT,
            f1_score FLOAT,
            roc_auc FLOAT,
            precision_score FLOAT,
            recall_score FLOAT,
            updated_at TIMESTAMP DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_predictions_created_at 
            ON heart_predictions(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_predictions_risk_level 
            ON heart_predictions(risk_level);
    """)
    conn.commit()
    cur.close()
    conn.close()
