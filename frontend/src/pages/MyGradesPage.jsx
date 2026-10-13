import React, { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { gradeService } from '../services/gradeService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'

function toEthiopianDate(gregorianDate) {
  if (!gregorianDate) return ''
  const d = new Date(gregorianDate)
  const gcYear = d.getFullYear()
  const gcMonth = d.getMonth() + 1
  const gcDay = d.getDate()

  // Reliable Gregorian→Ethiopian conversion using Julian Day Numbers
  // JDN for Gregorian date
  const a = Math.floor((14 - gcMonth) / 12)
  const y = gcYear + 4800 - a
  const m = gcMonth + 12 * a - 3
  const jdn = gcDay + Math.floor((153 * m + 2) / 5) + 365 * y
    + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045

  // Ethiopian epoch: Meskerem 1, 1 EC = JDN 1724221 (Proleptic Julian 29 Aug 8 AD)
  const etEpoch = 1724221
  const etDelta = jdn - etEpoch
  // Each Ethiopian 4-year cycle = 4*365+1 = 1461 days
  const etCycle4 = Math.floor(etDelta / 1461)
  const remainder = etDelta % 1461
  // Year within cycle: remainder / 365, but the leap year is year 3 (remainder 1460)
  const etYearInCycle = Math.floor(remainder / 365)
  const etYear = 4 * etCycle4 + etYearInCycle + 1
  // Day within the Ethiopian year (0-indexed)
  const dayOfYear = remainder - etYearInCycle * 365
  // Months 1-12 are 30 days each; month 13 (Pagume) is 5 or 6 days
  const etMonth = Math.floor(dayOfYear / 30) + 1
  const etDay = (dayOfYear % 30) + 1

  const etMonthNames = ['መስከረም','ጥቅምት','ህዳር','ታህሳስ','ጥር','የካቲት','መጋቢት','ሚያዚያ','ግንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን']
  const etMonthName = etMonthNames[Math.min(etMonth - 1, 12)]
  return `${etDay} ${etMonthName} ${etYear}`
}

export default function MyGradesPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const [student, setStudent] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

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

  const toggleExpand = (key) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

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

      {latestEntry && latestEntry.annualAverage != null && (
        <div className={`mb-6 rounded-xl border-2 p-4 flex items-center gap-4 ${
          latestEntry.passed
            ? 'bg-green-50 border-green-400'
            : 'bg-red-50 border-red-400'
        }`}>
          <div className={`text-4xl font-black ${latestEntry.passed ? 'text-green-600' : 'text-red-600'}`}>
            {latestEntry.passed ? '✓' : '✗'}
          </div>
          <div>
            <div className={`text-lg font-bold ${latestEntry.passed ? 'text-green-700' : 'text-red-700'}`}>
              {latestEntry.passed ? 'PASSED' : 'FAILED'} — {latestEntry.academicYear}
            </div>
            <div className="text-sm text-slate-600">
              Annual average: <strong>{latestEntry.annualAverage?.toFixed(1)}</strong> / 100
              {!latestEntry.passed && <span className="ml-2 text-red-600 font-medium">— below passing mark of 50</span>}
            </div>
          </div>
        </div>
      )}

      {history.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No registration history found.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3 text-left">Ac Year</th>
                <th className="px-4 py-3 text-center">Batch</th>
                <th className="px-4 py-3 text-center">Semester</th>
                <th className="px-4 py-3 text-left">Registration Date</th>
                <th className="px-4 py-3 text-left">Reg Remark</th>
                <th className="px-4 py-3 text-center">Average</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => {
                const sem1Key = `${entry.id}-1`
                const sem2Key = `${entry.id}-2`

                return (
                  <React.Fragment key={entry.id}>
                    <tr
                      key={sem1Key + '-row'}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleExpand(sem1Key)}
                    >
                      <td className="px-2 py-3 text-center text-slate-400 select-none">
                        {expanded[sem1Key] ? '▼' : '▶'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {entry.academicYear}
                      </td>
                      <td className="px-4 py-3 text-center">{entry.batch}</td>
                      <td className="px-4 py-3 text-center font-semibold">I</td>
                      <td className="px-4 py-3">{toEthiopianDate(entry.registrationDate)}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{entry.enrollmentType}</td>
                      <td className="px-4 py-3 text-center">
                        {entry.sem1Average != null ? entry.sem1Average.toFixed(1) : '—'}
                      </td>
                    </tr>
                    {expanded[sem1Key] && (
                      <tr key={sem1Key + '-detail'} className="bg-slate-50">
                        <td></td>
                        <td colSpan={6} className="px-6 py-3">
                          {entry.sem1Grades && entry.sem1Grades.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-slate-500 uppercase">
                                  <th className="py-1 text-left">Subject</th>
                                  <th className="py-1 text-center">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.sem1Grades.map((g, i) => (
                                  <tr key={i} className="border-t border-slate-200">
                                    <td className="py-1 text-slate-700">{g.subjectName}</td>
                                    <td className="py-1 text-center">{g.score != null ? `${g.score} / 100` : '—'}</td>
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
                    <tr
                      key={sem2Key + '-row'}
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleExpand(sem2Key)}
                    >
                      <td className="px-2 py-3 text-center text-slate-400 select-none">
                        {expanded[sem2Key] ? '▼' : '▶'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs"></td>
                      <td className="px-4 py-3 text-center">{entry.batch}</td>
                      <td className="px-4 py-3 text-center font-semibold">II</td>
                      <td className="px-4 py-3 text-slate-400">—</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{entry.enrollmentType}</td>
                      <td className="px-4 py-3 text-center">
                        {entry.sem2Average != null ? entry.sem2Average.toFixed(1) : '—'}
                      </td>
                    </tr>
                    {expanded[sem2Key] && (
                      <tr key={sem2Key + '-detail'} className="bg-slate-50">
                        <td></td>
                        <td colSpan={6} className="px-6 py-3">
                          {entry.sem2Grades && entry.sem2Grades.length > 0 ? (
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-xs text-slate-500 uppercase">
                                  <th className="py-1 text-left">Subject</th>
                                  <th className="py-1 text-center">Score</th>
                                </tr>
                              </thead>
                              <tbody>
                                {entry.sem2Grades.map((g, i) => (
                                  <tr key={i} className="border-t border-slate-200">
                                    <td className="py-1 text-slate-700">{g.subjectName}</td>
                                    <td className="py-1 text-center">{g.score != null ? `${g.score} / 100` : '—'}</td>
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
      )}
    </div>
  )
}
