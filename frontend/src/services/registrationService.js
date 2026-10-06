import api from './api'

// Upload directly to Cloudinary from browser using unsigned preset
// No backend roundtrip — faster, no Render timeout issues
const CLOUDINARY_CLOUD = 'komb41ew'
const UPLOAD_PRESET = 'arerti_unsigned'

const uploadDirect = async (file, folder = 'documents') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', UPLOAD_PRESET)
    formData.append('folder', `arerti/${folder}`)

    // Use correct resource type based on file mime type
    const type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : 'raw'

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${type}/upload`,
        { method: 'POST', body: formData }
    )
    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error?.message || 'Upload failed')
    }
    const data = await response.json()
    return data.secure_url
}

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

    // File upload — direct to Cloudinary from browser (no backend, no timeout)
    uploadFile: uploadDirect,

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

    // Director: postpone registration window
    postponeWindow: (windowId, payload) =>
        api.post(`/registration/windows/${windowId}/postpone`, payload).then(r => r.data),

    // Director: auto-assign students to sections by performance
    autoAssign: (grade, academicYear) =>
        api.post('/registration/auto-assign', { grade, academicYear }).then(r => r.data),
}

// Grade Entry Window service
export const gradeEntryWindowService = {
    getAll: () => api.get('/grade-entry-windows').then(r => r.data),
    getStatus: (academicYear, semester) =>
        api.get('/grade-entry-windows/status', { params: { academicYear, semester } }).then(r => r.data),
    open: (payload) => api.post('/grade-entry-windows', payload).then(r => r.data),
    postpone: (id, payload) => api.post(`/grade-entry-windows/${id}/postpone`, payload).then(r => r.data),
    close: (id) => api.post(`/grade-entry-windows/${id}/close`).then(r => r.data),
}
