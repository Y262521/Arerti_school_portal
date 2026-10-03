import { useEffect, useState } from 'react'
import { teacherService } from '../services/teacherService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const EMPTY = {
    username: '', email: '', password: '', fullName: '', phone: '',
    qualification: '', specialization: '', hireDate: ''
}

function TeacherForm({ initial, onSubmit, onClose, loading }) {
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        const payload = {
            ...form,
            hireDate: form.hireDate || null,
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
                    <label className="field-label">Hire Date</label>
                    <input className="field" type="date" value={form.hireDate}
                        onChange={e => set('hireDate', e.target.value)} />
                </div>
                <div>
                    <label className="field-label">Qualification</label>
                    <input className="field" value={form.qualification}
                        onChange={e => set('qualification', e.target.value)}
                        placeholder="e.g. BSc, MSc" />
                </div>
                <div>
                    <label className="field-label">Specialization</label>
                    <input className="field" value={form.specialization}
                        onChange={e => set('specialization', e.target.value)}
                        placeholder="e.g. Mathematics" />
                </div>
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

export default function TeachersPage() {
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [search, setSearch] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            setTeachers(await teacherService.getAll())
        } catch {
            toast.error('Failed to load teachers')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                await teacherService.create(payload)
                toast.success('Teacher added')
            } else {
                await teacherService.update(modal.teacher.id, payload)
                toast.success('Teacher updated')
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
            await teacherService.remove(id)
            toast.success('Teacher deleted')
            setConfirmDelete(null)
            load()
        } catch {
            toast.error('Delete failed')
        }
    }

    const filtered = teachers.filter(t =>
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Teachers</h1>
                    <p className="text-slate-500 mt-1">{teachers.length} staff members</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                    + Add Teacher
                </button>
            </div>

            <div className="mb-4">
                <input
                    className="field max-w-sm"
                    placeholder="Search by name, ID or subject…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading…</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No teachers found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Specialization</th>
                                <th className="px-4 py-3">Qualification</th>
                                <th className="px-4 py-3">Hire Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-mono text-brand text-xs">{t.employeeId}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{t.fullName}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.email}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.specialization || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.qualification || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.hireDate || '—'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button
                                            className="text-xs text-brand hover:underline"
                                            onClick={() => setModal({ mode: 'edit', teacher: t })}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="text-xs text-red-500 hover:underline"
                                            onClick={() => setConfirmDelete(t)}
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

            {modal && (
                <Modal
                    title={modal.mode === 'add' ? 'Add Teacher' : 'Edit Teacher'}
                    onClose={() => setModal(null)}
                >
                    <TeacherForm
                        initial={modal.mode === 'edit' ? {
                            username: modal.teacher.username,
                            email: modal.teacher.email,
                            password: '',
                            fullName: modal.teacher.fullName,
                            phone: modal.teacher.phone || '',
                            qualification: modal.teacher.qualification || '',
                            specialization: modal.teacher.specialization || '',
                            hireDate: modal.teacher.hireDate || '',
                        } : EMPTY}
                        onSubmit={handleSave}
                        onClose={() => setModal(null)}
                        loading={saving}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        Delete teacher <strong>{confirmDelete.fullName}</strong> ({confirmDelete.employeeId})?
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
