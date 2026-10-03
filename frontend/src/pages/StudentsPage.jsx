import { useEffect, useState } from 'react'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const EMPTY = {
    username: '', email: '', password: '', fullName: '', phone: '',
    dateOfBirth: '', gender: '', guardianName: '', guardianPhone: '',
    enrollmentYear: new Date().getFullYear(), sectionId: ''
}

function StudentForm({ initial, sections, onSubmit, onClose, loading }) {
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            ...form,
            sectionId: form.sectionId ? Number(form.sectionId) : null,
            enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : null,
            dateOfBirth: form.dateOfBirth || null,
            password: form.password || undefined,
        }
        onSubmit(payload)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">Full Name *</label>
                    <input className="field" value={form.fullName} onChange={e => set('fullName', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">Username *</label>
                    <input className="field" value={form.username} onChange={e => set('username', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">Email *</label>
                    <input className="field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">Password {initial.username ? '(leave blank to keep)' : '*'}</label>
                    <input className="field" type="password" value={form.password}
                        onChange={e => set('password', e.target.value)}
                        required={!initial.username} minLength={6} />
                </div>
                <div>
                    <label className="field-label">Phone</label>
                    <input className="field" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Gender</label>
                    <select className="field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">—</option>
                        <option>Male</option>
                        <option>Female</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">Date of Birth</label>
                    <input className="field" type="date" value={form.dateOfBirth}
                        onChange={e => set('dateOfBirth', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Enrollment Year</label>
                    <input className="field" type="number" value={form.enrollmentYear}
                        onChange={e => set('enrollmentYear', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Guardian Name</label>
                    <input className="field" value={form.guardianName} onChange={e => set('guardianName', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Guardian Phone</label>
                    <input className="field" value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)} />
                </div>
            </div>
            <div>
                <label className="field-label">Class / Section</label>
                <select className="field" value={form.sectionId} onChange={e => set('sectionId', e.target.value)}>
                    <option value="">— Unassigned —</option>
                    {sections.map(s => (
                        <option key={s.id} value={s.id}>
                            Grade {s.grade} – {s.section} ({s.academicYear})
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

export default function StudentsPage() {
    const [students, setStudents] = useState([])
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null) // null | { mode: 'add'|'edit', student?: obj }
    const [search, setSearch] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [s, c] = await Promise.all([studentService.getAll(), classService.getAll()])
            setStudents(s)
            setSections(c)
        } catch {
            toast.error('Failed to load students')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                await studentService.create(payload)
                toast.success('Student added')
            } else {
                await studentService.update(modal.student.id, payload)
                toast.success('Student updated')
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
            await studentService.remove(id)
            toast.success('Student deleted')
            setConfirmDelete(null)
            load()
        } catch {
            toast.error('Delete failed')
        }
    }

    const filtered = students.filter(s =>
        s.fullName.toLowerCase().includes(search.toLowerCase()) ||
        s.studentUid.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Students</h1>
                    <p className="text-slate-500 mt-1">{students.length} enrolled</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                    + Add Student
                </button>
            </div>

            <div className="mb-4">
                <input
                    className="field max-w-sm"
                    placeholder="Search by name, UID or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No students found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3">UID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Gender</th>
                                <th className="px-4 py-3">Class</th>
                                <th className="px-4 py-3">Guardian</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-mono text-brand text-xs">{s.studentUid}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{s.fullName}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.email}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.gender || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.sectionLabel || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.guardianName || '—'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            className="text-xs text-brand hover:underline"
                                            onClick={() => setModal({
                                                mode: 'edit',
                                                student: s,
                                            })}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-xs text-red-500 hover:underline"
                                            onClick={() => setConfirmDelete(s)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add/Edit Modal */}
            {modal && (
                <Modal
                    title={modal.mode === 'add' ? 'Add Student' : 'Edit Student'}
                    onClose={() => setModal(null)}
                >
                    <StudentForm
                        initial={modal.mode === 'edit' ? {
                            username: modal.student.username,
                            email: modal.student.email,
                            password: '',
                            fullName: modal.student.fullName,
                            phone: modal.student.phone || '',
                            dateOfBirth: modal.student.dateOfBirth || '',
                            gender: modal.student.gender || '',
                            guardianName: modal.student.guardianName || '',
                            guardianPhone: modal.student.guardianPhone || '',
                            enrollmentYear: modal.student.enrollmentYear || new Date().getFullYear(),
                            sectionId: modal.student.sectionId || '',
                        } : EMPTY}
                        sections={sections}
                        onSubmit={handleSave}
                        onClose={() => setModal(null)}
                        loading={saving}
                    />
                </Modal>
            )}

            {/* Delete confirm */}
            {confirmDelete && (
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        Delete student <strong>{confirmDelete.fullName}</strong> ({confirmDelete.studentUid})?
                        This will also remove their login account.
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
