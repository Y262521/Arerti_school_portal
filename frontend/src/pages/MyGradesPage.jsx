import { useEffect, useState } from 'react'
import { gradeService, reportCardService } from '../services/gradeService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const GRADE_COLOR = (g) => {
    if (!g || g === '—') return 'text-slate-400'
    if (g.startsWith('A')) return 'text-green-600'
    if (g.startsWith('B')) return 'text-blue-600'
    if (g.startsWith('C')) return 'text-yellow-600'
    if (g === 'D') return 'text-orange-500'
    return 'text-red-600'
}

export default function MyGradesPage() {
    const { user } = useAuth()
    const [student, setStudent] = useState(null)
    const [report, setReport] = useState(null)
    const [term, setTerm] = useState(1)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        studentService.getMe()
            .then(setStudent)
            .catch((err) => {
                if (err.response?.status !== 404) toast.error('Failed to load student data')
                setStudent(null)
            })
            .finally(() => setLoading(false))
    }, [user])

    useEffect(() => {
        if (!student) return
        setLoading(true)
        reportCardService.get(student.id, term, academicYear)
            .then(setReport)
            .catch(() => setReport(null))
            .finally(() => setLoading(false))
    }, [student, term, academicYear])

    if (loading) return <div className="card p-8 text-center text-slate-500">Loading…</div>
    if (!student) return (
        <div className="card p-8 text-center text-slate-500">
            Your student profile is not set up yet. Contact the administrator.
        </div>
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">My Grades</h1>
                    <p className="text-slate-500 mt-1">{student.studentUid} · {student.sectionLabel || 'No class assigned'}</p>
                </div>
                <div className="flex gap-3 items-end">
                    <div>
                        <label className="field-label">Semester</label>
                        <select className="field w-36" value={term} onChange={e => setTerm(Number(e.target.value))}>
                            <option value={1}>Semester 1</option>
                            <option value={2}>Semester 2</option>
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Year</label>
                        <input className="field w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            {report && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="card text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Average</div>
                        <div className={`text-3xl font-bold mt-1 ${GRADE_COLOR(report.overallGrade)}`}>
                            {report.average ? report.average.toFixed(1) : '—'}
                        </div>
                        <div className={`text-sm font-semibold ${GRADE_COLOR(report.overallGrade)}`}>{report.overallGrade}</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Subjects</div>
                        <div className="text-3xl font-bold text-brand mt-1">{report.grades.length}</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Attendance</div>
                        <div className={`text-3xl font-bold mt-1 ${report.attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                            {report.attendancePercent}%
                        </div>
                        <div className="text-xs text-slate-400">{report.presentDays}/{report.totalDays} days</div>
                    </div>
                    <div className="card text-center">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Semester</div>
                        <div className="text-3xl font-bold text-brand mt-1">{term}</div>
                        <div className="text-xs text-slate-400">{academicYear}</div>
                    </div>
                </div>
            )}

            {/* Grade table */}
            {!report || report.grades.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                    No grades recorded for Semester {term}, {academicYear} yet.
                </div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">Subject</th>
                                <th className="px-4 py-3 text-center">Score</th>
                                <th className="px-4 py-3 text-center">Grade</th>
                                <th className="px-4 py-3 text-left">Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.grades.map(g => (
                                <tr key={g.id} className="border-b border-slate-100 hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{g.subjectName}</td>
                                    <td className="px-4 py-3 text-center">{g.score}/100</td>
                                    <td className={`px-4 py-3 text-center font-bold ${GRADE_COLOR(g.grade)}`}>{g.grade}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{g.comment || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 font-semibold">
                                <td className="px-4 py-3 text-slate-700">Overall Average</td>
                                <td className={`px-4 py-3 text-center ${GRADE_COLOR(report.overallGrade)}`}>
                                    {report.average ? report.average.toFixed(1) : '—'}/100
                                </td>
                                <td className={`px-4 py-3 text-center font-bold ${GRADE_COLOR(report.overallGrade)}`}>
                                    {report.overallGrade}
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
        </div>
    )
}
