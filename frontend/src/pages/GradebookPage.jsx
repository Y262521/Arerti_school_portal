import { useEffect, useState } from 'react'
import { gradeService, subjectService, regradeService } from '../services/gradeService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
import { gradeEntryWindowService } from '../services/registrationService'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
const cy = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 7 }, (_, i) => { const y = cy - 3 + i; return `${y}/${y + 1}` })

const GRADE_COLOR = (g) => {
    if (!g || g === '—') return 'text-slate-400'
    if (g.startsWith('A')) return 'text-green-600 font-bold'
    if (g.startsWith('B')) return 'text-blue-600 font-bold'
    if (g.startsWith('C')) return 'text-yellow-600 font-bold'
    if (g === 'D') return 'text-orange-500 font-bold'
    return 'text-red-600 font-bold'
}

// ── Grade Entry Form ───────────────────────────────────────────────────────────
function GradeEntryForm({ student, subject, entry, term, academicYear,
    onSubmit, onClose, loading, canEdit, isLocked, hasRegradePermission }) {
    const { t } = useLanguage()

    const COMPONENTS = [
        { key: 'midExam',    label: t('midExam'),   max: 20 },
        { key: 'finalExam',  label: t('finalExam'), max: 60 },
        { key: 'assignment', label: t('assignment'), max: 10 },
        { key: 'testQuiz',   label: t('testQuiz'),  max: 10 },
    ]

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
            <p className="text-sm text-slate-500">{t('semester')} {term} · {academicYear}</p>

            {isLocked && !hasRegradePermission && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                    🔒 {t('marksLocked')}
                </div>
            )}
            {isLocked && hasRegradePermission && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                    ✅ {t('regradePermissionGranted')}
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
                <span className="text-sm font-semibold text-slate-700">{t('total')}</span>
                <span className={`text-lg font-bold ${total >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                    {total.toFixed(1)} / 100
                </span>
            </div>

            <div>
                <label className="field-label">{t('commentLabel')}</label>
                <textarea className="field" rows={2} value={form.comment}
                    onChange={e => set('comment', e.target.value)}
                    disabled={!isEditable}
                    placeholder={t('optionalFeedback')} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                {isEditable && (
                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? t('saving') : t('saveMarks')}
                    </button>
                )}
            </div>
        </form>
    )
}

// ── Regrade Request Form ───────────────────────────────────────────────────────
function RegradeRequestForm({ student, subject, sectionId, term, academicYear, onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const [reason, setReason] = useState('')
    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(reason) }} className="space-y-3">
            <p className="text-sm text-slate-600">
                {t('regradeRequestFor')} <strong>{student.fullName}</strong> {t('in')}{' '}
                <strong>{subject.name}</strong> — {t('semester')} {term}, {academicYear}.
            </p>
            <div className="text-xs text-slate-400 bg-slate-50 rounded px-3 py-2">
                {t('studentUidLabel')}: {student.studentUid}
            </div>
            <div>
                <label className="field-label">{t('reasonLabel')} *</label>
                <textarea className="field" rows={3} value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder={t('regradeReasonPlaceholder')}
                    required />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading || !reason.trim()}>
                    {loading ? t('submitting') : t('submitRequest')}
                </button>
            </div>
        </form>
    )
}

// ── Main GradebookPage ─────────────────────────────────────────────────────────
export default function GradebookPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const isAdmin   = user?.role === 'ADMIN'
    const isTeacher = user?.role === 'TEACHER'

    const [gradeEntryStatus, setGradeEntryStatus] = useState(null)
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

    useEffect(() => {
        Promise.all([classService.getAll(), subjectService.getAll()])
            .then(([c, s]) => { setSections(c); setSubjects(s) })
            .catch(() => toast.error(t('failedToLoadData')))
        if (isTeacher) {
            regradeService.myRequests().then(setMyRegradePerms).catch(() => {})
        }
    }, [isTeacher])

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
            try {
                const data = await classService.getAssignments(sectionId)
                setAssignments(data)
                if (isTeacher) {
                    const sec = sections.find(s => String(s.id) === String(sectionId))
                    setIsHomeroomOfSection(!!sec && sec.homeroomTeacherName === user?.fullName)
                }
            } catch {
                setAssignments([])
                setIsHomeroomOfSection(false)
            }
        } catch {
            toast.error(t('failedToLoadGrades'))
        } finally { setLoading(false) }
    }

    useEffect(() => { loadGrades() }, [sectionId, term, academicYear])

    useEffect(() => {
        if (isTeacher && academicYear && term) {
            gradeEntryWindowService.getStatus(academicYear, term)
                .then(setGradeEntryStatus)
                .catch(() => setGradeEntryStatus(null))
        }
    }, [term, academicYear, isTeacher])

    const myAssignedSubjectIds = new Set(
        assignments.filter(a => a.teacherName === user?.fullName).map(a => a.subjectId)
    )

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

    const classSubjectIds = new Set(assignments.map(a => a.subjectId))
    // Teachers only see subjects assigned to them — homeroom does NOT grant access to all subjects
    const visibleSubjects = subjects.filter(s => {
        if (isAdmin) return classSubjectIds.has(s.id) || classSubjectIds.size === 0
        if (!isTeacher) return false
        return myAssignedSubjectIds.has(s.id)
    })

    // Teachers can only open the grade form when the window is open (or they have regrade permission)
    const windowIsOpen = !isTeacher || isAdmin || (gradeEntryStatus?.open === true)

    const handleSaveGrade = async (payload) => {
        setSaving(true)
        try {
            await gradeService.upsert(payload)
            toast.success(t('marksSaved'))
            setModal(null)
            if (isTeacher) { const perms = await regradeService.myRequests(); setMyRegradePerms(perms) }
            loadGrades()
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally { setSaving(false) }
    }

    const handleRegradeRequest = async (reason) => {
        setRequestingRegrade(true)
        try {
            await regradeService.request({
                studentId: regradeModal.student.id,
                subjectId: regradeModal.subject.id,
                sectionId: Number(sectionId),
                term, academicYear, reason,
            })
            toast.success(t('regradeRequestSubmitted'))
            setRegradeModal(null)
            const perms = await regradeService.myRequests()
            setMyRegradePerms(perms)
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToSubmitRequest'))
        } finally { setRequestingRegrade(false) }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('gradebookCard')}</h1>
                    <p className="text-slate-500 mt-1">
                        {isTeacher
                            ? t('ownSubjectOnly')
                            : t('gradebookDesc')}
                    </p>
                </div>
            </div>

            {/* Grade submission window status banner */}
            {isTeacher && (
                <div className={`mb-4 rounded-lg border p-3 text-sm ${
                    gradeEntryStatus?.open
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-amber-50 border-amber-300 text-amber-800'
                }`}>
                    {gradeEntryStatus?.open
                        ? `✅ ${t('gradeEntryOpen')} — ${t('semester')} ${term}, ${academicYear}`
                        : `🔒 ${t('gradeEntryClosed')}`
                    }
                </div>
            )}

            {/* Filters */}
            <div className="card mb-6 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="field-label">{t('classSection')}</label>
                    <select className="field w-52" value={sectionId} onChange={e => setSectionId(e.target.value)}>
                        <option value="">— {t('selectClass')} —</option>
                        {sections.map(s => (
                            <option key={s.id} value={s.id}>
                                {t('grade')} {s.grade} – {s.section} ({s.academicYear})
                                {s.stream ? ` · ${s.stream.replace('_',' ')}` : ''}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="field-label">{t('semester')}</label>
                    <select className="field w-36" value={term} onChange={e => setTerm(Number(e.target.value))}>
                        <option value={1}>{t('semester')} 1</option>
                        <option value={2}>{t('semester')} 2</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">{t('academicYear')}</label>
                    <select className="field w-36" value={academicYear} onChange={e => setAcademicYear(e.target.value)}>
                        {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {!sectionId ? (
                <div className="card p-8 text-center text-slate-500">{t('selectClassToViewGrades')}</div>
            ) : loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : students.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noStudentsInSection')}</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50 min-w-[160px]">{t('student')}</th>
                                {visibleSubjects.map(subj => {
                                    const isMine = isAdmin || myAssignedSubjectIds.has(subj.id)
                                    const hasRegAny = myRegradePerms.some(p =>
                                        p.subjectId === subj.id &&
                                        String(p.sectionId) === String(sectionId) &&
                                        p.term === term && p.academicYear === academicYear &&
                                        p.status === 'APPROVED'
                                    )
                                    return (
                                        <th key={subj.id} className="px-2 py-3 text-center min-w-[120px]">
                                            <div>{subj.name}</div>
                                            {isTeacher && (
                                                <div className="mt-0.5 text-xs font-normal normal-case">
                                                    {isMine
                                                        ? <span className="text-green-500">✏️ {t('yourSubject')}</span>
                                                        : <span className="text-slate-400">👁 {t('viewOnly')}</span>}
                                                    {hasRegAny && <span className="text-blue-500 ml-1">🔓 {t('regrade')}</span>}
                                                </div>
                                            )}
                                        </th>
                                    )
                                })}
                                <th className="px-3 py-3 text-center">{t('average')}</th>
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
                                            const canEdit  = isAdmin
                                                || (windowIsOpen && !isLocked && isMine)
                                                || (isLocked && hasReg && isMine)
                                            const canRequestRegrade = isTeacher && isHomeroomOfSection
                                                && isLocked && !hasReg && !!entry
                                            // Teacher can click cell only if window open OR has regrade perm
                                            const canOpenModal = isAdmin || (isMine && (windowIsOpen || hasReg))

                                            return (
                                                <td key={subj.id} className="px-2 py-2 text-center">
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <button
                                                            className={`rounded px-2 py-0.5 text-xs w-full transition
                                                                ${canOpenModal ? 'hover:bg-brand/10 cursor-pointer' : 'cursor-default'}
                                                                ${isLocked && !hasReg ? 'opacity-60' : ''}
                                                                ${GRADE_COLOR(entry?.grade)}`}
                                                            onClick={() => {
                                                                if (canOpenModal)
                                                                    setModal({ student, subject: subj, entry })
                                                            }}
                                                        >
                                                            {entry ? (
                                                                <span>{entry.score.toFixed(1)}{isLocked && <span className="ml-1 text-slate-400">🔒</span>}</span>
                                                            ) : (
                                                                <span className={isMine || isAdmin ? 'text-slate-300' : 'text-slate-200'}>
                                                                    {isMine || isAdmin || isHomeroomOfSection ? '—' : '•'}
                                                                </span>
                                                            )}
                                                        </button>
                                                        {canRequestRegrade && (
                                                            <button
                                                                className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                                                                onClick={() => setRegradeModal({ student, subject: subj })}
                                                            >
                                                                🔄 {t('requestRegrade')}
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
                    <span>✏️ {t('yourSubject')}</span>
                    <span>🔒 {t('lockedAfterSubmission')}</span>
                    {isHomeroomOfSection && <span>🔄 {t('requestRegradeHomeroom')}</span>}
                    <span>🔓 {t('regradeActive')}</span>
                </div>
            )}

            {modal && (
                <Modal title={`${modal.student.fullName} — ${modal.subject.name}`} onClose={() => setModal(null)}>
                    <GradeEntryForm
                        student={modal.student} subject={modal.subject} entry={modal.entry}
                        term={term} academicYear={academicYear}
                        onSubmit={handleSaveGrade} onClose={() => setModal(null)} loading={saving}
                        canEdit={isAdmin || (windowIsOpen && myAssignedSubjectIds.has(modal.subject.id))}
                        isLocked={modal.entry?.locked ?? false}
                        hasRegradePermission={hasRegradePermission(modal.subject.id, modal.student.id)}
                    />
                </Modal>
            )}

            {regradeModal && (
                <Modal title={t('requestRegradePermission')} onClose={() => setRegradeModal(null)}>
                    <RegradeRequestForm
                        student={regradeModal.student} subject={regradeModal.subject}
                        sectionId={sectionId} term={term} academicYear={academicYear}
                        onSubmit={handleRegradeRequest} onClose={() => setRegradeModal(null)}
                        loading={requestingRegrade}
                    />
                </Modal>
            )}
        </div>
    )
}
