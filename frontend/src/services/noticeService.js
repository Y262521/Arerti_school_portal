import api from './api'

export const noticeService = {
    getAll: () => api.get('/notices').then(r => r.data),
    getById: (id) => api.get(`/notices/${id}`).then(r => r.data),
    create: (payload) => api.post('/notices', payload).then(r => r.data),
    update: (id, payload) => api.put(`/notices/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/notices/${id}`),
}
