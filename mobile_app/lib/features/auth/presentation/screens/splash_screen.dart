import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../bloc/auth_bloc.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade, _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 1200));
    _fade = Tween<double>(begin: 0, end: 1)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeIn));
    _scale = Tween<double>(begin: 0.8, end: 1)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack));
    _ctrl.forward();

    // Hard fallback: never stay on splash more than 6 seconds
    Future.delayed(const Duration(seconds: 6), () {
      if (mounted && context.mounted) {
        final state = context.read<AuthBloc>().state;
        if (state is AuthLoading || state is AuthInitial) {
          context.go('/auth/login');
        }
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  void _navigate(AuthState state) {
    if (!mounted) return;
    if (state is AuthAuthenticated) {
      context.go(state.user.isDoctor ? '/doctor' : '/patient');
    } else if (state is AuthDoctorPendingApproval) {
      context.go('/auth/doctor-pending');
    } else if (state is AuthUnauthenticated || state is AuthError) {
      context.go('/auth/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return BlocListener<AuthBloc, AuthState>(
      listener: (context, state) => _navigate(state),
      child: Scaffold(
        body: Container(
          decoration:
          const BoxDecoration(gradient: AppColors.primaryGradient),
          child: Center(
            child: FadeTransition(
              opacity: _fade,
              child: ScaleTransition(
                scale: _scale,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(28),
                      ),
                      child: const Icon(Icons.medical_services_rounded,
                          size: 56, color: Colors.white),
                    ),
                    const SizedBox(height: 24),
                    const Text('MediFusion',
                        style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w700,
                            color: Colors.white)),
                    const Text('Vision',
                        style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w300,
                            color: Colors.white70,
                            letterSpacing: 4)),
                    const SizedBox(height: 8),
                    const Text('AI-Powered Medical Diagnostics',
                        style: TextStyle(fontSize: 13, color: Colors.white60)),
                    const SizedBox(height: 64),
                    const SizedBox(
                      width: 32,
                      height: 32,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2.5),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}