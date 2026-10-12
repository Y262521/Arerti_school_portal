import api from './api'

export const authService = {
  async login(username, password) {
    const { data } = await api.post('/auth/login', { username, password })
    let fullName = data.fullName
    if (fullName === 'System Administrator' || data.role === 'ADMIN') {
      fullName = 'School Director'
    }
    localStorage.setItem('arerti_token', data.token)
    localStorage.setItem('arerti_user', JSON.stringify({
      username: data.username,
      fullName,
      role: data.role
    }))
    return { ...data, fullName }
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
    try {
      const u = JSON.parse(localStorage.getItem('arerti_user'))
      if (u && (u.fullName === 'System Administrator' || u.role === 'ADMIN')) {
        u.fullName = 'School Director'
      }
      return u
    }
    catch { return null }
  },

  isLoggedIn() {
    return !!localStorage.getItem('arerti_token')
  },

  async changePassword(currentPassword, newPassword) {
    await api.post('/auth/change-password', { currentPassword, newPassword })
  }
}
