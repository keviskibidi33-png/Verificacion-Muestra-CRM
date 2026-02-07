import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    itemName?: string;
    isLoading?: boolean;
    isMultiple?: boolean;
    count?: number;
}

export default function DeleteConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    itemName,
    isLoading = false,
    isMultiple = false,
    count = 1
}: DeleteConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
                onClick={!isLoading ? onClose : undefined}
            ></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-fade-in-up">

                    <div className="bg-white dark:bg-gray-800 px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                            </div>
                            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-gray-100" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {message}
                                    </p>
                                    {isMultiple ? (
                                        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30">
                                            <p className="text-sm font-medium text-red-800 dark:text-red-300">
                                                {count} elementos seleccionados
                                            </p>
                                        </div>
                                    ) : itemName && (
                                        <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-md">
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200 text-center">
                                                "{itemName}"
                                            </p>
                                        </div>
                                    )}
                                    <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium">
                                        Esta acción no se puede deshacer.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/30 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Eliminando...
                                </>
                            ) : (
                                'Eliminar'
                            )}
                        </button>
                        <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto transition-colors"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
