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

const COMPONENTS = [
    { key: 'midExam',    label: 'Mid',       max: 20 },
    { key: 'finalExam',  label: 'Final',     max: 60 },
    { key: 'assignment', label: 'Assign',    max: 10 },
    { key: 'testQuiz',   label: 'Test/Quiz', max: 10 },
]

// ── Grade Entry Form ───────────────────────────────────────────────────────────
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
    const isEditable = canEdit && (!isLocked || hasRegradePermission)

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            studentId:   student.id,
            subjectId:   subject.id,
            term, academicYear,
            midExam:    form.midExam    !== '' ? Number(form.midExam)    : null,
            finalExam:  form.finalExam  !== '' ? Number(form.finalExam)  : null,
            assignment: form.assignment !== '' ? Number(form.assignment) : null,
            testQuiz:   form.testQuiz   !== '' ? Number(form.testQuiz)   : null,
            comment:    form.comment,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500">Semester {term} · {academicYear}</p>

            {isLocked && !hasRegradePermission && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    🔒 Marks are locked. Request regrade permission from the administrator to edit.
                </div>
            )}
            {isLocked && hasRegradePermission && (
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
                            disabled={!isEditable}
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
                    disabled={!isEditable}
                    placeholder="Optional feedback…" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                {isEditable && (
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? 'Saving…' : 'Save Marks'}
                    </button>
                )}
            </div>
        </form>
    )
}

// ── Regrade Request Form ───────────────────────────────────────────────────────
function RegradeRequestForm({ student, subject, sectionId, term, academicYear, onSubmit, onClose, loading }) {
    const [reason, setReason] = useState('')
    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(reason) }} className="space-y-3">
            <p className="text-sm text-slate-600">
                Request permission to edit marks for <strong>{student.fullName}</strong> in{' '}
                <strong>{subject.name}</strong> — Semester {term}, {academicYear}.
            </p>
            <div className="text-xs text-slate-400 bg-slate-50 rounded px-3 py-2">
                Student UID: {student.studentUid}
            </div>
            <div>
                <label className="field-label">Reason *</label>
                <textarea className="field" rows={3} value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Explain why this student's marks need correction…"
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
    const isAdmin   = user?.role === 'ADMIN'
    const isTeacher = user?.role === 'TEACHER'

    const [sections,           setSections]           = useState([])
    const [subjects,           setSubjects]           = useState([])
    const [grades,             setGrades]             = useState([])
    const [students,           setStudents]           = useState([])
    const [assignments,        setAssignments]        = useState([])
    const [myRegradePerms,     setMyRegradePerms]     = useState([])
    const [isHomeroomOfSection,setIsHomeroomOfSection]= useState(false)

    const [sectionId,    setSectionId]    = useState('')
    const [term,         setTerm]         = useState(1)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)

    const [loading,          setLoading]          = useState(false)
    const [saving,           setSaving]           = useState(false)
    const [modal,            setModal]            = useState(null)
    const [regradeModal,     setRegradeModal]     = useState(null)
    const [requestingRegrade,setRequestingRegrade]= useState(false)

    // ── Initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        Promise.all([classService.getAll(), subjectService.getAll()])
            .then(([c, s]) => { setSections(c); setSubjects(s) })
            .catch(() => toast.error('Failed to load data'))

        if (isTeacher) {
            regradeService.myRequests()
                .then(setMyRegradePerms)
                .catch(() => {})
        }
    }, [isTeacher])

    // ── Load grades when filters change ─────────────────────────────────────
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

            // Load subject-teacher assignments for this class
            try {
                const data = await classService.getAssignments(sectionId)
                setAssignments(data)

                // FIX 1 & 2: Determine if logged-in teacher is the homeroom teacher of this class
                if (isTeacher) {
                    const sec = sections.find(s => String(s.id) === String(sectionId))
                    setIsHomeroomOfSection(
                        !!sec && sec.homeroomTeacherName === user?.fullName
                    )
                }
            } catch {
                setAssignments([])
                setIsHomeroomOfSection(false)
            }
        } catch {
            toast.error('Failed to load grades')
        } finally { setLoading(false) }
    }

    useEffect(() => { loadGrades() }, [sectionId, term, academicYear])

    // ── Derived helpers ──────────────────────────────────────────────────────

    // Subjects THIS teacher is assigned to teach in this class
    const myAssignedSubjectIds = new Set(
        assignments
            .filter(a => a.teacherName === user?.fullName)
            .map(a => a.subjectId)
    )

    // Active APPROVED regrade permission for a SPECIFIC student+subject
    const hasRegradePermission = (subjectId, studentId) =>
        myRegradePerms.some(p =>
            p.subjectId === subjectId &&
            p.studentId === studentId &&
            String(p.sectionId) === String(sectionId) &&
            p.term === term &&
            p.academicYear === academicYear &&
            p.status === 'APPROVED'
        )

    const getGrade = (studentId, subjectId) =>
        grades.find(g => g.studentId === studentId && g.subjectId === subjectId)

    // ── FIX 3: Visible subjects per role ────────────────────────────────────
    // Admin        → all subjects in the class
    // Homeroom     → all subjects in the class (view all, edit own + regrade others)
    // Other teacher → ONLY their assigned subject(s)
    const classSubjectIds = new Set(assignments.map(a => a.subjectId))
    const visibleSubjects = subjects.filter(s => {
        if (isAdmin)                      return classSubjectIds.has(s.id) || classSubjectIds.size === 0
        if (!isTeacher)                   return false
        if (isHomeroomOfSection)          return classSubjectIds.has(s.id) || classSubjectIds.size === 0
        return myAssignedSubjectIds.has(s.id)   // non-homeroom teacher: only own subject
    })

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleSaveGrade = async (payload) => {
        setSaving(true)
        try {
            await gradeService.upsert(payload)
            toast.success('Marks saved')
            setModal(null)
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
                studentId:    regradeModal.student.id,   // scoped to specific student
                subjectId:    regradeModal.subject.id,
                sectionId:    Number(sectionId),
                term, academicYear, reason,
            })
            toast.success('Regrade request submitted — waiting for admin approval')
            setRegradeModal(null)
            const perms = await regradeService.myRequests()
            setMyRegradePerms(perms)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request')
        } finally { setRequestingRegrade(false) }
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Gradebook</h1>
                    <p className="text-slate-500 mt-1">
                        {isTeacher
                            ? isHomeroomOfSection
                                ? 'Homeroom view — all subjects visible, enter marks for your subject'
                                : 'Enter marks for your assigned subject only'
                            : 'Manage student grades'}
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
                    <label className="field-label">Semester</label>
                    <select className="field w-36" value={term} onChange={e => setTerm(Number(e.target.value))}>
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
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
                                    const isMine   = isAdmin || myAssignedSubjectIds.has(subj.id)
                                    // Show regrade indicator in header if ANY student has active permission
                                    const hasRegAny = myRegradePerms.some(p =>
                                        p.subjectId === subj.id &&
                                        String(p.sectionId) === String(sectionId) &&
                                        p.term === term &&
                                        p.academicYear === academicYear &&
                                        p.status === 'APPROVED'
                                    )
                                    return (
                                        <th key={subj.id} className="px-2 py-3 text-center min-w-[120px]">
                                            <div>{subj.name}</div>
                                            {isTeacher && (
                                                <div className="mt-0.5 text-xs font-normal normal-case">
                                                    {isMine
                                                        ? <span className="text-green-500">✏️ yours</span>
                                                        : <span className="text-slate-400">👁 view</span>}
                                                    {hasRegAny && <span className="text-blue-500 ml-1">🔓 regrade</span>}
                                                </div>
                                            )}
                                        </th>
                                    )
                                })}
                                <th className="px-3 py-3 text-center">Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const scores = visibleSubjects
                                    .map(s => getGrade(student.id, s.id)?.score)
                                    .filter(v => v != null)
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
                                            const entry    = getGrade(student.id, subj.id)
                                            const isMine   = isAdmin || myAssignedSubjectIds.has(subj.id)
                                            const hasReg   = hasRegradePermission(subj.id, student.id)
                                            const isLocked = entry?.locked ?? false

                                            // canEdit:
                                            // - Admin: always
                                            // - Own subject, new entry: yes
                                            // - Locked + regrade permission for THIS student: yes (homeroom or own)
                                            const canEdit = isAdmin
                                                || (!isLocked && isMine)
                                                || (isLocked && hasReg && (isMine || isHomeroomOfSection))

                                            // Regrade button: homeroom only, entry exists, locked,
                                            // no active permission for THIS student
                                            const canRequestRegrade = isTeacher
                                                && isHomeroomOfSection
                                                && isLocked
                                                && !hasReg
                                                && !!entry

                                            return (
                                                <td key={subj.id} className="px-2 py-2 text-center">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <button
                                                            className={`rounded px-2 py-0.5 text-xs w-full transition
                                                                ${canEdit || isMine || isHomeroomOfSection ? 'hover:bg-brand/10 cursor-pointer' : 'cursor-default'}
                                                                ${isLocked && !hasReg ? 'opacity-60' : ''}
                                                                ${GRADE_COLOR(entry?.grade)}`}
                                                            onClick={() => {
                                                                if (isMine || isHomeroomOfSection || isAdmin) {
                                                                    setModal({ student, subject: subj, entry })
                                                                }
                                                            }}
                                                        >
                                                            {entry ? (
                                                                <span>
                                                                    {entry.score.toFixed(1)}
                                                                    {isLocked && <span className="ml-1 text-slate-400">🔒</span>}
                                                                </span>
                                                            ) : (
                                                                <span className={isMine || isAdmin ? 'text-slate-300' : 'text-slate-200'}>
                                                                    {isMine || isAdmin || isHomeroomOfSection ? '—' : '•'}
                                                                </span>
                                                            )}
                                                        </button>

                                                        {/* Regrade button only for homeroom, only on specific locked student */}
                                                        {canRequestRegrade && (
                                                            <button
                                                                className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                                                                onClick={() => setRegradeModal({ student, subject: subj })}
                                                            >
                                                                🔄 Request regrade
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            )
                                        })}
                                        <td className={`px-3 py-3 text-center font-semibold text-xs ${avg !== '—' && Number(avg) < 50 ? 'text-red-600' : 'text-slate-700'}`}>
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
                <div className="mt-3 flex gap-4 text-xs text-slate-500 flex-wrap">
                    <span>✏️ your subject</span>
                    {isHomeroomOfSection && <span>👁 view only (other subjects)</span>}
                    <span>🔒 locked after submission</span>
                    {isHomeroomOfSection && <span>🔄 request regrade (homeroom only)</span>}
                    <span>🔓 regrade active</span>
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
                        canEdit={isAdmin || myAssignedSubjectIds.has(modal.subject.id) || isHomeroomOfSection}
                        isLocked={modal.entry?.locked ?? false}
                        hasRegradePermission={hasRegradePermission(modal.subject.id, modal.student.id)}
                    />
                </Modal>
            )}

            {/* Regrade request modal */}
            {regradeModal && (
                <Modal title="Request Regrade Permission" onClose={() => setRegradeModal(null)}>
                    <RegradeRequestForm
                        student={regradeModal.student}
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
