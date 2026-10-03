import api from './api'

export const parentService = {
    getChildren: () => api.get('/parent/children').then(r => r.data),
    link: (payload) => api.post('/parent/link', payload).then(r => r.data),
    unlink: (linkId) => api.delete(`/parent/link/${linkId}`),
}
