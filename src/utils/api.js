import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const BASE_URL = API_URL.replace('/api', '');

const api = axios.create({
    baseURL: API_URL,
});

// Add interceptor to include JWT token in requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export const getServerUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;

    // If it's an upload/static path, use the base URL (without /api)
    if (path.startsWith('/uploads') || path.startsWith('uploads')) {
        return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
    }

    // Default to adding the full API URL for other relative paths
    return `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
