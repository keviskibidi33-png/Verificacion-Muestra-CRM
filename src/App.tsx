import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
// import VerificacionMuestrasList from './pages/VerificacionMuestrasList' // Removed
import VerificacionMuestrasForm from './pages/VerificacionMuestrasForm'
import VerificacionMuestrasDetail from './pages/VerificacionMuestrasDetail'

function App() {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-background font-sans antialiased">
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
