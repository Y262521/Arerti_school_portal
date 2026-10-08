import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import api from '../services/api'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const ROLE_BADGE = {
    ADMIN:   'bg-purple-100 text-purple-700',
    TEACHER: 'bg-blue-100 text-blue-700',
    STUDENT: 'bg-green-100 text-green-700',
    PARENT:  'bg-orange-100 text-orange-700',
}

function ResetPasswordModal({ user, onClose }) {
    const { t } = useLanguage()
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleReset = async (e) => {
        e.preventDefault()
        if (newPassword.length < 6) { toast.error(t('passwordTooShort')); return }
        setLoading(true)
        try {
            const r = await api.post(`/auth/admin/users/${user.id}/reset-password`, { newPassword })
            setResult(r.data)
            toast.success(t('passwordResetSuccess'))
        } catch (err) {
            toast.error(err.response?.data?.message || t('resetFailed'))
        } finally { setLoading(false) }
    }

    const copyAll = () => {
        const text = `Username: ${result.username}\nNew Password: ${result.newPassword}`
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                <p><span className="text-slate-500">{t('nameLabel')}:</span> <strong>{user.fullName}</strong></p>
                <p><span className="text-slate-500">{t('username')}:</span> <code className="bg-slate-200 px-1 rounded">{user.username}</code></p>
                <p><span className="text-slate-500">{t('email')}:</span> {user.email}</p>
                <p><span className="text-slate-500">{t('roleLabel')}:</span> <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>{user.role}</span></p>
            </div>

            {result ? (
                <div className="space-y-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                        ✅ {t('passwordResetShareNote')}
                    </div>
                    <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                        <p><span className="text-slate-500">{t('username')}:</span> <strong>{result.username}</strong></p>
                        <p><span className="text-slate-500">{t('newPasswordLabel')}:</span> <strong>{result.newPassword}</strong></p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button className="btn-ghost" onClick={copyAll}>
                            {copied ? `✓ ${t('copied')}` : t('copyToClipboard')}
                        </button>
                        <button className="btn-primary" onClick={onClose}>{t('done')}</button>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleReset} className="space-y-3">
                    <div>
                        <label className="field-label">{t('newPasswordLabel')} * ({t('min6chars')})</label>
                        <input
                            className="field"
                            type="text"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder={t('enterNewPasswordForUser')}
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            {t('passwordResetTip')}
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? t('resetting') : t('resetPassword')}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

export default function UserLookupPage() {
    const { t } = useLanguage()
    const [query, setQuery] = useState('')
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [resetModal, setResetModal] = useState(null)

    const handleSearch = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const r = await api.get('/auth/admin/users', { params: { q: query } })
            setUsers(r.data)
            setSearched(true)
        } catch {
            toast.error(t('searchFailed'))
        } finally { setLoading(false) }
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('userLookupPageTitle')}</h1>
                <p className="text-slate-500 mt-1">
                    {t('userLookupSubtitle')}
                </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-lg">
                <input
                    className="field flex-1"
                    placeholder={`${t('searchByNameUsernameEmail')}…`}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('searching') : t('search')}
                </button>
            </form>

            {searched && users.length === 0 && (
                <div className="card p-8 text-center text-slate-500">{t('noUsersFound')} "{query}"</div>
            )}

            {users.length > 0 && (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">{t('nameLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('username')}</th>
                                <th className="px-4 py-3 text-left">{t('email')}</th>
                                <th className="px-4 py-3 text-center">{t('roleLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                                <th className="px-4 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-medium text-slate-900">{u.fullName}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-brand">{u.username}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">{u.email}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[u.role] || 'bg-slate-100 text-slate-600'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.enabled ? t('active') : t('disabled')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-xs text-brand hover:underline font-medium"
                                            onClick={() => setResetModal(u)}
                                        >
                                            {t('viewResetPassword')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {resetModal && (
                <Modal
                    title={`${t('credentialsFor')} ${resetModal.fullName}`}
                    onClose={() => setResetModal(null)}
                >
                    <ResetPasswordModal
                        user={resetModal}
                        onClose={() => setResetModal(null)}
                    />
                </Modal>
            )}
        </div>
    )
}
