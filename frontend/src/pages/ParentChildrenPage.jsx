import { useEffect, useState } from 'react'
import { parentService } from '../services/parentService'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'

function LinkForm({ onSubmit, onClose, loading }) {
    const [studentUid, setStudentUid] = useState('')
    const [relationship, setRelationship] = useState('')

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit({ studentUid, relationship }) }} className="space-y-3">
            <div>
                <label className="field-label">Student UID *</label>
                <input
                    className="field"
                    placeholder="e.g. STU-2026-001"
                    value={studentUid}
                    onChange={e => setStudentUid(e.target.value)}
                    required
                />
                <p className="text-xs text-slate-400 mt-1">
                    Get this ID from the school office or your child's enrollment letter.
                </p>
            </div>
            <div>
                <label className="field-label">Relationship</label>
                <input
                    className="field"
                    placeholder="e.g. Mother, Father, Guardian"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value)}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Linking…' : 'Link Child'}
                </button>
            </div>
        </form>
    )
}

export default function ParentChildrenPage() {
    const [children, setChildren] = useState([])
    const [loading, setLoading] = useState(true)
    const [linking, setLinking] = useState(false)
    const [modal, setModal] = useState(false)
    const [confirmUnlink, setConfirmUnlink] = useState(null)

    const load = async () => {
        setLoading(true)
        try { setChildren(await parentService.getChildren()) }
        catch { toast.error('Failed to load linked children') }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const handleLink = async (payload) => {
        setLinking(true)
        try {
            await parentService.link(payload)
            toast.success('Child linked')
            setModal(false); load()
        } catch (err) {
            toast.error(err.response?.data?.message || 'Could not link — check the Student UID')
        } finally { setLinking(false) }
    }

    const handleUnlink = async (linkId) => {
        try {
            await parentService.unlink(linkId)
            toast.success('Child unlinked')
            setConfirmUnlink(null); load()
        } catch { toast.error('Unlink failed') }
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">My Children</h1>
                    <p className="text-slate-500 mt-1">{children.length} linked</p>
                </div>
                <button className="btn-primary" onClick={() => setModal(true)}>
                    + Link a Child
                </button>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : children.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                    No children linked yet. Use the Student UID given to you by the school office to link your child.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {children.map(c => (
                        <div key={c.linkId} className="card flex flex-col">
                            <h3 className="font-semibold text-slate-900">{c.studentFullName}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{c.studentUid}</p>
                            {c.sectionLabel && (
                                <p className="text-sm text-slate-600 mt-1">{c.sectionLabel}</p>
                            )}
                            {c.relationship && (
                                <p className="text-xs text-slate-400 mt-1">Relationship: {c.relationship}</p>
                            )}
                            <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                                <button className="text-xs text-red-500 hover:underline"
                                    onClick={() => setConfirmUnlink(c)}>
                                    Unlink
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modal && (
                <Modal title="Link a Child" onClose={() => setModal(false)}>
                    <LinkForm onSubmit={handleLink} onClose={() => setModal(false)} loading={linking} />
                </Modal>
            )}

            {confirmUnlink && (
                <Modal title="Confirm Unlink" onClose={() => setConfirmUnlink(null)}>
                    <p className="text-slate-700">
                        Unlink <strong>{confirmUnlink.studentFullName}</strong> ({confirmUnlink.studentUid}) from your account?
                    </p>
                    <div className="flex justify-end gap-2 mt-4">
                        <button className="btn-ghost" onClick={() => setConfirmUnlink(null)}>Cancel</button>
                        <button className="btn-danger" onClick={() => handleUnlink(confirmUnlink.linkId)}>Unlink</button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
