import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../shared/presentation/screens/notifications_screen.dart';

class DoctorProfileSettingsScreen extends StatelessWidget {
  const DoctorProfileSettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<AuthBloc, AuthState>(
      builder: (context, state) {
        if (state is! AuthAuthenticated) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        final user    = state.user;
        final profile = user.doctorProfile;
        return Scaffold(
          backgroundColor: AppColors.background,
          body: CustomScrollView(slivers: [
            _ProfileHeader(user: user, profile: profile),
            SliverToBoxAdapter(child: _buildInfoCard(profile)),
            SliverToBoxAdapter(child: _buildActions(context, profile)),
            SliverToBoxAdapter(child: _buildSignOut(context)),
            const SliverToBoxAdapter(child: SizedBox(height: 40)),
          ]),
        );
      },
    );
  }

  Widget _buildInfoCard(DoctorProfileModel? profile) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
        ),
        child: Column(children: [
          _InfoRow(Icons.badge_outlined,    'License',    profile?.licenseNumber ?? 'N/A'),
          const _Div(),
          _InfoRow(Icons.school_outlined,   'Education',  profile?.education ?? 'N/A'),
          const _Div(),
          _InfoRow(Icons.payments_outlined, 'Fee',        'PKR ${profile?.consultationFee?.toStringAsFixed(0) ?? '—'}'),
          const _Div(),
          _InfoRow(Icons.star_outline,      'Rating',
              '${profile?.rating?.toStringAsFixed(1) ?? '—'}  (${profile?.totalReviews ?? 0} reviews)'),
          if (profile?.bio != null && profile!.bio!.isNotEmpty) ...[
            const _Div(),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.info_outline, size: 17, color: AppColors.textSecondary),
                  const SizedBox(width: 10),
                  Text('Bio', style: AppTextStyles.labelLarge.copyWith(color: AppColors.textSecondary)),
                ]),
                const SizedBox(height: 8),
                Text(profile.bio!, style: AppTextStyles.bodyMedium.copyWith(height: 1.5)),
              ]),
            ),
          ],
        ]),
      ),
    );
  }

  Widget _buildActions(BuildContext context, DoctorProfileModel? profile) {
    final authBloc = context.read<AuthBloc>();
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(children: [
          _ActionTile(
            icon: Icons.edit_outlined,
            label: 'Edit Profile',
            subtitle: 'Update years of experience',
            color: AppColors.primary,
            onTap: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => _EditProfileSheet(authBloc: authBloc),
              );
            },
          ),
          const _Div(),
          _ActionTile(
            icon: Icons.schedule_outlined,
            label: 'Set Availability',
            subtitle: 'Configure your weekly time slots',
            color: const Color(0xFF8B5CF6),
            onTap: () => Navigator.of(context).push(MaterialPageRoute(
              builder: (_) => SetAvailabilityScreen(
                authBloc: authBloc,
                workingHours: profile?.workingHours,
              ),
            )),
          ),
          const _Div(),
          _ActionTile(
            icon: Icons.notifications_outlined,
            label: 'Notifications',
            subtitle: 'Manage notification preferences',
            color: AppColors.warning,
            onTap: () => Navigator.of(context, rootNavigator: true).push(
              MaterialPageRoute(builder: (_) => const NotificationsScreen()),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _buildSignOut(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
    child: OutlinedButton.icon(
      onPressed: () => context.read<AuthBloc>().add(AuthLogoutRequested()),
      icon: const Icon(Icons.logout, color: AppColors.error),
      label: const Text('Sign Out',
          style: TextStyle(fontFamily: 'Poppins', color: AppColors.error, fontWeight: FontWeight.w600)),
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        side: const BorderSide(color: AppColors.error),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}

// ── Gradient header ────────────────────────────────────────────────────

class _ProfileHeader extends StatelessWidget {
  final UserModel user;
  final DoctorProfileModel? profile;
  const _ProfileHeader({required this.user, required this.profile});

  bool get _verified => profile?.status == 'approved' || profile?.status == 'verified';

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: Container(
        padding: EdgeInsets.fromLTRB(24, MediaQuery.of(context).padding.top + 12, 24, 28),
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF3F43D4), Color(0xFF5B5FEF), Color(0xFF8B8FF8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Column(children: [
          Row(children: [
            // Avatar
            Stack(children: [
              CircleAvatar(
                radius: 42,
                backgroundColor: Colors.white.withOpacity(0.22),
                child: Text(
                  user.name.isNotEmpty ? user.name[0].toUpperCase() : 'D',
                  style: const TextStyle(fontFamily: 'Poppins', color: Colors.white,
                      fontWeight: FontWeight.w700, fontSize: 32),
                ),
              ),
              if (_verified)
                Positioned(right: 0, bottom: 2,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    child: const Icon(Icons.verified, color: Color(0xFF3F43D4), size: 18),
                  )),
            ]),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Dr. ${user.name}',
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 22,
                      fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 2),
              Text(profile?.specialization ?? 'Doctor',
                  style: const TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 14)),
              const SizedBox(height: 2),
              Text(user.email,
                  style: const TextStyle(fontFamily: 'Poppins', color: Colors.white54, fontSize: 12)),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: _verified
                      ? Colors.white.withOpacity(0.2)
                      : Colors.orange.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _verified ? Colors.white38 : Colors.orange.withOpacity(0.5),
                  ),
                ),
                child: Text(
                  _verified ? 'Verified' : (profile?.status ?? 'Pending').toUpperCase(),
                  style: TextStyle(
                    fontFamily: 'Poppins', fontSize: 11, fontWeight: FontWeight.w600,
                    color: _verified ? Colors.white : Colors.orange.shade200,
                  ),
                ),
              ),
            ])),
          ]),
          const SizedBox(height: 24),
          // Stats row
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(children: [
              _Stat('${profile?.yearsOfExperience ?? 0} yrs', 'Experience'),
              _StatSep(),
              _Stat(profile?.rating?.toStringAsFixed(1) ?? '—', 'Rating'),
              _StatSep(),
              _Stat('PKR ${profile?.consultationFee?.toStringAsFixed(0) ?? '—'}', 'Fee'),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String value, label;
  const _Stat(this.value, this.label);
  @override
  Widget build(BuildContext context) => Expanded(
    child: Column(children: [
      Text(value, style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
          fontWeight: FontWeight.w700, color: Colors.white)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 11, color: Colors.white60)),
    ]),
  );
}

class _StatSep extends StatelessWidget {
  @override
  Widget build(BuildContext context) =>
      Container(width: 1, height: 32, color: Colors.white.withOpacity(0.2));
}

// ── Shared widgets ───────────────────────────────────────────────────

class _Div extends StatelessWidget {
  const _Div();
  @override
  Widget build(BuildContext context) =>
      const Divider(height: 1, indent: 16, endIndent: 16, color: Color(0xFFF0F0F0));
}

Widget _InfoRow(IconData icon, String label, String value) => Padding(
  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
  child: Row(children: [
    Icon(icon, size: 18, color: AppColors.textSecondary),
    const SizedBox(width: 12),
    Expanded(child: Text(label,
        style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary))),
    Flexible(child: Text(value, style: AppTextStyles.labelLarge,
        overflow: TextOverflow.ellipsis, textAlign: TextAlign.end)),
  ]),
);

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label, subtitle;
  final Color color;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.subtitle,
      required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    leading: Container(width: 44, height: 44,
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
      child: Icon(icon, color: color, size: 21)),
    title: Text(label, style: AppTextStyles.labelLarge),
    subtitle: Text(subtitle, style: AppTextStyles.bodySmall),
    trailing: const Icon(Icons.chevron_right, color: AppColors.textHint),
    onTap: onTap,
  );
}

// ── Edit Profile bottom sheet (experience only) ──────────────────────

class _EditProfileSheet extends StatefulWidget {
  final AuthBloc authBloc;
  const _EditProfileSheet({required this.authBloc});
  @override
  State<_EditProfileSheet> createState() => _EditProfileSheetState();
}

class _EditProfileSheetState extends State<_EditProfileSheet> {
  final _expCtrl = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final profile = (widget.authBloc.state as AuthAuthenticated).user.doctorProfile;
    _expCtrl.text = '${profile?.yearsOfExperience ?? 0}';
  }

  @override
  void dispose() { _expCtrl.dispose(); super.dispose(); }

  void _adjust(int delta) {
    final v = int.tryParse(_expCtrl.text) ?? 0;
    final next = (v + delta).clamp(0, 99);
    _expCtrl.text = '$next';
    _expCtrl.selection = TextSelection.collapsed(offset: _expCtrl.text.length);
  }

  Future<void> _save() async {
    final exp = int.tryParse(_expCtrl.text.trim());
    if (exp == null || exp < 0) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter a valid number')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient().dio.put(ApiConstants.updateProfile, data: {'experience': exp});
      final meRes = await ApiClient().dio.get(ApiConstants.getMe);
      final user = UserModel.fromJson(meRes.data as Map<String, dynamic>);
      widget.authBloc.updateUser(user);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24, 20, 24,
          MediaQuery.of(context).viewInsets.bottom + 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start,
          children: [
        Center(child: Container(width: 36, height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 22),
        Text('Edit Profile', style: AppTextStyles.h4),
        const SizedBox(height: 4),
        Text('Only years of experience can be updated here.',
            style: AppTextStyles.bodySmall),
        const SizedBox(height: 28),
        Text('Years of Experience', style: AppTextStyles.labelLarge),
        const SizedBox(height: 10),
        Row(children: [
          _StepBtn(icon: Icons.remove, onTap: () => _adjust(-1),
              color: AppColors.background, iconColor: AppColors.textPrimary),
          const SizedBox(width: 14),
          Expanded(
            child: TextFormField(
              controller: _expCtrl,
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              inputFormatters: [FilteringTextInputFormatter.digitsOnly],
              style: AppTextStyles.h4.copyWith(color: AppColors.primary),
              decoration: InputDecoration(
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
                focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: AppColors.primary, width: 2)),
                suffixText: 'yrs',
                suffixStyle: AppTextStyles.bodyMedium.copyWith(color: AppColors.textHint),
              ),
            ),
          ),
          const SizedBox(width: 14),
          _StepBtn(icon: Icons.add, onTap: () => _adjust(1),
              color: AppColors.primary, iconColor: Colors.white),
        ]),
        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: _saving ? null : _save,
          child: _saving
              ? const SizedBox(width: 20, height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
              : const Text('Save Changes'),
        ),
      ]),
    );
  }
}

class _StepBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color, iconColor;
  const _StepBtn({required this.icon, required this.onTap,
      required this.color, required this.iconColor});
  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 48, height: 48,
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border)),
      child: Icon(icon, color: iconColor, size: 22),
    ),
  );
}

// ── Set Availability Screen ───────────────────────────────────────────

class SetAvailabilityScreen extends StatefulWidget {
  final AuthBloc authBloc;
  final Map<String, dynamic>? workingHours;
  const SetAvailabilityScreen({super.key, required this.authBloc, this.workingHours});

  @override
  State<SetAvailabilityScreen> createState() => _SetAvailabilityScreenState();
}

class _SetAvailabilityScreenState extends State<SetAvailabilityScreen> {
  static const _days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  ];

  static const _allSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM',
  ];

  late final Map<String, Set<String>> _selected;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _selected = {};
    for (final day in _days) {
      final wh = widget.workingHours?[day];
      if (wh == null) {
        _selected[day] = {};
      } else if (wh is Map && wh['slots'] is List) {
        _selected[day] = Set<String>.from(
            (wh['slots'] as List).map((e) => e.toString()));
      } else if (wh is Map && wh['start'] != null) {
        // Legacy range → convert to slots
        final start = _toMinutes(wh['start'].toString());
        final end   = _toMinutes(wh['end']?.toString() ?? '');
        _selected[day] = _allSlots
            .where((s) { final t = _toMinutes(s); return t >= start && t < end; })
            .toSet();
      } else {
        _selected[day] = {};
      }
    }
  }

  int _toMinutes(String s) {
    try {
      final p = s.split(' ');
      final tp = p[0].split(':');
      int h = int.parse(tp[0]);
      final m = int.parse(tp[1]);
      final mod = p.length > 1 ? p[1] : 'AM';
      if (mod == 'AM' && h == 12) h = 0;
      if (mod == 'PM' && h != 12) h += 12;
      return h * 60 + m;
    } catch (_) { return 0; }
  }

  void _toggleDay(String day, bool active) {
    setState(() {
      if (!active) {
        _selected[day] = {};
      } else {
        // Default: 9 AM – 5 PM
        final s = _toMinutes('09:00 AM');
        final e = _toMinutes('05:00 PM');
        _selected[day] = _allSlots
            .where((sl) { final t = _toMinutes(sl); return t >= s && t < e; })
            .toSet();
      }
    });
  }

  void _toggleSlot(String day, String slot) {
    setState(() {
      final set = _selected[day] ??= {};
      if (set.contains(slot)) set.remove(slot); else set.add(slot);
    });
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final workingHours = <String, dynamic>{};
      for (final day in _days) {
        final slots = _selected[day];
        if (slots != null && slots.isNotEmpty) {
          final sorted = slots.toList()
            ..sort((a, b) => _toMinutes(a).compareTo(_toMinutes(b)));
          workingHours[day] = {'slots': sorted};
        }
      }
      await ApiClient().dio.put(ApiConstants.updateProfile,
          data: {'workingHours': workingHours});
      final meRes = await ApiClient().dio.get(ApiConstants.getMe);
      final user = UserModel.fromJson(meRes.data as Map<String, dynamic>);
      widget.authBloc.updateUser(user);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Availability saved successfully'),
          backgroundColor: AppColors.success,
        ));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _saving = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to save: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Set Availability'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: _saving
                ? const Center(
                    child: SizedBox(width: 20, height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2)))
                : TextButton(
                    onPressed: _save,
                    child: const Text('Save',
                        style: TextStyle(fontFamily: 'Poppins',
                            fontWeight: FontWeight.w700, fontSize: 16)),
                  ),
          ),
        ],
      ),
      body: Column(children: [
        // Info banner
        Container(
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.primary.withOpacity(0.25)),
          ),
          child: Row(children: [
            const Icon(Icons.info_outline, color: AppColors.primary, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(
              'Select which time slots you\'re available each day. Patients can only book these slots.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary),
            )),
          ]),
        ),
        const SizedBox(height: 8),
        Expanded(
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            itemCount: _days.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) {
              final day = _days[i];
              final selSet = _selected[day] ?? {};
              return _DayCard(
                day: day,
                allSlots: _allSlots,
                selectedSlots: selSet,
                onToggleDay: (v) => _toggleDay(day, v),
                onToggleSlot: (s) => _toggleSlot(day, s),
              );
            },
          ),
        ),
      ]),
    );
  }
}

// ── Day card ──────────────────────────────────────────────────────────

class _DayCard extends StatelessWidget {
  final String day;
  final List<String> allSlots;
  final Set<String> selectedSlots;
  final ValueChanged<bool> onToggleDay;
  final ValueChanged<String> onToggleSlot;
  const _DayCard({
    required this.day, required this.allSlots, required this.selectedSlots,
    required this.onToggleDay, required this.onToggleSlot,
  });

  bool get _active => selectedSlots.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
            color: _active ? AppColors.primary.withOpacity(0.35) : AppColors.border,
            width: _active ? 1.5 : 1),
        boxShadow: [BoxShadow(
          color: _active
              ? AppColors.primary.withOpacity(0.06)
              : Colors.black.withOpacity(0.03),
          blurRadius: 8, offset: const Offset(0, 2),
        )],
      ),
      child: Column(children: [
        // Day header row
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
          child: Row(children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: _active ? AppColors.primary : AppColors.background,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(child: Text(day.substring(0, 3),
                  style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: _active ? Colors.white : AppColors.textHint))),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(day, style: AppTextStyles.labelLarge),
              Text(
                _active
                    ? '${selectedSlots.length} slot${selectedSlots.length == 1 ? '' : 's'} selected'
                    : 'Not available',
                style: AppTextStyles.bodySmall.copyWith(
                    color: _active ? AppColors.primary : AppColors.textHint),
              ),
            ])),
            Switch.adaptive(
              value: _active,
              onChanged: onToggleDay,
              activeColor: AppColors.primary,
            ),
          ]),
        ),

        // Slot grid (shown only when active)
        if (_active) ...[
          const Divider(height: 1, indent: 14, endIndent: 14, color: Color(0xFFF0F0F0)),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: allSlots.map((slot) {
                final sel = selectedSlots.contains(slot);
                return GestureDetector(
                  onTap: () => onToggleSlot(slot),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 150),
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 8),
                    decoration: BoxDecoration(
                      color: sel ? AppColors.primary : AppColors.background,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: sel ? AppColors.primary : AppColors.border),
                    ),
                    child: Text(slot,
                        style: TextStyle(
                          fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w500,
                          color: sel ? Colors.white : AppColors.textSecondary,
                        )),
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ]),
    );
  }
}
