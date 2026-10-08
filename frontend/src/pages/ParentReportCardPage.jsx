import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { parentService } from '../services/parentService'
import { reportCardService } from '../services/gradeService'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => {
    const y = currentYear - 3 + i
    return `${y}/${y + 1}`
})

const GRADE_COLOR = (g) => {
    if (!g || g === '—') return 'text-slate-400'
    if (g.startsWith('A')) return 'text-green-600'
    if (g.startsWith('B')) return 'text-blue-600'
    if (g.startsWith('C')) return 'text-yellow-600'
    if (g === 'D') return 'text-orange-500'
    return 'text-red-600'
}

function ReportCard({ child, term, academicYear }) {
    const { t } = useLanguage()
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        reportCardService.get(child.studentId, term, academicYear)
            .then(setReport)
            .catch(() => setReport(null))
            .finally(() => setLoading(false))
    }, [child.studentId, term, academicYear])

    if (loading) return (
        <div className="card p-6 text-center text-slate-400 text-sm">{t('loadingReportCard')}</div>
    )

    if (!report || report.grades.length === 0) return (
        <div className="card p-6 text-center text-slate-400 text-sm">
            {t('noGradesForSemester')} {term}, {academicYear}.
        </div>
    )

    return (
        <div className="card">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{t('average')}</div>
                    <div className={`text-3xl font-bold mt-1 ${GRADE_COLOR(report.overallGrade)}`}>
                        {report.average ? report.average.toFixed(1) : '—'}
                    </div>
                    <div className={`text-sm font-semibold ${GRADE_COLOR(report.overallGrade)}`}>
                        {report.overallGrade}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{t('subjectsLabel')}</div>
                    <div className="text-3xl font-bold text-brand mt-1">{report.grades.length}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{t('attendance')}</div>
                    <div className={`text-3xl font-bold mt-1 ${report.attendancePercent >= 75 ? 'text-green-600' : 'text-red-600'}`}>
                        {report.attendancePercent}%
                    </div>
                    <div className="text-xs text-slate-400">{report.presentDays}/{report.totalDays} {t('daysLabel')}</div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{t('semester')}</div>
                    <div className="text-3xl font-bold text-brand mt-1">{term}</div>
                    <div className="text-xs text-slate-400">{academicYear}</div>
                </div>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                            <th className="px-4 py-3 text-left">{t('subjectLabel')}</th>
                            <th className="px-4 py-3 text-center">{t('scoreLabel')}</th>
                            <th className="px-4 py-3 text-center">{t('gradeLabel')}</th>
                            <th className="px-4 py-3 text-left">{t('teacherCommentLabel')}</th>
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
                            <td className="px-4 py-3 text-slate-700">{t('overallAverage')}</td>
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
        </div>
    )
}

export default function ParentReportCardPage() {
    const { t } = useLanguage()
    const [children, setChildren] = useState([])
    const [selectedChild, setSelectedChild] = useState(null)
    const [term, setTerm] = useState(1)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        parentService.getChildren()
            .then(data => {
                setChildren(data)
                if (data.length > 0) setSelectedChild(data[0])
            })
            .catch(() => toast.error(t('failedToLoadChildren')))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="card p-8 text-center text-slate-500">{t('loading')}</div>

    if (children.length === 0) return (
        <div className="card p-8 text-center text-slate-500">
            {t('noChildrenForReportCard')}
        </div>
    )

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('reportCards')}</h1>
                <p className="text-slate-500 mt-1">{t('reportCardsSubtitle')}</p>
            </div>

            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
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

                <div>
                    <label className="field-label">{t('semester')}</label>
                    <select className="field w-36" value={term} onChange={e => setTerm(Number(e.target.value))}>
                        <option value={1}>{t('semester')} 1</option>
                        <option value={2}>{t('semester')} 2</option>
                    </select>
                </div>

                <div>
                    <label className="field-label">{t('academicYear')}</label>
                    <select
                        className="field w-36"
                        value={academicYear}
                        onChange={e => setAcademicYear(e.target.value)}
                    >
                        {YEAR_OPTIONS.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedChild && (
                <div className="flex items-center gap-3 mb-4">
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

            {selectedChild && (
                <ReportCard
                    key={`${selectedChild.studentId}-${term}-${academicYear}`}
                    child={selectedChild}
                    term={term}
                    academicYear={academicYear}
                />
            )}
        </div>
    )
}
