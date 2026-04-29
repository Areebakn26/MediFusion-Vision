import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/services/auth_service.dart';
import '../../../../core/network/socket_service.dart';

// ─── Events ───────────────────────────────────────────────────────

abstract class AuthEvent extends Equatable {
  @override List<Object?> get props => [];
}

class AuthCheckRequested extends AuthEvent {}
class AuthLogoutRequested extends AuthEvent {}

class AuthLoginRequested extends AuthEvent {
  final String email, password;
  AuthLoginRequested({required this.email, required this.password});
  @override List<Object?> get props => [email, password];
}

class AuthRegisterRequested extends AuthEvent {
  final String name, email, password, role;
  final String? phone, specialization, licenseNumber;
  final int? yearsOfExperience;
  final double? consultationFee;
  // Patient optional fields
  final String? dateOfBirth, cnic, emergencyContact, gender, bloodGroup, address;

  AuthRegisterRequested({
    required this.name, required this.email,
    required this.password, required this.role,
    this.phone, this.specialization, this.licenseNumber,
    this.yearsOfExperience, this.consultationFee,
    this.dateOfBirth, this.cnic, this.emergencyContact,
    this.gender, this.bloodGroup, this.address,
  });
  @override List<Object?> get props => [name, email, password, role];
}

class AuthForgotPasswordRequested extends AuthEvent {
  final String email;
  AuthForgotPasswordRequested(this.email);
  @override List<Object?> get props => [email];
}

class AuthResetPasswordRequested extends AuthEvent {
  final String token, newPassword;
  AuthResetPasswordRequested({required this.token, required this.newPassword});
  @override List<Object?> get props => [token, newPassword];
}

class AuthProfileUpdateRequested extends AuthEvent {
  final Map<String, dynamic> data;
  AuthProfileUpdateRequested(this.data);
  @override List<Object?> get props => [data];
}

// ─── States ───────────────────────────────────────────────────────

abstract class AuthState extends Equatable {
  @override List<Object?> get props => [];
}

class AuthInitial extends AuthState {}
class AuthLoading extends AuthState {}
class AuthUnauthenticated extends AuthState {}
class AuthResetPasswordSuccess extends AuthState {}

class AuthRegisterSuccess extends AuthState {
  final String message;
  AuthRegisterSuccess(this.message);
  @override List<Object?> get props => [message];
}

class AuthAuthenticated extends AuthState {
  final UserModel user;
  AuthAuthenticated(this.user);
  @override List<Object?> get props => [user];
}

class AuthDoctorPendingApproval extends AuthState {
  final UserModel user;
  AuthDoctorPendingApproval(this.user);
  @override List<Object?> get props => [user];
}

class AuthError extends AuthState {
  final String message;
  AuthError(this.message);
  @override List<Object?> get props => [message];
}

class AuthForgotPasswordSuccess extends AuthState {
  final String message;
  AuthForgotPasswordSuccess(this.message);
  @override List<Object?> get props => [message];
}

// ─── BLoC ─────────────────────────────────────────────────────────

class AuthBloc extends Bloc<AuthEvent, AuthState> {
  final AuthService _authService;
  final SocketService _socketService;

  // Expose emit publicly so screens can update auth state without triggering full re-auth
  void updateUser(UserModel user) => emit(AuthAuthenticated(user));

  AuthBloc({required AuthService authService, required SocketService socketService})
      : _authService = authService,
        _socketService = socketService,
        super(AuthInitial()) {
    on<AuthCheckRequested>(_onCheckAuth);
    on<AuthLoginRequested>(_onLogin);
    on<AuthRegisterRequested>(_onRegister);
    on<AuthForgotPasswordRequested>(_onForgotPassword);
    on<AuthResetPasswordRequested>(_onResetPassword);
    on<AuthLogoutRequested>(_onLogout);
    on<AuthProfileUpdateRequested>(_onUpdateProfile);
  }

  Future<void> _onCheckAuth(AuthCheckRequested event, Emitter<AuthState> emit) async {

    emit(AuthLoading());
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (!isLoggedIn) { emit(AuthUnauthenticated()); return; }

      final refreshed = await _authService.refreshAccessToken();
      if (!refreshed) { /* try with existing token anyway */ }

      final response = await _authService.getMe().timeout(
        const Duration(seconds: 8),
        onTimeout: () {
          _authService.logout();
          throw Exception('timeout');
        },
      );
      if (response.success && response.data != null) {
        final token = await _authService.getToken();
        if (token != null) _socketService.connect(token);
        final user = response.data!;
        if (user.isDoctor && user.doctorProfile?.status == 'pending') {
          emit(AuthDoctorPendingApproval(user));
        } else {
          emit(AuthAuthenticated(user));
        }
      } else {
        await _authService.logout();
        emit(AuthUnauthenticated());
      }
    } catch (_) {
      emit(AuthUnauthenticated());
    }
  }

  Future<void> _onLogin(AuthLoginRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await _authService.login(
        email: event.email, password: event.password,
      );
      if (response.success && response.data != null) {
        final token = await _authService.getToken();
        if (token != null) _socketService.connect(token);
        // Login response is a flat payload without nested profile relations.
        // Fetch the full user from /auth/me so patientProfile/doctorProfile are populated.
        final meRes = await _authService.getMe();
        final user = meRes.success && meRes.data != null
            ? meRes.data!
            : response.data!.user;
        if (user.isDoctor && user.doctorProfile?.status == 'pending') {
          emit(AuthDoctorPendingApproval(user));
        } else {
          emit(AuthAuthenticated(user));
        }
      } else {
        emit(AuthError(response.message ?? 'Login failed'));
      }
    } catch (e) {
      emit(AuthError('Error: $e'));
    }
  }

  Future<void> _onRegister(AuthRegisterRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    try {
      final response = await _authService.register(
        name: event.name,
        email: event.email,
        password: event.password,
        role: event.role,
        phone: event.phone,
        specialization: event.specialization,
        yearsOfExperience: event.yearsOfExperience,
        licenseNumber: event.licenseNumber,
        consultationFee: event.consultationFee,
        // Patient optional fields
        dateOfBirth: event.dateOfBirth,
        cnic: event.cnic,
        emergencyContact: event.emergencyContact,
        gender: event.gender,
        bloodGroup: event.bloodGroup,
        address: event.address,
      );
      if (response.success) {
        emit(AuthRegisterSuccess(
          response.data ?? 'Registration successful! Please check your email to verify your account.',
        ));
      } else {
        emit(AuthError(response.message ?? 'Registration failed'));
      }
    } catch (e) {
      emit(AuthError('Error: $e'));
    }
  }

  Future<void> _onForgotPassword(AuthForgotPasswordRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    final response = await _authService.forgotPassword(event.email);
    if (response.success) {
      emit(AuthForgotPasswordSuccess(response.data ?? 'Reset email sent'));
    } else {
      emit(AuthError(response.message ?? 'Failed to send reset email'));
    }
  }

  Future<void> _onResetPassword(AuthResetPasswordRequested event, Emitter<AuthState> emit) async {
    emit(AuthLoading());
    final response = await _authService.resetPassword(
        token: event.token, newPassword: event.newPassword);
    if (response.success) {
      emit(AuthResetPasswordSuccess());
    } else {
      emit(AuthError(response.message ?? 'Failed to reset password'));
    }
  }

  Future<void> _onLogout(AuthLogoutRequested event, Emitter<AuthState> emit) async {
    _socketService.disconnect();
    await _authService.logout();
    emit(AuthUnauthenticated());
  }

  Future<void> _onUpdateProfile(AuthProfileUpdateRequested event, Emitter<AuthState> emit) async {
    final response = await _authService.updateProfile(event.data);
    if (response.success && response.data != null) {
      emit(AuthAuthenticated(response.data!));
    } else {
      emit(AuthError(response.message ?? 'Update failed'));
    }
  }
}