const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface HeartInput {
  age: number
  sex: number
  cp: number
  trestbps: number
  chol: number
  fbs: number
  restecg: number
  thalach: number
  exang: number
  oldpeak: number
  slope: number
  ca: number
  thal: number
}

export interface ModelResult {
  model_name: string
  probability: number
  prediction: number
  accuracy: number
  f1_score: number
  roc_auc: number
}

export interface PredictionResponse {
  risk_score: number
  risk_level: string
  risk_percentage: number
  model_results: ModelResult[]
  recommendation: string
  doctor_referral: boolean
  feature_importance: Record<string, number>
  prediction_id: number
}

export interface HistoryItem {
  id: number
  age: number
  sex: number
  cp: number
  trestbps: number
  chol: number
  fbs: number
  restecg: number
  thalach: number
  exang: number
  oldpeak: number
  slope: number
  ca: number
  thal: number
  risk_score: number
  risk_level: string
  xgb_prob: number
  rf_prob: number
  knn_prob: number
  recommendation: string
  created_at: string
}

export async function predictRisk(data: HeartInput): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE}/api/heart-predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`API Error: ${res.statusText}`)
  return res.json()
}

export async function getHistory(params?: {
  limit?: number
  offset?: number
  risk_level?: string
  sort_by?: string
  order?: string
}) {
  const query = new URLSearchParams()
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.offset) query.set('offset', String(params.offset))
  if (params?.risk_level) query.set('risk_level', params.risk_level)
  if (params?.sort_by) query.set('sort_by', params.sort_by)
  if (params?.order) query.set('order', params.order)
  const res = await fetch(`${API_BASE}/api/history?${query}`)
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function getStats() {
  const res = await fetch(`${API_BASE}/api/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

export async function simulateRisk(data: {
  base_input: HeartInput
  modified_field: string
  modified_value: number
}) {
  const res = await fetch(`${API_BASE}/api/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Simulation failed')
  return res.json()
}

export function getRiskColor(level: string) {
  switch (level?.toUpperCase()) {
    case 'LOW': return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30', hex: '#22c55e' }
    case 'MODERATE': return { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', hex: '#eab308' }
    case 'HIGH': return { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30', hex: '#f97316' }
    case 'CRITICAL': return { text: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30', hex: '#ef4444' }
    default: return { text: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/30', hex: '#9ca3af' }
  }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}
