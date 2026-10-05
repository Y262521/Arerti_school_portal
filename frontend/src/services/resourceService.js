import api from './api'

export const resourceService = {
    getAll: () => api.get('/resources').then(r => r.data),
    getById: (id) => api.get(`/resources/${id}`).then(r => r.data),
    upload: (formData) => api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
    remove: (id) => api.delete(`/resources/${id}`),

    /**
     * Download a resource.
     * New resources have a direct Cloudinary URL in downloadUrl field.
     * Falls back to the backend download endpoint (which redirects to Cloudinary).
     */
    download: async (resource) => {
        // If the resource has a direct Cloudinary URL, open it directly
        if (resource.downloadUrl) {
            window.open(resource.downloadUrl, '_blank', 'noopener')
            return
        }
        // Otherwise use the backend download endpoint (handles redirect)
        const downloadLink = document.createElement('a')
        downloadLink.href = `${import.meta.env.DEV
            ? '/api'
            : 'https://arerti-school-backend.onrender.com/api'}/resources/${resource.id}/download`
        downloadLink.target = '_blank'
        downloadLink.rel = 'noopener'
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
    },
}
