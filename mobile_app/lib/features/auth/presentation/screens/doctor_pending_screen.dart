import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/auth_bloc.dart';
import '../../../../core/theme/app_theme.dart';

class DoctorPendingScreen extends StatelessWidget {
  const DoctorPendingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100, height: 100,
                decoration: BoxDecoration(color: AppColors.warningLight, borderRadius: BorderRadius.circular(30)),
                child: const Icon(Icons.hourglass_top_rounded, color: AppColors.warning, size: 54),
              ),
              const SizedBox(height: 32),
              Text('Account Pending Approval', style: AppTextStyles.h3, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Text(
                'Your doctor account is currently under review by our admin team. You\'ll receive an email notification once your account is approved.',
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              OutlinedButton(
                onPressed: () => context.read<AuthBloc>().add(AuthLogoutRequested()),
                child: const Text('Sign Out'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}