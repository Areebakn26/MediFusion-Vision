class ApiConstants {
  static const String baseUrl    = 'http://localhost:5000/api';
  static const String socketUrl  = 'http://localhost:5000';
  static const String uploadsUrl = 'http://localhost:5000/uploads';

  // Auth
  static const String register        = '/auth/register';
  static const String login           = '/auth/login';
  static const String getMe           = '/auth/me';
  static const String updateProfile   = '/auth/profile';
  static const String updateLanguage  = '/auth/language';
  static const String verifyEmail     = '/auth/verify-email';
  static const String refreshToken    = '/auth/refresh-token';
  static const String forgotPassword  = '/auth/forgot-password';
  static const String resetPassword   = '/auth/reset-password';

  // Appointments
  static const String appointments      = '/appointments';
  static const String checkAvailability = '/appointments/check-availability';
  static const String availableSlots    = '/appointments/available-slots';

  // Scans
  static const String scans        = '/scans';
  static const String uploadScan   = '/scans/upload';
  static const String externalScan = '/scans/external';

  // Payments
  static const String createPaymentIntent = '/payments/create-intent';
  static const String confirmPayment      = '/payments/confirm';
  static const String paymentHistory      = '/payments/history';

  // Consultation
  static const String consultation = '/consultation';

  // Doctors
  static const String doctors = '/doctors';

  // Notifications
  static const String notifications       = '/notifications';
  static const String notificationsUnread = '/notifications/unread-count';
  static const String notificationsReadAll = '/notifications/read-all';

  // Patient Settings
  static const String patientSettings = '/patient/settings';

  // Admin
  static const String adminUsers   = '/admin/users';
  static const String adminDoctors = '/admin/doctors';
  static const String adminStats   = '/admin/stats';
}