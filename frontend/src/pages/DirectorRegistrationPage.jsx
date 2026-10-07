import { useEffect, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { teacherService } from '../services/teacherService'
import { classService } from '../services/classService'
import { useLanguage } from '../context/LanguageContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

// ── Postpone modal ────────────────────────────────────────────────────────────
function PostponeModal({ windowId, currentEnd, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [newEnd, setNewEnd] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newEnd) { toast.error('New end date and time is required'); return }
        setLoading(true)
        try {
            await registrationService.postponeWindow(windowId, {
                newEndDatetime: newEnd + ':00',
                reason
            })
            toast.success('Registration window postponed')
            onSuccess()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to postpone')
        } finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                Current end: <strong>{new Date(currentEnd).toLocaleString()}</strong>
                <br />New end must be later than current end.
            </div>
            <div>
                <label className="field-label">{t('newEndDate')} *</label>
                <input className="field" type="datetime-local" value={newEnd}
                    onChange={e => setNewEnd(e.target.value)} required />
                {!newEnd && <p className="text-xs text-red-500 mt-0.5">Required</p>}
            </div>
            <div>
                <label className="field-label">{t('postponeReason')}</label>
                <input className="field" value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="e.g. Extended by 3 days for late applicants" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading || !newEnd}>
                    {loading ? 'Postponing…' : t('postponeRegistration')}
                </button>
            </div>
        </form>
    )
}

// ── Auto-Assign Modal ─────────────────────────────────────────────────────────
function AutoAssignModal({ onClose }) {
    const [grade, setGrade] = useState(9)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const handleAssign = async () => {
        setLoading(true)
        try {
            const r = await registrationService.autoAssign(grade, academicYear)
            setResult(r)
            toast.success(r.message)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Auto-assign failed')
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <strong>🔀 Auto-Assign Students to Sections</strong>
                <p className="mt-1 text-xs">
                    Students are sorted by their previous grade's performance score, then
                    distributed evenly across sections using round-robin (best → A, 2nd best → B, etc.)
                    so every section gets a balanced mix of high, mid, and low performers.
                </p>
            </div>

            {result ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm space-y-2">
                    <p className="text-green-800 font-semibold">✅ {result.message}</p>
                    <p className="text-green-700">Total students: {result.totalStudents}</p>
                    <p className="text-green-700">Assigned: {result.assignedStudents}</p>
                    {result.sectionCounts && (
                        <div className="mt-2">
                            <p className="text-xs text-green-600 font-medium mb-1">Per section:</p>
                            {Object.entries(result.sectionCounts).map(([sec, count]) => (
                                <div key={sec} className="flex justify-between text-xs text-green-700">
                                    <span>{sec}</span><span>{count} students</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="field-label">Grade *</label>
                            <select className="field" value={grade}
                                onChange={e => setGrade(Number(e.target.value))}>
                                {[9, 10, 11, 12].map(g => (
                                    <option key={g} value={g}>Grade {g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="field-label">Academic Year *</label>
                            <input className="field" value={academicYear}
                                onChange={e => setAcademicYear(e.target.value)}
                                placeholder="2026/2027" />
                        </div>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
                        ⚠️ Make sure sections for Grade {grade} exist before running this.
                        Go to <strong>Classes</strong> to create sections first.
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button className="btn-primary" onClick={handleAssign} disabled={loading}>
                            {loading ? '⏳ Assigning…' : '🔀 Run Auto-Assign'}
                        </button>
                    </div>
                </div>
            )}

            {result && (
                <div className="flex justify-end">
                    <button className="btn-primary" onClick={onClose}>Done</button>
                </div>
            )}
        </div>
    )
}

function OpenWindowForm({ onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const now = new Date()
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 16)

    const [form, setForm] = useState({
        academicYear: CURRENT_YEAR,
        startDatetime: localNow,
        endDatetime: '',
        note: ''
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.endDatetime) { toast.error('End date and time is required'); return }
        onSubmit({
            ...form,
            startDatetime: form.startDatetime + ':00',
            endDatetime: form.endDatetime + ':00',
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">{t('academicYear')} *</label>
                    <input className="field" value={form.academicYear}
                        onChange={e => set('academicYear', e.target.value)}
                        placeholder="2026/2027" required />
                </div>
                <div>
                    <label className="field-label">Start Date & Time *</label>
                    <input className="field" type="datetime-local" value={form.startDatetime}
                        onChange={e => set('startDatetime', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">End Date & Time *</label>
                    <input className="field" type="datetime-local" value={form.endDatetime}
                        onChange={e => set('endDatetime', e.target.value)} required />
                    {!form.endDatetime && <p className="text-xs text-red-500 mt-0.5">Required</p>}
                </div>
                <div>
                    <label className="field-label">Note</label>
                    <input className="field" value={form.note}
                        onChange={e => set('note', e.target.value)}
                        placeholder="Optional note" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Opening…' : t('openRegistration')}
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
    const [autoAssignModal, setAutoAssignModal] = useState(false)
    const [postponeModal, setPostponeModal] = useState(null)
    const { t } = useLanguage()

    const load = async () => {
        setLoading(true)
        try {
            const [wins, teachersList] = await Promise.all([
                registrationService.getWindows(),
                teacherService.getAll()
            ])
            setWindows(wins)
            setTeachers(teachersList)
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
                <button
                    className="btn-ghost text-sm border-brand text-brand hover:bg-brand/5"
                    onClick={() => setAutoAssignModal(true)}>
                    🔀 Auto-Assign Students
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
                                        onPostpone={() => setPostponeModal(w)}
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

            {/* Auto-Assign Students modal */}
            {autoAssignModal && (
                <Modal title="Auto-Assign Students to Sections" onClose={() => setAutoAssignModal(false)}>
                    <AutoAssignModal onClose={() => setAutoAssignModal(false)} />
                </Modal>
            )}

            {/* Postpone registration window modal */}
            {postponeModal && (
                <Modal title={t('postponeRegistration')} onClose={() => setPostponeModal(null)}>
                    <PostponeModal
                        windowId={postponeModal.id}
                        currentEnd={postponeModal.endDatetime || postponeModal.endDate}
                        onSuccess={() => { setPostponeModal(null); load() }}
                        onClose={() => setPostponeModal(null)}
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

function WindowCard({ window: w, teachers, onAssign, onClose, onPostpone, onRemoveAssignment, active }) {
    const { t } = useLanguage()
    const [showEnrollments, setShowEnrollments] = useState(false)
    const [enrollments, setEnrollments] = useState([])
    const [loadingEnroll, setLoadingEnroll] = useState(false)

    const loadEnrollments = async () => {
        setLoadingEnroll(true)
        try {
            const data = await registrationService.getEnrollments(w.id)
            setEnrollments(data)
            setShowEnrollments(true)
        } catch { toast.error('Failed to load enrollments') }
        finally { setLoadingEnroll(false) }
    }

    const byTeacher = enrollments.reduce((acc, e) => {
        const key = e.registeredBy || 'Unknown'
        if (!acc[key]) acc[key] = []
        acc[key].push(e)
        return acc
    }, {})
    return (
        <div className={`card ${active ? 'border-green-200 bg-green-50/30' : 'opacity-70'}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}>{active ? t('registrationOpened') : t('registrationClosed')}</span>
                        <span className="font-semibold text-slate-900">{w.academicYear}</span>
                        {w.active && <span className="text-xs text-green-600 font-medium">● Live now</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {w.startDatetime ? new Date(w.startDatetime).toLocaleString() : w.startDate}
                        {' → '}
                        {w.endDatetime ? new Date(w.endDatetime).toLocaleString() : w.endDate}
                        {w.postponeCount > 0 && <span className="ml-2 text-blue-500 text-xs">⏰ Postponed {w.postponeCount}x</span>}
                        {w.note && <span className="ml-2 italic text-xs">"{w.note}"</span>}
                    </p>
                    <p className="text-xs text-slate-400">Opened by: {w.openedBy}</p>
                </div>
                {active && (
                    <div className="flex gap-2 flex-wrap">
                        <button className="btn-ghost text-xs" onClick={loadEnrollments} disabled={loadingEnroll}>
                            {loadingEnroll ? '…' : '📋 Enrollments'}
                        </button>
                        <button className="btn-ghost text-xs" onClick={onAssign}>+ Assign Teacher</button>
                        <button className="btn-ghost text-xs border-blue-200 text-blue-600 hover:border-blue-400"
                            onClick={onPostpone}>
                            ⏰ Postpone
                        </button>
                        <button className="btn-ghost text-xs border-red-200 text-red-600" onClick={onClose}>
                            Close Registration
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

            {/* Enrollment audit log */}
            {showEnrollments && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                            Enrollment Audit ({enrollments.length} total)
                        </p>
                        <button className="text-xs text-slate-400 hover:text-slate-600"
                            onClick={() => setShowEnrollments(false)}>Hide</button>
                    </div>
                    {enrollments.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">No enrollments yet</p>
                    ) : Object.entries(byTeacher).map(([teacher, recs]) => (
                        <div key={teacher} className="mb-3">
                            <p className="text-xs font-medium text-slate-600 mb-1">
                                👤 {teacher} — {recs.length} student(s) registered
                            </p>
                            <div className="space-y-1 pl-3">
                                {recs.map(r => (
                                    <div key={r.id} className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                                        <span className="font-mono text-slate-400">{r.studentUid}</span>
                                        <span>{r.studentName}</span>
                                        <span className={`px-1.5 py-0.5 rounded ${
                                            r.enrollmentType === 'NEW' ? 'bg-green-100 text-green-700' :
                                            r.enrollmentType === 'PROMOTED' ? 'bg-blue-100 text-blue-700' :
                                            r.enrollmentType === 'TRANSFER' ? 'bg-purple-100 text-purple-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>{r.enrollmentType}</span>
                                        {r.stream && (
                                            <span className="text-slate-400">
                                                {r.stream === 'NATURAL_SCIENCE' ? '🔬 Natural' : '📚 Social'}
                                            </span>
                                        )}
                                        <span className="text-slate-400 ml-auto">
                                            {new Date(r.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
