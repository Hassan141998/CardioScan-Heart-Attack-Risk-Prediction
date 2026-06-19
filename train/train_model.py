"""
CardioScan Model Training Script
Cleveland Heart Disease Dataset (UCI)
Trains XGBoost + RandomForest + KNN ensemble
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    precision_score, recall_score, classification_report, confusion_matrix
)
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier
import joblib
import os
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

MODELS_DIR = Path(__file__).parent.parent / "models"
MODELS_DIR.mkdir(exist_ok=True)

FEATURE_NAMES = [
    "age", "sex", "cp", "trestbps", "chol",
    "fbs", "restecg", "thalach", "exang",
    "oldpeak", "slope", "ca", "thal"
]

CLEVELAND_URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"


def load_data():
    columns = FEATURE_NAMES + ["target"]
    try:
        df = pd.read_csv(CLEVELAND_URL, header=None, names=columns, na_values="?")
        print(f"✓ Loaded Cleveland dataset: {len(df)} rows")
    except Exception:
        print("⚠ Could not fetch online data, generating synthetic dataset...")
        np.random.seed(42)
        n = 303
        df = pd.DataFrame({
            "age": np.random.randint(29, 77, n),
            "sex": np.random.randint(0, 2, n),
            "cp": np.random.randint(0, 4, n),
            "trestbps": np.random.randint(94, 200, n),
            "chol": np.random.randint(126, 564, n),
            "fbs": np.random.randint(0, 2, n),
            "restecg": np.random.randint(0, 3, n),
            "thalach": np.random.randint(71, 202, n),
            "exang": np.random.randint(0, 2, n),
            "oldpeak": np.round(np.random.uniform(0, 6.2, n), 1),
            "slope": np.random.randint(0, 3, n),
            "ca": np.random.randint(0, 4, n),
            "thal": np.random.randint(0, 4, n),
            "target": np.random.randint(0, 2, n),
        })
    return df


def preprocess(df):
    df = df.copy()
    df.dropna(inplace=True)
    df["target"] = (df["target"] > 0).astype(int)
    # Encode thal: map 3->0 (normal), 6->1 (fixed), 7->2 (reversable)
    thal_map = {3: 0, 6: 1, 7: 2, 0: 0, 1: 1, 2: 2}
    df["thal"] = df["thal"].map(lambda x: thal_map.get(x, 0))
    X = df[FEATURE_NAMES].values
    y = df["target"].values
    return X, y


def evaluate_model(model, X_test, y_test, name):
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]
    metrics = {
        "accuracy": accuracy_score(y_test, y_pred),
        "f1_score": f1_score(y_test, y_pred),
        "roc_auc": roc_auc_score(y_test, y_prob),
        "precision": precision_score(y_test, y_pred),
        "recall": recall_score(y_test, y_pred),
    }
    print(f"\n{'='*40}")
    print(f"  {name} Results")
    print(f"{'='*40}")
    for k, v in metrics.items():
        print(f"  {k:12}: {v:.4f}")
    print(classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))
    return metrics


def train():
    print("\n🫀 CardioScan Model Training\n" + "="*40)
    df = load_data()
    X, y = preprocess(df)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"Train: {len(X_train)}, Test: {len(X_test)}")
    print(f"Class distribution — 0: {(y==0).sum()}, 1: {(y==1).sum()}")

    # XGBoost
    print("\n[1/3] Training XGBoost...")
    xgb = XGBClassifier(
        n_estimators=300, max_depth=4, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8,
        use_label_encoder=False, eval_metric="logloss", random_state=42
    )
    xgb.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)
    xgb_metrics = evaluate_model(xgb, X_test, y_test, "XGBoost")
    joblib.dump(xgb, MODELS_DIR / "cardio_xgb.pkl")
    print(f"  ✓ Saved cardio_xgb.pkl")

    # Random Forest
    print("\n[2/3] Training Random Forest...")
    rf = RandomForestClassifier(
        n_estimators=300, max_depth=10, min_samples_split=4,
        min_samples_leaf=2, max_features="sqrt", random_state=42, n_jobs=-1
    )
    rf.fit(X_train, y_train)
    rf_metrics = evaluate_model(rf, X_test, y_test, "Random Forest")
    joblib.dump(rf, MODELS_DIR / "cardio_rf.pkl")
    print(f"  ✓ Saved cardio_rf.pkl")

    # KNN with scaling
    print("\n[3/3] Training KNN...")
    knn_pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("knn", KNeighborsClassifier(n_neighbors=7, weights="distance", metric="minkowski"))
    ])
    knn_pipeline.fit(X_train, y_train)
    knn_metrics = evaluate_model(knn_pipeline, X_test, y_test, "KNN")
    joblib.dump(knn_pipeline, MODELS_DIR / "cardio_knn.pkl")
    print(f"  ✓ Saved cardio_knn.pkl")

    print("\n" + "="*40)
    print("  ENSEMBLE SUMMARY")
    print("="*40)
    models = [xgb, rf, knn_pipeline]
    names = ["XGBoost", "RandomForest", "KNN"]
    ensemble_probs = np.mean([m.predict_proba(X_test)[:, 1] for m in models], axis=0)
    ensemble_pred = (ensemble_probs >= 0.5).astype(int)
    print(f"  Ensemble Accuracy: {accuracy_score(y_test, ensemble_pred):.4f}")
    print(f"  Ensemble F1:       {f1_score(y_test, ensemble_pred):.4f}")
    print(f"  Ensemble ROC-AUC:  {roc_auc_score(y_test, ensemble_probs):.4f}")
    print("\n✅ Training complete. Models saved to /models/")


if __name__ == "__main__":
    train()
