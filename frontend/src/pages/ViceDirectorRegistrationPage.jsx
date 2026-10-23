import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { viceDirectorService } from '../services/viceDirectorService'
import DocumentUploadField from '../components/DocumentUploadField'

const EMPTY = {
    firstName: '', fatherName: '', grandfatherName: '', gender: '', dateOfBirth: '',
    email: '', phone: '',
    photoUrl: '', qualificationCertUrl: '', idDocUrl: ''
}

// ── Credentials display after successful registration ─────────────────────────
function CredentialsCard({ person, onRegisterAnother }) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)
    const text = `Vice Director: ${person.fullName}\nEmployee ID: ${person.employeeId}\nUsername: ${person.generatedUsername}\nPassword: ${person.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="max-w-lg mx-auto">
            <div className="card space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                    ✅ {t('viceDirectorRegisteredSuccess')}
                </div>

                {person.photoUrl && (
                    <div className="flex justify-center">
                        <img src={person.photoUrl} alt="Vice Director" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" />
                    </div>
                )}

                <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-2">
                    <p><span className="text-slate-500">{t('nameLabel')}:</span> <strong>{person.fullName}</strong></p>
                    <p><span className="text-slate-500">Employee ID:</span> <strong>{person.employeeId}</strong></p>
                    <p><span className="text-slate-500">{t('username')}:</span> <strong>{person.generatedUsername}</strong></p>
                    <p><span className="text-slate-500">{t('password')}:</span> <strong>{person.generatedPassword}</strong></p>
                    <p><span className="text-slate-500">{t('email')}:</span> <strong>{person.email}</strong></p>
                </div>

                <p className="text-xs text-slate-500">{t('passwordShownOnce')}</p>

                <div className="flex justify-between gap-2 pt-2">
                    <button className="btn-ghost" onClick={copy}>
                        {copied ? `✓ ${t('copied')}` : t('copyToClipboard')}
                    </button>
                    <button className="btn-primary" onClick={onRegisterAnother}>
                        + {t('registerAnother')}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Registration form ──────────────────────────────────────────────────────────
function ViceDirectorRegistrationForm({ onSuccess }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(EMPTY)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    // Clear error as soon as the user edits anything
    const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(null) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.photoUrl) { setError(t('photoRequired') || 'Photo is required'); return }
        if (!form.qualificationCertUrl) { setError(t('qualificationCert') + ' is required'); return }
        if (!form.idDocUrl) { setError(t('idDocument') + ' is required'); return }
        setError(null)
        setSaving(true)
        try {
            const payload = {
                ...form,
                firstName: (form.firstName || '').trim(),
                fatherName: (form.fatherName || '').trim(),
                grandfatherName: (form.grandfatherName || '').trim(),
                email: (form.email || '').trim(),
                phone: (form.phone || '').trim(),
            }
            const result = await viceDirectorService.create(payload)
            onSuccess(result)
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data || 'Registration failed'
            setError(typeof msg === 'string' ? msg : 'Registration failed')
        } finally { setSaving(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            {/* Personal Info */}
            <div className="card space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2">{t('personalInfo')}</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('firstName')} *</label>
                        <input className="field" value={form.firstName} onChange={e => set('firstName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('fatherName')} *</label>
                        <input className="field" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('grandfatherName')} *</label>
                        <input className="field" value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('gender')} *</label>
                        <select className="field" value={form.gender} onChange={e => set('gender', e.target.value)} required>
                            <option value="">-- {t('selectLabel')} --</option>
                            <option value="Male">{t('male')}</option>
                            <option value="Female">{t('female')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('dateOfBirth')}</label>
                        <input className="field" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('email')} *</label>
                        <input className="field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('phone')}</label>
                        <input className="field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+251..." />
                    </div>
                </div>
            </div>

            {/* Documents */}
            <div className="card space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2">{t('documentsSection')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DocumentUploadField
                        label={t('teacherPhoto')}
                        folder="vd-photos"
                        value={form.photoUrl}
                        onChange={v => set('photoUrl', v)}
                        accept="image/jpeg,image/png"
                        multiple={false}
                        required={true}
                    />
                    <DocumentUploadField
                        label={t('qualificationCert')}
                        folder="qualifications"
                        value={form.qualificationCertUrl}
                        onChange={v => set('qualificationCertUrl', v)}
                        accept="image/*,.pdf"
                        multiple={true}
                        required={true}
                    />
                    <DocumentUploadField
                        label={t('idDocument')}
                        folder="id-docs"
                        value={form.idDocUrl}
                        onChange={v => set('idDocUrl', v)}
                        accept="image/*,.pdf"
                        multiple={true}
                        required={true}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button type="submit" className="btn-primary px-8" disabled={saving}>
                    {saving ? t('saving') : t('register')}
                </button>
            </div>
        </form>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function ViceDirectorRegistrationPage() {
    const { t } = useLanguage()
    const [registered, setRegistered] = useState(null)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('viceDirectorRegistration')}</h1>
            </div>

            {registered ? (
                <CredentialsCard person={registered} onRegisterAnother={() => setRegistered(null)} />
            ) : (
                <ViceDirectorRegistrationForm onSuccess={setRegistered} />
            )}
        </div>
    )
}
