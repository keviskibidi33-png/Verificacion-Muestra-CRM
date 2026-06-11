import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export interface User {
    id: number;
    username: string;
    email: string;
    role: 'admin' | 'laboratorista' | 'vendedor' | 'cliente';
    full_name?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
}

const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        // En desarrollo local, dado que la API central no expone un endpoint /api/auth/login
        // (ya que la autenticación principal del CRM es gestionada por Supabase en el Parent Shell),
        // permitimos el bypass del login local inyectando un token sintético y un usuario mock
        // para facilitar las pruebas individuales en modo standalone.
        console.warn('[authService] Utilizando inicio de sesión local para pruebas en modo standalone.');
        
        const mockUser: User = {
            id: 9999,
            username: username || 'admin',
            email: username.includes('@') ? username : 'admin@geofal.com.pe',
            role: 'admin',
            full_name: 'Usuario Administrador Local'
        };

        const mockResponse: AuthResponse = {
            access_token: 'local-dev-mock-token-verificacion',
            token_type: 'bearer',
            user: mockUser
        };

        localStorage.setItem('user', JSON.stringify(mockResponse.user));
        localStorage.setItem('token', mockResponse.access_token);

        return mockResponse;
    },

    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) return JSON.parse(userStr);
        return null;
    },

    getToken: (): string | null => {
        return localStorage.getItem('token');
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    }
};

export default authService;
