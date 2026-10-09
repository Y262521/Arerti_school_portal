import { useState, useRef, useEffect } from 'react'
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

// ── Admin grouped nav ─────────────────────────────────────────────────────────
const ADMIN_GROUPS = [
  {
    key: 'dashboard',
    to: '/admin',
    single: true,
  },
  {
    key: 'navRegistration',
    items: [
      { to: '/admin/registration',         key: 'studentRegistration' },
      { to: '/admin/teacher-registration', key: 'teacherRegistration' },
    ],
  },
  {
    key: 'navAcademics',
    items: [
      { to: '/admin/classes',          key: 'classes' },
      { to: '/admin/subjects',         key: 'subjects' },
      { to: '/admin/grades',           key: 'gradebook' },
      { to: '/admin/attendance',       key: 'attendance' },
      { to: '/admin/grade-entry',      key: 'gradeEntryWindow' },
      { to: '/admin/regrade-requests', key: 'regrade' },
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

const ADMIN_ALL_LINKS = ADMIN_GROUPS.flatMap(g =>
  g.single ? [{ to: g.to, key: g.key }] : g.items
)

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

// ── Dropdown nav button ────────────────────────────────────────────────────────
function DropdownNav({ group, t, location }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => { setOpen(false) }, [location.pathname])

  const isGroupActive = group.items.some(item =>
    location.pathname === item.to || location.pathname.startsWith(item.to + '/')
  )

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap
          ${isGroupActive
            ? 'bg-brand text-white shadow-sm'
            : 'text-slate-700 hover:text-brand hover:bg-brand/8'
          }`}
      >
        {t(group.key)}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 min-w-[200px]">
          {group.items.map(item => {
            const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/')
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition
                  ${active
                    ? 'bg-brand/10 text-brand'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand'
                  }`}
              >
                {active && <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />}
                {!active && <span className="w-1.5 h-1.5 shrink-0" />}
                {t(item.key)}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Hamburger icon ─────────────────────────────────────────────────────────────
function HamburgerIcon({ open }) {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  )
}

// ── Main Layout ────────────────────────────────────────────────────────────────
export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { lang, toggleLang, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const isAdmin = user?.role === 'ADMIN'
  const links = ROLE_LINKS[user?.role] || []
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const mobileLinks = isAdmin ? ADMIN_ALL_LINKS : links

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white/98 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-18 flex items-center gap-3" style={{ height: '72px' }}>

          {/* Logo & School Name */}
          <Link to="/" className="flex items-center gap-2 sm:gap-2.5 shrink-0 mr-2 min-w-0">
            <img src="/logo.png" alt="Arerti" className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0 shadow-sm" />
            <div className="leading-tight min-w-0">
              <div className="font-display font-bold text-brand text-xs sm:text-sm whitespace-nowrap">Arerti General Secondary</div>
              <div className="font-display font-bold text-brand text-[10px] sm:text-xs whitespace-nowrap text-slate-500">& Preparatory School</div>
            </div>
          </Link>

          {/* Desktop nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-1.5 flex-1">
            {isAdmin ? (
              ADMIN_GROUPS.map(group =>
                group.single ? (
                  <NavLink
                    key={group.to}
                    to={group.to}
                    end
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap
                       ${isActive
                          ? 'bg-brand text-white shadow-sm'
                          : 'text-slate-700 hover:text-brand hover:bg-brand/8'}`
                    }
                  >
                    {t(group.key)}
                  </NavLink>
                ) : (
                  <DropdownNav key={group.key} group={group} t={t} location={location} />
                )
              )
            ) : (
              links.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap
                     ${isActive
                        ? 'bg-brand text-white shadow-sm'
                        : 'text-slate-700 hover:text-brand hover:bg-brand/8'}`
                  }
                >
                  {t(l.key)}
                </NavLink>
              ))
            )}
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-brand hover:text-brand transition hidden sm:flex items-center gap-1"
              title="Switch language / ቋንቋ ቀይር"
            >
              {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
            </button>

            {/* User info — hidden on small screens */}
            <div className="text-right hidden lg:block">
              <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{t(user?.role) || user?.role}</div>
            </div>

            {/* Account link — hidden on mobile */}
            <Link to="/account" className="btn-ghost text-sm hidden sm:inline-flex">
              {t('account')}
            </Link>

            {/* Logout — hidden on mobile */}
            <button onClick={handleLogout} className="btn-ghost text-sm hidden sm:inline-flex">
              {t('logout')}
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMobileOpen(o => !o)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-brand hover:bg-brand/5 transition"
              aria-label="Menu"
            >
              <HamburgerIcon open={mobileOpen} />
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white">
            {/* Nav links */}
            <nav className="px-4 py-3 space-y-1">
              {mobileLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition
                     ${isActive
                        ? 'bg-brand text-white'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-brand'}`
                  }
                >
                  {t(l.key)}
                </NavLink>
              ))}
            </nav>

            {/* Mobile bottom actions */}
            <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-800">{user?.fullName}</div>
                <div className="text-xs text-slate-500">{t(user?.role) || user?.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleLang}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-brand hover:text-brand transition"
                >
                  {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
                </button>
                <Link to="/account" className="btn-ghost text-sm" onClick={() => setMobileOpen(false)}>
                  {t('account')}
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sm">
                  {t('logout')}
                </button>
              </div>
            </div>
          </div>
        )}
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
