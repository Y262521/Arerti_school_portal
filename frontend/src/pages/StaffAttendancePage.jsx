import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { staffAttendanceService } from '../services/staffAttendanceService'
import { teacherService } from '../services/teacherService'

const STATUS_STYLES = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT:  'bg-red-100 text-red-700',
    LATE:    'bg-yellow-100 text-yellow-700',
    EXCUSED: 'bg-blue-100 text-blue-700',
}
const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

export default function StaffAttendancePage() {
    const { t } = useLanguage()
    const [teachers, setTeachers] = useState([])
    const [records,  setRecords]  = useState([])
    const [date,     setDate]     = useState(new Date().toISOString().split('T')[0])
    const [loading,  setLoading]  = useState(false)
    const [saving,   setSaving]   = useState({})
    const [error,    setError]    = useState(null)
    const [markError, setMarkError] = useState(null)
    const [search,   setSearch]   = useState('')

    const STATUS_LABELS = {
        PRESENT: t('present'),
        ABSENT:  t('absent'),
        LATE:    t('late'),
        EXCUSED: t('excused'),
    }

    useEffect(() => {
        teacherService.getAll()
            .then(setTeachers)
            .catch(() => setError(t('failedToLoadTeachers')))
    }, [])

    useEffect(() => {
        if (!date) return
        setLoading(true)
        staffAttendanceService.getForDate(date)
            .then(setRecords)
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [date])

    const getRecord = (teacherId) => records.find(r => r.teacherId === teacherId)

    const handleMark = async (teacherId, status) => {
        setMarkError(null)
        setSaving(s => ({ ...s, [teacherId]: true }))
        try {
            const rec = await staffAttendanceService.mark({ teacherId, date, status, note: null })
            setRecords(prev => {
                const idx = prev.findIndex(r => r.teacherId === teacherId)
                return idx >= 0
                    ? prev.map((r, i) => i === idx ? rec : r)
                    : [...prev, rec]
            })
        } catch {
            setMarkError(t('failedToSaveAttendance'))
        }
        finally { setSaving(s => ({ ...s, [teacherId]: false })) }
    }

    const present = records.filter(r => r.status === 'PRESENT').length
    const absent  = records.filter(r => r.status === 'ABSENT').length

    // Filter teachers by search
    const filtered = search.trim()
        ? teachers.filter(tr =>
            tr.fullName?.toLowerCase().includes(search.toLowerCase()) ||
            (tr.employeeId || '').toLowerCase().includes(search.toLowerCase()))
        : teachers

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('staffAttendance')}</h1>
                    <p className="text-slate-500 mt-1">{t('staffAttendanceSubtitle')}</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {markError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {markError}
                </div>
            )}

            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="field-label">{t('dateLabel')}</label>
                    <input
                        className="field"
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label className="field-label">{t('search')}</label>
                    <input
                        className="field w-48"
                        placeholder={`${t('search')}…`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {date && teachers.length > 0 && (
                <div className="mb-4 flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">{present} {t('present')}</span>
                    <span className="text-red-600 font-medium">{absent} {t('absent')}</span>
                    <span className="text-slate-500">{t('total')}: {teachers.length}</span>
                </div>
            )}

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : teachers.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noTeachersFound')}</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">{t('teacherLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('employeeIdLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(teacher => {
                                const rec = getRecord(teacher.id)
                                const status = rec?.status
                                return (
                                    <tr key={teacher.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-medium text-slate-900">{teacher.fullName}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{teacher.employeeId || '—'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {status ? (
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}>
                                                    {STATUS_LABELS[status] || status}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1 flex-wrap">
                                                {STATUSES.map(s => (
                                                    <button
                                                        key={s}
                                                        disabled={saving[teacher.id]}
                                                        onClick={() => handleMark(teacher.id, s)}
                                                        title={STATUS_LABELS[s]}
                                                        className={`text-xs px-2 py-1 rounded transition border ${status === s
                                                            ? STATUS_STYLES[s] + ' border-current'
                                                            : 'border-slate-200 text-slate-500 hover:border-slate-400'
                                                        }`}
                                                    >
                                                        {STATUS_LABELS[s]?.[0] || s[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
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
