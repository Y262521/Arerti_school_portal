import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { parentService } from '../services/parentService'
import Modal from '../components/Modal'

function LinkForm({ onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const [studentUsername, setStudentUsername] = useState('')
    const [studentPassword, setStudentPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [relationship, setRelationship] = useState('')

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit({ studentUsername, studentPassword, relationship }) }} className="space-y-3">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                🔐 Enter your child's portal <strong>username</strong> and <strong>password</strong> to link their account securely.
            </div>
            <div>
                <label className="field-label">{t('username')} *</label>
                <input
                    className="field"
                    placeholder="e.g. agsps1000"
                    value={studentUsername}
                    onChange={e => setStudentUsername(e.target.value)}
                    autoComplete="off"
                    required
                />
            </div>
            <div>
                <label className="field-label">{t('password')} *</label>
                <div className="relative">
                    <input
                        className="field pr-10"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={studentPassword}
                        onChange={e => setStudentPassword(e.target.value)}
                        autoComplete="off"
                        required
                    />
                    <button type="button" tabIndex={-1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        onClick={() => setShowPassword(v => !v)}>
                        {showPassword ? '🙈' : '👁'}
                    </button>
                </div>
            </div>
            <div>
                <label className="field-label">{t('relationship')}</label>
                <input
                    className="field"
                    placeholder="e.g. Mother, Father, Guardian"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('linking') : t('linkChild')}
                </button>
            </div>
        </form>
    )
}

export default function ParentChildrenPage() {
    const { t } = useLanguage()
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState(false)
    const [modal, setModal] = useState(false)
    const [confirmUnlink, setConfirmUnlink] = useState(null)

    const load = async () => {
        setLoading(true)
        try { setChildren(await parentService.getChildren()) }
        catch { /* silent */ }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleLink = async (payload) => {
        setLinking(true)
        try {
            const linked = await parentService.link(payload)
            setModal(false)
            setChildren(prev => [...prev, linked])
        } catch (err) {
        } finally { setLinking(false) }
    }

    const handleUnlink = async (linkId) => {
        try {
            await parentService.unlink(linkId)
            setConfirmUnlink(null)
            setChildren(prev => prev.filter(c => c.linkId !== linkId))
        } catch { /* silent */ }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('myChildrenPage')}</h1>
                    <p className="text-slate-500 mt-1">{children.length} {t('linkedChildren')}</p>
                </div>
                <button className="btn-primary" onClick={() => setModal(true)}>
                    + {t('linkAChild')}
                </button>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : children.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                    {t('noChildrenLinked')}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map(c => (
                        <div key={c.linkId} className="card flex flex-col">
                            <h3 className="font-semibold text-slate-900">{c.studentFullName}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{c.studentUid}</p>
                            {c.sectionLabel && (
                                <p className="text-sm text-slate-600 mt-1">{c.sectionLabel}</p>
                            )}
                            {c.relationship && (
                                <p className="text-xs text-slate-400 mt-1">{t('relationship')}: {c.relationship}</p>
                            )}
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                <Link to="/parent/report-cards" className="text-xs text-brand font-semibold hover:underline">
                                    📊 {t('reportCards')} →
                                </Link>
                                <button className="text-xs text-red-500 hover:underline"
                                    onClick={() => setConfirmUnlink(c)}>
                                    {t('unlink')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <Modal title={t('linkAChild')} onClose={() => setModal(false)}>
                    <LinkForm onSubmit={handleLink} onClose={() => setModal(false)} loading={linking} />
                </Modal>
            )}

            {confirmUnlink && (
                <Modal title={t('confirmUnlink')} onClose={() => setConfirmUnlink(null)}>
                    <p className="text-slate-700">
                        {t('unlinkConfirm')} <strong>{confirmUnlink.studentFullName}</strong> ({confirmUnlink.studentUid})?
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmUnlink(null)}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={() => handleUnlink(confirmUnlink.linkId)}>{t('unlink')}</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
