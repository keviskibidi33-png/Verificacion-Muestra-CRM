import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import React, { useEffect } from 'react'
import VerificacionMuestrasForm from './pages/VerificacionMuestrasForm'
import VerificacionMuestrasDetail from './pages/VerificacionMuestrasDetail'

const CRM_LOGIN_URL = import.meta.env.VITE_CRM_LOGIN_URL || 'http://localhost:3000/login'

// Helper component to capture token from URL and save it to localStorage
const TokenHandler = () => {
    const [searchParams] = useSearchParams();
    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            console.log('[TokenHandler] Token found in URL, saving to localStorage');
            localStorage.setItem('token', token);
        }
    }, [searchParams]);
    return null;
}

const AccessGate = ({ children }: { children: React.ReactNode }) => {
    const [searchParams] = useSearchParams();
    const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
        }

        const token = tokenFromUrl || localStorage.getItem('token');
        const isEmbedded = window.parent !== window;
        const authorized = !!tokenFromUrl || (isEmbedded && !!token);
        setIsAuthorized(authorized);
    }, [searchParams]);

    if (isAuthorized === null) return null;

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
                <div className="bg-white rounded-xl shadow-lg p-6 max-w-md text-center">
                    <h1 className="text-xl font-semibold text-slate-900">Acceso restringido</h1>
                    <p className="text-slate-600 mt-3">
                        Debes ingresar desde el CRM para obtener una sesión válida.
                    </p>
                    <button
                        className="mt-5 w-full rounded-lg bg-slate-900 text-white py-2.5 font-medium hover:bg-slate-800"
                        onClick={() => window.location.assign(CRM_LOGIN_URL)}
                    >
                        Ir al login del CRM
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
                <TokenHandler />
                <AccessGate>
                    <Routes>
                        <Route path="/" element={<Navigate to="/nuevo" replace />} />
                        <Route path="/nuevo" element={<VerificacionMuestrasForm />} />
                        <Route path="/detalle/:id" element={<VerificacionMuestrasDetail />} />
                        <Route path="/editar/:id" element={<VerificacionMuestrasForm />} />
                        <Route path="*" element={<Navigate to="/nuevo" replace />} />
                    </Routes>
                </AccessGate>
                <Toaster position="top-right" />
            </div>
        </BrowserRouter>
    )
}

export default App
