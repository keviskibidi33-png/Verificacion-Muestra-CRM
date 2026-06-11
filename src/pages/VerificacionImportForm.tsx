import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { api, apiService } from '../services/api';
import { getApiErrorMessage } from '../utils/apiError';
import { ArrowLeft, Upload, FileSpreadsheet, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';

export default function VerificacionImportForm() {
    const navigate = useNavigate();
    
    // Form fields
    const [numeroVerificacion, setNumeroVerificacion] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [loading, setLoading] = useState(false);
    
    // Autocomplete for OT / Recepcion
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Dynamic checks
    const [recepcionStatus, setRecepcionStatus] = useState<{
        estado: 'idle' | 'buscando' | 'disponible' | 'ocupado';
        mensaje?: string;
        datos?: any;
    }>({ estado: 'idle' });

    const handleBack = () => {
        navigate('/nuevo');
    };

    const handleSearchChange = async (val: string) => {
        const query = val.toUpperCase();
        setNumeroVerificacion(query);

        if (query.length >= 2) {
            try {
                const results = await apiService.getSuggestions(query);
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

    const checkStatus = async (numero: string) => {
        if (!numero || numero.length < 2) return;
        setRecepcionStatus({ estado: 'buscando' });
        try {
            const data = await apiService.checkStatus(numero);
            if (data.exists) {
                const isVerifDone = data.verificacion?.status === 'completado';
                setRecepcionStatus({
                    estado: isVerifDone ? 'ocupado' : 'disponible',
                    mensaje: isVerifDone 
                        ? '⚠️ Ya existe una verificación registrada para este número' 
                        : '✅ Recepción válida encontrada - Listo para importar',
                    datos: data.datos
                });
            } else {
                setRecepcionStatus({
                    estado: 'disponible',
                    mensaje: '✅ Número disponible para registro de verificación'
                });
            }
        } catch (error) {
            setRecepcionStatus({
                estado: 'disponible',
                mensaje: '⚠️ Error de conexión - Validando de todas formas'
            });
        }
    };

    const handleSelectSuggestion = (s: any) => {
        setNumeroVerificacion(s.numero_recepcion);
        setShowSuggestions(false);
        checkStatus(s.numero_recepcion);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
            } else {
                toast.error('Por favor sube solo archivos de Excel (.xlsx)');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!numeroVerificacion) {
            toast.error('El número de recepción/verificación es obligatorio');
            return;
        }
        if (!selectedFile) {
            toast.error('Por favor seleccione un archivo Excel');
            return;
        }

        setLoading(true);
        // Garantizar que si el parent tiene un token más reciente (o si estamos dentro de iframe), lo recuperemos antes de enviar
        if (window.parent !== window) {
            console.log('[ImportForm] Requesting token sync before uploading file...');
            window.parent.postMessage({ type: 'REQUEST_TOKEN', source: 'verificacion-crm' }, '*');
            // Dar un brevísimo tiempo para que se procese el postMessage/recepción en App.tsx
            await new Promise(resolve => setTimeout(resolve, 150));
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('numero_verificacion', numeroVerificacion);
        if (recepcionStatus.datos?.id) {
            formData.append('recepcion_id', String(recepcionStatus.datos.id));
        }

        try {
            const response = await api.post('/api/verificacion/importar', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Excel importado correctamente - Vista previa cargada');
            navigate('/nuevo', { state: { importedData: response.data } });
        } catch (err: any) {
            console.error('Import error:', err);
            toast.error(getApiErrorMessage(err, 'Error al importar verificación'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="border-b border-gray-100 px-6 py-5 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-2">
                                Importación desde Excel
                            </h1>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                                Carga de verificación de testigos cilíndricos
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Numero recepcion/verificacion */}
                    <div className="relative overflow-visible">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Número de Verificación / Recepción <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={numeroVerificacion}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            onBlur={() => {
                                setTimeout(() => setShowSuggestions(false), 200);
                                if (numeroVerificacion) {
                                    let val = numeroVerificacion.trim();
                                    if (!val.toUpperCase().includes('-REC')) {
                                        if (/-\d{2}$/.test(val)) {
                                            val = val.replace(/-(\d{2})$/, '-REC-$1');
                                        } else {
                                            val = `${val}-REC`;
                                        }
                                        setNumeroVerificacion(val);
                                    }
                                    checkStatus(val);
                                }
                            }}
                            className="block w-full rounded-xl border-gray-200 bg-slate-50 text-sm focus:border-blue-500 focus:ring-blue-500/20 focus:bg-white px-4 py-3 shadow-sm transition-all"
                            placeholder="Ej: 1006-26 o 1006-REC"
                            autoComplete="off"
                            data-lpignore="true"
                            required
                        />

                        {/* Suggestion Menu */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute left-0 right-0 z-[100] mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-h-60 overflow-y-auto">
                                {suggestions.map((s, i) => (
                                    <div
                                        key={i}
                                        onClick={() => handleSelectSuggestion(s)}
                                        className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0 flex justify-between items-center group transition-colors"
                                    >
                                        <div>
                                            <span className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{s.numero_recepcion}</span>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{s.cliente || 'Sin cliente'}</div>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Status messages */}
                        <div className="mt-2 text-[11px] font-bold">
                            {recepcionStatus.estado === 'buscando' && (
                                <span className="text-blue-500 flex items-center gap-1.5">
                                    <Loader2 size={12} className="animate-spin" /> Buscando coincidencia...
                                </span>
                            )}
                            {recepcionStatus.estado === 'ocupado' && (
                                <span className="text-rose-500">{recepcionStatus.mensaje}</span>
                            )}
                            {recepcionStatus.estado === 'disponible' && (
                                <span className="text-emerald-600 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} /> {recepcionStatus.mensaje}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* File Dropzone */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                            Archivo Excel (.xlsx) <span className="text-red-500">*</span>
                        </label>
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                                isDragOver 
                                    ? 'border-blue-500 bg-blue-50/30' 
                                    : selectedFile 
                                        ? 'border-emerald-300 bg-emerald-50/10' 
                                        : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                            }`}
                            onClick={() => document.getElementById('excel-file-input')?.click()}
                        >
                            <input
                                type="file"
                                id="excel-file-input"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={handleFileChange}
                            />
                            {selectedFile ? (
                                <div className="space-y-2">
                                    <FileSpreadsheet className="mx-auto h-12 w-12 text-emerald-500" />
                                    <p className="text-sm font-bold text-slate-800 truncate">{selectedFile.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                        {(selectedFile.size / 1024).toFixed(1)} KB &mdash; Haz clic o arrastra para cambiar
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                                    <p className="text-sm font-bold text-slate-600">Arrastra tu archivo aquí o haz clic para buscar</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                                        Solo se admiten plantillas Excel de Verificación (.xlsx)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !numeroVerificacion || !selectedFile}
                            className="flex-1 py-3 px-4 bg-[#0070F3] hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Importando...</span>
                                </>
                            ) : (
                                <span>Iniciar Importación</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
