import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'core/di/injection.dart';
import 'core/theme/app_theme.dart';
import 'core/router/app_router.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Stripe only works on Android/iOS, not web
  if (!kIsWeb) {
    Stripe.publishableKey = 'pk_test_51SXEY9GTWo477VxS1fLM5m62XmbGXX6i9rFN2pl0SZacg6ckLwkDfCCRis7n7pZwm0x7hJbDXKJpaNBksBAr9A53008baHnQIl';
  }

  await EasyLocalization.ensureInitialized();
  await setupDI();

  if (!kIsWeb) {
    await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  }

  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('ur')],
      path: 'assets/translations',
      fallbackLocale: const Locale('en'),
      child: const MediFusionApp(),
    ),
  );
}

class MediFusionApp extends StatelessWidget {
  const MediFusionApp({super.key});

  @override
  Widget build(BuildContext context) {
    final authBloc = sl<AuthBloc>()..add(AuthCheckRequested());
    return BlocProvider.value(
      value: authBloc,
      child: Builder(builder: (context) {
        final router = createRouter(authBloc);
        return MaterialApp.router(
          title: 'MediFusion Vision',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          routerConfig: router,
          localizationsDelegates: context.localizationDelegates,
          supportedLocales: context.supportedLocales,
          locale: context.locale,
        );
      }),
    );
  }
}