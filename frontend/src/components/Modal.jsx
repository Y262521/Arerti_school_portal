export default function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <h2 className="font-display font-semibold text-lg text-slate-900">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 text-xl leading-none"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className="overflow-y-auto px-6 py-4 flex-1">
                    {children}
                </div>
            </div>
        </div>
    )
}
