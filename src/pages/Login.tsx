import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import authService from '../services/authService';
import { Lock, User as UserIcon, Loader2 } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            toast.error('Por favor complete todos los campos');
            return;
        }

        setLoading(true);
        try {
            await authService.login(username, password);
            toast.success('Sesión iniciada con éxito');
            
            // Redirect to destination or default to home/nuevo
            const redirectTo = searchParams.get('redirect') || '/nuevo';
            navigate(redirectTo);
        } catch (err: any) {
            console.error('Login error:', err);
            toast.error(err.response?.data?.detail || 'Credenciales incorrectas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-slate-950 text-white font-sans antialiased selection:bg-blue-500/30">
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md space-y-8 bg-slate-900/40 p-8 rounded-2xl border border-slate-800 backdrop-blur-md shadow-2xl">
                    {/* Logo Section */}
                    <div className="text-center">
                        <img 
                            src="/geofal.svg" 
                            alt="Geofal" 
                            className="h-16 mx-auto mb-6 transform hover:scale-105 transition-transform duration-300"
                            style={{ filter: 'brightness(0) invert(1)' }}
                        />
                        <h2 className="text-2xl font-black tracking-tight text-white uppercase italic">
                            Verificación de Muestras
                        </h2>
                        <p className="mt-2 text-sm text-slate-400">
                            Ingresa tus credenciales para acceder al módulo independiente
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                                    Usuario
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-600 transition-all"
                                        placeholder="Tu usuario o correo"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-600 transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-[#0070F3] hover:bg-blue-600 active:bg-blue-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>Iniciando sesión...</span>
                                    </>
                                ) : (
                                    <span>Iniciar Sesión</span>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <footer className="py-6 border-t border-slate-900 text-center">
                <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} GEOFAL S.A.S &mdash; Módulo de Verificación Cilíndrica
                </p>
            </footer>
        </div>
    );
}
