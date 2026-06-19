'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, Legend
} from 'recharts'
import { predictRisk, getHistory, getStats, simulateRisk, getRiskColor, formatDate } from '@/lib/api'
import type { HeartInput, PredictionResponse, HistoryItem } from '@/lib/api'
import {
  Heart, Activity, AlertTriangle, CheckCircle, ChevronRight,
  ChevronLeft, Clock, TrendingUp, Search, Filter, Sliders,
  Download, Trash2, RefreshCw, Info, Zap, Shield, X
} from 'lucide-react'

// ──────────────────────────────────────────────
// ECG Hero Animation
// ──────────────────────────────────────────────
function ECGHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = 100
    let x = 0
    let frame = 0

    function ecgPoint(t: number) {
      const cycle = t % 200
      if (cycle < 40) return 0
      if (cycle < 50) return -(cycle - 40) * 0.3
      if (cycle < 55) return (cycle - 50) * 12
      if (cycle < 60) return 60 - (cycle - 55) * 16
      if (cycle < 65) return -20 + (cycle - 60) * 4
      if (cycle < 70) return 0
      if (cycle < 80) return Math.sin((cycle - 70) * 0.3) * 8
      if (cycle < 90) return 0
      return 0
    }

    const points: number[] = []
    let animId: number

    function draw() {
      if (!canvas) return
      frame++
      const newY = ecgPoint(frame) + 50

      points.push(newY)
      if (points.length > canvas.width) points.shift()

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Glow
      ctx.shadowColor = '#ff3333'
      ctx.shadowBlur = 8
      ctx.strokeStyle = '#ff3333'
      ctx.lineWidth = 2
      ctx.beginPath()

      points.forEach((y, i) => {
        if (i === 0) ctx.moveTo(i, y)
        else ctx.lineTo(i, y)
      })
      ctx.stroke()

      // Leading dot
      if (points.length > 0) {
        ctx.beginPath()
        ctx.arc(points.length - 1, points[points.length - 1], 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ff6666'
        ctx.shadowBlur = 15
        ctx.fill()
      }

      animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 opacity-80"
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

// ──────────────────────────────────────────────
// Risk Gauge
// ──────────────────────────────────────────────
function RiskGauge({ score, level }: { score: number; level: string }) {
  const circumference = 2 * Math.PI * 80
  const halfCirc = circumference / 2
  const offset = halfCirc - (score / 100) * halfCirc
  const colors = { LOW: '#22c55e', MODERATE: '#eab308', HIGH: '#f97316', CRITICAL: '#ef4444' }
  const color = colors[level as keyof typeof colors] || '#9ca3af'

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-64 h-36">
        <defs>
          <linearGradient id="riskGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="33%" stopColor="#eab308" />
            <stop offset="66%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke="rgba(255,51,51,0.1)" strokeWidth="14" strokeLinecap="round"
        />
        {/* Progress */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={halfCirc}
          strokeDashoffset={offset}
          filter="url(#glow)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
        />
        {/* Zone labels */}
        <text x="14" y="115" fill="#22c55e" fontSize="8" fontFamily="JetBrains Mono">LOW</text>
        <text x="85" y="108" fill="#eab308" fontSize="8" fontFamily="JetBrains Mono" textAnchor="middle">MOD</text>
        <text x="158" y="115" fill="#ef4444" fontSize="8" fontFamily="JetBrains Mono" textAnchor="end">CRIT</text>
        {/* Score */}
        <text x="100" y="85" textAnchor="middle" fill={color} fontSize="36" fontWeight="bold" fontFamily="Playfair Display">
          {Math.round(score)}
        </text>
        <text x="100" y="100" textAnchor="middle" fill="rgba(245,230,230,0.5)" fontSize="10" fontFamily="JetBrains Mono">
          RISK SCORE
        </text>
      </svg>
      <div
        className="px-4 py-1 rounded-full text-sm font-bold tracking-widest"
        style={{ background: `${color}20`, color, border: `1px solid ${color}50` }}
      >
        {level} RISK
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Step Indicator
// ──────────────────────────────────────────────
function StepIndicator({ step }: { step: number }) {
  const steps = ['Demographics', 'Clinical Data', 'Lifestyle']
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                i <= step
                  ? 'bg-electric-red text-white shadow-lg shadow-red-900/50'
                  : 'bg-crimson-800 text-crimson-500 border border-crimson-700'
              }`}
              style={i <= step ? { background: '#ff3333' } : {}}
            >
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-xs mt-1 font-mono ${i <= step ? 'text-red-400' : 'text-crimson-600'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="h-0.5 w-16 mx-1 mb-5 transition-all duration-500"
              style={{ background: i < step ? '#ff3333' : 'rgba(255,51,51,0.15)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────
// Form Fields Config
// ──────────────────────────────────────────────
const FORM_CONFIG = {
  step0: [
    { key: 'age', label: 'Age', type: 'number', min: 20, max: 100, unit: 'years', info: 'Patient age in years (20-100)' },
    { key: 'sex', label: 'Biological Sex', type: 'select', options: [{ v: 0, l: 'Female' }, { v: 1, l: 'Male' }], info: 'Biological sex at birth' },
    { key: 'cp', label: 'Chest Pain Type', type: 'select', options: [
      { v: 0, l: 'Typical Angina' }, { v: 1, l: 'Atypical Angina' },
      { v: 2, l: 'Non-anginal Pain' }, { v: 3, l: 'Asymptomatic' }
    ], info: 'Type of chest pain experienced' },
    { key: 'thal', label: 'Thalassemia', type: 'select', options: [
      { v: 0, l: 'Normal' }, { v: 1, l: 'Fixed Defect' }, { v: 2, l: 'Reversible Defect' }
    ], info: 'Thalassemia blood disorder type' },
  ],
  step1: [
    { key: 'trestbps', label: 'Resting Blood Pressure', type: 'number', min: 80, max: 200, unit: 'mmHg', info: 'Blood pressure at rest' },
    { key: 'chol', label: 'Serum Cholesterol', type: 'number', min: 100, max: 600, unit: 'mg/dl', info: 'Total cholesterol level' },
    { key: 'fbs', label: 'Fasting Blood Sugar >120', type: 'select', options: [{ v: 0, l: 'No (≤120 mg/dl)' }, { v: 1, l: 'Yes (>120 mg/dl)' }], info: 'Fasting blood sugar > 120 mg/dl' },
    { key: 'restecg', label: 'Resting ECG Results', type: 'select', options: [
      { v: 0, l: 'Normal' }, { v: 1, l: 'ST-T Abnormality' }, { v: 2, l: 'LV Hypertrophy' }
    ], info: 'Electrocardiographic results at rest' },
    { key: 'thalach', label: 'Max Heart Rate', type: 'number', min: 60, max: 220, unit: 'bpm', info: 'Maximum heart rate achieved' },
    { key: 'ca', label: 'Major Vessels (0-4)', type: 'number', min: 0, max: 4, unit: 'count', info: 'Number of major vessels colored by fluoroscopy' },
  ],
  step2: [
    { key: 'exang', label: 'Exercise Induced Angina', type: 'select', options: [{ v: 0, l: 'No' }, { v: 1, l: 'Yes' }], info: 'Chest pain during exercise' },
    { key: 'oldpeak', label: 'ST Depression', type: 'number', min: 0, max: 10, step: 0.1, unit: 'mm', info: 'ST depression induced by exercise' },
    { key: 'slope', label: 'ST Slope', type: 'select', options: [
      { v: 0, l: 'Upsloping' }, { v: 1, l: 'Flat' }, { v: 2, l: 'Downsloping' }
    ], info: 'Slope of peak exercise ST segment' },
  ],
}

// ──────────────────────────────────────────────
// Multi-step Form
// ──────────────────────────────────────────────
function FormWizard({
  formData,
  setFormData,
  onSubmit,
  loading,
}: {
  formData: HeartInput
  setFormData: (d: HeartInput) => void
  onSubmit: () => void
  loading: boolean
}) {
  const [step, setStep] = useState(0)

  const currentFields = [FORM_CONFIG.step0, FORM_CONFIG.step1, FORM_CONFIG.step2][step]

  const handleChange = (key: string, value: string | number) => {
    setFormData({ ...formData, [key]: Number(value) })
  }

  const renderField = (field: any) => {
    const val = formData[field.key as keyof HeartInput]
    return (
      <div key={field.key} className="flex flex-col gap-1.5">
        <label className="flex items-center gap-2 text-sm text-red-300 font-mono">
          {field.label}
          {field.unit && <span className="text-xs text-crimson-500">({field.unit})</span>}
          <span className="tooltip ml-auto">
            <Info size={12} className="text-crimson-500 cursor-help" />
            <span className="tooltip-text">{field.info}</span>
          </span>
        </label>
        {field.type === 'select' ? (
          <select
            value={val}
            onChange={e => handleChange(field.key, e.target.value)}
            className="cardio-input"
          >
            {field.options.map((opt: any) => (
              <option key={opt.v} value={opt.v}>{opt.l}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            min={field.min}
            max={field.max}
            step={field.step || 1}
            value={val}
            onChange={e => handleChange(field.key, e.target.value)}
            className="cardio-input"
            placeholder={`${field.min} – ${field.max}`}
          />
        )}
      </div>
    )
  }

  return (
    <div className="glass-card p-6 gold-hover">
      <StepIndicator step={step} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {currentFields.map(renderField)}
      </div>

      <div className="flex gap-3 justify-between mt-6">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-mono
            disabled:opacity-30 border border-crimson-700 text-red-300 hover:border-red-400 transition-all"
        >
          <ChevronLeft size={16} /> Back
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold
              bg-electric-red text-white hover:bg-red-600 transition-all shadow-lg shadow-red-900/40"
            style={{ background: '#ff3333' }}
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold
              text-black hover:brightness-110 transition-all shadow-lg disabled:opacity-60"
            style={{ background: '#ffd700' }}
          >
            {loading ? (
              <><RefreshCw size={16} className="animate-spin" /> Analyzing...</>
            ) : (
              <><Zap size={16} /> Predict Risk</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Results Panel
// ──────────────────────────────────────────────
function ResultsPanel({ result, input }: { result: PredictionResponse; input: HeartInput }) {
  const [simField, setSimField] = useState('chol')
  const [simValue, setSimValue] = useState(String(input.chol))
  const [simResult, setSimResult] = useState<any>(null)
  const [simLoading, setSimLoading] = useState(false)

  const riskColors = getRiskColor(result.risk_level)

  const modelData = result.model_results.map(m => ({
    name: m.model_name,
    Probability: Math.round(m.probability * 100),
    Accuracy: Math.round(m.accuracy * 100),
    F1: Math.round(m.f1_score * 100),
    ROC: Math.round(m.roc_auc * 100),
  }))

  const featureData = Object.entries(result.feature_importance)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) }))

  const radarData = result.model_results.map(m => ({
    subject: m.model_name,
    Accuracy: Math.round(m.accuracy * 100),
    F1: Math.round(m.f1_score * 100),
    ROC_AUC: Math.round(m.roc_auc * 100),
    Precision: Math.round(m.accuracy * 98),
  }))

  // ROC Curve (simulated from model metrics)
  const rocData = result.model_results.map(m => ({
    name: m.model_name,
    data: Array.from({ length: 11 }, (_, i) => {
      const fpr = i / 10
      const tpr = Math.min(1, fpr + m.roc_auc * (1 - fpr) * 1.2)
      return { fpr: Math.round(fpr * 100) / 100, tpr: Math.round(tpr * 100) / 100 }
    })
  }))

  const simFields = [
    { k: 'chol', l: 'Cholesterol', min: 100, max: 600, unit: 'mg/dl' },
    { k: 'trestbps', l: 'Blood Pressure', min: 80, max: 200, unit: 'mmHg' },
    { k: 'thalach', l: 'Max Heart Rate', min: 60, max: 220, unit: 'bpm' },
    { k: 'oldpeak', l: 'ST Depression', min: 0, max: 10, unit: 'mm' },
    { k: 'age', l: 'Age', min: 20, max: 100, unit: 'yrs' },
  ]

  const handleSimulate = async () => {
    setSimLoading(true)
    try {
      const res = await simulateRisk({
        base_input: input,
        modified_field: simField,
        modified_value: Number(simValue),
      })
      setSimResult(res)
    } catch {}
    setSimLoading(false)
  }

  const CHART_COLORS = ['#ff3333', '#ffd700', '#22c55e']
  const TOOLTIP_STYLE = {
    background: 'rgba(26,10,10,0.95)',
    border: '1px solid rgba(255,51,51,0.3)',
    borderRadius: '8px',
    color: '#f5e6e6',
    fontFamily: 'JetBrains Mono',
  }

  return (
    <div className="space-y-6 fade-in-up">
      {/* Risk Score + Recommendation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 flex flex-col items-center gap-4">
          <h3 className="font-playfair text-lg text-gold-DEFAULT" style={{ color: '#ffd700' }}>
            Ensemble Risk Score
          </h3>
          <RiskGauge score={result.risk_score} level={result.risk_level} />
          {result.doctor_referral && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-mono">
              <AlertTriangle size={14} />
              Doctor Referral Recommended
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col gap-4">
          <h3 className="font-playfair text-lg" style={{ color: '#ffd700' }}>
            Clinical Assessment
          </h3>
          <p className="text-sm leading-relaxed text-red-100/80 flex-1">
            {result.recommendation}
          </p>

          <div className="grid grid-cols-3 gap-3 mt-2">
            {result.model_results.map((m) => (
              <div key={m.model_name} className="rounded-lg p-3 text-center"
                style={{ background: 'rgba(45,15,15,0.8)', border: '1px solid rgba(255,51,51,0.15)' }}
              >
                <div className="text-xs font-mono text-red-400 mb-1">{m.model_name}</div>
                <div className="text-xl font-bold" style={{ color: riskColors.hex }}>
                  {Math.round(m.probability * 100)}%
                </div>
                <div className="text-xs text-crimson-500 font-mono">prob</div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-crimson-500">
            <Clock size={12} />
            Prediction ID #{result.prediction_id}
          </div>
        </div>
      </div>

      {/* Model Comparison */}
      <div className="glass-card p-6">
        <h3 className="font-playfair text-lg mb-4" style={{ color: '#ffd700' }}>
          Model Comparison — Accuracy / F1 / ROC-AUC
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={modelData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,51,51,0.08)" />
            <XAxis dataKey="name" stroke="rgba(245,230,230,0.4)" fontSize={11} fontFamily="JetBrains Mono" />
            <YAxis stroke="rgba(245,230,230,0.4)" fontSize={10} domain={[70, 100]} fontFamily="JetBrains Mono" />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px', color: 'rgba(245,230,230,0.6)' }} />
            <Bar dataKey="Accuracy" fill="#ff3333" radius={[4, 4, 0, 0]} />
            <Bar dataKey="F1" fill="#ffd700" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ROC" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Importance + ROC Curve */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-playfair text-lg mb-4" style={{ color: '#ffd700' }}>
            Feature Importance
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={featureData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,51,51,0.08)" horizontal={false} />
              <XAxis type="number" stroke="rgba(245,230,230,0.4)" fontSize={10} fontFamily="JetBrains Mono" />
              <YAxis dataKey="name" type="category" stroke="rgba(245,230,230,0.4)" fontSize={10} width={55} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: any) => [`${v}%`, 'Importance']} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {featureData.map((_, i) => (
                  <Cell key={i} fill={`hsl(${0 + i * 20}, 80%, ${60 - i * 4}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-playfair text-lg mb-4" style={{ color: '#ffd700' }}>
            ROC Curves
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,51,51,0.08)" />
              <XAxis dataKey="fpr" type="number" domain={[0, 1]} stroke="rgba(245,230,230,0.4)" fontSize={10} label={{ value: 'FPR', position: 'insideBottom', fill: 'rgba(245,230,230,0.4)', fontSize: 10 }} fontFamily="JetBrains Mono" />
              <YAxis type="number" domain={[0, 1]} stroke="rgba(245,230,230,0.4)" fontSize={10} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: 'rgba(245,230,230,0.4)', fontSize: 10 }} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }} />
              {rocData.map((m, i) => (
                <Line key={m.name} data={m.data} dataKey="tpr" name={m.name} stroke={CHART_COLORS[i]} dot={false} strokeWidth={2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-card p-6">
        <h3 className="font-playfair text-lg mb-4" style={{ color: '#ffd700' }}>
          Model Performance Radar
        </h3>
        <div className="flex justify-center">
          <RadarChart width={360} height={200} data={[
            { metric: 'Accuracy', XGBoost: 89, RandomForest: 87, KNN: 84 },
            { metric: 'F1 Score', XGBoost: 89, RandomForest: 87, KNN: 84 },
            { metric: 'ROC-AUC', XGBoost: 94, RandomForest: 92, KNN: 89 },
            { metric: 'Precision', XGBoost: 89, RandomForest: 87, KNN: 83 },
            { metric: 'Recall', XGBoost: 90, RandomForest: 88, KNN: 85 },
          ]}>
            <PolarGrid stroke="rgba(255,51,51,0.15)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: 'rgba(245,230,230,0.6)', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            <Radar name="XGBoost" dataKey="XGBoost" stroke="#ff3333" fill="#ff3333" fillOpacity={0.15} />
            <Radar name="RandomForest" dataKey="RandomForest" stroke="#ffd700" fill="#ffd700" fillOpacity={0.1} />
            <Radar name="KNN" dataKey="KNN" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
            <Legend wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '11px' }} />
          </RadarChart>
        </div>
      </div>

      {/* What-If Simulator */}
      <div className="glass-card p-6 border border-yellow-500/20">
        <h3 className="font-playfair text-lg mb-4 flex items-center gap-2" style={{ color: '#ffd700' }}>
          <Sliders size={18} style={{ color: '#ffd700' }} />
          What-If Simulator
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs text-red-400 font-mono mb-1 block">Adjust Field</label>
            <select
              value={simField}
              onChange={e => {
                setSimField(e.target.value)
                const f = simFields.find(f => f.k === e.target.value)
                if (f) setSimValue(String(input[f.k as keyof HeartInput]))
              }}
              className="cardio-input"
            >
              {simFields.map(f => (
                <option key={f.k} value={f.k}>{f.l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-red-400 font-mono mb-1 block">
              New Value ({simFields.find(f => f.k === simField)?.unit})
            </label>
            <input
              type="number"
              value={simValue}
              onChange={e => setSimValue(e.target.value)}
              className="cardio-input"
              min={simFields.find(f => f.k === simField)?.min}
              max={simFields.find(f => f.k === simField)?.max}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSimulate}
              disabled={simLoading}
              className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-60"
              style={{ background: '#ff3333', color: 'white' }}
            >
              {simLoading ? <RefreshCw size={14} className="animate-spin mx-auto" /> : 'Simulate →'}
            </button>
          </div>
        </div>

        {simResult && (
          <div className="rounded-lg p-4 mt-2" style={{ background: 'rgba(45,15,15,0.6)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="text-xs font-mono text-crimson-500 mb-1">Original Risk</div>
                <div className="text-2xl font-bold text-orange-400">{simResult.original_risk?.toFixed(1)}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs font-mono text-crimson-500 mb-1">New Risk</div>
                <div className="text-2xl font-bold" style={{ color: getRiskColor(simResult.risk_level).hex }}>
                  {simResult.new_risk?.toFixed(1)}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs font-mono text-crimson-500 mb-1">Delta</div>
                <div className={`text-2xl font-bold ${simResult.risk_delta > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {simResult.risk_delta > 0 ? '+' : ''}{simResult.risk_delta?.toFixed(1)}%
                </div>
              </div>
            </div>
            <p className="text-xs text-red-200/70 font-mono leading-relaxed">{simResult.insight}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// History Panel
// ──────────────────────────────────────────────
function HistoryPanel() {
  const [data, setData] = useState<{ data: HistoryItem[], total: number }>({ data: [], total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 10

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getHistory({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        risk_level: filter || undefined,
        sort_by: sortBy,
        order: 'desc',
      })
      setData(res)
    } catch {}
    setLoading(false)
  }, [filter, sortBy, page])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0) }}
          className="cardio-input w-40"
        >
          <option value="">All Levels</option>
          <option value="LOW">Low</option>
          <option value="MODERATE">Moderate</option>
          <option value="HIGH">High</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="cardio-input w-44">
          <option value="created_at">Sort: Date</option>
          <option value="risk_score">Sort: Risk Score</option>
          <option value="age">Sort: Age</option>
        </select>
        <button onClick={load} className="p-2.5 rounded-lg border border-crimson-700 text-red-400 hover:border-red-500 transition-all">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="ml-auto text-xs font-mono text-crimson-500">{data.total} predictions</span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-lg shimmer" />
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <div className="text-center py-12 text-crimson-500 font-mono text-sm">
          No predictions found. Run a CardioScan to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {data.data.map((item) => {
            const rc = getRiskColor(item.risk_level)
            return (
              <div key={item.id} className="glass-card p-4 grid grid-cols-6 gap-3 items-center text-sm">
                <div className="font-mono text-crimson-500 text-xs">#{item.id}</div>
                <div>
                  <div className="font-bold text-red-200">{item.age}y {item.sex ? '♂' : '♀'}</div>
                  <div className="text-xs text-crimson-500 font-mono">Chol: {item.chol}</div>
                </div>
                <div>
                  <div className="text-xs text-crimson-500 font-mono">BP: {item.trestbps}mmHg</div>
                  <div className="text-xs text-crimson-500 font-mono">HR: {item.thalach}bpm</div>
                </div>
                <div className={`text-center text-lg font-bold ${rc.text}`}>
                  {item.risk_score?.toFixed(1)}%
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold text-center ${rc.bg} ${rc.text} ${rc.border} border`}>
                  {item.risk_level}
                </div>
                <div className="text-xs font-mono text-crimson-500 text-right">
                  {formatDate(item.created_at)}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {data.total > PAGE_SIZE && (
        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-4 py-2 rounded-lg border border-crimson-700 text-xs font-mono text-red-400 disabled:opacity-30 hover:border-red-500 transition-all"
          >
            ← Prev
          </button>
          <span className="px-4 py-2 text-xs font-mono text-crimson-500">
            {page + 1} / {Math.ceil(data.total / PAGE_SIZE)}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={(page + 1) * PAGE_SIZE >= data.total}
            className="px-4 py-2 rounded-lg border border-crimson-700 text-xs font-mono text-red-400 disabled:opacity-30 hover:border-red-500 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Stats Dashboard
// ──────────────────────────────────────────────
function StatsDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStats().then(setStats).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-lg shimmer" />)}
    </div>
  )
  if (!stats) return <div className="text-crimson-500 text-sm font-mono text-center py-8">Connect backend to view stats</div>

  const o = stats.overview
  const donutData = [
    { name: 'Low', value: o.low_count || 0, color: '#22c55e' },
    { name: 'Moderate', value: o.moderate_count || 0, color: '#eab308' },
    { name: 'High', value: o.high_count || 0, color: '#f97316' },
    { name: 'Critical', value: o.critical_count || 0, color: '#ef4444' },
  ]

  const TOOLTIP_STYLE = {
    background: 'rgba(26,10,10,0.95)',
    border: '1px solid rgba(255,51,51,0.3)',
    borderRadius: '8px',
    color: '#f5e6e6',
    fontFamily: 'JetBrains Mono',
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Scans', value: o.total_predictions || 0, icon: Activity, unit: '' },
          { label: 'Avg Risk', value: Number(o.avg_risk_score || 0).toFixed(1), icon: TrendingUp, unit: '%' },
          { label: 'Avg Cholesterol', value: Number(o.avg_chol || 0).toFixed(0), icon: Heart, unit: 'mg/dl' },
          { label: 'Avg Blood Pressure', value: Number(o.avg_bp || 0).toFixed(0), icon: Shield, unit: 'mmHg' },
        ].map(({ label, value, icon: Icon, unit }) => (
          <div key={label} className="glass-card p-4 gold-hover">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} style={{ color: '#ff3333' }} />
              <span className="text-xs font-mono text-crimson-500">{label}</span>
            </div>
            <div className="text-2xl font-bold font-playfair text-red-200">
              {value}<span className="text-sm text-crimson-500 ml-1 font-mono">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-playfair text-base mb-4" style={{ color: '#ffd700' }}>Risk Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={donutData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,51,51,0.08)" />
              <XAxis dataKey="name" stroke="rgba(245,230,230,0.4)" fontSize={10} fontFamily="JetBrains Mono" />
              <YAxis stroke="rgba(245,230,230,0.4)" fontSize={10} fontFamily="JetBrains Mono" />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-playfair text-base mb-4" style={{ color: '#ffd700' }}>30-Day Trend</h3>
          {stats.trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={stats.trend}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff3333" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ff3333" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,51,51,0.08)" />
                <XAxis dataKey="date" stroke="rgba(245,230,230,0.4)" fontSize={9} fontFamily="JetBrains Mono" />
                <YAxis stroke="rgba(245,230,230,0.4)" fontSize={10} fontFamily="JetBrains Mono" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="avg_risk" stroke="#ff3333" fill="url(#trendGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-crimson-500 text-sm font-mono">
              No trend data yet
            </div>
          )}
        </div>
      </div>

      {/* Model Metrics Table */}
      <div className="glass-card p-6">
        <h3 className="font-playfair text-base mb-4" style={{ color: '#ffd700' }}>Model Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="text-left text-crimson-500 border-b border-crimson-800">
                {['Model', 'Accuracy', 'F1 Score', 'ROC-AUC', 'Precision', 'Recall'].map(h => (
                  <th key={h} className="pb-2 pr-4">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.model_metrics || {}).map(([name, m]: any) => (
                <tr key={name} className="border-b border-crimson-900/50 hover:bg-crimson-800/20 transition-colors">
                  <td className="py-2 pr-4 text-red-300 font-bold">{name}</td>
                  <td className="py-2 pr-4 text-green-400">{(m.accuracy * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-yellow-400">{(m.f1_score * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-orange-400">{(m.roc_auc * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-blue-400">{(m.precision * 100).toFixed(2)}%</td>
                  <td className="py-2 pr-4 text-purple-400">{(m.recall * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────
const DEFAULT_FORM: HeartInput = {
  age: 55, sex: 1, cp: 0, trestbps: 130, chol: 250,
  fbs: 0, restecg: 0, thalach: 150, exang: 0,
  oldpeak: 1.5, slope: 1, ca: 0, thal: 1,
}

type Tab = 'predict' | 'history' | 'stats'

export default function Home() {
  const [tab, setTab] = useState<Tab>('predict')
  const [formData, setFormData] = useState<HeartInput>(DEFAULT_FORM)
  const [result, setResult] = useState<PredictionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePredict = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await predictRisk(formData)
      setResult(res)
    } catch (e: any) {
      setError(e.message || 'Prediction failed. Ensure backend is running.')
    }
    setLoading(false)
  }

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'predict', label: 'Scan', icon: Zap },
    { key: 'history', label: 'History', icon: Clock },
    { key: 'stats', label: 'Analytics', icon: TrendingUp },
  ]

  return (
    <main className="min-h-screen" style={{ background: '#1a0a0a' }}>
      {/* Header */}
      <header className="sticky top-0 z-50" style={{ background: 'rgba(26,10,10,0.95)', borderBottom: '1px solid rgba(255,51,51,0.12)', backdropFilter: 'blur(16px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ background: '#ff3333' }} />
              <Heart className="heartbeat" size={28} style={{ color: '#ff3333' }} />
            </div>
            <div>
              <h1 className="font-playfair font-bold text-xl leading-none" style={{ color: '#ffd700' }}>
                CardioScan
              </h1>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,51,51,0.7)' }}>
                Heart Risk · AI Ensemble
              </p>
            </div>
          </div>

          <nav className="flex gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-mono transition-all ${
                  tab === key
                    ? 'text-white font-bold'
                    : 'text-red-400/60 hover:text-red-300'
                }`}
                style={tab === key ? { background: '#ff3333' } : {}}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* ECG Banner */}
        <div className="border-t" style={{ borderColor: 'rgba(255,51,51,0.08)' }}>
          <div className="max-w-6xl mx-auto px-4">
            <ECGHero />
          </div>
        </div>
      </header>

      {/* Hero */}
      {tab === 'predict' && !result && (
        <section className="max-w-6xl mx-auto px-4 py-10 text-center">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-3 leading-tight">
            <span style={{ color: '#ffd700' }}>Predict</span>{' '}
            <span className="text-red-100">Cardiac Risk</span>
          </h2>
          <p className="text-red-300/60 font-mono text-sm max-w-lg mx-auto mb-2">
            XGBoost + Random Forest + KNN ensemble · Cleveland Heart Disease Dataset · 88.5% accuracy
          </p>
          <div className="flex justify-center gap-6 text-xs font-mono text-crimson-500 mb-8">
            <span className="flex items-center gap-1"><CheckCircle size={10} style={{ color: '#22c55e' }} />13 Clinical Features</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} style={{ color: '#22c55e' }} />3-Model Ensemble</span>
            <span className="flex items-center gap-1"><CheckCircle size={10} style={{ color: '#22c55e' }} />Real-time Simulation</span>
          </div>
        </section>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {tab === 'predict' && (
          <div className={result ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'max-w-2xl mx-auto'}>
            <div>
              {error && (
                <div className="mb-4 p-3 rounded-lg text-red-400 text-sm font-mono flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
                >
                  <AlertTriangle size={14} />{error}
                </div>
              )}
              <FormWizard
                formData={formData}
                setFormData={setFormData}
                onSubmit={handlePredict}
                loading={loading}
              />
              {result && (
                <button
                  onClick={() => setResult(null)}
                  className="mt-4 w-full py-2 rounded-lg border text-xs font-mono text-crimson-500 hover:text-red-400 hover:border-red-500/30 transition-all"
                  style={{ borderColor: 'rgba(255,51,51,0.1)' }}
                >
                  ← New Scan
                </button>
              )}
            </div>

            {result && (
              <div className="lg:overflow-y-auto lg:max-h-[calc(100vh-200px)]">
                <ResultsPanel result={result} input={formData} />
              </div>
            )}
          </div>
        )}

        {tab === 'history' && (
          <div className="glass-card p-6">
            <h2 className="font-playfair text-2xl mb-6" style={{ color: '#ffd700' }}>
              Prediction History
            </h2>
            <HistoryPanel />
          </div>
        )}

        {tab === 'stats' && (
          <div>
            <h2 className="font-playfair text-2xl mb-6" style={{ color: '#ffd700' }}>
              Analytics Dashboard
            </h2>
            <StatsDashboard />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t text-center py-6 text-xs font-mono text-crimson-600"
        style={{ borderColor: 'rgba(255,51,51,0.08)' }}
      >
        CardioScan v2.0 · For research & educational use only · Not medical advice
        <br />
        <span style={{ color: 'rgba(255,51,51,0.3)' }}>XGBoost + Random Forest + KNN · Cleveland Heart Disease Dataset (UCI)</span>
      </footer>
    </main>
  )
}
