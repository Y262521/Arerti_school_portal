import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'

// ── Shared green gradient — used by all dashboards ────────────────────────────
const GRADIENT = 'bg-gradient-to-br from-brand-dark via-brand to-emerald-500'

// ── Welcome banner — same design for all roles ────────────────────────────────
function WelcomeBanner({ name, role, stats, lines }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg mb-8 ${GRADIENT}`}>

      {/* Header */}
      <div className="px-6 pt-7 pb-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">{role}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug">{name}</h1>
      </div>

      {/* Stats pills — only shown when data exists */}
      {stats && stats.some(s => s.value != null) && (
        <div className="px-6 pb-5 flex flex-wrap gap-2">
          {stats.filter(s => s.value != null).map((s, i) => (
            <div key={i} className="bg-white/25 backdrop-blur-sm rounded-xl px-4 py-2 text-white flex items-center gap-2">
              <span className="text-xl font-black">{s.value}</span>
              <span className="text-sm opacity-85">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* "What I do" lines — white text on green */}
      <div className="px-6 pb-7 pt-1">
        <ul className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 text-lg shrink-0">{line.icon}</span>
              <p className="text-sm text-white/90 leading-relaxed">
                <span className="font-semibold text-white">{line.title} — </span>
                {line.detail}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ── Director Dashboard ────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const name = user?.fullName === 'System Administrator'
    ? (t('ADMIN') || 'School Director')
    : user?.fullName

  const lines = lang === 'am' ? [
    { icon: '🎓', title: 'ተማሪዎችን እና አስተማሪዎችን እመዘግባለሁ', detail: 'አዲስ ተማሪዎችን ወደ ትምህርት ቤቱ እመዘግባለሁ፣ አስተማሪዎችን ቀጥሬ ሥራ ላይ አሰማራለሁ።' },
    { icon: '📚', title: 'ክፍሎችን እና ትምህርቶችን አዋቅራለሁ', detail: 'የትምህርት ክፍሎችን እፈጥራለሁ፣ ለእያንዳንዱ ክፍል ትምህርቶችን እመድባለሁ፣ ሥርዓተ ትምህርት አዘጋጃለሁ።' },
    { icon: '📝', title: 'የውጤት ማስረከቢያ ጊዜ እቆጣጠራለሁ', detail: 'ለፈተና ውጤት ማስረከቢያ ጊዜ እከፍታለሁ፣ አስተማሪዎች ውጤቶችን ሲያስገቡ እቆጣጠራለሁ፣ ቆልፎ ምልክቶችን ለድጋሚ ምዘና ፈቃድ እሰጣለሁ።' },
    { icon: '📋', title: 'ክትትሉን እከታተላለሁ', detail: 'ለሁሉም ክፍሎች ዕለታዊ የክትትል ሪፖርቶችን ማየት ይቻለኛል።' },
    { icon: '📣', title: 'ማስታወቂያዎችን ለጥፋለሁ', detail: 'ለተማሪዎች፣ ለወላጆች፣ ለሰራተኞች ወይም ለሁሉም ሰው ማስታወቂያ ምስሎችን ጨምሮ ለጥፋለሁ።' },
    { icon: '📁', title: 'ሃብቶችን አስተዳድራለሁ', detail: 'የጥናት ቁሳቁሶችን፣ ሰነዶችን እና ፋይሎችን ለተማሪዎች እና ሰራተኞች አዘጋጃለሁ።' },
    { icon: '🔍', title: 'ተጠቃሚዎችን እፈልጋለሁ እና ኦዲት አደርጋለሁ', detail: 'ማንኛውም ተጠቃሚ ፈልጎ የይለፍ ቃሉን ዳግም ማስጀምር ይቻለኛል። የሥርዓቱ ሙሉ እንቅስቃሴ ይታየኛል።' },
  ] : [
    { icon: '🎓', title: 'You can register students and teachers', detail: 'You can enrol new students into the school, hire teachers, and create their accounts so they can access the portal.' },
    { icon: '📚', title: 'You can organise classes and subjects', detail: 'You can create class sections, assign subjects to each class, set up the grade curriculum, and assign teachers to their subjects.' },
    { icon: '📝', title: 'You can control grade submission', detail: 'You can open and close the grade submission window after exams, and approve regrade requests from homeroom teachers when marks need correction.' },
    { icon: '📋', title: 'You can monitor attendance', detail: 'You can view daily attendance reports for any class across the school to track student presence.' },
    { icon: '📣', title: 'You can post school notices', detail: 'You can publish announcements for students, parents, staff, or everyone — with photos if needed.' },
    { icon: '📁', title: 'You can manage resources', detail: 'You can upload study materials, documents and files that students and teachers can access.' },
    { icon: '🔍', title: 'You can look up users and review audit logs', detail: 'You can find any user, reset their password, and see a full trail of all system activity.' },y.' },
  ]

  return (
    <WelcomeBanner
      name={`${t('welcomeAdmin')}, ${name}`}
      role={t('ADMIN')}
      stats={[
        { label: t('students'),    value: stats?.studentCount },
        { label: t('teachers'),    value: stats?.teacherCount },
        { label: t('classes'),     value: stats?.classCount   },
      ]}
      lines={lines}
    />
  )
}

// ── Teacher Dashboard ─────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()

  const lines = lang === 'am' ? [
    { icon: '✏️', title: 'ለተማሪዎቼ ውጤቶችን እሰጣለሁ', detail: 'ለተሰጠኝ ትምህርት ውጤቶችን አስገባለሁ — የወቅት፣ የዓመት ፈተና፣ የቤት ሥራ እና ጥያቄ/ፈተና። ውጤቶቹ ከተቀመጡ በኋላ ይቆለፋሉ።' },
    { icon: '📋', title: 'ለክፍሌ ክትትሉን ምዘግባለሁ', detail: 'እኔ የሆምሩም አስተማሪ ከሆንኩ ለክፍሌ ዕለታዊ ክትትሉን ምዘግባለሁ — ተገኝቷል፣ አልተገኘም፣ ዘግይቷል ወይም ፈቃድ አለው።' },
    { icon: '📝', title: 'ተማሪዎችን ምዘግባለሁ', detail: 'ምዝገባ ሲከፈት አዲስ ወይም ቀደም ሲል የነበሩ ተማሪዎችን ምዘግባለሁ።' },
    { icon: '🔄', title: 'ቆልፎ ምልክቶች ለማስተካከል ፈቃድ እጠይቃለሁ', detail: 'እኔ ሆምሩም አስተማሪ ከሆንኩ፣ ቆልፎ ውጤቶችን ለማስተካከል ከዳይሬክተሩ ፈቃድ ለመጠየቅ ችላለሁ።' },
  ] : [
    { icon: '✏️', title: 'You can enter grades for your students', detail: 'You can submit marks for your assigned subjects — mid exam, final exam, assignment and test/quiz. Grades are locked after submission.' },
    { icon: '📋', title: 'You can mark attendance for your class', detail: 'As a homeroom teacher you can record daily attendance for your class — present, absent, late or excused.' },
    { icon: '📝', title: 'You can register students', detail: 'When registration is open you can enrol new or existing students into the school for the new academic year.' },
    { icon: '🔄', title: 'You can request regrade permission', detail: 'As a homeroom teacher you can request the director\'s approval to correct locked marks when a mistake is found.' },
  ]

  return (
    <WelcomeBanner
      name={`${t('helloTeacher')}, ${user?.fullName}`}
      role={t('TEACHER')}
      stats={[]}
      lines={lines}
    />
  )
}

// ── Student Dashboard ─────────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [report, setReport] = useState(null)
  const [semLabel, setSemLabel] = useState(null)

  useEffect(() => {
    // Fetch the most recent report card by trying sem2 first, then sem1
    api.get('/students/me').then(async r => {
      const me = r.data
      if (!me?.id) return
      // Try to get the latest from grade history
      try {
        const hist = await api.get('/student/my-grade-history').then(h => h.data)
        if (hist && hist.length > 0) {
          const latest = hist[hist.length - 1]
          // Try sem2 first, then sem1
          if (latest.sem2Average != null) {
            setReport({ average: latest.sem2Average, attendancePercent: null })
            setSemLabel(`${t('semester')} 2 · ${latest.academicYear}`)
          } else if (latest.sem1Average != null) {
            setReport({ average: latest.sem1Average, attendancePercent: null })
            setSemLabel(`${t('semester')} 1 · ${latest.academicYear}`)
          }
        }
      } catch {
        // fallback to report card API
        const cy = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
        for (const term of [2, 1]) {
          try {
            const rc = await api.get(`/report-card/${me.id}`, { params: { term, academicYear: cy } }).then(x => x.data)
            if (rc?.grades?.length > 0) {
              setReport(rc)
              setSemLabel(`${t('semester')} ${term} · ${cy}`)
              break
            }
          } catch {}
        }
      }
    }).catch(() => {})
  }, [user])

  const lines = lang === 'am' ? [
    { icon: '📊', title: 'ውጤቶቼን እና ታሪኬን አያለሁ', detail: 'በሁሉም ሴሜስተሮች እና ዙሮች ያሉ ውጤቶቼን፣ ያለፍኩ ወይም ያልወጣሁ ሁኔታዬን፣ ዓመታዊ አማካዬን ማየት ይቻለኛል።' },
    { icon: '📋', title: 'ክትትሌን አረጋግጣለሁ', detail: 'ዕለቱን፣ ሁኔታዬን (ተገኝቻለሁ፣ አልተገኘሁም፣ ዘግይቻለሁ) እና ምን ያህል ቀናት ክፍል ውስጥ ነበርኩ ማየት ይቻለኛል።' },
    { icon: '📣', title: 'የትምህርት ቤቱን ማስታወቂያዎች ሳብ አነብባለሁ', detail: 'ዳይሬክተሩ ለተማሪዎች ወይም ለሁሉም ሰው የሚለጥፈውን ማስታወቂያ ማንበብ ይቻለኛል።' },
  ] : [
    { icon: '📊', title: 'You can view your grades and academic history', detail: 'You can see all your subject scores across every semester and batch, your pass or fail status each year, and your annual average.' },
    { icon: '📋', title: 'You can check your attendance record', detail: 'You can see each day\'s status — present, absent, late or excused — and how many school days you have attended.' },
    { icon: '📣', title: 'You can read school notices', detail: 'You can read announcements posted by the director for students or for the whole school.' },
  ]

  return (
    <WelcomeBanner
      name={`${t('hiStudent')}, ${user?.fullName}`}
      role={t('STUDENT')}
      stats={[
        { label: t('average'),    value: report?.average != null ? Number(report.average).toFixed(1) : null },
        { label: t('attendance'), value: report?.attendancePercent != null ? `${report.attendancePercent}%` : null },
        { label: semLabel,        value: semLabel ? '📅' : null },
      ].filter(s => s.label && s.value)}
      lines={lines}
    />
  )
}

// ── Parent Dashboard ──────────────────────────────────────────────────────────
export function ParentDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [children, setChildren] = useState([])

  useEffect(() => {
    api.get('/parent/children').then(r => setChildren(r.data)).catch(() => {})
  }, [])

  const lines = lang === 'am' ? [
    { icon: '👨‍👩‍👧', title: 'ልጄን አያያዛለሁ', detail: 'የልጄን Student ID ተጠቅሜ ፕሮፋይሉን ከሂሳቤ ጋር ማያያዝ ይቻለኛል። ከአንድ በላይ ልጅ ካለ ሁሉንም ማስጠጋት ይቻለኛል።' },
    { icon: '📊', title: 'የልጄን ውጤቶች አያለሁ', detail: 'ልጄ ለሁሉም ሴሜስተሮች ያስመዘገባቸው ውጤቶች፣ ዓመታዊ አማካይ እና ያለፈ ወይም ያልወጣ ሁኔታ ማየት ይቻለኛል።' },
    { icon: '📋', title: 'የልጄን ክትትል ሂደት ክትትዬ ሳደርጋለሁ', detail: 'ልጄ ወደ ትምህርት ቤቱ ዕለቱን ተገኝቷል ወይ? ዘግይቷል ወይ? ፈቃድ ነበረው ወይ? ሁሉንም ማየት ይቻለኛል።' },
    { icon: '📣', title: 'ማስታወቂያዎችን አነብባለሁ', detail: 'ዳይሬክተሩ ለወላጆች ወይም ለሁሉም ሰው የሚለጥፈውን ማስታወቂያ ማንበብ ይቻለኛል።' },
  ] : [
    { icon: '👨‍👩‍👧', title: 'You can link and manage your child', detail: 'You can connect your child\'s school profile to your account using their Student ID. If you have more than one child at the school you can link all of them.' },
    { icon: '📊', title: 'You can view your child\'s grades', detail: 'You can see all your child\'s subject scores across every semester, their annual average, and whether they were promoted or retained each year.' },
    { icon: '📋', title: 'You can track your child\'s attendance', detail: 'You can see day by day whether your child was present, absent, late or excused — so you are always informed.' },
    { icon: '📣', title: 'You can read school notices', detail: 'You can read official announcements posted by the director for parents or for the whole school community.' },
  ]

  return (
    <>
      <WelcomeBanner
        name={`${t('welcomeParent')}, ${user?.fullName}`}
        role={t('PARENT')}
        stats={[
          { label: t('linkedChildren'), value: children.length > 0 ? children.length : null },
        ]}
        lines={lines}
      />
      {children.length === 0 && (
        <div className="card border-brand/30 bg-brand/5 mt-2">
          <p className="text-sm text-brand font-medium flex items-center gap-2">
            <span>💡</span>
            {lang === 'am'
              ? 'ጀምር: ወደ ልጆቼ ሄደህ የልጅህን Student ID ተጠቅምህ አያይዝ።'
              : 'Get started: go to My Children and link your child using their Student ID provided by the school.'}
          </p>
        </div>
      )}
    </>
  )
}
