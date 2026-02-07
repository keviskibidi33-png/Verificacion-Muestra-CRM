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
        // Usamos x-www-form-urlencoded para cumplir con OAuth2PasswordRequestForm de FastAPI
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);

        const response = await axios.post(`${API_URL}/api/auth/login`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        if (response.data.access_token) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
            localStorage.setItem('token', response.data.access_token);
        }

        return response.data;
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
