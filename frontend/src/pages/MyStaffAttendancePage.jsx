import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { staffAttendanceService } from '../services/staffAttendanceService'

const STATUS_STYLES = {
    PRESENT: 'bg-green-100 text-green-700',
    ABSENT:  'bg-red-100 text-red-700',
    LATE:    'bg-yellow-100 text-yellow-700',
    EXCUSED: 'bg-blue-100 text-blue-700',
}

export default function MyStaffAttendancePage() {
    const { t } = useLanguage()
    const [records,  setRecords]  = useState([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState(null)

    useEffect(() => {
        staffAttendanceService.getMyAttendance()
            .then(data => setRecords(Array.isArray(data) ? data : []))
            .catch(() => setError(t('failedToLoadAttendance')))
            .finally(() => setLoading(false))
    }, [])

    const present = records.filter(r => r.status === 'PRESENT').length
    const absent  = records.filter(r => r.status === 'ABSENT').length
    const late    = records.filter(r => r.status === 'LATE').length
    const excused = records.filter(r => r.status === 'EXCUSED').length

    return (
        <div>
            <div className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">
                    {t('myStaffAttendance')}
                </h1>
                <p className="text-slate-500 mt-1">{t('myStaffAttendanceSubtitle')}</p>
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && records.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-4 text-sm">
                    <span className="text-green-600 font-medium">{present} {t('present')}</span>
                    <span className="text-red-600 font-medium">{absent} {t('absent')}</span>
                    <span className="text-yellow-600 font-medium">{late} {t('late')}</span>
                    <span className="text-blue-600 font-medium">{excused} {t('excused')}</span>
                    <span className="text-slate-500">{t('total')}: {records.length}</span>
                </div>
            )}

            {loading ? (
                <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
            ) : records.length === 0 ? (
                <div className="card p-8 text-center text-slate-500">{t('noAttendanceRecords')}</div>
            ) : (
                <div className="card overflow-x-auto p-0">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500 tracking-wide">
                                <th className="px-4 py-3 text-left">{t('dateLabel')}</th>
                                <th className="px-4 py-3 text-center">{t('statusLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('noteLabel')}</th>
                                <th className="px-4 py-3 text-left">{t('markedByLabel')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec, i) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{rec.date}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[rec.status] || 'bg-slate-100 text-slate-600'}`}>
                                            {t(rec.status?.toLowerCase()) || rec.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{rec.note || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{rec.markedBy || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
