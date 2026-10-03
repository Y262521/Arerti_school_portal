import api from './api'

export const authService = {
  async login(username, password) {
    const { data } = await api.post('/auth/login', { username, password })
    localStorage.setItem('arerti_token', data.token)
    localStorage.setItem('arerti_user', JSON.stringify({
      username: data.username,
      fullName: data.fullName,
      role: data.role
    }))
    return data
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload)
    return data
  },

  logout() {
    localStorage.removeItem('arerti_token')
    localStorage.removeItem('arerti_user')
  },

  currentUser() {
    try { return JSON.parse(localStorage.getItem('arerti_user')) }
    catch { return null }
  },

  isLoggedIn() {
    return !!localStorage.getItem('arerti_token')
  },

  async changePassword(currentPassword, newPassword) {
    await api.post('/auth/change-password', { currentPassword, newPassword })
  }
}
