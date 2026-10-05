import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const HOME_BY_ROLE = {
  ADMIN:   '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT:  '/parent'
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Please fill in both fields')
      return
    }
    setLoading(true)
    try {
      const data = await login(form.username, form.password)
      toast.success(`Welcome, ${data.fullName}!`)
      navigate(from || HOME_BY_ROLE[data.role] || '/', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-dark via-brand to-brand-light text-white flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <img src="/logo.png" className="h-14 w-14 rounded-full bg-white p-1 shrink-0" alt="logo" />
            <div>
              <div className="font-display text-xl font-bold leading-tight">Arerti General Secondary</div>
              <div className="font-display text-xl font-bold leading-tight">& Preparatory School</div>
              <div className="text-sm text-white/80 mt-1">Digital Portal</div>
            </div>
          </div>
        </div>
        <div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            Welcome to Arerti General Secondary<br/>& Preparatory School Portal
          </h1>
          <p className="mt-4 text-white/80 max-w-md">
            Manage students, grades, attendance and communication — securely, from any device.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md text-sm">
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
              <div className="font-semibold">For Directors</div>
              <div className="text-white/70 text-xs">Manage the whole school</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
              <div className="font-semibold">For Teachers</div>
              <div className="text-white/70 text-xs">Grades, attendance, materials</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
              <div className="font-semibold">For Students</div>
              <div className="text-white/70 text-xs">View results, get materials</div>
            </div>
            <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
              <div className="font-semibold">For Parents</div>
              <div className="text-white/70 text-xs">Track your child's progress</div>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/60">© {new Date().getFullYear()} Arerti General Secondary & Preparatory School</div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/logo.png" alt="logo" className="h-16 w-16 rounded-full" />
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Sign in</h2>
          <p className="text-slate-500 mt-1">Use your school ID and password.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username / School ID
              </label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="input"
                placeholder="e.g. admin or STU-2026-001"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={onChange}
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-500 text-center">
            Trouble signing in? Contact the school admin office.
          </p>
        </div>
      </div>
    </div>
  )
}
