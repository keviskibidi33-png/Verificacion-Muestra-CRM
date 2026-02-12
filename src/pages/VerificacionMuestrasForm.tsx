import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAutoSave } from '../hooks/useAutoSave';
import { useAutoSaveDB } from '../hooks/useAutoSaveDB';
import { apiService, api } from '../services/api';
import {
    Save, X, FileSpreadsheet, Plus, Trash2,
    CheckCircle2, ChevronLeft, Loader2, XCircle,
    Calendar, Layers, Building2
} from 'lucide-react';
import ConfirmModal from '../components/ui/ConfirmModal';

// --- Constants & Options ---

const EQUIPMENT_OPTIONS = ['-', 'EQP-0255'];

const ACCION_OPTIONS = [
    '-',
    'NEOPRENO SUPERIOR E INFERIOR',
    'NEOPRENO SUPERIOR',
    'NEOPRENO INFERIOR',
    'CAPEO SUPERIOR E INFERIOR',
    'CAPEO SUPERIOR',
    'CAPEO INFERIOR'
];

const TIPO_TESTIGO_OPTIONS = ['-', '4in x 8in', '6in x 12in'];

const CONFORMIDAD_OPTIONS = ['-', 'Ensayar', 'No Ensayar'];

// --- Types ---

interface MuestraVerificada {
    item_numero: number;
    codigo_lem: string;
    tipo_testigo: string;
    // Diámetros
    diametro_1_mm?: number | string;
    diametro_2_mm?: number | string;
    tolerancia_porcentaje?: number;
    aceptacion_diametro?: string;
    // Perpendicularidad
    perpendicularidad_sup1?: boolean;
    perpendicularidad_sup2?: boolean;
    perpendicularidad_inf1?: boolean;
    perpendicularidad_inf2?: boolean;
    perpendicularidad_medida?: boolean;
    // Planitud
    planitud_superior_aceptacion?: string;
    planitud_inferior_aceptacion?: string;
    planitud_depresiones_aceptacion?: string;
    accion_realizar?: string;
    conformidad?: string;
    // Longitud
    longitud_1_mm?: number | string;
    longitud_2_mm?: number | string;
    longitud_3_mm?: number | string;
    // Masa
    masa_muestra_aire_g?: number | string;
    pesar?: string;
}

interface VerificacionMuestrasData {
    id?: number;
    numero_verificacion: string;
    codigo_documento: string;
    version: string;
    fecha_documento: string;
    pagina: string;
    verificado_por?: string;
    fecha_verificacion?: string;
    cliente?: string;
    equipo_bernier?: string;
    equipo_lainas_1?: string;
    equipo_lainas_2?: string;
    equipo_escuadra?: string;
    equipo_balanza?: string;
    nota?: string;
    recepcion_id?: number;
    numero_ot?: string;
    muestras_verificadas: MuestraVerificada[];
}

// --- Helper Components ---

const InputField = React.memo(({ label, name, value, onChange, type = "text", placeholder = "", required = false, list }: any) => (
    <div className="group">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 ml-0.5">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            list={list}
            className="block w-full rounded-lg border-gray-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 px-3 py-2.5 shadow-sm hover:border-gray-300"
            placeholder={placeholder}
            required={required}
        />
    </div>
));

const SelectField = React.memo(({ label, name, value, onChange, options }: any) => (
    <div className="group">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 ml-0.5">
            {label}
        </label>
        <div className="relative">
            <select
                name={name}
                value={value}
                onChange={onChange}
                className="block w-full rounded-lg border-gray-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white transition-all duration-200 px-3 py-2.5 shadow-sm hover:border-gray-300 appearance-none pr-8"
            >
                {options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
            </div>
        </div>
    </div>
));
// --- Helper Functions ---

const formatDateForInput = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // If it's already YYYY-MM-DD, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    // If it's DD/MM/YYYY, convert to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateStr;
};

const formatDateForDB = (dateStr: string | undefined): string => {
    if (!dateStr) return '';
    // If it's YYYY-MM-DD, convert to DD/MM/YYYY
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // If it's already ISO or other, we might want to normalize it
    return dateStr;
};

const formatLemCode = (value: string): string => {
    if (!value) return '';
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const suffix = `-CO-${currentYear}`;
    
    // Normalize input
    let clean = value.trim().toUpperCase();
    
    // Case 1: Just digits (e.g., "1234")
    if (/^\d+$/.test(clean)) {
        return `${clean}${suffix}`;
    }
    
    // Case 2: Ends with -CO or -CO- (e.g., "1234-CO" or "1234-CO-")
    if (clean.endsWith('-CO') || clean.endsWith('-CO-')) {
        // Remove trailing - or -CO and append full suffix to be safe
        const base = clean.replace(/-CO-?$/, '');
        return `${base}${suffix}`;
    }

    // Case 3: Already has correct suffix
    if (clean.endsWith(suffix)) {
        return clean;
    }

    return clean;
};

// --- Main Component ---

const VerificacionMuestrasForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Estado de validación de trazabilidad
    const [recepcionStatus, setRecepcionStatus] = useState<{
        estado: 'idle' | 'buscando' | 'disponible' | 'ocupado';
        mensaje?: string;
        datos?: any;
        formatos?: {
            recepcion: boolean;
            verificacion: boolean;
            compresion: boolean;
        };
    }>({ estado: 'idle' });
 
    // Sugerencias para autocompletado
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
 
    // Modal Control
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type?: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    const initialData: VerificacionMuestrasData = {
        numero_verificacion: '',
        codigo_documento: 'FOR-LAB-015',
        version: '01',
        fecha_documento: new Date().toLocaleDateString('es-PE'),
        pagina: '1 de 1',
        verificado_por: '',
        fecha_verificacion: new Date().toISOString().split('T')[0],
        cliente: '',
        equipo_bernier: '-',
        equipo_lainas_1: '-',
        equipo_lainas_2: '-',
        equipo_escuadra: '-',
        equipo_balanza: '-',
        recepcion_id: undefined,
        numero_ot: '',
        muestras_verificadas: []
    };

    const [verificacionData, setVerificacionData] = useState<VerificacionMuestrasData>(initialData);

    // Buscar estado de trazabilidad
    const buscarRecepcion = useCallback(async (numero: string) => {
        if (!numero || numero.length < 2) return;

        setRecepcionStatus({ estado: 'buscando' });

        try {
            const data = await apiService.checkStatus(numero);

            if (data.exists) {
                const isRecepcionDone = data.recepcion?.status === 'completado';
                const isVerificacionDone = data.verificacion?.status === 'completado';
                const isCompresionDone = data.compresion?.status === 'completado' || data.compresion?.status === 'en_proceso';

                // Para verificación: ocupado si YA existe verificación completada
                let estadoFinal: 'ocupado' | 'disponible' = isVerificacionDone ? 'ocupado' : 'disponible';
                let mensajeFinal = isVerificacionDone
                    ? '⚠️ Verificación ya registrada'
                    : '✅ Recepción válida - Disponible para verificación';

                // Advertencia si falta recepción
                if (!isRecepcionDone) {
                    mensajeFinal = '⚠️ Atención: Falta registro de Recepción';
                }

                setRecepcionStatus({
                    estado: estadoFinal,
                    mensaje: mensajeFinal,
                    formatos: {
                        recepcion: isRecepcionDone,
                        verificacion: isVerificacionDone,
                        compresion: isCompresionDone
                    },
                    datos: data
                });

                // Auto-fill logic
                const datosBackend = data.datos || {};
                
                setVerificacionData(prev => {
                    const newData = { ...prev };
                    
                    // 1. Auto-fill Cliente & OT
                    if (datosBackend.cliente && !prev.cliente) newData.cliente = datosBackend.cliente;
                    if (datosBackend.numero_ot && !prev.numero_ot) newData.numero_ot = datosBackend.numero_ot;
                    if (datosBackend.id && !prev.recepcion_id) newData.recepcion_id = datosBackend.id;
                    
                    // 2. Auto-fill Samples (only if table is empty)
                    if (prev.muestras_verificadas.length === 0 && datosBackend.muestras && datosBackend.muestras.length > 0) {
                        const nuevasMuestras: MuestraVerificada[] = datosBackend.muestras.map((m: any, idx: number) => ({
                            item_numero: idx + 1,
                            codigo_lem: formatLemCode(m.codigo_lem || ''),
                            tipo_testigo: m.tipo_testigo || '-',
                            perpendicularidad_sup1: undefined,
                            perpendicularidad_sup2: undefined,
                            perpendicularidad_inf1: undefined,
                            perpendicularidad_inf2: undefined,
                            perpendicularidad_medida: undefined,
                            planitud_superior_aceptacion: '-',
                            planitud_inferior_aceptacion: '-',
                            planitud_depresiones_aceptacion: '-',
                            accion_realizar: '-',
                            conformidad: '-',
                            pesar: ''
                        }));
                        newData.muestras_verificadas = nuevasMuestras;
                        toast.success(`Datos importados: ${nuevasMuestras.length} muestras`);
                    }
                    
                    return newData;
                });

            } else {
                setRecepcionStatus({
                    estado: 'disponible',
                    mensaje: '✅ Número disponible para registro',
                    formatos: {
                        recepcion: false,
                        verificacion: false,
                        compresion: false
                    }
                });
            }
        } catch (error) {
            console.error('Error buscando estado:', error);
            setRecepcionStatus({
                estado: 'disponible',
                mensaje: '⚠️ Error de conexión - Verifique manualmente'
            });
        }
    }, [verificacionData.cliente]); // Keep dependency minimal to avoid loops


    useEffect(() => {
        if (id) {
            cargarVerificacion(parseInt(id));
        }
    }, [id]);

    const cargarVerificacion = async (id: number) => {
        try {
            const data = await apiService.getVerificacion(id);
            setVerificacionData({
                ...data,
                muestras_verificadas: (data.muestras_verificadas || []).map((m: any) => {
                    // Normalización robusta de cadenas
                    let normAccion = (m.accion_realizar || '-').toUpperCase().replace('CARA ', '').trim();
                    // Asegurar que coincida con las opciones o usar '-'
                    if (!ACCION_OPTIONS.includes(normAccion)) {
                        // Intentar encontrar coincidencia parcial o dejar lo que viene si es manual
                        const matched = ACCION_OPTIONS.find(opt => opt.toUpperCase() === normAccion);
                        normAccion = matched || (m.accion_realizar || '-');
                    }

                    let normConformidad = (m.conformidad || '-');
                    if (normConformidad.toUpperCase() === 'CONFORME') normConformidad = 'Ensayar';
                    else if (normConformidad.toUpperCase() === 'NO CONFORME') normConformidad = 'No Ensayar';

                    // Asegurar consistencia con opciones
                    const matchedConf = CONFORMIDAD_OPTIONS.find(opt => opt.toLowerCase() === normConformidad.toLowerCase());
                    normConformidad = matchedConf || '-';

                    return {
                        ...m,
                        // Normalize case for strings like "Cumple"
                        aceptacion_diametro: m.aceptacion_diametro?.toUpperCase(),
                        planitud_superior_aceptacion: m.planitud_superior_aceptacion?.toUpperCase(),
                        planitud_inferior_aceptacion: m.planitud_inferior_aceptacion?.toUpperCase(),
                        planitud_depresiones_aceptacion: m.planitud_depresiones_aceptacion?.toUpperCase(),
                        accion_realizar: normAccion,
                        conformidad: normConformidad,
                        // Handle legacy field mapping if needed
                        perpendicularidad_sup1: m.perpendicularidad_sup1 !== null ? m.perpendicularidad_sup1 : m.perpendicularidad_p1,
                        perpendicularidad_sup2: m.perpendicularidad_sup2 !== null ? m.perpendicularidad_sup2 : m.perpendicularidad_p2,
                        perpendicularidad_inf1: m.perpendicularidad_inf1 !== null ? m.perpendicularidad_inf1 : m.perpendicularidad_p3,
                        perpendicularidad_inf2: m.perpendicularidad_inf2 !== null ? m.perpendicularidad_inf2 : m.perpendicularidad_p4,
                        perpendicularidad_medida: m.perpendicularidad_medida !== null ? m.perpendicularidad_medida : m.perpendicularidad_cumple,
                    };
                }),
                fecha_verificacion: formatDateForInput(data.fecha_verificacion),
                equipo_bernier: data.equipo_bernier || '-',
                equipo_lainas_1: data.equipo_lainas_1 || '-',
                equipo_lainas_2: data.equipo_lainas_2 || '-',
                equipo_escuadra: data.equipo_escuadra || '-',
                equipo_balanza: data.equipo_balanza || '-',
                recepcion_id: data.recepcion_id,
                numero_ot: data.numero_ot
            });
        } catch (error) {
            console.error('Error cargando verificación:', error);
            toast.error('Error al cargar la verificación');
        }
    };

    const { clearDraft } = useAutoSave({
        storageKey: `verificacion-form-${id || 'new'}`,
        data: verificacionData,
        enabled: !id,
        onLoad: (data) => {
            if (!id && data) setVerificacionData(data);
        }
    });

    useAutoSaveDB({
        data: verificacionData,
        enabled: !!id,
        onSave: async (data) => {
            if (id) {
                await apiService.updateVerificacion(parseInt(id), data);
        setLastSaved(new Date());
            }
        },
        onError: () => toast.error('Error al guardar cambios automáticamente')
    });

    const handleNumeroVerificacionChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        setVerificacionData(prev => ({ ...prev, numero_verificacion: val }));
        
        if (val.length >= 2) {
            try {
                // Fetch suggestions using the new endpoint
                const results = await apiService.getSuggestions(val);
                setSuggestions(results);
                setShowSuggestions(results.length > 0);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (s: any) => {
        setVerificacionData(prev => ({ ...prev, numero_verificacion: s.numero_recepcion }));
        setShowSuggestions(false);
        buscarRecepcion(s.numero_recepcion);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setVerificacionData(prev => ({ ...prev, [name]: value }));
    };

    // Handler especial para numero_verificacion con validación y autocompletado de -REC
    const handleNumeroVerificacionBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        let value = e.target.value.trim();
        if (value && !id) {
            // Autocompletar con -REC si no lo tiene (y no tiene ya un año -YY al final)
            if (!value.toUpperCase().includes('-REC')) {
                // Si tiene formato NNNN-YY, insertar -REC antes del año
                if (/-\d{2}$/.test(value)) {
                    value = value.replace(/-(\d{2})$/, '-REC-$1');
                } else {
                    value = `${value}-REC`;
                }
                setVerificacionData(prev => ({ ...prev, numero_verificacion: value }));
            }
            buscarRecepcion(value);
        }
    };
    
    // Función para importar muestras desde la recepción
    const importarMuestras = async () => {
        if (!verificacionData.recepcion_id) return;
        
        try {
            toast.loading('Importando muestras...');
            const orden = await apiService.getOrden(verificacionData.recepcion_id);
            toast.dismiss();
            
            if (orden) {
                const samples = orden.muestras || orden.items || [];
                if (samples.length > 0) {
                    const nuevasMuestras: MuestraVerificada[] = samples.map((item: any, idx: number) => ({
                        item_numero: idx + 1,
                        codigo_lem: formatLemCode(item.codigo_muestra || item.codigo_muestra_lem || ''),
                        tipo_testigo: '-',
                        perpendicularidad_sup1: undefined,
                        perpendicularidad_sup2: undefined,
                        perpendicularidad_inf1: undefined,
                        perpendicularidad_inf2: undefined,
                        perpendicularidad_medida: undefined,
                        planitud_superior_aceptacion: '-',
                        planitud_inferior_aceptacion: '-',
                        planitud_depresiones_aceptacion: '-',
                        accion_realizar: '-',
                        conformidad: '-',
                        pesar: ''
                    }));
                    
                    // Formatear la fecha de recepción para que coincida con el estado del componente
                    const fechaRecepcion = orden.fecha_recepcion ? formatDateForDB(orden.fecha_recepcion) : verificacionData.fecha_verificacion;

                    setVerificacionData(prev => ({
                        ...prev,
                        fecha_verificacion: fechaRecepcion,
                        muestras_verificadas: nuevasMuestras
                    }));
                    
                    toast.success(`${nuevasMuestras.length} muestras importadas correctamente`);
                } else {
                    toast.error('No se encontraron muestras en esta recepción');
                }
            }
        } catch (error) {
            toast.dismiss();
            console.error('Error importando muestras:', error);
            toast.error('Error al importar muestras de recepción');
        }
    };

    const calculateValues = (muestra: MuestraVerificada): MuestraVerificada => {
        const m = { ...muestra };
        const parse = (val: any) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            return parseFloat(val) || 0;
        };

        const d1 = parse(m.diametro_1_mm);
        const d2 = parse(m.diametro_2_mm);

        if (d1 > 0 && d2 > 0) {
            const diff = Math.abs(d1 - d2);
            const tol = (diff / d1) * 100;
            m.tolerancia_porcentaje = parseFloat(tol.toFixed(2));
            m.aceptacion_diametro = tol <= 2.0 ? 'CUMPLE' : 'NO CUMPLE';
        } else {
            m.tolerancia_porcentaje = 0;
            m.aceptacion_diametro = '';
        }

        const l1 = parse(m.longitud_1_mm);
        const l2 = parse(m.longitud_2_mm);
        const l3 = parse(m.longitud_3_mm);

        if (d1 > 0 && d2 > 0 && l1 > 0 && l2 > 0) {
            const avgD = (d1 + d2) / 2;
            const ls = [l1, l2, l3].filter(v => v > 0);
            if (ls.length > 0) {
                const avgL = ls.reduce((a, b) => a + b, 0) / ls.length;
                const ratio = avgL / avgD;
                m.pesar = ratio < 1.75 ? 'PESAR' : 'NO PESAR';
            }
        } else {
            m.pesar = '';
        }

        return m;
    };

    const handleMuestraChange = (index: number, field: keyof MuestraVerificada, value: any) => {
        setVerificacionData(prev => {
            const nuevasMuestras = [...prev.muestras_verificadas];
            nuevasMuestras[index] = { ...nuevasMuestras[index], [field]: value };
            nuevasMuestras[index] = calculateValues(nuevasMuestras[index]);
            return { ...prev, muestras_verificadas: nuevasMuestras };
        });
    };

    // Auto-complete LEM code on blur - adds -CO-YY suffix when only digits are present
    const handleLemCodeBlur = (index: number, value: string) => {
        const formatted = formatLemCode(value);
        if (formatted !== value) {
            handleMuestraChange(index, 'codigo_lem', formatted);
        }
    };

    const addMuestra = () => {
        const item_numero = verificacionData.muestras_verificadas.length + 1;
        const nuevaMuestra: MuestraVerificada = {
            item_numero,
            codigo_lem: '',
            tipo_testigo: '-',
            perpendicularidad_sup1: undefined,
            perpendicularidad_sup2: undefined,
            perpendicularidad_inf1: undefined,
            perpendicularidad_inf2: undefined,
            perpendicularidad_medida: undefined,
            planitud_superior_aceptacion: '-',
            planitud_inferior_aceptacion: '-',
            planitud_depresiones_aceptacion: '-',
            accion_realizar: '-',
            conformidad: '-',
            pesar: ''
        };
        setVerificacionData(prev => ({
            ...prev,
            muestras_verificadas: [...prev.muestras_verificadas, nuevaMuestra]
        }));
    };

    const removeMuestra = (index: number) => {
        setVerificacionData(prev => {
            const filtered = prev.muestras_verificadas.filter((_, i) => i !== index);
            const renumbered = filtered.map((m, i) => ({ ...m, item_numero: i + 1 }));
            return { ...prev, muestras_verificadas: renumbered };
        });
    };

    const handleSubmit = async () => {
        if (!verificacionData.numero_verificacion) {
            toast.error('Número de verificación es obligatorio');
            return;
        }
        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...verificacionData,
                fecha_verificacion: formatDateForDB(verificacionData.fecha_verificacion)
            };
            if (id) {
                await apiService.updateVerificacion(parseInt(id), dataToSave);
                toast.success('Actualizado correctamente');
                // Auto-download using current ID
                await descargarExcel(parseInt(id));
            } else {
                const response = await api.post('/api/verificacion/', dataToSave);
                toast.success('Guardado correctamente');
                clearDraft();
                // Auto-download using new ID from response
                if (response.data && response.data.id) {
                     await descargarExcel(response.data.id);
                }
            }
            setTimeout(() => window.history.back(), 1000);
        } catch (error: any) {
            console.error(error);
            // Show specific error from backend if available
            const msg = error.response?.data?.detail || 'Error al guardar';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDraft = () => {
        setModalConfig({
            isOpen: true,
            title: '¿Eliminar borrador?',
            message: 'Esta acción borrará todos los datos temporales no guardados. No se puede deshacer.',
            confirmText: 'Sí, eliminar',
            type: 'danger',
            onConfirm: () => {
                clearDraft();
                setVerificacionData(initialData);
                setRecepcionStatus({ estado: 'idle' });
                setModalConfig(prev => ({ ...prev, isOpen: false }));
                toast.success('Borrador eliminado');
            }
        });
    };

    const descargarExcel = async (downloadId?: number) => {
        const targetId = downloadId || (id ? parseInt(id) : undefined);
        if (!targetId) return;
        try {
            toast.loading('Generando Excel...');
            const response = await api.get(`/api/verificacion/${targetId}/exportar`, { responseType: 'blob' });
            // Use verificacionData.numero_verificacion if available, otherwise just use generic name
            const filename = `verificacion_${verificacionData.numero_verificacion || 'export'}.xlsx`;
            apiService.downloadFile(response.data, filename);
            toast.dismiss();
        } catch (error) {
            console.error(error);
            toast.error('Error al descargar Excel');
            toast.dismiss();
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-[1920px] mx-auto">
                <datalist id="perpendicularidad-options">
                    <option value="-" />
                    <option value="CUMPLE" />
                    <option value="NO CUMPLE" />
                </datalist>
                <datalist id="planitud-options">
                    <option value="-" />
                    <option value="CUMPLE" />
                    <option value="NO CUMPLE" />
                </datalist>
                <datalist id="tipo-testigo-options">
                    {TIPO_TESTIGO_OPTIONS.map(opt => (
                        <option key={opt} value={opt} />
                    ))}
                </datalist>
                <datalist id="accion-options">
                    {ACCION_OPTIONS.map(opt => (
                        <option key={opt} value={opt} />
                    ))}
                </datalist>

                {/* Branded Confirm Modal */}
                <ConfirmModal
                    isOpen={modalConfig.isOpen}
                    onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={modalConfig.onConfirm}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    confirmText={modalConfig.confirmText}
                    type={modalConfig.type}
                />

                {/* Header */}
                <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-6 overflow-hidden">
                    <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
                        <div className="flex items-center gap-4">
                            <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <ChevronLeft size={24} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                                    {id ? 'Editar Verificación' : 'Nueva Verificación'}
                                </h1>
                                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                                    {id ? <span>ID: <span className="font-mono text-gray-700">#{id}</span></span> : 'Registro de nuevas muestras'}
                                    {lastSaved && <span className="text-xs text-green-600 flex items-center ml-2"><CheckCircle2 size={12} className="mr-1" /> Guardado</span>}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {!id && (
                                <button type="button" onClick={handleDeleteDraft} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 text-sm font-medium rounded-lg hover:bg-rose-100 transition-colors border border-rose-200">
                                    <Trash2 size={16} /> <span>Eliminar Borrador</span>
                                </button>
                            )}
                            {id && (
                                <button type="button" onClick={() => descargarExcel()} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200">
                                    <FileSpreadsheet size={16} /> <span>Exportar Excel</span>
                                </button>
                            )}
                            <button type="button" onClick={() => window.history.back()} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors border border-gray-200">
                                <X size={16} /> <span>Cancelar</span>
                            </button>
                            <button onClick={handleSubmit} disabled={isSubmitting} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-all focus:ring-2 focus:ring-blue-500/20 disabled:opacity-70">
                                <Save size={16} /> <span>{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-white">
                        {/* Número Verificación con validación de trazabilidad */}
                        <div className="group relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 ml-0.5">
                                Número Verificación <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="numero_verificacion"
                                    value={verificacionData.numero_verificacion}
                                    onChange={handleNumeroVerificacionChange}
                                    onBlur={() => {
                                        // Delay hiding suggestions to allow clicking them
                                        setTimeout(() => setShowSuggestions(false), 200);
                                        // Trigger the -REC logic
                                        const event = { target: { value: verificacionData.numero_verificacion } } as any;
                                        handleNumeroVerificacionBlur(event);
                                    }}
                                    className={`block w-full rounded-lg text-sm transition-all duration-200 px-3 py-2.5 shadow-sm border ${
                                        recepcionStatus.estado === 'disponible' ? 'border-emerald-200 bg-emerald-50/30' : 
                                        recepcionStatus.estado === 'ocupado' ? 'border-rose-200 bg-rose-50/30' : 
                                        'border-gray-200 bg-slate-50'
                                    } focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white`}
                                    placeholder="Ej: 1111"
                                    autoComplete="off"
                                    required
                                />
                                
                                {/* Suggestions Menu */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 z-[100] mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-72 overflow-y-auto transform origin-top transition-all duration-200">
                                        <div className="bg-slate-50 px-3 py-1.5 border-b border-gray-100 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Sugerencias Encontradas</span>
                                            <span>{suggestions.length} resultados</span>
                                        </div>
                                        {suggestions.map((s, i) => {
                                            const isVerifDone = s.estados?.verificacion === 'completado';
                                            const samplesCount = s.muestras_count || 0;
                                            const receptionDate = s.fecha_recepcion ? formatDateForInput(s.fecha_recepcion) : 'N/A';
                                            
                                            return (
                                                <div 
                                                    key={i} 
                                                    onClick={() => handleSelectSuggestion(s)}
                                                    className="px-4 py-3 hover:bg-blue-50/50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors group"
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-black text-lg text-slate-800 group-hover:text-blue-600 transition-colors">{s.numero_recepcion}</span>
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${isVerifDone ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                {isVerifDone ? 'Ocupado' : 'Disponible'}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                                                <Calendar size={10} className="text-slate-400" />
                                                                {receptionDate}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 rounded">
                                                                <Layers size={10} />
                                                                {samplesCount} {samplesCount === 1 ? 'Muestra' : 'Muestras'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 size={12} className="text-slate-300" />
                                                        <div className="text-xs font-medium text-slate-500 truncate uppercase">{s.cliente || 'Sin cliente'}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            {/* Status Indicator */}
                            <div className="mt-1.5 flex flex-col gap-1">
                                {recepcionStatus.estado === 'buscando' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 animate-pulse w-fit">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Buscando...</span>
                                    </div>
                                )}
                                {recepcionStatus.estado === 'disponible' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm bg-emerald-50 text-emerald-600 border-emerald-100 w-fit">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Disponible</span>
                                    </div>
                                )}
                                {recepcionStatus.estado === 'ocupado' && (
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-full border border-rose-100 shadow-sm w-fit">
                                        <XCircle className="h-3 w-3" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Ocupado</span>
                                    </div>
                                )}
                                {recepcionStatus.formatos && (
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mr-1 italic">Formatos:</span>
                                        <div className={`flex items-center justify-center w-7 h-4 rounded text-[8px] font-black border transition-colors ${recepcionStatus.formatos.recepcion ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>REC</div>
                                        <div className={`flex items-center justify-center w-7 h-4 rounded text-[8px] font-black border transition-colors ${recepcionStatus.formatos.verificacion ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>VER</div>
                                        <div className={`flex items-center justify-center w-7 h-4 rounded text-[8px] font-black border transition-colors ${recepcionStatus.formatos.compresion ? 'bg-emerald-100 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-300'}`}>COM</div>
                                    </div>
                                )}
                                {recepcionStatus.mensaje && (
                                    <div className={`text-[9px] font-black italic uppercase tracking-tighter ${recepcionStatus.estado === 'ocupado' ? 'text-rose-500' : 'text-slate-400/80'}`}>
                                        {recepcionStatus.mensaje}
                                    </div>
                                )}
                                
                                {recepcionStatus.estado === 'disponible' && verificacionData.recepcion_id && verificacionData.muestras_verificadas.length === 0 && (
                                    <button
                                        type="button"
                                        onClick={importarMuestras}
                                        className="mt-2 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 hover:bg-blue-100 transition-all shadow-sm"
                                    >
                                        <Plus className="h-3 w-3" />
                                        <span>IMPORTAR MUESTRAS DE RECEPCIÓN</span>
                                    </button>
                                )}
                            </div>
                        </div>
                        <InputField label="Verificado por" name="verificado_por" value={verificacionData.verificado_por || ''} onChange={handleInputChange} placeholder="Nombre del responsable" />
                        <InputField label="Fecha Verificación" name="fecha_verificacion" value={formatDateForInput(verificacionData.fecha_verificacion)} onChange={handleInputChange} type="date" />
                        <InputField label="Cliente" name="cliente" value={verificacionData.cliente || ''} onChange={handleInputChange} placeholder="Nombre del cliente" />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-8 border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    {[
                                        { t: 'N°' },
                                        { t: 'Código LEM' },
                                        { t: 'Tipo Testigo' },
                                        { t: 'Diámetro 1 (mm)' },
                                        { t: 'Diámetro 2 (mm)' },
                                        { t: 'ΔΦ 2%>' },
                                        { t: 'Aceptación' },
                                        { t: 'SUP 1' },
                                        { t: 'SUP 2' },
                                        { t: 'INF 1' },
                                        { t: 'INF 2' },
                                        { t: 'Medida <0.5°' },
                                        { t: 'C. Superior' },
                                        { t: 'C. Inferior' },
                                        { t: 'Depresiones' },
                                        { t: 'Acción' },
                                        { t: 'Conformidad' },
                                        { t: 'Longitud 1' },
                                        { t: 'Longitud 2' },
                                        { t: 'Longitud 3' },
                                        { t: 'Masa (g)' },
                                        { t: 'Pesar' },
                                        { t: 'Acciones' }
                                    ].map((h, i) => {
                                        const isAction = h.t === 'Acción';
                                        const isLem = h.t === 'Código LEM';
                                        let bgColor = 'bg-gray-50';

                                        if (h.t.includes('Diámetro') || h.t.includes('ΔΦ') || h.t === 'Aceptación') bgColor = 'bg-sky-100';
                                        else if (['SUP 1', 'SUP 2', 'INF 1', 'INF 2', 'Medida <0.5°'].includes(h.t)) bgColor = 'bg-orange-100';
                                        else if (['C. Superior', 'C. Inferior', 'Depresiones'].includes(h.t)) bgColor = 'bg-emerald-100';
                                        else if (h.t === 'Acción') bgColor = 'bg-indigo-100';
                                        else if (h.t === 'Conformidad') bgColor = 'bg-violet-100';
                                        else if (h.t.includes('Longitud')) bgColor = 'bg-slate-100';
                                        else if (h.t === 'Masa (g)' || h.t === 'Pesar') bgColor = 'bg-rose-100';

                                        return (
                                            <th key={i} className={`px-2 py-3 border border-gray-300 text-[13px] font-black text-black uppercase tracking-tighter leading-tight ${isAction ? 'text-center' : 'text-left'} ${isLem ? 'min-w-[120px]' : ''} ${bgColor}`}>
                                                {h.t}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 ">
                                {verificacionData.muestras_verificadas.map((muestra, index) => (
                                    <tr key={index}>
                                        <td className="px-3 py-2 border border-gray-300 text-[15px] font-normal text-black">{muestra.item_numero}</td>
                                        <td className="px-3 py-2 border border-gray-300 min-w-[120px]">
                                            <input
                                                type="text"
                                                value={muestra.codigo_lem}
                                                onChange={(e) => handleMuestraChange(index, 'codigo_lem', e.target.value)}
                                                onBlur={(e) => handleLemCodeBlur(index, e.target.value)}
                                                className="w-full text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 text-black font-normal"
                                                placeholder="Ej: 5858"
                                            />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300">
                                            <select
                                                value={muestra.tipo_testigo}
                                                onChange={(e) => handleMuestraChange(index, 'tipo_testigo', e.target.value)}
                                                className="w-full text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-black font-normal"
                                            >
                                                {TIPO_TESTIGO_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-sky-50">
                                            <input type="number" step="0.01" value={muestra.diametro_1_mm || ''} onChange={(e) => handleMuestraChange(index, 'diametro_1_mm', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-sky-50">
                                            <input type="number" step="0.01" value={muestra.diametro_2_mm || ''} onChange={(e) => handleMuestraChange(index, 'diametro_2_mm', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 text-[15px] font-normal text-black bg-sky-50">{muestra.tolerancia_porcentaje}%</td>
                                        <td className="px-3 py-2 border border-gray-300 text-center bg-sky-50">
                                            {muestra.aceptacion_diametro ? (
                                                <span className="text-black font-normal text-[15px]">
                                                    {muestra.aceptacion_diametro}
                                                </span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        {/* Perpendicularidad */}
                                        {['sup1', 'sup2', 'inf1', 'inf2', 'medida'].map((f) => {
                                            const prop = `perpendicularidad_${f}` as keyof MuestraVerificada;
                                            const boolVal = muestra[prop] as boolean | undefined;
                                            const strVal = boolVal === true ? 'CUMPLE' : (boolVal === false ? 'NO CUMPLE' : '-');
                                            return (
                                                <td key={f} className="px-3 py-2 border border-gray-300 bg-orange-50">
                                                    <select
                                                        value={strVal}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            let newBool = undefined;
                                                            if (v === 'CUMPLE') newBool = true;
                                                            else if (v === 'NO CUMPLE') newBool = false;
                                                            handleMuestraChange(index, prop, newBool);
                                                        }}
                                                        className="w-28 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer font-normal text-black"
                                                    >
                                                        <option value="-">-</option>
                                                        <option value="CUMPLE">CUMPLE</option>
                                                        <option value="NO CUMPLE">NO CUMPLE</option>
                                                    </select>
                                                </td>
                                            );
                                        })}
                                        {/* Planitud */}
                                        {['superior', 'inferior', 'depresiones'].map((f) => {
                                            const prop = `planitud_${f}_aceptacion` as keyof MuestraVerificada;
                                            const val = (muestra[prop] as string) || '-';
                                            return (
                                                <td key={f} className="px-3 py-2 border border-gray-300 text-center bg-emerald-50">
                                                    <select
                                                        value={val}
                                                        onChange={(e) => handleMuestraChange(index, prop, e.target.value)}
                                                        className="w-28 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer font-normal text-black"
                                                    >
                                                        <option value="-">-</option>
                                                        <option value="CUMPLE">CUMPLE</option>
                                                        <option value="NO CUMPLE">NO CUMPLE</option>
                                                    </select>
                                                </td>
                                            );
                                        })}
                                        <td className="px-2 py-2 border border-gray-300 bg-indigo-50 min-w-[180px]">
                                            <select
                                                value={muestra.accion_realizar || '-'}
                                                onChange={(e) => handleMuestraChange(index, 'accion_realizar', e.target.value)}
                                                className="w-full text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-center font-normal text-black leading-tight py-1 whitespace-normal h-auto"
                                            >
                                                {ACCION_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-violet-50">
                                            <select
                                                value={muestra.conformidad || '-'}
                                                onChange={(e) => handleMuestraChange(index, 'conformidad', e.target.value)}
                                                className="w-28 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer text-center text-black font-normal"
                                            >
                                                {CONFORMIDAD_OPTIONS.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-slate-50">
                                            <input type="number" step="0.01" value={muestra.longitud_1_mm || ''} onChange={(e) => handleMuestraChange(index, 'longitud_1_mm', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-slate-50">
                                            <input type="number" step="0.01" value={muestra.longitud_2_mm || ''} onChange={(e) => handleMuestraChange(index, 'longitud_2_mm', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-slate-50">
                                            <input type="number" step="0.01" value={muestra.longitud_3_mm || ''} onChange={(e) => handleMuestraChange(index, 'longitud_3_mm', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 bg-rose-50">
                                            <input type="number" step="0.001" value={muestra.masa_muestra_aire_g || ''} onChange={(e) => handleMuestraChange(index, 'masa_muestra_aire_g', e.target.value)} className="w-20 text-[15px] border-0 border-b border-gray-300 bg-transparent focus:ring-blue-500 focus:border-blue-500 font-normal text-black" />
                                        </td>
                                        <td className="px-3 py-2 border border-gray-300 text-[15px] text-center bg-rose-50">
                                            {muestra.pesar ? (
                                                <span className="text-black font-normal">{muestra.pesar}</span>
                                            ) : <span className="text-gray-400">-</span>}
                                        </td>
                                        <td className="px-3 py-2 flex gap-2">
                                            <button type="button" onClick={() => removeMuestra(index)} className="hover:opacity-70 text-lg" title="Eliminar">🗑️</button>
                                            <button type="button" onClick={() => {
                                                const newMuestra = { ...muestra, item_numero: verificacionData.muestras_verificadas.length + 1 };
                                                setVerificacionData(prev => ({
                                                    ...prev,
                                                    muestras_verificadas: [...prev.muestras_verificadas, newMuestra]
                                                }));
                                            }} className="hover:opacity-70 text-lg" title="Copiar">📋</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 bg-slate-50/50 border-t border-slate-200">
                        <button onClick={addMuestra} className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 border border-blue-200 transition-all shadow-sm"><Plus size={16} /> Agregar Muestra</button>
                    </div>
                </div>

                {/* Footer Section (Equipos y Notas) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-slate-200 p-6">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Equipos Utilizados</h3>
                            <button
                                type="button"
                                onClick={() => setVerificacionData(prev => ({
                                    ...prev,
                                    equipo_bernier: 'EQP-0255',
                                    equipo_lainas_1: 'EQP-0255',
                                    equipo_lainas_2: 'EQP-0255',
                                    equipo_escuadra: 'EQP-0255',
                                    equipo_balanza: 'EQP-0255'
                                }))}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1"
                            >
                                <CheckCircle2 size={12} /> Usar EQP-0255 en todos
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SelectField label="Bernier" name="equipo_bernier" value={verificacionData.equipo_bernier} onChange={handleInputChange} options={EQUIPMENT_OPTIONS} />
                            <SelectField label="Lainas 1" name="equipo_lainas_1" value={verificacionData.equipo_lainas_1} onChange={handleInputChange} options={EQUIPMENT_OPTIONS} />
                            <SelectField label="Lainas 2" name="equipo_lainas_2" value={verificacionData.equipo_lainas_2} onChange={handleInputChange} options={EQUIPMENT_OPTIONS} />
                            <SelectField label="Escuadra" name="equipo_escuadra" value={verificacionData.equipo_escuadra} onChange={handleInputChange} options={EQUIPMENT_OPTIONS} />
                            <SelectField label="Balanza" name="equipo_balanza" value={verificacionData.equipo_balanza} onChange={handleInputChange} options={EQUIPMENT_OPTIONS} />
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-4 border-b border-gray-100 pb-2">Notas Adicionales</h3>
                        <textarea
                            name="nota"
                            value={verificacionData.nota || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className="block w-full rounded-lg border-gray-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500/20 px-3 py-3 resize-none"
                            placeholder="Ingrese observaciones..."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VerificacionMuestrasForm;
