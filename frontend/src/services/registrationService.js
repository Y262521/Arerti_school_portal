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

    // Teacher
    getMyWindow: () => api.get('/registration/my-window').then(r => r.data).catch(() => null),
    getPassStatus: (grade, previousAcademicYear, newAcademicYear) =>
        api.get('/registration/pass-status', {
            params: { grade, previousAcademicYear, newAcademicYear }
        }).then(r => r.data),
    enrollNew: (windowId, payload) =>
        api.post(`/registration/windows/${windowId}/enroll-new`, payload).then(r => r.data),
    reEnroll: (windowId, payload, previousAcademicYear) =>
        api.post(`/registration/windows/${windowId}/re-enroll`, payload, {
            params: { previousAcademicYear }
        }).then(r => r.data),
}
