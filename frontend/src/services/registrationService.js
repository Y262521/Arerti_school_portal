import api from './api'

// Upload directly to Cloudinary from browser — no backend roundtrip
// Uses Cloudinary's unsigned upload preset
const CLOUDINARY_CLOUD = 'komb41ew'
const CLOUDINARY_UPLOAD_PRESET = 'arerti_unsigned'  // we'll create this preset

const uploadDirect = async (file, folder) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', `arerti/${folder}`)

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`,
        { method: 'POST', body: formData }
    )
    if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || 'Cloudinary upload failed')
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

    // File upload — direct to Cloudinary from browser (no backend roundtrip)
    uploadFile: (file, folder = 'documents') => uploadDirect(file, folder),

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
