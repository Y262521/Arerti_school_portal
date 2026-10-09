import { useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { teacherService } from '../services/teacherService'
import { registrationService } from '../services/registrationService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const ETHIOPIAN_REGIONS = [
    'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
    'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
    'South Ethiopia', 'Southwest Ethiopia', 'Tigray', 'Other'
]
const QUALIFICATIONS = ['Diploma', 'BSc', 'BA', 'MSc', 'MA', 'PhD', 'Dr', 'Professor', 'Other']

const EMPTY = {
    firstName: '', fatherName: '', grandfatherName: '', gender: '', dateOfBirth: '',
    email: '', phone: '', region: '', city: '', kebele: '', houseNo: '',
    qualification: '', specialization: '', hireDate: '',
    photoUrl: '', qualificationCertUrl: '', idDocUrl: ''
}

import DocumentUploadField from '../components/DocumentUploadField'

// ── File upload field ──────────────────────────────────────────────────────────
function FileUploadField(props) {
    return <DocumentUploadField {...props} />
}

// ── Credentials display after successful registration ─────────────────────────
function CredentialsCard({ teacher, onRegisterAnother }) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)
    const text = `Teacher: ${teacher.fullName}\nEmployee ID: ${teacher.employeeId}\nUsername: ${teacher.generatedUsername}\nPassword: ${teacher.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="max-w-lg mx-auto">
            <div className="card space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                    ✅ {t('teacherRegisteredSuccess')}
                </div>

                {teacher.photoUrl && (
                    <div className="flex justify-center">
                        <img src={teacher.photoUrl} alt="Teacher" className="w-24 h-24 rounded-full object-cover border-2 border-slate-200" />
                    </div>
                )}

                <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-2">
                    <p><span className="text-slate-500">{t('nameLabel')}:</span> <strong>{teacher.fullName}</strong></p>
                    <p><span className="text-slate-500">Employee ID:</span> <strong>{teacher.employeeId}</strong></p>
                    <p><span className="text-slate-500">{t('username')}:</span> <strong>{teacher.generatedUsername}</strong></p>
                    <p><span className="text-slate-500">{t('password')}:</span> <strong>{teacher.generatedPassword}</strong></p>
                    <p><span className="text-slate-500">{t('email')}:</span> <strong>{teacher.email}</strong></p>
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
function TeacherRegistrationForm({ onSuccess }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(EMPTY)
    const [saving, setSaving] = useState(false)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const newTeacher = await teacherService.create({ ...form, hireDate: form.hireDate || null })
            toast.success(t('teacherRegistered'))
            onSuccess(newTeacher)
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally { setSaving(false) }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('region')}</label>
                        <select className="field" value={form.region} onChange={e => set('region', e.target.value)}>
                            <option value="">-- {t('selectLabel')} --</option>
                            {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('city')}</label>
                        <input className="field" value={form.city} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('kebele')}</label>
                        <input className="field" value={form.kebele} onChange={e => set('kebele', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('houseNo')}</label>
                        <input className="field" value={form.houseNo} onChange={e => set('houseNo', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('phone')}</label>
                        <input className="field" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+251..." />
                    </div>
                </div>
            </div>

            {/* Professional Info */}
            <div className="card space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2">{t('professionalInfo')}</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('qualification')} *</label>
                        <select className="field" value={form.qualification} onChange={e => set('qualification', e.target.value)} required>
                            <option value="">-- {t('selectLabel')} --</option>
                            {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('specialization')}</label>
                        <input className="field" value={form.specialization} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Mathematics" />
                    </div>
                    <div>
                        <label className="field-label">{t('hireDate')}</label>
                        <input className="field" type="date" value={form.hireDate} onChange={e => set('hireDate', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Documents */}
            <div className="card space-y-4">
                <h3 className="font-semibold text-slate-700 text-sm border-b border-slate-100 pb-2">{t('documentsSection')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FileUploadField
                        label={t('teacherPhoto')}
                        folder="teacher-photos"
                        value={form.photoUrl}
                        onChange={v => set('photoUrl', v)}
                        accept="image/jpeg,image/png"
                        multiple={false}
                    />
                    <FileUploadField
                        label={t('qualificationCert')}
                        folder="qualifications"
                        value={form.qualificationCertUrl}
                        onChange={v => set('qualificationCertUrl', v)}
                        accept="image/*,.pdf"
                        multiple={true}
                    />
                    <FileUploadField
                        label={t('idDocument')}
                        folder="id-docs"
                        value={form.idDocUrl}
                        onChange={v => set('idDocUrl', v)}
                        accept="image/*,.pdf"
                        multiple={true}
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end">
                <button type="submit" className="btn-primary px-8" disabled={saving}>
                    {saving ? t('saving') : t('registerTeacher')}
                </button>
            </div>
        </form>
    )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminTeacherRegistrationPage() {
    const { t } = useLanguage()
    const [registered, setRegistered] = useState(null)

    const handleSuccess = (teacher) => {
        setRegistered(teacher)
    }

    const handleRegisterAnother = () => {
        setRegistered(null)
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">{t('teacherRegistration')}</h1>
            </div>

            {registered ? (
                <CredentialsCard teacher={registered} onRegisterAnother={handleRegisterAnother} />
            ) : (
                <TeacherRegistrationForm onSuccess={handleSuccess} />
            )}
        </div>
    )
}
