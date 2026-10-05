import { useEffect, useState } from 'react'
import { resourceService } from '../services/resourceService'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

const AUDIENCE_OPTS = ['GENERAL', 'STUDENTS', 'TEACHERS', 'PARENTS']

function formatSize(bytes) {
    if (!bytes && bytes !== 0) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function UploadForm({ onSubmit, onClose, loading }) {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [audience, setAudience] = useState('GENERAL')
    const [subject, setSubject] = useState('')
    const [file, setFile] = useState(null)

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!file) { toast.error('Please choose a file'); return }
        const fd = new FormData()
        fd.append('file', file)
        fd.append('title', title)
        if (description) fd.append('description', description)
        fd.append('audience', audience)
        if (subject) fd.append('subject', subject)
        onSubmit(fd)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <div>
                <label className="field-label">Title *</label>
                <input className="field" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
                <label className="field-label">Description</label>
                <textarea className="field min-h-[80px]" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="field-label">Audience</label>
                    <select className="field" value={audience} onChange={e => setAudience(e.target.value)}>
                        {AUDIENCE_OPTS.map(a => <option key={a}>{a}</option>)}
                    </select>
                </div>
                <div>
                    <label className="field-label">Subject</label>
                    <input className="field" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" />
                </div>
            </div>
            <div>
                <label className="field-label">File *</label>
                <input
                    className="field"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                    required
                />
                <p className="text-xs text-slate-400 mt-1">Max 25 MB.</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Uploading…' : 'Upload'}
                </button>
            </div>
        </form>
    )
}

export default function ResourcesPage() {
    const { user } = useAuth()
    const canUpload = user?.role === 'ADMIN' || user?.role === 'TEACHER'
    const [resources, setResources] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [downloadingId, setDownloadingId] = useState(null)
    const [modal, setModal] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)

    const load = async () => {
        setLoading(true)
        try { setResources(await resourceService.getAll()) }
        catch { toast.error('Failed to load resources') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleUpload = async (formData) => {
        setUploading(true)
        try {
            await resourceService.upload(formData)
            toast.success('Resource uploaded')
            setModal(false); load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed')
        } finally { setUploading(false) }
    }

    const handleDownload = async (resource) => {
        setDownloadingId(resource.id)
        try {
            await resourceService.download(resource)
        } catch {
            toast.error('Download failed')
        } finally { setDownloadingId(null) }
    }

    const handleDelete = async (id) => {
        try {
            await resourceService.remove(id)
            toast.success('Resource deleted')
            setConfirmDelete(null); load()
        } catch { toast.error('Delete failed') }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Resources</h1>
                    <p className="text-slate-500 mt-1">{resources.length} files</p>
                </div>
                {canUpload && (
                    <button className="btn-primary" onClick={() => setModal(true)}>
                        + Upload Resource
                    </button>
                )}
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : resources.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">No resources yet.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map(r => (
                        <div key={r.id} className="card flex flex-col">
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-slate-900 truncate">{r.title}</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">{r.fileName} · {formatSize(r.sizeBytes)}</p>
                                </div>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {r.audience}
                                </span>
                            </div>
                            {r.description && (
                                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{r.description}</p>
                            )}
                            {r.subject && (
                                <p className="text-xs text-slate-400 mt-1">Subject: {r.subject}</p>
                            )}
                            <p className="text-xs text-slate-400 mt-2">
                                By {r.uploadedBy} · {new Date(r.createdAt).toLocaleDateString()}
                            </p>
                            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                                <button
                                    className="text-xs text-brand hover:underline font-medium"
                                    disabled={downloadingId === r.id}
                                    onClick={() => handleDownload(r)}
                                >
                                    {downloadingId === r.id ? 'Downloading…' : 'Download'}
                                </button>
                                {canUpload && (
                                    <button className="text-xs text-red-500 hover:underline"
                                        onClick={() => setConfirmDelete(r)}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <Modal title="Upload Resource" onClose={() => setModal(false)}>
                    <UploadForm onSubmit={handleUpload} onClose={() => setModal(false)} loading={uploading} />
                </Modal>
            )}

            {confirmDelete && (
                <Modal title="Confirm Delete" onClose={() => setConfirmDelete(null)}>
                    <p className="text-slate-700">Delete resource <strong>"{confirmDelete.title}"</strong>?</p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
                        <button className="btn-danger" onClick={() => handleDelete(confirmDelete.id)}>Delete</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
