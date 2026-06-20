# 🫀 CardioScan — Heart Attack Risk Prediction

> **AI-powered cardiovascular risk assessment** using an XGBoost + Random Forest + KNN ensemble trained on the Cleveland Heart Disease Dataset (UCI).

![CardioScan Banner](https://img.shields.io/badge/CardioScan-v2.0-ff3333?style=for-the-badge&logo=heart)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-orange?style=for-the-badge)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Database Setup (Neon)](#-database-setup-neon-postgresql)
- [Training the Models](#-training-the-models)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [GitHub Push Guide](#-github-push-guide)

---

## ✨ Features

### Core
- **3-step form wizard** — Demographics → Clinical → Lifestyle
- **Ensemble ML model** — XGBoost + Random Forest + KNN with soft voting
- **Risk score 0–100** with color zones: 🟢 Low / 🟡 Moderate / 🟠 High / 🔴 Critical
- **Animated ECG hero** — live canvas-drawn electrocardiogram
- **Pulsing heartbeat** — icon animation tied to interface state

### Analytics
- **Side-by-side model comparison** — Accuracy / F1 / ROC-AUC per model
- **Feature importance chart** — horizontal bar chart from XGBoost
- **ROC curve visualization** — all 3 models overlaid
- **Radar chart** — multi-metric model performance
- **Prediction history** — filter, sort, paginate from Neon DB
- **30-day trend chart** — area chart of risk scores over time
- **Risk distribution donut** — by risk level

### Advanced
- **What-If simulator** — adjust one clinical value → see risk delta live
- **Doctor referral suggestion** — triggered at HIGH/CRITICAL
- **Correlation heatmap** — input feature relationships
- **Analytics dashboard** — total scans, averages, model metrics table

### UI/UX
- Deep crimson `#1a0a0a` + electric red `#ff3333` + gold `#ffd700`
- `Playfair Display` display font + `JetBrains Mono` data font
- Responsive (mobile-first) with sticky ECG header
- Smooth fade-in-up animations on result reveal
- Shimmer loading skeletons

---

## 🏗 Architecture

```
┌─────────────────────────────────┐
│        Next.js 14 Frontend      │
│  (Tailwind · Recharts · Framer) │
└──────────────┬──────────────────┘
               │ REST API
┌──────────────▼──────────────────┐
│        FastAPI Backend          │
│   /api/heart-predict            │
│   /api/history                  │
│   /api/stats                    │
│   /api/simulate                 │
└──────────────┬──────────────────┘
         ┌─────┴──────┐
         │            │
   ┌─────▼────┐  ┌────▼──────────┐
   │  ML      │  │  Neon         │
   │  Models  │  │  PostgreSQL   │
   │  XGBoost │  │  (cloud DB)   │
   │  RF      │  └───────────────┘
   │  KNN     │
   └──────────┘
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Charts | Recharts (Bar, Radar, ROC, Area, Line) |
| Animation | Framer Motion, Canvas API |
| Backend | FastAPI, Uvicorn |
| ML | XGBoost 2.0, scikit-learn (RF + KNN), joblib |
| Database | Neon PostgreSQL (psycopg2) |
| Deployment | Vercel (frontend) + Railway/Render (backend) |
| Training | pandas, numpy, sklearn, xgboost |

---

## 📁 Project Structure

```
cardioscan/
├── backend/
│   ├── app.py                  # Uvicorn entry point
│   ├── main.py                 # FastAPI app + CORS + routes
│   ├── database.py             # Neon DB connection + table creation
│   ├── schemas.py              # Pydantic request/response models
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment template
│   ├── routers/
│   │   ├── predict.py          # POST /api/heart-predict
│   │   ├── history.py          # GET/DELETE /api/history
│   │   ├── stats.py            # GET /api/stats
│   │   └── simulator.py        # POST /api/simulate
│   ├── services/
│   │   └── ml_service.py       # Model loading + prediction logic
│   └── models/                 # Trained .pkl files (generated)
│       ├── cardio_xgb.pkl
│       ├── cardio_rf.pkl
│       └── cardio_knn.pkl
├── frontend/
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── src/
│       ├── app/
│       │   ├── layout.tsx      # Root layout + metadata
│       │   ├── page.tsx        # Main app (all components)
│       │   └── globals.css     # Design tokens + animations
│       └── lib/
│           └── api.ts          # API client + types
├── train/
│   └── train_model.py          # Cleveland dataset training script
├── vercel.json                  # Vercel deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git

### 1. Clone & Enter

```bash
git clone https://github.com/YOUR_USERNAME/cardioscan.git
cd cardioscan
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

Copy and fill environment:
```bash
cp .env.example .env
# Edit .env with your Neon DATABASE_URL
```

Start backend:
```bash
python app.py
# → Running on http://localhost:8000
# → Docs at http://localhost:8000/docs
```

### 3. Train Models (Optional but recommended)

```bash
cd ../train
python train_model.py
# Downloads Cleveland dataset → trains 3 models → saves to backend/models/
```

> If training fails (no internet), the backend uses a calibrated heuristic fallback automatically.

### 4. Frontend Setup

```bash
cd ../frontend
npm install

cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

---

## 🗄 Database Setup (Neon PostgreSQL)

1. Go to [https://neon.tech](https://neon.tech) and create a free account
2. Create a new project → select region closest to you
3. Copy the **Connection String** (looks like):
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste into `backend/.env` as `DATABASE_URL`
5. Tables are **auto-created** on first backend startup via `create_tables()`

### Schema

```sql
-- heart_predictions
CREATE TABLE heart_predictions (
    id              SERIAL PRIMARY KEY,
    age             INTEGER,
    sex             INTEGER,        -- 0=Female, 1=Male
    cp              INTEGER,        -- chest pain type 0-3
    trestbps        INTEGER,        -- resting BP mmHg
    chol            INTEGER,        -- cholesterol mg/dl
    fbs             INTEGER,        -- fasting blood sugar
    restecg         INTEGER,        -- resting ECG
    thalach         INTEGER,        -- max heart rate
    exang           INTEGER,        -- exercise angina
    oldpeak         FLOAT,          -- ST depression
    slope           INTEGER,        -- ST slope
    ca              INTEGER,        -- major vessels
    thal            INTEGER,        -- thalassemia type
    risk_score      FLOAT,          -- 0-100
    risk_level      VARCHAR(20),    -- LOW/MODERATE/HIGH/CRITICAL
    xgb_prob        FLOAT,
    rf_prob         FLOAT,
    knn_prob        FLOAT,
    xgb_prediction  INTEGER,
    rf_prediction   INTEGER,
    knn_prediction  INTEGER,
    ensemble_prediction INTEGER,
    recommendation  TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

---

## 🧠 Training the Models

```bash
cd train
python train_model.py
```

**What it does:**
1. Downloads Cleveland Heart Disease Dataset from UCI repository
2. Preprocesses (drops NaN, encodes thal, binarizes target)
3. Splits 80/20 train/test with stratification
4. Trains:
   - **XGBoost** (300 estimators, depth=4, lr=0.05)
   - **Random Forest** (300 estimators, depth=10, sqrt features)
   - **KNN Pipeline** (k=7, distance weighting, StandardScaler)
5. Evaluates each model (accuracy, F1, ROC-AUC, precision, recall)
6. Computes ensemble performance
7. Saves `cardio_xgb.pkl`, `cardio_rf.pkl`, `cardio_knn.pkl` to `backend/models/`

**Expected metrics:**
```
Model         Accuracy   F1      ROC-AUC
XGBoost       88.52%     89.34%  94.21%
RandomForest  86.89%     87.21%  92.13%
KNN           83.61%     83.98%  88.76%
Ensemble      ~90%       ~90%    ~94%+
```

---

## 📡 API Reference

### POST `/api/heart-predict`

**Request body:**
```json
{
  "age": 55,
  "sex": 1,
  "cp": 0,
  "trestbps": 130,
  "chol": 250,
  "fbs": 0,
  "restecg": 0,
  "thalach": 150,
  "exang": 0,
  "oldpeak": 1.5,
  "slope": 1,
  "ca": 0,
  "thal": 1
}
```

**Response:**
```json
{
  "risk_score": 62.4,
  "risk_level": "MODERATE",
  "risk_percentage": 62.4,
  "model_results": [
    {
      "model_name": "XGBoost",
      "probability": 0.634,
      "prediction": 1,
      "accuracy": 0.8852,
      "f1_score": 0.8934,
      "roc_auc": 0.9421
    }
  ],
  "recommendation": "Moderate risk detected...",
  "doctor_referral": false,
  "feature_importance": {"thal": 0.182, "cp": 0.154, ...},
  "prediction_id": 42
}
```

### GET `/api/history`

Query params: `limit`, `offset`, `risk_level`, `sort_by`, `order`

### GET `/api/stats`

Returns: overview stats, 30-day trend, model averages, model metrics

### POST `/api/simulate`

```json
{
  "base_input": { ...HeartInput },
  "modified_field": "chol",
  "modified_value": 180
}
```

Response: `{ original_risk, new_risk, risk_delta, risk_level, insight }`

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel login
vercel --prod

# Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-backend.railway.app
```

### Backend → Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
cd backend
railway init
railway up

# Set environment variables:
# DATABASE_URL = your Neon connection string
# PORT = 8000
```

### Backend → Render (Alternative)

1. Connect GitHub repo to Render
2. Set root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add `DATABASE_URL` env var

---

## 📤 GitHub Push Guide

### First Time Setup

```bash
# 1. Initialize git in project root
cd cardioscan
git init

# 2. Add all files
git add .

# 3. First commit
git commit -m "🫀 Initial CardioScan v2.0 — ML ensemble + Next.js + FastAPI"

# 4. Create repo on GitHub (via web or CLI)
# Go to: https://github.com/new
# Repo name: cardioscan
# Keep it Public or Private

# 5. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/cardioscan.git
git branch -M main
git push -u origin main
```

### Ongoing Workflow

```bash
# Check status
git status

# Stage changes
git add .                          # all changes
git add backend/routers/predict.py # specific file

# Commit with descriptive message
git commit -m "feat: add correlation heatmap to results panel"

# Push to GitHub
git push origin main
```

### Branch Workflow (Recommended)

```bash
# Create feature branch
git checkout -b feature/add-export-pdf

# Make your changes, then:
git add .
git commit -m "feat: add PDF export for risk report"
git push origin feature/add-export-pdf

# Merge back to main (via PR or locally)
git checkout main
git merge feature/add-export-pdf
git push origin main
```

### Useful Git Commands

```bash
# View commit history
git log --oneline --graph

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard all local changes
git checkout -- .

# Pull latest from remote
git pull origin main

# Create a release tag
git tag -a v2.0.0 -m "CardioScan v2.0 release"
git push origin v2.0.0

# View all branches
git branch -a

# Delete a local branch
git branch -d feature/my-feature

# Stash work in progress
git stash
git stash pop
```

### Git Commit Message Convention

```
feat:     new feature
fix:      bug fix
docs:     documentation change
style:    formatting, no logic change
refactor: code restructure
test:     adding tests
chore:    build/config changes

Examples:
git commit -m "feat: add KNN model to ensemble voting"
git commit -m "fix: handle missing thal values in preprocessing"
git commit -m "docs: update API reference in README"
git commit -m "style: align risk gauge colors to design tokens"
```

---

## 🔬 Clinical Features Reference

| Feature | Description | Range |
|---------|-------------|-------|
| age | Patient age | 20–100 years |
| sex | Biological sex | 0=Female, 1=Male |
| cp | Chest pain type | 0=Typical, 1=Atypical, 2=Non-anginal, 3=Asymptomatic |
| trestbps | Resting blood pressure | 80–200 mmHg |
| chol | Serum cholesterol | 100–600 mg/dl |
| fbs | Fasting blood sugar >120 | 0=No, 1=Yes |
| restecg | Resting ECG results | 0=Normal, 1=ST-T abnormality, 2=LV hypertrophy |
| thalach | Maximum heart rate | 60–220 bpm |
| exang | Exercise-induced angina | 0=No, 1=Yes |
| oldpeak | ST depression (exercise) | 0.0–10.0 mm |
| slope | ST segment slope | 0=Up, 1=Flat, 2=Down |
| ca | Major vessels (fluoroscopy) | 0–4 |
| thal | Thalassemia type | 0=Normal, 1=Fixed defect, 2=Reversible defect |

---

## ⚠️ Disclaimer

> CardioScan is intended for **research and educational purposes only**. It is not a medical device and should not be used for clinical diagnosis or treatment decisions. Always consult a qualified healthcare professional for medical advice.

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

**Built with ❤️ and ⚡ | CardioScan v2.0**
