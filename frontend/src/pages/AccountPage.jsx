import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { authService } from '../services/authService'
import toast from 'react-hot-toast'

const ROLE_LABELS = {
  ADMIN: 'Director',
  TEACHER: 'Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
}

export default function AccountPage() {
  const { user } = useAuth()
  const { t } = useLanguage()

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      await authService.changePassword(form.currentPassword, form.newPassword)
      toast.success('Password changed successfully')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('accountPage')}</h1>
        <p className="text-slate-500 mt-1">View your profile and manage your password</p>
      </div>

      {/* Profile card */}
      <div className="card mb-6">
        <h2 className="font-semibold text-slate-800 mb-4">Profile</h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">Full name</dt>
            <dd className="font-medium text-slate-900">{user?.fullName}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Username</dt>
            <dd className="font-mono text-slate-700">{user?.username}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">Role</dt>
            <dd>
              <span className="inline-block bg-brand/10 text-brand text-xs font-semibold px-2 py-0.5 rounded-full">
                {ROLE_LABELS[user?.role] ?? user?.role}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="field-label">Current Password *</label>
            <input
              className="field"
              type="password"
              autoComplete="current-password"
              value={form.currentPassword}
              onChange={e => set('currentPassword', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="field-label">New Password * (min 6 characters)</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="field-label">Confirm New Password *</label>
            <input
              className="field"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={e => set('confirmPassword', e.target.value)}
              required
              minLength={6}
            />
          </div>

          {/* Visual strength indicator */}
          {form.newPassword.length > 0 && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    form.newPassword.length < 6 ? 'w-1/4 bg-red-400' :
                    form.newPassword.length < 10 ? 'w-2/4 bg-yellow-400' :
                    'w-full bg-green-500'
                  }`}
                />
              </div>
              <p className="text-xs text-slate-400">
                {form.newPassword.length < 6 ? 'Too short' :
                 form.newPassword.length < 10 ? 'Acceptable' : 'Strong'}
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Savingâ€¦' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
