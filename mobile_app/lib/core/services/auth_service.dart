import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../network/api_client.dart';
import '../constants/api_constants.dart';
import '../models/app_models.dart';

class AuthService {
  final Dio _dio = ApiClient().dio;
  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  // ─── Register ─────────────────────────────────────────────────
  Future<ApiResponse<String>> register({
    required String name, required String email,
    required String password, required String role,
    String? phone, String? specialization,
    int? yearsOfExperience, String? licenseNumber, double? consultationFee,
    // Patient optional profile fields
    String? dateOfBirth, String? cnic, String? emergencyContact,
    String? gender, String? bloodGroup, String? address,
  }) async {
    try {
      final Map<String, dynamic> data = {
        'name': name, 'email': email, 'password': password, 'role': role,
        if (phone != null) 'phone': phone,
        if (specialization != null) 'specialization': specialization,
        if (yearsOfExperience != null) 'yearsOfExperience': yearsOfExperience,
        if (licenseNumber != null) 'licenseNumber': licenseNumber,
        if (consultationFee != null) 'consultationFee': consultationFee,
        if (dateOfBirth != null) 'date_of_birth': dateOfBirth,
        if (cnic != null) 'cnic': cnic,
        if (emergencyContact != null) 'emergency_contact_phone': emergencyContact,
        if (gender != null) 'gender': gender,
        if (bloodGroup != null) 'blood_group': bloodGroup,
        if (address != null) 'address': address,
      };
      final response = await _dio.post(ApiConstants.register, data: data);
      final message = response.data['message'] ?? 'Registration successful';
      return ApiResponse.success(message, statusCode: response.statusCode);
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e), statusCode: e.response?.statusCode);
    }
  }

  // ─── Login ────────────────────────────────────────────────────
  Future<ApiResponse<AuthResponseModel>> login({
    required String email, required String password,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );
      if (kDebugMode) print('🔐 Login keys: ${response.data?.keys?.toList()}');
      final authResponse = AuthResponseModel.fromJson(response.data);
      if (kDebugMode) print('🔐 Token: ${authResponse.token.isEmpty ? "EMPTY!" : authResponse.token.substring(0, 15)}...');
      await _saveTokens(authResponse.token, authResponse.refreshToken);
      return ApiResponse.success(authResponse, statusCode: response.statusCode);
    } on DioException catch (e) {
      if (kDebugMode) print('🔐 Login error: ${e.response?.data}');
      return ApiResponse.error(handleDioError(e), statusCode: e.response?.statusCode);
    }
  }

  // ─── Get Current User ─────────────────────────────────────────
  Future<ApiResponse<UserModel>> getMe() async {
    try {
      final response = await _dio.get(ApiConstants.getMe);
      final user = UserModel.fromJson(response.data);
      return ApiResponse.success(user);
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e));
    }
  }

  // ─── Refresh token ────────────────────────────────────────────
  Future<bool> refreshAccessToken() async {
    try {
      final prefs = await _prefs;
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken == null) return false;
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'token': refreshToken},
      );
      final newToken = response.data['accessToken'] ?? '';
      if (newToken.isNotEmpty) {
        await prefs.setString('jwt_token', newToken);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  Future<ApiResponse<UserModel>> updateProfile(Map<String, dynamic> data) async {
    try {
      await _dio.put(ApiConstants.updateProfile, data: data);
      // Fetch fresh user data after update
      return await getMe();
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e));
    }
  }

  Future<ApiResponse<String>> forgotPassword(String email) async {
    try {
      final response = await _dio.post(ApiConstants.forgotPassword, data: {'email': email});
      return ApiResponse.success(response.data['message'] ?? 'Reset email sent');
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e));
    }
  }

  Future<ApiResponse<String>> resetPassword({
    required String token, required String newPassword,
  }) async {
    try {
      final response = await _dio.post(
        ApiConstants.resetPassword,
        data: {'token': token, 'newPassword': newPassword},
      );
      return ApiResponse.success(response.data['message'] ?? 'Password reset');
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e));
    }
  }

  Future<ApiResponse<String>> updateLanguage(String language) async {
    try {
      await _dio.put(ApiConstants.updateLanguage, data: {'language': language});
      return ApiResponse.success(language);
    } on DioException catch (e) {
      return ApiResponse.error(handleDioError(e));
    }
  }

  Future<void> logout() async {
    final prefs = await _prefs;
    await prefs.remove('jwt_token');
    await prefs.remove('refresh_token');
  }

  Future<void> _saveTokens(String token, String? refreshToken) async {
    if (token.isEmpty) {
      if (kDebugMode) print('⚠️ Token empty — not saving!');
      return;
    }
    final prefs = await _prefs;
    await prefs.setString('jwt_token', token);
    if (refreshToken != null && refreshToken.isNotEmpty) {
      await prefs.setString('refresh_token', refreshToken);
    }
    if (kDebugMode) print('💾 Saved token: ${token.substring(0, 15)}...');
  }

  Future<String?> getToken() async {
    final prefs = await _prefs;
    return prefs.getString('jwt_token');
  }

  Future<bool> isLoggedIn() async {
    final prefs = await _prefs;
    final token = prefs.getString('jwt_token');
    return token != null && token.isNotEmpty;
  }
}