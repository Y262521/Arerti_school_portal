import { useEffect, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { classService } from '../services/classService'
import { teacherService } from '../services/teacherService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`
const PREV_YEAR = `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`

// ── Credentials modal after new enrollment ────────────────────────────────────
function CredentialsModal({ student, onClose }) {
    const [copied, setCopied] = useState(false)
    const text = `Student: ${student.fullName}\nUID: ${student.studentUid}\nUsername: ${student.generatedUsername}\nPassword: ${student.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                ✅ Student enrolled successfully. Share these credentials.
            </div>
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">Name:</span> <strong>{student.fullName}</strong></p>
                <p><span className="text-slate-500">UID:</span> <strong>{student.studentUid}</strong></p>
                <p><span className="text-slate-500">Username:</span> <strong>{student.generatedUsername}</strong></p>
                <p><span className="text-slate-500">Password:</span> <strong>{student.generatedPassword}</strong></p>
            </div>
            <p className="text-xs text-slate-500">⚠️ Password shown once only. Student must change on first login.</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={copy}>{copied ? '✓ Copied!' : 'Copy'}</button>
                <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
        </div>
    )
}

// ── Grade 9 new student form ──────────────────────────────────────────────────
function NewStudentForm({ sections, windowId, onSuccess, onClose }) {
    const [form, setForm] = useState({
        email: '', fullName: '', phone: '', dateOfBirth: '',
        gender: '', parentName: '', parentPhone: '',
        sectionId: '', bankTransactionRef: ''
    })
    const [loading, setLoading] = useState(false)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const grade9Sections = sections.filter(s => s.grade === 9)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const result = await registrationService.enrollNew(windowId, {
                ...form,
                sectionId: Number(form.sectionId),
                dateOfBirth: form.dateOfBirth || null,
            })
            onSuccess(result)
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed')
        } finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                ℹ️ New Grade 9 student. Username and password will be auto-generated.
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">Full Name *</label>
                    <input className="field" value={form.fullName} onChange={e => set('fullName', e.target.value)} required /></div>
                <div><label className="field-label">Email *</label>
                    <input className="field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
                <div><label className="field-label">Phone</label>
                    <input className="field" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
                <div><label className="field-label">Gender</label>
                    <select className="field" value={form.gender} onChange={e => set('gender', e.target.value)}>
                        <option value="">—</option><option>Male</option><option>Female</option>
                    </select></div>
                <div><label className="field-label">Date of Birth</label>
                    <input className="field" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                <div><label className="field-label">Parent Name *</label>
                    <input className="field" value={form.parentName} onChange={e => set('parentName', e.target.value)} required /></div>
                <div><label className="field-label">Parent Phone</label>
                    <input className="field" value={form.parentPhone} onChange={e => set('parentPhone', e.target.value)} /></div>
                <div><label className="field-label">Section *</label>
                    <select className="field" value={form.sectionId} onChange={e => set('sectionId', e.target.value)} required>
                        <option value="">— Select —</option>
                        {grade9Sections.map(s => <option key={s.id} value={s.id}>Grade 9 – {s.section}</option>)}
                    </select></div>
            </div>
            <div><label className="field-label">Bank Transaction Reference *</label>
                <input className="field" value={form.bankTransactionRef} onChange={e => set('bankTransactionRef', e.target.value)}
                    placeholder="e.g. TXN-2026-001234" required /></div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Enrolling…' : 'Enroll Student'}</button>
            </div>
        </form>
    )
}

// ── Re-enrollment panel for Grade 10/11/12 ───────────────────────────────────
function ReEnrollPanel({ grade, windowId, sections, prevYear, newYear }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [bankRefs, setBankRefs] = useState({})
    const [sectionChoices, setSectionChoices] = useState({})

    const targetSections = sections.filter(s => s.grade === grade)

    useEffect(() => {
        setLoading(true)
        registrationService.getPassStatus(grade - 1, prevYear, newYear)
            .then(setStudents)
            .catch(() => toast.error('Failed to load students'))
            .finally(() => setLoading(false))
    }, [grade])

    const handleReEnroll = async (student) => {
        const bankRef = bankRefs[student.studentId]
        const sectionId = sectionChoices[student.studentId]
        if (!bankRef) { toast.error('Enter bank transaction reference'); return }
        if (!sectionId) { toast.error('Select a section'); return }

        setSaving(s => ({ ...s, [student.studentId]: true }))
        try {
            await registrationService.reEnroll(windowId, {
                studentId: student.studentId,
                newSectionId: Number(sectionId),
                bankTransactionRef: bankRef,
            }, prevYear)
            toast.success(`${student.studentName} enrolled to Grade ${grade}`)
            setStudents(prev => prev.map(s =>
                s.studentId === student.studentId ? { ...s, alreadyEnrolled: true } : s
            ))
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed')
        } finally { setSaving(s => ({ ...s, [student.studentId]: false })) }
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading students…</div>
    if (students.length === 0) return <div className="p-8 text-center text-slate-500">No students found in Grade {grade - 1} for {prevYear}.</div>

    const passed = students.filter(s => s.passed && !s.alreadyEnrolled)
    const failed = students.filter(s => !s.passed)
    const enrolled = students.filter(s => s.alreadyEnrolled)

    return (
        <div className="space-y-4">
            {enrolled.length > 0 && (
                <div className="text-xs text-green-600 font-medium">
                    ✅ {enrolled.length} student(s) already enrolled for {newYear}
                </div>
            )}
            {failed.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    ❌ {failed.length} student(s) did not pass and cannot be enrolled to Grade {grade}
                </div>
            )}

            <div className="card overflow-x-auto p-0">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                            <th className="px-3 py-3 text-left">Student</th>
                            <th className="px-3 py-3 text-center">Avg</th>
                            <th className="px-3 py-3 text-center">Status</th>
                            <th className="px-3 py-3 text-left">Section</th>
                            <th className="px-3 py-3 text-left">Bank Ref</th>
                            <th className="px-3 py-3 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.studentId} className={`border-b border-slate-100 ${s.alreadyEnrolled ? 'bg-green-50' : ''}`}>
                                <td className="px-3 py-2">
                                    <div className="font-medium text-slate-900 text-xs">{s.studentName}</div>
                                    <div className="text-xs text-slate-400">{s.studentUid}</div>
                                </td>
                                <td className="px-3 py-2 text-center text-xs font-semibold">
                                    <span className={s.average >= 50 ? 'text-green-600' : 'text-red-600'}>
                                        {s.average.toFixed(1)}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {s.alreadyEnrolled ? (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Enrolled</span>
                                    ) : s.passed ? (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Passed</span>
                                    ) : (
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full" title={s.reason}>Failed</span>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    {s.passed && !s.alreadyEnrolled ? (
                                        <select className="field text-xs py-1 w-36"
                                            value={sectionChoices[s.studentId] || ''}
                                            onChange={e => setSectionChoices(p => ({ ...p, [s.studentId]: e.target.value }))}>
                                            <option value="">— Select —</option>
                                            {targetSections.map(sec => (
                                                <option key={sec.id} value={sec.id}>
                                                    Grade {sec.grade} – {sec.section}
                                                </option>
                                            ))}
                                        </select>
                                    ) : <span className="text-slate-400 text-xs">—</span>}
                                </td>
                                <td className="px-3 py-2">
                                    {s.passed && !s.alreadyEnrolled ? (
                                        <input className="field text-xs py-1 w-36"
                                            placeholder="TXN-..."
                                            value={bankRefs[s.studentId] || ''}
                                            onChange={e => setBankRefs(p => ({ ...p, [s.studentId]: e.target.value }))} />
                                    ) : <span className="text-slate-400 text-xs">—</span>}
                                </td>
                                <td className="px-3 py-2 text-center">
                                    {s.passed && !s.alreadyEnrolled ? (
                                        <button
                                            className="btn-primary text-xs py-1 px-3"
                                            disabled={saving[s.studentId]}
                                            onClick={() => handleReEnroll(s)}>
                                            {saving[s.studentId] ? '…' : 'Enroll'}
                                        </button>
                                    ) : null}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// ── Main TeacherRegistrationPage ──────────────────────────────────────────────
export default function TeacherRegistrationPage() {
    const [window_, setWindow_] = useState(null)   // active registration window
    const [loading, setLoading] = useState(true)
    const [sections, setSections] = useState([])
    const [selectedGrade, setSelectedGrade] = useState(null)
    const [newStudentModal, setNewStudentModal] = useState(false)
    const [credentialsModal, setCredentialsModal] = useState(null)

    useEffect(() => {
        Promise.all([
            registrationService.getMyWindow(),
            classService.getAll()
        ]).then(([w, secs]) => {
            setWindow_(w)
            setSections(secs)
        }).catch(() => { })
        .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="card p-8 text-center text-slate-500">Loading…</div>

    if (!window_) return (
        <div className="card p-8 text-center text-slate-500">
            <div className="text-4xl mb-3">🔒</div>
            <h2 className="font-semibold text-slate-700 text-lg">No Active Registration Window</h2>
            <p className="mt-2 text-sm">There is no open registration window at this time, or you are not assigned to one. Contact the director.</p>
        </div>
    )

    const myAssignment = window_.assignments?.[0]
    const allowedGrades = myAssignment?.allowedGradeList || []
    const newYear = window_.academicYear
    const prevYear = (() => {
        const [start] = newYear.split('/')
        return `${Number(start) - 1}/${start}`
    })()

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">Student Registration</h1>
                <p className="text-slate-500 mt-1">
                    Academic Year: <strong>{window_.academicYear}</strong> ·
                    Window: <strong>{window_.startDate}</strong> to <strong>{window_.endDate}</strong>
                </p>
            </div>

            {/* Assigned grades */}
            <div className="card mb-6">
                <h2 className="font-semibold text-slate-800 mb-3">Your Assigned Grades</h2>
                <div className="flex gap-3 flex-wrap">
                    {allowedGrades.map(grade => (
                        <button
                            key={grade}
                            onClick={() => setSelectedGrade(grade)}
                            className={`px-4 py-2 rounded-lg border font-semibold text-sm transition ${selectedGrade === grade
                                    ? 'bg-brand text-white border-brand'
                                    : 'border-slate-200 text-slate-700 hover:border-brand'
                                }`}
                        >
                            Grade {grade}
                            {grade === 9 && <span className="ml-1 text-xs opacity-70">(New)</span>}
                            {grade > 9 && <span className="ml-1 text-xs opacity-70">(Re-enroll)</span>}
                        </button>
                    ))}
                </div>
                {allowedGrades.length === 0 && (
                    <p className="text-slate-400 text-sm">No grades assigned. Contact the director.</p>
                )}
            </div>

            {/* Grade 9 — new student registration */}
            {selectedGrade === 9 && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-800">Grade 9 — New Student Registration</h2>
                            <p className="text-sm text-slate-500">Register brand new students entering Grade 9</p>
                        </div>
                        <button className="btn-primary" onClick={() => setNewStudentModal(true)}>
                            + Register New Student
                        </button>
                    </div>
                    <div className="card p-6 text-center text-slate-500 text-sm">
                        Click "Register New Student" to fill in the enrollment form for each new student.
                    </div>
                </div>
            )}

            {/* Grade 10/11/12 — re-enrollment */}
            {selectedGrade && selectedGrade > 9 && (
                <div>
                    <div className="mb-4">
                        <h2 className="font-semibold text-slate-800">
                            Grade {selectedGrade} — Re-enrollment
                        </h2>
                        <p className="text-sm text-slate-500">
                            Students from Grade {selectedGrade - 1} ({prevYear}) who passed are listed below.
                            Enter their bank transaction reference and assign a section to enroll.
                        </p>
                    </div>
                    <ReEnrollPanel
                        grade={selectedGrade}
                        windowId={window_.id}
                        sections={sections}
                        prevYear={prevYear}
                        newYear={newYear}
                    />
                </div>
            )}

            {/* New student modal */}
            {newStudentModal && (
                <Modal title="Register New Grade 9 Student" onClose={() => setNewStudentModal(false)}>
                    <NewStudentForm
                        sections={sections}
                        windowId={window_.id}
                        onSuccess={(s) => { setNewStudentModal(false); setCredentialsModal(s) }}
                        onClose={() => setNewStudentModal(false)}
                    />
                </Modal>
            )}

            {/* Credentials modal */}
            {credentialsModal && (
                <Modal title="Student Credentials" onClose={() => setCredentialsModal(null)}>
                    <CredentialsModal student={credentialsModal} onClose={() => setCredentialsModal(null)} />
                </Modal>
            )}
        </div>
    )
}
