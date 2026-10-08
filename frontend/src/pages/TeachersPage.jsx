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

const QUALIFICATIONS = [
    'Diploma', 'BSc', 'BA', 'MSc', 'MA', 'PhD', 'Dr', 'Professor', 'Other'
]

// File upload helper using Cloudinary
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

// Credentials modal after creation
function CredentialsModal({ teacher, onClose }) {
    const [copied, setCopied] = useState(false)
    const text = `Teacher: ${teacher.fullName}\nEmployee ID: ${teacher.employeeId}\nUsername: ${teacher.generatedUsername}\nPassword: ${teacher.generatedPassword}`
    const copy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                Teacher registered successfully. Share these credentials.
            </div>
            {teacher.photoUrl && (
                <img src={teacher.photoUrl} alt="Teacher" className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 mx-auto" />
            )}
            <div className="rounded-lg bg-slate-100 p-4 font-mono text-sm space-y-1">
                <p><span className="text-slate-500">Name:</span> <strong>{teacher.fullName}</strong></p>
                <p><span className="text-slate-500">Employee ID:</span> <strong>{teacher.employeeId}</strong></p>
                <p><span className="text-slate-500">Username:</span> <strong>{teacher.generatedUsername}</strong></p>
                <p><span className="text-slate-500">Password:</span> <strong>{teacher.generatedPassword}</strong></p>
                <p><span className="text-slate-500">Email:</span> <strong>{teacher.email}</strong></p>
            </div>
            <p className="text-xs text-slate-500">Password shown once only. Teacher must change on first login.</p>
            <div className="flex justify-end gap-2">
                <button className="btn-ghost" onClick={copy}>{copied ? 'Copied!' : 'Copy to Clipboard'}</button>
                <button className="btn-primary" onClick={onClose}>Done</button>
            </div>
        </div>
    )
}

// Full teacher registration form
function TeacherForm({ initial, onSubmit, onClose, loading, isEdit }) {
    const [form, setForm] = useState(initial)
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit({
            ...form,
            hireDate: form.hireDate || null,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {!isEdit && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                    Username and password will be auto-generated and shown after saving.
                </div>
            )}

            {/* Personal Info */}
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Personal Information</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">First Name *</label>
                        <input className="field" value={form.firstName || ''}
                            onChange={e => set('firstName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">Father's Name *</label>
                        <input className="field" value={form.fatherName || ''}
                            onChange={e => set('fatherName', e.target.value)} required />
                    </div>
                    <div>
                        <label className="field-label">Grandfather's Name *</label>
                        <input className="field" value={form.grandfatherName || ''}
                            onChange={e => set('grandfatherName', e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                        <label className="field-label">Gender *</label>
                        <select className="field" value={form.gender || ''}
                            onChange={e => set('gender', e.target.value)} required>
                            <option value="">-- Select --</option>
                            <option>Male</option><option>Female</option>
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Date of Birth</label>
                        <input className="field" type="date" value={form.dateOfBirth || ''}
                            onChange={e => set('dateOfBirth', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">Email *</label>
                        <input className="field" type="email" value={form.email || ''}
                            onChange={e => set('email', e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                        <label className="field-label">Region</label>
                        <select className="field" value={form.region || ''}
                            onChange={e => set('region', e.target.value)}>
                            <option value="">-- Select --</option>
                            {ETHIOPIAN_REGIONS.map(r => <option key={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">City / Woreda</label>
                        <input className="field" value={form.city || ''}
                            onChange={e => set('city', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">Kebele</label>
                        <input className="field" value={form.kebele || ''}
                            onChange={e => set('kebele', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">House No.</label>
                        <input className="field" value={form.houseNo || ''}
                            onChange={e => set('houseNo', e.target.value)} />
                    </div>
                    <div>
                        <label className="field-label">Phone</label>
                        <input className="field" value={form.phone || ''}
                            onChange={e => set('phone', e.target.value)}
                            placeholder="+251..." />
                    </div>
                </div>
            </div>

            {/* Professional Info */}
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Professional Information</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="field-label">Qualification *</label>
                        <select className="field" value={form.qualification || ''}
                            onChange={e => set('qualification', e.target.value)} required>
                            <option value="">-- Select --</option>
                            {QUALIFICATIONS.map(q => <option key={q}>{q}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="field-label">Specialization</label>
                        <input className="field" value={form.specialization || ''}
                            onChange={e => set('specialization', e.target.value)}
                            placeholder="e.g. Mathematics" />
                    </div>
                    <div>
                        <label className="field-label">Hire Date</label>
                        <input className="field" type="date" value={form.hireDate || ''}
                            onChange={e => set('hireDate', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Documents */}
            <div>
                <h3 className="font-semibold text-slate-700 mb-3 text-sm">Documents</h3>
                <div className="grid grid-cols-3 gap-4">
                    <FileUploadField label="Teacher Photo" folder="teacher-photos"
                        value={form.photoUrl} onChange={v => set('photoUrl', v)}
                        accept="image/jpeg,image/png" />
                    <FileUploadField label="Qualification Certificate" folder="qualifications"
                        value={form.qualificationCertUrl} onChange={v => set('qualificationCertUrl', v)}
                        accept="image/*,.pdf" />
                    <FileUploadField label="ID / Birth Certificate" folder="id-docs"
                        value={form.idDocUrl} onChange={v => set('idDocUrl', v)}
                        accept="image/*,.pdf" />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Register Teacher'}
                </button>
            </div>
        </form>
    )
}

const EMPTY = {
    firstName: '', fatherName: '', grandfatherName: '',
    gender: '', dateOfBirth: '', email: '', phone: '',
    region: '', city: '', kebele: '', houseNo: '',
    qualification: '', specialization: '', hireDate: '',
    photoUrl: '', qualificationCertUrl: '', idDocUrl: ''
}

export default function TeachersPage() {
    const { t } = useLanguage()
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [modal, setModal] = useState(null)
    const [credentialsModal, setCredentialsModal] = useState(null)
    const [search, setSearch] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try { setTeachers(await teacherService.getAll()) }
        catch { toast.error('Failed to load teachers') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleSave = async (payload) => {
        setSaving(true)
        try {
            if (modal.mode === 'add') {
                const newTeacher = await teacherService.create(payload)
                toast.success('Teacher registered')
                setModal(null)
                if (newTeacher.generatedUsername) {
                    setCredentialsModal(newTeacher)
                }
            } else {
                await teacherService.update(modal.teacher.id, payload)
                toast.success('Teacher updated')
                setModal(null)
            }
            load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Save failed')
        } finally { setSaving(false) }
    }

    const handleDelete = async (id) => {
        try {
            await teacherService.remove(id)
            toast.success('Teacher deleted')
            setConfirmDelete(null)
            load()
        } catch { toast.error('Delete failed') }
    }

    const filtered = teachers.filter(t =>
        t.fullName.toLowerCase().includes(search.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(search.toLowerCase()) ||
        (t.specialization || '').toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">{t('teachersPage')}</h1>
                    <p className="text-slate-500 mt-1">{teachers.length} staff members</p>
                </div>
                <button className="btn-primary" onClick={() => setModal({ mode: 'add' })}>
                    + Add Teacher
                </button>
            </div>

            <div className="mb-4">
                <input className="field max-w-sm" placeholder="Search by name, ID or subject..."
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="card overflow-x-auto p-0">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No teachers found.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3">Photo</th>
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Qualification</th>
                                <th className="px-4 py-3">Specialization</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(t => (
                                <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3">
                                        {t.photoUrl
                                            ? <img src={t.photoUrl} alt={t.fullName} className="w-9 h-9 rounded-full object-cover" />
                                            : <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                                                {t.fullName?.charAt(0)}
                                              </div>
                                        }
                                    </td>
                                    <td className="px-4 py-3 font-mono text-brand text-xs">{t.employeeId}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{t.fullName}</td>
                                    <td className="px-4 py-3 text-slate-600 text-xs">{t.email}</td>
                                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.username}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.qualification || 'â€”'}</td>
                                    <td className="px-4 py-3 text-slate-600">{t.specialization || 'â€”'}</td>
                                    <td className="px-4 py-3 text-right space-x-2">
                                        <button className="text-xs text-brand hover:underline"
                                            onClick={() => setModal({ mode: 'edit', teacher: t })}>
                                            Edit
                                        </button>
                                        <button className="text-xs text-red-500 hover:underline"
                                            onClick={() => setConfirmDelete(t)}>
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal.mode === 'add' ? 'Register Teacher' : 'Edit Teacher'}
                    onClose={() => setModal(null)}
                >
                    <TeacherForm
                        initial={modal.mode === 'edit' ? {
                            firstName: modal.teacher.firstName || '',
                            fatherName: modal.teacher.fatherName || '',
                            grandfatherName: modal.teacher.grandfatherName || '',
                            gender: modal.teacher.gender || '',
                            dateOfBirth: '',
                            email: modal.teacher.email || '',
                            phone: modal.teacher.phone || '',
                            region: '', city: '', kebele: '', houseNo: '',
                            qualification: modal.teacher.qualification || '',
                            specialization: modal.teacher.specialization || '',
                            hireDate: modal.teacher.hireDate || '',
                            photoUrl: modal.teacher.photoUrl || '',
                            qualificationCertUrl: modal.teacher.qualificationCertUrl || '',
                            idDocUrl: modal.teacher.idDocUrl || '',
                        } : EMPTY}
                        onSubmit={handleSave}
                        onClose={() => setModal(null)}
                        loading={saving}
                        isEdit={modal.mode === 'edit'}
                    />
                </Modal>
            )}

            {credentialsModal && (
                <Modal title="Teacher Login Credentials" onClose={() => setCredentialsModal(null)}>
                    <CredentialsModal
                        teacher={credentialsModal}
                        onClose={() => setCredentialsModal(null)}
                    />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">
                        Delete teacher <strong>{confirmDelete.fullName}</strong> ({confirmDelete.employeeId})?
                        This will also remove their login account.
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
