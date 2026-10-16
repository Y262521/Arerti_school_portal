import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'

export default function SupervisorClassesPage() {
    const { t } = useLanguage()
    const [classes, setClasses] = useState([])
    const [assignments, setAssignments] = useState({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [expanded, setExpanded] = useState({})

    useEffect(() => {
        setLoading(true)
        api.get('/classes/my-supervised')
            .then(r => { setClasses(r.data); setLoading(false) })
            .catch(() => { setError(t('failedToLoadClasses')); setLoading(false) })
    }, [])

    const loadAssignments = async (sectionId) => {
        if (assignments[sectionId]) return
        try {
            const res = await api.get(`/classes/${sectionId}/assignments`)
            setAssignments(prev => ({ ...prev, [sectionId]: res.data }))
        } catch {
            setAssignments(prev => ({ ...prev, [sectionId]: [] }))
        }
    }

    const toggle = (id) => {
        const isOpen = expanded[id]
        setExpanded(prev => ({ ...prev, [id]: !isOpen }))
        if (!isOpen) loadAssignments(id)
    }

    const sectionLabel = (cls) => {
        let label = `Grade ${cls.grade} - ${cls.section}`
        if (cls.stream) label += ` (${cls.stream.replace('_', ' ')})`
        return label
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('supervisedClasses')}</h1>
                <p className="text-slate-500 mt-1">{t('myClasses')}</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : classes.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noClassesAssigned')}</div>
            ) : (
                <div className="space-y-3">
                    {classes.map(cls => (
                        <div key={cls.id} className="card p-0 overflow-hidden">
                            <button
                                onClick={() => toggle(cls.id)}
                                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition text-left"
                            >
                                <div>
                                    <span className="font-semibold text-slate-900">{sectionLabel(cls)}</span>
                                    <span className="ml-3 text-xs text-slate-500">{cls.academicYear}</span>
                                    {cls.homeroomTeacherName && (
                                        <span className="ml-3 text-xs text-slate-500">
                                            {t('homeroomTeacher')}: {cls.homeroomTeacherName}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs text-slate-500">{cls.studentCount} {t('studentsCount')}</span>
                                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${expanded[cls.id] ? 'rotate-180' : ''}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </button>

                            {expanded[cls.id] && (
                                <div className="border-t border-slate-100 px-5 py-4">
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        {t('subjectAssignments')}
                                    </h4>
                                    {!assignments[cls.id] ? (
                                        <p className="text-sm text-slate-400">{t('loading')}</p>
                                    ) : assignments[cls.id].length === 0 ? (
                                        <p className="text-sm text-slate-400">{t('noSubjectsAssigned')}</p>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-100 text-xs text-slate-500 uppercase tracking-wide">
                                                        <th className="py-2 text-left">{t('subjectLabel')}</th>
                                                        <th className="py-2 text-left">{t('teacherLabel')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {assignments[cls.id].map(a => (
                                                        <tr key={a.id} className="border-b border-slate-50 last:border-0">
                                                            <td className="py-2 text-slate-700">{a.subjectName}</td>
                                                            <td className="py-2 text-slate-500">
                                                                {a.teacherName || <span className="text-slate-300">{t('unassigned')}</span>}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
