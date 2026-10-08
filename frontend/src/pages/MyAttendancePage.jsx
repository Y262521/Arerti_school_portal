import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { attendanceService } from '../services/attendanceService'
import { studentService } from '../services/studentService'
import toast from 'react-hot-toast'

const STATUS_STYLES = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT:  'bg-red-100 text-red-700',
  LATE:    'bg-yellow-100 text-yellow-700',
  EXCUSED: 'bg-blue-100 text-blue-700',
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function MyAttendancePage() {
  const { t } = useLanguage()
  const [student, setStudent] = useState(null)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    studentService.getMe()
      .then(async (s) => {
        setStudent(s)
        const recs = await attendanceService.getForStudent(s.id)
        setRecords(recs)
      })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => setLoading(false))
  }, [])

  const filtered = filter === 'ALL' ? records : records.filter(r => r.status === filter)

  // Summary counts
  const total   = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const absent  = records.filter(r => r.status === 'ABSENT').length
  const late    = records.filter(r => r.status === 'LATE').length
  const excused = records.filter(r => r.status === 'EXCUSED').length
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0

  if (loading) return <div className="card p-8 text-center text-slate-500">Loadingâ€¦</div>

  if (!student) return (
    <div className="card p-8 text-center text-slate-500">
      Your student profile is not set up yet. Contact the administrator.
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('myAttendancePage')}</h1>
        <p className="text-slate-500 mt-1">
          {student.studentUid} Â· {student.sectionLabel || 'No class assigned'}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="card text-center col-span-1">
          <div className="text-xs text-slate-500 uppercase tracking-wide">Rate</div>
          <div className={`text-3xl font-bold mt-1 ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</div>
          <div className="text-xs text-slate-400">{present}/{total} days</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-green-600 uppercase tracking-wide">Present</div>
          <div className="text-3xl font-bold text-green-600 mt-1">{present}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-red-500 uppercase tracking-wide">Absent</div>
          <div className="text-3xl font-bold text-red-500 mt-1">{absent}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-yellow-600 uppercase tracking-wide">Late</div>
          <div className="text-3xl font-bold text-yellow-500 mt-1">{late}</div>
        </div>
        <div className="card text-center">
          <div className="text-xs text-blue-500 uppercase tracking-wide">Excused</div>
          <div className="text-3xl font-bold text-blue-500 mt-1">{excused}</div>
        </div>
      </div>

      {/* Attendance warning */}
      {total > 0 && pct < 75 && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          âš ï¸ Your attendance is below 75%. Please speak with your teacher or guardian.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-full border transition ${
              filter === s
                ? 'bg-brand text-white border-brand'
                : 'border-slate-200 text-slate-600 hover:border-brand'
            }`}
          >
            {s === 'ALL' ? `All (${total})` : `${s} (${records.filter(r => r.status === s).length})`}
          </button>
        ))}
      </div>

      {records.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">No attendance records yet.</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Day</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-left">Note</th>
                <th className="px-4 py-3 text-left">Marked By</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const d = new Date(rec.date)
                return (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-mono text-slate-700">
                      {d.getDate()} {MONTHS[d.getMonth()]} {d.getFullYear()}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {d.toLocaleDateString('en-US', { weekday: 'short' })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[rec.status] ?? 'bg-slate-100 text-slate-600'}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{rec.note || 'â€”'}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{rec.markedBy || 'â€”'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
