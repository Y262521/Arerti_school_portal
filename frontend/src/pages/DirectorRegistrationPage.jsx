import { useEffect, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { teacherService } from '../services/teacherService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

function OpenWindowForm({ onSubmit, onClose, loading }) {
    const [form, setForm] = useState({
        academicYear: CURRENT_YEAR,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        note: ''
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">Academic Year *</label>
                    <input className="field" value={form.academicYear}
                        onChange={e => set('academicYear', e.target.value)}
                        placeholder="2026/2027" required />
                </div>
                <div>
                    <label className="field-label">Start Date *</label>
                    <input className="field" type="date" value={form.startDate}
                        onChange={e => set('startDate', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">End Date *</label>
                    <input className="field" type="date" value={form.endDate}
                        onChange={e => set('endDate', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">Note</label>
                    <input className="field" value={form.note}
                        onChange={e => set('note', e.target.value)}
                        placeholder="Optional note" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Opening…' : 'Open Window'}
                </button>
            </div>
        </form>
    )
}

function AssignTeacherForm({ windowId, teachers, existingAssignments, onSuccess, onClose }) {
    const [teacherId, setTeacherId] = useState('')
    const [grades, setGrades] = useState({ 9: false, 10: false, 11: false, 12: false })
    const [loading, setLoading] = useState(false)

    const assignedTeacherIds = new Set(existingAssignments.map(a => a.teacherId))

    const handleSubmit = async (e) => {
        e.preventDefault()
        const selected = Object.entries(grades).filter(([, v]) => v).map(([g]) => g)
        if (selected.length === 0) { toast.error('Select at least one grade'); return }

        setLoading(true)
        try {
            await registrationService.assignTeacher(windowId, {
                teacherId: Number(teacherId),
                allowedGrades: selected.join(',')
            })
            toast.success('Teacher assigned')
            onSuccess()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to assign')
        } finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="field-label">Teacher *</label>
                <select className="field" value={teacherId}
                    onChange={e => setTeacherId(e.target.value)} required>
                    <option value="">— Select teacher —</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>
                            {t.fullName} ({t.employeeId})
                            {assignedTeacherIds.has(t.id) ? ' ✓ already assigned' : ''}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="field-label">Allowed Grades *</label>
                <div className="flex gap-4 mt-1">
                    {[9, 10, 11, 12].map(g => (
                        <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input type="checkbox" checked={grades[g]}
                                onChange={e => setGrades(p => ({ ...p, [g]: e.target.checked }))} />
                            Grade {g}
                        </label>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || !teacherId}>
                    {loading ? 'Assigning…' : 'Assign Teacher'}
                </button>
            </div>
        </form>
    )
}

export default function DirectorRegistrationPage() {
    const [windows, setWindows] = useState([])
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [assignModal, setAssignModal] = useState(null)  // windowId
    const [openingWindow, setOpeningWindow] = useState(false)
    const [confirmClose, setConfirmClose] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [w, t] = await Promise.all([
                registrationService.getWindows(),
                teacherService.getAll()
            ])
            setWindows(w)
            setTeachers(t)
        } catch { toast.error('Failed to load') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleOpenWindow = async (payload) => {
        setOpeningWindow(true)
        try {
            await registrationService.openWindow(payload)
            toast.success('Registration window opened')
            setOpenModal(false)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to open window')
        } finally { setOpeningWindow(false) }
    }

    const handleCloseWindow = async (id) => {
        try {
            await registrationService.closeWindow(id)
            toast.success('Registration window closed')
            setConfirmClose(null)
            load()
        } catch { toast.error('Failed to close') }
    }

    const handleRemoveAssignment = async (assignmentId) => {
        try {
            await registrationService.removeAssignment(assignmentId)
            toast.success('Assignment removed')
            load()
        } catch { toast.error('Failed to remove') }
    }

    const activeWindows = windows.filter(w => w.status === 'OPEN')
    const closedWindows = windows.filter(w => w.status === 'CLOSED')

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Student Registration</h1>
                    <p className="text-slate-500 mt-1">Manage registration windows and teacher assignments</p>
                </div>
                <button className="btn-primary" onClick={() => setOpenModal(true)}>
                    + Open Registration Window
                </button>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : (
                <div className="space-y-6">
                    {/* Active windows */}
                    {activeWindows.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                Active Windows ({activeWindows.length})
                            </h2>
                            <div className="space-y-4">
                                {activeWindows.map(w => (
                                    <WindowCard
                                        key={w.id} window={w} teachers={teachers}
                                        onAssign={() => setAssignModal(w)}
                                        onClose={() => setConfirmClose(w)}
                                        onRemoveAssignment={handleRemoveAssignment}
                                        active
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {windows.length === 0 && (
                        <div className="card p-8 text-center text-slate-500">
                            No registration windows yet. Open one to start student enrollment.
                        </div>
                    )}

                    {/* Closed windows */}
                    {closedWindows.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-500 mb-3 text-sm uppercase tracking-wide">
                                Past Windows ({closedWindows.length})
                            </h2>
                            <div className="space-y-3">
                                {closedWindows.map(w => (
                                    <WindowCard
                                        key={w.id} window={w} teachers={teachers}
                                        onAssign={() => {}}
                                        onClose={() => {}}
                                        onRemoveAssignment={() => {}}
                                        active={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Open window modal */}
            {openModal && (
                <Modal title="Open Registration Window" onClose={() => setOpenModal(false)}>
                    <OpenWindowForm
                        onSubmit={handleOpenWindow}
                        onClose={() => setOpenModal(false)}
                        loading={openingWindow}
                    />
                </Modal>
            )}

            {/* Assign teacher modal */}
            {assignModal && (
                <Modal
                    title={`Assign Teacher — ${assignModal.academicYear}`}
                    onClose={() => setAssignModal(null)}
                >
                    <AssignTeacherForm
                        windowId={assignModal.id}
                        teachers={teachers}
                        existingAssignments={assignModal.assignments || []}
                        onSuccess={() => { setAssignModal(null); load() }}
                        onClose={() => setAssignModal(null)}
                    />
                </Modal>
            )}

            {/* Close window confirm */}
            {confirmClose && (
                <Modal title="Close Registration Window" onClose={() => setConfirmClose(null)}>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                            ⚠️ Closing this window will immediately prevent teachers from registering students.
                            This cannot be undone.
                        </div>
                        <p className="text-sm text-slate-700">
                            Close window for <strong>{confirmClose.academicYear}</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button className="btn-ghost" onClick={() => setConfirmClose(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => handleCloseWindow(confirmClose.id)}>
                                Close Window
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

function WindowCard({ window: w, teachers, onAssign, onClose, onRemoveAssignment, active }) {
    return (
        <div className={`card ${active ? 'border-green-200 bg-green-50/30' : 'opacity-70'}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>{w.status}</span>
                        <span className="font-semibold text-slate-900">{w.academicYear}</span>
                        {w.active && <span className="text-xs text-green-600 font-medium">● Live now</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {w.startDate} → {w.endDate}
                        {w.note && <span className="ml-2 italic">"{w.note}"</span>}
                    </p>
                    <p className="text-xs text-slate-400">Opened by: {w.openedBy}</p>
                </div>
                {active && (
                    <div className="flex gap-2">
                        <button className="btn-ghost text-xs" onClick={onAssign}>+ Assign Teacher</button>
                        <button className="btn-ghost text-xs border-red-200 text-red-600" onClick={onClose}>
                            Close Window
                        </button>
                    </div>
                )}
            </div>

            {/* Teacher assignments */}
            {w.assignments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Assigned Teachers</p>
                    <div className="space-y-2">
                        {w.assignments.map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">
                                <div>
                                    <span className="text-sm font-medium text-slate-800">{a.teacherName}</span>
                                    <span className="text-xs text-slate-400 ml-2">({a.teacherEmployeeId})</span>
                                    <div className="flex gap-1 mt-0.5">
                                        {a.allowedGradeList.map(g => (
                                            <span key={g} className="text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded">
                                                Gr {g}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {active && (
                                    <button className="text-xs text-red-400 hover:text-red-600"
                                        onClick={() => onRemoveAssignment(a.id)}>
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
