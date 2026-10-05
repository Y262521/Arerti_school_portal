import api from './api'

const CLOUDINARY_CLOUD = 'komb41ew'
const UPLOAD_PRESET = 'arerti_unsigned'

// Upload file directly to Cloudinary from browser — no backend, no Invalid Signature error
const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', 'arerti/resources')

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
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

    // Download: open direct Cloudinary URL — no auth needed, no 403
    download: (resource) => {
        const url = resource.downloadUrl || resource.storedFileName
        if (url && url.startsWith('http')) {
            window.open(url, '_blank', 'noopener')
        } else {
            throw new Error('No download URL available for this resource')
        }
    },
}
