import api from './api'

export const viceDirectorService = {
    getAll: () => api.get('/vice-directors').then(r => r.data),
    create: (payload) => api.post('/vice-directors', payload).then(r => r.data),
    update: (id, payload) => api.put(`/vice-directors/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/vice-directors/${id}`),
}
