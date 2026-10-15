import api from './api'

export const staffAttendanceService = {
    getForDate: (date) =>
        api.get('/staff-attendance', { params: { date } }).then(r => r.data),
    mark: (payload) =>
        api.post('/staff-attendance', payload).then(r => r.data),
    getMyAttendance: () =>
        api.get('/staff-attendance/my').then(r => r.data),
}
