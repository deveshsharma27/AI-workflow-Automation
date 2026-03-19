import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})



// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data)
}

export const workflowAPI = {
  getAll: () => api.get('/workflows'),
  getById: (id) => api.get(`/workflows/${id}`),
  create: (data) => api.post('/workflows', data),
  update: (id, data) => api.put(`/workflows/${id}`, data),
  delete: (id) => api.delete(`/workflows/${id}`)
}

export const executionAPI = {
  start: (data) => api.post('/executions/start', data),
  getAll: () => api.get('/executions'),
  getById: (id) => api.get(`/executions/${id}`),
  getLogs: (id) => api.get(`/executions/${id}/logs`)
}

export const webhookAPI = {
  trigger: (workflowId, data) => api.post(`/webhook/${workflowId}`, data)
}

export default api