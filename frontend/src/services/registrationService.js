import api from './api'

export const registrationService = {
    // Director
    getWindows: () => api.get('/registration/windows').then(r => r.data),
    getWindow: (id) => api.get(`/registration/windows/${id}`).then(r => r.data),
    openWindow: (payload) => api.post('/registration/windows', payload).then(r => r.data),
    closeWindow: (id) => api.post(`/registration/windows/${id}/close`).then(r => r.data),
    assignTeacher: (windowId, payload) =>
        api.post(`/registration/windows/${windowId}/assign`, payload).then(r => r.data),
    removeAssignment: (id) => api.delete(`/registration/assignments/${id}`),
    getEnrollments: (windowId) =>
        api.get(`/registration/windows/${windowId}/enrollments`).then(r => r.data),

    // File upload — returns { url: "https://res.cloudinary.com/..." }
    uploadFile: (file, folder = 'documents') => {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('folder', folder)
        return api.post('/registration/upload', fd, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(r => r.data.url)
    },

    // Teacher
    getMyWindow: () => api.get('/registration/my-window').then(r => r.data).catch(() => null),
    getPassStatus: (grade, previousAcademicYear, newAcademicYear) =>
        api.get('/registration/pass-status', {
            params: { grade, previousAcademicYear, newAcademicYear }
        }).then(r => r.data),
    enrollFull: (windowId, payload) =>
        api.post(`/registration/windows/${windowId}/enroll`, payload).then(r => r.data),
    enrollExisting: (windowId, payload, previousAcademicYear) =>
        api.post(`/registration/windows/${windowId}/enroll-existing`, payload, {
            params: { previousAcademicYear }
        }).then(r => r.data),
}
