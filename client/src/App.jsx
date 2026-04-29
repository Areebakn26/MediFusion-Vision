import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast'; // Added Toaster
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout'; // New Layout
import ProtectedRoute from './components/ProtectedRoute';
import ProfileGuard from './components/ProfileGuard';
import DoctorVerificationGuard from './components/DoctorVerificationGuard';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import AdminLogin from './pages/AdminLogin';

// Shared Components
import NotFound from './components/NotFound';
import AccessDenied from './components/AccessDenied';
import AccessibilityTools from './components/AccessibilityTools'; // New
import { LanguageProvider } from './context/LanguageContext'; // New

// Patient Pages
import PatientDashboard from './pages/patient/Dashboard';
import BookAppointment from './pages/patient/BookAppointment';
import MyAppointments from './pages/patient/MyAppointments';
import UploadScan from './pages/patient/UploadScan';
import MyScans from './pages/patient/MyScans';
import ConsultationRoom from './pages/patient/ConsultationRoom';
import MedicalRecords from './pages/patient/MedicalRecords';
import Billing from './pages/patient/Billing';
import Support from './pages/patient/Support';
import ProfileSettings from './pages/patient/ProfileSettings';
import DoctorSearch from './pages/patient/DoctorSearch';
import ScanResults from './pages/patient/ScanResults'; // New Page

// Doctor Pages
import DoctorDashboard from './pages/doctor/Dashboard';
import Schedule from './pages/doctor/Schedule';
import Diagnostics from './pages/doctor/Diagnostics';
import PatientManagement from './pages/doctor/PatientManagement';
import Analytics from './pages/doctor/Analytics';
import MedicalTools from './pages/doctor/MedicalTools';
import ProfileCompletion from './pages/doctor/ProfileCompletion';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import VerificationQueue from './pages/admin/VerificationQueue'; // New Page
import DoctorVerification from './pages/admin/DoctorVerification'; // New Page
import Users from './pages/admin/Users';
import Doctors from './pages/admin/Doctors';
import SystemContent from './pages/admin/SystemContent';
import MedicalAIMgmt from './pages/admin/MedicalAIMgmt';
import FinanceSupport from './pages/admin/FinanceSupport';
import FeedbackDashboard from './pages/admin/FeedbackDashboard';
import ScanRepository from './pages/admin/ScanRepository';

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <Router>
          <AccessibilityTools />
          <Toaster position="top-right" toastOptions={{ style: { zIndex: 9999 } }} containerStyle={{ zIndex: 9999 }} />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />

            {/* Hidden Admin Login - not linked anywhere publicly */}
            <Route path="/sudo" element={<AdminLogin />} />

            {/* Patient Routes */}
            <Route path="/patient" element={
              <ProtectedRoute role="patient">
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Profile page - always accessible */}
              <Route path="profile" element={<ProfileSettings />} />

              {/* Other pages require profile completion */}
              <Route path="dashboard" element={<ProfileGuard><PatientDashboard /></ProfileGuard>} />
              <Route path="find-doctors" element={<ProfileGuard><DoctorSearch /></ProfileGuard>} />
              <Route path="book-appointment" element={<ProfileGuard><BookAppointment /></ProfileGuard>} />
              <Route path="appointments" element={<ProfileGuard><MyAppointments /></ProfileGuard>} />
              <Route path="upload-scan" element={<ProfileGuard><UploadScan /></ProfileGuard>} />
              <Route path="scans" element={<ProfileGuard><MyScans /></ProfileGuard>} />
              <Route path="scans/results/:id" element={<ProfileGuard><ScanResults /></ProfileGuard>} />
              <Route path="consultation/:appointmentId" element={<ProfileGuard><ConsultationRoom /></ProfileGuard>} />
              <Route path="records" element={<ProfileGuard><MedicalRecords /></ProfileGuard>} />
              <Route path="billing" element={<ProfileGuard><Billing /></ProfileGuard>} />
              <Route path="support" element={<ProfileGuard><Support /></ProfileGuard>} />
            </Route>

            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute role="doctor">
                <MainLayout />
              </ProtectedRoute>
            }>
              {/* Profile page - always accessible */}
              <Route path="profile" element={<ProfileCompletion />} />

              {/* Dashboard accessible but shows limited info if not verified */}
              <Route path="dashboard" element={<DoctorVerificationGuard><DoctorDashboard /></DoctorVerificationGuard>} />

              {/* These pages require verification */}
              <Route path="appointments" element={<DoctorVerificationGuard><Schedule /></DoctorVerificationGuard>} />
              <Route path="patients" element={<DoctorVerificationGuard><PatientManagement /></DoctorVerificationGuard>} />
              <Route path="diagnostic" element={<DoctorVerificationGuard><Diagnostics /></DoctorVerificationGuard>} />
              <Route path="consultation/:appointmentId" element={<DoctorVerificationGuard><ConsultationRoom /></DoctorVerificationGuard>} />
              <Route path="analytics" element={<DoctorVerificationGuard><Analytics /></DoctorVerificationGuard>} />
              <Route path="tools" element={<DoctorVerificationGuard><MedicalTools /></DoctorVerificationGuard>} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="verification" element={<VerificationQueue />} />
              <Route path="verification/:id" element={<DoctorVerification />} />
              <Route path="users" element={<Users />} />
              <Route path="doctors" element={<Doctors />} />
              <Route path="system" element={<SystemContent />} />
              <Route path="medical-ai" element={<MedicalAIMgmt />} />
              <Route path="finance" element={<FinanceSupport />} />
              <Route path="feedback" element={<FeedbackDashboard />} />
              <Route path="scan-repository" element={<ScanRepository />} />
            </Route>

            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
