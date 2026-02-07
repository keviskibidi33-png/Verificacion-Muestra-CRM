import { OrdenTrabajo, RecepcionMuestraCreate, DashboardStats } from './api'

const PROXY_URL = 'http://localhost:3001/api/db'

export const databaseService = {
    // Dashboard
    getDashboardStats: async (): Promise<DashboardStats> => {
        try {
            const response = await fetch(`${PROXY_URL}/stats`)
            if (!response.ok) throw new Error('Error obteniendo stats del proxy')
            return await response.json()
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error)
            return {
                total_ordenes: 0,
                ordenes_pendientes: 0,
                ordenes_completadas: 0,
                total_items: 0,
                ordenes_recientes: []
            }
        }
    },

    // Órdenes
    getOrdenes: async (skip = 0, limit = 100): Promise<OrdenTrabajo[]> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes?skip=${skip}&limit=${limit}`)
            if (!response.ok) throw new Error('Error listando órdenes del proxy')
            return await response.json()
        } catch (error) {
            console.error('Error obteniendo órdenes:', error)
            return []
        }
    },

    getOrden: async (id: number): Promise<OrdenTrabajo> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes/${id}`)
            if (!response.ok) throw new Error('Error obteniendo orden del proxy')
            return await response.json()
        } catch (error) {
            console.error('Error obteniendo orden:', error)
            throw error
        }
    },

    createOrden: async (orden: RecepcionMuestraCreate): Promise<any> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orden)
            })
            if (!response.ok) throw new Error('Error creando orden en el proxy')
            return await response.json()
        } catch (error) {
            console.error('Error creando orden:', error)
            throw error
        }
    },

    updateOrden: async (id: number, orden: Partial<RecepcionMuestraCreate>): Promise<any> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orden)
            })
            if (!response.ok) throw new Error('Error actualizando orden en el proxy')
            return await response.json()
        } catch (error) {
            console.error('Error actualizando orden:', error)
            throw error
        }
    },

    deleteOrden: async (id: number): Promise<void> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes/${id}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Error eliminando orden en el proxy')
        } catch (error) {
            console.error('Error eliminando orden:', error)
            throw error
        }
    },

    // Búsqueda
    searchOrdenes: async (termino: string): Promise<OrdenTrabajo[]> => {
        try {
            const response = await fetch(`${PROXY_URL}/ordenes/search?q=${encodeURIComponent(termino)}`)
            if (!response.ok) throw new Error('Error buscando órdenes en el proxy')
            return await response.json()
        } catch (error) {
            console.error('Error buscando órdenes:', error)
            return []
        }
    }
}
