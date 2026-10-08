import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// ── Admin grouped nav ─────────────────────────────────────────────────────────
const ADMIN_GROUPS = [
  {
    key: 'dashboard',
    to: '/admin',         // direct link — no dropdown
    single: true,
  },
  {
    key: 'navRegistration',
    items: [
      { to: '/admin/registration',        key: 'studentRegistration' },
      { to: '/admin/teacher-registration', key: 'teacherRegistration' },
    ],
  },
  {
    key: 'navAcademics',
    items: [
      { to: '/admin/classes',           key: 'classes' },
      { to: '/admin/subjects',          key: 'subjects' },
      { to: '/admin/grades',            key: 'gradebook' },
      { to: '/admin/attendance',        key: 'attendance' },
      { to: '/admin/grade-entry',       key: 'gradeEntryWindow' },
      { to: '/admin/regrade-requests',  key: 'regrade' },
    ],
  },
  {
    key: 'navManagement',
    items: [
      { to: '/admin/students',    key: 'students' },
      { to: '/admin/teachers',    key: 'teachers' },
      { to: '/notices',           key: 'noticeboard' },
      { to: '/admin/user-lookup', key: 'userlookup' },
      { to: '/admin/audit-log',   key: 'auditlog' },
    ],
  },
]

// Flat list for mobile (all items) and active detection
const ADMIN_ALL_LINKS = ADMIN_GROUPS.flatMap(g =>
  g.single ? [{ to: g.to, key: g.key }] : g.items
)

// Other roles keep flat nav
const ROLE_LINKS = {
  TEACHER: [
    { to: '/teacher',              key: 'dashboard' },
    { to: '/teacher/registration', key: 'registration' },
    { to: '/teacher/grades',       key: 'gradebook' },
    { to: '/teacher/attendance',   key: 'attendance' },
    { to: '/notices',              key: 'noticeboard' },
    { to: '/resources',            key: 'resources' },
  ],
  STUDENT: [
    { to: '/student',            key: 'dashboard' },
    { to: '/student/grades',     key: 'myGrades' },
    { to: '/student/attendance', key: 'myAttendance' },
    { to: '/notices',            key: 'notices' },
    { to: '/resources',          key: 'resources' },
  ],
  PARENT: [
    { to: '/parent',              key: 'dashboard' },
    { to: '/parent/children',     key: 'myChildren' },
    { to: '/parent/report-cards', key: 'reportCards' },
    { to: '/notices',             key: 'notices' },
    { to: '/resources',           key: 'resources' },
  ],
}

// ── Dropdown button component ─────────────────────────────────────────────────
function DropdownNav({ group, t, location }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Close on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Highlight the group button if any child route is active
  const isGroupActive = group.items.some(item =>
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition whitespace-nowrap
          ${isGroupActive
            ? 'bg-brand text-white'
            : 'text-slate-600 hover:text-brand hover:bg-brand/5'
          }`}
      >
        {t(group.key)}
        <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-xl shadow-lg py-1 min-w-[180px]">
          {group.items.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`block px-4 py-2 text-sm transition
                  ${active
                    ? 'bg-brand/10 text-brand font-semibold'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand'
                  }`}
              >
                {t(item.key)}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { lang, toggleLang, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Arerti" className="h-9 w-9 rounded-full object-cover shrink-0" />
            <div className="leading-tight hidden lg:block">
              <div className="font-display font-bold text-brand text-xs whitespace-nowrap">Arerti General Secondary</div>
              <div className="font-display font-bold text-brand text-xs whitespace-nowrap">& Preparatory School</div>
            </div>
            <div className="font-display font-bold text-brand text-sm lg:hidden whitespace-nowrap">Arerti</div>
          </Link>

          {/* Desktop nav */}
          <nav className="ml-4 hidden md:flex items-center gap-1 flex-1">
            {isAdmin ? (
              // Admin: 4-group dropdown nav
              ADMIN_GROUPS.map(group =>
                group.single ? (
                  <NavLink
                    key={group.to}
                    to={group.to}
                    end
                    className={({ isActive }) =>
                      `px-2 py-1 rounded-md text-xs font-medium transition whitespace-nowrap
                       ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand hover:bg-brand/5'}`
                    }
                  >
                    {t(group.key)}
                  </NavLink>
                ) : (
                  <DropdownNav key={group.key} group={group} t={t} location={location} />
                )
              )
            ) : (
              // Other roles: flat nav
              links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `px-2 py-1 rounded-md text-xs font-medium transition whitespace-nowrap
                     ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand hover:bg-brand/5'}`
                  }
                >
                  {t(l.key)}
                </NavLink>
              ))
            )}
          </nav>

          {/* Right side: lang toggle + user + account + logout */}
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

        {/* Mobile nav — flat list for all roles */}
        <nav className="md:hidden border-t border-slate-200 bg-white overflow-x-auto">
          <div className="flex gap-1 px-3 py-2">
            {(isAdmin ? ADMIN_ALL_LINKS : links).map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium
                   ${isActive ? 'bg-brand text-white' : 'text-slate-600'}`
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
