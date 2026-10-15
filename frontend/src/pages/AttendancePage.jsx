import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { attendanceService } from '../services/attendanceService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'
import SearchSelect from '../components/SearchSelect'

const STATUS_STYLES = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT: 'bg-red-100 text-red-700',
    LATE: 'bg-yellow-100 text-yellow-700',
    EXCUSED: 'bg-blue-100 text-blue-700',
}

const STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']

export default function AttendancePage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const isAdmin = user?.role === 'ADMIN'
    const [sections, setSections] = useState([])
    const [students, setStudents] = useState([])
    const [records, setRecords] = useState([])
    const [sectionId, setSectionId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState({})

    // Export date range — defaults to first of current month → today
    const today = new Date()
    const firstOfMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
    const [exportStartDate, setExportStartDate] = useState(firstOfMonth)
    const [exportEndDate, setExportEndDate] = useState(today.toISOString().split('T')[0])

    // Status label map — uses translation keys
    const STATUS_LABELS = {
        PRESENT: t('present'),
        ABSENT:  t('absent'),
        LATE:    t('late'),
        EXCUSED: t('excused'),
    }

    useEffect(() => {
        const loader = isAdmin ? classService.getAll() : classService.getMyClasses()
        loader
            .then(data => {
                setSections(data)
            })
            .catch(() => {})
    }, [isAdmin])

    useEffect(() => {
        if (!sectionId) return
        setLoading(true)
        Promise.all([
            studentService.getAll(),
            attendanceService.getForSection(sectionId, date)
        ]).then(([allStudents, recs]) => {
            setStudents(allStudents.filter(s => String(s.sectionId) === String(sectionId)))
            setRecords(recs)
        }).catch(() => {})
            .finally(() => setLoading(false))
    }, [sectionId, date])

    const getRecord = (studentId) => records.find(r => r.studentId === studentId)

    const handleMark = async (studentId, status) => {
        setSaving(s => ({ ...s, [studentId]: true }))
        try {
            const rec = await attendanceService.mark({ studentId, date, status })
            setRecords(prev => {
                const idx = prev.findIndex(r => r.studentId === studentId)
                return idx >= 0 ? prev.map((r, i) => i === idx ? rec : r) : [...prev, rec]
            })
        } catch { /* silent */ }
        finally { setSaving(s => ({ ...s, [studentId]: false })) }
    }

    const markAll = async (status) => {
        for (const student of students) {
            await handleMark(student.id, status)
        }
    }

    const present = records.filter(r => r.status === 'PRESENT').length
    const total = students.length

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('attendancePage')}</h1>
                    <p className="text-slate-500 mt-1">
                        {isAdmin ? t('attendanceSubtitleAdmin') : t('attendanceSubtitleTeacher')}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="field-label">{t('classSection')}</label>
                    <SearchSelect
                        className="w-52"
                        placeholder="e.g. Grade 9-A"
                        value={sectionId}
                        onChange={v => setSectionId(v)}
                        options={sections.map(s => ({
                            value: s.id,
                            label: `Grade ${s.grade}-${s.section}`
                        }))}
                    />
                </div>
                <div>
                    <label className="field-label">{t('dateLabel')}</label>
                    <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                {sectionId && total > 0 && (
                    <div className="flex flex-wrap gap-2 ml-auto items-end">
                        <button className="text-xs btn-ghost py-1.5 px-3" onClick={() => markAll('PRESENT')}>
                            ✓ {t('markAllPresent')}
                        </button>
                        <button className="text-xs btn-ghost py-1.5 px-3 border-red-200 text-red-600" onClick={() => markAll('ABSENT')}>
                            ✗ {t('markAllAbsent')}
                        </button>
                        <div className="flex items-end gap-1">
                            <div>
                                <label className="field-label text-xs">{t('exportFrom')}</label>
                                <input
                                    className="field text-xs py-1.5 px-2"
                                    type="date"
                                    value={exportStartDate}
                                    onChange={e => setExportStartDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="field-label text-xs">{t('exportTo')}</label>
                                <input
                                    className="field text-xs py-1.5 px-2"
                                    type="date"
                                    value={exportEndDate}
                                    onChange={e => setExportEndDate(e.target.value)}
                                />
                            </div>
                            <button
                                className="text-xs btn-ghost py-1.5 px-3"
                                onClick={() => {
                                    const token = localStorage.getItem('arerti_token')
                                    const base = import.meta.env.DEV ? '/api' : 'https://arerti-school-backend.onrender.com/api'
                                    window.open(
                                        `${base}/export/attendance?sectionId=${sectionId}&startDate=${exportStartDate}&endDate=${exportEndDate}&token=${token}`
                                    )
                                }}
                            >
                                📥 {t('exportCsv')}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {sectionId && total > 0 && (
                <div className="mb-4 flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">{present} {t('present')}</span>
                    <span className="text-red-600 font-medium">{total - present} {t('absentOther')}</span>
                    <span className="text-slate-500">{t('total')}: {total}</span>
                    <span className="text-slate-500">
                        {total > 0 ? Math.round((present / total) * 100) : 0}% {t('attendanceRate')}
                    </span>
                </div>
            )}

            {!sectionId ? (
                <div className="card p-8 text-center text-slate-500">
                    {sections.length === 0 && !isAdmin
                        ? t('notHomeroomTeacher')
                        : t('selectClassToMark')}
                </div>
            ) : loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : students.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noStudentsInSection')}</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">{t('student')}</th>
                                <th className="px-4 py-3 text-left">UID</th>
                                <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const rec = getRecord(student.id)
                                const status = rec?.status
                                return (
                                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-medium text-slate-900">{student.fullName}</td>
                                        <td className="px-4 py-3 font-mono text-xs text-slate-500">{student.studentUid}</td>
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
                                                        disabled={saving[student.id]}
                                                        onClick={() => handleMark(student.id, s)}
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
