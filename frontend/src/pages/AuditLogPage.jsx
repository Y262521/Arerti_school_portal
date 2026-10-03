import { useEffect, useState } from 'react'
import { auditService } from '../services/auditService'
import toast from 'react-hot-toast'

const ENTITY_OPTS = ['', 'AUTH', 'STUDENT', 'TEACHER', 'RESOURCE', 'PARENT_LINK', 'NOTICE']

const ACTION_BADGE = {
    LOGIN: 'bg-green-100 text-green-700',
    LOGIN_FAILED: 'bg-red-100 text-red-700',
    REGISTER: 'bg-blue-100 text-blue-700',
    CREATE: 'bg-blue-100 text-blue-700',
    UPDATE: 'bg-yellow-100 text-yellow-700',
    DELETE: 'bg-red-100 text-red-700',
    UPLOAD: 'bg-blue-100 text-blue-700',
    DOWNLOAD: 'bg-slate-100 text-slate-600',
    LINK: 'bg-green-100 text-green-700',
    UNLINK: 'bg-slate-100 text-slate-600',
}

export default function AuditLogPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(0)
    const [entityType, setEntityType] = useState('')

    const load = async (p = page, et = entityType) => {
        setLoading(true)
        try { setData(await auditService.getPage(p, 25, et)) }
        catch { toast.error('Failed to load audit logs') }
        finally { setLoading(false) }
    }

    useEffect(() => { load(0, entityType); setPage(0) }, [entityType])

    const goPage = (p) => { setPage(p); load(p, entityType) }

    return (
        <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="font-display text-2xl font-bold text-slate-900">Audit Log</h1>
                    <p className="text-slate-500 mt-1">
                        {data ? `${data.totalElements} events` : 'System activity trail'}
                    </p>
                </div>
                <select className="field w-auto" value={entityType} onChange={e => setEntityType(e.target.value)}>
                    {ENTITY_OPTS.map(e => <option key={e} value={e}>{e || 'All entity types'}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="card p-8 text-center text-slate-500">Loading…</div>
            ) : !data || data.content.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">No audit events yet.</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
                            <tr>
                                <th className="text-left px-4 py-3">When</th>
                                <th className="text-left px-4 py-3">Actor</th>
                                <th className="text-left px-4 py-3">Action</th>
                                <th className="text-left px-4 py-3">Entity</th>
                                <th className="text-left px-4 py-3">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.content.map(log => (
                                <tr key={log.id}>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-800">{log.actorUsername}</div>
                                        <div className="text-xs text-slate-400">{log.actorRole}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ACTION_BADGE[log.action] || 'bg-slate-100 text-slate-600'}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                                        {log.entityType}{log.entityId ? ` #${log.entityId}` : ''}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{log.details}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {data && data.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-4">
                    <button className="btn-ghost text-xs" disabled={data.first} onClick={() => goPage(page - 1)}>
                        ← Prev
                    </button>
                    <span className="text-xs text-slate-500">Page {page + 1} of {data.totalPages}</span>
                    <button className="btn-ghost text-xs" disabled={data.last} onClick={() => goPage(page + 1)}>
                        Next →
                    </button>
                </div>
            )}
        </div>
    )
}
