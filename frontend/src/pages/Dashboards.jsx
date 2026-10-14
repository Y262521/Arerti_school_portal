import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'brand' }) {
  const colors = {
    brand:  'bg-brand/10 text-brand border-brand/20',
    green:  'bg-green-50 text-green-700 border-green-200',
    amber:  'bg-amber-50 text-amber-700 border-amber-200',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
  }
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${colors[color]}`}>
      <span className="text-lg font-bold">{value ?? '—'}</span>
      <span className="font-medium opacity-80">{label}</span>
    </div>
  )
}

// ── Feature chip ──────────────────────────────────────────────────────────────
function Chip({ icon, text }) {
  return (
    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 shadow-sm">
      <span className="text-base">{icon}</span>
      <span>{text}</span>
    </div>
  )
}

// ── Welcome banner ────────────────────────────────────────────────────────────
function WelcomeBanner({ name, role, tagline, description, chips, stats, gradient }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-md mb-8 ${gradient}`}>
      {/* Top section */}
      <div className="px-6 pt-6 pb-4 text-white">
        <p className="text-sm font-medium opacity-80 uppercase tracking-widest mb-1">{role}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-tight">{name}</h1>
        <p className="mt-1 text-sm sm:text-base opacity-90 font-medium">{tagline}</p>
      </div>

      {/* Stats row */}
      {stats && stats.length > 0 && (
        <div className="px-6 pb-4 flex flex-wrap gap-2">
          {stats.map((s, i) => (
            <div key={i} className="bg-white/20 backdrop-blur rounded-lg px-3 py-1.5 text-white text-sm font-semibold">
              <span className="text-white/70 font-normal mr-1">{s.label}:</span>{s.value ?? '—'}
            </div>
          ))}
        </div>
      )}

      {/* Description + chips */}
      <div className="bg-white/95 px-6 py-5">
        <p className="text-slate-600 text-sm leading-relaxed mb-4">{description}</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => <Chip key={i} icon={c.icon} text={c.text} />)}
        </div>
      </div>
    </div>
  )
}

// ── Director Dashboard ────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const name = user?.fullName === 'System Administrator'
    ? (t('ADMIN') || 'School Director')
    : user?.fullName

  return (
    <WelcomeBanner
      name={`${t('welcomeAdmin')}, ${name}`}
      role={t('ADMIN')}
      tagline={t('directorOverview')}
      gradient="bg-gradient-to-br from-brand-dark via-brand to-emerald-500"
      stats={[
        { label: t('students'), value: stats?.studentCount },
        { label: t('teachers'), value: stats?.teacherCount },
        { label: t('classes'),  value: stats?.classCount  },
        { label: t('noticeboard'), value: stats?.noticeCount },
      ]}
      description={
        `As the school director, you have full oversight of Arerti General Secondary & Preparatory School's digital portal. ` +
        `From here you can manage every aspect of the school — register students and teachers, organise classes and subjects, ` +
        `control grade submission periods, review regrade requests, post notices, upload resources, and audit all system activity. ` +
        `Use the navigation bar above to move between sections.`
      }
      chips={[
        { icon: '🎓', text: 'Student & Teacher Registration' },
        { icon: '📚', text: 'Classes & Subjects' },
        { icon: '📝', text: 'Gradebook & Grade Submission' },
        { icon: '📋', text: 'Attendance Tracking' },
        { icon: '🔄', text: 'Regrade Requests' },
        { icon: '📣', text: 'Notice Board' },
        { icon: '📁', text: 'Resources' },
        { icon: '🔍', text: 'User Lookup & Audit Log' },
      ]}
    />
  )
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [notices, setNotices] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => {})
  }, [])

  return (
    <>
      <WelcomeBanner
        name={`${t('helloTeacher')}, ${user?.fullName}`}
        role={t('TEACHER')}
        tagline={t('teacherWorkspace')}
        gradient="bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500"
        stats={[
          { label: t('notices'), value: notices.length },
        ]}
        description={
          `Welcome to your teacher workspace. Use the navigation bar to access all your tools. ` +
          `You can enter and manage student grades for your assigned subjects, mark daily attendance for your homeroom class, ` +
          `register new students during open registration periods, and submit regrade requests when a correction is needed. ` +
          `Stay updated with the latest school notices and share learning materials through the resources section.`
        }
        chips={[
          { icon: '✏️', text: 'Enter & Manage Grades' },
          { icon: '📋', text: 'Mark Homeroom Attendance' },
          { icon: '📝', text: 'Student Registration' },
          { icon: '🔄', text: 'Request Regrade Permission' },
          { icon: '📣', text: 'Notice Board' },
          { icon: '📁', text: 'Resources' },
        ]}
      />

      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📌</span> {t('latestNotices')}
          </h2>
          <ul className="space-y-2">
            {notices.map(n => (
              <li key={n.id} className="text-sm text-slate-600 flex gap-2 items-start">
                <span className="text-brand mt-0.5">›</span>
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

// ── Student Dashboard ─────────────────────────────────────────────────────────
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
          .catch(() => {})
      }
    }).catch(() => {})
  }, [user])

  return (
    <WelcomeBanner
      name={`${t('hiStudent')}, ${user?.fullName}`}
      role={t('STUDENT')}
      tagline={t('yourSchoolSnapshot')}
      gradient="bg-gradient-to-br from-violet-700 via-purple-600 to-pink-500"
      stats={[
        { label: t('average'),    value: report?.average ? report.average.toFixed(1) : null },
        { label: t('attendance'), value: report ? `${report.attendancePercent}%` : null },
        { label: t('semester'),   value: report ? `${t('semester')} 1` : null },
      ]}
      description={
        `Welcome to your student portal at Arerti General Secondary & Preparatory School. ` +
        `Here you can view your complete academic history — your grades for each subject across all semesters, ` +
        `your attendance record with a full day-by-day breakdown, and your overall performance per batch. ` +
        `You can also read school notices and access study resources uploaded by your teachers. ` +
        `Your registration history with semester results is available in the My Grades section.`
      }
      chips={[
        { icon: '📊', text: 'My Grades & Results' },
        { icon: '📋', text: 'Attendance Record' },
        { icon: '📣', text: 'School Notices' },
        { icon: '📁', text: 'Study Resources' },
        { icon: '🏅', text: 'Semester Pass/Fail Status' },
        { icon: '👤', text: 'My Account' },
      ]}
    />
  )
}

// ── Parent Dashboard ──────────────────────────────────────────────────────────
export function ParentDashboard() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [notices, setNotices] = useState([])
  const [children, setChildren] = useState([])

  useEffect(() => {
    api.get('/notices').then(r => setNotices(r.data.slice(0, 3))).catch(() => {})
    api.get('/parent/children').then(r => setChildren(r.data)).catch(() => {})
  }, [])

  return (
    <>
      <WelcomeBanner
        name={`${t('welcomeParent')}, ${user?.fullName}`}
        role={t('PARENT')}
        tagline={t('trackChildProgress')}
        gradient="bg-gradient-to-br from-rose-600 via-orange-500 to-amber-400"
        stats={[
          { label: t('linkedChildren'), value: children.length },
          { label: t('notices'),        value: notices.length  },
        ]}
        description={
          `Welcome to the parent portal of Arerti General Secondary & Preparatory School. ` +
          `This portal gives you full visibility into your child's academic journey. ` +
          `You can view their complete grade history across all semesters and batches, ` +
          `track their daily attendance record, and see their promotion or retention status for each year. ` +
          `To get started, link your child's account using their Student ID in the My Children section. ` +
          `School notices are also available to keep you informed of important updates.`
        }
        chips={[
          { icon: '👨‍👩‍👧', text: 'Link & Manage Children' },
          { icon: '📊', text: "View Child's Grade History" },
          { icon: '📋', text: 'Child Attendance Record' },
          { icon: '🏅', text: 'Semester Promotion Status' },
          { icon: '📣', text: 'School Notices' },
        ]}
      />

      {notices.length > 0 && (
        <div className="card">
          <h2 className="font-display font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <span>📌</span> {t('latestNotices')}
          </h2>
          <ul className="space-y-2">
            {notices.map(n => (
              <li key={n.id} className="text-sm text-slate-600 flex gap-2 items-start">
                <span className="text-brand mt-0.5">›</span>
                <span>{n.title}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {children.length === 0 && (
        <div className="card border-amber-200 bg-amber-50 mt-4">
          <p className="text-sm text-amber-800 font-medium">
            💡 {t('linkChildInstructions').replace('My Children', '')}
            <span className="text-brand font-semibold"> {t('myChildren')}</span>.
          </p>
        </div>
      )}
    </>
  )
}
