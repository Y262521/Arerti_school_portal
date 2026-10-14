import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { parentService } from '../services/parentService'
import { attendanceService } from '../services/attendanceService'

const STATUS_STYLES = {
  PRESENT: 'bg-green-100 text-green-700',
  ABSENT:  'bg-red-100 text-red-700',
  LATE:    'bg-yellow-100 text-yellow-700',
  EXCUSED: 'bg-blue-100 text-blue-700',
}

const MONTHS_KEYS  = ['monthJan','monthFeb','monthMar','monthApr','monthMay','monthJun','monthJul','monthAug','monthSep','monthOct','monthNov','monthDec']
const WEEKDAY_KEYS = ['weekdayShortSun','weekdayShortMon','weekdayShortTue','weekdayShortWed','weekdayShortThu','weekdayShortFri','weekdayShortSat']

const STATUS_LABEL_KEYS = {
  PRESENT: 'present',
  ABSENT:  'absent',
  LATE:    'late',
  EXCUSED: 'excused',
}

export default function ParentAttendancePage() {
  const { t } = useLanguage()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [records, setRecords] = useState([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    parentService.getChildren()
      .then(data => {
        setChildren(data)
        if (data.length > 0) setSelectedChild(data[0])
      })
      .catch(() => {})
      .finally(() => setLoadingChildren(false))
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    setLoadingRecords(true)
    attendanceService.getForStudent(selectedChild.studentId)
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoadingRecords(false))
  }, [selectedChild])

  const filtered = filter === 'ALL' ? records : records.filter(r => r.status === filter)

  const total   = records.length
  const present = records.filter(r => r.status === 'PRESENT').length
  const absent  = records.filter(r => r.status === 'ABSENT').length
  const late    = records.filter(r => r.status === 'LATE').length
  const excused = records.filter(r => r.status === 'EXCUSED').length
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0

  const STATUS_LABELS = {
    PRESENT: t('present'),
    ABSENT:  t('absent'),
    LATE:    t('late'),
    EXCUSED: t('excused'),
  }

  if (loadingChildren) return <div className="card p-8 text-center text-slate-500">{t('loading')}</div>

  if (children.length === 0) return (
    <div className="card p-8 text-center text-slate-500">
      {t('noChildrenForReportCard')}
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('myAttendancePage')}</h1>
        {selectedChild && (
          <p className="text-slate-500 mt-1">{selectedChild.studentUid}</p>
        )}
      </div>

      <div className="card mb-6">
        <label className="field-label">{t('childLabel')}</label>
        <select
          className="field w-56"
          value={selectedChild?.studentId ?? ''}
          onChange={e => setSelectedChild(children.find(c => String(c.studentId) === e.target.value))}
        >
          {children.map(c => (
            <option key={c.studentId} value={c.studentId}>
              {c.studentFullName} ({c.studentUid})
            </option>
          ))}
        </select>
      </div>

      {selectedChild && (
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
            {selectedChild.studentFullName?.charAt(0) ?? '?'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{selectedChild.studentFullName}</div>
            <div className="text-xs text-slate-500">
              {selectedChild.studentUid}
              {selectedChild.sectionLabel ? ` · ${selectedChild.sectionLabel}` : ''}
              {selectedChild.relationship ? ` · ${selectedChild.relationship}` : ''}
            </div>
          </div>
        </div>
      )}

      {loadingRecords ? (
        <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
            <div className="card text-center col-span-1">
              <div className="text-xs text-slate-500 uppercase tracking-wide">{t('attendanceRate')}</div>
              <div className={`text-3xl font-bold mt-1 ${pct >= 75 ? 'text-green-600' : 'text-red-600'}`}>{pct}%</div>
              <div className="text-xs text-slate-400">{present}/{total} {t('daysLabel')}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-green-600 uppercase tracking-wide">{t('present')}</div>
              <div className="text-3xl font-bold text-green-600 mt-1">{present}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-red-500 uppercase tracking-wide">{t('absent')}</div>
              <div className="text-3xl font-bold text-red-500 mt-1">{absent}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-yellow-600 uppercase tracking-wide">{t('late')}</div>
              <div className="text-3xl font-bold text-yellow-500 mt-1">{late}</div>
            </div>
            <div className="card text-center">
              <div className="text-xs text-blue-500 uppercase tracking-wide">{t('excused')}</div>
              <div className="text-3xl font-bold text-blue-500 mt-1">{excused}</div>
            </div>
          </div>

          {/* Low attendance warning */}
          {total > 0 && pct < 75 && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t('attendanceLowWarning')}
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
                {s === 'ALL'
                  ? `${t('all')} (${total})`
                  : `${STATUS_LABELS[s]} (${records.filter(r => r.status === s).length})`}
              </button>
            ))}
          </div>

          {records.length === 0 ? (
            <div className="card p-8 text-center text-slate-500">{t('noAttendanceRecords')}</div>
          ) : (
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                    <th className="px-4 py-3 text-left">{t('dateLabel')}</th>
                    <th className="px-4 py-3 text-left">{t('dayLabel')}</th>
                    <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                    <th className="px-4 py-3 text-left">{t('noteLabel')}</th>
                    <th className="px-4 py-3 text-left">{t('markedByLabel')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(rec => {
                    const d = new Date(rec.date)
                    return (
                      <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {d.getDate()} {t(MONTHS_KEYS[d.getMonth()])} {d.getFullYear()}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {t(WEEKDAY_KEYS[d.getDay()])}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[rec.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {t(STATUS_LABEL_KEYS[rec.status]) || rec.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{rec.note || '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{rec.markedBy || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
