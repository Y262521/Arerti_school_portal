import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authService.currentUser())
  const [bootstrapping, setBootstrapping] = useState(true)

  useEffect(() => { setBootstrapping(false) }, [])
  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password)
    setUser({ username: data.username, fullName: data.fullName, role: data.role })
    return data
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, bootstrapping, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
