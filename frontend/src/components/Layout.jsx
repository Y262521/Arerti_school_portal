import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// Use translation keys instead of hardcoded labels
const ROLE_LINKS = {
  ADMIN: [
    { to: '/admin', key: 'dashboard' },
    { to: '/admin/registration', key: 'registration' },
    { to: '/admin/students', key: 'students' },
    { to: '/admin/teachers', key: 'teachers' },
    { to: '/admin/classes', key: 'classes' },
    { to: '/admin/subjects', key: 'subjects' },
    { to: '/admin/grades', key: 'gradebook' },
    { to: '/admin/attendance', key: 'attendance' },
    { to: '/admin/grade-entry', key: 'gradeEntryWindow' },
    { to: '/admin/regrade-requests', key: 'regrade' },
    { to: '/notices', key: 'noticeboard' },
    { to: '/resources', key: 'resources' },
    { to: '/admin/user-lookup', key: 'userlookup' },
    { to: '/admin/audit-log', key: 'auditlog' },
  ],
  TEACHER: [
    { to: '/teacher', key: 'dashboard' },
    { to: '/teacher/registration', key: 'registration' },
    { to: '/teacher/grades', key: 'gradebook' },
    { to: '/teacher/attendance', key: 'attendance' },
    { to: '/notices', key: 'noticeboard' },
    { to: '/resources', key: 'resources' },
  ],
  STUDENT: [
    { to: '/student', key: 'dashboard' },
    { to: '/student/grades', key: 'myGrades' },
    { to: '/student/attendance', key: 'myAttendance' },
    { to: '/notices', key: 'notices' },
    { to: '/resources', key: 'resources' },
  ],
  PARENT: [
    { to: '/parent', key: 'dashboard' },
    { to: '/parent/children', key: 'myChildren' },
    { to: '/parent/report-cards', key: 'reportCards' },
    { to: '/notices', key: 'notices' },
    { to: '/resources', key: 'resources' },
  ]
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { lang, toggleLang, t } = useLanguage()
  const navigate = useNavigate()
  const links = ROLE_LINKS[user?.role] || []

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Arerti" className="h-9 w-9 rounded-full object-cover shrink-0" />
            <div className="leading-tight hidden lg:block">
              <div className="font-display font-bold text-brand text-xs whitespace-nowrap">Arerti General Secondary</div>
              <div className="font-display font-bold text-brand text-xs whitespace-nowrap">& Preparatory School</div>
            </div>
            <div className="font-display font-bold text-brand text-sm lg:hidden whitespace-nowrap">Arerti</div>
          </Link>

          <nav className="ml-4 hidden md:flex items-center gap-0.5 flex-1 flex-wrap">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-2 py-1 rounded-md text-xs font-medium transition whitespace-nowrap ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand hover:bg-brand/5'
                  }`
                }
              >
                {t(l.key)}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="text-xs font-semibold px-2 py-1 rounded border border-slate-200 hover:border-brand hover:text-brand transition"
              title="Switch language / ቋንቋ ቀይር"
            >
              {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-700">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{t(user?.role) || user?.role}</div>
            </div>
            <Link to="/account" className="btn-ghost text-xs hidden sm:inline-flex">
              {t('account')}
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-xs">
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t border-slate-200 bg-white overflow-x-auto">
          <div className="flex gap-1 px-3 py-2">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium ${isActive ? 'bg-brand text-white' : 'text-slate-600'
                  }`
                }
              >
                {t(l.key)}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Arerti General Secondary & Preparatory School
        </div>
      </footer>
    </div>
  )
}
