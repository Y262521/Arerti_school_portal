import api from './api'

export const gradeService = {
    getForStudent: (studentId, academicYear) =>
        api.get(`/grades/student/${studentId}`, { params: { academicYear } }).then(r => r.data),
    getForSection: (sectionId, term, academicYear) =>
        api.get(`/grades/section/${sectionId}`, { params: { term, academicYear } }).then(r => r.data),
    upsert: (payload) => api.post('/grades', payload).then(r => r.data),
    remove: (id) => api.delete(`/grades/${id}`),
}

export const subjectService = {
    getAll: () => api.get('/subjects').then(r => r.data),
    create: (payload) => api.post('/subjects', payload).then(r => r.data),
    update: (id, payload) => api.put(`/subjects/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/subjects/${id}`),
}

export const reportCardService = {
    get: (studentId, term, academicYear) =>
        api.get(`/report-card/${studentId}`, { params: { term, academicYear } }).then(r => r.data),
}

export const regradeService = {
    // Teacher
    request: (payload) => api.post('/regrade/request', payload).then(r => r.data),
    myRequests: () => api.get('/regrade/my-requests').then(r => r.data),
    // Admin
    getAll: () => api.get('/regrade').then(r => r.data),
    getPending: () => api.get('/regrade/pending').then(r => r.data),
    approve: (id, adminNote) => api.post(`/regrade/${id}/approve`, { adminNote }).then(r => r.data),
    reject: (id, adminNote) => api.post(`/regrade/${id}/reject`, { adminNote }).then(r => r.data),
}
