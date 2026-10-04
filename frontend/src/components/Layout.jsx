import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLE_LINKS = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/students', label: 'Students' },
    { to: '/admin/teachers', label: 'Teachers' },
    { to: '/admin/classes', label: 'Classes' },
    { to: '/admin/subjects', label: 'Subjects' },
    { to: '/admin/grades', label: 'Gradebook' },
    { to: '/admin/attendance', label: 'Attendance' },
    { to: '/admin/regrade-requests', label: 'Regrade' },
    { to: '/notices', label: 'Notice Board' },
    { to: '/resources', label: 'Resources' },
    { to: '/admin/audit-log', label: 'Audit Log' },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Dashboard' },
    { to: '/teacher/grades', label: 'Gradebook' },
    { to: '/teacher/attendance', label: 'Attendance' },
    { to: '/notices', label: 'Notice Board' },
    { to: '/resources', label: 'Resources' },
  ],
  STUDENT: [
    { to: '/student', label: 'Dashboard' },
    { to: '/student/grades', label: 'My Grades' },
    { to: '/student/attendance', label: 'Attendance' },
    { to: '/notices', label: 'Notices' },
    { to: '/resources', label: 'Resources' },
  ],
  PARENT: [
    { to: '/parent', label: 'Dashboard' },
    { to: '/parent/children', label: 'My Children' },
    { to: '/parent/report-cards', label: 'Report Cards' },
    { to: '/notices', label: 'Notices' },
    { to: '/resources', label: 'Resources' },
  ]
}

export default function Layout({ children }) {
  const { user, logout } = useAuth()
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
          <Link to="/" className="flex items-center gap-3">
            <img src="/logo.png" alt="Arerti" className="h-10 w-10 rounded-full object-cover" />
            <div className="leading-tight">
              <div className="font-display font-bold text-brand text-sm">Arerti General and Secondary</div>
              <div className="font-display font-bold text-brand text-sm">Preparatory School</div>
              <div className="text-xs text-slate-500 hidden sm:block">Digital Portal</div>
            </div>
          </Link>

          <nav className="ml-6 hidden md:flex items-center gap-1 flex-1">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-medium transition ${isActive ? 'bg-brand text-white' : 'text-slate-600 hover:text-brand hover:bg-brand/5'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-700">{user?.fullName}</div>
              <div className="text-xs text-slate-500">{user?.role}</div>
            </div>
            <Link to="/account" className="btn-ghost text-xs hidden sm:inline-flex">
              Account
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-xs">
              Logout
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
                {l.label}
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
          © {new Date().getFullYear()} Arerti General and Secondary Preparatory School
        </div>
      </footer>
    </div>
  )
}
