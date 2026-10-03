import api from './api'

export const teacherService = {
    getAll: () => api.get('/teachers').then(r => r.data),
    getById: (id) => api.get(`/teachers/${id}`).then(r => r.data),
    create: (payload) => api.post('/teachers', payload).then(r => r.data),
    update: (id, payload) => api.put(`/teachers/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/teachers/${id}`),
}
