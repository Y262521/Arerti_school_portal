import { useEffect, useState } from 'react'
import { classService, curriculumService } from '../services/classService'
import { teacherService } from '../services/teacherService'
import { subjectService } from '../services/gradeService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const EMPTY = {
    grade: 9, section: 'A', academicYear: CURRENT_YEAR,
    homeroomTeacherId: '', maxCapacity: 40
}

// ── Class create/edit form ────────────────────────────────────────────────────
function ClassForm({ initial, teachers, onSubmit, onClose, loading }) {
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...form,
            grade: Number(form.grade),
            maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : null,
            homeroomTeacherId: form.homeroomTeacherId ? Number(form.homeroomTeacherId) : null,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">Grade *</label>
                    <select className="field" value={form.grade} onChange={e => set('grade', e.target.value)} required>
                        {[9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                </div>
                <div>
                    <label className="field-label">Section *</label>
                    <input className="field" value={form.section}
                        onChange={e => set('section', e.target.value.toUpperCase())}
                        maxLength={5} required placeholder="A" />
                </div>
                <div>
                    <label className="field-label">Academic Year *</label>
                    <input className="field" value={form.academicYear}
                        onChange={e => set('academicYear', e.target.value)}
                        placeholder="2025/2026" required />
                </div>
                <div>
                    <label className="field-label">Max Capacity</label>
                    <input className="field" type="number" value={form.maxCapacity}
                        onChange={e => set('maxCapacity', e.target.value)} min={1} max={100} />
                </div>
            </div>
            <div>
                <label className="field-label">Homeroom Teacher</label>
                <select className="field" value={form.homeroomTeacherId}
                    onChange={e => set('homeroomTeacherId', e.target.value)}>
                    <option value="">— None —</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId})</option>
                    ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">
                    The homeroom teacher is the only teacher who can mark attendance for this class.
                </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : 'Save'}
                </button>
            </div>
        </form>
    )
}

// ── Subject-teacher assignment panel ─────────────────────────────────────────
function AssignmentsPanel({ cls, teachers, onClose }) {
    const [assignments, setAssignments] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(null)

    const load = () => {
        setLoading(true)
        classService.getAssignments(cls.id)
            .then(setAssignments)
            .catch(() => toast.error('Failed to load assignments'))
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
            toast.success('Teacher assigned')
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign teacher')
        } finally { setSaving(null) }
    }

    const handleApplyCurriculum = async () => {
        try {
            const curriculum = await curriculumService.get(cls.grade)
            if (curriculum.length === 0) {
                toast.error(`No curriculum defined for Grade ${cls.grade}. Set it up first via 📚 Grade Curriculum.`)
                return
            }
            let applied = 0
            for (const c of curriculum) {
                try {
                    await classService.assignTeacher(cls.id, { subjectId: c.subjectId, teacherId: null })
                    applied++
                } catch { /* already assigned — skip */ }
            }
            toast.success(`${applied} subject(s) applied from Grade ${cls.grade} curriculum`)
            load()
        } catch { toast.error('Failed to apply curriculum') }
    }

    const unassigned = assignments.filter(a => !a.teacherId).length

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600">
                        Grade {cls.grade} – Section {cls.section} · {cls.academicYear}
                    </p>
                    {unassigned > 0 && (
                        <p className="text-xs text-orange-600 font-medium mt-1">
                            ⚠️ {unassigned} subject{unassigned > 1 ? 's' : ''} still need a teacher assigned
                        </p>
                    )}
                </div>
                <button className="btn-ghost text-xs" onClick={handleApplyCurriculum}>
                    ↺ Apply Grade {cls.grade} Curriculum
                </button>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-6">Loading…</div>
            ) : assignments.length === 0 ? (
                <div className="text-center text-slate-500 py-6 space-y-3">
                    <p>No subjects assigned yet.</p>
                    <button className="btn-primary text-sm" onClick={handleApplyCurriculum}>
                        ↺ Apply Grade {cls.grade} Curriculum
                    </button>
                    <p className="text-xs text-slate-400">
                        If nothing applies, go to 📚 Grade Curriculum and add subjects first.
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
                                <option value="">— Assign teacher —</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.fullName}</option>
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
                <button className="btn-ghost" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}

// ── Grade curriculum manager ──────────────────────────────────────────────────
function CurriculumPanel({ onClose }) {
    const [grade, setGrade] = useState(9)
    const [curriculum, setCurriculum] = useState([])
    const [allSubjects, setAllSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [adding, setAdding] = useState(false)
    const [selectedSubject, setSelectedSubject] = useState('')

    const load = () => {
        setLoading(true)
        Promise.all([curriculumService.get(grade), subjectService.getAll()])
            .then(([c, s]) => { setCurriculum(c); setAllSubjects(s) })
            .catch(() => toast.error('Failed to load curriculum'))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [grade])

    const inCurriculum = new Set(curriculum.map(c => c.subjectId))
    const available = allSubjects.filter(s => !inCurriculum.has(s.id))

    const handleAdd = async () => {
        if (!selectedSubject) return
        setAdding(true)
        try {
            await curriculumService.addSubject(grade, selectedSubject)
            toast.success('Subject added to curriculum')
            setSelectedSubject('')
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add')
        } finally { setAdding(false) }
    }

    const handleRemove = async (subjectId) => {
        try {
            await curriculumService.removeSubject(grade, subjectId)
            toast.success('Subject removed from curriculum')
            load()
        } catch { toast.error('Failed to remove') }
    }

    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500">
                Define which subjects are automatically assigned when a new class is created for each grade.
            </p>

            <div className="flex gap-3 items-center">
                <label className="field-label mb-0">Grade:</label>
                <select className="field w-32" value={grade} onChange={e => setGrade(Number(e.target.value))}>
                    {[9, 10, 11, 12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-center text-slate-500 py-4">Loading…</div>
            ) : (
                <>
                    <div className="space-y-1">
                        {curriculum.length === 0 ? (
                            <p className="text-slate-400 text-sm py-2">No subjects in Grade {grade} curriculum yet.</p>
                        ) : curriculum.map((c, i) => (
                            <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-100">
                                <div className="text-sm text-slate-800">
                                    <span className="text-slate-400 mr-2">{i + 1}.</span>
                                    {c.subjectName}
                                    {c.subjectCode && <span className="text-xs text-slate-400 ml-2">({c.subjectCode})</span>}
                                </div>
                                <button
                                    className="text-xs text-red-400 hover:text-red-600"
                                    onClick={() => handleRemove(c.subjectId)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                        <select className="field flex-1" value={selectedSubject}
                            onChange={e => setSelectedSubject(e.target.value)}>
                            <option value="">— Add subject to curriculum —</option>
                            {available.map(s => (
                                <option key={s.id} value={s.id}>{s.name}{s.code ? ` (${s.code})` : ''}</option>
                            ))}
                        </select>
                        <button className="btn-primary px-4" onClick={handleAdd}
                            disabled={!selectedSubject || adding}>
                            {adding ? '…' : 'Add'}
                        </button>
                    </div>
                </>
            )}

            <div className="flex justify-end pt-2">
                <button className="btn-ghost" onClick={onClose}>Close</button>
            </div>
        </div>
    )
}

// ── End Term modal ────────────────────────────────────────────────────────────
function EndTermModal({ onClose }) {
    const [year, setYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const handleEndTerm = async () => {
        setLoading(true)
        try {
            const r = await classService.endTerm(year)
            setResult(r)
            toast.success('Term ended successfully')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to end term')
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-4 text-sm text-orange-800">
                <strong>⚠️ End of Academic Year Action</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>All subject-teacher assignments for the year will be <strong>archived</strong></li>
                    <li>All students will be <strong>unassigned</strong> from their current classes</li>
                    <li>Class records, subjects, and assignment history are <strong>preserved</strong></li>
                    <li>You will need to reassign students to their new classes manually</li>
                </ul>
            </div>

            {result ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800 space-y-1">
                    <p>✅ Term ended for <strong>{year}</strong></p>
                    <p>📦 {result.archivedAssignments} subject assignments archived</p>
                    <p>👥 {result.studentsUnassigned} students unassigned from classes</p>
                </div>
            ) : (
                <>
                    <div>
                        <label className="field-label">Academic Year to End *</label>
                        <input className="field" value={year} onChange={e => setYear(e.target.value)}
                            placeholder="2025/2026" />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button className="btn-danger" onClick={handleEndTerm} disabled={loading || !year}>
                            {loading ? 'Processing…' : '⚠️ End Term'}
                        </button>
                    </div>
                </>
            )}

            {result && (
                <div className="flex justify-end">
                    <button className="btn-primary" onClick={onClose}>Done</button>
                </div>
            )}
        </div>
    )
}

// ── Main ClassesPage ──────────────────────────────────────────────────────────
export default function ClassesPage() {
    const [classes, setClasses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null) // null | { type: 'add'|'edit'|'assignments'|'curriculum'|'endterm', cls? }
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [c, t] = await Promise.all([classService.getAll(), teacherService.getAll()])
            setClasses(c)
            setTeachers(t)
        } catch {
            toast.error('Failed to load classes')
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
                toast.success('Class created — curriculum auto-applied from grade template')
            } else {
                await classService.update(modal.cls.id, payload)
                toast.success('Class updated')
            }
            setModal(null)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await classService.remove(id)
            toast.success('Class deleted')
            setConfirmDelete(null)
            load()
        } catch {
            toast.error('Delete failed')
        }
    }

    const byGrade = classes.reduce((acc, c) => {
        const key = `Grade ${c.grade}`
        if (!acc[key]) acc[key] = []
        acc[key].push(c)
        return acc
    }, {})

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Classes</h1>
                    <p className="text-slate-500 mt-1">{classes.length} sections configured</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-ghost text-sm" onClick={() => setModal({ type: 'curriculum' })}>
                        📚 Grade Curriculum
                    </button>
                    <button className="btn-ghost text-sm border-orange-200 text-orange-600 hover:border-orange-400"
                        onClick={() => setModal({ type: 'endterm' })}>
                        🔄 End Term
                    </button>
                    <button className="btn-primary" onClick={() => setModal({ type: 'add' })}>
                        + Add Class
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : classes.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                    No classes yet. Add your first class to get started.
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(byGrade).sort().map(([gradeLabel, sections]) => (
                        <div key={gradeLabel}>
                            <h2 className="font-display font-semibold text-slate-700 mb-2">{gradeLabel}</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sections.map(cls => (
                                    <div key={cls.id} className="card flex flex-col gap-2">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="font-bold text-lg text-slate-900">
                                                    Section {cls.section}
                                                </div>
                                                <div className="text-xs text-slate-500">{cls.academicYear}</div>
                                            </div>
                                            <span className="text-xs bg-brand/10 text-brand font-medium px-2 py-0.5 rounded-full">
                                                {cls.studentCount} / {cls.maxCapacity ?? '∞'}
                                            </span>
                                        </div>
                                        <div className="text-sm text-slate-600">
                                            <span className="text-slate-400">Homeroom: </span>
                                            {cls.homeroomTeacherName || '—'}
                                        </div>
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100 flex-wrap">
                                            <button
                                                className="text-xs text-brand hover:underline font-medium"
                                                onClick={() => setModal({ type: 'assignments', cls })}
                                            >
                                                Subject Assignments
                                            </button>
                                            <button
                                                className="text-xs text-slate-500 hover:underline"
                                                onClick={() => setModal({ type: 'edit', cls })}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                className="text-xs text-red-500 hover:underline"
                                                onClick={() => setConfirmDelete(cls)}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit class */}
            {(modal?.type === 'add' || modal?.type === 'edit') && (
                <Modal
                    title={modal.type === 'add' ? 'Add Class' : 'Edit Class'}
                    onClose={() => setModal(null)}
                >
                    <ClassForm
                        initial={modal.type === 'edit' ? {
                            grade: modal.cls.grade,
                            section: modal.cls.section,
                            academicYear: modal.cls.academicYear,
                            homeroomTeacherId: modal.cls.homeroomTeacherId || '',
                            maxCapacity: modal.cls.maxCapacity || 40,
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
                    title={`Subject Assignments — Grade ${modal.cls.grade}${modal.cls.section}`}
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
                <Modal title="Grade Curriculum" onClose={() => setModal(null)}>
                    <CurriculumPanel onClose={() => setModal(null)} />
                </Modal>
            )}

            {/* End Term */}
            {modal?.type === 'endterm' && (
                <Modal title="End Academic Year Term" onClose={() => setModal(null)}>
                    <EndTermModal onClose={() => { setModal(null); load() }} />
                </Modal>
            )}

            {/* Delete confirm */}
            {confirmDelete && (
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        Delete <strong>Grade {confirmDelete.grade} – Section {confirmDelete.section}</strong>?
                        Students assigned to this class will become unassigned.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
