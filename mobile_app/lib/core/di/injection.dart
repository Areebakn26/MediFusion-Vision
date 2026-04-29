import 'package:get_it/get_it.dart';
import '../network/api_client.dart';
import '../network/socket_service.dart';
import '../services/auth_service.dart';
import '../../features/auth/presentation/bloc/auth_bloc.dart';

final sl = GetIt.instance;

Future<void> setupDI() async {
  // Core
  ApiClient().initialize();
  sl.registerLazySingleton(() => ApiClient());
  sl.registerLazySingleton(() => SocketService());

  // Services
  sl.registerLazySingleton(() => AuthService());

  // BLoCs
  sl.registerFactory(() => AuthBloc(
    authService: sl<AuthService>(),
    socketService: sl<SocketService>(),
  ));
}