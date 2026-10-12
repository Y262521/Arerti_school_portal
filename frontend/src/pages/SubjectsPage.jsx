import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { subjectService } from '../services/gradeService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const EMPTY = { name: '', code: '', applicableGrades: '' }

function SubjectForm({ initial, onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-3">
            <div>
                <label className="field-label">{t('subjectName')} *</label>
                <input
                    className="field"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Mathematics"
                    required
                />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">{t('codeLabel')}</label>
                    <input
                        className="field"
                        value={form.code}
                        onChange={e => set('code', e.target.value)}
                        placeholder="e.g. MATH"
                    />
                </div>
                <div>
                    <label className="field-label">{t('applicableGrades')}</label>
                    <input
                        className="field"
                        value={form.applicableGrades}
                        onChange={e => set('applicableGrades', e.target.value)}
                        placeholder="e.g. 9,10,11,12"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('saving') : t('save')}
                </button>
            </div>
        </form>
    )
}

export default function SubjectsPage() {
    const { t } = useLanguage()
    const [subjects, setSubjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleteError, setDeleteError] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [search, setSearch] = useState('')

    const load = async (silent = false) => {
        if (!silent) setLoading(true)
        try { setSubjects(await subjectService.getAll()) }
        catch { toast.error(t('failedToLoadSubjects')) }
        finally { if (!silent) setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                await subjectService.create(payload)
            } else {
                await subjectService.update(modal.subject.id, payload)
            }
            setModal(null)
            load(true)
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        setDeleteError(null)
        setDeleting(true)
        try {
            await subjectService.remove(id)
            setSubjects(prev => prev.filter(s => s.id !== id))
            setConfirmDelete(null)
            load(true)
        } catch (err) {
            const msg = err.response?.data?.message || t('deleteFailed')
            setDeleteError(msg)
            load(true)
        } finally {
            setDeleting(false)
        }
    }

    const filtered = subjects.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.code || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('subjectsPage')}</h1>
                    <p className="text-slate-500 mt-1">{subjects.length} {t('subjectsDefined')}</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                    + {t('addSubject')}
                </button>
            </div>

            <div className="mb-4">
                <input
                    className="field max-w-sm"
                    placeholder={`${t('search')}…`}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t('loading')}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">{t('noSubjectsFound')}</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3">{t('nameLabel')}</th>
                                <th className="px-4 py-3">{t('codeLabel')}</th>
                                <th className="px-4 py-3">{t('applicableGrades')}</th>
                                <th className="px-4 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-brand">{s.code || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {s.applicableGrades
                                            ? s.applicableGrades.split(',').map(g => g.trim()).filter(Boolean).map(g => (
                                                <span key={g} className="inline-block bg-slate-100 text-slate-600 text-xs px-1.5 py-0.5 rounded mr-1">
                                                    Gr {g}
                                                </span>
                                            ))
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-right space-x-3">
                                        <button
                                            className="text-xs text-brand hover:underline"
                                            onClick={() => setModal({ mode: 'edit', subject: s })}
                                        >
                                            {t('edit')}
                                        </button>
                                        <button
                                            className="text-xs text-red-500 hover:underline"
                                            onClick={() => setConfirmDelete(s)}
                                        >
                                            {t('delete')}
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
                    title={modal.mode === 'add' ? t('addSubject') : t('editSubject')}
                    onClose={() => setModal(null)}
                >
                    <SubjectForm
                        initial={modal.mode === 'edit'
                            ? { name: modal.subject.name, code: modal.subject.code || '', applicableGrades: modal.subject.applicableGrades || '' }
                            : EMPTY}
                        onSubmit={handleSave}
                        onClose={() => setModal(null)}
                        loading={saving}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title={t('confirmDelete')} onClose={() => { setConfirmDelete(null); setDeleteError(null) }}>
                    {deleteError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-start gap-2">
                            <span className="font-bold text-red-500">✕</span>
                            <span>{deleteError}</span>
                        </div>
                    )}
                    <p className="text-slate-700">
                        {t('deleteSubjectConfirm')} <strong>{confirmDelete.name}</strong>?
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" disabled={deleting} onClick={() => { setConfirmDelete(null); setDeleteError(null) }}>{t('cancel')}</button>
                        <button className="btn-danger" disabled={deleting} onClick={() => handleDelete(confirmDelete.id)}>
                            {deleting ? (t('deleting') || 'Deleting…') : t('delete')}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
