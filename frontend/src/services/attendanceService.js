import api from './api'

export const attendanceService = {
    getForStudent: (studentId) => api.get(`/attendance/student/${studentId}`).then(r => r.data),
    getForSection: (sectionId, date) => api.get(`/attendance/section/${sectionId}`, { params: { date } }).then(r => r.data),
    mark: (payload) => api.post('/attendance', payload).then(r => r.data),
    remove: (id) => api.delete(`/attendance/${id}`),
}
