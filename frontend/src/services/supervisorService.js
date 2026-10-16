import api from './api'

export const supervisorService = {
    getAll: () => api.get('/supervisors').then(r => r.data),
    create: (payload) => api.post('/supervisors', payload).then(r => r.data),
    remove: (id) => api.delete(`/supervisors/${id}`),
    assignClass: (id, sectionId) => api.post(`/supervisors/${id}/classes`, { sectionId }).then(r => r.data),
    removeClass: (id, sectionId) => api.delete(`/supervisors/${id}/classes/${sectionId}`),
    getAssignedClasses: (id) => api.get(`/supervisors/${id}/classes`).then(r => r.data),
    getMyClasses: () => api.get('/supervisors/my-classes').then(r => r.data),
}
