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

      {/* "What I do" lines */}
      <div className="bg-white/96 px-6 py-6">
        <ul className="space-y-3">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 text-lg shrink-0">{line.icon}</span>
              <p className="text-sm text-slate-700 leading-relaxed">
                <span className="font-semibold text-slate-900">{line.title} — </span>
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
    { icon: '🎓', title: 'I register students and teachers', detail: 'I enrol new students into the school, hire teachers, and create their accounts so they can access the portal.' },
    { icon: '📚', title: 'I organise classes and subjects', detail: 'I create class sections, assign subjects to each class, set up the grade curriculum, and assign teachers to their subjects.' },
    { icon: '📝', title: 'I control grade submission', detail: 'I open and close the grade submission window after exams, and approve regrade requests from homeroom teachers when marks need correction.' },
    { icon: '📋', title: 'I monitor attendance', detail: 'I can view daily attendance reports for any class across the school to track student presence.' },
    { icon: '📣', title: 'I post school notices', detail: 'I publish announcements for students, parents, staff, or everyone — with photos if needed.' },
    { icon: '📁', title: 'I manage resources', detail: 'I upload study materials, documents and files that students and teachers can access.' },
    { icon: '🔍', title: 'I look up users and review audit logs', detail: 'I can find any user, reset their password, and see a full trail of all system activity.' },
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
    { icon: '✏️', title: 'I enter grades for my students', detail: 'I submit marks for my assigned subjects — mid exam, final exam, assignment and test/quiz. Grades are locked after submission.' },
    { icon: '📋', title: 'I mark attendance for my class', detail: 'As a homeroom teacher I record daily attendance for my class — present, absent, late or excused.' },
    { icon: '📝', title: 'I register students', detail: 'When registration is open I can enrol new or existing students into the school for the new academic year.' },
    { icon: '🔄', title: 'I request regrade permission', detail: 'As a homeroom teacher I can request the director\'s approval to correct locked marks when a mistake is found.' },
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
    { icon: '📊', title: 'I view my grades and academic history', detail: 'I can see all my subject scores across every semester and batch, my pass or fail status each year, and my annual average.' },
    { icon: '📋', title: 'I check my attendance record', detail: 'I can see each day\'s status — present, absent, late or excused — and how many school days I have attended.' },
    { icon: '📣', title: 'I read school notices', detail: 'I can read announcements posted by the director for students or for the whole school.' },
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
    { icon: '👨‍👩‍👧', title: 'I link and manage my child', detail: 'I can connect my child\'s school profile to my account using their Student ID. If I have more than one child at the school I can link all of them.' },
    { icon: '📊', title: 'I view my child\'s grades', detail: 'I can see all my child\'s subject scores across every semester, their annual average, and whether they were promoted or retained each year.' },
    { icon: '📋', title: 'I track my child\'s attendance', detail: 'I can see day by day whether my child was present, absent, late or excused — so I am always informed.' },
    { icon: '📣', title: 'I read school notices', detail: 'I can read official announcements posted by the director for parents or for the whole school community.' },
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
