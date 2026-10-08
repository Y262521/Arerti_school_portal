import { useEffect, useRef, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { useLanguage } from '../context/LanguageContext'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

export const ETHIOPIAN_REGIONS = [
    'Addis Ababa','Afar','Amhara','Benishangul-Gumuz','Dire Dawa',
    'Gambela','Harari','Oromia','Sidama','Somali',
    'South Ethiopia','Southwest Ethiopia','Tigray','Other'
]

export const PAYMENT_METHODS = [
    { value: 'FINANCE_OFFICE', labelKey: 'financeOffice' },
    { value: 'TELEBIRR',       labelKey: 'telebirr' },
    { value: 'CBE',            labelKey: 'cbe' },
    { value: 'BANK_TRANSFER',  labelKey: 'bankTransfer' },
    { value: 'OTHER',          labelKey: 'other' },
]

export const RELATIONSHIP_OPTS = ['Father', 'Mother', 'Guardian', 'Sibling', 'Other']

// ── File upload field ──────────────────────────────────────────────────────────
export function FileUploadField({ label, required, folder, value, onChange, accept = 'image/*,.pdf' }) {
    const { t } = useLanguage()
    const [uploading, setUploading] = useState(false)
    const ref = useRef()
    const handleChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try { const url = await registrationService.uploadFile(file, folder); onChange(url); toast.success(`${label} ${t('uploaded')}`) }
        catch { toast.error(`${t('failedToUpload')} ${label}`) }
        finally { setUploading(false) }
    }
    return (
        <div>
            <label className="field-label">{label} {required && <span className="text-red-500">*</span>}</label>
            <div className="flex gap-2 items-center">
                <button type="button" className="btn-ghost text-xs py-1.5" onClick={() => ref.current?.click()}>
                    {uploading ? t('uploading') : value ? t('changeFile') : t('uploadFile')}
                </button>
                {value && <a href={value} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">{t('view')}</a>}
                <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />
            </div>
            {required && !value && <p className="text-xs text-slate-400 mt-0.5">{t('required')}</p>}
        </div>
    )
}

// ── Step bar ───────────────────────────────────────────────────────────────────
export function StepBar({ step, steps }) {
    return (
        <div className="flex items-center gap-1 mb-6">
            {steps.map((label, i) => (
                <div key={i} className="flex items-center gap-1 flex-1">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                        ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {i < step ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs hidden sm:block truncate ${i === step ? 'text-brand font-semibold' : 'text-slate-400'}`}>{label}</span>
                    {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-500' : 'bg-slate-200'}`} />}
                </div>
            ))}
        </div>
    )
}

// ── Ethiopian phone input ──────────────────────────────────────────────────────
export function EthiopianPhoneInput({ value, onChange, required }) {
    const { t } = useLanguage()
    const digits = (value || '').replace(/^\+251/, '')
    const handleChange = (e) => {
        let raw = e.target.value.replace(/\D/g, '')
        if (raw.length > 9) raw = raw.slice(0, 9)
        onChange(raw ? `+251${raw}` : '')
    }
    const isValid = /^(9|7)\d{8}$/.test(digits)
    const showError = digits.length > 0 && !isValid
    return (
        <div>
            <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">+251</span>
                <input className={`field rounded-l-none flex-1 ${showError ? 'border-red-400' : ''}`}
                    type="tel" value={digits} onChange={handleChange}
                    placeholder="9XXXXXXXX" maxLength={9} required={required} />
            </div>
            {showError && <p className="text-xs text-red-500 mt-0.5">{t('phoneInvalid')}</p>}
            {required && !digits && <p className="text-xs text-red-500 mt-0.5">{t('required')}</p>}
        </div>
    )
}

// ── Full 4-step wizard (New / Transfer) ───────────────────────────────────────
export function FullEnrollmentWizard({ windowId, grade, enrollmentType, academicYear, onSuccess, onClose }) {
    const { t } = useLanguage()
    const WIZARD_STEPS = [t('step1Personal'), t('step2Academic'), t('step3Guardian'), t('step4Payment')]
    const needsStream = grade >= 11
    const [step, setStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})
    const [form, setForm] = useState({
        firstName: '', fatherName: '', grandfatherName: '',
        gender: '', dateOfBirth: '', region: '', city: '', kebele: '', houseNo: '',
        photoUrl: '', idDocUrl: '', email: '',
        grade8Score: '', previousSchool: '',
        grade8CertificateUrl: '', releaseLetterUrl: '', stream: '',
        guardianName: '', guardianRelationship: '', guardianPhone: '',
        paymentMethod: '', transactionRef: '', paymentReceiptUrl: '',
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const validateStep = () => {
        const e = {}
        if (step === 0) {
            if (!form.firstName) e.firstName = t('required')
            if (!form.fatherName) e.fatherName = t('required')
            if (!form.grandfatherName) e.grandfatherName = t('required')
            if (!form.gender) e.gender = t('required')
            if (!form.dateOfBirth) e.dateOfBirth = t('required')
            if (!form.region) e.region = t('required')
            if (!form.city) e.city = t('required')
            if (!form.kebele) e.kebele = t('required')
            if (!form.email) e.email = t('required')
            if (!form.photoUrl) e.photoUrl = t('studentPhotoRequired')
            if (!form.idDocUrl) e.idDocUrl = t('idDocRequired')
        }
        if (step === 1) {
            if (!form.previousSchool) e.previousSchool = t('required')
            if (form.grade8Score === '') e.grade8Score = t('required')
            else if (Number(form.grade8Score) < 0 || Number(form.grade8Score) > 100)
                e.grade8Score = t('scoreMustBe0to100')
            if (!form.grade8CertificateUrl) e.grade8CertificateUrl = t('grade8CertRequired')
            if (enrollmentType === 'TRANSFER' && !form.releaseLetterUrl)
                e.releaseLetterUrl = t('releaseLetterRequired')
            if (needsStream && !form.stream) e.stream = t('streamRequired1112')
        }
        if (step === 2) {
            if (!form.guardianName) e.guardianName = t('required')
            if (!form.guardianRelationship) e.guardianRelationship = t('required')
            const digits = (form.guardianPhone || '').replace(/^\+251/, '')
            if (!digits) e.guardianPhone = t('required')
            else if (!/^(9|7)\d{8}$/.test(digits)) e.guardianPhone = t('phoneInvalid')
        }
        if (step === 3) {
            if (!form.paymentMethod) e.paymentMethod = t('required')
            if (!form.transactionRef) e.transactionRef = t('required')
            if (!form.paymentReceiptUrl) e.paymentReceiptUrl = t('paymentReceiptRequired')
        }
        return e
    }

    const handleNext = () => { const e = validateStep(); setErrors(e); if (Object.keys(e).length === 0) setStep(s => s + 1) }

    const handleSubmit = async () => {
        const e = validateStep(); setErrors(e)
        if (Object.keys(e).length > 0) return
        if (!windowId) { toast.error(t('noActiveWindow')); return }
        setSaving(true)
        try {
            const result = await registrationService.enrollFull(windowId, {
                ...form,
                grade: Number(grade), targetGrade: grade, academicYear, enrollmentType,
                stream: (needsStream && form.stream) ? form.stream : null,
                grade8Score: form.grade8Score !== '' ? Number(form.grade8Score) : null,
                dateOfBirth: form.dateOfBirth || null,
                parentName: form.guardianName,
                parentRelationship: form.guardianRelationship,
                parentPhone: form.guardianPhone,
                bankTransactionRef: form.transactionRef,
            })
            onSuccess(result)
        } catch (err) {
            toast.error(err.response?.data?.message || t('registrationFailed'))
        } finally { setSaving(false) }
    }

    const F = ({ field, children }) => (
        <div>{children}
            {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
        </div>
    )

    return (
        <div className="space-y-6">
            <StepBar step={step} steps={WIZARD_STEPS} />
            <div className="inline-flex items-center gap-2">
                <span className="bg-brand/10 text-brand text-xs font-semibold px-2 py-0.5 rounded-full">{t('grade')} {grade}</span>
                <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {enrollmentType === 'NEW' ? `🆕 ${t('gradeNewEntrant')}` : `🔀 ${t('gradeTransfer')}`}
                </span>
            </div>

            {step === 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <F field="firstName"><label className="field-label">{t('firstName')} *</label>
                            <input className={`field ${errors.firstName ? 'border-red-400' : ''}`} value={form.firstName} onChange={e => set('firstName', e.target.value)} /></F>
                        <F field="fatherName"><label className="field-label">{t('fatherName')} *</label>
                            <input className={`field ${errors.fatherName ? 'border-red-400' : ''}`} value={form.fatherName} onChange={e => set('fatherName', e.target.value)} /></F>
                        <F field="grandfatherName"><label className="field-label">{t('grandfatherName')} *</label>
                            <input className={`field ${errors.grandfatherName ? 'border-red-400' : ''}`} value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)} /></F>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <F field="gender"><label className="field-label">{t('gender')} *</label>
                            <select className={`field ${errors.gender ? 'border-red-400' : ''}`} value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">-- {t('selectLabel')} --</option>
                                <option value="Male">{t('male')}</option>
                                <option value="Female">{t('female')}</option>
                            </select></F>
                        <F field="dateOfBirth"><label className="field-label">{t('dateOfBirth')} *</label>
                            <input className={`field ${errors.dateOfBirth ? 'border-red-400' : ''}`} type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></F>
                        <F field="email"><label className="field-label">{t('email')} *</label>
                            <input className={`field ${errors.email ? 'border-red-400' : ''}`} type="email" value={form.email} onChange={e => set('email', e.target.value)} /></F>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        <F field="region"><label className="field-label">{t('region')} *</label>
                            <select className={`field ${errors.region ? 'border-red-400' : ''}`} value={form.region} onChange={e => set('region', e.target.value)}>
                                <option value="">--</option>
                                {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                            </select></F>
                        <F field="city"><label className="field-label">{t('city')} *</label>
                            <input className={`field ${errors.city ? 'border-red-400' : ''}`} value={form.city} onChange={e => set('city', e.target.value)} /></F>
                        <F field="kebele"><label className="field-label">{t('kebele')} *</label>
                            <input className={`field ${errors.kebele ? 'border-red-400' : ''}`} value={form.kebele} onChange={e => set('kebele', e.target.value)} /></F>
                        <div><label className="field-label">{t('houseNo')}</label>
                            <input className="field" value={form.houseNo} onChange={e => set('houseNo', e.target.value)} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <F field="photoUrl"><FileUploadField label={`${t('studentPhoto')} *`} required folder="student-photos" value={form.photoUrl} onChange={v => set('photoUrl', v)} accept="image/jpeg,image/png" /></F>
                        <F field="idDocUrl"><FileUploadField label={`${t('idDocument')} *`} required folder="id-docs" value={form.idDocUrl} onChange={v => set('idDocUrl', v)} /></F>
                    </div>
                </div>
            )}

            {step === 1 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <F field="previousSchool"><label className="field-label">{t('previousSchool')} *</label>
                            <input className={`field ${errors.previousSchool ? 'border-red-400' : ''}`} value={form.previousSchool} onChange={e => set('previousSchool', e.target.value)} /></F>
                        <F field="grade8Score"><label className="field-label">{t('grade8Score')} *</label>
                            <input className={`field ${errors.grade8Score ? 'border-red-400' : ''}`} type="number" min={0} max={100} step={0.1} value={form.grade8Score} onChange={e => set('grade8Score', e.target.value)} /></F>
                    </div>
                    {needsStream && (
                        <F field="stream"><label className="field-label">{t('stream')} *</label>
                            <select className={`field ${errors.stream ? 'border-red-400' : ''}`} value={form.stream} onChange={e => set('stream', e.target.value)}>
                                <option value="">-- {t('selectLabel')} --</option>
                                <option value="NATURAL_SCIENCE">{t('naturalScience')}</option>
                                <option value="SOCIAL_SCIENCE">{t('socialScience')}</option>
                            </select></F>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <F field="grade8CertificateUrl"><FileUploadField label={`${t('grade8Certificate')} *`} required folder="certificates" value={form.grade8CertificateUrl} onChange={v => set('grade8CertificateUrl', v)} /></F>
                        {enrollmentType === 'TRANSFER' && (
                            <F field="releaseLetterUrl"><FileUploadField label={`${t('releaseLetter')} *`} required folder="release-letters" value={form.releaseLetterUrl} onChange={v => set('releaseLetterUrl', v)} /></F>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <F field="guardianName"><label className="field-label">{t('parentName')} *</label>
                                <input className={`field ${errors.guardianName ? 'border-red-400' : ''}`} value={form.guardianName} onChange={e => set('guardianName', e.target.value)} /></F>
                        </div>
                        <F field="guardianRelationship"><label className="field-label">{t('relationship')} *</label>
                            <select className={`field ${errors.guardianRelationship ? 'border-red-400' : ''}`} value={form.guardianRelationship} onChange={e => set('guardianRelationship', e.target.value)}>
                                <option value="">-- {t('selectLabel')} --</option>
                                {RELATIONSHIP_OPTS.map(r => <option key={r}>{r}</option>)}
                            </select></F>
                        <F field="guardianPhone">
                            <label className="field-label">{t('guardianPhone')} * (+251)</label>
                            <EthiopianPhoneInput required value={form.guardianPhone} onChange={v => set('guardianPhone', v)} />
                        </F>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <F field="paymentMethod"><label className="field-label">{t('paymentMethod')} *</label>
                            <select className={`field ${errors.paymentMethod ? 'border-red-400' : ''}`} value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                                <option value="">-- {t('selectLabel')} --</option>
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{t(m.labelKey)}</option>)}
                            </select></F>
                        <F field="transactionRef"><label className="field-label">{t('transactionRef')} *</label>
                            <input className={`field ${errors.transactionRef ? 'border-red-400' : ''}`} value={form.transactionRef} placeholder="e.g. REC-2026-001234" onChange={e => set('transactionRef', e.target.value)} /></F>
                    </div>
                    <F field="paymentReceiptUrl">
                        <FileUploadField label={`${t('paymentReceipt')} *`} required folder="payment-receipts" value={form.paymentReceiptUrl} onChange={v => set('paymentReceiptUrl', v)} accept="image/jpeg,image/png,application/pdf" />
                    </F>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                        <p className="font-semibold text-slate-800 mb-2">{t('reviewSummary')}</p>
                        <p><span className="text-slate-500">{t('nameLabel')}:</span> {form.firstName} {form.fatherName} {form.grandfatherName}</p>
                        <p><span className="text-slate-500">{t('grade')}:</span> {t('grade')} {grade}</p>
                        <p><span className="text-slate-500">{t('enrollmentTypeLabel')}:</span> <strong>{enrollmentType === 'NEW' ? t('gradeNewEntrant') : t('gradeTransfer')}</strong></p>
                        {form.stream && <p><span className="text-slate-500">{t('stream')}:</span> {form.stream === 'NATURAL_SCIENCE' ? t('naturalScience') : t('socialScience')}</p>}
                        <p><span className="text-slate-500">{t('parentName')}:</span> {form.guardianName} ({form.guardianPhone})</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between pt-4 border-t border-slate-100">
                <button type="button" className="btn-ghost"
                    onClick={step === 0 ? onClose : () => { setStep(s => s - 1); setErrors({}) }}>
                    {step === 0 ? t('cancel') : t('back')}
                </button>
                {step < 3
                    ? <button type="button" className="btn-primary" onClick={handleNext}>{t('next')}</button>
                    : <button type="button" className="btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? t('saving') : t('completeRegistration')}
                      </button>
                }
            </div>
        </div>
    )
}

// ── Existing Student Panel (Re-enroll / Repeat) ────────────────────────────────
export function ExistingStudentPanel({ grade, windowId, enrollmentType, prevYear, newYear, onClose }) {
    const { t } = useLanguage()
    const needsStream = grade >= 11
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState({})
    const [forms, setForms] = useState({})

    useEffect(() => {
        setLoading(true)
        registrationService.getPassStatus(grade - 1, prevYear, newYear)
            .then(setStudents)
            .catch(() => toast.error(t('failedToLoadStudents')))
            .finally(() => setLoading(false))
    }, [grade, prevYear, newYear])

    const setField = (sid, key, val) => setForms(f => ({ ...f, [sid]: { ...(f[sid] || {}), [key]: val } }))
    const getField = (sid, key) => forms[sid]?.[key] || ''

    const handleEnroll = async (student) => {
        const f = forms[student.studentId] || {}
        if (!f.paymentMethod) { toast.error(t('selectPaymentMethod')); return }
        if (!f.bankTransactionRef) { toast.error(t('enterTransactionRef')); return }
        if (needsStream && !f.stream) { toast.error(t('streamRequired1112')); return }
        setSaving(s => ({ ...s, [student.studentId]: true }))
        try {
            await registrationService.enrollExisting(windowId, {
                studentId: student.studentId,
                newSectionId: null,
                enrollmentType: enrollmentType === 'PROMOTED' ? (student.passed ? 'PROMOTED' : 'REPEAT') : 'REPEAT',
                stream: f.stream || null,
                paymentMethod: f.paymentMethod,
                bankTransactionRef: f.bankTransactionRef,
                paymentReceiptUrl: f.paymentReceiptUrl || null,
            }, prevYear)
            toast.success(`${student.studentName} ${t('studentEnrolled')}`)
            setStudents(prev => prev.map(s => s.studentId === student.studentId ? { ...s, alreadyEnrolled: true } : s))
        } catch (err) {
            toast.error(err.response?.data?.message || t('enrollmentFailed'))
        } finally { setSaving(s => ({ ...s, [student.studentId]: false })) }
    }

    const filtered = students.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.studentUid.toLowerCase().includes(search.toLowerCase())
    )
    const enrolled = filtered.filter(s => s.alreadyEnrolled)
    const passed   = filtered.filter(s => s.passed && !s.alreadyEnrolled)
    const failed   = filtered.filter(s => !s.passed && !s.alreadyEnrolled)

    if (loading) return <div className="p-8 text-center text-slate-500">{t('loading')}</div>

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button onClick={onClose} className="text-xs text-slate-400 hover:text-brand transition">← {t('back')}</button>
                <span className="text-sm font-semibold text-brand">{t('grade')} {grade} – {enrollmentType === 'PROMOTED' ? t('gradeReEnroll') : t('repeatStudent')}</span>
            </div>
            <input className="field max-w-sm" placeholder={`${t('search')}…`} value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">{enrolled.length} {t('enrolledLabel')}</span>
                <span className="text-blue-600 font-medium">{passed.length} {t('passedLabel')}</span>
                <span className="text-red-500 font-medium">{failed.length} {t('failedLabel')}</span>
            </div>
            {failed.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    {failed.length} {t('studentsDidNotPass')}
                </div>
            )}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {filtered.map(s => (
                    <div key={s.studentId} className={`card ${s.alreadyEnrolled ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-start gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900">{s.studentName}</span>
                                    <span className="font-mono text-xs text-slate-400">{s.studentUid}</span>
                                    {s.alreadyEnrolled
                                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{t('enrolledLabel')}</span>
                                        : s.passed
                                            ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{t('passedLabel')} — {t('grade')} {grade}</span>
                                            : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{t('repeaterLabel')}</span>
                                    }
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    {t('average')}: <strong className={s.annualAverage >= 50 ? 'text-green-600' : 'text-red-600'}>
                                        {(s.annualAverage || s.average || 0).toFixed(1)}</strong>
                                </div>
                            </div>
                            {!s.alreadyEnrolled && (
                                <div className="flex gap-2 flex-wrap items-end">
                                    {needsStream && (
                                        <div><label className="field-label text-xs">{t('stream')}</label>
                                            <select className="field text-xs py-1 w-32" value={getField(s.studentId, 'stream')} onChange={e => setField(s.studentId, 'stream', e.target.value)}>
                                                <option value="">--</option>
                                                <option value="NATURAL_SCIENCE">{t('naturalScience')}</option>
                                                <option value="SOCIAL_SCIENCE">{t('socialScience')}</option>
                                            </select></div>
                                    )}
                                    <div><label className="field-label text-xs">{t('paymentMethod')}</label>
                                        <select className="field text-xs py-1 w-36" value={getField(s.studentId, 'paymentMethod')} onChange={e => setField(s.studentId, 'paymentMethod', e.target.value)}>
                                            <option value="">--</option>
                                            <option value="FINANCE_OFFICE">{t('financeOffice')}</option>
                                            <option value="TELEBIRR">Telebirr</option>
                                            <option value="CBE">CBE</option>
                                            <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                                        </select></div>
                                    <div><label className="field-label text-xs">{t('transactionRef')}</label>
                                        <input className="field text-xs py-1 w-32" placeholder="REC-…" value={getField(s.studentId, 'bankTransactionRef')} onChange={e => setField(s.studentId, 'bankTransactionRef', e.target.value)} /></div>
                                    <button
                                        className="btn-primary text-xs py-1.5 px-3"
                                        disabled={saving[s.studentId]}
                                        onClick={() => handleEnroll(s)}>
                                        {saving[s.studentId] ? '…' : t('register')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Main enrollment wizard (grade → type → wizard/panel) ──────────────────────
export default function StudentEnrollmentWizard({ windowData, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [phase, setPhase] = useState(0)
    const [grade, setGrade] = useState(null)
    const [enrollmentType, setEnrollmentType] = useState(null)
    const [credResult, setCredResult] = useState(null)

    const allowedGrades = windowData?.allowedGrades
        ? windowData.allowedGrades.split(',').map(Number).filter(Boolean)
        : [9, 10, 11, 12]

    const cy = Number(CURRENT_YEAR.split('/')[0])
    const prevYear = `${cy - 1}/${cy}`

    const getPathways = (g) => {
        if (g === 9) return [
            { type: 'NEW',      icon: '🆕', label: t('gradeNewEntrant'),  desc: t('newEntrantDesc') },
            { type: 'TRANSFER', icon: '🔀', label: t('gradeTransfer'),    desc: t('transferDesc') },
            { type: 'REPEAT',   icon: '🔄', label: t('repeatStudent'),    desc: t('repeatDesc') },
        ]
        return [
            { type: 'PROMOTED', icon: '📈', label: t('gradeReEnroll'),    desc: t('reEnrollDesc') },
            { type: 'TRANSFER', icon: '🔀', label: t('gradeTransfer'),    desc: t('transferDesc') },
            { type: 'REPEAT',   icon: '🔄', label: t('repeatStudent'),    desc: t('repeatDesc') },
        ]
    }

    if (credResult) return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">✅ {t('studentRegisteredSuccess')}</div>
            {credResult.photoUrl && <img src={credResult.photoUrl} alt="Student" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 mx-auto" />}
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">{t('nameLabel')}:</span> <strong>{credResult.fullName}</strong></p>
                {credResult.studentUid && <p><span className="text-slate-500">UID:</span> <strong>{credResult.studentUid}</strong></p>}
                {credResult.generatedUsername && <p><span className="text-slate-500">{t('username')}:</span> <strong>{credResult.generatedUsername}</strong></p>}
                {credResult.generatedPassword && <p><span className="text-slate-500">{t('password')}:</span> <strong>{credResult.generatedPassword}</strong></p>}
            </div>
            <p className="text-xs text-slate-500">{t('passwordShownOnce')}</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={() => { setCredResult(null); setPhase(0); setGrade(null); setEnrollmentType(null) }}>{t('registerAnother')}</button>
                <button className="btn-primary" onClick={() => { onSuccess(); onClose() }}>{t('done')}</button>
            </div>
        </div>
    )

    if (phase === 0) return (
        <div className="space-y-4">
            <p className="text-sm text-slate-600">{t('selectGradeToRegister')}</p>
            <div className="grid grid-cols-4 gap-3">
                {allowedGrades.map(g => (
                    <button key={g} type="button"
                        className="border-2 border-slate-200 rounded-xl p-4 text-center hover:border-brand hover:bg-brand/5 transition group"
                        onClick={() => { setGrade(g); setPhase(1) }}>
                        <div className="text-2xl font-bold text-slate-800 group-hover:text-brand">{g}</div>
                        <div className="text-xs text-slate-500 mt-1">{t('grade')} {g}</div>
                    </button>
                ))}
            </div>
            <div className="flex justify-end"><button className="btn-ghost" onClick={onClose}>{t('cancel')}</button></div>
        </div>
    )

    if (phase === 1) return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <button onClick={() => setPhase(0)} className="text-xs text-slate-400 hover:text-brand transition">← {t('back')}</button>
                <span className="text-sm font-semibold text-brand">{t('grade')} {grade}</span>
            </div>
            <p className="text-sm text-slate-600">{t('selectEnrollmentType')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {getPathways(grade).map(({ type, icon, label, desc }) => (
                    <button key={type} type="button"
                        className="border-2 border-slate-200 rounded-xl p-4 text-left hover:border-brand hover:bg-brand/5 transition group"
                        onClick={() => { setEnrollmentType(type); setPhase(2) }}>
                        <div className="text-2xl mb-2">{icon}</div>
                        <div className="font-semibold text-slate-800 group-hover:text-brand">{label}</div>
                        <div className="text-xs text-slate-500 mt-1">{desc}</div>
                    </button>
                ))}
            </div>
            <div className="flex justify-end"><button className="btn-ghost" onClick={onClose}>{t('cancel')}</button></div>
        </div>
    )

    if (phase === 2) {
        const isNewOrTransfer = enrollmentType === 'NEW' || enrollmentType === 'TRANSFER'
        if (isNewOrTransfer) return (
            <FullEnrollmentWizard
                windowId={windowData?.id}
                grade={grade}
                enrollmentType={enrollmentType}
                academicYear={windowData?.academicYear || CURRENT_YEAR}
                onSuccess={setCredResult}
                onClose={() => setPhase(1)}
            />
        )
        return (
            <ExistingStudentPanel
                grade={grade}
                windowId={windowData?.id}
                enrollmentType={enrollmentType}
                prevYear={prevYear}
                newYear={windowData?.academicYear || CURRENT_YEAR}
                onClose={() => setPhase(1)}
            />
        )
    }

    return null
}
