import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { classService, curriculumService } from '../services/classService'
import { teacherService } from '../services/teacherService'
import { subjectService } from '../services/gradeService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const EMPTY = {
    grade: 9, section: 'A', academicYear: CURRENT_YEAR,
    homeroomTeacherId: '', maxCapacity: 40, stream: ''
}

// ── Class create/edit form ────────────────────────────────────────────────────
function ClassForm({ initial, teachers, onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...form,
            grade: Number(form.grade),
            maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
            homeroomTeacherId: form.homeroomTeacherId ? Number(form.homeroomTeacherId) : null,
            stream: form.stream || null,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">{t('grade')} *</label>
                    <select className="field" value={form.grade} onChange={e => set('grade', e.target.value)} required>
                        {[9, 10, 11, 12].map(g => <option key={g} value={g}>{t('grade')} {g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="field-label">{t('section')} *</label>
                    <input className="field" value={form.section}
                        onChange={e => set('section', e.target.value.toUpperCase())}
                        maxLength={5} required placeholder="A" />
                </div>
                <div>
                    <label className="field-label">{t('academicYear')} *</label>
                    <input className="field" value={form.academicYear}
                        onChange={e => set('academicYear', e.target.value)}
                        placeholder="2025/2026" required />
                </div>
                <div>
                    <label className="field-label">{t('maxCapacity')}</label>
                    <input className="field" type="number" value={form.maxCapacity}
                        onChange={e => set('maxCapacity', e.target.value)} min={1} max={100} />
                </div>
            </div>
            <div>
                <label className="field-label">{t('homeroomTeacher')}</label>
                <select className="field" value={form.homeroomTeacherId}
                    onChange={e => set('homeroomTeacherId', e.target.value)}>
                    <option value="">— {t('noneLabel')} —</option>
                    {teachers.map(tr => (
                        <option key={tr.id} value={tr.id}>{tr.fullName} ({tr.employeeId})</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                    {t('homeroomNote')}
                </p>
            </div>
            {Number(form.grade) >= 11 && (
                <div>
                    <label className="field-label">{t('stream')} * ({t('requiredForGrade1112')})</label>
                    <select className="field" value={form.stream}
                        onChange={e => set('stream', e.target.value)}
                        required={Number(form.grade) >= 11}>
                        <option value="">— {t('selectStream')} —</option>
                        <option value="NATURAL_SCIENCE">{t('naturalScience')}</option>
                        <option value="SOCIAL_SCIENCE">{t('socialScience')}</option>
                    </select>
                </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('saving') : t('save')}
                </button>
            </div>
        </form>
    )
}

// ── Subject-teacher assignment panel ─────────────────────────────────────────
function AssignmentsPanel({ cls, teachers, onClose }) {
    const { t } = useLanguage()
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)

    const load = () => {
        setLoading(true)
        classService.getAssignments(cls.id)
            .then(setAssignments)
            .catch(() => toast.error(t('failedToLoadAssignments')))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [cls.id])

    const handleAssign = async (subjectId, teacherId) => {
        setSaving(subjectId)
        try {
            await classService.assignTeacher(cls.id, {
                subjectId,
                teacherId: teacherId ? Number(teacherId) : null
            })
            toast.success(t('teacherAssigned'))
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToAssignTeacher'))
        } finally { setSaving(null) }
    }

    const handleApplyCurriculum = async () => {
        try {
            const curriculum = await curriculumService.get(cls.grade)
            if (curriculum.length === 0) {
                toast.error(`${t('noCurriculumForGrade')} ${cls.grade}.`)
                return
            }
            let applied = 0
            for (const c of curriculum) {
                try {
                    await classService.assignTeacher(cls.id, { subjectId: c.subjectId, teacherId: null })
                    applied++
                } catch { /* already assigned — skip */ }
            }
            toast.success(`${applied} ${t('subjectsAppliedFromCurriculum')} ${cls.grade}`)
            load()
        } catch { toast.error(t('failedToApplyCurriculum')) }
    }

    const unassigned = assignments.filter(a => !a.teacherId).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600">
                        {t('grade')} {cls.grade} – {t('section')} {cls.section} · {cls.academicYear}
                        {cls.stream && <span className="ml-2 text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">{cls.stream.replace('_', ' ')}</span>}
                    </p>
                    {unassigned > 0 && (
                        <p className="text-xs text-orange-600 font-medium mt-1">
                            ⚠️ {unassigned} {t('subjectsNeedTeacher')}
                        </p>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-6">{t('loading')}</div>
            ) : assignments.length === 0 ? (
                <div className="text-center text-slate-500 py-6 space-y-2">
                    <p>{t('noSubjectsAssigned')}</p>
                    <p className="text-xs text-slate-400">
                        {t('curriculumAutoApplied')}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {assignments.map(a => (
                        <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50">
                            <div className="flex-1 min-w-0">
                                <div className="font-medium text-slate-900 text-sm">{a.subjectName}</div>
                                {a.subjectCode && <div className="text-xs text-slate-400">{a.subjectCode}</div>}
                            </div>
                            <select
                                className="field text-sm py-1 w-48"
                                value={a.teacherId ?? ''}
                                disabled={saving === a.subjectId}
                                onChange={e => handleAssign(a.subjectId, e.target.value || null)}
                            >
                                <option value="">— {t('assignTeacher')} —</option>
                                {teachers.map(tr => (
                                    <option key={tr.id} value={tr.id}>{tr.fullName}</option>
                                ))}
                            </select>
                            {a.teacherId
                                ? <span className="text-green-600 text-lg" title="Assigned">✓</span>
                                : <span className="text-orange-400 text-lg" title="Unassigned">!</span>}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end pt-2">
                <button className="btn-ghost" onClick={onClose}>{t('close')}</button>
            </div>
        </div>
    )
}

// ── Grade curriculum manager ──────────────────────────────────────────────────
function CurriculumPanel({ onClose }) {
    const { t } = useLanguage()
    const [grade, setGrade] = useState(9)
    const [stream, setStream] = useState('')
    const [curriculum, setCurriculum] = useState([])
    const [allSubjects, setAllSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState('')

    const needsStream = grade >= 11

    const load = () => {
        setLoading(true)
        const effectiveStream = needsStream ? stream : null
        Promise.all([curriculumService.get(grade, effectiveStream), subjectService.getAll()])
            .then(([c, s]) => { setCurriculum(c); setAllSubjects(s) })
            .catch(() => toast.error(t('failedToLoadCurriculum')))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [grade, stream])

    const inCurriculum = new Set(curriculum.map(c => c.subjectId))
    const available = allSubjects.filter(s => !inCurriculum.has(s.id))

    const handleAdd = async () => {
        if (!selectedSubject) return
        if (needsStream && !stream) { toast.error(t('selectStreamFirst')); return }
        setAdding(true)
        try {
            await curriculumService.addSubject(grade, selectedSubject, needsStream ? stream : null)
            toast.success(t('subjectAddedToCurriculum'))
            setSelectedSubject('')
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToAdd'))
        } finally { setAdding(false) }
    }

    const handleRemove = async (subjectId) => {
        try {
            await curriculumService.removeSubject(grade, subjectId, needsStream ? stream : null)
            toast.success(t('subjectRemovedFromCurriculum'))
            load()
        } catch { toast.error(t('failedToRemove')) }
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                {t('curriculumDescription')}
            </p>

            <div className="flex gap-3 items-center flex-wrap">
                <div>
                    <label className="field-label mb-0">{t('grade')}:</label>
                    <select className="field w-32" value={grade} onChange={e => { setGrade(Number(e.target.value)); setStream('') }}>
                        {[9, 10, 11, 12].map(g => <option key={g} value={g}>{t('grade')} {g}</option>)}
                    </select>
                </div>
                {needsStream && (
                    <div>
                        <label className="field-label mb-0">{t('stream')}: *</label>
                        <select className="field w-44" value={stream} onChange={e => setStream(e.target.value)}>
                            <option value="">— {t('selectStream')} —</option>
                            <option value="NATURAL_SCIENCE">{t('naturalScience')}</option>
                            <option value="SOCIAL_SCIENCE">{t('socialScience')}</option>
                        </select>
                    </div>
                )}
            </div>

            {needsStream && !stream ? (
                <div className="card p-6 text-center text-slate-400 text-sm">
                    {t('selectStreamToView')} {grade} {t('curriculum')}.
                </div>
            ) : loading ? (
                <div className="text-center text-slate-500 py-4">{t('loading')}</div>
            ) : (
                <>
                    <div className="space-y-1">
                        {curriculum.length === 0 ? (
                            <p className="text-slate-400 text-sm py-2">
                                {t('noSubjectsInCurriculum')} {grade} {stream ? stream.replace('_', ' ') : ''}.
                            </p>
                        ) : curriculum.map((c, i) => (
                            <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="text-sm text-slate-800">
                                    <span className="text-slate-400 mr-2">{i + 1}.</span>
                                    {c.subjectName}
                                    {c.subjectCode && <span className="text-xs text-slate-400 ml-2">({c.subjectCode})</span>}
                                </div>
                                <button className="text-xs text-red-400 hover:text-red-600"
                                    onClick={() => handleRemove(c.subjectId)}>
                                    {t('remove')}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <select className="field flex-1" value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">— {t('addSubjectToCurriculum')} —</option>
                            {available.map(s => (
                                <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                            ))}
                        </select>
                        <button className="btn-primary px-4" onClick={handleAdd}
                            disabled={!selectedSubject || adding}>
                            {adding ? '…' : t('add')}
                        </button>
                    </div>
                </>
            )}

            <div className="flex justify-end pt-2">
                <button className="btn-ghost" onClick={onClose}>{t('close')}</button>
            </div>
        </div>
    )
}

// ── End Term modal ────────────────────────────────────────────────────────────
function EndTermModal({ onClose }) {
    const { t } = useLanguage()
    const [year, setYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const handleEndTerm = async () => {
        setLoading(true)
        try {
            const r = await classService.endTerm(year)
            setResult(r)
            toast.success(t('termEndedSuccess'))
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToEndTerm'))
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800">
                <strong>⚠️ {t('endOfYearAction')}</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>{t('endTermNote1')}</li>
                    <li>{t('endTermNote2')}</li>
                    <li>{t('endTermNote3')}</li>
                    <li>{t('endTermNote4')}</li>
                </ul>
            </div>

            {result ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 space-y-1">
                    <p>✅ {t('termEndedFor')} <strong>{year}</strong></p>
                    <p>📦 {result.archivedAssignments} {t('subjectAssignmentsArchived')}</p>
                    <p>👥 {result.studentsUnassigned} {t('studentsUnassigned')}</p>
                </div>
            ) : (
                <>
                    <div>
                        <label className="field-label">{t('academicYearToEnd')} *</label>
                        <input className="field" value={year} onChange={e => setYear(e.target.value)}
                            placeholder="2025/2026" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={handleEndTerm} disabled={loading || !year}>
                            {loading ? t('processing') : `⚠️ ${t('endTerm')}`}
                        </button>
                    </div>
                </>
            )}

            {result && (
                <div className="flex justify-end">
                    <button className="btn-primary" onClick={onClose}>{t('done')}</button>
                </div>
            )}
        </div>
    )
}

// ── Main ClassesPage ──────────────────────────────────────────────────────────
export default function ClassesPage() {
    const { t } = useLanguage()
    const [classes, setClasses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [c, trs] = await Promise.all([classService.getAll(), teacherService.getAll()])
            setClasses(c)
            setTeachers(trs)
        } catch {
            toast.error(t('failedToLoadClasses'))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.type === 'add') {
                await classService.create(payload)
                toast.success(t('classCreated'))
            } else {
                await classService.update(modal.cls.id, payload)
                toast.success(t('classUpdated'))
            }
            setModal(null)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await classService.remove(id)
            toast.success(t('classDeleted'))
            setConfirmDelete(null)
            load()
        } catch {
            toast.error(t('deleteFailed'))
        }
    }

    // Group by grade for 9-10, by grade+stream for 11-12
    const byGroup = classes.reduce((acc, c) => {
        const key = c.grade >= 11 && c.stream
            ? `${c.grade}||${c.stream}`
            : `${c.grade}||`
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
    }, {})

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('classesPage')}</h1>
                    <p className="text-slate-500 mt-1">{classes.length} {t('sectionsConfigured')}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-ghost text-sm" onClick={() => setModal({ type: 'curriculum' })}>
                        📚 {t('gradeCurriculum')}
                    </button>
                    <button className="btn-ghost text-sm border-orange-200 text-orange-600 hover:border-orange-400"
                        onClick={() => setModal({ type: 'endterm' })}>
                        🔄 {t('endTerm')}
                    </button>
                    <button className="btn-primary" onClick={() => setModal({ type: 'add' })}>
                        + {t('addClass')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : classes.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                    {t('noClassesYet')}
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(byGroup)
                        .sort(([a], [b]) => {
                            const [gradeA, streamA] = a.split('||')
                            const [gradeB, streamB] = b.split('||')
                            if (gradeA !== gradeB) return Number(gradeA) - Number(gradeB)
                            // Natural Science before Social Science
                            return (streamA || '').localeCompare(streamB || '')
                        })
                        .map(([groupKey, sections]) => {
                            const [gradeNum, stream] = groupKey.split('||')
                            const streamLabel = stream === 'NATURAL_SCIENCE'
                                ? t('naturalScience')
                                : stream === 'SOCIAL_SCIENCE'
                                    ? t('socialScience')
                                    : null
                            return (
                        <div key={groupKey}>
                            <h2 className="font-display font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                {t('grade')} {gradeNum}
                                {streamLabel && (
                                    <span className="text-xs font-semibold bg-brand/10 text-brand px-2 py-0.5 rounded-full">
                                        {streamLabel}
                                    </span>
                                )}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sections.map(cls => (
                                    <div key={cls.id} className="card flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-bold text-lg text-slate-900">
                                                    {t('section')} {cls.section}
                                                </div>
                                                <div className="text-xs text-slate-500">{cls.academicYear}</div>
                                            </div>
                                            <span className="text-xs bg-brand/10 text-brand font-medium px-2 py-0.5 rounded-full">
                                                {cls.studentCount} / {cls.maxCapacity ?? '∞'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <span className="text-slate-400">{t('homeroomTeacher')}: </span>
                                            {cls.homeroomTeacherName || '—'}
                                        </div>
                                        {cls.stream && Number(cls.grade) < 11 && (
                                            <div className="text-xs bg-brand/5 text-brand px-2 py-0.5 rounded-full w-fit">
                                                {cls.stream.replace('_', ' ')}
                                            </div>
                                        )}
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 flex-wrap">
                                            <button
                                                className="text-xs text-brand hover:underline font-medium"
                                                onClick={() => setModal({ type: 'assignments', cls })}
                                            >
                                                {t('subjectAssignments')}
                                            </button>
                                            <button
                                                className="text-xs text-slate-500 hover:underline"
                                                onClick={() => setModal({ type: 'edit', cls })}
                                            >
                                                {t('edit')}
                                            </button>
                                            <button
                                                className="text-xs text-red-500 hover:underline"
                                                onClick={() => setConfirmDelete(cls)}
                                            >
                                                {t('delete')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                            )
                        })}
                </div>
            )}

            {/* Add / Edit class */}
            {(modal?.type === 'add' || modal?.type === 'edit') && (
                <Modal
                    title={modal.type === 'add' ? t('addClass') : t('editClass')}
                    onClose={() => setModal(null)}
                >
                    <ClassForm
                        initial={modal.type === 'edit' ? {
                            grade: modal.cls.grade,
                            section: modal.cls.section,
                            academicYear: modal.cls.academicYear,
                            homeroomTeacherId: modal.cls.homeroomTeacherId || '',
                            maxCapacity: modal.cls.maxCapacity || 40,
                            stream: modal.cls.stream || '',
                        } : EMPTY}
                        teachers={teachers}
                        onSubmit={handleSave}
                        onClose={() => setModal(null)}
                        loading={saving}
                    />
                </Modal>
            )}

            {/* Subject-teacher assignments */}
            {modal?.type === 'assignments' && (
                <Modal
                    title={`${t('subjectAssignments')} – ${t('grade')} ${modal.cls.grade}${modal.cls.section}`}
                    onClose={() => { setModal(null); load() }}
                >
                    <AssignmentsPanel
                        cls={modal.cls}
                        teachers={teachers}
                        onClose={() => { setModal(null); load() }}
                    />
                </Modal>
            )}

            {/* Grade curriculum manager */}
            {modal?.type === 'curriculum' && (
                <Modal title={t('gradeCurriculum')} onClose={() => setModal(null)}>
                    <CurriculumPanel onClose={() => setModal(null)} />
                </Modal>
            )}

            {/* End Term */}
            {modal?.type === 'endterm' && (
                <Modal title={t('endAcademicYearTerm')} onClose={() => setModal(null)}>
                    <EndTermModal onClose={() => { setModal(null); load() }} />
                </Modal>
            )}

            {/* Delete confirm */}
            {confirmDelete && (
                <Modal title={t('confirmDelete')} onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        {t('deleteClassConfirm')} <strong>{t('grade')} {confirmDelete.grade} – {t('section')} {confirmDelete.section}</strong>?
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
