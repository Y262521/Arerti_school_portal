import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const HOME_BY_ROLE = {
  ADMIN:   '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
  PARENT:  '/parent'
}

// Eye icons
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

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
      toast.error(err.response?.data?.message || 'Login failed — check your ID and password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
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
            Welcome to Arerti General Secondary & Preparatory<br/>School Portal
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
        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} Arerti General Secondary & Preparatory School
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <img src="/logo.png" alt="logo" className="h-16 w-16 rounded-full" />
          </div>
          <h2 className="font-display text-3xl font-bold text-slate-900">Sign in</h2>
          <p className="text-slate-500 mt-1">Use your username, email, or School ID.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username / School ID / Email
              </label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="input"
                placeholder="e.g. admin or STU-2026-XXXXXX"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={onChange}
                  className="input pr-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-500 text-center">
            Trouble signing in? Contact the school office.
          </p>
        </div>
      </div>
    </div>
  )
}
