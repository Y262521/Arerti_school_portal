import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

/** Tiny card used on every role dashboard. */
function StatCard({ label, value, hint, color = 'brand' }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-bold text-${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  )
}

function DashboardHeader({ title, subtitle, cta }) {
  return (
    <div className="flex items-end justify-between mb-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {cta}
    </div>
  )
}

export function AdminDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(r => setStats(r.data))
      .catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader
        title={`Welcome, ${user?.fullName}`}
        subtitle="Overview of the school system"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/students" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Students</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.studentCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">Manage →</div>
        </Link>
        <Link to="/admin/teachers" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Teachers</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.teacherCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">Manage →</div>
        </Link>
        <Link to="/admin/classes" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Classes</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.classCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">Manage →</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Notices</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.noticeCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">Manage →</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <Link to="/admin/grades" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Gradebook</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Enter & review grades</div>
        </Link>
        <Link to="/admin/attendance" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Attendance</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Mark & review attendance</div>
        </Link>
        <Link to="/admin/subjects" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Subjects</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Manage subjects & grades</div>
        </Link>
        <Link to="/resources" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Resources</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Upload & manage study materials</div>
        </Link>
        <Link to="/admin/audit-log" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Audit Log</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Review system activity</div>
        </Link>
      </div>

      <div className="mt-8 card">
        <h2 className="font-display font-semibold text-lg text-slate-900">System Status</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          <li>✅ JWT authentication with 4 roles (Admin, Teacher, Student, Parent)</li>
          <li>✅ Student &amp; Teacher CRUD with auto-generated UIDs</li>
          <li>✅ Class / Section management</li>
          <li>✅ Subject management</li>
          <li>✅ Gradebook — per-section spreadsheet, upsert grades</li>
          <li>✅ Attendance — per-section per-day, mark-all shortcuts</li>
          <li>✅ Report cards — grades + attendance aggregation, letter grades</li>
          <li>✅ Notice board with audience targeting &amp; pinning</li>
          <li>✅ Resource repository with authenticated file download</li>
          <li>✅ Parent portal — link children by UID, view report cards</li>
          <li>✅ Student self-service — grades, attendance, notices</li>
          <li>✅ Password change for all users</li>
          <li>✅ Audit log — append-only event trail</li>
          <li>✅ MySQL (structured) + MongoDB (flexible) dual-database</li>
          <li>✅ PWA-ready service worker</li>
        </ul>
      </div>
    </div>
  )
}

export function TeacherDashboard() {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader title={`Hello, ${user?.fullName}`} subtitle="Teacher workspace" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/teacher/grades" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Gradebook</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Enter & manage grades</div>
        </Link>
        <Link to="/teacher/attendance" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Attendance</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Mark daily attendance</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Notices</div>
          <div className="mt-1 text-3xl font-bold text-brand">{notices.length}</div>
          <div className="mt-1 text-xs text-slate-500">View notice board</div>
        </Link>
      </div>
      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3">Latest Notices</h2>
          <ul className="space-y-2">
            {notices.map(n => (
              <li key={n.id} className="text-sm text-slate-600 flex gap-2">
                {n.pinned && <span className="text-brand">📌</span>}
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function StudentDashboard() {
  const { user } = useAuth()
  const [report, setReport] = useState(null)
  const currentYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

  useEffect(() => {
    // Use /students/me — the admin-only list endpoint is not accessible to STUDENT role
    api.get('/students/me').then(r => {
      const me = r.data
      if (me?.id) {
        api.get(`/report-card/${me.id}`, { params: { term: 1, academicYear: currentYear } })
          .then(rc => setReport(rc.data))
          .catch(() => { })
      }
    }).catch(() => { })
  }, [user])

  return (
    <div>
      <DashboardHeader title={`Hi, ${user?.fullName}`} subtitle="Your school snapshot" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/student/grades" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Average</div>
          <div className="mt-1 text-3xl font-bold text-brand">
            {report?.average ? report.average.toFixed(1) : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">{report?.overallGrade || 'View grades →'}</div>
        </Link>
        <Link to="/student/attendance" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Attendance</div>
          <div className={`mt-1 text-3xl font-bold ${report?.attendancePercent >= 75 ? 'text-green-600' : report ? 'text-red-600' : 'text-brand'}`}>
            {report ? `${report.attendancePercent}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {report ? `${report.presentDays}/${report.totalDays} days` : 'View attendance →'}
          </div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Notices</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">View notice board</div>
        </Link>
      </div>
    </div>
  )
}

export function ParentDashboard() {
  const { user } = useAuth()
  const [notices, setNotices] = useState([])
  const [children, setChildren] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => { })
    api.get('/parent/children').then(r => setChildren(r.data)).catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader title={`Welcome, ${user?.fullName}`} subtitle="Track your child's progress" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/parent/children" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Linked Children</div>
          <div className="mt-1 text-3xl font-bold text-brand">{children.length}</div>
          <div className="mt-1 text-xs text-slate-500">Manage →</div>
        </Link>
        <Link to="/parent/report-cards" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Report Cards</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">View grades & attendance</div>
        </Link>
        <Link to="/resources" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Resources</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">Browse study materials</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">Notices</div>
          <div className="mt-1 text-3xl font-bold text-brand">{notices.length}</div>
          <div className="mt-1 text-xs text-slate-500">View notice board →</div>
        </Link>
      </div>
      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3">Latest Notices</h2>
          <ul className="space-y-2">
            {notices.map(n => (
              <li key={n.id} className="text-sm text-slate-600 flex gap-2">
                {n.pinned && <span className="text-brand">📌</span>}
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {children.length === 0 && (
        <div className="card mt-4 text-sm text-slate-600">
          Link your account to your child via their <strong>Student UID</strong> (e.g. <code>STU-2026-001</code>) —
          go to <Link to="/parent/children" className="text-brand hover:underline">My Children</Link> to get started.
        </div>
      )}
    </div>
  )
}
