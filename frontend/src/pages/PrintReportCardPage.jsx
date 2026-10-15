import { useEffect, useState } from 'react'
import { reportCardService } from '../services/gradeService'

export default function PrintReportCardPage() {
    const params = new URLSearchParams(window.location.search)
    const studentId   = params.get('studentId')
    const term        = params.get('term')
    const academicYear = params.get('academicYear')
    const [data, setData]   = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!studentId || !term || !academicYear) {
            setError('Missing parameters.')
            return
        }
        reportCardService.get(Number(studentId), Number(term), academicYear)
            .then(d => {
                setData(d)
                setTimeout(() => window.print(), 400)
            })
            .catch(() => setError('Failed to load report card. You may need to be logged in.'))
    }, [])

    if (error) return <div style={{ padding: 32, color: 'red', fontFamily: 'Arial, sans-serif' }}>{error}</div>
    if (!data)  return <div style={{ padding: 32, fontFamily: 'Arial, sans-serif' }}>Loading…</div>

    // data.grades is List<GradeEntryResponse> from the backend DTO
    const grades = data.grades || []
    const avg = data.average != null ? data.average.toFixed(1) : '—'
    const passed = data.passed

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            maxWidth: 700,
            margin: '0 auto',
            padding: 40,
            background: '#fff',
            color: '#000',
        }}>
            <style>{`
                @media print {
                    body { margin: 0; }
                    button { display: none !important; }
                }
                * { box-sizing: border-box; }
            `}</style>

            {/* School header */}
            <div style={{ textAlign: 'center', marginBottom: 24, borderBottom: '2px solid #000', paddingBottom: 16 }}>
                <div style={{ fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5 }}>
                    Arerti General Secondary &amp; Preparatory School
                </div>
                <div style={{ fontSize: 14, color: '#444', marginTop: 4 }}>Student Report Card</div>
            </div>

            {/* Student info */}
            <table style={{ width: '100%', marginBottom: 20, fontSize: 13, borderCollapse: 'collapse' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '3px 0', width: '50%' }}>
                            <strong>Name:</strong> {data.studentName || '—'}
                        </td>
                        <td style={{ padding: '3px 0' }}>
                            <strong>UID:</strong> {data.studentUid || '—'}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Section:</strong> {data.sectionLabel || '—'}
                        </td>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Academic Year:</strong> {data.academicYear || academicYear}
                        </td>
                    </tr>
                    <tr>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Semester:</strong> {data.term || term}
                        </td>
                        <td style={{ padding: '3px 0' }}>
                            <strong>Attendance:</strong>{' '}
                            {data.presentDays != null ? `${data.presentDays}/${data.totalDays} days` : '—'}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* Grades table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                <thead>
                    <tr style={{ background: '#f0f0f0' }}>
                        <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left' }}>Subject</th>
                        <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>Score /100</th>
                        <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>Grade</th>
                        <th style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>Result</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.map((g, i) => (
                        <tr key={i}>
                            <td style={{ border: '1px solid #ccc', padding: '5px 10px' }}>{g.subjectName || '—'}</td>
                            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'center' }}>
                                {g.score != null ? g.score.toFixed(1) : '—'}
                            </td>
                            <td style={{ border: '1px solid #ccc', padding: '5px 10px', textAlign: 'center' }}>
                                {g.grade || '—'}
                            </td>
                            <td style={{
                                border: '1px solid #ccc', padding: '5px 10px', textAlign: 'center',
                                color: g.score != null ? (g.score >= 50 ? 'green' : 'red') : 'inherit'
                            }}>
                                {g.score != null ? (g.score >= 50 ? 'Pass' : 'Fail') : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ background: '#f0f0f0', fontWeight: 'bold' }}>
                        <td style={{ border: '1px solid #ccc', padding: '6px 10px' }}>Semester Average</td>
                        <td style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>{avg}</td>
                        <td style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center' }}>
                            {data.overallGrade || '—'}
                        </td>
                        <td style={{
                            border: '1px solid #ccc', padding: '6px 10px', textAlign: 'center',
                            color: passed != null ? (passed ? 'green' : 'red') : 'inherit'
                        }}>
                            {passed != null ? (passed ? 'PASS' : 'FAIL') : '—'}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Signature line */}
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: 160, paddingTop: 4 }}>Class Teacher</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: 160, paddingTop: 4 }}>Director</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ borderTop: '1px solid #000', width: 160, paddingTop: 4 }}>Date</div>
                </div>
            </div>

            {/* Print button — hidden when printing */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                    onClick={() => window.print()}
                    style={{
                        padding: '8px 24px', cursor: 'pointer',
                        background: '#1a56db', color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: 14
                    }}
                >
                    🖨️ Print
                </button>
            </div>
        </div>
    )
}
