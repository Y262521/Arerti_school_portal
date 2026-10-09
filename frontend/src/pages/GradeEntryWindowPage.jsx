import { useEffect, useState } from 'react'
import { gradeEntryWindowService } from '../services/registrationService'
import { useLanguage } from '../context/LanguageContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

function OpenWindowForm({ onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const now = new Date()
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    const [form, setForm] = useState({
        academicYear: CURRENT_YEAR, semester: 1, startDatetime: localNow, endDatetime: '', note: ''
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.endDatetime) { toast.error(t('endDateRequired')); return }
        onSubmit({ ...form, semester: Number(form.semester), startDatetime: form.startDatetime + ':00', endDatetime: form.endDatetime + ':00' })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">{t('academicYear')} *</label>
                    <input className="field" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">{t('semester')} *</label>
                    <select className="field" value={form.semester} onChange={e => set('semester', e.target.value)}>
                        <option value={1}>{t('semester')} 1</option>
                        <option value={2}>{t('semester')} 2</option>
                    </select>
                </div>
                <div>
                    <label className="field-label">{t('startDateTime')} *</label>
                    <input className="field" type="datetime-local" value={form.startDatetime} onChange={e => set('startDatetime', e.target.value)} required />
                </div>
                <div>
                    <label className="field-label">{t('endDateTime')} *</label>
                    <input className="field" type="datetime-local" value={form.endDatetime} onChange={e => set('endDatetime', e.target.value)} required />
                    {!form.endDatetime && <p className="text-xs text-red-500 mt-0.5">{t('required')}</p>}
                </div>
                <div className="col-span-2">
                    <label className="field-label">{t('noteLabel')}</label>
                    <input className="field" value={form.note} onChange={e => set('note', e.target.value)} placeholder={t('optionalNote')} />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('opening') : t('openGradeEntry')}
                </button>
            </div>
        </form>
    )
}

function PostponeForm({ windowId, currentEnd, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [newEnd, setNewEnd] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await gradeEntryWindowService.postpone(windowId, { newEndDatetime: newEnd + ':00', reason })
            toast.success(t('gradeEntryWindowExtended'))
            onSuccess()
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToPostpone'))
        } finally { setLoading(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <p className="text-sm text-slate-600">
                {t('currentEnd')}: <strong>{new Date(currentEnd).toLocaleString()}</strong>
            </p>
            <div>
                <label className="field-label">{t('newEndDate')} *</label>
                <input className="field" type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)} required />
            </div>
            <div>
                <label className="field-label">{t('postponeReason')}</label>
                <input className="field" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('postponeReasonPlaceholder')} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading || !newEnd}>
                    {loading ? '…' : t('postponeGradeEntry')}
                </button>
            </div>
        </form>
    )
}

export default function GradeEntryWindowPage() {
    const { t } = useLanguage()
    const [windows, setWindows] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [opening, setOpening] = useState(false)
    const [postponeModal, setPostponeModal] = useState(null)
    const [confirmClose, setConfirmClose] = useState(null)

    const load = () => {
        setLoading(true)
        gradeEntryWindowService.getAll()
            .then(setWindows)
            .catch(() => toast.error(t('failedToLoad')))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const handleOpen = async (payload) => {
        setOpening(true)
        try {
            await gradeEntryWindowService.open(payload)
            toast.success(t('gradeEntryWindowOpened'))
            setOpenModal(false); load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('failedToLoad'))
        } finally { setOpening(false) }
    }

    const handleClose = async (id) => {
        try {
            await gradeEntryWindowService.close(id)
            toast.success(t('gradeEntryWindowClosed'))
            setConfirmClose(null); load()
        } catch { toast.error(t('failedToClose')) }
    }

    const active = windows.filter(w => w.active)
    const closed = windows.filter(w => !w.active)

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('gradeEntryWindow')}</h1>
                    <p className="text-slate-500 mt-1">{t('gradeEntryWindowSubtitle')}</p>
                </div>
                <button className="btn-primary" onClick={() => setOpenModal(true)}>
                    + {t('openGradeEntry')}
                </button>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : (
                <div className="space-y-6">
                    {active.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                {t('activeGradeEntries')} ({active.length})
                            </h2>
                            <div className="space-y-3">
                                {active.map(w => (
                                    <div key={w.id} className="card border-green-200 bg-green-50/30">
                                        <div className="flex items-start justify-between flex-wrap gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                                                        ● {t('gradeEntryOpen')}
                                                    </span>
                                                    <span className="font-semibold text-slate-900">
                                                        {w.academicYear} — {t('semester')} {w.semester}
                                                    </span>
                                                    {w.postponeCount > 0 && (
                                                        <span className="text-xs text-blue-500">⏰ {t('extended')} {w.postponeCount}x</span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {new Date(w.startDatetime).toLocaleString()} → {new Date(w.endDatetime).toLocaleString()}
                                                </p>
                                                {w.note && <p className="text-xs text-slate-400 italic">"{w.note}"</p>}
                                                <p className="text-xs text-slate-400">{t('openedBy')}: {w.openedBy}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button className="btn-ghost text-xs border-blue-200 text-blue-600"
                                                    onClick={() => setPostponeModal(w)}>
                                                    ⏰ {t('postponeGradeEntry')}
                                                </button>
                                                <button className="btn-ghost text-xs border-red-200 text-red-600"
                                                    onClick={() => setConfirmClose(w)}>
                                                    {t('closeGradeEntry')}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {windows.length === 0 && (
                        <div className="card p-8 text-center text-slate-500">{t('noGradeEntryWindows')}</div>
                    )}

                    {closed.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-500 mb-2 text-sm uppercase tracking-wide">
                                {t('pastGradeEntries')} ({closed.length})
                            </h2>
                            <div className="space-y-2">
                                {closed.map(w => (
                                    <div key={w.id} className="card opacity-60">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t('closed')}</span>
                                            <span className="text-sm text-slate-700">{w.academicYear} — {t('semester')} {w.semester}</span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(w.startDatetime).toLocaleDateString()} → {new Date(w.endDatetime).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {openModal && (
                <Modal title={t('openGradeEntry')} onClose={() => setOpenModal(false)}>
                    <OpenWindowForm onSubmit={handleOpen} onClose={() => setOpenModal(false)} loading={opening} />
                </Modal>
            )}

            {postponeModal && (
                <Modal title={t('postponeGradeEntry')} onClose={() => setPostponeModal(null)}>
                    <PostponeForm windowId={postponeModal.id} currentEnd={postponeModal.endDatetime}
                        onSuccess={() => { setPostponeModal(null); load() }} onClose={() => setPostponeModal(null)} />
                </Modal>
            )}

            {confirmClose && (
                <Modal title={t('closeGradeEntry')} onClose={() => setConfirmClose(null)}>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                            {t('closeGradeEntryWarning')}
                        </div>
                        <p className="text-sm text-slate-700">
                            {t('closeGradeEntryConfirm')} <strong>{confirmClose.academicYear} — {t('semester')} {confirmClose.semester}</strong>?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button className="btn-ghost" onClick={() => setConfirmClose(null)}>{t('cancel')}</button>
                            <button className="btn-danger" onClick={() => handleClose(confirmClose.id)}>{t('closeGradeEntry')}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
