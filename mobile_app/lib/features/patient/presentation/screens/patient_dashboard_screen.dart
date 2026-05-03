import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../shared/presentation/screens/notifications_screen.dart';

class PatientDashboardScreen extends StatefulWidget {
  const PatientDashboardScreen({super.key});
  @override
  State<PatientDashboardScreen> createState() => _PatientDashboardScreenState();
}

class _PatientDashboardScreenState extends State<PatientDashboardScreen> with SingleTickerProviderStateMixin {
  List<AppointmentModel> _upcoming = [];
  List<ScanModel> _recentScans = [];
  bool _loading = true;
  late AnimationController _animController;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    _loadData();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final dio = ApiClient().dio;
      final results = await Future.wait([
        dio.get(ApiConstants.appointments, queryParameters: {'status': 'upcoming', 'limit': 3}),
        dio.get(ApiConstants.scans, queryParameters: {'limit': 3}),
      ]);
      if (mounted) {
        setState(() {
          final appointmentsData = results[0].data is Map ? (results[0].data['appointments'] ?? []) : (results[0].data ?? []);
          _upcoming = (appointmentsData as List)
              .map<AppointmentModel>((j) => AppointmentModel.fromJson(j)).toList();
              
          final scansData = results[1].data is Map ? (results[1].data['scans'] ?? []) : (results[1].data ?? []);
          _recentScans = (scansData as List)
              .map<ScanModel>((j) => ScanModel.fromJson(j)).toList();
          _loading = false;
        });
        _animController.forward(from: 0.0);
      }
    } catch (e) {
      // API call failed. Do not inject mock data as per user request.
      debugPrint('Error loading patient dashboard data: $e');
      if (mounted) {
        setState(() {
          _loading = false;
        });
        _animController.forward(from: 0.0);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = context.read<AuthBloc>().state;
    if (authState is! AuthAuthenticated) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    final user = authState.user;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // Header
            SliverToBoxAdapter(child: _buildHeader(user)),
            // Quick Actions
            SliverToBoxAdapter(child: _buildQuickActions()),
            // Upcoming Appointments
            SliverToBoxAdapter(child: _buildSection('Upcoming Appointments', '/patient/appointments', _buildAppointments(), 0.2)),
            // Recent Scans
            SliverToBoxAdapter(child: _buildSection('Recent Scans', '/patient/scans', _buildScans(), 0.4)),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(UserModel user) {
    return FadeTransition(
      opacity: Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _animController, curve: const Interval(0.0, 0.5, curve: Curves.easeOut))),
      child: Container(
        padding: const EdgeInsets.fromLTRB(24, 64, 24, 32),
        decoration: const BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.only(bottomLeft: Radius.circular(32), bottomRight: Radius.circular(32)),
          boxShadow: [BoxShadow(color: Color(0x335B5FEF), blurRadius: 20, offset: Offset(0, 10))],
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
                image: user.profilePicture != null
                    ? DecorationImage(image: NetworkImage(user.profilePicture!), fit: BoxFit.cover)
                    : null,
                color: Colors.white.withOpacity(0.2),
              ),
              child: user.profilePicture == null ? const Icon(Icons.person, color: Colors.white, size: 32) : null,
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Good ${_greeting()}', style: const TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 14, fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
              Text(user.name, style: const TextStyle(fontFamily: 'Poppins', fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: -0.5)),
            ])),
            Container(
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
              child: IconButton(
                icon: const Icon(Icons.notifications_none_rounded, color: Colors.white),
                onPressed: () => context.push('/notifications'),
              ),
            ),
          ]),
          const SizedBox(height: 32),
          ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.white.withOpacity(0.2)),
                ),
                child: Row(children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle),
                    child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(child: Text('Your health dashboard is fully updated.', style: TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 14, fontWeight: FontWeight.w500))),
                ]),
              ),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildQuickActions() {
    final actions = [
      _QuickAction(icon: Icons.search_rounded, label: 'Find Doctor', color: AppColors.primary, onTap: () => context.go('/patient/find-doctor')),
      _QuickAction(icon: Icons.document_scanner_rounded, label: 'Upload Scan', color: AppColors.secondary, onTap: () => context.push('/patient/upload-scan')),
      _QuickAction(icon: Icons.calendar_month_rounded, label: 'Schedule', color: const Color(0xFFF59E0B), onTap: () => context.go('/patient/appointments')),
      _QuickAction(icon: Icons.folder_copy_rounded, label: 'My Reports', color: const Color(0xFFEF4444), onTap: () => context.go('/patient/scans')),
    ];
    return SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(CurvedAnimation(parent: _animController, curve: const Interval(0.1, 0.6, curve: Curves.easeOut))),
      child: FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _animController, curve: const Interval(0.1, 0.6))),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 8),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Quick Actions', style: AppTextStyles.h4),
            const SizedBox(height: 20),
            Row(children: actions.map((a) => Expanded(child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: _QuickActionCard(action: a),
            ))).toList()),
          ]),
        ),
      ),
    );
  }

  Widget _buildSection(String title, String route, Widget content, double animationDelay) {
    return SlideTransition(
      position: Tween<Offset>(begin: const Offset(0, 0.2), end: Offset.zero).animate(CurvedAnimation(parent: _animController, curve: Interval(animationDelay, animationDelay + 0.5, curve: Curves.easeOut))),
      child: FadeTransition(
        opacity: Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(parent: _animController, curve: Interval(animationDelay, animationDelay + 0.5))),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(title, style: AppTextStyles.h4),
              InkWell(
                onTap: () => context.go(route),
                borderRadius: BorderRadius.circular(20),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Text('See All', style: TextStyle(fontFamily: 'Poppins', color: AppColors.primary, fontWeight: FontWeight.w600, fontSize: 14)),
                ),
              ),
            ]),
            const SizedBox(height: 16),
            content,
          ]),
        ),
      ),
    );
  }

  Widget _buildAppointments() {
    if (_loading) return const _ShimmerList();
    if (_upcoming.isEmpty) return _buildEmpty('No upcoming appointments', Icons.event_available_rounded);
    return Column(children: _upcoming.map((a) => Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _AppointmentCard(appointment: a),
    )).toList());
  }

  Widget _buildScans() {
    if (_loading) return const _ShimmerList();
    if (_recentScans.isEmpty) return _buildEmpty('No scans uploaded yet', Icons.medical_information_rounded);
    return Column(children: _recentScans.map((s) => Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: _ScanCard(scan: s, onTap: () => context.push('/patient/scan/${s.id}')),
    )).toList());
  }

  Widget _buildEmpty(String msg, IconData icon) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.border.withOpacity(0.5)),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: AppColors.background, shape: BoxShape.circle),
          child: Icon(icon, color: AppColors.textHint, size: 32),
        ),
        const SizedBox(height: 16),
        Text(msg, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary, fontWeight: FontWeight.w500)),
      ]),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }
}

class _QuickAction { final IconData icon; final String label; final Color color; final VoidCallback onTap;
_QuickAction({required this.icon, required this.label, required this.color, required this.onTap}); }

class _QuickActionCard extends StatelessWidget {
  final _QuickAction action;
  const _QuickActionCard({required this.action});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: action.onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: action.color.withOpacity(0.08), blurRadius: 12, offset: const Offset(0, 6))],
        ),
        child: Column(children: [
          Container(
              width: 52, height: 52,
              decoration: BoxDecoration(color: action.color.withOpacity(0.12), borderRadius: BorderRadius.circular(16)),
              child: Icon(action.icon, color: action.color, size: 26)),
          const SizedBox(height: 12),
          Text(action.label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textPrimary), textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final AppointmentModel appointment;
  const _AppointmentCard({required this.appointment});

  bool get _canJoin =>
      appointment.isVirtual && appointment.status == 'confirmed';

  @override
  Widget build(BuildContext context) {
    final dt = DateTime.tryParse(appointment.dateTime) ?? DateTime.now();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))],
        border: Border.all(
          color: _canJoin
              ? const Color(0xFF00C853).withOpacity(0.4)
              : AppColors.border.withOpacity(0.5),
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(18)),
            child: const Icon(Icons.person_outline_rounded, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(appointment.doctor?.name ?? 'Doctor',
                style: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 4),
            Text(appointment.doctor?.doctorProfile?.specialization ?? 'Specialist',
                style: AppTextStyles.bodySmall),
            const SizedBox(height: 10),
            Row(children: [
              const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.primary),
              const SizedBox(width: 6),
              Expanded(child: Text(
                '${dt.day}/${dt.month}/${dt.year} at ${dt.hour}:${dt.minute.toString().padLeft(2, '0')}',
                style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                    fontWeight: FontWeight.w600, color: AppColors.primary),
                overflow: TextOverflow.ellipsis,
              )),
            ]),
          ])),
          _StatusBadge(status: appointment.status),
        ]),
        if (_canJoin) ...[
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () => context.push('/consultation/${appointment.id}'),
              icon: const Icon(Icons.videocam_rounded, size: 16),
              label: const Text('Join Virtual Consultation'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C853),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 11),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                    fontWeight: FontWeight.w700),
              ),
            ),
          ),
        ],
      ]),
    );
  }
}

class _ScanCard extends StatelessWidget {
  final ScanModel scan;
  final VoidCallback onTap;
  const _ScanCard({required this.scan, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))],
          border: Border.all(color: AppColors.border.withOpacity(0.5)),
        ),
        child: Row(children: [
          Container(
            width: 60, height: 60,
            decoration: BoxDecoration(color: AppColors.secondary.withOpacity(0.1), borderRadius: BorderRadius.circular(18)),
            child: const Icon(Icons.insert_drive_file_outlined, color: AppColors.secondary, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(scan.scanType.toUpperCase(), style: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
            const SizedBox(height: 6),
            Text('Uploaded ${scan.uploadDate.substring(0, 10)}', style: AppTextStyles.bodySmall),
          ])),
          _StatusBadge(status: scan.status),
        ]),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  Color get _color {
    switch (status.toLowerCase()) {
      case 'confirmed': case 'analyzed': case 'completed': return AppColors.success;
      case 'pending': return AppColors.warning;
      case 'cancelled': return AppColors.error;
      default: return AppColors.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: _color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(status.toUpperCase(), style: TextStyle(fontFamily: 'Poppins', fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 0.5, color: _color)),
    );
  }
}

class _ShimmerList extends StatelessWidget {
  const _ShimmerList();
  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(2, (index) => Container(
        height: 100,
        margin: const EdgeInsets.only(bottom: 16),
        decoration: BoxDecoration(color: Colors.black.withOpacity(0.03), borderRadius: BorderRadius.circular(24)),
      )),
    );
  }
}