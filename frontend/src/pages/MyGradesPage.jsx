import React, { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { gradeService } from '../services/gradeService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'

const GC_MONTH_NAMES_EN = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
]

// Format registration date:
// English → "23 October 2026"
// Amharic → Ethiopian calendar with Amharic month names: "13 ጥቅምት 2019"
function formatRegDate(gregorianDate, isAmharic) {
  if (!gregorianDate) return ''
  const d = new Date(gregorianDate)
  const gcYear = d.getFullYear()
  const gcMonth = d.getMonth() + 1
  const gcDay = d.getDate()

  if (!isAmharic) {
    return `${gcDay} ${GC_MONTH_NAMES_EN[gcMonth - 1]} ${gcYear}`
  }

  // Ethiopian calendar via Julian Day Numbers
  const a = Math.floor((14 - gcMonth) / 12)
  const y = gcYear + 4800 - a
  const m = gcMonth + 12 * a - 3
  const jdn = gcDay + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
  const etEpoch = 1724221
  const etDelta = jdn - etEpoch
  const etCycle4 = Math.floor(etDelta / 1461)
  const remainder = etDelta % 1461
  const etYearInCycle = Math.floor(remainder / 365)
  const etYear = 4 * etCycle4 + etYearInCycle + 1
  const dayOfYear = remainder - etYearInCycle * 365
  const etMonth = Math.floor(dayOfYear / 30) + 1
  const etDay = (dayOfYear % 30) + 1
  const etMonthNames = ['መስከረም','ጥቅምት','ህዳር','ታህሳስ','ጥር','የካቲት','መጋቢት','ሚያዚያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን']
  return `${etDay} ${etMonthNames[Math.min(etMonth - 1, 12)]} ${etYear}`
}

// Sem II academic year = next year pair, e.g. "2026/2027" → "2027/2028"
function sem2AcYear(acYear) {
  if (!acYear) return ''
  const parts = acYear.split('/')
  if (parts.length !== 2) return acYear
  const y1 = parseInt(parts[0]) + 1
  const y2 = parseInt(parts[1]) + 1
  return `${y1}/${y2}`
}

// Batch number → Grade label
function batchToGrade(batch) {
  const map = { 1: 'Grade 9', 2: 'Grade 10', 3: 'Grade 11', 4: 'Grade 12' }
  return map[batch] || `Grade ${batch + 8}`
}

function StatusBadge({ average, t }) {
  if (average == null) return <span className="text-slate-400">—</span>
  if (average >= 50) {
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">{t('passed')}</span>
  }
  return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">{t('failed')}</span>
}

export function GradeHistoryTable({ history, t, isAmharic }) {
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (history.length === 0) {
    return <div className="card p-8 text-center text-slate-500">{t('noHistory')}</div>
  }

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
            <th className="w-8 px-2 py-3"></th>
            <th className="px-4 py-3 text-left">{t('acYear')}</th>
            <th className="px-4 py-3 text-center">{t('batch')}</th>
            <th className="px-4 py-3 text-center">{t('semester')}</th>
            <th className="px-4 py-3 text-left">{t('regDate')}</th>
            <th className="px-4 py-3 text-center">{t('average')}</th>
            <th className="px-4 py-3 text-center">{t('prevStatus')}</th>
            <th className="px-4 py-3 text-center">{t('finalStatus')}</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry, index) => {
            const sem1Key = `${entry.id}-1`
            const sem2Key = `${entry.id}-2`
            const prevEntry = index > 0 ? history[index - 1] : null

            // Prev Status for Sem I row
            const sem1PrevStatus = (index === 0 || entry.batch === 1)
              ? null
              : prevEntry?.sem2Average ?? null

            // Prev Status for Sem II row
            const sem2PrevStatus = entry.sem1Average ?? null

            return (
              <React.Fragment key={entry.id}>
                {/* Sem I row */}
                <tr
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleExpand(sem1Key)}
                >
                  <td className="px-2 py-3 text-center text-slate-400 select-none">
                    {expanded[sem1Key] ? '▼' : '▶'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{entry.academicYear}</td>
                  <td className="px-4 py-3 text-center">{batchToGrade(entry.batch)}</td>
                  <td className="px-4 py-3 text-center font-semibold">I</td>
                  <td className="px-4 py-3">{formatRegDate(entry.registrationDate, isAmharic)}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.sem1Average != null ? entry.sem1Average.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {index === 0 ? '' : <StatusBadge average={sem1PrevStatus} t={t} />}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge average={entry.sem1Average} t={t} />
                  </td>
                </tr>
                {expanded[sem1Key] && (
                  <tr className="bg-slate-50">
                    <td></td>
                    <td colSpan={7} className="px-6 py-3">
                      {entry.sem1Grades && entry.sem1Grades.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500 uppercase">
                              <th className="py-1 text-left">Subject</th>
                              <th className="py-1 text-center">Score /100</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.sem1Grades.map((g, i) => (
                              <tr key={i} className="border-t border-slate-200">
                                <td className="py-1 text-slate-700">{g.subjectName}</td>
                                <td className="py-1 text-center">{g.score != null ? g.score : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <span className="text-slate-400 text-xs">No grades recorded for Semester I.</span>
                      )}
                    </td>
                  </tr>
                )}

                {/* Sem II row */}
                <tr
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => toggleExpand(sem2Key)}
                >
                  <td className="px-2 py-3 text-center text-slate-400 select-none">
                    {expanded[sem2Key] ? '▼' : '▶'}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{sem2AcYear(entry.academicYear)}</td>
                  <td className="px-4 py-3 text-center">{batchToGrade(entry.batch)}</td>
                  <td className="px-4 py-3 text-center font-semibold">II</td>
                  <td className="px-4 py-3 text-slate-400">—</td>
                  <td className="px-4 py-3 text-center">
                    {entry.sem2Average != null ? entry.sem2Average.toFixed(1) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge average={sem2PrevStatus} t={t} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge average={entry.sem2Average} t={t} />
                  </td>
                </tr>
                {expanded[sem2Key] && (
                  <tr className="bg-slate-50">
                    <td></td>
                    <td colSpan={7} className="px-6 py-3">
                      {entry.sem2Grades && entry.sem2Grades.length > 0 ? (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs text-slate-500 uppercase">
                              <th className="py-1 text-left">Subject</th>
                              <th className="py-1 text-center">Score /100</th>
                            </tr>
                          </thead>
                          <tbody>
                            {entry.sem2Grades.map((g, i) => (
                              <tr key={i} className="border-t border-slate-200">
                                <td className="py-1 text-slate-700">{g.subjectName}</td>
                                <td className="py-1 text-center">{g.score != null ? g.score : '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <span className="text-slate-400 text-xs">No grades recorded for Semester II.</span>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default function MyGradesPage() {
  const { user } = useAuth()
  const { t, isAmharic } = useLanguage()
  const [student, setStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    studentService.getMe()
      .then(setStudent)
      .catch(() => setStudent(null))
  }, [user])

  useEffect(() => {
    setLoading(true)
    gradeService.getMyGradeHistory()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [user])

  const latestEntry = history.length > 0 ? history[history.length - 1] : null

  if (loading) return <div className="card p-8 text-center text-slate-500">{t('loading')}</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">{t('myGradesPage')}</h1>
          {student && (
            <p className="text-slate-500 mt-1">{student.studentUid} · {student.sectionLabel || t('noClassAssigned')}</p>
          )}
        </div>
      </div>

      <GradeHistoryTable history={history} t={t} isAmharic={isAmharic} />
    </div>
  )
}
