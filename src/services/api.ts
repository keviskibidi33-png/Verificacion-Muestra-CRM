import axios from 'axios'
import { mockApiService } from './mockApi'
import { databaseService } from './databaseService'

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Interceptor para agregar el token de autenticación
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Solicita un token fresco al parent window (crm-geofal) vía postMessage.
 * Resuelve el aislamiento de localStorage entre dominios en la arquitectura micro-frontend.
 * Timeout: 3 segundos.
 */
const requestTokenFromParent = (): Promise<string | null> => {
    return new Promise((resolve) => {
        if (window.parent === window) {
            // No estamos en iframe, no hay parent que responda
            resolve(null);
            return;
        }

        const requestId = `token-req-${Date.now()}`;
        const timeout = setTimeout(() => {
            window.removeEventListener('message', handler);
            resolve(null);
        }, 3000);

        const handler = (event: MessageEvent) => {
            const d = event.data;
            if (
                d &&
                (d.type === 'SET_TOKEN' || d.type === 'TOKEN_REFRESH' || d.type === 'AUTH_TOKEN') &&
                d.token
            ) {
                clearTimeout(timeout);
                window.removeEventListener('message', handler);
                localStorage.setItem('token', d.token);
                resolve(d.token);
            }
        };

        window.addEventListener('message', handler);
        // Enviar petición al parent
        window.parent.postMessage(
            { type: 'TOKEN_REFRESH_REQUEST', requestId, source: 'verificacion-crm' },
            '*'
        );
    });
};


// Interceptor de respuesta: maneja errores de red y 401 con refresh automático
let _isRefreshing = false;
let _pendingRetries: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si es error de conexión, usar mock
        if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
            console.log('Backend no disponible, usando datos mock');
            return Promise.reject({ useMock: true, originalError: error });
        }

        // Si es 401 y no es un reintento ya hecho
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (_isRefreshing) {
                // Esperar al token que otro reintento ya está solicitando
                return new Promise((resolve, reject) => {
                    _pendingRetries.push((token) => {
                        if (token) {
                            originalRequest.headers.Authorization = `Bearer ${token}`;
                            resolve(api(originalRequest));
                        } else {
                            reject(error);
                        }
                    });
                });
            }

            _isRefreshing = true;
            console.warn('[API] 401 recibido — solicitando token fresco al parent...');

            try {
                const freshToken = await requestTokenFromParent();

                if (freshToken) {
                    console.log('[API] Token fresco recibido, reintentando petición...');
                    // Notificar a peticiones en espera
                    _pendingRetries.forEach((cb) => cb(freshToken));
                    _pendingRetries = [];
                    // Reintentar la petición original con el nuevo token
                    originalRequest.headers.Authorization = `Bearer ${freshToken}`;
                    return api(originalRequest);
                } else {
                    console.error('[API] No se pudo obtener token fresco del parent');
                    _pendingRetries.forEach((cb) => cb(null));
                    _pendingRetries = [];
                }
            } finally {
                _isRefreshing = false;
            }
        }

        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

// Tipos de datos
export interface OrdenTrabajo {
    id: number
    numero_ot: string
    numero_recepcion: string
    referencia?: string
    codigo_laboratorio: string
    version: string
    fecha_creacion: string
    fecha_recepcion?: string
    fecha_inicio_programado?: string
    fecha_inicio_real?: string
    fecha_fin_programado?: string
    fecha_fin_real?: string
    plazo_entrega_dias?: number
    duracion_real_dias?: number
    observaciones?: string
    aperturada_por?: string
    designada_a?: string
    estado: string
    items: ItemOrden[]
    muestras?: MuestraConcreto[]
}

export interface MuestraConcreto {
    id: number
    item_numero: number
    codigo_muestra: string
    codigo_muestra_lem?: string
    identificacion_muestra: string
    estructura: string
    fc_kg_cm2: number
    fecha_moldeo: string
    hora_moldeo?: string
    edad: number
    fecha_rotura: string
    requiere_densidad: boolean
}

export interface ItemOrden {
    id: number
    item_numero: number
    codigo_muestra: string
    descripcion: string
    cantidad: number
    especificacion?: string
}

export type OrdenTrabajoCreate = Partial<OrdenTrabajo>

export interface RecepcionMuestraCreate {
    numero_ot: string
    numero_recepcion: string
    numero_cotizacion?: string
    // codigo_trazabilidad eliminado
    // asunto eliminado
    cliente: string
    domicilio_legal: string
    ruc: string
    persona_contacto: string
    email: string
    telefono: string
    solicitante: string
    domicilio_solicitante: string
    proyecto: string
    ubicacion: string
    fecha_recepcion?: string
    fecha_estimada_culminacion?: string
    emision_fisica: boolean
    emision_digital: boolean
    entregado_por?: string
    recibido_por?: string
    codigo_laboratorio?: string
    version?: string
    fecha_inicio_programado?: string
    fecha_inicio_real?: string
    fecha_fin_programado?: string
    fecha_fin_real?: string
    plazo_entrega_dias?: number
    duracion_real_dias?: number
    observaciones?: string
    aperturada_por?: string
    designada_a?: string
    estado?: string
    muestras: MuestraConcretoCreate[]
}

export interface MuestraConcretoCreate {
    item_numero: number
    codigo_muestra: string
    identificacion_muestra: string
    estructura: string
    fc_kg_cm2: number
    fecha_moldeo: string
    hora_moldeo?: string
    edad: number
    fecha_rotura: string
    requiere_densidad: boolean
}

export interface DashboardStats {
    total_ordenes: number
    ordenes_pendientes: number
    ordenes_completadas: number
    total_items: number
    ordenes_recientes: OrdenTrabajo[]
}

// Función helper para manejar errores y usar datos reales de la base de datos
const handleApiCall = async <T>(apiCall: () => Promise<T>, dbCall: () => Promise<T>): Promise<T> => {
    try {
        return await apiCall()
    } catch (error: any) {
        if (error.useMock) {
            console.log('Backend no disponible, usando datos reales de la base de datos')
            return await dbCall()
        }
        throw error
    }
}

// Funciones de API
export const apiService = {
    // Dashboard
    getDashboardStats: async (): Promise<DashboardStats> => {
        return handleApiCall(
            async () => {
                const response = await api.get('/api/dashboard/stats')
                return response.data
            },
            () => databaseService.getDashboardStats()
        )
    },

    // Órdenes
    getOrdenes: async (skip = 0, limit = 100): Promise<OrdenTrabajo[]> => {
        return handleApiCall(
            async () => {
                const response = await api.get(`/api/recepcion/?skip=${skip}&limit=${limit}`)
                return response.data
            },
            () => databaseService.getOrdenes(skip, limit)
        )
    },

    getOrden: async (id: number): Promise<OrdenTrabajo> => {
        return handleApiCall(
            async () => {
                const response = await api.get(`/api/recepcion/${id}`)
                return response.data
            },
            () => databaseService.getOrden(id)
        )
    },

    createOrden: async (orden: RecepcionMuestraCreate): Promise<RecepcionMuestraCreate> => {
        return handleApiCall(
            async () => {
                console.log('Enviando datos al backend:', orden)
                const response = await api.post('/api/recepcion/', orden)
                console.log('Recepción creada exitosamente:', response.data)
                return response.data
            },
            () => databaseService.createOrden(orden)
        )
    },

    updateOrden: async (id: number, orden: Partial<OrdenTrabajoCreate>): Promise<OrdenTrabajo> => {
        return handleApiCall(
            async () => {
                const response = await api.put(`/api/recepcion/${id}`, orden)
                return response.data
            },
            () => databaseService.updateOrden(id, orden)
        )
    },

    deleteOrden: async (id: number): Promise<void> => {
        return handleApiCall(
            async () => {
                await api.delete(`/api/recepcion/${id}`)
            },
            () => databaseService.deleteOrden(id)
        )
    },

    // Excel
    uploadExcel: async (file: File): Promise<{ message: string; orden_id: number }> => {
        return handleApiCall(
            async () => {
                const formData = new FormData()
                formData.append('file', file)

                const response = await api.post('/api/excel/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                })
                return response.data
            },
            () => mockApiService.uploadExcel(file)
        )
    },

    downloadTemplate: async (ordenId: number): Promise<Blob> => {
        return handleApiCall(
            async () => {
                const response = await api.get(`/api/excel/template/${ordenId}`, {
                    responseType: 'blob',
                })
                return response.data
            },
            () => mockApiService.downloadTemplate(ordenId)
        )
    },

    exportOrdenes: async (ordenIds: number[]): Promise<Blob> => {
        return handleApiCall(
            async () => {
                const response = await api.post('/api/excel/export', { orden_ids: ordenIds }, {
                    responseType: 'blob',
                })
                return response.data
            },
            () => mockApiService.exportOrdenes(ordenIds)
        )
    },

    // Función para Excel

    downloadExcel: async (recepcionId: number): Promise<Blob> => {
        const response = await api.get(`/api/recepcion/${recepcionId}/excel`, {
            responseType: 'blob'
        })
        return response.data
    },

    // Búsqueda
    searchOrdenes: async (termino: string): Promise<OrdenTrabajo[]> => {
        return handleApiCall(
            async () => {
                const response = await api.get(`/api/recepcion/search?q=${encodeURIComponent(termino)}`)
                return response.data
            },
            () => databaseService.searchOrdenes(termino)
        )
    },

    // Verificaciones de Muestras
    getVerificacion: async (id: number): Promise<any> => {
        const response = await api.get(`/api/verificacion/${id}`)
        return response.data
    },

    createVerificacion: async (data: any): Promise<any> => {
        const response = await api.post('/api/verificacion/', data)
        return response.data
    },

    updateVerificacion: async (id: number, data: any): Promise<any> => {
        const response = await api.put(`/api/verificacion/${id}`, data)
        return response.data
    },

    getVerificaciones: async (skip = 0, limit = 100): Promise<any[]> => {
        const response = await api.get(`/api/verificacion/?skip=${skip}&limit=${limit}`)
        return response.data
    },

    deleteVerificacion: async (id: number): Promise<void> => {
        await api.delete(`/api/verificacion/${id}`)
    },

    downloadFile: (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    },

    checkStatus: async (numero: string): Promise<any> => {
        const response = await api.get(`/api/tracing/validate/${numero}`)
        return response.data
    },

    getSuggestions: async (q: string): Promise<any[]> => {
        const response = await api.get(`/api/tracing/suggest?q=${encodeURIComponent(q)}`)
        return response.data
    }
}

// Exportar funciones individuales para facilitar el uso
export const {
    getOrdenes,
    getOrden,
    createOrden,
    updateOrden,
    deleteOrden,
    uploadExcel,
    downloadTemplate,
    exportOrdenes,
    downloadExcel,
    getVerificacion,
    getVerificaciones,
    updateVerificacion,
    deleteVerificacion,
    downloadFile,
    checkStatus
} = apiService
