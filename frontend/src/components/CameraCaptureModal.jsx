import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import Modal from './Modal'

export default function CameraCaptureModal({
    isOpen,
    onClose,
    onCapture,
    title,
    defaultFacingMode = 'environment'
}) {
    const { t } = useLanguage()
    const videoRef = useRef(null)
    const streamRef = useRef(null)
    const fallbackInputRef = useRef(null)
    const activeSessionRef = useRef(0)

    const [capturedBlob, setCapturedBlob] = useState(null)
    const [capturedDataUrl, setCapturedDataUrl] = useState('')
    const [facingMode, setFacingMode] = useState(defaultFacingMode)
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
    const [cameraError, setCameraError] = useState('')
    const [startingCamera, setStartingCamera] = useState(false)

    // Check if running on a mobile device where front/back cameras virtually always exist
    const isMobileDevice = () => {
        if (typeof navigator === 'undefined') return false
        return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent || '') ||
            (navigator.maxTouchPoints && navigator.maxTouchPoints > 1)
    }

    // Stop active tracks and detach video element
    const stopStream = () => {
        if (streamRef.current) {
            try {
                streamRef.current.getTracks().forEach(track => {
                    try { track.stop() } catch {}
                })
            } catch {}
            streamRef.current = null
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null
        }
    }

    // Start camera with session protection & hardware release delay
    const startCamera = async (mode = facingMode) => {
        const currentSession = ++activeSessionRef.current

        // 1. Fully release previous stream
        stopStream()
        setCameraError('')
        setStartingCamera(true)

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraError(t('cameraError'))
            setStartingCamera(false)
            return
        }

        // 2. Allow hardware camera on mobile (Android/iOS) 200ms to complete teardown
        await new Promise(resolve => setTimeout(resolve, 200))
        if (currentSession !== activeSessionRef.current) return

        // 3. Progressive constraints list from specific to generic
        const constraintCandidates = [
            {
                video: {
                    facingMode: { ideal: mode },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            },
            {
                video: {
                    facingMode: { ideal: mode }
                },
                audio: false
            },
            {
                video: {
                    facingMode: mode
                },
                audio: false
            },
            {
                video: true,
                audio: false
            }
        ]

        let stream = null
        let lastErr = null

        for (const constraints of constraintCandidates) {
            if (currentSession !== activeSessionRef.current) break
            try {
                stream = await navigator.mediaDevices.getUserMedia(constraints)
                if (stream) break
            } catch (err) {
                lastErr = err
            }
        }

        // If another session was started while getUserMedia was resolving, drop this stream
        if (currentSession !== activeSessionRef.current) {
            if (stream) {
                try { stream.getTracks().forEach(tr => tr.stop()) } catch {}
            }
            return
        }

        if (!stream) {
            console.error('All camera constraint attempts failed:', lastErr)
            setCameraError(t('cameraError'))
            setStartingCamera(false)
            return
        }

        // 4. Attach stream to video element
        streamRef.current = stream
        if (videoRef.current) {
            videoRef.current.srcObject = stream
            try {
                await videoRef.current.play()
            } catch {}
        }

        // 5. Detect if device has multiple cameras (or mobile device)
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            const videoDevices = devices.filter(d => d.kind === 'videoinput')
            setHasMultipleCameras(videoDevices.length > 1 || isMobileDevice())
        } catch {
            setHasMultipleCameras(isMobileDevice())
        }

        setStartingCamera(false)
    }

    // Effect: Handle opening, closing, and facingMode changes cleanly
    useEffect(() => {
        if (isOpen && !capturedBlob) {
            startCamera(facingMode)
        } else if (!isOpen) {
            activeSessionRef.current++
            stopStream()
            setCapturedBlob(null)
            setCapturedDataUrl('')
            setCameraError('')
            setFacingMode(defaultFacingMode)
        }

        return () => {
            activeSessionRef.current++
            stopStream()
        }
    }, [isOpen, facingMode])

    // Toggle camera between front and back safely without race conditions
    const toggleFacingMode = () => {
        if (startingCamera) return
        setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'))
        // useEffect([isOpen, facingMode]) handles the camera restart safely
    }

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

    // Retake photo
    const handleRetake = () => {
        if (capturedDataUrl) {
            try { URL.revokeObjectURL(capturedDataUrl) } catch {}
        }
        setCapturedBlob(null)
        setCapturedDataUrl('')
        startCamera(facingMode)
    }

    // Use photo
    const handleUsePhoto = () => {
        if (!capturedBlob) return
        const file = new File([capturedBlob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        activeSessionRef.current++
        stopStream()
        onCapture(file)
        onClose()
    }

    // Fallback native camera file picker
    const handleFallbackChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            activeSessionRef.current++
            stopStream()
            onCapture(file)
            onClose()
        }
    }

    if (!isOpen) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                activeSessionRef.current++
                stopStream()
                onClose()
            }}
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
                                {t('useNativeCameraHint') || "You can also use your device's camera directly via the button below."}
                            </p>
                            <button
                                type="button"
                                className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-2"
                                onClick={() => fallbackInputRef.current?.click()}
                            >
                                📸 {t('takePhoto')} ({t('nativeCamera') || 'Native Camera'})
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
                                <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center text-white text-xs gap-2">
                                    <div className="animate-spin rounded-full h-7 w-7 border-2 border-white border-t-transparent" />
                                    <span>{t('startingCamera') || 'Starting camera…'}</span>
                                </div>
                            )}

                            {/* Switch Camera Button (always on mobile or when multiple cameras detected) */}
                            {hasMultipleCameras && !capturedDataUrl && !cameraError && (
                                <button
                                    type="button"
                                    disabled={startingCamera}
                                    onClick={toggleFacingMode}
                                    title={t('switchCamera')}
                                    className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white rounded-full p-2.5 backdrop-blur border border-white/20 transition shadow disabled:opacity-50"
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
                    capture={facingMode === 'user' ? 'user' : 'environment'}
                    className="hidden"
                    onChange={handleFallbackChange}
                />

                {/* Controls */}
                <div className="flex items-center justify-between gap-3 pt-2">
                    <button
                        type="button"
                        className="btn-ghost text-xs"
                        onClick={() => {
                            activeSessionRef.current++
                            stopStream()
                            onClose()
                        }}
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
                                        {t('tryAgain') || 'Try Again'}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={startingCamera}
                                        className="btn-primary text-xs py-2 px-5 shadow-lg flex items-center gap-2 font-semibold disabled:opacity-50"
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
