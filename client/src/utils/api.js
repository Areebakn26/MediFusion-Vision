import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const uploadScan = async (formData) => {
    const response = await api.post('/scans/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const getPatientScans = async () => {
    const response = await api.get('/scans');
    return response.data;
};

export const getPatientAppointments = async () => {
    const response = await api.get('/appointments/my-appointments');
    return response.data;
};

export default api;
