import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Request interceptor - Add auth token
API.interceptors.request.use(
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

// Response interceptor - Handle token refresh
API.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            console.warn(`[API] 401 intercepted for ${originalRequest.url}. Attempting token refresh...`);
            originalRequest._retry = true;

            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                try {
                    console.log(`[API] Sending refresh token...`);
                    const { data } = await axios.post('http://localhost:5000/api/auth/refresh-token', {
                        token: refreshToken
                    });
                    console.log(`[API] Token refresh SUCCESS. New token received.`);
                    localStorage.setItem('token', data.accessToken);
                    originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
                    return API(originalRequest);
                } catch (refreshError) {
                    console.error(`[API] Token refresh FAILED. Clearing storage and redirecting...`, refreshError);
                    // Refresh failed, clear tokens and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                console.error(`[API] No refresh token found. Redirecting to login...`);
            }
        } else if (error.response?.status === 401) {
            console.error(`[API] 401 intercepted BUT _retry is true. Token refresh loop avoided.`);
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH APIs ====================
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const getMe = () => API.get('/auth/me');
export const updateProfile = (profileData) => API.put('/auth/profile', profileData);
export const verifyEmail = (token) => API.post('/auth/verify-email', { token });
export const forgotPassword = (email) => API.post('/auth/forgot-password', { email });
export const resetPassword = (token, newPassword) => API.post('/auth/reset-password', { token, newPassword });
export const refreshToken = (token) => API.post('/auth/refresh-token', { token });
export const updateUserLanguage = (language) => API.put('/auth/language', { language });

// ==================== PATIENT APIs ====================
export const getPatientSettings = () => API.get('/patient/settings');
export const updatePatientSettings = (data) => API.put('/patient/settings', data);

// ==================== DOCTOR APIs ====================
export const getDoctors = (filters) => API.get('/doctors', { params: filters });
export const getDoctorById = (id) => API.get(`/doctors/${id}`);

// ==================== ADMIN APIs ====================
export const getAdminStats = () => API.get('/admin/stats');
export const getAllUsers = () => API.get('/admin/users');
export const getAllDoctors = () => API.get('/admin/doctors');
export const getPendingDoctors = () => API.get('/admin/doctors?status=pending');
export const verifyDoctor = (id, status, reason) => API.put(`/admin/doctor/${id}/verify`, { status, reason });

// ==================== APPOINTMENT APIs ====================
export const bookAppointment = (data) => API.post('/appointments', data);
export const getAppointments = () => API.get('/appointments');
export const getAppointmentById = (id) => API.get(`/appointments/${id}`);
export const updateAppointmentStatus = (id, data) => API.put(`/appointments/${id}/status`, data);
export const rescheduleAppointment = (id, data) => API.put(`/appointments/${id}/reschedule`, data);
export const cancelAppointment = (id, reason) => API.delete(`/appointments/${id}`, { data: { reason } });
export const checkAvailability = (doctorId, date, timeSlot) =>
    API.get('/appointments/check-availability', { params: { doctorId, date, timeSlot } });
export const getAvailableSlots = (doctorId, date) =>
    API.get('/appointments/available-slots', { params: { doctorId, date } });

// ==================== PAYMENT APIs ====================
export const createPaymentIntent = (data) => API.post('/payments/create-intent', data);
export const confirmPayment = (data) => API.post('/payments/confirm', data);
export const getPaymentHistory = () => API.get('/payments/history');
export const getPaymentReceipt = (id) => API.get(`/payments/${id}/receipt`);
export const processRefund = (id, reason) => API.post(`/payments/${id}/refund`, { reason });

// ==================== SCAN APIs ====================
export const uploadScan = (formData) => API.post('/scans/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadExternalScan = (formData) => API.post('/scans/external', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const uploadInternalScan = (formData) => API.post('/scans/internal', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getScans = () => API.get('/scans');
export const getScanById = (id) => API.get(`/scans/${id}`);
export const runAIAnalysis = (id) => API.post(`/scans/${id}/analyze`);
export const getAIAnalysis = (id) => API.get(`/scans/${id}/analysis`);
export const createReport = (id, data) => API.post(`/scans/${id}/report`, data);

// ==================== CONSULTATION APIs ====================
export const getChatHistory = (appointmentId) => API.get(`/consultation/${appointmentId}/chat`);
export const getConsultationNotes = (appointmentId) => API.get(`/consultation/${appointmentId}/notes`);
export const addConsultationNote = (appointmentId, data) => API.post(`/consultation/${appointmentId}/notes`, data);
export const getPrescription = (appointmentId) => API.get(`/consultation/${appointmentId}/prescription`);
export const savePrescription = (appointmentId, data) => API.post(`/consultation/${appointmentId}/prescription`, data);
export const getConsultationSummary = (appointmentId) => API.get(`/consultation/${appointmentId}/summary`);

export default API;
