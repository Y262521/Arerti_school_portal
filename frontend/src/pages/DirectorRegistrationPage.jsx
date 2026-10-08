import { useEffect, useRef, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { teacherService } from '../services/teacherService'
import { useLanguage } from '../context/LanguageContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

const ETHIOPIAN_REGIONS = [
    'Addis Ababa','Afar','Amhara','Benishangul-Gumuz','Dire Dawa',
    'Gambela','Harari','Oromia','Sidama','Somali',
    'South Ethiopia','Southwest Ethiopia','Tigray','Other'
]
const RELATIONSHIP_OPTS = ['Father','Mother','Guardian','Sibling','Other']
const PAYMENT_METHODS = ['Finance Office (Cash)','Commercial Bank of Ethiopia','Abyssinia Bank','Awash Bank','Other']

// ── File upload helper ─────────────────────────────────────────────────────────
function FileUploadField({ label, required, folder, value, onChange, accept = 'image/*,.pdf' }) {
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

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepBar({ step, steps }) {
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

// ── Full Student Enrollment Wizard ─────────────────────────────────────────────
function StudentEnrollmentWizard({ windowData, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [step, setStep] = useState(0)
    const [enrollmentType, setEnrollmentType] = useState('')  // NEW | PROMOTED | TRANSFER | REPEAT
    const [submitting, setSubmitting] = useState(false)
    const [credResult, setCredResult] = useState(null)

    const STEPS = [t('enrollmentTypeLabel'), t('step1Personal'), t('step2Academic'), t('step3Guardian'), t('step4Payment')]

    const [form, setForm] = useState({
        // Personal
        firstName: '', fatherName: '', grandfatherName: '',
        gender: '', dateOfBirth: '', email: '',
        region: '', city: '', kebele: '', houseNo: '',
        // Academic
        grade: 9, stream: '', previousSchool: '',
        grade8Score: '', grade8CertUrl: '', studentPhotoUrl: '', idDocUrl: '',
        releaseLetterUrl: '',
        // Guardian
        guardianName: '', guardianRelationship: '', guardianPhone: '',
        // Payment
        paymentMethod: '', transactionRef: '', paymentReceiptUrl: '',
        // Meta
        windowId: windowData?.id || null,
        enrollmentType: '',
    })

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleEnrollmentTypeSelect = (type) => {
        setEnrollmentType(type)
        set('enrollmentType', type)
        setStep(1)
    }

    const validateStep = () => {
        if (step === 1) {
            if (!form.firstName.trim()) { toast.error(`${t('firstName')} ${t('required')}`); return false }
            if (!form.fatherName.trim()) { toast.error(`${t('fatherName')} ${t('required')}`); return false }
            if (!form.grandfatherName.trim()) { toast.error(`${t('grandfatherName')} ${t('required')}`); return false }
            if (!form.gender) { toast.error(`${t('gender')} ${t('required')}`); return false }
            if (!form.email.trim()) { toast.error(`${t('email')} ${t('required')}`); return false }
        }
        if (step === 3) {
            if (!form.guardianName.trim()) { toast.error(`${t('parentName')} ${t('required')}`); return false }
            if (!form.guardianPhone.trim()) { toast.error(`${t('guardianPhone')} ${t('required')}`); return false }
        }
        if (step === 4) {
            if (!form.paymentMethod) { toast.error(`${t('paymentMethod')} ${t('required')}`); return false }
            if (!form.transactionRef.trim()) { toast.error(`${t('transactionRef')} ${t('required')}`); return false }
        }
        return true
    }

    const handleNext = () => { if (validateStep()) setStep(s => s + 1) }
    const handleBack = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!validateStep()) return
        setSubmitting(true)
        try {
            const payload = {
                ...form,
                grade: Number(form.grade),
                stream: (Number(form.grade) >= 11 && form.stream) ? form.stream : null,
                grade8Score: form.grade8Score ? Number(form.grade8Score) : null,
            }
            const result = await registrationService.enrollFull(form.windowId, payload)
            setCredResult(result)
            toast.success(t('studentRegisteredSuccess'))
        } catch (err) {
            toast.error(err.response?.data?.message || t('registrationFailed'))
        } finally { setSubmitting(false) }
    }

    // ── Step 0: Enrollment Type ──────────────────────────────────────────────
    if (credResult) {
        return (
            <div className="space-y-4">
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">✅ {t('studentRegisteredSuccess')}</div>
                <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                    <p><span className="text-slate-500">{t('student')}:</span> <strong>{credResult.fullName || form.firstName + ' ' + form.fatherName}</strong></p>
                    {credResult.studentUid && <p><span className="text-slate-500">UID:</span> <strong>{credResult.studentUid}</strong></p>}
                    {credResult.generatedUsername && <p><span className="text-slate-500">{t('username')}:</span> <strong>{credResult.generatedUsername}</strong></p>}
                    {credResult.generatedPassword && <p><span className="text-slate-500">{t('password')}:</span> <strong>{credResult.generatedPassword}</strong></p>}
                </div>
                <p className="text-xs text-slate-500">{t('passwordShownOnce')}</p>
                <div className="flex justify-end gap-2">
                    <button className="btn-ghost" onClick={() => { setCredResult(null); setStep(0); setEnrollmentType(''); setForm(f => ({ ...f, firstName:'',fatherName:'',grandfatherName:'',gender:'',dateOfBirth:'',email:'',region:'',city:'',kebele:'',houseNo:'',grade:9,stream:'',previousSchool:'',grade8Score:'',grade8CertUrl:'',studentPhotoUrl:'',idDocUrl:'',releaseLetterUrl:'',guardianName:'',guardianRelationship:'',guardianPhone:'',paymentMethod:'',transactionRef:'',paymentReceiptUrl:'' })) }}>
                        {t('registerAnother')}
                    </button>
                    <button className="btn-primary" onClick={() => { onSuccess(); onClose() }}>{t('done')}</button>
                </div>
            </div>
        )
    }

    if (step === 0) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-slate-600">{t('selectEnrollmentType')}</p>
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { type: 'NEW',      icon: '🆕', label: t('gradeNewEntrant'),  desc: t('newEntrantDesc') },
                        { type: 'PROMOTED', icon: '📈', label: t('gradeReEnroll'),    desc: t('reEnrollDesc') },
                        { type: 'TRANSFER', icon: '🔀', label: t('gradeTransfer'),    desc: t('transferDesc') },
                        { type: 'REPEAT',   icon: '🔄', label: t('repeatStudent'),    desc: t('repeatDesc') },
                    ].map(({ type, icon, label, desc }) => (
                        <button key={type} type="button"
                            className="border-2 border-slate-200 rounded-xl p-4 text-left hover:border-brand hover:bg-brand/5 transition group"
                            onClick={() => handleEnrollmentTypeSelect(type)}>
                            <div className="text-2xl mb-2">{icon}</div>
                            <div className="font-semibold text-slate-800 group-hover:text-brand">{label}</div>
                            <div className="text-xs text-slate-500 mt-1">{desc}</div>
                        </button>
                    ))}
                </div>
                <div className="flex justify-end">
                    <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                </div>
            </div>
        )
    }

    // ── Step 1: Personal Info ────────────────────────────────────────────────
    if (step === 1) return (
        <div className="space-y-4">
            <StepBar step={step} steps={STEPS} />
            <div className="inline-block bg-brand/10 text-brand text-xs font-semibold px-2 py-0.5 rounded-full">
                {enrollmentType === 'NEW' ? `🆕 ${t('gradeNewEntrant')}` :
                 enrollmentType === 'PROMOTED' ? `📈 ${t('gradeReEnroll')}` :
                 enrollmentType === 'TRANSFER' ? `🔀 ${t('gradeTransfer')}` : `🔄 ${t('repeatStudent')}`}
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div><label className="field-label">{t('firstName')} *</label>
                    <input className="field" value={form.firstName} onChange={e => set('firstName', e.target.value)} required /></div>
                <div><label className="field-label">{t('fatherName')} *</label>
                    <input className="field" value={form.fatherName} onChange={e => set('fatherName', e.target.value)} required /></div>
                <div><label className="field-label">{t('grandfatherName')} *</label>
                    <input className="field" value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
                <div><label className="field-label">{t('gender')} *</label>
                    <select className="field" value={form.gender} onChange={e => set('gender', e.target.value)} required>
                        <option value="">-- {t('selectLabel')} --</option>
                        <option value="Male">{t('male')}</option><option value="Female">{t('female')}</option>
                    </select></div>
                <div><label className="field-label">{t('dateOfBirth')}</label>
                    <input className="field" type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                <div><label className="field-label">{t('email')} *</label>
                    <input className="field" type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            </div>
            <div className="grid grid-cols-4 gap-3">
                <div><label className="field-label">{t('region')}</label>
                    <select className="field" value={form.region} onChange={e => set('region', e.target.value)}>
                        <option value="">--</option>
                        {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                    </select></div>
                <div><label className="field-label">{t('city')}</label>
                    <input className="field" value={form.city} onChange={e => set('city', e.target.value)} /></div>
                <div><label className="field-label">{t('kebele')}</label>
                    <input className="field" value={form.kebele} onChange={e => set('kebele', e.target.value)} /></div>
                <div><label className="field-label">{t('houseNo')}</label>
                    <input className="field" value={form.houseNo} onChange={e => set('houseNo', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-2">
                <FileUploadField label={t('studentPhoto')} folder="student-photos" value={form.studentPhotoUrl} onChange={v => set('studentPhotoUrl', v)} accept="image/jpeg,image/png" />
                <FileUploadField label={t('idDocument')} folder="id-docs" value={form.idDocUrl} onChange={v => set('idDocUrl', v)} accept="image/*,.pdf" />
            </div>
            <div className="flex justify-between pt-2">
                <button className="btn-ghost" onClick={() => setStep(0)}>{t('back')}</button>
                <button className="btn-primary" onClick={handleNext}>{t('next')}</button>
            </div>
        </div>
    )

    // ── Step 2: Academic Info ────────────────────────────────────────────────
    if (step === 2) return (
        <div className="space-y-4">
            <StepBar step={step} steps={STEPS} />
            <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">{t('grade')} *</label>
                    <select className="field" value={form.grade} onChange={e => set('grade', Number(e.target.value))}>
                        {windowData?.allowedGrades
                            ? windowData.allowedGrades.split(',').map(g => <option key={g} value={g}>Grade {g}</option>)
                            : [9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)
                        }
                    </select></div>
                {Number(form.grade) >= 11 && (
                    <div><label className="field-label">{t('stream')} *</label>
                        <select className="field" value={form.stream} onChange={e => set('stream', e.target.value)} required>
                            <option value="">-- {t('selectLabel')} --</option>
                            <option value="NATURAL_SCIENCE">{t('naturalScience')}</option>
                            <option value="SOCIAL_SCIENCE">{t('socialScience')}</option>
                        </select></div>
                )}
            </div>

            {/* Transfer students: previous school + release letter */}
            {(enrollmentType === 'TRANSFER') && (
                <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="field-label">{t('previousSchool')}</label>
                        <input className="field" value={form.previousSchool} onChange={e => set('previousSchool', e.target.value)} /></div>
                    <FileUploadField label={t('releaseLetter')} folder="release-letters" value={form.releaseLetterUrl} onChange={v => set('releaseLetterUrl', v)} accept="image/*,.pdf" />
                </div>
            )}

            {/* New entrants: Grade 8 score + certificate */}
            {enrollmentType === 'NEW' && (
                <div className="grid grid-cols-2 gap-3">
                    <div><label className="field-label">{t('grade8Score')}</label>
                        <input className="field" type="number" min={0} max={100} value={form.grade8Score} onChange={e => set('grade8Score', e.target.value)} /></div>
                    <FileUploadField label={t('grade8Certificate')} folder="certificates" value={form.grade8CertUrl} onChange={v => set('grade8CertUrl', v)} accept="image/*,.pdf" />
                </div>
            )}

            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                ℹ️ {t('sectionPending')}
            </div>

            <div className="flex justify-between pt-2">
                <button className="btn-ghost" onClick={handleBack}>{t('back')}</button>
                <button className="btn-primary" onClick={handleNext}>{t('next')}</button>
            </div>
        </div>
    )

    // ── Step 3: Guardian Info ────────────────────────────────────────────────
    if (step === 3) return (
        <div className="space-y-4">
            <StepBar step={step} steps={STEPS} />
            <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="field-label">{t('parentName')} *</label>
                    <input className="field" value={form.guardianName} onChange={e => set('guardianName', e.target.value)} required /></div>
                <div><label className="field-label">{t('relationship')}</label>
                    <select className="field" value={form.guardianRelationship} onChange={e => set('guardianRelationship', e.target.value)}>
                        <option value="">-- {t('selectLabel')} --</option>
                        {RELATIONSHIP_OPTS.map(r => <option key={r}>{r}</option>)}
                    </select></div>
                <div><label className="field-label">{t('guardianPhone')} *</label>
                    <input className="field" value={form.guardianPhone} onChange={e => set('guardianPhone', e.target.value)}
                        placeholder="+251..." required /></div>
            </div>
            <div className="flex justify-between pt-2">
                <button className="btn-ghost" onClick={handleBack}>{t('back')}</button>
                <button className="btn-primary" onClick={handleNext}>{t('next')}</button>
            </div>
        </div>
    )

    // ── Step 4: Payment ──────────────────────────────────────────────────────
    if (step === 4) return (
        <div className="space-y-4">
            <StepBar step={step} steps={STEPS} />
            <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">{t('paymentMethod')} *</label>
                    <select className="field" value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)} required>
                        <option value="">-- {t('selectLabel')} --</option>
                        {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                    </select></div>
                <div><label className="field-label">{t('transactionRef')} *</label>
                    <input className="field" value={form.transactionRef} onChange={e => set('transactionRef', e.target.value)} required /></div>
                <div className="col-span-2">
                    <FileUploadField label={t('paymentReceipt')} folder="payment-receipts" value={form.paymentReceiptUrl} onChange={v => set('paymentReceiptUrl', v)} accept="image/*,.pdf" />
                </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                <p className="font-semibold text-slate-700 mb-2">{t('reviewSummary')}</p>
                <p><span className="text-slate-500">{t('nameLabel')}:</span> {form.firstName} {form.fatherName} {form.grandfatherName}</p>
                <p><span className="text-slate-500">{t('grade')}:</span> Grade {form.grade} {form.stream ? `(${form.stream.replace('_',' ')})` : ''}</p>
                <p><span className="text-slate-500">{t('enrollmentTypeLabel')}:</span> {
                    enrollmentType === 'NEW' ? t('gradeNewEntrant') :
                    enrollmentType === 'PROMOTED' ? t('gradeReEnroll') :
                    enrollmentType === 'TRANSFER' ? t('gradeTransfer') : t('repeatStudent')
                }</p>
                <p><span className="text-slate-500">{t('parentName')}:</span> {form.guardianName}</p>
            </div>

            <div className="flex justify-between pt-2">
                <button className="btn-ghost" onClick={handleBack}>{t('back')}</button>
                <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
                    {submitting ? t('saving') : t('completeRegistration')}
                </button>
            </div>
        </div>
    )

    return null
}

// ── Postpone modal ─────────────────────────────────────────────────────────────
function PostponeModal({ windowId, currentEnd, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [newEnd, setNewEnd] = useState('')
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!newEnd) { toast.error(t('newEndDateRequired')); return }
        setLoading(true)
        try {
            await registrationService.postponeWindow(windowId, { newEndDatetime: newEnd + ':00', reason })
            toast.success(t('registrationPostponed'))
            onSuccess()
        } catch (err) { toast.error(err.response?.data?.message || t('failedToPostpone')) }
        finally { setLoading(false) }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                {t('currentEnd')}: <strong>{new Date(currentEnd).toLocaleString()}</strong><br />
                {t('newEndMustBeLater')}
            </div>
            <div><label className="field-label">{t('newEndDate')} *</label>
                <input className="field" type="datetime-local" value={newEnd} onChange={e => setNewEnd(e.target.value)} required />
                {!newEnd && <p className="text-xs text-red-500 mt-0.5">{t('required')}</p>}</div>
            <div><label className="field-label">{t('postponeReason')}</label>
                <input className="field" value={reason} onChange={e => setReason(e.target.value)} placeholder={t('postponeReasonPlaceholder')} /></div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading || !newEnd}>
                    {loading ? t('postponing') : t('postponeRegistration')}
                </button>
            </div>
        </form>
    )
}

// ── Auto-Assign Modal ─────────────────────────────────────────────────────────
function AutoAssignModal({ onClose }) {
    const { t } = useLanguage()
    const [grade, setGrade] = useState(9)
    const [academicYear, setAcademicYear] = useState(CURRENT_YEAR)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const handleAssign = async () => {
        setLoading(true)
        try { const r = await registrationService.autoAssign(grade, academicYear); setResult(r); toast.success(r.message) }
        catch (err) { toast.error(err.response?.data?.message || t('autoAssignFailed')) }
        finally { setLoading(false) }
    }
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <strong>🔀 {t('autoAssignTitle')}</strong>
                <p className="mt-1 text-xs">{t('autoAssignDescription')}</p>
            </div>
            {result ? (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm space-y-2">
                    <p className="text-green-800 font-semibold">✅ {result.message}</p>
                    <p className="text-green-700">{t('total')}: {result.totalStudents}</p>
                    <p className="text-green-700">{t('assigned')}: {result.assignedStudents}</p>
                    {result.sectionCounts && Object.entries(result.sectionCounts).map(([sec, count]) => (
                        <div key={sec} className="flex justify-between text-xs text-green-700">
                            <span>{sec}</span><span>{count} {t('students')}</span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="field-label">{t('grade')} *</label>
                            <select className="field" value={grade} onChange={e => setGrade(Number(e.target.value))}>
                                {[9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                            </select></div>
                        <div><label className="field-label">{t('academicYear')} *</label>
                            <input className="field" value={academicYear} onChange={e => setAcademicYear(e.target.value)} /></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                        <button className="btn-primary" onClick={handleAssign} disabled={loading}>
                            {loading ? `⏳ ${t('assigning')}` : `🔀 ${t('runAutoAssign')}`}
                        </button>
                    </div>
                </div>
            )}
            {result && <div className="flex justify-end"><button className="btn-primary" onClick={onClose}>{t('done')}</button></div>}
        </div>
    )
}

function OpenWindowForm({ onSubmit, onClose, loading }) {
    const { t } = useLanguage()
    const now = new Date()
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    const [form, setForm] = useState({ academicYear: CURRENT_YEAR, startDatetime: localNow, endDatetime: '', note: '' })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.endDatetime) { toast.error(t('endDateRequired')); return }
        onSubmit({ ...form, startDatetime: form.startDatetime + ':00', endDatetime: form.endDatetime + ':00' })
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <div><label className="field-label">{t('academicYear')} *</label>
                    <input className="field" value={form.academicYear} onChange={e => set('academicYear', e.target.value)} required /></div>
                <div><label className="field-label">{t('startDateTime')} *</label>
                    <input className="field" type="datetime-local" value={form.startDatetime} onChange={e => set('startDatetime', e.target.value)} required /></div>
                <div><label className="field-label">{t('endDateTime')} *</label>
                    <input className="field" type="datetime-local" value={form.endDatetime} onChange={e => set('endDatetime', e.target.value)} required />
                    {!form.endDatetime && <p className="text-xs text-red-500 mt-0.5">{t('required')}</p>}</div>
                <div><label className="field-label">{t('noteLabel')}</label>
                    <input className="field" value={form.note} onChange={e => set('note', e.target.value)} placeholder={t('optionalNote')} /></div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('opening') : t('openRegistration')}
                </button>
            </div>
        </form>
    )
}

function AssignTeacherForm({ windowId, teachers, existingAssignments, onSuccess, onClose }) {
    const { t } = useLanguage()
    const [teacherId, setTeacherId] = useState('')
    const [grades, setGrades] = useState({ 9: false, 10: false, 11: false, 12: false })
    const [loading, setLoading] = useState(false)
    const assignedIds = new Set(existingAssignments.map(a => a.teacherId))
    const handleSubmit = async (e) => {
        e.preventDefault()
        const selected = Object.entries(grades).filter(([, v]) => v).map(([g]) => g)
        if (selected.length === 0) { toast.error(t('selectAtLeastOneGrade')); return }
        setLoading(true)
        try {
            await registrationService.assignTeacher(windowId, { teacherId: Number(teacherId), allowedGrades: selected.join(',') })
            toast.success(t('teacherAssigned'))
            onSuccess()
        } catch (err) { toast.error(err.response?.data?.message || t('failedToAssign')) }
        finally { setLoading(false) }
    }
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="field-label">{t('teacherLabel')} *</label>
                <select className="field" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                    <option value="">— {t('selectTeacher')} —</option>
                    {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.fullName} ({t.employeeId}){assignedIds.has(t.id) ? ' ✓' : ''}</option>
                    ))}
                </select></div>
            <div><label className="field-label">{t('allowedGrades')} *</label>
                <div className="flex gap-4 mt-1">
                    {[9,10,11,12].map(g => (
                        <label key={g} className="flex items-center gap-1.5 cursor-pointer text-sm">
                            <input type="checkbox" checked={grades[g]} onChange={e => setGrades(p => ({ ...p, [g]: e.target.checked }))} />
                            Grade {g}
                        </label>
                    ))}
                </div></div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading || !teacherId}>
                    {loading ? t('assigning') : t('assignTeacher')}
                </button>
            </div>
        </form>
    )
}

// ── Window card ────────────────────────────────────────────────────────────────
function WindowCard({ window: w, teachers, onAssign, onClose, onPostpone, onEnroll, onRemoveAssignment, active }) {
    const { t } = useLanguage()
    const [showEnrollments, setShowEnrollments] = useState(false)
    const [enrollments, setEnrollments] = useState([])
    const [loadingEnroll, setLoadingEnroll] = useState(false)

    const loadEnrollments = async () => {
        setLoadingEnroll(true)
        try { const data = await registrationService.getEnrollments(w.id); setEnrollments(data); setShowEnrollments(true) }
        catch { toast.error(t('failedToLoadEnrollments')) }
        finally { setLoadingEnroll(false) }
    }

    const byTeacher = enrollments.reduce((acc, e) => {
        const key = e.registeredBy || 'Unknown'
        if (!acc[key]) acc[key] = []
        acc[key].push(e)
        return acc
    }, {})

    const TYPE_BADGE = {
        NEW: 'bg-green-100 text-green-700',
        PROMOTED: 'bg-blue-100 text-blue-700',
        TRANSFER: 'bg-purple-100 text-purple-700',
        REPEAT: 'bg-yellow-100 text-yellow-700',
    }

    return (
        <div className={`card ${active ? 'border-green-200 bg-green-50/30' : 'opacity-70'}`}>
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {active ? t('registrationOpened') : t('registrationClosed')}
                        </span>
                        <span className="font-semibold text-slate-900">{w.academicYear}</span>
                        {w.active && <span className="text-xs text-green-600 font-medium">● {t('liveNow')}</span>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {w.startDatetime ? new Date(w.startDatetime).toLocaleString() : w.startDate}
                        {' → '}
                        {w.endDatetime ? new Date(w.endDatetime).toLocaleString() : w.endDate}
                        {w.postponeCount > 0 && <span className="ml-2 text-blue-500 text-xs">⏰ {t('postponed')} {w.postponeCount}x</span>}
                        {w.note && <span className="ml-2 italic text-xs">"{w.note}"</span>}
                    </p>
                    <p className="text-xs text-slate-400">{t('openedBy')}: {w.openedBy}</p>
                </div>
                {active && (
                    <div className="flex gap-2 flex-wrap">
                        <button className="btn-ghost text-xs" onClick={loadEnrollments} disabled={loadingEnroll}>
                            {loadingEnroll ? '…' : `📋 ${t('enrollments')}`}
                        </button>
                        <button className="btn-primary text-xs" onClick={onEnroll}>
                            + {t('registerStudent')}
                        </button>
                        <button className="btn-ghost text-xs" onClick={onAssign}>+ {t('assignTeacher')}</button>
                        <button className="btn-ghost text-xs border-blue-200 text-blue-600" onClick={onPostpone}>
                            ⏰ {t('postponeRegistration')}
                        </button>
                        <button className="btn-ghost text-xs border-red-200 text-red-600" onClick={onClose}>
                            {t('closeRegistration')}
                        </button>
                    </div>
                )}
            </div>

            {/* Teacher assignments */}
            {w.assignments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{t('assignedTeachers')}</p>
                    <div className="space-y-2">
                        {w.assignments.map(a => (
                            <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">
                                <div>
                                    <span className="text-sm font-medium text-slate-800">{a.teacherName}</span>
                                    <span className="text-xs text-slate-400 ml-2">({a.teacherEmployeeId})</span>
                                    <div className="flex gap-1 mt-0.5">
                                        {a.allowedGradeList?.map(g => (
                                            <span key={g} className="text-xs bg-brand/10 text-brand px-1.5 py-0.5 rounded">Gr {g}</span>
                                        ))}
                                    </div>
                                </div>
                                {active && <button className="text-xs text-red-400 hover:text-red-600" onClick={() => onRemoveAssignment(a.id)}>{t('remove')}</button>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Enrollment audit */}
            {showEnrollments && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">
                            {t('enrollmentAudit')} ({enrollments.length} {t('total')})
                        </p>
                        <button className="text-xs text-slate-400 hover:text-slate-600" onClick={() => setShowEnrollments(false)}>{t('hide')}</button>
                    </div>
                    {enrollments.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-2">{t('noEnrollments')}</p>
                    ) : Object.entries(byTeacher).map(([teacher, recs]) => (
                        <div key={teacher} className="mb-3">
                            <p className="text-xs font-medium text-slate-600 mb-1">👤 {teacher} — {recs.length} {t('studentsRegistered')}</p>
                            <div className="space-y-1 pl-3">
                                {recs.map(r => (
                                    <div key={r.id} className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                                        <span className="font-mono text-slate-400">{r.studentUid}</span>
                                        <span>{r.studentName}</span>
                                        <span className={`px-1.5 py-0.5 rounded text-xs ${TYPE_BADGE[r.enrollmentType] || 'bg-slate-100 text-slate-600'}`}>
                                            {r.enrollmentType === 'NEW' ? t('gradeNewEntrant') :
                                             r.enrollmentType === 'PROMOTED' ? t('gradeReEnroll') :
                                             r.enrollmentType === 'TRANSFER' ? t('gradeTransfer') : t('repeatStudent')}
                                        </span>
                                        {r.stream && <span className="text-slate-400">{r.stream === 'NATURAL_SCIENCE' ? '🔬 Natural' : '📚 Social'}</span>}
                                        <span className="text-slate-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Main Director Registration Page ───────────────────────────────────────────
export default function DirectorRegistrationPage() {
    const { t } = useLanguage()
    const [windows, setWindows] = useState([])
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [openModal, setOpenModal] = useState(false)
    const [assignModal, setAssignModal] = useState(null)
    const [openingWindow, setOpeningWindow] = useState(false)
    const [confirmClose, setConfirmClose] = useState(null)
    const [autoAssignModal, setAutoAssignModal] = useState(false)
    const [postponeModal, setPostponeModal] = useState(null)
    const [enrollModal, setEnrollModal] = useState(null)  // window data for enrollment

    const load = async () => {
        setLoading(true)
        try {
            const [wins, tList] = await Promise.all([registrationService.getWindows(), teacherService.getAll()])
            setWindows(wins); setTeachers(tList)
        } catch { toast.error(t('failedToLoad')) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const handleOpenWindow = async (payload) => {
        setOpeningWindow(true)
        try { await registrationService.openWindow(payload); toast.success(t('registrationWindowOpened')); setOpenModal(false); load() }
        catch (err) { toast.error(err.response?.data?.message || t('failedToOpenWindow')) }
        finally { setOpeningWindow(false) }
    }

    const handleCloseWindow = async (id) => {
        try { await registrationService.closeWindow(id); toast.success(t('registrationWindowClosed')); setConfirmClose(null); load() }
        catch { toast.error(t('failedToClose')) }
    }

    const handleRemoveAssignment = async (id) => {
        try { await registrationService.removeAssignment(id); toast.success(t('assignmentRemoved')); load() }
        catch { toast.error(t('failedToRemove')) }
    }

    const activeWindows = windows.filter(w => w.status === 'OPEN')
    const closedWindows = windows.filter(w => w.status === 'CLOSED')

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('studentRegistration')}</h1>
                    <p className="text-slate-500 mt-1">{t('registrationSubtitle')}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button className="btn-ghost text-sm border-brand text-brand hover:bg-brand/5" onClick={() => setAutoAssignModal(true)}>
                        🔀 {t('autoAssignStudents')}
                    </button>
                    <button className="btn-primary" onClick={() => setOpenModal(true)}>
                        + {t('openRegistration')}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : (
                <div className="space-y-6">
                    {activeWindows.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                                {t('activeWindows')} ({activeWindows.length})
                            </h2>
                            <div className="space-y-4">
                                {activeWindows.map(w => (
                                    <WindowCard key={w.id} window={w} teachers={teachers}
                                        onAssign={() => setAssignModal(w)}
                                        onClose={() => setConfirmClose(w)}
                                        onPostpone={() => setPostponeModal(w)}
                                        onEnroll={() => setEnrollModal(w)}
                                        onRemoveAssignment={handleRemoveAssignment}
                                        active
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {windows.length === 0 && (
                        <div className="card p-8 text-center text-slate-500">{t('noWindowsYet')}</div>
                    )}

                    {closedWindows.length > 0 && (
                        <div>
                            <h2 className="font-semibold text-slate-500 mb-3 text-sm uppercase tracking-wide">
                                {t('pastWindows')} ({closedWindows.length})
                            </h2>
                            <div className="space-y-3">
                                {closedWindows.map(w => (
                                    <WindowCard key={w.id} window={w} teachers={teachers}
                                        onAssign={() => {}} onClose={() => {}} onPostpone={() => {}}
                                        onEnroll={() => {}} onRemoveAssignment={() => {}} active={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {openModal && (
                <Modal title={t('openRegistrationWindow')} onClose={() => setOpenModal(false)}>
                    <OpenWindowForm onSubmit={handleOpenWindow} onClose={() => setOpenModal(false)} loading={openingWindow} />
                </Modal>
            )}

            {assignModal && (
                <Modal title={`${t('assignTeacher')} – ${assignModal.academicYear}`} onClose={() => setAssignModal(null)}>
                    <AssignTeacherForm windowId={assignModal.id} teachers={teachers}
                        existingAssignments={assignModal.assignments || []}
                        onSuccess={() => { setAssignModal(null); load() }} onClose={() => setAssignModal(null)} />
                </Modal>
            )}

            {enrollModal && (
                <Modal title={`${t('registerStudent')} — ${enrollModal.academicYear}`} onClose={() => setEnrollModal(null)} size="lg">
                    <StudentEnrollmentWizard
                        windowData={enrollModal}
                        onSuccess={load}
                        onClose={() => setEnrollModal(null)}
                    />
                </Modal>
            )}

            {autoAssignModal && (
                <Modal title={t('autoAssignStudentsTitle')} onClose={() => setAutoAssignModal(false)}>
                    <AutoAssignModal onClose={() => setAutoAssignModal(false)} />
                </Modal>
            )}

            {postponeModal && (
                <Modal title={t('postponeRegistration')} onClose={() => setPostponeModal(null)}>
                    <PostponeModal windowId={postponeModal.id}
                        currentEnd={postponeModal.endDatetime || postponeModal.endDate}
                        onSuccess={() => { setPostponeModal(null); load() }}
                        onClose={() => setPostponeModal(null)} />
                </Modal>
            )}

            {confirmClose && (
                <Modal title={t('closeRegistrationWindow')} onClose={() => setConfirmClose(null)}>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-sm text-orange-800">
                            ⚠️ {t('closeWindowWarning')}
                        </div>
                        <p className="text-sm text-slate-700">{t('closeWindowConfirm')} <strong>{confirmClose.academicYear}</strong>?</p>
                        <div className="flex justify-end gap-2">
                            <button className="btn-ghost" onClick={() => setConfirmClose(null)}>{t('cancel')}</button>
                            <button className="btn-danger" onClick={() => handleCloseWindow(confirmClose.id)}>{t('closeRegistration')}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
