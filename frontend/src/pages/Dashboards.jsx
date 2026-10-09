import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'

function DashboardHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">{title}</h1>
      {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

function NavCard({ to, labelKey, value, descKey, highlight }) {
  const { t } = useLanguage()
  return (
    <Link to={to} className={`card hover:shadow-md transition cursor-pointer ${highlight ? 'border-brand/20 bg-brand/5' : ''}`}>
      <div className={`text-xs uppercase tracking-wide font-semibold ${highlight ? 'text-brand' : 'text-slate-500'}`}>
        {t(labelKey)}
      </div>
      <div className="mt-1 text-3xl font-bold text-brand">{value || '→'}</div>
      <div className="mt-1 text-xs text-slate-500">{t(descKey)}</div>
    </Link>
  )
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader
        title={`${t('welcomeAdmin')}, ${user?.fullName}`}
        subtitle={t('directorOverview')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/students" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('students')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.studentCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageStudents')} →</div>
        </Link>
        <Link to="/admin/teachers" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('teachers')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.teacherCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageTeachers')} →</div>
        </Link>
        <Link to="/admin/classes" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('classes')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.classCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageClasses')} →</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('noticeboard')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{stats ? stats.noticeCount : '—'}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageNotices')} →</div>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <NavCard to="/admin/registration" labelKey="studentRegistrationCard" descKey="studentRegistrationDesc" />
        <NavCard to="/admin/grades" labelKey="gradebookCard" descKey="gradebookDesc" />
        <NavCard to="/admin/attendance" labelKey="attendanceCard" descKey="attendanceDesc" />
        <NavCard to="/admin/subjects" labelKey="subjectsCard" descKey="subjectsDesc" />
        <NavCard to="/admin/regrade-requests" labelKey="regradeCard" descKey="regradeDesc" />
        <NavCard to="/resources" labelKey="resourcesCard" descKey="resourcesDesc" />
        <NavCard to="/admin/grade-entry" labelKey="gradeEntryCard" descKey="gradeEntryDesc" />
        <NavCard to="/admin/user-lookup" labelKey="userLookupCard" descKey="userLookupDesc" />
        <NavCard to="/admin/audit-log" labelKey="auditLogCard" descKey="auditLogDesc" />
      </div>
    </div>
  )
}

export function TeacherDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [notices, setNotices] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader title={`${t('helloTeacher')}, ${user?.fullName}`} subtitle={t('teacherWorkspace')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/teacher/grades" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('gradebook')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">{t('enterGrades')}</div>
        </Link>
        <Link to="/teacher/attendance" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('attendance')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">{t('markAttendance')}</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('notices')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{notices.length}</div>
          <div className="mt-1 text-xs text-slate-500">{t('viewNotices')}</div>
        </Link>
      </div>
      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3">{t('latestNotices')}</h2>
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
  const { t } = useLanguage()
  const [report, setReport] = useState(null)
  const currentYear = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

  useEffect(() => {
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
      <DashboardHeader title={`${t('hiStudent')}, ${user?.fullName}`} subtitle={t('yourSchoolSnapshot')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/student/grades" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('average')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">
            {report?.average ? report.average.toFixed(1) : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">{report?.overallGrade || `${t('viewGradesArrow')} →`}</div>
        </Link>
        <Link to="/student/attendance" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('attendance')}</div>
          <div className={`mt-1 text-3xl font-bold ${report?.attendancePercent >= 75 ? 'text-green-600' : report ? 'text-red-600' : 'text-brand'}`}>
            {report ? `${report.attendancePercent}%` : '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500">
            {report ? `${report.presentDays}/${report.totalDays} ${t('presentDays')}` : `${t('viewAttendanceArrow')} →`}
          </div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('notices')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">{t('viewNotices')}</div>
        </Link>
      </div>
    </div>
  )
}

export function ParentDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [notices, setNotices] = useState([])
  const [children, setChildren] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => { })
    api.get('/parent/children').then(r => setChildren(r.data)).catch(() => { })
  }, [])

  return (
    <div>
      <DashboardHeader title={`${t('welcomeParent')}, ${user?.fullName}`} subtitle={t('trackChildProgress')} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Link to="/parent/children" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('linkedChildren')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{children.length}</div>
          <div className="mt-1 text-xs text-slate-500">{t('manageStudents')} →</div>
        </Link>
        <Link to="/parent/report-cards" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('reportCards')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">{t('viewGradesArrow')} &amp; {t('viewAttendanceArrow')}</div>
        </Link>
        <Link to="/resources" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('resources')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">→</div>
          <div className="mt-1 text-xs text-slate-500">{t('resourcesDesc')}</div>
        </Link>
        <Link to="/notices" className="card hover:shadow-md transition cursor-pointer">
          <div className="text-xs uppercase tracking-wide text-slate-500">{t('notices')}</div>
          <div className="mt-1 text-3xl font-bold text-brand">{notices.length}</div>
          <div className="mt-1 text-xs text-slate-500">{t('viewNotices')}</div>
        </Link>
      </div>
      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3">{t('latestNotices')}</h2>
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
          {t('linkChildInstructions').replace('My Children', '')}
          <Link to="/parent/children" className="text-brand hover:underline">{t('myChildren')}</Link>
          {' '}{t('linkChildInstructions').split('My Children').slice(-1)[0] || ''}
        </div>
      )}
    </div>
  )
}
