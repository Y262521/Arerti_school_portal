import api from './api'

export const classService = {
    getAll: () => api.get('/classes').then(r => r.data),
    getMyClasses: () => api.get('/classes/my-classes').then(r => r.data),
    getById: (id) => api.get(`/classes/${id}`).then(r => r.data),
    create: (payload) => api.post('/classes', payload).then(r => r.data),
    update: (id, payload) => api.put(`/classes/${id}`, payload).then(r => r.data),
    remove: (id) => api.delete(`/classes/${id}`),

    // Subject-teacher assignments for a class
    getAssignments: (sectionId) => api.get(`/classes/${sectionId}/assignments`).then(r => r.data),
    getAllAssignments: (sectionId) => api.get(`/classes/${sectionId}/assignments/all`).then(r => r.data),
    assignTeacher: (sectionId, payload) => api.put(`/classes/${sectionId}/assignments`, payload).then(r => r.data),

    // End of year
    endTerm: (academicYear) => api.post('/classes/end-term', null, { params: { academicYear } }).then(r => r.data),
}

export const curriculumService = {
    get: (grade, stream) => api.get(`/curriculum/${grade}`, { params: stream ? { stream } : {} }).then(r => r.data),
    addSubject: (grade, subjectId, stream) =>
        api.post(`/curriculum/${grade}/subjects`, null, {
            params: stream ? { subjectId, stream } : { subjectId }
        }).then(r => r.data),
    removeSubject: (grade, subjectId, stream) =>
        api.delete(`/curriculum/${grade}/subjects/${subjectId}`,
            { params: stream ? { stream } : {} }),
}
