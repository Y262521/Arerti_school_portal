import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Modal from './Modal'

export default function CameraCaptureModal({ isOpen, onClose, onCapture, title }) {
    const { t } = useLanguage()
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const fallbackInputRef = useRef(null)

    const [capturedBlob, setCapturedBlob] = useState(null)
    const [capturedDataUrl, setCapturedDataUrl] = useState('')
    const [facingMode, setFacingMode] = useState('environment') // default to back camera for docs, works on webcams too
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [startingCamera, setStartingCamera] = useState(false)

    // Stop all active tracks
    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                try { track.stop() } catch {}
            })
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }

    // Start video stream
    const startCamera = async (mode = facingMode) => {
        stopStream()
        setCameraError('')
        setStartingCamera(true)

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError(t('cameraError') || 'Camera not supported on this browser.')
            setStartingCamera(false)
            return
        }

        try {
            // Check available video devices
            try {
                const devices = await navigator.mediaDevices.enumerateDevices()
                const videoDevices = devices.filter(d => d.kind === 'videoinput')
                setHasMultipleCameras(videoDevices.length > 1)
            } catch {}

            const constraints = {
                video: {
                    facingMode: mode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            }

            let stream
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints)
            } catch (err) {
                // If specific facingMode fails, try generic video
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            }

            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play().catch(() => {})
            }
        } catch (err) {
            console.error('Camera access error:', err)
            setCameraError(t('cameraError') || 'Camera permission denied or camera unavailable.')
        } finally {
            setStartingCamera(false)
        }
    }

    useEffect(() => {
        if (isOpen && !capturedBlob) {
            startCamera(facingMode)
        } else if (!isOpen) {
            stopStream()
            setCapturedBlob(null)
            setCapturedDataUrl('')
            setCameraError('')
        }
        return () => {
            stopStream()
        }
    }, [isOpen, facingMode])

    // Capture photo from video frame
    const handleSnap = () => {
        const video = videoRef.current
        if (!video || !video.videoWidth) return

        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob((blob) => {
            if (blob) {
                setCapturedBlob(blob)
                setCapturedDataUrl(URL.createObjectURL(blob))
                stopStream()
            }
        }, 'image/jpeg', 0.92)
    }

    // Retake
    const handleRetake = () => {
        if (capturedDataUrl) {
            URL.revokeObjectURL(capturedDataUrl)
        }
        setCapturedBlob(null)
        setCapturedDataUrl('')
        startCamera(facingMode)
    }

    // Confirm photo
    const handleUsePhoto = () => {
        if (!capturedBlob) return
        const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        stopStream()
        onCapture(file)
        onClose()
    }

    // Mobile file fallback (native camera intent)
    const handleFallbackChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            stopStream()
            onCapture(file)
            onClose()
        }
    }

    const toggleFacingMode = () => {
        const nextMode = facingMode === 'environment' ? 'user' : 'environment'
        setFacingMode(nextMode)
        startCamera(nextMode)
    }

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { stopStream(); onClose() }}
            title={title || t('takePhoto')}
            maxWidth="max-w-xl"
        >
            <div className="space-y-4">
                {/* Viewport container */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-700 shadow-inner">
                    {cameraError ? (
                        <div className="p-6 text-center text-white space-y-3">
                            <span className="text-4xl block">📷</span>
                            <p className="text-sm text-red-300 font-medium">{cameraError}</p>
                            <p className="text-xs text-slate-300">
                                You can also use your device&apos;s camera directly via the button below.
                            </p>
                            <button
                                type="button"
                                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
                                onClick={() => fallbackInputRef.current?.click()}
                            >
                                📸 {t('takePhoto')} (Native Camera)
                            </button>
                        </div>
                    ) : capturedDataUrl ? (
                        <img
                            src={capturedDataUrl}
                            alt="Captured snapshot"
                            className="w-full h-full object-contain bg-black"
                        />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                            {startingCamera && (
                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs">
                                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mr-2" />
                                    Starting camera…
                                </div>
                            )}

                            {/* Switch Camera Button (if multiple cameras available) */}
                            {hasMultipleCameras && (
                                <button
                                    type="button"
                                    onClick={toggleFacingMode}
                                    title={t('switchCamera')}
                                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur border border-white/20 transition shadow"
                                >
                                    🔄
                                </button>
                            )}
                        </>
                    )}
                </div>

                {/* Hidden native camera capture input for fallback */}
                <input
                    ref={fallbackInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFallbackChange}
                />

                {/* Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => { stopStream(); onClose() }}
                    >
                        {t('cancel')}
                    </button>

                    <div className="flex items-center gap-2">
                        {capturedDataUrl ? (
                            <>
                                <button
                                    type="button"
                                    className="btn-ghost text-xs border border-slate-300"
                                    onClick={handleRetake}
                                >
                                    🔄 {t('retake')}
                                </button>
                                <button
                                    type="button"
                                    className="btn-primary text-xs py-2 px-4 shadow font-semibold"
                                    onClick={handleUsePhoto}
                                >
                                    ✓ {t('usePhoto')}
                                </button>
                            </>
                        ) : (
                            <>
                                {cameraError ? (
                                    <button
                                        type="button"
                                        className="btn-ghost text-xs"
                                        onClick={() => startCamera(facingMode)}
                                    >
                                        Try Again
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={startingCamera}
                                        className="btn-primary text-xs py-2 px-5 shadow-lg flex items-center gap-2 font-semibold"
                                        onClick={handleSnap}
                                    >
                                        📷 {t('capturePhoto')}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
