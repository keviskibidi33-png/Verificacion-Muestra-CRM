import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import React, { useEffect } from 'react'
import VerificacionMuestrasForm from './pages/VerificacionMuestrasForm'
import VerificacionMuestrasDetail from './pages/VerificacionMuestrasDetail'

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

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
                <TokenHandler />
                <Routes>
                    <Route path="/" element={<Navigate to="/nuevo" replace />} />
                    <Route path="/nuevo" element={<VerificacionMuestrasForm />} />
                    <Route path="/detalle/:id" element={<VerificacionMuestrasDetail />} />
                    <Route path="/editar/:id" element={<VerificacionMuestrasForm />} />
                    <Route path="*" element={<Navigate to="/nuevo" replace />} />
                </Routes>
                <Toaster position="top-right" />
            </div>
        </BrowserRouter>
    )
}

export default App
