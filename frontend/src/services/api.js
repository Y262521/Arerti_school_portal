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

// Auto-logout on 401; enrich network errors with a readable message
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
    // No response at all = offline or server unreachable
    if (!err.response) {
      err.isNetworkError = true
    }
    return Promise.reject(err)
  }
)

export default api

/**
 * Extracts a user-facing error message from an Axios error.
 * - Network/offline: returns null (caller should use t('networkError'))
 * - Server error with message: returns the server message
 * - Otherwise: returns null (caller should use a generic fallback)
 */
export function getErrorMessage(err) {
  if (!err.response || err.isNetworkError) return '__NETWORK__'
  return err.response?.data?.message || null
}
