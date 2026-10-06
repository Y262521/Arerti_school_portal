import api from './api'

const CLOUDINARY_CLOUD = 'komb41ew'
const UPLOAD_PRESET = 'arerti_unsigned'

// Upload file directly to Cloudinary from browser — no backend, no Invalid Signature error
const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'arerti/resources')

    // Use 'raw' for PDFs and docs, 'image' for images, 'video' for videos
    const type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : 'raw'   // PDFs, docs, pptx etc.

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${type}/upload`,
        { method: 'POST', body: formData }
    )
    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || 'Cloudinary upload failed')
    }
    const data = await response.json()
    return { url: data.secure_url, bytes: data.bytes, format: data.format }
}

export const resourceService = {
    getAll: () => api.get('/resources').then(r => r.data),
    getById: (id) => api.get(`/resources/${id}`).then(r => r.data),

    // Upload: file goes to Cloudinary first, then metadata saved via backend
    upload: async (formData) => {
        const file = formData.get('file')
        const title = formData.get('title')
        const description = formData.get('description') || ''
        const audience = formData.get('audience') || 'GENERAL'
        const subject = formData.get('subject') || ''

        // 1. Upload file to Cloudinary directly
        const { url, bytes } = await uploadToCloudinary(file)

        // 2. Save metadata to backend (no file, just the URL)
        const payload = new FormData()
        payload.append('downloadUrl', url)
        payload.append('fileName', file.name)
        payload.append('contentType', file.type || 'application/octet-stream')
        payload.append('sizeBytes', bytes || file.size)
        payload.append('title', title)
        if (description) payload.append('description', description)
        payload.append('audience', audience)
        if (subject) payload.append('subject', subject)

        return api.post('/resources/meta', payload, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data)
    },

    remove: (id) => api.delete(`/resources/${id}`),

    // Download: fetch the file and force download to disk
    download: async (resource) => {
        const url = resource.downloadUrl || resource.storedFileName
        if (!url || !url.startsWith('http')) {
            throw new Error('No download URL available for this resource')
        }
        // Fetch and create blob to force download (not open in tab)
        try {
            const response = await fetch(url)
            if (!response.ok) throw new Error('Download failed')
            const blob = await response.blob()
            const blobUrl = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = resource.fileName || resource.title || 'download'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(blobUrl)
        } catch {
            // Fallback: open in new tab if blob download fails
            window.open(url, '_blank', 'noopener')
        }
    },
}
