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
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-3">
            <div>
                <label className="field-label">Title *</label>
                <input className="field" value={form.title} onChange={e => set('title', e.target.value)} required />
            </div>
            <div>
                <label className="field-label">Body *</label>
                <textarea className="field min-h-[120px]" value={form.body}
                    onChange={e => set('body', e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">Audience</label>
                    <select className="field" value={form.audience} onChange={e => set('audience', e.target.value)}>
                        {AUDIENCE_OPTS.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="field-label">Priority</label>
                    <select className="field" value={form.priority} onChange={e => set('priority', e.target.value)}>
                        {PRIORITY_OPTS.map(p => <option key={p}>{p}</option>)}
                    </select>
                </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input type="checkbox" checked={form.pinned} onChange={e => set('pinned', e.target.checked)} />
                Pin this notice to the top
            </label>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Savingâ€¦' : 'Save'}
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

    const load = async () => {
        setLoading(true)
        try { setNotices(await noticeService.getAll()) }
        catch { toast.error('Failed to load notices') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                await noticeService.create(payload)
                toast.success('Notice posted')
            } else {
                await noticeService.update(modal.notice.id, payload)
                toast.success('Notice updated')
            }
            setModal(null); load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try {
            await noticeService.remove(id)
            toast.success('Notice deleted')
            setConfirmDelete(null); load()
        } catch { toast.error('Delete failed') }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('noticeBoardPage')}</h1>
                    <p className="text-slate-500 mt-1">{notices.length} notices</p>
                </div>
                {isAdmin && (
                    <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                        + Post Notice
                    </button>
                )}
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loadingâ€¦</div>
            ) : notices.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">No notices yet.</div>
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
                                        {n.pinned && <span className="text-brand text-xs font-bold">ðŸ“Œ Pinned</span>}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[n.priority] || PRIORITY_BADGE.LOW}`}>
                                            {n.priority}
                                        </span>
                                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                            {n.audience}
                                        </span>
                                    </div>
                                    <h3 className="font-semibold text-slate-900 mt-1">{n.title}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        By {n.postedBy} Â· {new Date(n.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="text-slate-400 text-lg">{expanded === n.id ? 'â–²' : 'â–¼'}</span>
                            </div>

                            {expanded === n.id && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{n.body}</p>
                                    {isAdmin && (
                                        <div className="flex gap-3 mt-4">
                                            <button className="text-xs text-brand hover:underline"
                                                onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', notice: n }) }}>
                                                Edit
                                            </button>
                                            <button className="text-xs text-red-500 hover:underline"
                                                onClick={e => { e.stopPropagation(); setConfirmDelete(n) }}>
                                                Delete
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
                <Modal title={modal.mode === 'add' ? 'Post Notice' : 'Edit Notice'} onClose={() => setModal(null)}>
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
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">Delete notice <strong>"{confirmDelete.title}"</strong>?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
