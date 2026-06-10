import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import React, { useEffect } from 'react'
import VerificacionMuestrasForm from './pages/VerificacionMuestrasForm'
import VerificacionMuestrasDetail from './pages/VerificacionMuestrasDetail'
import VerificacionImportForm from './pages/VerificacionImportForm'
import Login from './pages/Login'

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
        const authorized = !!tokenFromUrl || (isEmbedded && !!token) || !!token;
        setIsAuthorized(authorized);
    }, [searchParams]);

    if (isAuthorized === null) return null;

    if (!isAuthorized) {
        // Redirigir a login standalone si no está autorizado
        return <Navigate to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`} replace />;
    }

    return <>{children}</>;
}

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
                <TokenHandler />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/*" element={
                        <AccessGate>
                            <Routes>
                                <Route path="/" element={<Navigate to="/nuevo" replace />} />
                                <Route path="/nuevo" element={<VerificacionMuestrasForm />} />
                                <Route path="/detalle/:id" element={<VerificacionMuestrasDetail />} />
                                <Route path="/editar/:id" element={<VerificacionMuestrasForm />} />
                                <Route path="/importar" element={<VerificacionImportForm />} />
                                <Route path="*" element={<Navigate to="/nuevo" replace />} />
                            </Routes>
                        </AccessGate>
                    } />
                </Routes>
                <Toaster position="top-right" />
            </div>
        </BrowserRouter>
    )
}

export default App


