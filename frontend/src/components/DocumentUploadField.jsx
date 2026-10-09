import { useRef, useState } from 'react'
import { registrationService } from '../services/registrationService'
import { useLanguage } from '../context/LanguageContext'
import CameraCaptureModal from './CameraCaptureModal'
import toast from 'react-hot-toast'

export default function DocumentUploadField({
    label,
    required,
    folder = 'documents',
    value = '',
    onChange,
    multiple = false,
    accept = 'image/*,.pdf'
}) {
    const { t } = useLanguage()
    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [isCameraOpen, setIsCameraOpen] = useState(false)

    // Parse URLs
    const urls = multiple
        ? (value || '').split(',').map(u => u.trim()).filter(Boolean)
        : (value ? [value.trim()] : [])

    // Handle single or multiple file upload from disk
    const handleFilesSelected = async (e) => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        setUploading(true)
        const toastId = toast.loading(`${t('uploading')} ${files.length > 1 ? `${files.length} files…` : '…'}`)

        try {
            const uploadedUrls = []
            for (const file of files) {
                const url = await registrationService.uploadFile(file, folder)
                uploadedUrls.push(url)
            }

            if (multiple) {
                const nextUrls = [...urls, ...uploadedUrls]
                onChange(nextUrls.join(','))
            } else {
                onChange(uploadedUrls[0])
            }
            toast.success(`${label} ${t('uploaded')}`, { id: toastId })
        } catch (err) {
            console.error('File upload failed:', err)
            toast.error(`${t('failedToUpload')} ${label}`, { id: toastId })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Handle camera snapshot capture
    const handleCameraCapture = async (file) => {
        setUploading(true)
        const toastId = toast.loading(`${t('uploading')}…`)
        try {
            const url = await registrationService.uploadFile(file, folder)
            if (multiple) {
                const nextUrls = [...urls, url]
                onChange(nextUrls.join(','))
            } else {
                onChange(url)
            }
            toast.success(`${label} ${t('uploaded')}`, { id: toastId })
        } catch (err) {
            console.error('Camera upload failed:', err)
            toast.error(`${t('failedToUpload')} ${label}`, { id: toastId })
        } finally {
            setUploading(false)
        }
    }

    // Remove single URL from list
    const handleRemove = (indexToRemove) => {
        if (multiple) {
            const nextUrls = urls.filter((_, idx) => idx !== indexToRemove)
            onChange(nextUrls.join(','))
        } else {
            onChange('')
        }
    }

    const isImage = (url) => /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(url) || url.includes('cloudinary')

    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <label className="field-label mb-0">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                {multiple && urls.length > 0 && (
                    <span className="text-[11px] text-slate-500 font-medium">
                        {urls.length} {urls.length === 1 ? 'photo' : 'photos'}
                    </span>
                )}
            </div>

            {/* List of uploaded files / thumbnails */}
            {urls.length > 0 && (
                <div className="flex flex-wrap gap-2.5 pt-1">
                    {urls.map((url, idx) => (
                        <div
                            key={idx}
                            className="relative group rounded-lg border border-slate-200 bg-white p-1 shadow-sm overflow-hidden flex items-center gap-2"
                        >
                            {isImage(url) ? (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    title="View full image"
                                    className="block"
                                >
                                    <img
                                        src={url}
                                        alt={`${label} ${idx + 1}`}
                                        className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded hover:opacity-90 transition"
                                    />
                                </a>
                            ) : (
                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="h-16 w-20 flex flex-col items-center justify-center bg-slate-50 rounded text-xs text-brand hover:underline p-1 text-center"
                                >
                                    <span className="text-lg">📄</span>
                                    <span className="truncate max-w-full text-[10px]">PDF</span>
                                </a>
                            )}

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleRemove(idx)}
                                title={t('removePhoto')}
                                className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow opacity-90 hover:opacity-100 transition"
                            >
                                ×
                            </button>

                            {multiple && (
                                <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded backdrop-blur font-mono">
                                    #{idx + 1}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Upload & Camera action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {/* File picker */}
                <button
                    type="button"
                    disabled={uploading}
                    className="btn-ghost text-xs py-1.5 px-2.5 border border-slate-200 hover:bg-slate-100 flex items-center gap-1.5"
                    onClick={() => fileInputRef.current?.click()}
                >
                    📁 {uploading ? t('uploading') : urls.length > 0 && multiple ? t('addMorePhotos') : urls.length > 0 ? t('changeFile') : t('uploadFile')}
                </button>

                {/* Live Camera capture button */}
                <button
                    type="button"
                    disabled={uploading}
                    className="btn-ghost text-xs py-1.5 px-2.5 border border-brand/30 text-brand bg-brand/5 hover:bg-brand/10 flex items-center gap-1.5 font-medium"
                    onClick={() => setIsCameraOpen(true)}
                >
                    📷 {t('takePhoto')}
                </button>

                {multiple && urls.length === 0 && (
                    <span className="text-[11px] text-slate-400 italic">
                        {t('multiplePhotosHint')}
                    </span>
                )}
            </div>

            {required && urls.length === 0 && (
                <p className="text-xs text-red-500 mt-0.5">{t('required')}</p>
            )}

            {/* Hidden file input supporting multiple files when multiple=true */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                multiple={multiple}
                className="hidden"
                onChange={handleFilesSelected}
            />

            {/* Camera modal */}
            <CameraCaptureModal
                isOpen={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onCapture={handleCameraCapture}
                title={`📷 ${t('takePhoto')}: ${label}`}
            />
        </div>
    )
}
