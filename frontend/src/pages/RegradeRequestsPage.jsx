import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { regradeService } from '../services/gradeService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const STATUS_BADGE = {
    PENDING:  'bg-yellow-100 text-yellow-800',
    APPROVED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    USED:     'bg-slate-100 text-slate-600',
}

function ResolveModal({ request, onResolve, onClose }) {
    const { t } = useLanguage()
    const [note, setNote] = useState('')
    const [loading, setLoading] = useState(false)

    const handle = async (approve) => {
        setLoading(true)
        try {
            await onResolve(request.id, approve, note)
            onClose()
        } finally { setLoading(false) }
    }

    return (
        <div className="space-y-4">
            <div className="text-sm text-slate-700 space-y-1">
                <p><span className="text-slate-500">{t('teacherLabel')}:</span> <strong>{request.teacherName}</strong> ({request.teacherEmployeeId})</p>
                <p><span className="text-slate-500">{t('student')}:</span> <strong>{request.studentName}</strong> <span className="text-xs text-slate-400">({request.studentUid})</span></p>
                <p><span className="text-slate-500">{t('subjectLabel')}:</span> {request.subjectName}</p>
                <p><span className="text-slate-500">{t('classLabel')}:</span> {request.sectionLabel}</p>
                <p><span className="text-slate-500">{t('semester')}:</span> {request.term} · {request.academicYear}</p>
                {request.reason && (
                    <p><span className="text-slate-500">{t('reasonLabel')}:</span> {request.reason}</p>
                )}
            </div>
            <div>
                <label className="field-label">{t('noteToTeacher')}</label>
                <textarea className="field" rows={2} value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={`${t('addNoteForTeacher')}…`} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button className="btn-danger" disabled={loading}
                    onClick={() => handle(false)}>
                    {loading ? '…' : `✗ ${t('reject')}`}
                </button>
                <button className="btn-primary" disabled={loading}
                    onClick={() => handle(true)}>
                    {loading ? '…' : `✓ ${t('approve')}`}
                </button>
            </div>
        </div>
    )
}

export default function RegradeRequestsPage() {
    const { t } = useLanguage()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('PENDING')
    const [resolveModal, setResolveModal] = useState(null)

    const load = () => {
        setLoading(true)
        regradeService.getAll()
            .then(setRequests)
            .catch(() => toast.error(t('failedToLoadRegrade')))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const handleResolve = async (id, approve, note) => {
        try {
            if (approve) {
                await regradeService.approve(id, note)
                toast.success(t('regradeApproved'))
            } else {
                await regradeService.reject(id, note)
                toast.success(t('regradeRejected'))
            }
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('resolveFailed'))
        }
    }

    const filtered = requests.filter(r => filter === 'ALL' || r.status === filter)
    const pendingCount = requests.filter(r => r.status === 'PENDING').length

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('regradeCard')}</h1>
                <p className="text-slate-500 mt-1">
                    {t('regradeSubtitle')}
                    {pendingCount > 0 && <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount} {t('pending')}</span>}
                </p>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-4 flex-wrap">
                {['PENDING', 'APPROVED', 'REJECTED', 'USED', 'ALL'].map(s => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition ${
                            filter === s ? 'bg-brand text-white border-brand' : 'border-slate-200 text-slate-600 hover:border-brand'
                        }`}
                    >
                        {s === 'ALL' ? `${t('all')} (${requests.length})` : `${s} (${requests.filter(r => r.status === s).length})`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : filtered.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noRequests')} {filter.toLowerCase()}.</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">{t('teacherLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('subjectLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('student')}</th>
                                <th className="px-4 py-3 text-left">{t('classLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('semester')}</th>
                                <th className="px-4 py-3 text-left">{t('reasonLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('dateLabel')}</th>
                                <th className="px-4 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(r => (
                                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{r.teacherName}</div>
                                        <div className="text-xs text-slate-400">{r.teacherEmployeeId}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{r.subjectName}</td>
                                    <td className="px-4 py-3">
                                        <div className="text-slate-700">{r.studentName}</div>
                                        <div className="text-xs text-slate-400">{r.studentUid}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{r.sectionLabel}</td>
                                    <td className="px-4 py-3 text-center text-slate-600">
                                        Sem {r.term} · {r.academicYear}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">
                                        {r.reason || '—'}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[r.status]}`}>
                                            {r.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-xs text-slate-500">
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {r.status === 'PENDING' && (
                                            <button
                                                className="text-xs text-brand hover:underline font-medium"
                                                onClick={() => setResolveModal(r)}
                                            >
                                                {t('review')}
                                            </button>
                                        )}
                                        {r.status !== 'PENDING' && r.adminNote && (
                                            <span className="text-xs text-slate-400" title={r.adminNote}>
                                                {t('noteLabel')} ℹ️
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {resolveModal && (
                <Modal title={t('reviewRegradeRequest')} onClose={() => setResolveModal(null)}>
                    <ResolveModal
                        request={resolveModal}
                        onResolve={handleResolve}
                        onClose={() => setResolveModal(null)}
                    />
                </Modal>
            )}
        </div>
    )
}
