import { useEffect, useRef, useState } from 'react'
import { studentService } from '../services/studentService'
import { classService } from '../services/classService'
import { registrationService } from '../services/registrationService'
import { useLanguage } from '../context/LanguageContext'
import Modal from '../components/Modal'
import StudentEnrollmentWizard from '../components/StudentEnrollmentWizard'
import toast from 'react-hot-toast'

const ETHIOPIAN_REGIONS = [
    'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
    'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
    'South Ethiopia', 'Southwest Ethiopia', 'Tigray', 'Other'
]

const STREAMS = [
    { value: 'NATURAL_SCIENCE', label: 'Natural Science' },
    { value: 'SOCIAL_SCIENCE', label: 'Social Science' },
]

const PAYMENT_METHODS = ['TELEBIRR', 'CBE', 'BANK_TRANSFER']
const ENROLLMENT_TYPES = ['NEW', 'TRANSFER', 'PROMOTED', 'REPEATER']

import DocumentUploadField from '../components/DocumentUploadField'

function FileUploadField(props) {
    return <DocumentUploadField {...props} />
}

function DocItem({ url, icon, label }) {
    const { t } = useLanguage()
    if (!url) return null
    const urlList = url.split(',').map(u => u.trim()).filter(Boolean)
    if (!urlList.length) return null

    const isImage = (u) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u) || u.includes('cloudinary')

    return (
        <div className="space-y-1.5">
            <p className="text-xs text-slate-500 font-medium">
                {icon} {label} {urlList.length > 1 && <span className="text-[10px] text-brand font-bold bg-brand/10 px-1.5 py-0.5 rounded-full ml-1">{urlList.length} photos</span>}
            </p>
            <div className="flex flex-wrap gap-2">
                {urlList.map((singleUrl, idx) => (
                    <div key={idx} className="relative group">
                        {isImage(singleUrl) ? (
                            <a href={singleUrl} target="_blank" rel="noreferrer" className="block">
                                <img
                                    src={singleUrl}
                                    alt={`${label} ${idx + 1}`}
                                    className="h-24 w-24 rounded-lg border border-slate-200 object-cover group-hover:opacity-85 transition shadow-sm"
                                    onError={e => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextSibling?.classList?.remove('hidden')
                                    }}
                                />
                                <span className="hidden text-xs text-brand hover:underline">🔗 {t('view')}</span>
                                {urlList.length > 1 && (
                                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur font-mono">
                                        #{idx + 1}
                                    </span>
                                )}
                            </a>
                        ) : (
                            <a
                                href={singleUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-brand hover:underline bg-brand/5 px-3 py-2 rounded-lg border border-brand/20"
                            >
                                📄 {t('view')} {urlList.length > 1 ? `#${idx + 1}` : ''}
                            </a>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

function CredentialsModal({ student, onClose }) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)
    const text = `Student: ${student.fullName}\nUsername: ${student.generatedUsername}\nPassword: ${student.generatedPassword}\nLogin at: ${window.location.origin}`
    const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                ✅ {t('studentRegisteredSuccess')}
            </div>
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">{t('student')}:</span> <strong>{student.fullName}</strong></p>
                <p><span className="text-slate-500">UID:</span> <strong>{student.studentUid}</strong></p>
                <p><span className="text-slate-500">{t('username')}:</span> <strong>{student.generatedUsername}</strong></p>
                <p><span className="text-slate-500">{t('password')}:</span> <strong>{student.generatedPassword}</strong></p>
                <p><span className="text-slate-500">{t('email')}:</span> <strong>{student.email}</strong></p>
            </div>
            <p className="text-xs text-slate-500">⚠️ {t('passwordShownOnce')}</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={handleCopy}>{copied ? `✓ ${t('copied')}` : t('copyToClipboard')}</button>
                <button className="btn-primary" onClick={onClose}>{t('done')}</button>
            </div>
        </div>
    )
}

function StudentForm({ initial, sections, onSubmit, onClose, loading, isEdit }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        const fullName = `${form.firstName || ''} ${form.fatherName || ''}`.trim() || form.fullName
        onSubmit({
            ...form,
            fullName,
            sectionId: form.sectionId ? Number(form.sectionId) : null,
            grade: form.grade ? Number(form.grade) : null,
            grade8Score: form.grade8Score !== '' && form.grade8Score !== null && form.grade8Score !== undefined ? Number(form.grade8Score) : null,
            enrollmentYear: form.enrollmentYear ? Number(form.enrollmentYear) : null,
            dateOfBirth: form.dateOfBirth || null,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info */}
            <div>
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>👤</span> {t('personalInfo')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('firstName')} *</label>
                        <input className="field" value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('fatherName')} *</label>
                        <input className="field" value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('grandfatherName')} *</label>
                        <input className="field" value={form.grandfatherName || ''} onChange={e => set('grandfatherName', e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                    <div>
                        <label className="field-label">{t('gender')} *</label>
                        <select className="field" value={form.gender || ''} onChange={e => set('gender', e.target.value)} required>
                            <option value="">— {t('selectLabel') || 'Select'} —</option>
                            <option value="Male">{t('male')}</option>
                            <option value="Female">{t('female')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('dateOfBirth')}</label>
                        <input className="field" type="date" value={form.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('email')} *</label>
                        <input className="field" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('phone')}</label>
                        <input className="field" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+251..." />
                    </div>
                </div>
            </div>

            {/* Address */}
            <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>📍</span> {t('region') || 'Address'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="field-label">{t('region')}</label>
                        <select className="field" value={form.region || ''} onChange={e => set('region', e.target.value)}>
                            <option value="">— {t('selectLabel') || 'Select'} —</option>
                            {ETHIOPIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('city')}</label>
                        <input className="field" value={form.city || ''} onChange={e => set('city', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('kebele')}</label>
                        <input className="field" value={form.kebele || ''} onChange={e => set('kebele', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('houseNo')}</label>
                        <input className="field" value={form.houseNo || ''} onChange={e => set('houseNo', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Academic & Placement */}
            <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>🎓</span> {t('academic') || 'Academic & Placement'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                        <label className="field-label">{t('grade')}</label>
                        <select className="field" value={form.grade || ''} onChange={e => set('grade', e.target.value)}>
                            <option value="">—</option>
                            <option value="9">Grade 9</option>
                            <option value="10">Grade 10</option>
                            <option value="11">Grade 11</option>
                            <option value="12">Grade 12</option>
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('stream') || 'Stream'}</label>
                        <select className="field" value={form.stream || ''} onChange={e => set('stream', e.target.value)}>
                            <option value="">— {t('none') || 'None (Grades 9-10)'} —</option>
                            {STREAMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('classSection')}</label>
                        <select className="field" value={form.sectionId || ''} onChange={e => set('sectionId', e.target.value)}>
                            <option value="">— {t('unassigned')} —</option>
                            {sections.map(s => (
                                <option key={s.id} value={s.id}>
                                    {t('grade')} {s.grade} – {s.section} ({s.academicYear})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('academicYear') || 'Academic Year'}</label>
                        <input className="field" value={form.academicYear || ''} onChange={e => set('academicYear', e.target.value)} placeholder="e.g. 2026/2027" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
                    <div>
                        <label className="field-label">{t('enrollmentYear')}</label>
                        <input className="field" type="number" value={form.enrollmentYear || ''} onChange={e => set('enrollmentYear', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('enrollmentType') || 'Enrollment Type'}</label>
                        <select className="field" value={form.enrollmentType || ''} onChange={e => set('enrollmentType', e.target.value)}>
                            <option value="">—</option>
                            {ENROLLMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('previousSchool') || 'Previous School'}</label>
                        <input className="field" value={form.previousSchool || ''} onChange={e => set('previousSchool', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">{t('grade8Score') || 'Grade 8 Score'}</label>
                        <input className="field" type="number" step="0.1" value={form.grade8Score ?? ''} onChange={e => set('grade8Score', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Parent / Guardian */}
            <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>👨‍👩‍👧</span> {t('guardian') || 'Parent / Guardian'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">{t('parentName')} *</label>
                        <input className="field" value={form.parentName || ''} onChange={e => set('parentName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">{t('relationship') || 'Relationship'}</label>
                        <input className="field" value={form.parentRelationship || ''} onChange={e => set('parentRelationship', e.target.value)} placeholder="Mother, Father, Guardian..." />
                    </div>
                    <div>
                        <label className="field-label">{t('guardianPhone')}</label>
                        <input className="field" value={form.parentPhone || ''} onChange={e => set('parentPhone', e.target.value)} placeholder="+251..." />
                    </div>
                </div>
            </div>

            {/* Payment */}
            <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>💳</span> {t('payment') || 'Payment Information'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="field-label">{t('paymentMethod') || 'Payment Method'}</label>
                        <select className="field" value={form.paymentMethod || ''} onChange={e => set('paymentMethod', e.target.value)}>
                            <option value="">— {t('selectLabel') || 'Select'} —</option>
                            {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">{t('transactionRef') || 'Transaction Reference No.'}</label>
                        <input className="field" value={form.bankTransactionRef || ''} onChange={e => set('bankTransactionRef', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Document Uploads */}
            <div className="border-t border-slate-100 pt-4">
                <h3 className="font-semibold text-slate-800 mb-3 text-sm flex items-center gap-2">
                    <span>📁</span> {t('documentsSection')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <FileUploadField label={t('studentPhoto')} folder="student-photos" value={form.photoUrl} onChange={v => set('photoUrl', v)} accept="image/jpeg,image/png" multiple={false} />
                    <FileUploadField label={t('idDoc') || 'Resident ID / Birth Cert'} folder="student-docs" value={form.idDocUrl} onChange={v => set('idDocUrl', v)} accept="image/*,.pdf" multiple={true} />
                    <FileUploadField label={t('grade8Certificate')} folder="student-docs" value={form.grade8CertificateUrl} onChange={v => set('grade8CertificateUrl', v)} accept="image/*,.pdf" multiple={true} />
                    <FileUploadField label={t('releaseLetter')} folder="student-docs" value={form.releaseLetterUrl} onChange={v => set('releaseLetterUrl', v)} accept="image/*,.pdf" multiple={true} />
                    <FileUploadField label={t('paymentReceipt') || 'Payment Receipt'} folder="student-receipts" value={form.paymentReceiptUrl} onChange={v => set('paymentReceiptUrl', v)} accept="image/*,.pdf" multiple={true} />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('saving') : isEdit ? t('saveChanges') : t('save')}
                </button>
            </div>
        </form>
    )
}

// ── Student detail modal (shows ALL info including photo & all uploaded documents) ─────────
function StudentDetailModal({ student, sections, onClose, onEdit }) {
    const { t } = useLanguage()
    const section = sections.find(s => s.id === student.sectionId)

    const personalFields = [
        ['UID',                    student.studentUid],
        [t('fullName'),            student.fullName],
        [t('firstName'),           student.firstName],
        [t('fatherName'),          student.fatherName],
        [t('grandfatherName'),     student.grandfatherName],
        [t('gender'),              student.gender ? t(student.gender.toLowerCase()) || student.gender : '—'],
        [t('dateOfBirth'),         student.dateOfBirth || '—'],
        [t('email'),               student.email],
        [t('username'),            student.username],
        [t('phone'),               student.phone || '—'],
    ]

    const addressFields = [
        [t('region'),              student.region || '—'],
        [t('city'),                student.city || '—'],
        [t('kebele'),              student.kebele || '—'],
        [t('houseNo'),             student.houseNo || '—'],
    ]

    const academicFields = [
        [t('grade'),               student.grade ? `Grade ${student.grade}` : '—'],
        [t('stream') || 'Stream',  student.stream ? (student.stream.replace('_', ' ')) : '—'],
        [t('classSection'),        section ? `${t('grade')} ${section.grade} – ${section.section} (${section.academicYear})` : (student.sectionLabel || t('unassigned'))],
        [t('academicYear') || 'Academic Year', student.academicYear || '—'],
        [t('enrollmentYear'),      student.enrollmentYear || '—'],
        [t('enrollmentType') || 'Enrollment Type', student.enrollmentType || '—'],
        [t('previousSchool') || 'Previous School', student.previousSchool || '—'],
        [t('grade8Score') || 'Grade 8 Score', student.grade8Score !== null && student.grade8Score !== undefined ? student.grade8Score : '—'],
    ]

    const parentFields = [
        [t('parentName'),          student.parentName || '—'],
        [t('relationship') || 'Relationship', student.parentRelationship || '—'],
        [t('guardianPhone'),       student.parentPhone || '—'],
    ]

    const paymentFields = [
        [t('paymentMethod') || 'Payment Method', student.paymentMethod || '—'],
        [t('transactionRef') || 'Transaction Ref', student.bankTransactionRef || '—'],
    ]

    const hasDocuments = student.photoUrl || student.idDocUrl || student.grade8CertificateUrl || student.releaseLetterUrl || student.paymentReceiptUrl

    return (
        <div className="space-y-6">
            {/* Photo + name header */}
            <div className="flex items-center gap-4">
                {student.photoUrl ? (
                    <img
                        src={student.photoUrl}
                        alt={student.fullName}
                        className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shrink-0"
                        onError={e => { e.currentTarget.style.display = 'none' }}
                    />
                ) : (
                    <div className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-3xl shrink-0">
                        {student.fullName?.charAt(0)}
                    </div>
                )}
                <div>
                    <div className="font-semibold text-slate-900 text-lg">{student.fullName}</div>
                    <div className="text-xs text-slate-400 font-mono">{student.studentUid}</div>
                    <div className="flex gap-2 items-center flex-wrap mt-1">
                        {student.sectionLabel ? (
                            <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded font-medium">
                                {student.sectionLabel}
                            </span>
                        ) : student.grade ? (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                Grade {student.grade}
                            </span>
                        ) : null}
                        {student.stream && (
                            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">
                                {student.stream.replace('_', ' ')}
                            </span>
                        )}
                        {student.enrollmentType && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-medium">
                                {student.enrollmentType}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Info sections */}
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {/* Personal Information */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {t('personalInfo')}
                    </h4>
                    <dl className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-slate-50/50">
                        {personalFields.map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 text-sm">
                                <dt className="text-slate-500 shrink-0 mr-4">{label}</dt>
                                <dd className="font-medium text-slate-900 text-right break-all">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Address Information */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {t('region') || 'Address'}
                    </h4>
                    <dl className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-slate-50/50">
                        {addressFields.map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 text-sm">
                                <dt className="text-slate-500 shrink-0 mr-4">{label}</dt>
                                <dd className="font-medium text-slate-900 text-right break-all">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Academic Information */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {t('academic') || 'Academic & Placement'}
                    </h4>
                    <dl className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-slate-50/50">
                        {academicFields.map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 text-sm">
                                <dt className="text-slate-500 shrink-0 mr-4">{label}</dt>
                                <dd className="font-medium text-slate-900 text-right break-all">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Parent / Guardian Information */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {t('guardian') || 'Parent / Guardian'}
                    </h4>
                    <dl className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-slate-50/50">
                        {parentFields.map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 text-sm">
                                <dt className="text-slate-500 shrink-0 mr-4">{label}</dt>
                                <dd className="font-medium text-slate-900 text-right break-all">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Payment Information */}
                <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        {t('payment') || 'Payment Information'}
                    </h4>
                    <dl className="divide-y divide-slate-100 border border-slate-100 rounded-lg px-3 bg-slate-50/50">
                        {paymentFields.map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 text-sm">
                                <dt className="text-slate-500 shrink-0 mr-4">{label}</dt>
                                <dd className="font-medium text-slate-900 text-right break-all">{value || '—'}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Documents section */}
                {hasDocuments && (
                    <div className="pt-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            {t('documentsSection')}
                        </h4>
                        <div className="flex gap-4 flex-wrap border border-slate-100 rounded-lg p-3 bg-slate-50/50">
                            <DocItem url={student.photoUrl} icon="📷" label={t('studentPhoto')} />
                            <DocItem url={student.idDocUrl} icon="🪪" label={t('idDoc') || 'Resident ID'} />
                            <DocItem url={student.grade8CertificateUrl} icon="📄" label={t('grade8Certificate')} />
                            <DocItem url={student.releaseLetterUrl} icon="📋" label={t('releaseLetter')} />
                            <DocItem url={student.paymentReceiptUrl} icon="🧾" label={t('paymentReceipt') || 'Payment Receipt'} />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button className="btn-ghost" onClick={onClose}>{t('close')}</button>
                <button className="btn-primary" onClick={onEdit}>{t('edit')}</button>
            </div>
        </div>
    )
}

export default function StudentsPage() {
    const [students, setStudents] = useState([])
    const [sections, setSections] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)   // { mode: 'add'|'edit'|'detail'|'enroll', student? }
    const [credentialsModal, setCredentialsModal] = useState(null)
    const [enrollModal, setEnrollModal] = useState(false)   // full wizard
    const [activeWindow, setActiveWindow] = useState(null)  // active registration window or null
    const [search, setSearch] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)
    const { t } = useLanguage()

    const load = async () => {
        setLoading(true)
        try {
            const [s, c, windows] = await Promise.all([
                studentService.getAll(),
                classService.getAll(),
                registrationService.getWindows().catch(() => []),
            ])
            setStudents(s)
            setSections(c)
            const open = windows.find(w => w.status === 'OPEN')
            setActiveWindow(open || null)
        } catch { toast.error(t('failedToLoad')) }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            await studentService.update(modal.student.id, payload)
            toast.success(t('studentUpdated'))
            setModal(null)
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || t('saveFailed'))
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try {
            await studentService.remove(id)
            toast.success(t('studentDeleted'))
            setConfirmDelete(null); load()
        } catch { toast.error(t('deleteFailed')) }
    }

    const filtered = students.filter(s =>
        s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.studentUid?.toLowerCase().includes(search.toLowerCase()) ||
        s.email?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('studentsPage')}</h1>
                    <p className="text-slate-500 mt-1">{students.length} {t('enrolled')}</p>
                </div>
            </div>

            <div className="mb-4">
                <input className="field max-w-sm" placeholder={`${t('search')}…`}
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">{t('loading')}</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">{t('noStudentsFound')}</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3">UID</th>
                                <th className="px-4 py-3">{t('fullName')}</th>
                                <th className="px-4 py-3">{t('email')}</th>
                                <th className="px-4 py-3">{t('username')}</th>
                                <th className="px-4 py-3">{t('gender')}</th>
                                <th className="px-4 py-3">{t('dateOfBirth')}</th>
                                <th className="px-4 py-3">{t('classSection')}</th>
                                <th className="px-4 py-3">{t('parentName')}</th>
                                <th className="px-4 py-3">{t('guardianPhone')}</th>
                                <th className="px-4 py-3">{t('enrollmentYear')}</th>
                                <th className="px-4 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                                    onClick={() => setModal({ mode: 'detail', student: s })}>
                                    <td className="px-4 py-3 font-mono text-brand text-xs">{s.studentUid}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">
                                        <div className="flex items-center gap-2">
                                            {s.photoUrl ? (
                                                <img src={s.photoUrl} alt={s.fullName} className="w-7 h-7 rounded-full object-cover shrink-0" onError={e => e.currentTarget.style.display = 'none'} />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-xs shrink-0">{s.fullName?.charAt(0)}</div>
                                            )}
                                            <span>{s.fullName}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">{s.email}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{s.username}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.gender ? t(s.gender.toLowerCase()) || s.gender : '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">{s.dateOfBirth || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div>{s.sectionLabel || (s.grade ? `Grade ${s.grade}` : '—')}</div>
                                        {s.stream && <div className="text-[10px] text-purple-600 font-medium">{s.stream.replace('_', ' ')}</div>}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{s.parentName || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">{s.parentPhone || '—'}</td>
                                    <td className="px-4 py-3 text-slate-600">{s.enrollmentYear || '—'}</td>
                                    <td className="px-4 py-3 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                        <button className="text-xs text-brand hover:underline"
                                            onClick={() => setModal({ mode: 'edit', student: s })}>{t('edit')}</button>
                                        <button className="text-xs text-red-500 hover:underline"
                                            onClick={() => setConfirmDelete(s)}>{t('delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail modal */}
            {modal?.mode === 'detail' && (
                <Modal title={t('studentDetails')} onClose={() => setModal(null)} size="lg">
                    <StudentDetailModal
                        student={modal.student}
                        sections={sections}
                        onClose={() => setModal(null)}
                        onEdit={() => setModal({ mode: 'edit', student: modal.student })}
                    />
                </Modal>
            )}

            {/* Edit modal (comprehensive form showing ALL registration info) */}
            {modal?.mode === 'edit' && (
                <Modal title={t('editStudent')} onClose={() => setModal(null)} size="xl">
                    <StudentForm
                        initial={(() => {
                            const s = modal.student
                            const nameParts = (s.fullName || '').trim().split(/\s+/)
                            return {
                                firstName: s.firstName || nameParts[0] || '',
                                fatherName: s.fatherName || nameParts[1] || '',
                                grandfatherName: s.grandfatherName || nameParts[2] || '',
                                fullName: s.fullName || '',
                                email: s.email || '',
                                phone: s.phone || '',
                                dateOfBirth: s.dateOfBirth || '',
                                gender: s.gender || '',
                                region: s.region || '',
                                city: s.city || '',
                                kebele: s.kebele || '',
                                houseNo: s.houseNo || '',
                                parentName: s.parentName || '',
                                parentRelationship: s.parentRelationship || '',
                                parentPhone: s.parentPhone || '',
                                enrollmentYear: s.enrollmentYear || new Date().getFullYear(),
                                academicYear: s.academicYear || '',
                                grade: s.grade || '',
                                sectionId: s.sectionId || '',
                                stream: s.stream || s.currentStream || '',
                                enrollmentType: s.enrollmentType || '',
                                previousSchool: s.previousSchool || '',
                                grade8Score: s.grade8Score ?? '',
                                paymentMethod: s.paymentMethod || '',
                                bankTransactionRef: s.bankTransactionRef || '',
                                photoUrl: s.photoUrl || '',
                                idDocUrl: s.idDocUrl || '',
                                grade8CertificateUrl: s.grade8CertificateUrl || '',
                                releaseLetterUrl: s.releaseLetterUrl || '',
                                paymentReceiptUrl: s.paymentReceiptUrl || '',
                            }
                        })()}
                        sections={sections} onSubmit={handleSave}
                        onClose={() => setModal(null)} loading={saving} isEdit={true}
                    />
                </Modal>
            )}

            {/* Credentials modal */}
            {credentialsModal && (
                <Modal title={t('studentCredentials')} onClose={() => setCredentialsModal(null)}>
                    <CredentialsModal student={credentialsModal} onClose={() => setCredentialsModal(null)} />
                </Modal>
            )}

            {/* Delete confirm */}
            {confirmDelete && (
                <Modal title={t('confirmDelete')} onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        {t('deleteStudentConfirm')} <strong>{confirmDelete.fullName}</strong> ({confirmDelete.studentUid})?
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
                    </div>
                </Modal>
            )}

            {/* Full enrollment wizard modal */}
            {enrollModal && activeWindow && (
                <Modal title={`${t('addStudent')} — ${activeWindow.academicYear}`} onClose={() => setEnrollModal(false)} size="lg">
                    <StudentEnrollmentWizard
                        windowData={activeWindow}
                        onSuccess={() => { load() }}
                        onClose={() => setEnrollModal(false)}
                    />
                </Modal>
            )}
        </div>
    )
}
