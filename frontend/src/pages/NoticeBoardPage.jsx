import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { noticeService } from '../services/noticeService'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const PRIORITY_BADGE = {
    HIGH: 'bg-red-100 text-red-700',
    MEDIUM: 'bg-yellow-100 text-yellow-700',
    LOW: 'bg-slate-100 text-slate-600',
}

const AUDIENCE_OPTS = ['GENERAL', 'STUDENT', 'TEACHER', 'PARENT']
const PRIORITY_OPTS = ['LOW', 'MEDIUM', 'HIGH']

const EMPTY = { title: '', body: '', audience: 'GENERAL', priority: 'MEDIUM', pinned: false }

function NoticeForm({ initial, onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const AUDIENCE_LABELS = {
        GENERAL: t('audienceGeneral'),
        STUDENT: t('STUDENT'),
        TEACHER: t('TEACHER'),
        PARENT:  t('PARENT'),
    }
    const PRIORITY_LABELS = {
        LOW:    t('priorityLow'),
        MEDIUM: t('priorityMedium'),
        HIGH:   t('priorityHigh'),
    }

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-3">
            <div>
                <label className="field-label">{t('titleLabel')} *</label>
                <input className="field" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
                <label className="field-label">{t('bodyLabel')} *</label>
                <textarea className="field min-h-[120px]" value={form.body}
                    onChange={e => set('body', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">{t('audienceLabel')}</label>
                    <select className="field" value={form.audience} onChange={e => set('audience', e.target.value)}>
                        {AUDIENCE_OPTS.map(a => <option key={a} value={a}>{AUDIENCE_LABELS[a] || a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="field-label">{t('priorityLabel')}</label>
                    <select className="field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                        {PRIORITY_OPTS.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p] || p}</option>)}
                    </select>
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} />
                {t('pinNotice')}
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('saving') : t('save')}
                </button>
            </div>
        </form>
    )
}

export default function NoticeBoardPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const isAdmin = user?.role === 'ADMIN'
    const [notices, setNotices] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [expanded, setExpanded] = useState(null)
    const [confirmDelete, setConfirmDelete] = useState(null)

    // Translated badge labels (computed inside component so t() is in scope)
    const PRIORITY_LABELS = { LOW: t('priorityLow'), MEDIUM: t('priorityMedium'), HIGH: t('priorityHigh') }
    const AUDIENCE_LABELS = { GENERAL: t('audienceGeneral'), STUDENT: t('STUDENT'), TEACHER: t('TEACHER'), PARENT: t('PARENT') }

    const load = async () => {
        setLoading(true)
        try { setNotices(await noticeService.getAll()) }
        catch { toast.error(t('failedToLoadNotices')) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                await noticeService.create(payload)
                toast.success(t('noticePosted'))
            } else {
                await noticeService.update(modal.notice.id, payload)
                toast.success(t('noticeUpdated'))
            }
            setModal(null); load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try {
            await noticeService.remove(id)
            toast.success(t('noticeDeleted'))
            setConfirmDelete(null); load()
        } catch { toast.error(t('deleteFailed')) }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('noticeBoardPage')}</h1>
                    <p className="text-slate-500 mt-1">{notices.length} {t('noticesCount')}</p>
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                        + {t('postNotice')}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : notices.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noNotices')}</div>
            ) : (
                <div className="space-y-4">
                    {notices.map(n => (
                        <div key={n.id}
                            className={`card cursor-pointer hover:shadow-md transition ${n.pinned ? 'border-brand/40 bg-brand/5' : ''}`}
                            onClick={() => setExpanded(expanded === n.id ? null : n.id)}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {n.pinned && <span className="text-brand text-xs font-bold">📌 {t('pinned')}</span>}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.LOW}`}>
                                            {PRIORITY_LABELS[n.priority] || n.priority}
                                        </span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {AUDIENCE_LABELS[n.audience] || n.audience}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mt-1">{n.title}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {t('by')} {n.postedBy} · {new Date(n.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-slate-400 text-lg">{expanded === n.id ? '▲' : '▼'}</span>
                            </div>

                            {expanded === n.id && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                                    {isAdmin && (
                                        <div className="flex gap-3 mt-4">
                                            <button className="text-xs text-brand hover:underline"
                                                onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', notice: n }) }}>
                                                {t('edit')}
                                            </button>
                                            <button className="text-xs text-red-500 hover:underline"
                                                onClick={e => { e.stopPropagation(); setConfirmDelete(n) }}>
                                                {t('delete')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <Modal title={modal.mode === 'add' ? t('postNotice') : t('editNotice')} onClose={() => setModal(null)}>
                    <NoticeForm
                        initial={modal.mode === 'edit' ? {
                            title: modal.notice.title, body: modal.notice.body,
                            audience: modal.notice.audience, priority: modal.notice.priority,
                            pinned: modal.notice.pinned
                        } : EMPTY}
                        onSubmit={handleSave} onClose={() => setModal(null)} loading={saving}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title={t('confirmDelete')} onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">{t('deleteNoticeConfirm')} <strong>"{confirmDelete.title}"</strong>?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
