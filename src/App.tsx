import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import React, { useEffect } from 'react'
import VerificacionMuestrasForm from './pages/VerificacionMuestrasForm'
import VerificacionMuestrasDetail from './pages/VerificacionMuestrasDetail'
import VerificacionImportForm from './pages/VerificacionImportForm'
import Login from './pages/Login'

/**
 * Escucha mensajes postMessage del parent (crm-geofal) para recibir el token JWT.
 * Esto resuelve el aislamiento de localStorage entre dominios en la arquitectura micro-frontend.
 * Formatos aceptados: { type: 'SET_TOKEN' | 'AUTH_TOKEN', token: string }
 */
const setupParentTokenListener = () => {
    const handler = (event: MessageEvent) => {
        // Aceptar mensajes del CRM principal y subdominios de geofal
        const trustedOrigins = [
            'https://crm.geofal.com.pe',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://127.0.0.1:3000',
        ];
        const isLocalhost = event.origin.startsWith('http://localhost') || event.origin.startsWith('http://127.0.0.1');
        const isTrusted = trustedOrigins.includes(event.origin) || isLocalhost || event.origin.endsWith('.geofal.com.pe');

        if (!isTrusted) return;

        const data = event.data;
        if (data && (data.type === 'SET_TOKEN' || data.type === 'AUTH_TOKEN') && data.token) {
            console.log('[TokenListener] Token received from parent window, saving to localStorage');
            localStorage.setItem('token', data.token);
        }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
};

// Helper component to capture token from URL and save it to localStorage
const TokenHandler = () => {
    const [searchParams] = useSearchParams();
    useEffect(() => {
        // 1. Intentar desde URL
        const token = searchParams.get('token');
        if (token) {
            console.log('[TokenHandler] Token found in URL, saving to localStorage');
            localStorage.setItem('token', token);
            return;
        }

        // 2. Solicitar token al parent si estamos en iframe
        if (window.parent !== window) {
            console.log('[TokenHandler] Running as iframe, requesting token from parent...');
            window.parent.postMessage({ type: 'REQUEST_TOKEN', source: 'verificacion-crm' }, '*');
        }
    }, [searchParams]);

    // 3. Escuchar respuestas del parent vía postMessage
    useEffect(() => {
        return setupParentTokenListener();
    }, []);

    return null;
}

const AccessGate = ({ children }: { children: React.ReactNode }) => {
    const [searchParams] = useSearchParams();
    const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

    useEffect(() => {
        // 1. Token desde URL tiene prioridad
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            localStorage.setItem('token', tokenFromUrl);
        }

        // 2. Verificar token disponible (URL o localStorage)
        const token = tokenFromUrl || localStorage.getItem('token');
        const isEmbedded = window.parent !== window;
        const authorized = !!tokenFromUrl || (isEmbedded && !!token) || !!token;
        setIsAuthorized(authorized);

        // 3. Si no hay token y estamos en iframe, esperar respuesta del parent
        if (!authorized && isEmbedded) {
            const timeout = setTimeout(() => {
                const latestToken = localStorage.getItem('token');
                if (latestToken) setIsAuthorized(true);
                else setIsAuthorized(false);
            }, 800);
            return () => clearTimeout(timeout);
        }
    }, [searchParams]);

    // Escuchar token del parent y re-autorizar si llega
    useEffect(() => {
        const cleanup = setupParentTokenListener();
        // Verificar frecuentemente al inicio para evitar esperas largas
        const recheckInterval = setInterval(() => {
            if (localStorage.getItem('token')) {
                setIsAuthorized(true);
                clearInterval(recheckInterval);
            }
        }, 100);
        
        return () => {
            cleanup();
            clearInterval(recheckInterval);
        };
    }, []);

    if (isAuthorized === null) return null;

    if (!isAuthorized) {
        // Si estamos en iframe, podemos seguir esperando un momento antes de redirigir a Login
        if (window.parent !== window && !localStorage.getItem('token')) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-muted-foreground font-medium">Sincronizando sesión...</p>
                    </div>
                </div>
            );
        }
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


