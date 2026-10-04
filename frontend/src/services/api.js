import axios from 'axios'

// Always point to the Render backend in production.
// Vite's proxy handles /api → localhost:8080 in local dev only.
const baseURL = import.meta.env.DEV
  ? '/api'
  : 'https://arerti-school-backend.onrender.com/api'

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
})

// Attach JWT to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('arerti_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-logout on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('arerti_token')
      localStorage.removeItem('arerti_user')
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
