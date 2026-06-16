import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authApi = {
  login: (creds) => api.post('/auth/login', creds),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  users: () => api.get('/auth/users')
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  recentActivity: () => api.get('/dashboard/recent-activity')
}

export const transactionsApi = {
  list: (params) => api.get('/transactions/', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  flag: (id) => api.patch(`/transactions/${id}/flag`)
}

export const fraudApi = {
  predict: (data) => api.post('/fraud/predict', data),
  upload: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return api.post('/fraud/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  explain: (id) => api.get(`/fraud/explain/${id}`)
}

export const investigationsApi = {
  list: (params) => api.get('/investigations/', { params }),
  get: (id) => api.get(`/investigations/${id}`),
  create: (data) => api.post('/investigations/', data),
  update: (id, data) => api.patch(`/investigations/${id}`, data),
  addNote: (id, data) => api.post(`/investigations/${id}/notes`, data)
}

export const reportsApi = {
  list: () => api.get('/reports/'),
  generate: (data) => api.post('/reports/generate', data),
  download: (id) => api.get(`/reports/${id}/download`, { responseType: 'blob' })
}

export const analyticsApi = {
  fraudTrends: (days) => api.get('/analytics/fraud-trends', { params: { days } }),
  riskDistribution: () => api.get('/analytics/risk-distribution'),
  channelBreakdown: () => api.get('/analytics/channel-breakdown'),
  monthlySummary: () => api.get('/analytics/monthly-summary'),
  topMerchants: () => api.get('/analytics/top-merchants')
}

export const chatApi = {
  send: (message) => api.post('/chat/message', { message }),
  auto: (message) => api.post('/chat/auto', { message }),
  modes: () => api.get('/chat/modes'),
  history: (limit = 50) => api.get('/chat/history', { params: { limit } }),
  clear: () => api.delete('/chat/history'),
  context: (txn_id) => api.get(`/chat/context/${txn_id}`)
}

export default api
