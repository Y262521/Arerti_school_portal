import { useEffect, useState } from 'react'
import { gradeService, subjectService } from '../services/gradeService'
import { classService } from '../services/classService'
import { studentService } from '../services/studentService'
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

export default function GradebookPage() {
    const [sections, setSections] = useState([])
    const [subjects, setSubjects] = useState([])
    const [grades, setGrades] = useState([])
    const [students, setStudents] = useState([])

    const [sectionId, setSectionId] = useState('')
    const [term, setTerm] = useState(1)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null) // { student, subject?, entry? }
    const [subjectModal, setSubjectModal] = useState(false)
    const [newSubject, setNewSubject] = useState({ name: '', code: '', applicableGrades: '9,10,11,12' })

    useEffect(() => {
        Promise.all([classService.getAll(), subjectService.getAll()])
            .then(([c, s]) => { setSections(c); setSubjects(s) })
            .catch(() => toast.error('Failed to load data'))
    }, [])

    const loadGrades = async () => {
        if (!sectionId) return
        setLoading(true)
        try {
            const [g, s] = await Promise.all([
                gradeService.getForSection(sectionId, term, academicYear),
                studentService.getAll()
            ])
            setGrades(g)
            setStudents(s.filter(st => String(st.sectionId) === String(sectionId)))
        } catch { toast.error('Failed to load grades') }
        finally { setLoading(false) }
    }

    useEffect(() => { loadGrades() }, [sectionId, term, academicYear])

    const getGrade = (studentId, subjectId) =>
        grades.find(g => g.studentId === studentId && g.subjectId === subjectId)

    const handleSaveGrade = async (payload) => {
        setSaving(true)
        try {
            await gradeService.upsert(payload)
            toast.success('Grade saved')
            setModal(null)
            loadGrades()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally { setSaving(false) }
    }

    const handleAddSubject = async () => {
        try {
            const s = await subjectService.create(newSubject)
            setSubjects(prev => [...prev, s])
            toast.success('Subject added')
            setSubjectModal(false)
            setNewSubject({ name: '', code: '', applicableGrades: '9,10,11,12' })
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to add subject')
        }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Gradebook</h1>
                    <p className="text-slate-500 mt-1">Enter and manage student grades</p>
                </div>
                <button className="btn-ghost text-xs" onClick={() => setSubjectModal(true)}>
                    + Add Subject
                </button>
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
                                <th className="px-4 py-3 text-left sticky left-0 bg-slate-50">Student</th>
                                {subjects.map(subj => (
                                    <th key={subj.id} className="px-3 py-3 text-center whitespace-nowrap">{subj.name}</th>
                                ))}
                                <th className="px-3 py-3 text-center">Average</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map(student => {
                                const studentGrades = subjects.map(subj => getGrade(student.id, subj.id))
                                const scores = studentGrades.filter(g => g).map(g => g.score)
                                const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '—'

                                return (
                                    <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 sticky left-0 bg-white">
                                            <div className="font-medium text-slate-900">{student.fullName}</div>
                                            <div className="text-xs text-slate-400">{student.studentUid}</div>
                                        </td>
                                        {subjects.map(subj => {
                                            const entry = getGrade(student.id, subj.id)
                                            return (
                                                <td key={subj.id} className="px-3 py-3 text-center">
                                                    <button
                                                        className={`rounded px-2 py-0.5 hover:bg-brand/10 transition ${GRADE_COLOR(entry?.grade)}`}
                                                        onClick={() => setModal({ student, subject: subj, entry })}
                                                        title={`${entry ? entry.score + '/100' : 'Click to enter grade'}`}
                                                    >
                                                        {entry ? `${entry.score}` : <span className="text-slate-300">—</span>}
                                                    </button>
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
                    />
                </Modal>
            )}

            {/* Add subject modal */}
            {subjectModal && (
                <Modal title="Add Subject" onClose={() => setSubjectModal(false)}>
                    <div className="space-y-3">
                        <div>
                            <label className="field-label">Subject Name *</label>
                            <input className="field" value={newSubject.name}
                                onChange={e => setNewSubject(s => ({ ...s, name: e.target.value }))} required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="field-label">Code</label>
                                <input className="field" value={newSubject.code}
                                    onChange={e => setNewSubject(s => ({ ...s, code: e.target.value }))}
                                    placeholder="e.g. MATH" />
                            </div>
                            <div>
                                <label className="field-label">Grades (comma-separated)</label>
                                <input className="field" value={newSubject.applicableGrades}
                                    onChange={e => setNewSubject(s => ({ ...s, applicableGrades: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button className="btn-ghost" onClick={() => setSubjectModal(false)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddSubject} disabled={!newSubject.name}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}

function GradeEntryForm({ student, subject, entry, term, academicYear, onSubmit, onClose, loading }) {
    const [score, setScore] = useState(entry?.score ?? '')
    const [comment, setComment] = useState(entry?.comment ?? '')

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            studentId: student.id,
            subjectId: subject.id,
            term,
            academicYear,
            score: Number(score),
            comment,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-slate-500">
                Term {term} · {academicYear}
            </p>
            <div>
                <label className="field-label">Score (0 – 100) *</label>
                <input className="field" type="number" min={0} max={100} step={0.5}
                    value={score} onChange={e => setScore(e.target.value)} required autoFocus />
            </div>
            <div>
                <label className="field-label">Teacher Comment</label>
                <textarea className="field" rows={3} value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Optional feedback…" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving…' : 'Save Grade'}
                </button>
            </div>
        </form>
    )
}
