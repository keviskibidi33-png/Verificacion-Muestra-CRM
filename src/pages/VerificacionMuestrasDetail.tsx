import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import DeleteConfirmModal from '../components/ui/DeleteConfirmModal';
import { toast } from 'react-hot-toast';
import { apiService, api } from '../services/api';

interface MuestraVerificada {
    id: number;
    item_numero: number;
    codigo_cliente: string;
    tipo_testigo: string;
    diametro_1_mm?: number;
    diametro_2_mm?: number;
    tolerancia_porcentaje?: number;
    cumple_tolerancia?: boolean;
    masa_kg?: number;
    pesar_en?: string;
    codigo_lem?: string;
}

interface VerificacionData {
    id: number;
    numero_verificacion: string;
    codigo_documento: string;
    version: string;
    fecha_documento: string;
    pagina: string;
    verificado_por: string;
    fecha_verificacion: string;
    cliente: string;
    archivo_excel?: string;
    fecha_creacion: string;
    ultima_actualizacion?: string;
    muestras_verificadas: MuestraVerificada[];
}

const VerificacionMuestrasDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [verificacion, setVerificacion] = useState<VerificacionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (id) {
            cargarVerificacion(parseInt(id));
        }
    }, [id]);

    const cargarVerificacion = async (id: number) => {
        try {
            setLoading(true);
            const data = await apiService.getVerificacion(id);
            setVerificacion(data);
        } catch (err: any) {
            setError(err.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerarExcel = async () => {
        if (!verificacion) return;

        try {
            const response = await api.post(`/api/verificacion/${verificacion.id}/generar-excel`);

            if (response.status === 200 || response.status === 201) {
                toast.success('Excel generado exitosamente');
                cargarVerificacion(verificacion.id);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error generando Excel');
        }
    };

    const handleDelete = async () => {
        if (!verificacion) return;

        setIsDeleting(true);
        try {
            await apiService.deleteVerificacion(verificacion.id);
            toast.success('Verificación eliminada exitosamente');
            navigate('/verificacion');
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Error eliminando verificación');
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <Layout title="Detalle de Verificación">
                <div className="flex justify-center items-center h-64">
                    <div className="text-lg text-gray-500">Cargando información...</div>
                </div>
            </Layout>
        );
    }

    if (error || !verificacion) {
        return (
            <Layout title="Error">
                <div className="bg-red-50 p-6 rounded-lg text-center">
                    <div className="text-red-600 text-lg mb-2">Error cargando verificación</div>
                    <div className="text-red-500 mb-4">{error || 'No se encontró la verificación'}</div>
                    <button
                        onClick={() => navigate('/verificacion')}
                        className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                        Volver a la lista
                    </button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={`Verificación ${verificacion.numero_verificacion}`}>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Encabezado y Acciones */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Verificación {verificacion.numero_verificacion}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            {verificacion.cliente} - {new Date(verificacion.fecha_verificacion).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => navigate('/verificacion')}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Volver
                        </button>
                        <button
                            onClick={() => navigate(`/verificacion/editar/${verificacion.id}`)}
                            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                        >
                            Editar
                        </button>
                        <button
                            onClick={handleGenerarExcel}
                            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                        >
                            Generar Excel
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>

                {/* Tarjeta de Información General */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">
                        Información General
                    </h2>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Número de Verificación</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{verificacion.numero_verificacion}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Cliente</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{verificacion.cliente}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Verificado Por</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{verificacion.verificado_por}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Fecha Verificación</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{verificacion.fecha_verificacion}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Código Documento</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-200">{verificacion.codigo_documento}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Estado Excel</dt>
                            <dd className="mt-1 text-sm">
                                {verificacion.archivo_excel ? (
                                    <span className="text-green-600 font-medium">Generado</span>
                                ) : (
                                    <span className="text-gray-500">No Generado</span>
                                )}
                            </dd>
                        </div>
                    </dl>
                </div>

                {/* Tabla de Muestras */}
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 border-b pb-2">
                        Muestras Verificadas ({verificacion.muestras_verificadas.length})
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cód. LEM</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Dimensiones</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tolerancia</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Masa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {verificacion.muestras_verificadas.map((muestra) => (
                                    <tr key={muestra.id}>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">{muestra.item_numero}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{muestra.codigo_lem || '-'}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{muestra.tipo_testigo}</td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                            D1: {muestra.diametro_1_mm} / D2: {muestra.diametro_2_mm}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm">
                                            {muestra.tolerancia_porcentaje}% {muestra.cumple_tolerancia ? '✅' : '❌'}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{muestra.masa_kg} kg</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DeleteConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDelete}
                title="Eliminar Verificación"
                message="¿Estás seguro de que deseas eliminar esta verificación?"
                itemName={verificacion.numero_verificacion}
                isLoading={isDeleting}
            />
        </Layout>
    );
};

export default VerificacionMuestrasDetail;
