import { useLanguage } from '../context/LanguageContext'

export default function Modal({ title, onClose, children, size = 'md' }) {
    const { lang, toggleLang } = useLanguage()

    const maxWidthClass = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    }[size] || 'max-w-lg'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className={`bg-white rounded-xl shadow-xl w-full ${maxWidthClass} max-h-[90vh] flex flex-col`}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 gap-3">
                    <h2 className="font-display font-semibold text-lg text-slate-900 flex-1 min-w-0 truncate">
                        {title}
                    </h2>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* Language toggle — always visible inside modals */}
                        <button
                            onClick={toggleLang}
                            className="text-xs font-semibold px-2 py-1 rounded border border-slate-200 hover:border-brand hover:text-brand transition"
                            title="Switch language / ቋንቋ ቀይር"
                        >
                            {lang === 'en' ? '🇪🇹 አማ' : '🇬🇧 EN'}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                </div>
                <div className="overflow-y-auto px-6 py-4 flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
