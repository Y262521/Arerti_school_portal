import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { teacherService } from '../services/teacherService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { registrationService } from '../services/registrationService'

const ETHIOPIAN_REGIONS = [
    'Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa',
    'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali',
    'South Ethiopia', 'Southwest Ethiopia', 'Tigray', 'Other'
]
const QUALIFICATIONS = ['Diploma', 'BSc', 'BA', 'MSc', 'MA', 'PhD', 'Dr', 'Professor', 'Other']

function FileUploadField({ label, required, folder, value, onChange, accept = 'image/*,.pdf' }) {
    const { t } = useLanguage()
    const [uploading, setUploading] = useState(false)
    const ref = useRef()
    const handleChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const url = await registrationService.uploadFile(file, folder)
            onChange(url)
            toast.success(`${label} ${t('uploaded')}`)
        } catch { toast.error(`${t('failedToUpload')} ${label}`) }
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

function CredentialsModal({ teacher, onClose }) {
    const { t } = useLanguage()
    const [copied, setCopied] = useState(false)
    const text = `Teacher: ${teacher.fullName}\nEmployee ID: ${teacher.employeeId}\nUsername: ${teacher.generatedUsername}\nPassword: ${teacher.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }
    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                {t('teacherRegisteredSuccess')}
            </div>
            {teacher.photoUrl && <img src={teacher.photoUrl} alt="Teacher" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 mx-auto" />}
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">{t('nameLabel')}:</span> <strong>{teacher.fullName}</strong></p>
                <p><span className="text-slate-500">Employee ID:</span> <strong>{teacher.employeeId}</strong></p>
                <p><span className="text-slate-500">{t('username')}:</span> <strong>{teacher.generatedUsername}</strong></p>
                <p><span className="text-slate-500">{t('password')}:</span> <strong>{teacher.generatedPassword}</strong></p>
                <p><span className="text-slate-500">{t('email')}:</span> <strong>{teacher.email}</strong></p>
            </div>
            <p className="text-xs text-slate-500">{t('passwordShownOnce')}</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={copy}>{copied ? `✓ ${t('copied')}` : t('copyToClipboard')}</button>
                <button className="btn-primary" onClick={onClose}>{t('done')}</button>
            </div>
        </div>
    )
}

// ── Teacher detail modal (shows ALL fields) ────────────────────────────────────
function TeacherDetailModal({ teacher, onClose, onEdit }) {
    const { t } = useLanguage()
    const fields = [
        ['Employee ID', teacher.employeeId],
        [t('firstName'), teacher.firstName],
        [t('fatherName'), teacher.fatherName],
        [t('grandfatherName'), teacher.grandfatherName],
        [t('fullName'), teacher.fullName],
        [t('gender'), teacher.gender ? t(teacher.gender.toLowerCase()) || teacher.gender : '—'],
        [t('email'), teacher.email],
        [t('username'), teacher.username],
        [t('phone'), teacher.phone],
        [t('region'), teacher.region],
        [t('city'), teacher.city],
        [t('kebele'), teacher.kebele],
        [t('houseNo'), teacher.houseNo],
        [t('qualification'), teacher.qualification],
        [t('specialization'), teacher.specialization],
        [t('hireDate'), teacher.hireDate],
    ]
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                {teacher.photoUrl
                    ? <img src={teacher.photoUrl} alt={teacher.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-slate-200" />
                    : <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-2xl">{teacher.fullName?.charAt(0)}</div>
                }
                <div>
                    <div className="font-semibold text-slate-900 text-lg">{teacher.fullName}</div>
                    <div className="text-xs text-slate-400 font-mono">{teacher.employeeId}</div>
                </div>
            </div>
            <dl className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {fields.map(([label, value]) => value ? (
                    <div key={label} className="flex justify-between py-2 text-sm">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="font-medium text-slate-900 text-right max-w-xs truncate">{value}</dd>
                    </div>
                ) : null)}
            </dl>
            {/* Document links */}
            {(teacher.photoUrl || teacher.qualificationCertUrl || teacher.idDocUrl) && (
                <div className="flex gap-3 flex-wrap pt-1">
                    {teacher.photoUrl && <a href={teacher.photoUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">📷 {t('teacherPhoto')}</a>}
                    {teacher.qualificationCertUrl && <a href={teacher.qualificationCertUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">📄 {t('qualificationCert')}</a>}
                    {teacher.idDocUrl && <a href={teacher.idDocUrl} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline">🪪 {t('idDocument')}</a>}
                </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
                <button className="btn-ghost" onClick={onClose}>{t('close')}</button>
                <button className="btn-primary" onClick={onEdit}>{t('edit')}</button>
            </div>
        </div>
    )
}

function TeacherForm({ initial, onSubmit, onClose, loading, isEdit }) {
    const { t } = useLanguage()
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
    const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...form, hireDate: form.hireDate || null }) }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!isEdit && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                    {t('credentialsAutoGenerated')}
                </div>
            )}
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">{t('personalInfo')}</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div><label className="field-label">{t('firstName')} *</label>
                        <input className="field" value={form.firstName || ''} onChange={e => set('firstName', e.target.value)} required /></div>
                    <div><label className="field-label">{t('fatherName')} *</label>
                        <input className="field" value={form.fatherName || ''} onChange={e => set('fatherName', e.target.value)} required /></div>
                    <div><label className="field-label">{t('grandfatherName')} *</label>
                        <input className="field" value={form.grandfatherName || ''} onChange={e => set('grandfatherName', e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div><label className="field-label">{t('gender')} *</label>
                        <select className="field" value={form.gender || ''} onChange={e => set('gender', e.target.value)} required>
                            <option value="">-- {t('selectLabel')} --</option>
                            <option value="Male">{t('male')}</option><option value="Female">{t('female')}</option>
                        </select></div>
                    <div><label className="field-label">{t('dateOfBirth')}</label>
                        <input className="field" type="date" value={form.dateOfBirth || ''} onChange={e => set('dateOfBirth', e.target.value)} /></div>
                    <div><label className="field-label">{t('email')} *</label>
                        <input className="field" type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} required /></div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div><label className="field-label">{t('region')}</label>
                        <select className="field" value={form.region || ''} onChange={e => set('region', e.target.value)}>
                            <option value="">-- {t('selectLabel')} --</option>
                            {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                        </select></div>
                    <div><label className="field-label">{t('city')}</label>
                        <input className="field" value={form.city || ''} onChange={e => set('city', e.target.value)} /></div>
                    <div><label className="field-label">{t('kebele')}</label>
                        <input className="field" value={form.kebele || ''} onChange={e => set('kebele', e.target.value)} /></div>
                    <div><label className="field-label">{t('houseNo')}</label>
                        <input className="field" value={form.houseNo || ''} onChange={e => set('houseNo', e.target.value)} /></div>
                    <div><label className="field-label">{t('phone')}</label>
                        <input className="field" value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="+251..." /></div>
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">{t('professionalInfo')}</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div><label className="field-label">{t('qualification')} *</label>
                        <select className="field" value={form.qualification || ''} onChange={e => set('qualification', e.target.value)} required>
                            <option value="">-- {t('selectLabel')} --</option>
                            {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                        </select></div>
                    <div><label className="field-label">{t('specialization')}</label>
                        <input className="field" value={form.specialization || ''} onChange={e => set('specialization', e.target.value)} placeholder="e.g. Mathematics" /></div>
                    <div><label className="field-label">{t('hireDate')}</label>
                        <input className="field" type="date" value={form.hireDate || ''} onChange={e => set('hireDate', e.target.value)} /></div>
                </div>
            </div>
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">{t('documentsSection')}</h3>
                <div className="grid grid-cols-3 gap-4">
                    <FileUploadField label={t('teacherPhoto')} folder="teacher-photos" value={form.photoUrl} onChange={v => set('photoUrl', v)} accept="image/jpeg,image/png" />
                    <FileUploadField label={t('qualificationCert')} folder="qualifications" value={form.qualificationCertUrl} onChange={v => set('qualificationCertUrl', v)} accept="image/*,.pdf" />
                    <FileUploadField label={t('idDocument')} folder="id-docs" value={form.idDocUrl} onChange={v => set('idDocUrl', v)} accept="image/*,.pdf" />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>{t('cancel')}</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? t('saving') : isEdit ? t('saveChanges') : t('registerTeacher')}
                </button>
            </div>
        </form>
    )
}

const EMPTY = {
    firstName: '', fatherName: '', grandfatherName: '', gender: '', dateOfBirth: '',
    email: '', phone: '', region: '', city: '', kebele: '', houseNo: '',
    qualification: '', specialization: '', hireDate: '',
    photoUrl: '', qualificationCertUrl: '', idDocUrl: ''
}

export default function TeachersPage() {
    const { t } = useLanguage()
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)   // { mode: 'add'|'edit'|'detail', teacher? }
    const [credentialsModal, setCredentialsModal] = useState(null)
    const [search, setSearch] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try { setTeachers(await teacherService.getAll()) }
        catch { toast.error(t('failedToLoadTeachers')) }
        finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                const newTeacher = await teacherService.create(payload)
                toast.success(t('teacherRegistered'))
                setModal(null)
                if (newTeacher.generatedUsername) setCredentialsModal(newTeacher)
            } else {
                await teacherService.update(modal.teacher.id, payload)
                toast.success(t('teacherUpdated'))
                setModal(null)
            }
            load()
        } catch (err) { toast.error(err.response?.data?.message || t('saveFailed')) }
        finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try { await teacherService.remove(id); toast.success(t('teacherDeleted')); setConfirmDelete(null); load() }
        catch { toast.error(t('deleteFailed')) }
    }

    const filtered = teachers.filter(tr =>
        tr.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        tr.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        (tr.specialization || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('teachersPage')}</h1>
                    <p className="text-slate-500 mt-1">{teachers.length} {t('staffMembers')}</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>+ {t('addTeacher')}</button>
            </div>

            <div className="mb-4">
                <input className="field max-w-sm" placeholder={`${t('search')}…`} value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? <div className="p-8 text-center text-slate-500">{t('loading')}</div>
                : filtered.length === 0 ? <div className="p-8 text-center text-slate-500">{t('noTeachersFound')}</div>
                : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-3 py-3">{t('photoLabel')}</th>
                                <th className="px-3 py-3">ID</th>
                                <th className="px-3 py-3">{t('firstName')}</th>
                                <th className="px-3 py-3">{t('fatherName')}</th>
                                <th className="px-3 py-3">{t('grandfatherName')}</th>
                                <th className="px-3 py-3">{t('gender')}</th>
                                <th className="px-3 py-3">{t('dateOfBirth')}</th>
                                <th className="px-3 py-3">{t('email')}</th>
                                <th className="px-3 py-3">{t('username')}</th>
                                <th className="px-3 py-3">{t('phone')}</th>
                                <th className="px-3 py-3">{t('region')}</th>
                                <th className="px-3 py-3">{t('city')}</th>
                                <th className="px-3 py-3">{t('kebele')}</th>
                                <th className="px-3 py-3">{t('houseNo')}</th>
                                <th className="px-3 py-3">{t('qualification')}</th>
                                <th className="px-3 py-3">{t('specialization')}</th>
                                <th className="px-3 py-3">{t('hireDate')}</th>
                                <th className="px-3 py-3 text-right">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(tr => (
                                <tr key={tr.id} className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                                    onClick={() => setModal({ mode: 'detail', teacher: tr })}>
                                    <td className="px-3 py-3">
                                        {tr.photoUrl
                                            ? <img src={tr.photoUrl} alt={tr.fullName} className="w-9 h-9 rounded-full object-cover" />
                                            : <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">{tr.fullName?.charAt(0)}</div>
                                        }
                                    </td>
                                    <td className="px-3 py-3 font-mono text-brand text-xs">{tr.employeeId}</td>
                                    <td className="px-3 py-3 font-medium text-slate-900">{tr.firstName || tr.fullName?.split(' ')[0]}</td>
                                    <td className="px-3 py-3 text-slate-700">{tr.fatherName || '—'}</td>
                                    <td className="px-3 py-3 text-slate-700">{tr.grandfatherName || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600">{tr.gender ? t(tr.gender.toLowerCase()) || tr.gender : '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.dateOfBirth || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.email}</td>
                                    <td className="px-3 py-3 font-mono text-xs text-slate-500">{tr.username}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.phone || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600">{tr.region || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.city || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.kebele || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.houseNo || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600">{tr.qualification || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600">{tr.specialization || '—'}</td>
                                    <td className="px-3 py-3 text-slate-600 text-xs">{tr.hireDate || '—'}</td>
                                    <td className="px-3 py-3 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                        <button className="text-xs text-brand hover:underline" onClick={() => setModal({ mode: 'edit', teacher: tr })}>{t('edit')}</button>
                                        <button className="text-xs text-red-500 hover:underline" onClick={() => setConfirmDelete(tr)}>{t('delete')}</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal?.mode === 'detail' && (
                <Modal title={t('teacherDetails')} onClose={() => setModal(null)}>
                    <TeacherDetailModal teacher={modal.teacher} onClose={() => setModal(null)} onEdit={() => setModal({ mode: 'edit', teacher: modal.teacher })} />
                </Modal>
            )}

            {(modal?.mode === 'add' || modal?.mode === 'edit') && (
                <Modal title={modal.mode === 'add' ? t('registerTeacher') : t('editTeacher')} onClose={() => setModal(null)}>
                    <TeacherForm
                        initial={modal.mode === 'edit' ? {
                            firstName: modal.teacher.firstName || '', fatherName: modal.teacher.fatherName || '',
                            grandfatherName: modal.teacher.grandfatherName || '', gender: modal.teacher.gender || '',
                            dateOfBirth: '', email: modal.teacher.email || '', phone: modal.teacher.phone || '',
                            region: modal.teacher.region || '', city: modal.teacher.city || '',
                            kebele: modal.teacher.kebele || '', houseNo: modal.teacher.houseNo || '',
                            qualification: modal.teacher.qualification || '', specialization: modal.teacher.specialization || '',
                            hireDate: modal.teacher.hireDate || '', photoUrl: modal.teacher.photoUrl || '',
                            qualificationCertUrl: modal.teacher.qualificationCertUrl || '', idDocUrl: modal.teacher.idDocUrl || '',
                        } : EMPTY}
                        onSubmit={handleSave} onClose={() => setModal(null)} loading={saving} isEdit={modal.mode === 'edit'}
                    />
                </Modal>
            )}

            {credentialsModal && (
                <Modal title={t('teacherCredentials')} onClose={() => setCredentialsModal(null)}>
                    <CredentialsModal teacher={credentialsModal} onClose={() => setCredentialsModal(null)} />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title={t('confirmDelete')} onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">{t('deleteTeacherConfirm')} <strong>{confirmDelete.fullName}</strong> ({confirmDelete.employeeId})?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>{t('cancel')}</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>{t('delete')}</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
