import { useState, useRef, useEffect } from 'react'

/**
 * Searchable/filterable select component.
 * Replaces <select> with a text input that filters options as you type.
 *
 * Props:
 *   options: [{ value, label }]
 *   value: current selected value
 *   onChange: (value) => void
 *   placeholder: string shown when empty
 *   className: extra classes for the input
 */
export default function SearchSelect({ options = [], value, onChange, placeholder = 'Search…', className = '' }) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    // When value changes externally, sync the display label
    const selectedLabel = options.find(o => String(o.value) === String(value))?.label ?? ''

    // Close on outside click
    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const filtered = query.trim()
        ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
        : options

    const handleSelect = (opt) => {
        onChange(opt.value)
        setQuery('')
        setOpen(false)
    }

    const handleClear = (e) => {
        e.stopPropagation()
        onChange('')
        setQuery('')
        setOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={ref}>
            <div className="relative">
                <input
                    type="text"
                    className="field pr-8"
                    placeholder={open ? placeholder : (selectedLabel || placeholder)}
                    value={open ? query : (query || '')}
                    onFocus={() => { setOpen(true); setQuery('') }}
                    onChange={e => { setQuery(e.target.value); setOpen(true) }}
                    autoComplete="off"
                />
                {/* Show selected label as overlay when closed */}
                {!open && selectedLabel && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-900 pointer-events-none truncate max-w-[calc(100%-2rem)]">
                        {selectedLabel}
                    </span>
                )}
                {/* Clear / chevron icon */}
                <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={value ? handleClear : () => setOpen(o => !o)}
                >
                    {value
                        ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                    }
                </button>
            </div>

            {open && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-400">No results</div>
                    ) : (
                        filtered.map(opt => (
                            <button
                                key={opt.value}
                                type="button"
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-brand/5 hover:text-brand transition
                                    ${String(opt.value) === String(value) ? 'bg-brand/10 text-brand font-semibold' : 'text-slate-700'}`}
                                onClick={() => handleSelect(opt)}
                            >
                                {opt.label}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
