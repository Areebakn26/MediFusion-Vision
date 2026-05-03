import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';
import '../../features/auth/presentation/screens/splash_screen.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/auth/presentation/screens/forgot_password_screen.dart';
import '../../features/auth/presentation/screens/doctor_pending_screen.dart';
import '../../features/patient/presentation/screens/patient_shell.dart';
import '../../features/patient/presentation/screens/patient_dashboard_screen.dart';
import '../../features/patient/presentation/screens/find_doctor_screen.dart';
import '../../features/patient/presentation/screens/doctor_profile_screen.dart';
import '../../features/patient/presentation/screens/book_appointment_screen.dart';
import '../../features/patient/presentation/screens/my_appointments_screen.dart';
import '../../features/patient/presentation/screens/upload_scan_screen.dart';
import '../../features/patient/presentation/screens/my_scans_screen.dart';
import '../../features/patient/presentation/screens/scan_report_screen.dart';
import '../../features/patient/presentation/screens/payment_screen.dart';
import '../../features/patient/presentation/screens/patient_profile_screen.dart';
import '../../features/doctor/presentation/screens/doctor_shell.dart';
import '../../features/doctor/presentation/screens/doctor_dashboard_screen.dart';
import '../../features/doctor/presentation/screens/schedule_screen.dart';
import '../../features/doctor/presentation/screens/patient_list_screen.dart';
import '../../features/doctor/presentation/screens/ai_diagnostic_screen.dart';
import '../../features/doctor/presentation/screens/report_generation_screen.dart';
import '../../features/doctor/presentation/screens/doctor_profile_settings_screen.dart';
import '../../features/shared/presentation/screens/consultation_screen.dart';
import '../../features/shared/presentation/screens/notifications_screen.dart';
import '../../core/models/app_models.dart';

final rootNavigatorKey  = GlobalKey<NavigatorState>();
final _patientShellKey  = GlobalKey<NavigatorState>();
final _doctorShellKey   = GlobalKey<NavigatorState>();

GoRouter createRouter(AuthBloc authBloc) {
  return GoRouter(
    navigatorKey: rootNavigatorKey,
    initialLocation: '/splash',
    refreshListenable: GoRouterRefreshStream(authBloc.stream),
    redirect: (context, state) {
      final authState = authBloc.state;
      final loc = state.matchedLocation;

      // Web: browser starts at '/' — send to splash
      if (loc == '/') return '/splash';

      if (loc == '/splash') {
        if (authState is AuthAuthenticated) {
          return authState.user.isDoctor ? '/doctor' : '/patient';
        }
        if (authState is AuthDoctorPendingApproval) return '/auth/doctor-pending';
        if (authState is AuthUnauthenticated || authState is AuthError) return '/auth/login';
        return null; // still loading — stay on splash
      }

      final onAuthPages = loc.startsWith('/auth');

      if (authState is AuthLoading || authState is AuthInitial) return null;

      if (authState is AuthUnauthenticated || authState is AuthError) {
        return onAuthPages ? null : '/auth/login';
      }

      if (authState is AuthDoctorPendingApproval) {
        return loc == '/auth/doctor-pending' ? null : '/auth/doctor-pending';
      }

      if (authState is AuthAuthenticated && onAuthPages) {
        return authState.user.isDoctor ? '/doctor' : '/patient';
      }

      return null;
    },
    routes: [
      // ── Auth ────────────────────────────────────────────────────
      GoRoute(path: '/splash',               builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/auth/login',           builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/auth/register',        builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/auth/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/auth/doctor-pending',  builder: (_, __) => const DoctorPendingScreen()),

      // ── Patient shell (bottom nav) ───────────────────────────────
      ShellRoute(
        navigatorKey: _patientShellKey,
        builder: (_, __, child) => PatientShell(child: child),
        routes: [
          GoRoute(path: '/patient',              builder: (_, __) => const PatientDashboardScreen()),
          GoRoute(path: '/patient/find-doctor',  builder: (_, __) => const FindDoctorScreen()),
          GoRoute(path: '/patient/appointments', builder: (_, __) => const MyAppointmentsScreen()),
          GoRoute(path: '/patient/scans',        builder: (_, __) => const MyScansScreen()),
          GoRoute(path: '/patient/profile',      builder: (_, __) => const PatientProfileScreen()),
        ],
      ),

      // ── Doctor shell (bottom nav) ────────────────────────────────
      ShellRoute(
        navigatorKey: _doctorShellKey,
        builder: (_, __, child) => DoctorShell(child: child),
        routes: [
          GoRoute(path: '/doctor',           builder: (_, __) => const DoctorDashboardScreen()),
          GoRoute(path: '/doctor/schedule',  builder: (_, __) => const ScheduleScreen()),
          GoRoute(path: '/doctor/patients',  builder: (_, __) => const PatientListScreen()),
          GoRoute(path: '/doctor/profile',   builder: (_, __) => const DoctorProfileSettingsScreen()),
        ],
      ),

      // ── Detail routes — navigated via Navigator.of(rootNavigator:true)
      // These are kept for deep-link support but screens push via MaterialPageRoute
      GoRoute(path: '/patient/doctor/:id',      builder: (_, s) => DoctorProfileScreen(doctorId: s.pathParameters['id']!)),
      GoRoute(path: '/patient/book/:did',        builder: (_, s) => BookAppointmentScreen(doctorId: s.pathParameters['did']!)),
      GoRoute(path: '/patient/payment',          builder: (_, s) => PaymentScreen(extra: s.extra as Map<String, dynamic>)),
      GoRoute(path: '/patient/upload-scan',      builder: (_, __) => const UploadScanScreen()),
      GoRoute(path: '/patient/scan/:id',         builder: (_, s) => ScanReportScreen(scanId: s.pathParameters['id']!)),
      // /doctor/patient/:id is now navigated via MaterialPageRoute from PatientListScreen (data passed directly)
      GoRoute(path: '/doctor/scan/:id/analyze',  builder: (_, s) => AIDiagnosticScreen(scanId: s.pathParameters['id']!)),
      GoRoute(path: '/doctor/scan/:id/report',   builder: (_, s) => ReportGenerationScreen(scanId: s.pathParameters['id']!)),
      GoRoute(path: '/consultation/:aid',        builder: (_, s) => ConsultationScreen(appointmentId: s.pathParameters['aid']!, autoJoinVideo: (s.extra as bool?) ?? false)),
      GoRoute(path: '/notifications',            builder: (_, __) => const NotificationsScreen()),
    ],
  );
}

class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream stream) {
    notifyListeners();
    _sub = stream.listen((_) => notifyListeners());
  }
  late final dynamic _sub;
  @override
  void dispose() { _sub.cancel(); super.dispose(); }
}