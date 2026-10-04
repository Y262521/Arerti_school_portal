import { useEffect, useState } from 'react'
import { gradeService, subjectService, regradeService } from '../services/gradeService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const GRADE_COLOR = (g) => {
    if (!g || g === '—') return 'text-slate-400'
    if (g.startsWith('A')) return 'text-green-600 font-bold'
    if (g.startsWith('B')) return 'text-blue-600 font-bold'
    if (g.startsWith('C')) return 'text-yellow-600 font-bold'
    if (g === 'D') return 'text-orange-500 font-bold'
    return 'text-red-600 font-bold'
}

// Mark component columns definition
const COMPONENTS = [
    { key: 'midExam',    label: 'Mid',        max: 20 },
    { key: 'finalExam',  label: 'Final',      max: 60 },
    { key: 'assignment', label: 'Assign',     max: 10 },
    { key: 'testQuiz',   label: 'Test/Quiz',  max: 10 },
]

// ── Grade Entry Form (one subject, one student) ───────────────────────────────
function GradeEntryForm({ student, subject, entry, term, academicYear,
    onSubmit, onClose, loading, canEdit, isLocked, hasRegradePermission }) {
    const [form, setForm] = useState({
        midExam:    entry?.midExam    ?? '',
        finalExam:  entry?.finalExam  ?? '',
        assignment: entry?.assignment ?? '',
        testQuiz:   entry?.testQuiz   ?? '',
        comment:    entry?.comment    ?? '',
    })

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const total = COMPONENTS.reduce((s, c) => s + (Number(form[c.key]) || 0), 0)
    const isEditable = !isLocked || hasRegradePermission

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            studentId:   student.id,
            subjectId:   subject.id,
            term,
            academicYear,
            midExam:    form.midExam    !== '' ? Number(form.midExam)    : null,
            finalExam:  form.finalExam  !== '' ? Number(form.finalExam)  : null,
            assignment: form.assignment !== '' ? Number(form.assignment) : null,
            testQuiz:   form.testQuiz   !== '' ? Number(form.testQuiz)   : null,
            comment:    form.comment,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">Term {term} · {academicYear}</p>

            {isLocked && !hasRegradePermission && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    🔒 Marks are locked. Request regrade permission from the administrator to edit.
                </div>
            )}
            {hasRegradePermission && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                    ✅ Regrade permission granted. Marks will re-lock after saving.
                </div>
            )}

            <div className="grid grid-cols-2 gap-3">
                {COMPONENTS.map(c => (
                    <div key={c.key}>
                        <label className="field-label">
                            {c.label} <span className="text-slate-400 font-normal">(max {c.max})</span>
                        </label>
                        <input
                            className="field"
                            type="number" min={0} max={c.max} step={0.5}
                            value={form[c.key]}
                            onChange={e => set(c.key, e.target.value)}
                            disabled={!canEdit || (isLocked && !hasRegradePermission)}
                        />
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                <span className="text-sm font-semibold text-slate-700">Total</span>
                <span className={`text-lg font-bold ${total >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {total.toFixed(1)} / 100
                </span>
            </div>

            <div>
                <label className="field-label">Comment</label>
                <textarea className="field" rows={2} value={form.comment}
                    onChange={e => set('comment', e.target.value)}
                    disabled={!canEdit || (isLocked && !hasRegradePermission)}
                    placeholder="Optional feedback…" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                {canEdit && isEditable && (
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving…' : 'Save Marks'}
                    </button>
                )}
            </div>
        </form>
    )
}

// ── Regrade Request Form ───────────────────────────────────────────────────────
function RegradeRequestForm({ subject, sectionId, term, academicYear, onSubmit, onClose, loading }) {
    const [reason, setReason] = useState('')
    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(reason) }} className="space-y-3">
            <p className="text-sm text-slate-600">
                Request permission to edit marks for <strong>{subject.name}</strong> — Term {term}, {academicYear}.
            </p>
            <div>
                <label className="field-label">Reason *</label>
                <textarea className="field" rows={3} value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Explain why the marks need correction…"
                    required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading || !reason.trim()}>
                    {loading ? 'Submitting…' : 'Submit Request'}
                </button>
            </div>
        </form>
    )
}

// ── Main GradebookPage ─────────────────────────────────────────────────────────
export default function GradebookPage() {
    const { user } = useAuth()
    const isAdmin = user?.role === 'ADMIN'
    const isTeacher = user?.role === 'TEACHER'

    const [sections, setSections] = useState([])
    const [subjects, setSubjects] = useState([])
    const [grades, setGrades] = useState([])
    const [students, setStudents] = useState([])
    const [assignments, setAssignments] = useState([]) // class subject-teacher assignments
    const [myRegradePerms, setMyRegradePerms] = useState([]) // teacher's active permissions

    const [sectionId, setSectionId] = useState('')
    const [term, setTerm] = useState(1)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [regradeModal, setRegradeModal] = useState(null)
    const [requestingRegrade, setRequestingRegrade] = useState(false)

    // Load sections and subjects on mount
    useEffect(() => {
        Promise.all([classService.getAll(), subjectService.getAll()])
            .then(([c, s]) => { setSections(c); setSubjects(s) })
            .catch(() => toast.error('Failed to load data'))

        if (isTeacher) {
            regradeService.myRequests()
                .then(setMyRegradePerms)
                .catch(() => { })
        }
    }, [isTeacher])

    // Load grades, students, and subject assignments when section/term/year changes
    const loadGrades = async () => {
        if (!sectionId) return
        setLoading(true)
        try {
            const [g, allStudents] = await Promise.all([
                gradeService.getForSection(sectionId, term, academicYear),
                studentService.getAll(),
            ])
            setGrades(g)
            setStudents(allStudents.filter(st => String(st.sectionId) === String(sectionId)))
            // Load assignments separately — may fail if table not yet created on first deploy
            classService.getAssignments(sectionId)
                .then(setAssignments)
                .catch(() => setAssignments([]))
        } catch (err) {
            toast.error('Failed to load grades')
        } finally { setLoading(false) }
    }

    useEffect(() => { loadGrades() }, [sectionId, term, academicYear])

    // Which subjects is this teacher assigned to teach in this class?
    const myAssignedSubjectIds = new Set(
        assignments
            .filter(a => a.teacherName === user?.fullName)
            .map(a => a.subjectId)
    )

    // Check if teacher has an active APPROVED regrade permission for a subject
    const hasRegradePermission = (subjectId) => {
        return myRegradePerms.some(p =>
            p.subjectId === subjectId &&
            String(p.sectionId) === String(sectionId) &&
            p.term === term &&
            p.academicYear === academicYear &&
            p.status === 'APPROVED'
        )
    }

    const getGrade = (studentId, subjectId) =>
        grades.find(g => g.studentId === studentId && g.subjectId === subjectId)

    const handleSaveGrade = async (payload) => {
        setSaving(true)
        try {
            await gradeService.upsert(payload)
            toast.success('Marks saved')
            setModal(null)
            // Refresh regrade permissions (one may have been used)
            if (isTeacher) {
                const perms = await regradeService.myRequests()
                setMyRegradePerms(perms)
            }
            loadGrades()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally { setSaving(false) }
    }

    const handleRegradeRequest = async (reason) => {
        setRequestingRegrade(true)
        try {
            await regradeService.request({
                subjectId: regradeModal.subject.id,
                sectionId: Number(sectionId),
                term,
                academicYear,
                reason,
            })
            toast.success('Regrade request submitted — waiting for admin approval')
            setRegradeModal(null)
            const perms = await regradeService.myRequests()
            setMyRegradePerms(perms)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request')
        } finally { setRequestingRegrade(false) }
    }

    // Subjects to show in columns:
    // - Admin: all subjects
    // - Teacher: all subjects assigned to this class (can view all, edit only theirs)
    const visibleSubjects = subjects.filter(s =>
        assignments.length === 0 || assignments.some(a => a.subjectId === s.id)
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Gradebook</h1>
                    <p className="text-slate-500 mt-1">
                        {isTeacher ? 'Enter marks for your assigned subjects · View all subjects' : 'Manage student grades'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="field-label">Class / Section</label>
                    <select className="field w-52" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                        <option value="">— Select class —</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>Grade {s.grade} – {s.section} ({s.academicYear})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="field-label">Term</label>
                    <select className="field w-28" value={term} onChange={e => setTerm(Number(e.target.value))}>
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                        <option value={3}>Term 3</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">Academic Year</label>
                    <input className="field w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                </div>
            </div>

            {!sectionId ? (
                <div className="card p-8 text-center text-slate-500">Select a class to view grades.</div>
            ) : loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : students.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">No students in this section.</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50 min-w-[160px]">Student</th>
                                {visibleSubjects.map(subj => {
                                    const isMySubject = isAdmin || myAssignedSubjectIds.has(subj.id)
                                    const hasRegrade = hasRegradePermission(subj.id)
                                    return (
                                        <th key={subj.id} className="px-2 py-3 text-center min-w-[120px]">
                                            <div>{subj.name}</div>
                                            {isTeacher && (
                                                <div className="mt-0.5">
                                                    {isMySubject
                                                        ? <span className="text-green-500 font-normal normal-case">✏️ yours</span>
                                                        : <span className="text-slate-400 font-normal normal-case">👁 view</span>}
                                                    {hasRegrade && <span className="text-blue-500 ml-1 normal-case">🔓regrade</span>}
                                                </div>
                                            )}
                                        </th>
                                    )
                                })}
                                <th className="px-3 py-3 text-center">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const studentGrades = visibleSubjects.map(subj => getGrade(student.id, subj.id))
                                const scores = studentGrades.filter(g => g).map(g => g.score)
                                const avg = scores.length > 0
                                    ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                                    : '—'

                                return (
                                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 sticky left-0 bg-white">
                                            <div className="font-medium text-slate-900">{student.fullName}</div>
                                            <div className="text-xs text-slate-400">{student.studentUid}</div>
                                        </td>
                                        {visibleSubjects.map(subj => {
                                            const entry = getGrade(student.id, subj.id)
                                            const isMySubject = isAdmin || myAssignedSubjectIds.has(subj.id)
                                            const hasRegrade = hasRegradePermission(subj.id)
                                            const isLocked = entry?.locked ?? false
                                            // Can edit: admin always, teacher only if their subject AND (new OR regrade)
                                            const canEdit = isAdmin || (isMySubject && (!isLocked || hasRegrade))
                                            // Homeroom can request regrade for any subject
                                            const canRequestRegrade = isTeacher && !isAdmin && isLocked && !hasRegrade

                                            return (
                                                <td key={subj.id} className="px-2 py-2 text-center">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        {/* Score display */}
                                                        <button
                                                            className={`rounded px-2 py-0.5 text-xs transition w-full
                                                                ${canEdit ? 'hover:bg-brand/10 cursor-pointer' : 'cursor-default'}
                                                                ${isLocked && !hasRegrade ? 'opacity-60' : ''}
                                                                ${GRADE_COLOR(entry?.grade)}`}
                                                            onClick={() => {
                                                                if (isMySubject || isAdmin) {
                                                                    setModal({ student, subject: subj, entry })
                                                                }
                                                            }}
                                                            title={canEdit ? 'Click to enter/edit marks' : isLocked ? 'Locked' : 'View only'}
                                                        >
                                                            {entry ? (
                                                                <span>
                                                                    {entry.score.toFixed(1)}
                                                                    {isLocked && <span className="ml-1">🔒</span>}
                                                                </span>
                                                            ) : (
                                                                <span className={isMySubject || isAdmin ? 'text-slate-300' : 'text-slate-200'}>
                                                                    {isMySubject || isAdmin ? '—' : '•'}
                                                                </span>
                                                            )}
                                                        </button>
                                                        {/* Regrade request button for homeroom on locked entries */}
                                                        {canRequestRegrade && entry && (
                                                            <button
                                                                className="text-xs text-blue-500 hover:underline"
                                                                onClick={() => setRegradeModal({ subject: subj })}
                                                            >
                                                                Request regrade
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )
                                        })}
                                        <td className={`px-3 py-3 text-center font-semibold ${avg !== '—' && Number(avg) < 50 ? 'text-red-600' : 'text-slate-700'}`}>
                                            {avg}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            {sectionId && isTeacher && (
                <div className="mt-3 flex gap-4 text-xs text-slate-500">
                    <span>✏️ your subject (can enter marks)</span>
                    <span>👁 view only</span>
                    <span>🔒 locked (marks submitted)</span>
                    <span>🔓 regrade permission active</span>
                </div>
            )}

            {/* Grade entry modal */}
            {modal && (
                <Modal
                    title={`${modal.student.fullName} — ${modal.subject.name}`}
                    onClose={() => setModal(null)}
                >
                    <GradeEntryForm
                        student={modal.student}
                        subject={modal.subject}
                        entry={modal.entry}
                        term={term}
                        academicYear={academicYear}
                        onSubmit={handleSaveGrade}
                        onClose={() => setModal(null)}
                        loading={saving}
                        canEdit={isAdmin || myAssignedSubjectIds.has(modal.subject.id)}
                        isLocked={modal.entry?.locked ?? false}
                        hasRegradePermission={hasRegradePermission(modal.subject.id)}
                    />
                </Modal>
            )}

            {/* Regrade request modal */}
            {regradeModal && (
                <Modal title="Request Regrade Permission" onClose={() => setRegradeModal(null)}>
                    <RegradeRequestForm
                        subject={regradeModal.subject}
                        sectionId={sectionId}
                        term={term}
                        academicYear={academicYear}
                        onSubmit={handleRegradeRequest}
                        onClose={() => setRegradeModal(null)}
                        loading={requestingRegrade}
                    />
                </Modal>
            )}
        </div>
    )
}
