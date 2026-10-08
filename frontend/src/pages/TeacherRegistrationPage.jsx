import { useEffect, useState, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { registrationService } from '../services/registrationService'
import { classService } from '../services/classService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

// File upload field with Cloudinary direct upload
function FileUploadField({ label, required, folder, value, onChange, accept = 'image/*,.pdf' }) {
    const [uploading, setUploading] = useState(false)
    const ref = useRef()

    const handleChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const url = await registrationService.uploadFile(file, folder)
            onChange(url)
            toast.success(`${label} uploaded`)
        } catch {
            toast.error(`Failed to upload ${label}`)
        } finally { setUploading(false) }
    }

    return (
        <div>
            <label className="field-label">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex gap-2 items-center">
                <button type="button" className="btn-ghost text-xs py-1.5"
                    onClick={() => ref.current?.click()}>
                    {uploading ? 'Uploading...' : value ? 'Change file' : 'Upload file'}
                </button>
                {value && (
                    <a href={value} target="_blank" rel="noreferrer"
                        className="text-xs text-brand hover:underline">View</a>
                )}
                <input ref={ref} type="file" accept={accept} className="hidden" onChange={handleChange} />
            </div>
            {required && !value && (
                <p className="text-xs text-slate-400 mt-0.5">Required</p>
            )}
        </div>
    )
}

// Step progress indicator
function StepIndicator({ current, steps }) {
    return (
        <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition
                        ${i < current ? 'bg-green-500 text-white' : i === current ? 'bg-brand text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {i < current ? 'v' : i + 1}
                    </div>
                    <div className="ml-1.5 text-xs hidden sm:block">
                        <div className={`font-medium ${i === current ? 'text-brand' : i < current ? 'text-green-600' : 'text-slate-400'}`}>
                            {s}
                        </div>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-3 ${i < current ? 'bg-green-400' : 'bg-slate-200'}`} />
                    )}
                </div>
            ))}
        </div>
    )
}

const WIZARD_STEPS = ['Personal Info', 'Academic', 'Guardian', 'Payment']

const ETHIOPIAN_REGIONS = [
    'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
    'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
    'South Ethiopia', 'Southwest Ethiopia', 'Tigray', 'Other'
]

const PAYMENT_METHODS = [
    { value: 'FINANCE_OFFICE', label: 'Finance Office (School)' },
    { value: 'TELEBIRR', label: 'Telebirr' },
    { value: 'CBE', label: 'CBE (Commercial Bank)' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
    { value: 'OTHER', label: 'Other' },
]

// Ethiopian phone input with +251 prefix locked
function EthiopianPhoneInput({ value, onChange, required }) {
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
                <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-100 text-slate-600 text-sm font-medium">
                    +251
                </span>
                <input
                    className={`field rounded-l-none flex-1 ${showError ? 'border-red-400' : ''}`}
                    type="tel"
                    value={digits}
                    onChange={handleChange}
                    placeholder="9XXXXXXXX or 7XXXXXXXX"
                    maxLength={9}
                    required={required}
                />
            </div>
            {showError && (
                <p className="text-xs text-red-500 mt-0.5">Must start with 9 or 7 and be exactly 9 digits</p>
            )}
            {required && !digits && (
                <p className="text-xs text-red-500 mt-0.5">Required</p>
            )}
        </div>
    )
}

// Error wrapper component
function F({ field, errors, children }) {
    return (
        <div>
            {children}
            {errors[field] && <p className="text-xs text-red-500 mt-0.5">{errors[field]}</p>}
        </div>
    )
}

// 4-Step Wizard for NEW and TRANSFER students
function FullEnrollmentWizard({ windowId, sections, grade, enrollmentType, academicYear, onSuccess, onClose }) {
    const [step, setStep] = useState(0)
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})

    const [form, setForm] = useState({
        firstName: '', fatherName: '', grandfatherName: '',
        gender: '', dateOfBirth: '',
        region: '', city: '', kebele: '', houseNo: '',
        photoUrl: '', idDocUrl: '',
        email: '',
        grade8Score: '', previousSchool: '',
        grade8CertificateUrl: '', releaseLetterUrl: '',
        stream: '',
        parentName: '', parentRelationship: '', parentPhone: '',
        paymentMethod: '', bankTransactionRef: '', paymentReceiptUrl: '',
    })
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const needsStream = grade >= 11

    const validateStep = () => {
        const e = {}
        if (step === 0) {
            if (!form.firstName) e.firstName = 'Required'
            if (!form.fatherName) e.fatherName = 'Required'
            if (!form.grandfatherName) e.grandfatherName = 'Required'
            if (!form.gender) e.gender = 'Required'
            if (!form.dateOfBirth) e.dateOfBirth = 'Required'
            if (!form.region) e.region = 'Required'
            if (!form.city) e.city = 'Required'
            if (!form.kebele) e.kebele = 'Required'
            if (!form.email) e.email = 'Required'
            if (!form.photoUrl) e.photoUrl = 'Student photo is required'
            if (!form.idDocUrl) e.idDocUrl = 'ID / Birth certificate is required'
        }
        if (step === 1) {
            if (!form.previousSchool) e.previousSchool = 'Required'
            if (form.grade8Score === '') e.grade8Score = 'Required'
            else if (Number(form.grade8Score) < 0 || Number(form.grade8Score) > 100)
                e.grade8Score = 'Must be between 0 and 100'
            if (!form.grade8CertificateUrl) e.grade8CertificateUrl = 'Grade 8 certificate is required'
            if (enrollmentType === 'TRANSFER' && !form.releaseLetterUrl)
                e.releaseLetterUrl = 'Release letter is required for transfers'
            if (needsStream && !form.stream) e.stream = 'Stream is required for Grade 11-12'
        }
        if (step === 2) {
            if (!form.parentName) e.parentName = 'Required'
            if (!form.parentRelationship) e.parentRelationship = 'Required'
            const digits = (form.parentPhone || '').replace(/^\+251/, '')
            if (!digits) e.parentPhone = 'Required'
            else if (!/^(9|7)\d{8}$/.test(digits))
                e.parentPhone = 'Must start with 9 or 7 and be 9 digits'
        }
        if (step === 3) {
            if (!form.paymentMethod) e.paymentMethod = 'Required'
            if (!form.bankTransactionRef) e.bankTransactionRef = 'Required'
            if (!form.paymentReceiptUrl) e.paymentReceiptUrl = 'Payment receipt is required'
        }
        return e
    }

    const handleNext = () => {
        const e = validateStep()
        setErrors(e)
        if (Object.keys(e).length === 0) setStep(s => s + 1)
    }

    const handleSubmit = async () => {
        const e = validateStep()
        setErrors(e)
        if (Object.keys(e).length > 0) return
        if (!windowId) {
            toast.error('No active registration window found.')
            return
        }
        setSaving(true)
        try {
            const result = await registrationService.enrollFull(windowId, {
                ...form,
                sectionId: null,
                targetGrade: grade,
                academicYear,
                grade8Score: form.grade8Score !== '' ? Number(form.grade8Score) : null,
                dateOfBirth: form.dateOfBirth || null,
                enrollmentType,
            })
            onSuccess(result)
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Registration failed')
        } finally { setSaving(false) }
    }

    return (
        <div className="space-y-6">
            <StepIndicator current={step} steps={WIZARD_STEPS} />

            {/* Step 1: Personal Info */}
            {step === 0 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                        <F field="firstName" errors={errors}>
                            <label className="field-label">First Name *</label>
                            <input className={`field ${errors.firstName ? 'border-red-400' : ''}`}
                                value={form.firstName} onChange={e => set('firstName', e.target.value)} />
                        </F>
                        <F field="fatherName" errors={errors}>
                            <label className="field-label">Father's Name *</label>
                            <input className={`field ${errors.fatherName ? 'border-red-400' : ''}`}
                                value={form.fatherName} onChange={e => set('fatherName', e.target.value)} />
                        </F>
                        <F field="grandfatherName" errors={errors}>
                            <label className="field-label">Grandfather's Name *</label>
                            <input className={`field ${errors.grandfatherName ? 'border-red-400' : ''}`}
                                value={form.grandfatherName} onChange={e => set('grandfatherName', e.target.value)} />
                        </F>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <F field="gender" errors={errors}>
                            <label className="field-label">Gender *</label>
                            <select className={`field ${errors.gender ? 'border-red-400' : ''}`}
                                value={form.gender} onChange={e => set('gender', e.target.value)}>
                                <option value="">-- Select --</option>
                                <option>Male</option><option>Female</option>
                            </select>
                        </F>
                        <F field="dateOfBirth" errors={errors}>
                            <label className="field-label">Date of Birth *</label>
                            <input className={`field ${errors.dateOfBirth ? 'border-red-400' : ''}`}
                                type="date" value={form.dateOfBirth}
                                onChange={e => set('dateOfBirth', e.target.value)} />
                        </F>
                        <F field="email" errors={errors}>
                            <label className="field-label">Email *</label>
                            <input className={`field ${errors.email ? 'border-red-400' : ''}`}
                                type="email" value={form.email}
                                onChange={e => set('email', e.target.value)} />
                        </F>
                        <F field="region" errors={errors}>
                            <label className="field-label">Region *</label>
                            <select className={`field ${errors.region ? 'border-red-400' : ''}`}
                                value={form.region} onChange={e => set('region', e.target.value)}>
                                <option value="">-- Select --</option>
                                {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                            </select>
                        </F>
                        <F field="city" errors={errors}>
                            <label className="field-label">City / Woreda *</label>
                            <input className={`field ${errors.city ? 'border-red-400' : ''}`}
                                value={form.city} onChange={e => set('city', e.target.value)} />
                        </F>
                        <F field="kebele" errors={errors}>
                            <label className="field-label">Kebele *</label>
                            <input className={`field ${errors.kebele ? 'border-red-400' : ''}`}
                                value={form.kebele} onChange={e => set('kebele', e.target.value)} />
                        </F>
                        <div>
                            <label className="field-label">House No. <span className="text-slate-400 font-normal">(optional)</span></label>
                            <input className="field" value={form.houseNo}
                                onChange={e => set('houseNo', e.target.value)} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <F field="photoUrl" errors={errors}>
                            <FileUploadField label="Student Photo *" required folder="student-photos"
                                value={form.photoUrl} onChange={v => set('photoUrl', v)}
                                accept="image/jpeg,image/png" />
                        </F>
                        <F field="idDocUrl" errors={errors}>
                            <FileUploadField label="Resident ID / Birth Certificate *" required
                                folder="id-docs" value={form.idDocUrl}
                                onChange={v => set('idDocUrl', v)} />
                        </F>
                    </div>
                </div>
            )}

            {/* Step 2: Academic */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                        Section will be auto-assigned by the director after registration closes.
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <F field="previousSchool" errors={errors}>
                            <label className="field-label">Previous School *</label>
                            <input className={`field ${errors.previousSchool ? 'border-red-400' : ''}`}
                                value={form.previousSchool} onChange={e => set('previousSchool', e.target.value)} />
                        </F>
                        <F field="grade8Score" errors={errors}>
                            <label className="field-label">Grade 8 Exam Score (0-100) *</label>
                            <input className={`field ${errors.grade8Score ? 'border-red-400' : ''}`}
                                type="number" min={0} max={100} step={0.5}
                                value={form.grade8Score} onChange={e => set('grade8Score', e.target.value)} />
                        </F>
                        {needsStream && (
                            <F field="stream" errors={errors}>
                                <label className="field-label">Stream *</label>
                                <select className={`field ${errors.stream ? 'border-red-400' : ''}`}
                                    value={form.stream} onChange={e => set('stream', e.target.value)}>
                                    <option value="">-- Select stream --</option>
                                    <option value="NATURAL_SCIENCE">Natural Science</option>
                                    <option value="SOCIAL_SCIENCE">Social Science</option>
                                </select>
                            </F>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <F field="grade8CertificateUrl" errors={errors}>
                            <FileUploadField label="Grade 8 Certificate / Transcript *" required
                                folder="certificates" value={form.grade8CertificateUrl}
                                onChange={v => set('grade8CertificateUrl', v)} />
                        </F>
                        {enrollmentType === 'TRANSFER' && (
                            <F field="releaseLetterUrl" errors={errors}>
                                <FileUploadField label="Official Release Letter *" required
                                    folder="release-letters" value={form.releaseLetterUrl}
                                    onChange={v => set('releaseLetterUrl', v)} />
                            </F>
                        )}
                    </div>
                </div>
            )}

            {/* Step 3: Guardian */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <F field="parentName" errors={errors}>
                            <label className="field-label">Parent / Guardian Full Name *</label>
                            <input className={`field ${errors.parentName ? 'border-red-400' : ''}`}
                                value={form.parentName} onChange={e => set('parentName', e.target.value)} />
                        </F>
                        <F field="parentRelationship" errors={errors}>
                            <label className="field-label">Relationship *</label>
                            <select className={`field ${errors.parentRelationship ? 'border-red-400' : ''}`}
                                value={form.parentRelationship} onChange={e => set('parentRelationship', e.target.value)}>
                                <option value="">-- Select --</option>
                                <option>Mother</option><option>Father</option>
                                <option>Uncle</option><option>Aunt</option><option>Other</option>
                            </select>
                        </F>
                        <F field="parentPhone" errors={errors}>
                            <label className="field-label">Phone Number * (+251)</label>
                            <EthiopianPhoneInput required
                                value={form.parentPhone}
                                onChange={v => set('parentPhone', v)} />
                        </F>
                    </div>
                </div>
            )}

            {/* Step 4: Payment */}
            {step === 3 && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <F field="paymentMethod" errors={errors}>
                            <label className="field-label">Payment Method *</label>
                            <select className={`field ${errors.paymentMethod ? 'border-red-400' : ''}`}
                                value={form.paymentMethod} onChange={e => set('paymentMethod', e.target.value)}>
                                <option value="">-- Select --</option>
                                {PAYMENT_METHODS.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </F>
                        <F field="bankTransactionRef" errors={errors}>
                            <label className="field-label">Transaction / Receipt Reference No. *</label>
                            <input className={`field ${errors.bankTransactionRef ? 'border-red-400' : ''}`}
                                value={form.bankTransactionRef}
                                placeholder="e.g. REC-2026-001234"
                                onChange={e => set('bankTransactionRef', e.target.value)} />
                        </F>
                    </div>
                    <F field="paymentReceiptUrl" errors={errors}>
                        <FileUploadField label="Payment Receipt *" required
                            folder="payment-receipts" value={form.paymentReceiptUrl}
                            onChange={v => set('paymentReceiptUrl', v)}
                            accept="image/jpeg,image/png,application/pdf" />
                    </F>
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 text-sm space-y-1">
                        <p className="font-semibold text-slate-800 mb-2">Registration Summary</p>
                        <p><span className="text-slate-500">Name:</span> {form.firstName} {form.fatherName} {form.grandfatherName}</p>
                        <p><span className="text-slate-500">Type:</span> <strong>{enrollmentType}</strong></p>
                        {form.stream && <p><span className="text-slate-500">Stream:</span> {form.stream.replace('_', ' ')}</p>}
                        <p><span className="text-slate-500">Guardian:</span> {form.parentName} ({form.parentPhone})</p>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-slate-100">
                <button type="button" className="btn-ghost"
                    onClick={step === 0 ? onClose : () => { setStep(s => s - 1); setErrors({}) }}>
                    {step === 0 ? 'Cancel' : 'Back'}
                </button>
                {step < 3 ? (
                    <button type="button" className="btn-primary" onClick={handleNext}>
                        Next
                    </button>
                ) : (
                    <button type="button" className="btn-primary"
                        onClick={handleSubmit} disabled={saving}>
                        {saving ? 'Saving...' : 'Save & Register'}
                    </button>
                )}
            </div>
        </div>
    )
}

// Credentials modal after registration
function CredentialsModal({ student, onClose }) {
    const [copied, setCopied] = useState(false)
    const text = `Name: ${student.fullName}\nUID: ${student.studentUid}\nUsername: ${student.generatedUsername}\nPassword: ${student.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Student registered. Share these login credentials with the student.
            </div>
            {student.photoUrl && (
                <img src={student.photoUrl} alt="Student" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 mx-auto" />
            )}
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">Name:</span> <strong>{student.fullName}</strong></p>
                <p><span className="text-slate-500">UID:</span> <strong>{student.studentUid}</strong></p>
                <p><span className="text-slate-500">Username:</span> <strong>{student.generatedUsername}</strong></p>
                <p><span className="text-slate-500">Password:</span> <strong>{student.generatedPassword}</strong></p>
            </div>
            <p className="text-xs text-slate-500">Password shown once only. Student must change on first login.</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={copy}>{copied ? 'Copied!' : 'Copy'}</button>
                <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
        </div>
    )
}

// Existing student quick enrollment (PROMOTED / REPEATER)
function ExistingStudentPanel({ grade, windowId, sections, prevYear, newYear }) {
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [saving, setSaving] = useState({})
    const [forms, setForms] = useState({})

    const needsStream = grade >= 11

    useEffect(() => {
        setLoading(true)
        registrationService.getPassStatus(grade - 1, prevYear, newYear)
            .then(setStudents)
            .catch(() => toast.error('Failed to load students'))
            .finally(() => setLoading(false))
    }, [grade, prevYear, newYear])

    const setField = (studentId, key, val) =>
        setForms(f => ({ ...f, [studentId]: { ...(f[studentId] || {}), [key]: val } }))
    const getField = (studentId, key) => forms[studentId]?.[key] || ''

    const handleEnroll = async (student, type) => {
        const f = forms[student.studentId] || {}
        if (!f.paymentMethod) { toast.error('Select payment method'); return }
        if (!f.bankTransactionRef) { toast.error('Enter transaction reference'); return }
        if (needsStream && !f.stream) { toast.error('Select stream'); return }

        setSaving(s => ({ ...s, [student.studentId]: true }))
        try {
            await registrationService.enrollExisting(windowId, {
                studentId: student.studentId,
                newSectionId: null,
                enrollmentType: type,
                stream: f.stream || null,
                paymentMethod: f.paymentMethod,
                bankTransactionRef: f.bankTransactionRef,
                paymentReceiptUrl: f.paymentReceiptUrl || null,
            }, prevYear)
            toast.success(`${student.studentName} enrolled`)
            setStudents(prev => prev.map(s =>
                s.studentId === student.studentId ? { ...s, alreadyEnrolled: true } : s
            ))
        } catch (err) {
            toast.error(err.response?.data?.message || 'Enrollment failed')
        } finally { setSaving(s => ({ ...s, [student.studentId]: false })) }
    }

    const filtered = students.filter(s =>
        s.studentName.toLowerCase().includes(search.toLowerCase()) ||
        s.studentUid.toLowerCase().includes(search.toLowerCase())
    )

    const enrolled = filtered.filter(s => s.alreadyEnrolled)
    const failed = filtered.filter(s => !s.passed && !s.alreadyEnrolled)

    if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>

    return (
        <div className="space-y-4">
            <input className="field max-w-sm" placeholder="Search by name or UID..."
                value={search} onChange={e => setSearch(e.target.value)} />

            <div className="flex gap-4 text-sm">
                <span className="text-green-600 font-medium">{enrolled.length} enrolled</span>
                <span className="text-blue-600 font-medium">{filtered.filter(s => s.passed && !s.alreadyEnrolled).length} passed</span>
                <span className="text-red-500 font-medium">{failed.length} failed</span>
            </div>

            {failed.length > 0 && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                    {failed.length} student(s) did not pass - they can be re-enrolled as Repeater.
                </div>
            )}

            <div className="space-y-3">
                {filtered.map(s => (
                    <div key={s.studentId}
                        className={`card ${s.alreadyEnrolled ? 'bg-green-50 border-green-200' : ''}`}>
                        <div className="flex items-start gap-4 flex-wrap">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900">{s.studentName}</span>
                                    <span className="font-mono text-xs text-slate-400">{s.studentUid}</span>
                                    {s.alreadyEnrolled
                                        ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Enrolled</span>
                                        : s.passed
                                            ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Passed - Grade {grade}</span>
                                            : <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Repeater</span>
                                    }
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    Avg: <strong className={s.annualAverage >= 50 ? 'text-green-600' : 'text-red-600'}>
                                        {(s.annualAverage || s.average || 0).toFixed(1)}</strong>
                                    {' '} - {s.reason}
                                </div>
                            </div>

                            {!s.alreadyEnrolled && (
                                <div className="flex gap-2 flex-wrap items-end">
                                    {needsStream && (
                                        <div>
                                            <label className="field-label text-xs">Stream</label>
                                            <select className="field text-xs py-1 w-32"
                                                value={getField(s.studentId, 'stream')}
                                                onChange={e => setField(s.studentId, 'stream', e.target.value)}>
                                                <option value="">--</option>
                                                <option value="NATURAL_SCIENCE">Natural Science</option>
                                                <option value="SOCIAL_SCIENCE">Social Science</option>
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <label className="field-label text-xs">Payment</label>
                                        <select className="field text-xs py-1 w-32"
                                            value={getField(s.studentId, 'paymentMethod')}
                                            onChange={e => setField(s.studentId, 'paymentMethod', e.target.value)}>
                                            <option value="">--</option>
                                            <option value="FINANCE_OFFICE">Finance Office</option>
                                            <option value="TELEBIRR">Telebirr</option>
                                            <option value="CBE">CBE</option>
                                            <option value="BANK_TRANSFER">Bank</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="field-label text-xs">Ref No.</label>
                                        <input className="field text-xs py-1 w-32"
                                            placeholder="REC-..."
                                            value={getField(s.studentId, 'bankTransactionRef')}
                                            onChange={e => setField(s.studentId, 'bankTransactionRef', e.target.value)} />
                                    </div>
                                    <div className="flex gap-1">
                                        {s.passed && (
                                            <button className="btn-primary text-xs py-1 px-2"
                                                disabled={saving[s.studentId]}
                                                onClick={() => handleEnroll(s, 'PROMOTED')}>
                                                {saving[s.studentId] ? '...' : 'Promoted'}
                                            </button>
                                        )}
                                        <button className={`text-xs py-1 px-2 rounded border ${
                                            s.passed ? 'border-yellow-300 text-yellow-700' : 'btn-primary'}`}
                                            disabled={saving[s.studentId]}
                                            onClick={() => handleEnroll(s, 'REPEATER')}>
                                            {saving[s.studentId] ? '...' : 'Repeater'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// Main TeacherRegistrationPage
export default function TeacherRegistrationPage() {
    const { t } = useLanguage()
    const [window_, setWindow_] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sections, setSections] = useState([])
    const [selectedGrade, setSelectedGrade] = useState(null)
    const [pathway, setPathway] = useState(null)
    const [wizardModal, setWizardModal] = useState(null)
    const [credentialsModal, setCredentialsModal] = useState(null)

    useEffect(() => {
        Promise.all([
            registrationService.getMyWindow(),
            classService.getAll()
        ]).then(([w, secs]) => {
            setWindow_(w)
            setSections(secs)
            if (w) {
                const grades = w.assignments?.[0]?.allowedGradeList || []
                if (grades.length === 1) setSelectedGrade(grades[0])
            }
        }).catch(() => { })
        .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="card p-8 text-center text-slate-500">Loading...</div>

    if (!window_) return (
        <div className="card p-12 text-center">
            <div className="text-5xl mb-4">locked</div>
            <h2 className="font-semibold text-slate-700 text-lg">No Active Registration Window</h2>
            <p className="mt-2 text-sm text-slate-500">
                There is no open registration window right now, or you are not assigned to one.
                Contact the director.
            </p>
        </div>
    )

    const myAssignment = window_.assignments?.[0]
    const allowedGrades = myAssignment?.allowedGradeList || []
    const newYear = window_.academicYear
    const prevYear = (() => {
        const [start] = newYear.split('/')
        return `${Number(start) - 1}/${start}`
    })()

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">Student Registration</h1>
                <p className="text-slate-500 mt-1">
                    Academic Year: <strong>{window_.academicYear}</strong>
                    {window_.startDatetime && (
                        <span> &middot; {new Date(window_.startDatetime).toLocaleString()} - {new Date(window_.endDatetime).toLocaleString()}</span>
                    )}
                </p>
            </div>

            <div className="card mb-6">
                <h2 className="font-semibold text-slate-800 mb-3">Select Grade</h2>
                <div className="flex gap-3 flex-wrap">
                    {allowedGrades.map(g => (
                        <button key={g}
                            onClick={() => { setSelectedGrade(g); setPathway(null) }}
                            className={`px-5 py-3 rounded-xl border font-semibold transition ${
                                selectedGrade === g
                                    ? 'bg-brand text-white border-brand shadow-md'
                                    : 'border-slate-200 text-slate-700 hover:border-brand hover:shadow-sm'
                            }`}>
                            Grade {g}
                        </button>
                    ))}
                </div>
            </div>

            {selectedGrade && !pathway && (
                <div className="card mb-6">
                    <h2 className="font-semibold text-slate-800 mb-4">
                        Grade {selectedGrade} - Select Registration Pathway
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {selectedGrade === 9 && (
                            <button onClick={() => setPathway('new')}
                                className="card hover:shadow-md border-2 border-transparent hover:border-brand transition text-left cursor-pointer">
                                <div className="text-2xl mb-2">NEW</div>
                                <div className="font-semibold text-slate-900">New Entrant</div>
                                <div className="text-xs text-slate-500 mt-1">Grade 8 graduate entering Grade 9 for the first time</div>
                            </button>
                        )}
                        {selectedGrade > 9 && (
                            <button onClick={() => setPathway('existing')}
                                className="card hover:shadow-md border-2 border-transparent hover:border-brand transition text-left cursor-pointer">
                                <div className="text-2xl mb-2">RE</div>
                                <div className="font-semibold text-slate-900">Promoted / Repeater</div>
                                <div className="text-xs text-slate-500 mt-1">Already in the system</div>
                            </button>
                        )}
                        <button onClick={() => setPathway('transfer')}
                            className="card hover:shadow-md border-2 border-transparent hover:border-brand transition text-left cursor-pointer">
                            <div className="text-2xl mb-2">TR</div>
                            <div className="font-semibold text-slate-900">Transfer Student</div>
                            <div className="text-xs text-slate-500 mt-1">Joining from another school</div>
                        </button>
                        {selectedGrade === 9 && (
                            <button onClick={() => setPathway('existing')}
                                className="card hover:shadow-md border-2 border-transparent hover:border-brand transition text-left cursor-pointer">
                                <div className="text-2xl mb-2">RP</div>
                                <div className="font-semibold text-slate-900">Repeater</div>
                                <div className="text-xs text-slate-500 mt-1">Failed last year, re-enrolling</div>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {selectedGrade && (pathway === 'new' || pathway === 'transfer') && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-800">
                                {pathway === 'new' ? 'New Grade 9 Entrant' : 'Transfer Student - Grade ' + selectedGrade}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">4-step registration form</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="btn-ghost text-xs" onClick={() => setPathway(null)}>Back</button>
                            <button className="btn-primary"
                                onClick={() => setWizardModal({ grade: selectedGrade, type: pathway === 'new' ? 'NEW' : 'TRANSFER' })}>
                                + Register Student
                            </button>
                        </div>
                    </div>
                    <div className="card p-8 text-center text-slate-500 text-sm">
                        Click <strong>"Register Student"</strong> to open the registration form.
                    </div>
                </div>
            )}

            {selectedGrade && pathway === 'existing' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h2 className="font-semibold text-slate-800">Grade {selectedGrade} - Existing Students</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Students from Grade {selectedGrade === 9 ? 9 : selectedGrade - 1}
                            </p>
                        </div>
                        <button className="btn-ghost text-xs" onClick={() => setPathway(null)}>Back</button>
                    </div>
                    <ExistingStudentPanel
                        grade={selectedGrade}
                        windowId={window_.id}
                        sections={sections}
                        prevYear={selectedGrade === 9 ? newYear : prevYear}
                        newYear={newYear}
                    />
                </div>
            )}

            {wizardModal && (
                <Modal
                    title={`${wizardModal.type === 'NEW' ? 'New Grade 9 Student' : `Grade ${wizardModal.grade} Transfer`} - Registration`}
                    onClose={() => setWizardModal(null)}
                >
                    <FullEnrollmentWizard
                        windowId={window_.id}
                        sections={sections}
                        grade={wizardModal.grade}
                        enrollmentType={wizardModal.type}
                        academicYear={newYear}
                        onSuccess={(s) => { setWizardModal(null); setCredentialsModal(s) }}
                        onClose={() => setWizardModal(null)}
                    />
                </Modal>
            )}

            {credentialsModal && (
                <Modal title="Student Login Credentials" onClose={() => setCredentialsModal(null)}>
                    <CredentialsModal student={credentialsModal} onClose={() => setCredentialsModal(null)} />
                </Modal>
            )}
        </div>
    )
}
