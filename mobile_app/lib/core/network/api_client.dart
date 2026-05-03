import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  late final Dio dio;

  void initialize() {
    dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
        sendTimeout: const Duration(seconds: 30),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    dio.interceptors.add(_AuthInterceptor(dio));
  }
}

class _AuthInterceptor extends Interceptor {
  final Dio _dio;
  _AuthInterceptor(this._dio);

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('jwt_token');
      if (kDebugMode) {
        final preview = (token != null && token.length > 10)
            ? '${token.substring(0, 10)}...'
            : token ?? 'NULL';
        print('🔑 ${options.method} ${options.path} | token: $preview');
      }
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    } catch (e) {
      if (kDebugMode) print('🔑 Interceptor error: $e');
    }
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (kDebugMode) {
      print('✅ ${response.statusCode}: ${response.requestOptions.path}');
    }
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (kDebugMode) {
      print('❌ ${err.response?.statusCode}: ${err.requestOptions.path} | ${err.response?.data}');
    }
    final path = err.requestOptions.path;
    final isAuthEndpoint = path.contains('/auth/login') ||
        path.contains('/auth/register') ||
        path.contains('/auth/refresh-token');
    if (err.response?.statusCode == 401 && !isAuthEndpoint) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString('jwt_token');
        err.requestOptions.headers['Authorization'] = 'Bearer $token';
        final response = await _dio.fetch(err.requestOptions);
        return handler.resolve(response);
      }
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('jwt_token');
      await prefs.remove('refresh_token');
    }
    handler.next(err);
  }

  Future<bool> _refreshToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final refreshToken = prefs.getString('refresh_token');
      if (refreshToken == null) return false;
      final response = await _dio.post(
        ApiConstants.refreshToken,
        data: {'refreshToken': refreshToken},
      );
      if (response.statusCode == 200) {
        await prefs.setString('jwt_token', response.data['token']);
        return true;
      }
      return false;
    } catch (_) {
      return false;
    }
  }
}

class ApiResponse<T> {
  final T? data;
  final String? message;
  final bool success;
  final int? statusCode;

  ApiResponse({this.data, this.message, required this.success, this.statusCode});

  factory ApiResponse.success(T data, {String? message, int? statusCode}) =>
      ApiResponse(data: data, message: message, success: true, statusCode: statusCode);

  factory ApiResponse.error(String message, {int? statusCode}) =>
      ApiResponse(message: message, success: false, statusCode: statusCode);
}

String handleDioError(DioException e) {
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
    case DioExceptionType.sendTimeout:
    case DioExceptionType.receiveTimeout:
      return 'Connection timed out. Please try again.';
    case DioExceptionType.connectionError:
      return 'No internet connection. Please check your network.';
    case DioExceptionType.badResponse:
      final statusCode = e.response?.statusCode;
      final message = e.response?.data?['message'] ??
          e.response?.data?['error'] ?? 'Something went wrong.';
      if (statusCode == 401) return message.toString();
      if (statusCode == 403) return 'Access denied.';
      if (statusCode == 404) return 'Resource not found.';
      if (statusCode == 422) return message;
      if (statusCode == 500) return 'Server error. Please try again later.';
      return message.toString();
    default:
      return 'An unexpected error occurred.';
  }
}