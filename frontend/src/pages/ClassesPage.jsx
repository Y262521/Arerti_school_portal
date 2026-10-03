import { useEffect, useState } from 'react'
import { classService } from '../services/classService'
import { teacherService } from '../services/teacherService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const EMPTY = {
    grade: 9, section: 'A', academicYear: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
    homeroomTeacherId: '', maxCapacity: 40
}

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
                        <option key={t.id} value={t.id}>
                            {t.fullName} ({t.employeeId})
                        </option>
                    ))}
                </select>
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

export default function ClassesPage() {
    const [classes, setClasses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
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
            if (modal.mode === 'add') {
                await classService.create(payload)
                toast.success('Class created')
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

    // Group by grade for display
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
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                    + Add Class
                </button>
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
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-slate-100">
                                            <button
                                                className="text-xs text-brand hover:underline"
                                                onClick={() => setModal({
                                                    mode: 'edit',
                                                    cls,
                                                })}
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

            {modal && (
                <Modal
                    title={modal.mode === 'add' ? 'Add Class' : 'Edit Class'}
                    onClose={() => setModal(null)}
                >
                    <ClassForm
                        initial={modal.mode === 'edit' ? {
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
