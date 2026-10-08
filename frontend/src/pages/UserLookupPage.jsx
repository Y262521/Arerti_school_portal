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
    const [newPassword, setNewPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [copied, setCopied] = useState(false)

    const handleReset = async (e) => {
        e.preventDefault()
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
        setLoading(true)
        try {
            const r = await api.post(`/auth/admin/users/${user.id}/reset-password`, { newPassword })
            setResult(r.data)
            toast.success('Password reset successfully')
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed')
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
            {/* User info */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                <p><span className="text-slate-500">Name:</span> <strong>{user.fullName}</strong></p>
                <p><span className="text-slate-500">Username:</span> <code className="bg-slate-200 px-1 rounded">{user.username}</code></p>
                <p><span className="text-slate-500">Email:</span> {user.email}</p>
                <p><span className="text-slate-500">Role:</span> <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_BADGE[user.role]}`}>{user.role}</span></p>
            </div>

            {result ? (
                /* Show credentials after reset */
                <div className="space-y-3">
                    <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                        âœ… Password reset. Share these credentials with the user â€” they must change it on next login.
                    </div>
                    <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                        <p><span className="text-slate-500">Username:</span> <strong>{result.username}</strong></p>
                        <p><span className="text-slate-500">New Password:</span> <strong>{result.newPassword}</strong></p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button className="btn-ghost" onClick={copyAll}>
                            {copied ? 'âœ“ Copied!' : 'Copy to Clipboard'}
                        </button>
                        <button className="btn-primary" onClick={onClose}>Done</button>
                    </div>
                </div>
            ) : (
                /* Reset form */
                <form onSubmit={handleReset} className="space-y-3">
                    <div>
                        <label className="field-label">New Password * (min 6 characters)</label>
                        <input
                            className="field"
                            type="text"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Enter new password for this user"
                            minLength={6}
                            required
                        />
                        <p className="text-xs text-slate-400 mt-1">
                            Tip: use something like <code>Arerti@2026</code> and tell the user to change it.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Resettingâ€¦' : 'Reset Password'}
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
            toast.error('Search failed')
        } finally { setLoading(false) }
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('userLookupPageTitle')}</h1>
                <p className="text-slate-500 mt-1">
                    Find any user to view their username or reset their password.
                </p>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="flex gap-3 mb-6 max-w-lg">
                <input
                    className="field flex-1"
                    placeholder="Search by name, username or emailâ€¦"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Searchingâ€¦' : 'Search'}
                </button>
            </form>

            {/* Results */}
            {searched && users.length === 0 && (
                <div className="card p-8 text-center text-slate-500">No users found for "{query}"</div>
            )}

            {users.length > 0 && (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">Name</th>
                                <th className="px-4 py-3 text-left">Username</th>
                                <th className="px-4 py-3 text-left">Email</th>
                                <th className="px-4 py-3 text-center">Role</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Actions</th>
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
                                            {u.enabled ? 'Active' : 'Disabled'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button
                                            className="text-xs text-brand hover:underline font-medium"
                                            onClick={() => setResetModal(u)}
                                        >
                                            View / Reset Password
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
                    title={`Credentials â€” ${resetModal.fullName}`}
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
