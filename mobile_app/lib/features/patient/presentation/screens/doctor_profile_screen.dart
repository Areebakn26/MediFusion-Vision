import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import 'book_appointment_screen.dart';

class DoctorProfileScreen extends StatefulWidget {
  final String doctorId;
  final DoctorListItemModel? doctor; // optional — passed from find_doctor to skip fetch
  const DoctorProfileScreen({super.key, required this.doctorId, this.doctor});
  @override
  State<DoctorProfileScreen> createState() => _DoctorProfileScreenState();
}

class _DoctorProfileScreenState extends State<DoctorProfileScreen> {
  DoctorListItemModel? _doctor;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    if (widget.doctor != null) {
      // Already have data from list screen — no network call needed
      _doctor = widget.doctor;
      _loading = false;
    } else {
      _load();
    }
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().dio.get(
        '${ApiConstants.doctors}/${widget.doctorId}',
      );
      // Backend may wrap in { doctor: {...} } or return flat object
      final json = (res.data is Map && res.data['doctor'] != null)
          ? res.data['doctor'] as Map<String, dynamic>
          : res.data as Map<String, dynamic>;

      debugPrint('✅ Doctor profile loaded: ${json['id']}');

      if (mounted) {
        setState(() {
          _doctor = DoctorListItemModel.fromJson(json);
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('❌ loadDoctor error: $e');
      if (mounted) setState(() { _loading = false; _error = 'Failed to load doctor profile.'; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.wifi_off, size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text(_error!, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton.icon(onPressed: _load, icon: const Icon(Icons.refresh), label: const Text('Retry')),
        ]),
      )
          : _doctor == null
          ? const Center(child: Text('Doctor not found'))
          : CustomScrollView(slivers: [
        _buildAppBar(),
        SliverToBoxAdapter(child: _buildContent()),
      ]),
      bottomNavigationBar: (_doctor == null || _loading) ? null : _buildBookButton(),
    );
  }

  Widget _buildAppBar() {
    final profile = _doctor!.profile;
    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      backgroundColor: AppColors.primary,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
          child: SafeArea(
            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              const SizedBox(height: 40),
              CircleAvatar(
                radius: 44,
                backgroundColor: Colors.white.withOpacity(0.3),
                backgroundImage: _doctor!.profilePicture != null
                    ? NetworkImage(_doctor!.profilePicture!)
                    : null,
                child: _doctor!.profilePicture == null
                    ? Text(
                  _doctor!.name.isNotEmpty ? _doctor!.name[0].toUpperCase() : 'D',
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white),
                )
                    : null,
              ),
              const SizedBox(height: 12),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(
                  'Dr. ${_doctor!.name}',
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white),
                ),
                const SizedBox(width: 6),
                if (profile.status == 'verified')
                  const Icon(Icons.verified, color: Colors.white, size: 18),
              ]),
              Text(
                profile.specialization ?? '',
                style: const TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 14),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    final profile = _doctor!.profile;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Stats row
        Row(children: [
          _StatBox(icon: Icons.star, value: profile.rating?.toStringAsFixed(1) ?? '—', label: 'Rating', color: AppColors.warning),
          const SizedBox(width: 12),
          _StatBox(icon: Icons.work_outline, value: '${profile.yearsOfExperience ?? 0}', label: 'Years Exp', color: AppColors.secondary),
          const SizedBox(width: 12),
          _StatBox(icon: Icons.attach_money, value: 'PKR ${profile.consultationFee?.toStringAsFixed(0) ?? '—'}', label: 'Fee', color: AppColors.primary),
        ]),
        const SizedBox(height: 24),

        // About
        if (profile.bio != null) ...[
          Text('About', style: AppTextStyles.h5),
          const SizedBox(height: 8),
          Text(profile.bio!, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 24),
        ],

        // Education
        if (profile.education != null) ...[
          Text('Education', style: AppTextStyles.h5),
          const SizedBox(height: 8),
          _InfoRow(icon: Icons.school_outlined, text: profile.education!),
          const SizedBox(height: 24),
        ],

        // Availability
        Text('Availability', style: AppTextStyles.h5),
        const SizedBox(height: 12),
        Row(children: [
          _AvailChip(label: 'Virtual Consultation', available: profile.availableForVirtual ?? false),
          const SizedBox(width: 12),
          _AvailChip(label: 'In-Person Visit', available: profile.availableForPhysical ?? false),
        ]),
        const SizedBox(height: 32),
      ]),
    );
  }

  Widget _buildBookButton() {
    final profile = _doctor!.profile;
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: ElevatedButton.icon(
        onPressed: () => Navigator.of(context, rootNavigator: true).push(
          MaterialPageRoute(
            builder: (_) => BookAppointmentScreen(
              doctorId: widget.doctorId,
              doctor: _doctor,
            ),
          ),
        ),
        icon: const Icon(Icons.calendar_today_outlined),
        label: Text('Book Appointment — PKR ${profile.consultationFee?.toStringAsFixed(0) ?? '—'}'),
      ),
    );
  }
}

// ─── Reusable widgets ─────────────────────────────────────────────

class _StatBox extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;
  const _StatBox({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 6),
          Text(value, style: AppTextStyles.labelLarge.copyWith(fontSize: 13), textAlign: TextAlign.center),
          Text(label, style: AppTextStyles.caption, textAlign: TextAlign.center),
        ]),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow({required this.icon, required this.text});

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: AppColors.textSecondary, size: 18),
    const SizedBox(width: 8),
    Expanded(child: Text(text, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary))),
  ]);
}

class _AvailChip extends StatelessWidget {
  final String label;
  final bool available;
  const _AvailChip({required this.label, required this.available});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: available ? AppColors.successLight : AppColors.background,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: available ? AppColors.success : AppColors.border),
      ),
      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(
          available ? Icons.check_circle : Icons.cancel_outlined,
          color: available ? AppColors.success : AppColors.textHint,
          size: 16,
        ),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            label,
            style: AppTextStyles.bodySmall.copyWith(color: available ? AppColors.success : AppColors.textHint),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ]),
    ),
  );
}