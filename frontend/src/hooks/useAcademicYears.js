import { useEffect, useState } from 'react'
import { academicYearService } from '../services/classService'

const CURRENT_YEAR = `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`

/**
 * Fetches distinct academic years from the database.
 * Falls back to [CURRENT_YEAR] if the request fails.
 */
export function useAcademicYears() {
    const [years, setYears] = useState([CURRENT_YEAR])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        academicYearService.getAll()
            .then(data => setYears(data.length > 0 ? data : [CURRENT_YEAR]))
            .catch(() => setYears([CURRENT_YEAR]))
            .finally(() => setLoading(false))
    }, [])

    return { years, loading }
}
