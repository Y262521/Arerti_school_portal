import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

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
  const { t, lang, toggleLang } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname

  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const onChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (errorMessage) setErrorMessage('')
  }

  const onSubmit = async (e) => {
    e.preventDefault()

    // Rule 1: If neither field or only one field is filled
    if (!form.username?.trim() || !form.password?.trim()) {
      setErrorMessage(t('pleaseUseEmail'))
      return
    }

    setErrorMessage('')
    setLoading(true)

    try {
      const data = await login(form.username.trim(), form.password)
      toast.success(`${t('loginWelcome')} ${data.fullName}!`)
      navigate(from || HOME_BY_ROLE[data.role] || '/', { replace: true })
    } catch (err) {
      // Rule 2 & 3: Network offline or invalid credentials
      if (!err.response) {
        setErrorMessage(t('networkError'))
      } else {
        setErrorMessage(t('loginErrorFallback'))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      {/* ── Mobile top green branded section (visible on mobile & tablets < lg) ── */}
      <div className="lg:hidden bg-gradient-to-br from-brand-dark via-brand to-brand-light text-white px-6 pt-8 pb-10 shadow-md text-center">
        <div className="flex flex-col items-center max-w-sm mx-auto">
          <img
            src="/logo.png"
            className="h-28 w-28 sm:h-32 sm:w-32 shrink-0 object-contain drop-shadow-lg mb-3"
            alt="Arerti School Logo"
          />
          <h1 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            {t('loginBrandTitle1')} {t('loginBrandTitle2')}
          </h1>
          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mt-2 backdrop-blur-sm">
            {t('loginDigitalPortal')}
          </span>
          <p className="mt-2.5 text-xs sm:text-sm text-white/90">
            {t('welcomeSubtitle')}
          </p>
        </div>
      </div>

      {/* ── Desktop left brand panel (visible on lg and larger screens) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-dark via-brand to-brand-light text-white flex-col justify-between p-12 xl:p-16">
        <div>
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              className="h-24 w-24 xl:h-28 xl:w-28 shrink-0 object-contain drop-shadow-lg"
              alt="Arerti School Logo"
            />
            <div>
              <div className="font-display text-2xl font-bold leading-tight">{t('loginBrandTitle1')}</div>
              <div className="font-display text-2xl font-bold leading-tight">{t('loginBrandTitle2')}</div>
              <div className="text-sm text-white/80 mt-1 font-medium">{t('loginDigitalPortal')}</div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
            {t('welcomeTitle')}
          </h1>
          <p className="mt-4 text-white/85 text-base max-w-md leading-relaxed">
            {t('welcomeSubtitle')}
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 max-w-md text-sm">
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur border border-white/10">
              <div className="font-semibold text-white">{t('forDirectors')}</div>
              <div className="text-white/70 text-xs mt-0.5">{t('manageSchool')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur border border-white/10">
              <div className="font-semibold text-white">{t('forTeachers')}</div>
              <div className="text-white/70 text-xs mt-0.5">{t('gradesAttendance')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur border border-white/10">
              <div className="font-semibold text-white">{t('forStudents')}</div>
              <div className="text-white/70 text-xs mt-0.5">{t('viewResults')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-3.5 backdrop-blur border border-white/10">
              <div className="font-semibold text-white">{t('forParents')}</div>
              <div className="text-white/70 text-xs mt-0.5">{t('trackChild')}</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/60">
          © {new Date().getFullYear()} {t('copyrightText')}
        </div>
      </div>

      {/* ── Form panel (centered on desktop, clean card on mobile) ── */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12 -mt-4 lg:mt-0">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl lg:shadow-none p-6 sm:p-8 border border-slate-100 lg:border-none lg:bg-transparent">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-900">{t('signIn')}</h2>
          <p className="text-slate-500 mt-1 text-sm">{t('signInSubtitle')}</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('usernameEmail')}
              </label>
              <input
                name="username"
                value={form.username}
                onChange={onChange}
                className="input"
                placeholder="e.g. director or name@email.com"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('password')}
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
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 text-sm font-semibold">
              {loading ? t('signingIn') : t('signIn')}
            </button>
          </form>

          {/* ── Error message displayed directly BELOW the form ── */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium text-center animate-fadeIn">
              {errorMessage}
            </div>
          )}

          <p className="mt-6 text-xs text-slate-500 text-center">
            {t('troubleSignIn')}
          </p>

          {/* Language toggle */}
          <div className="mt-4 flex justify-center">
            <button onClick={toggleLang}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-brand hover:text-brand text-slate-600 transition">
              {lang === 'en' ? '🇪🇹 አማርኛ' : '🇬🇧 English'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
