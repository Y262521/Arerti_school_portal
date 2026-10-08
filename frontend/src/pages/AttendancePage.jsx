import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { attendanceService } from '../services/attendanceService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

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

    useEffect(() => {
        // Admin sees all classes; teacher sees only their homeroom classes
        const loader = isAdmin ? classService.getAll() : classService.getMyClasses()
        loader
            .then(data => {
                setSections(data)
                if (!isAdmin && data.length === 0) {
                    toast('You are not assigned as a homeroom teacher to any class.', { icon: 'â„¹ï¸' })
                }
            })
            .catch(() => toast.error('Failed to load classes'))
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
        }).catch(() => toast.error('Failed to load attendance'))
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
        } catch { toast.error('Failed to save attendance') }
        finally { setSaving(s => ({ ...s, [studentId]: false })) }
    }

    const markAll = async (status) => {
        for (const student of students) {
            await handleMark(student.id, status)
        }
        toast.success(`All marked as ${status}`)
    }

    const present = records.filter(r => r.status === 'PRESENT').length
    const total = students.length

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('attendancePage')}</h1>
                    <p className="text-slate-500 mt-1">
                        {isAdmin ? 'Mark daily attendance by class' : 'Mark attendance for your homeroom class'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="field-label">Class / Section</label>
                    <select className="field w-52" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                        <option value="">â€” Select class â€”</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>Grade {s.grade} â€“ {s.section} ({s.academicYear})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="field-label">Date</label>
                    <input className="field" type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                {sectionId && total > 0 && (
                    <div className="flex gap-2 ml-auto">
                        <button className="text-xs btn-ghost py-1.5 px-3" onClick={() => markAll('PRESENT')}>
                            âœ“ Mark All Present
                        </button>
                        <button className="text-xs btn-ghost py-1.5 px-3 border-red-200 text-red-600" onClick={() => markAll('ABSENT')}>
                            âœ— Mark All Absent
                        </button>
                    </div>
                )}
            </div>

            {sectionId && total > 0 && (
                <div className="mb-4 flex gap-4 text-sm">
                    <span className="text-green-600 font-medium">{present} Present</span>
                    <span className="text-red-600 font-medium">{total - present} Absent/Other</span>
                    <span className="text-slate-500">Total: {total}</span>
                    <span className="text-slate-500">
                        {total > 0 ? Math.round((present / total) * 100) : 0}% attendance
                    </span>
                </div>
            )}

            {!sectionId ? (
                <div className="card p-8 text-center text-slate-500">
                    {sections.length === 0 && !isAdmin
                        ? 'âš ï¸ You are not assigned as a homeroom teacher to any class. Contact the director.'
                        : 'Select a class to mark attendance.'}
                </div>
            ) : loading ? (
                <div className="card p-8 text-center text-slate-500">Loadingâ€¦</div>
            ) : students.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">No students in this section.</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">Student</th>
                                <th className="px-4 py-3 text-left">UID</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-center">Actions</th>
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
                                                    {status}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-300">â€”</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex justify-center gap-1 flex-wrap">
                                                {STATUSES.map(s => (
                                                    <button
                                                        key={s}
                                                        disabled={saving[student.id]}
                                                        onClick={() => handleMark(student.id, s)}
                                                        className={`text-xs px-2 py-1 rounded transition border ${status === s
                                                                ? STATUS_STYLES[s] + ' border-current'
                                                                : 'border-slate-200 text-slate-500 hover:border-slate-400'
                                                            }`}
                                                    >
                                                        {s[0]}
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
