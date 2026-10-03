import api from './api'

export const auditService = {
    getPage: (page = 0, size = 25, entityType) =>
        api.get('/audit-logs', { params: { page, size, entityType: entityType || undefined } })
            .then(r => r.data),
}
