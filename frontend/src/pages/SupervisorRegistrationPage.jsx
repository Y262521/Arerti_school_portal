import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { supervisorService } from '../services/supervisorService'
import DocumentUploadField from '../components/DocumentUploadField'
import api from '../services/api'

const EMPTY = {
    firstName: '', fatherName: '', grandfatherName: '', gender: '', dateOfBirth: '',
    email: '', phone: '',
    photoUrl: '', qualificationCertUrl: '', idDocUrl: ''
}

// ── Assign Classes Modal ──────────────────────────────────────────────────────
function AssignClassesModal({ supervisor, onClose }) {
    const { t } = useLanguage()
    const [allClasses, setAllClasses] = useState([])
    const [assigned, setAssigned] = useState(new Set())
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState({})
    const [error, setError] = useState(null)

    useEffect(() => {
        setLoading(true)
        Promise.all([
            api.get('/classes').then(r => r.data),
            supervisorService.getAssignedClasses(supervisor.id)
        ]).then(([classes, assignedClasses]) => {
            setAllClasses(classes)
            setAssigned(new Set(assignedClasses.map(c => c.id)))
        }).catch(() => setError(t('failedToLoadClasses')))
        .finally(() => setLoading(false))
    }, [supervisor.id])

    const toggle = async (sectionId) => {
        const isAssigned = assigned.has(sectionId)
        setToggling(t => ({ ...t, [sectionId]: true }))
        try {
            if (isAssigned) {
                await supervisorService.removeClass(supervisor.id, sectionId)
                setAssigned(prev => { const s = new Set(prev); s.delete(sectionId); return s })
            } else {
                await supervisorService.assignClass(supervisor.id, sectionId)
                setAssigned(prev => new Set([...prev, sectionId]))
            }
        } catch {
            setError(t('saveFailed'))
        } finally {
            setToggling(t => ({ ...t, [sectionId]: false }))
        }
    }

    const sectionLabel = (cls) => {
        let label = `Grade ${cls.grade} - ${cls.section}`
        if (cls.stream) label += ` (${cls.stream.replace('_', ' ')})`
        if (cls.academicYear) label += ` · ${cls.academicYear}`
        return label
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col mx-4">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="font-semibold text-slate-900">{t('assignClasses')}</h2>
                        <p className="text-xs text-slate-500">{supervisor.fullName}</p>
                    </div>
                    <button onClick={onClose} className="btn-ghost text-sm">{t('close')}</button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
                    {loading ? (
                        <p className="text-slate-500 text-sm">{t('loading')}</p>
                    ) : allClasses.length === 0 ? (
                        <p className="text-slate-500 text-sm">{t('noClassesYet')}</p>
                    ) : (
                        allClasses.map(cls => (
                            <label key={cls.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 transition">
                                <input
                                    type="checkbox"
                                    checked={assigned.has(cls.id)}
                                    disabled={toggling[cls.id]}
                                    onChange={() => toggle(cls.id)}
                                    className="accent-brand w-4 h-4"
                                />
                                <span className="text-sm text-slate-700">{sectionLabel(cls)}</span>
                                {toggling[cls.id] && <span className="text-xs text-slate-400 ml-auto">{t('saving')}</span>}
                            </label>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Credentials display ───────────────────────────────────────────────────────
function CredentialsCard({ person, onRegisterAnother }) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)
    const [showAssign, setShowAssign] = useState(false)
    const text = `Supervisor: ${person.fullName}\nEmployee ID: ${person.employeeId}\nUsername: ${person.generatedUsername}\nPassword: ${person.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="max-w-lg mx-auto">
            <div className="card space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                    ✅ {t('supervisorRegisteredSuccess')}
                </div>

                {person.photoUrl && (
                    <div className="flex justify-center">
                        <img src={person.photoUrl} alt="Supervisor" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" />
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
                    <div className="flex gap-2">
                        <button className="btn-ghost" onClick={copy}>
                            {copied ? `✓ ${t('copied')}` : t('copyToClipboard')}
                        </button>
                        <button className="btn-ghost" onClick={() => setShowAssign(true)}>
                            {t('assignClasses')}
                        </button>
                    </div>
                    <button className="btn-primary" onClick={onRegisterAnother}>
                        + {t('registerAnother')}
                    </button>
                </div>
            </div>

            {showAssign && (
                <AssignClassesModal supervisor={person} onClose={() => setShowAssign(false)} />
            )}
        </div>
    )
}

// ── Registration form ──────────────────────────────────────────────────────────
function SupervisorRegistrationForm({ onSuccess }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(EMPTY)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState(null)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.photoUrl) { setError(t('photoRequired') || 'Photo is required'); return }
        if (!form.qualificationCertUrl) { setError(t('qualificationCert') + ' is required'); return }
        if (!form.idDocUrl) { setError(t('idDocument') + ' is required'); return }
        setError(null)
        setSaving(true)
        try {
            const result = await supervisorService.create(form)
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
                        folder="supervisor-photos"
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
export default function SupervisorRegistrationPage() {
    const { t } = useLanguage()
    const [registered, setRegistered] = useState(null)

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('supervisorRegistration')}</h1>
            </div>

            {registered ? (
                <CredentialsCard person={registered} onRegisterAnother={() => setRegistered(null)} />
            ) : (
                <SupervisorRegistrationForm onSuccess={setRegistered} />
            )}
        </div>
    )
}
