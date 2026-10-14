import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'

const GRADIENT = 'bg-gradient-to-br from-brand-dark via-brand to-emerald-500'

function WelcomeBanner({ name, role, stats, lines }) {
  return (
    <div className={`rounded-2xl overflow-hidden shadow-lg mb-8 ${GRADIENT}`}>
      <div className="px-6 pt-7 pb-5 text-white">
        <p className="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">{role}</p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold leading-snug">{name}</h1>
      </div>

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

      <div className="px-6 pb-7 pt-1 bg-white">
        <ul className="space-y-3 pt-4">
          {lines.map((line, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 text-lg shrink-0">{line.icon}</span>
              <p className="text-sm text-slate-600 leading-relaxed">
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

// ── Director ──────────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const name = user?.fullName === 'System Administrator' ? (t('ADMIN') || 'School Director') : user?.fullName

  const lines = lang === 'am' ? [
    { icon: '🎓', title: 'ተማሪዎችን መመዝገብ ይችላሉ', detail: 'አዲስ ተማሪዎችን (Grade 9 አዲስ ገቢ፣ ዝውውር፣ ድጋሚ ተማሪ) ወደ ትምህርት ቤቱ መመዝገብ ይችላሉ። ምዝገባ ሲጠናቀቅ ተማሪዎቹን ወደ ክፍሎች ማስቀመጥ ይችላሉ።' },
    { icon: '👩‍🏫', title: 'አስተማሪዎችን መቅጠር እና ማስተዳደር ይችላሉ', detail: 'አስተማሪዎችን ቀጥሮ የሂሳብ ክፍት ማድረግ፣ ስሞቻቸውን፣ ፎቶዎቻቸውን እና ሰነዶቻቸውን መስተካከል፣ ሲያስፈልግ ሂሳባቸውን መሰረዝ ይችላሉ።' },
    { icon: '📚', title: 'ክፍሎችን እና ትምህርቶችን ማዋቀር ይችላሉ', detail: 'የትምህርት ክፍሎችን (Grade 9-A፣ Grade 11 Natural Science ወዘተ) መፍጠር፣ ለእያንዳንዱ ክፍል ትምህርቶችን መመደብ፣ ለእያንዳንዱ ትምህርት አስተማሪ መሰየም ይችላሉ።' },
    { icon: '📖', title: 'ሥርዓተ ትምህርት ማዋቀር ይችላሉ', detail: 'ለእያንዳንዱ ክፍል (Grade 9-12) ምን ምን ትምህርቶች ይሰጡ እንደሚሆን ማዘጋጀት ይችላሉ — አዲስ ክፍል ሲፈጠር ሥርዓተ ትምህርቱ ራሱ ይተገበራል።' },
    { icon: '📝', title: 'የውጤት ማስረከቢያ ጊዜ ማስተዳደር ይችላሉ', detail: 'ከፈተና በኋላ አስተማሪዎች ውጤቶችን የሚያስገቡበት ጊዜ መክፈት፣ ማራዘም እና መዝጋት ይችላሉ።' },
    { icon: '🔄', title: 'ድጋሚ ምዘና ጥያቄዎችን ማፅደቅ ወይም ውድቅ ማድረግ ይችላሉ', detail: 'ሆምሩም አስተማሪዎች ቆልፎ ምልክቶችን ለማስተካከል ሲጠይቁ ጥያቄዎቹን ፍቅደው ወይም ውድቅ ማድረግ ይችላሉ።' },
    { icon: '📊', title: 'የሁሉም ክፍሎች ውጤቶችን ማስተካከል ይችላሉ', detail: 'ዳይሬክተር እንደ ልዩ ሥልጣን ቆልፎ ምልክቶችን ጨምሮ ማንኛውም ተማሪ ውጤቶችን ማስተካከል ይችላሉ።' },
    { icon: '📋', title: 'የሁሉም ክፍሎች ክትትል ማስተዳደር ይችላሉ', detail: 'ለሁሉም ክፍሎች ዕለታዊ ክትትሉን ማየት፣ ማስገባት ወይም ማስተካከል ይችላሉ።' },
    { icon: '📣', title: 'ማስታወቂያዎችን መፍጠር እና ማስተዳደር ይችላሉ', detail: 'ለተማሪዎች፣ ለወላጆች፣ ለሰራተኞች ወይም ለሁሉም ሰው ምስሎችን ጨምሮ ማስታወቂያ ማዘጋጀት፣ ማስተካከል እና መሰረዝ ይችላሉ።' },
    { icon: '📁', title: 'ግብዓቶች ማስተዳደር ይችላሉ', detail: 'ፒዲኤፍ፣ ሰነዶች እና ሌሎች ቁሳቁሶችን ለተማሪዎች ወይም ለሰራተኞች መጫን፣ ማውረድ እና መሰረዝ ይችላሉ።' },
    { icon: '🔍', title: 'ተጠቃሚዎችን መፈለግ እና የይለፍ ቃል ዳግም ማስጀምር ይችላሉ', detail: 'ማንኛውም ተጠቃሚ (ተማሪ፣ አስተማሪ፣ ወላጅ) ፈልጎ ሂሳቡን ማየትና የይለፍ ቃሉን ዳግም ማስጀምር ይችላሉ።' },
    { icon: '📜', title: 'ሙሉ የኦዲት መዝገብ ማየት ይችላሉ', detail: 'ሁሉም ተጠቃሚዎች ምን ድርጊቶች እንደፈፀሙ — ምዝገባ፣ ውጤት ማስገባት፣ ግቤት ወዘተ — ሙሉ ታሪኩን ማየት ይችላሉ።' },
    { icon: '🔚', title: 'ዓመቱን ማጠናቀቅ ይችላሉ', detail: 'ዓመቱ ሲጠናቀቅ ሁሉም ምደባዎችን ወደ ታሪክ ማዛወርና ተማሪዎችን ለቀጣዩ ዓመት ዝግጁ ማድረግ ይችላሉ።' },
  ] : [
    { icon: '🎓', title: 'You can register students', detail: 'You can enrol new students (Grade 9 new entrants, transfers, repeaters, promoted students) and assign them to class sections after registration closes.' },
    { icon: '👩‍🏫', title: 'You can hire and manage teachers', detail: 'You can register new teachers, update their profiles and documents, and delete accounts when needed.' },
    { icon: '📚', title: 'You can set up classes and assign subjects', detail: 'You can create class sections (e.g. Grade 9-A, Grade 11 Natural Science), assign subjects to each class, and assign teachers to those subjects.' },
    { icon: '📖', title: 'You can manage the grade curriculum', detail: 'You can define which subjects are taught at each grade level — when a new class is created the curriculum is applied automatically.' },
    { icon: '📝', title: 'You can manage grade submission windows', detail: 'You can open, extend and close the period during which teachers submit exam results after each exam.' },
    { icon: '🔄', title: 'You can approve or reject regrade requests', detail: 'When a homeroom teacher requests permission to correct locked marks, you can approve or reject that request.' },
    { icon: '📊', title: 'You can edit any grade — including locked ones', detail: 'As director you have override power to correct marks for any student in any subject across the entire school.' },
    { icon: '📋', title: 'You can manage attendance for all classes', detail: 'You can view, enter and correct daily attendance records for any class in the school.' },
    { icon: '📣', title: 'You can create and manage school notices', detail: 'You can post announcements with photos targeted to students, parents, teachers, or everyone — and edit or delete them any time.' },
    { icon: '📁', title: 'You can manage resources', detail: 'You can upload PDFs, documents and study materials for students or teachers, download any resource, and delete uploaded files.' },
    { icon: '🔍', title: 'You can look up any user and reset passwords', detail: 'You can search for any student, teacher or parent, view their account details, and reset their password if they forget it.' },
    { icon: '📜', title: 'You can review the full audit log', detail: 'You can see a complete trail of all system activity — who registered, who submitted grades, who changed what and when.' },
    { icon: '🔚', title: 'You can end the academic year', detail: 'When the year finishes you can archive all subject assignments and unassign students from classes to prepare for the new year.' },
  ]

  return (
    <WelcomeBanner
      name={`${t('welcomeAdmin')}, ${name}`}
      role={t('ADMIN')}
      stats={[
        { label: t('students'), value: stats?.studentCount },
        { label: t('teachers'), value: stats?.teacherCount },
        { label: t('classes'),  value: stats?.classCount   },
      ]}
      lines={lines}
    />
  )
}

// ── Teacher ───────────────────────────────────────────────────────────────────
export function TeacherDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()

  const lines = lang === 'am' ? [
    { icon: '✏️', title: 'ለተሰጦት ትምህርት ውጤቶችን ማስገባት ይችላሉ', detail: 'የወቅት ፈተና (20)፣ የዓመት ፈተና (60)፣ የቤት ሥራ (10) እና ጥያቄ/ፈተና (10) ውጤቶችን ለእያንዳንዱ ተማሪ ማስገባት ይችላሉ። ውጤቶቹ ከቀረቡ በኋላ ይቆለፋሉ።' },
    { icon: '�', title: 'ሁሉም ትምህርቶች ለስም ጠሪው አስተማሪ ይታያሉ', detail: 'ሆምሩም አስተማሪ ከሆኑ ለክፍልዎ ሁሉም ትምህርቶች ውጤቶችን ማየት ይችላሉ — ያስተምሩት ትምህርቶች ብቻ ሳይሆን ሁሉም።' },
    { icon: '📋', title: 'ለክፍልዎ ዕለታዊ ክትትሉን መመዝገብ ይችላሉ', detail: 'ሆምሩም አስተማሪ ከሆኑ ዕለቱን ለእያንዳንዱ ተማሪ ተገኝቷል፣ አልተገኘም፣ ዘግይቷል ወይም ፈቃድ አለው ብለው ምዝግብ ይችላሉ። ሁሉንም ተቀምጦ ምልክት ማድረግ ይችላሉ።' },
    { icon: '📝', title: 'ምዝገባ ሲጀመር የተማሪዎችን ምዝገባ ማካሄድ ይችላሉ', detail: 'ምዝገባ ሲከፈት አዲስ ተማሪዎችን (ሙሉ ቅጽ) ወይም ቀደም ሲል ያሉ ተማሪዎችን (ፈጣን ዳሳሽ) ምዝግብ ይችላሉ።' },
    { icon: '🔄', title: 'ቆልፎ ምልክቶች ለማስተካከል ፈቃድ መጠየቅ ይችላሉ', detail: 'ሆምሩም አስተማሪ ከሆኑ ስህተት ሲያዩ ዳይሬክተሩ ፈቃድ ሲሰጡ ቆልፎ ምልክቶቹን ማስተካከል ይችላሉ።' },
    { icon: '📣', title: 'ማስታወቂያዎችን ማንበብ ይችላሉ', detail: 'ዳይሬክተሩ ለሰራተኞች ወይም ለሁሉም ሰው የሚለጥፈውን ማስታወቂያ ሙሉ ዝርዝሩን ማንበብ ይችላሉ።' },
    { icon: '📁', title: 'ግብዓቶች ማስተዳደር ይችላሉ', detail: 'ፒዲኤፍ እና ሰነዶችን ለተማሪዎች ወይም ሰራተኞች ማጫን፣ ማውረድ እና የጫኑትን መሰረዝ ይችላሉ።' },
    { icon: '👤', title: 'የማንነቶን መገለጫ ማስተዳደር ይችላሉ', detail: 'ስምዎን ማየት፣ የማንነቶን መገለጫ ለማሻሻል የይለፍ ቃልዎን በሌላ መቀየር ይችላሉ።' },
  ] : [
    { icon: '✏️', title: 'You can enter grades for your assigned subjects', detail: 'You can submit mid exam (20), final exam (60), assignment (10) and test/quiz (10) marks for each student in your subject. Grades lock after submission.' },
    { icon: '�', title: 'You can view all subjects as homeroom teacher', detail: 'If you are the homeroom teacher of a class, you can view grades for all subjects in that class — not just the one you teach.' },
    { icon: '📋', title: 'You can mark daily attendance for your class', detail: 'As a homeroom teacher you can record present, absent, late or excused for each student every day. You can also mark all students at once.' },
    { icon: '📝', title: 'You can register students when registration is open', detail: 'When registration is open you can enrol new students (full form) or re-enrol existing ones (quick form with payment details).' },
    { icon: '🔄', title: 'You can request regrade permission for locked marks', detail: 'As a homeroom teacher, when you spot an error in a locked grade you can request the director\'s approval to correct it.' },
    { icon: '📣', title: 'You can read all school notices', detail: 'You can read the full content of announcements posted by the director for teachers or for the whole school.' },
    { icon: '📁', title: 'You can upload and manage resources', detail: 'You can upload PDFs and documents for students or staff, download any resource, and delete files you uploaded.' },
    { icon: '👤', title: 'You can manage your account', detail: 'You can view your profile and change your password to keep your account secure.' },
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

// ── Student ───────────────────────────────────────────────────────────────────
export function StudentDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [report, setReport] = useState(null)
  const [semLabel, setSemLabel] = useState(null)

  useEffect(() => {
    api.get('/students/me').then(async r => {
      const me = r.data
      if (!me?.id) return
      try {
        const hist = await api.get('/student/my-grade-history').then(h => h.data)
        if (hist && hist.length > 0) {
          const latest = hist[hist.length - 1]
          if (latest.sem2Average != null) {
            setReport({ average: latest.sem2Average, attendancePercent: null })
            setSemLabel(`${t('semester')} 2 · ${latest.academicYear}`)
          } else if (latest.sem1Average != null) {
            setReport({ average: latest.sem1Average, attendancePercent: null })
            setSemLabel(`${t('semester')} 1 · ${latest.academicYear}`)
          }
        }
      } catch {
        const cy = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
        for (const term of [2, 1]) {
          try {
            const rc = await api.get(`/report-card/${me.id}`, { params: { term, academicYear: cy } }).then(x => x.data)
            if (rc?.grades?.length > 0) { setReport(rc); setSemLabel(`${t('semester')} ${term} · ${cy}`); break }
          } catch {}
        }
      }
    }).catch(() => {})
  }, [user])

  const lines = lang === 'am' ? [
    { icon: '📊', title: 'ሁሉም ሴሜስተሮች ውጤቶችዎን ማየት ይችላሉ', detail: 'ከ Grade 9 እስከ አሁን ሁሉም ሴሜስተሮች ያሉ ትምህርቶቻቸው ውጤቶች፣ ዓመታዊ አማካይ እና ያለፉ/ያልወጡ ሁኔታ ማየት ይችላሉ።' },
    { icon: '🏅', title: 'ማለፏን ወይም አለማለፏን በማየት ማወቅ ይችላሉ', detail: 'ለእያንዳንዱ ዓመት (ዙር) ሁለቱ ሴሜስተሮች ካለቁ የሚያለፉ ወይም የማያልፉ ተማሪ ሁኔታ ይታያሉ — 50 ወይም ከዚያ በላይ ካለ ያለፉ ነው።' },
    { icon: '📋', title: 'ሙሉ ክትትል ታሪኩን ማየት ይችላሉ', detail: 'ዕለቱን ተገኝተዋል፣ አልተገኙም፣ ዘግይተዋል ወይም ፈቃድ ነበረዎ? ሁሉም ቀናት ዝርዝሩ ይታያሉ። የክትትል ምጣኔዎ ከ75% በታች ከሆነ ማስጠንቀቂያ ይታያሉ።' },
    { icon: '📣', title: 'ሁሉም ማስታወቂያዎችን ማንበብ ይችላሉ', detail: 'ዳይሬክተሩ ለተማሪዎች ወይም ለሁሉም ሰው የሚለጥፈውን ማስታወቂያ ሙሉ ዝርዝሩን ፣ ምስሎቹን ጨምሮ ማንበብ ይችላሉ።' },
    { icon: '📁', title: 'ግብዓቶች ማውረድ እና መጠቀም ይችላሉ', detail: 'አስተማሪዎች የጫኑዎትን ፒዲኤፍ፣ ሰነዶች እና ቁሳቁሶች ማግኘት፣ ማንበብ እና ማውረድ ይችላሉ።' },
    { icon: '👤', title: 'የማንነቶን መገለጫ ማስተዳደር ይችላሉ', detail: 'ስምዎን፣ ሚናዎን ማየት እና የማንነቶን መገለጫ ደህንነት ለማሻሻል የይለፍ ቃልዎን በሌላ መቀየር ይችላሉ።' },
  ] : [
    { icon: '📊', title: 'You can view all your semester grades', detail: 'You can see every subject score for every semester from Grade 9 onwards — mid exam, final, assignment and quiz — together with your semester average.' },
    { icon: '🏅', title: 'You can see your pass or fail result per year', detail: 'Once both semesters of a year are recorded, your annual result is shown — promoted if your annual average is 50 or above, failed if below.' },
    { icon: '📋', title: 'You can check your full attendance history', detail: 'You can see day by day whether you were present, absent, late or excused. A warning appears if your attendance rate drops below 75%.' },
    { icon: '📣', title: 'You can read all school notices', detail: 'You can read the full content and photos of announcements posted by the director for students or for the whole school.' },
    { icon: '📁', title: 'You can download and use study resources', detail: 'You can access, read and download PDFs, documents and study materials uploaded by your teachers.' },
    { icon: '👤', title: 'You can manage your account', detail: 'You can view your profile information and change your password to keep your account secure.' },
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

// ── Parent ────────────────────────────────────────────────────────────────────
export function ParentDashboard() {
  const { user } = useAuth()
  const { t, lang } = useLanguage()
  const [children, setChildren] = useState([])

  useEffect(() => {
    api.get('/parent/children').then(r => setChildren(r.data)).catch(() => {})
  }, [])

  const lines = lang === 'am' ? [
    { icon: '👨‍👩‍👧', title: 'ልጅዎን ማያያዝ እና ማስተዳደር ይችላሉ', detail: 'ትምህርት ቤቱ የሰጠዎትን Student ID ተጠቅመው ልጅዎን ከሂሳብዎ ጋር ማያያዝ ይችላሉ። ከአንድ በላይ ልጅ ካለ ሁሉንም ማስጠጋት ይችላሉ።' },
    { icon: '📊', title: 'ሁሉም ሴሜስተሮች ውጤቶቹን ማየት ይችላሉ', detail: 'ልጅዎ ከ Grade 9 ጀምሮ ያስመዘገባቸው ሁሉም ሴሜስተሮች ትምህርቶች ውጤቶች፣ ዓመታዊ አማካይ ማየት ይችላሉ።' },
    { icon: '🏅', title: 'የልጆን ማለፍ ወይም አለማለፍ በማየት ማወቅ ይችላሉ', detail: 'ለእያንዳንዱ ዓመት ልጅዎ ማለፍ ወይም አለማለፍ ሁኔታ ይታያሉ — ይህ ለቀጣዩ ዓመት ምዝገባ ወሳኝ ነው።' },
    { icon: '📋', title: 'ሙሉ ክትትል ታሪኩን ማየት ይችላሉ', detail: 'ልጅዎ ዕለቱን ትምህርት ቤት ተገኝቷል ወይ? ዘግይቷል ወይ? ፈቃድ ነበረው ወይ? ሁሉም ቀናት ዝርዝሩ ይታያሉ።' },
    { icon: '📣', title: 'ሁሉም ማስታወቂያዎችን ማንበብ ይችላሉ', detail: 'ዳይሬክተሩ ለወላጆች ወይም ለሁሉም ሰው የሚለጥፈውን ማስታወቂያ ምስሎቹን ጨምሮ ማንበብ ይችላሉ።' },
    { icon: '👤', title: 'የማንነቶን መገለጫ ማስተዳደር ይችላሉ', detail: 'ስምዎን፣ ሚናዎን ማየት እና የማንነቶን መገለጫ ደህንነት ለማሻሻል የይለፍ ቃልዎን በሌላ መቀየር ይችላሉ።' },
  ] : [
    { icon: '👨‍👩‍👧', title: 'You can link and manage your children', detail: 'You can connect your child\'s school profile using their portal username and password. If you have more than one child at the school you can link all of them and switch between them.' },
    { icon: '📊', title: 'You can view all semester grades', detail: 'You can see every subject score your child has earned from Grade 9 onwards — for every semester, with the semester average shown.' },
    { icon: '🏅', title: 'You can see the annual pass or fail result', detail: 'For each academic year, once both semesters are recorded, you can see whether your child was promoted to the next grade or retained.' },
    { icon: '📋', title: 'You can track the full attendance history', detail: 'You can see day by day whether your child was present, absent, late or excused — with a rate summary and a low-attendance warning if needed.' },
    { icon: '📣', title: 'You can read all school notices', detail: 'You can read the full content and photos of announcements posted by the director for parents or for the whole school community.' },
    { icon: '👤', title: 'You can manage your account', detail: 'You can view your profile and change your password to keep your account secure.' },
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
              ? 'ጀምር: ወደ ልጆቼ ሂደው የልጅዎን የተጠቃሚ ስምና የይለፍ ቃል ተጠቅመው ያያይዙ።'
              : 'Get started: go to My Children and link your child using their portal username and password.'}
          </p>
        </div>
      )}
    </>
  )
}
