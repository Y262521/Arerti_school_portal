import api from './api'

export const studentService = {
    getAll: () => api.get('/students').then(r => r.data),
    getMe: () => api.get('/students/me').then(r => r.data),
    getById: (id) => api.get(`/students/${id}`).then(r => r.data),
    create: (payload) => api.post('/students', payload).then(r => r.data),
    update: (id, payload) => api.put(`/students/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/students/${id}`),
}
