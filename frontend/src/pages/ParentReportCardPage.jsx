import React, { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { parentService } from '../services/parentService'
import { gradeService } from '../services/gradeService'
import { GradeHistoryTable } from './MyGradesPage'

export default function ParentReportCardPage() {
  const { t, isAmharic } = useLanguage()
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [history, setHistory] = useState([])
  const [loadingChildren, setLoadingChildren] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    parentService.getChildren()
      .then(data => {
        setChildren(data)
        if (data.length > 0) setSelectedChild(data[0])
      })
      .catch(() => {})
      .finally(() => setLoadingChildren(false))
  }, [])

  useEffect(() => {
    if (!selectedChild) return
    setLoadingHistory(true)
    gradeService.getChildGradeHistory(selectedChild.studentId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoadingHistory(false))
  }, [selectedChild])

  if (loadingChildren) return <div className="card p-8 text-center text-slate-500">{t('loading')}</div>

  if (children.length === 0) return (
    <div className="card p-8 text-center text-slate-500">
      {t('noChildrenForReportCard')}
    </div>
  )

  const latestEntry = history.length > 0 ? history[history.length - 1] : null

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">{t('reportCards')}</h1>
        <p className="text-slate-500 mt-1">{t('reportCardsSubtitle')}</p>
      </div>

      <div className="card mb-6">
        <label className="field-label">{t('childLabel')}</label>
        <select
          className="field w-56"
          value={selectedChild?.studentId ?? ''}
          onChange={e => setSelectedChild(children.find(c => String(c.studentId) === e.target.value))}
        >
          {children.map(c => (
            <option key={c.studentId} value={c.studentId}>
              {c.studentFullName} ({c.studentUid})
            </option>
          ))}
        </select>
      </div>

      {selectedChild && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-lg">
            {selectedChild.studentFullName?.charAt(0) ?? '?'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{selectedChild.studentFullName}</div>
            <div className="text-xs text-slate-500">
              {selectedChild.studentUid}
              {selectedChild.sectionLabel ? ` · ${selectedChild.sectionLabel}` : ''}
              {selectedChild.relationship ? ` · ${selectedChild.relationship}` : ''}
            </div>
          </div>
        </div>
      )}

      {loadingHistory ? (
        <div className="card p-8 text-center text-slate-500">{t('loading')}</div>
      ) : (
        <>
          <GradeHistoryTable history={history} t={t} isAmharic={isAmharic} studentId={selectedChild?.studentId} />
        </>
      )}
    </div>
  )
}
