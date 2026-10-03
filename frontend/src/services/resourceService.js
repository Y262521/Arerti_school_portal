import api from './api'

export const resourceService = {
    getAll: () => api.get('/resources').then(r => r.data),
    getById: (id) => api.get(`/resources/${id}`).then(r => r.data),
    upload: (formData) => api.post('/resources', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),
    remove: (id) => api.delete(`/resources/${id}`),
    downloadUrl: (id) => `/api/resources/${id}/download`,
    // Fetch the file as a blob so we can attach the JWT (plain <a href> can't send auth headers)
    download: (id) => api.get(`/resources/${id}/download`, { responseType: 'blob' }),
}
