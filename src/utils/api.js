import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
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
    const baseUrl = 'http://localhost:8080';
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
