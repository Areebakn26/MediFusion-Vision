import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:easy_localization/easy_localization.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../shared/presentation/screens/notifications_screen.dart';

class PatientProfileScreen extends StatelessWidget {
  const PatientProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;
    final p = user.patientProfile;
    final isComplete = p != null &&
        p.dateOfBirth != null &&
        p.emergencyContact != null &&
        p.cnic != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      body: CustomScrollView(
        slivers: [
          // ── Gradient header ──────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(36)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                bottom: 32, left: 20, right: 20,
              ),
              child: Column(children: [
                // Avatar + name
                Stack(alignment: Alignment.bottomRight, children: [
                  Container(
                    width: 90, height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 3),
                      boxShadow: [BoxShadow(
                          color: Colors.black.withOpacity(0.15),
                          blurRadius: 16, offset: const Offset(0, 4))],
                      image: user.profilePicture != null
                          ? DecorationImage(
                              image: NetworkImage(user.profilePicture!),
                              fit: BoxFit.cover)
                          : null,
                      gradient: user.profilePicture == null
                          ? const LinearGradient(
                              colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight)
                          : null,
                    ),
                    child: user.profilePicture == null
                        ? Center(child: Text(
                            user.name.isNotEmpty
                                ? user.name[0].toUpperCase() : 'P',
                            style: const TextStyle(fontFamily: 'Poppins',
                                color: Colors.white, fontWeight: FontWeight.w800,
                                fontSize: 36)))
                        : null,
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => EditPatientProfileScreen(user: user))),
                    child: Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                            color: Colors.black.withOpacity(0.1), blurRadius: 6)],
                      ),
                      child: const Icon(Icons.edit_rounded,
                          size: 14, color: AppColors.primary),
                    ),
                  ),
                ]),
                const SizedBox(height: 14),
                Text(user.name,
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 22,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 4),
                Text(user.email,
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        color: Colors.white70)),
                if (user.phone != null) ...[
                  const SizedBox(height: 2),
                  Text(user.phone!,
                      style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                          color: Colors.white60)),
                ],
                const SizedBox(height: 20),
                // Completion status
                GestureDetector(
                  onTap: isComplete ? null : () => Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => EditPatientProfileScreen(user: user))),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: isComplete
                          ? Colors.white.withOpacity(0.15)
                          : const Color(0xFFFFF3CD).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isComplete
                            ? Colors.white.withOpacity(0.3)
                            : Colors.orange.withOpacity(0.4),
                      ),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(
                        isComplete
                            ? Icons.verified_rounded
                            : Icons.warning_amber_rounded,
                        color: isComplete ? const Color(0xFF00E676) : Colors.orange.shade300,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isComplete ? 'Profile Complete' : 'Complete your profile →',
                        style: TextStyle(
                          fontFamily: 'Poppins', fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: isComplete ? Colors.white : Colors.orange.shade200,
                        ),
                      ),
                    ]),
                  ),
                ),
              ]),
            ),
          ),

          // ── Profile info cards ───────────────────────────────
          if (p != null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                child: _InfoGrid(profile: p),
              ),
            ),

          // ── Menu sections ────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
            sliver: SliverList(
              delegate: SliverChildListDelegate([

                _MenuCard(title: 'Account', items: [
                  _MenuItem(
                    icon: Icons.manage_accounts_rounded,
                    iconColor: AppColors.primary,
                    title: 'Edit Profile',
                    subtitle: 'Update personal & medical info',
                    onTap: () => Navigator.of(context).push(MaterialPageRoute(
                        builder: (_) => EditPatientProfileScreen(user: user))),
                  ),
                  _MenuItem(
                    icon: Icons.lock_rounded,
                    iconColor: const Color(0xFF6C63FF),
                    title: 'Change Password',
                    subtitle: 'Update your password',
                    onTap: () {},
                  ),
                ]),

                const SizedBox(height: 14),

                _MenuCard(title: 'Preferences', items: [
                  _MenuItem(
                    icon: Icons.language_rounded,
                    iconColor: const Color(0xFF00BFA5),
                    title: 'Language',
                    subtitle: context.locale.languageCode == 'ur' ? 'اردو' : 'English',
                    trailing: _LanguageToggle(),
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.notifications_rounded,
                    iconColor: const Color(0xFFF59E0B),
                    title: 'Notifications',
                    subtitle: 'Manage alerts and reminders',
                    onTap: () => Navigator.of(context, rootNavigator: true).push(
                        MaterialPageRoute(
                            builder: (_) => const NotificationsScreen())),
                  ),
                  _MenuItem(
                    icon: Icons.accessibility_new_rounded,
                    iconColor: const Color(0xFFEE5A24),
                    title: 'Accessibility',
                    subtitle: 'Display and accessibility options',
                    onTap: () {},
                  ),
                ]),

                const SizedBox(height: 14),

                _MenuCard(title: 'Support', items: [
                  _MenuItem(
                    icon: Icons.help_rounded,
                    iconColor: const Color(0xFF4A90D9),
                    title: 'Help & FAQ',
                    subtitle: 'Get answers to common questions',
                    onTap: () {},
                  ),
                  _MenuItem(
                    icon: Icons.privacy_tip_rounded,
                    iconColor: const Color(0xFF9B59B6),
                    title: 'Privacy Policy',
                    subtitle: 'Read our privacy policy',
                    onTap: () {},
                  ),
                ]),

                const SizedBox(height: 28),

                // Sign out button
                GestureDetector(
                  onTap: () => _showLogoutDialog(context),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.error.withOpacity(0.2)),
                    ),
                    child: const Row(children: [
                      Icon(Icons.logout_rounded, color: AppColors.error, size: 22),
                      SizedBox(width: 14),
                      Text('Sign Out',
                          style: TextStyle(fontFamily: 'Poppins', fontSize: 15,
                              fontWeight: FontWeight.w700, color: AppColors.error)),
                      Spacer(),
                      Icon(Icons.arrow_forward_ios_rounded,
                          color: AppColors.error, size: 14),
                    ]),
                  ),
                ),

                const SizedBox(height: 12),
                Center(child: Text('MediFusion Vision v1.0.0',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                        color: Colors.grey.shade400))),
                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Sign Out',
            style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700)),
        content: const Text('Are you sure you want to sign out?',
            style: TextStyle(fontFamily: 'Poppins', fontSize: 14)),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel',
                style: TextStyle(fontFamily: 'Poppins', color: AppColors.textSecondary)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.read<AuthBloc>().add(AuthLogoutRequested());
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Sign Out',
                style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
  }
}

// ── Profile info grid ─────────────────────────────────────────────────────

class _InfoGrid extends StatelessWidget {
  final PatientProfileModel profile;
  const _InfoGrid({required this.profile});

  @override
  Widget build(BuildContext context) {
    final items = [
      if (profile.dateOfBirth != null)
        _InfoItem(icon: Icons.cake_rounded, label: 'Date of Birth',
            value: profile.dateOfBirth!, color: const Color(0xFF6C63FF)),
      if (profile.gender != null)
        _InfoItem(icon: Icons.wc_rounded, label: 'Gender',
            value: profile.gender![0].toUpperCase() + profile.gender!.substring(1),
            color: const Color(0xFF00BFA5)),
      if (profile.bloodGroup != null)
        _InfoItem(icon: Icons.bloodtype_rounded, label: 'Blood Group',
            value: profile.bloodGroup!, color: AppColors.error),
      if (profile.cnic != null)
        _InfoItem(icon: Icons.badge_rounded, label: 'CNIC',
            value: profile.cnic!, color: const Color(0xFFF59E0B)),
      if (profile.height != null)
        _InfoItem(icon: Icons.height_rounded, label: 'Height',
            value: '${profile.height} cm', color: const Color(0xFF4A90D9)),
      if (profile.weight != null)
        _InfoItem(icon: Icons.monitor_weight_rounded, label: 'Weight',
            value: '${profile.weight} kg', color: const Color(0xFF9B59B6)),
    ];

    if (items.isEmpty) return const SizedBox.shrink();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Health Info',
          style: TextStyle(fontFamily: 'Poppins', fontSize: 16,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      const SizedBox(height: 12),
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          childAspectRatio: 1.0,
          crossAxisSpacing: 10,
          mainAxisSpacing: 10,
        ),
        itemCount: items.length,
        itemBuilder: (_, i) => _InfoTile(item: items[i]),
      ),
    ]);
  }
}

class _InfoItem {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _InfoItem({required this.icon, required this.label,
      required this.value, required this.color});
}

class _InfoTile extends StatelessWidget {
  final _InfoItem item;
  const _InfoTile({required this.item});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04),
          blurRadius: 8, offset: const Offset(0, 2))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: item.color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(item.icon, size: 16, color: item.color),
      ),
      const Spacer(),
      Text(item.value,
          style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary),
          maxLines: 1, overflow: TextOverflow.ellipsis),
      const SizedBox(height: 2),
      Text(item.label,
          style: const TextStyle(fontFamily: 'Poppins', fontSize: 10,
              color: AppColors.textSecondary),
          maxLines: 1, overflow: TextOverflow.ellipsis),
    ]),
  );
}

// ── Menu card ─────────────────────────────────────────────────────────────

class _MenuCard extends StatelessWidget {
  final String title;
  final List<_MenuItem> items;
  const _MenuCard({required this.title, required this.items});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.only(left: 4, bottom: 10),
        child: Text(title,
            style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                fontWeight: FontWeight.w700,
                color: Colors.grey.shade500, letterSpacing: 0.5)),
      ),
      Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04),
              blurRadius: 12, offset: const Offset(0, 2))],
        ),
        child: Column(
          children: items.asMap().entries.map((e) {
            final isLast = e.key == items.length - 1;
            return Column(children: [
              e.value,
              if (!isLast)
                const Divider(height: 1, indent: 56, endIndent: 16,
                    color: Color(0xFFF0F0F5)),
            ]);
          }).toList(),
        ),
      ),
    ],
  );
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final Widget? trailing;
  const _MenuItem({required this.icon, required this.iconColor,
      required this.title, required this.subtitle,
      required this.onTap, this.trailing});

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onTap,
    borderRadius: BorderRadius.circular(20),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: iconColor),
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: const TextStyle(fontFamily: 'Poppins', fontSize: 14,
              fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text(subtitle, style: const TextStyle(fontFamily: 'Poppins', fontSize: 11,
              color: AppColors.textSecondary)),
        ])),
        trailing ?? const Icon(Icons.arrow_forward_ios_rounded,
            size: 14, color: AppColors.textHint),
      ]),
    ),
  );
}

// ── Language toggle ───────────────────────────────────────────────────────

class _LanguageToggle extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final current = context.locale.languageCode;
    return GestureDetector(
      onTap: () {
        final next = current == 'en' ? 'ur' : 'en';
        context.setLocale(Locale(next));
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(current == 'en' ? 'EN' : 'اردو',
            style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                fontWeight: FontWeight.w700, color: AppColors.primary)),
      ),
    );
  }
}

// ── Edit Profile Screen ───────────────────────────────────────────────────

class EditPatientProfileScreen extends StatefulWidget {
  final UserModel user;
  const EditPatientProfileScreen({super.key, required this.user});
  @override
  State<EditPatientProfileScreen> createState() => _EditPatientProfileScreenState();
}

class _EditPatientProfileScreenState extends State<EditPatientProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _phoneCtrl;
  late final TextEditingController _cnicCtrl;
  late final TextEditingController _dobCtrl;
  late final TextEditingController _addressCtrl;
  String? _selectedGender;
  late final TextEditingController _bloodCtrl;
  late final TextEditingController _heightCtrl;
  late final TextEditingController _weightCtrl;
  late final TextEditingController _allergiesCtrl;
  late final TextEditingController _emergNameCtrl;
  late final TextEditingController _emergPhoneCtrl;
  bool _saving = false;

  static const List<String> _bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  static const List<String> _genders = ['male','female','other'];

  @override
  void initState() {
    super.initState();
    final p = widget.user.patientProfile;
    _phoneCtrl      = TextEditingController(text: widget.user.phone ?? '');
    _cnicCtrl       = TextEditingController(text: p?.cnic ?? '');
    _dobCtrl        = TextEditingController(text: p?.dateOfBirth ?? '');
    _addressCtrl    = TextEditingController(text: p?.address ?? '');
    _selectedGender = p?.gender;
    _bloodCtrl      = TextEditingController(text: p?.bloodGroup ?? '');
    _heightCtrl     = TextEditingController(text: p?.height?.toString() ?? '');
    _weightCtrl     = TextEditingController(text: p?.weight?.toString() ?? '');
    _allergiesCtrl  = TextEditingController(text: p?.allergies?.join(', ') ?? '');
    _emergNameCtrl  = TextEditingController();
    _emergPhoneCtrl = TextEditingController(text: p?.emergencyContact ?? '');
  }

  @override
  void dispose() {
    for (final c in [_phoneCtrl, _cnicCtrl, _dobCtrl, _addressCtrl,
      _bloodCtrl, _heightCtrl, _weightCtrl, _allergiesCtrl,
      _emergNameCtrl, _emergPhoneCtrl]) c.dispose();
    super.dispose();
  }

  Future<void> _pickDOB() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dobCtrl.text.isNotEmpty
          ? DateTime.tryParse(_dobCtrl.text) ?? DateTime(1995)
          : DateTime(1995),
      firstDate: DateTime(1930),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
    );
    if (picked != null) {
      _dobCtrl.text =
          '${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}';
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final existingCnic = widget.user.patientProfile?.cnic ?? '';
      final newCnic = _cnicCtrl.text.trim();
      await ApiClient().dio.put(ApiConstants.updateProfile, data: {
        'phone':                _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
        if (newCnic.isNotEmpty && newCnic != existingCnic) 'cnic': newCnic,
        'dateOfBirth':          _dobCtrl.text.trim().isEmpty ? null : _dobCtrl.text.trim(),
        'gender':               _selectedGender,
        'address':              _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
        'bloodGroup':           _bloodCtrl.text.trim().isEmpty ? null : _bloodCtrl.text.trim(),
        'emergencyContactPhone':_emergPhoneCtrl.text.trim().isEmpty ? null : _emergPhoneCtrl.text.trim(),
        'height':               _heightCtrl.text.trim().isEmpty ? null : double.tryParse(_heightCtrl.text.trim()),
        'weight':               _weightCtrl.text.trim().isEmpty ? null : double.tryParse(_weightCtrl.text.trim()),
        'allergies':            _allergiesCtrl.text.trim().isEmpty
            ? [] : _allergiesCtrl.text.trim().split(',').map((e) => e.trim()).toList(),
      });
      final meRes = await ApiClient().dio.get(ApiConstants.getMe);
      final updatedUser = UserModel.fromJson(meRes.data);
      if (mounted) {
        context.read<AuthBloc>().updateUser(updatedUser);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Row(children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Profile updated successfully'),
          ]),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
        Navigator.of(context).pop();
      }
    } catch (e) {
      debugPrint('❌ save profile error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Failed to save. Please try again.'),
          backgroundColor: AppColors.error,
        ));
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                left: 16, right: 16, bottom: 20,
              ),
              child: Row(children: [
                GestureDetector(
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    width: 40, height: 40,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.arrow_back_rounded,
                        color: Colors.white, size: 20),
                  ),
                ),
                const SizedBox(width: 12),
                const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Edit Profile',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 20,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                  Text('Update your health information',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                          color: Colors.white70)),
                ]),
              ]),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Required fields notice
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withOpacity(0.07),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                  ),
                  child: const Row(children: [
                    Icon(Icons.info_rounded, color: AppColors.primary, size: 18),
                    SizedBox(width: 10),
                    Expanded(child: Text(
                      'CNIC, Date of Birth & Emergency Contact are required to book appointments.',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                          color: AppColors.primary),
                    )),
                  ]),
                ),
                const SizedBox(height: 20),

                Form(
                  key: _formKey,
                  child: Column(children: [
                    // Personal info
                    _FormSection(
                      icon: Icons.person_rounded,
                      iconColor: AppColors.primary,
                      title: 'Personal Information',
                      children: [
                        _Field(ctrl: _phoneCtrl, label: 'Phone Number',
                            icon: Icons.phone_rounded, required: true,
                            keyboard: TextInputType.phone,
                            validator: (v) => v!.isEmpty ? 'Required' : null),
                        _Field(ctrl: _cnicCtrl, label: 'CNIC',
                            icon: Icons.badge_rounded, required: true,
                            hint: '12345-1234567-1',
                            keyboard: TextInputType.number,
                            validator: (v) => v!.isEmpty ? 'Required' : null),
                        // DOB
                        Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: TextFormField(
                            controller: _dobCtrl,
                            readOnly: true,
                            onTap: _pickDOB,
                            style: const TextStyle(fontFamily: 'Poppins', fontSize: 14),
                            decoration: _deco('Date of Birth *',
                                Icons.cake_rounded,
                                suffix: const Icon(Icons.calendar_today_rounded,
                                    size: 16, color: AppColors.primary)),
                            validator: (v) => v!.isEmpty ? 'Required' : null,
                          ),
                        ),
                        // Gender
                        Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: DropdownButtonFormField<String>(
                            value: _selectedGender,
                            style: const TextStyle(fontFamily: 'Poppins',
                                fontSize: 14, color: AppColors.textPrimary),
                            decoration: _deco('Gender', Icons.wc_rounded),
                            items: _genders.map((g) => DropdownMenuItem(
                              value: g,
                              child: Text(g[0].toUpperCase() + g.substring(1)),
                            )).toList(),
                            onChanged: (v) => setState(() => _selectedGender = v),
                          ),
                        ),
                        _Field(ctrl: _addressCtrl, label: 'Address',
                            icon: Icons.location_on_rounded, required: true,
                            hint: 'House #, Street, City',
                            validator: (v) => v!.isEmpty ? 'Required' : null),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Medical info
                    _FormSection(
                      icon: Icons.medical_information_rounded,
                      iconColor: const Color(0xFF00BFA5),
                      title: 'Medical Information',
                      children: [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: DropdownButtonFormField<String>(
                            value: _bloodCtrl.text.isNotEmpty &&
                                _bloodGroups.contains(_bloodCtrl.text)
                                ? _bloodCtrl.text : null,
                            style: const TextStyle(fontFamily: 'Poppins',
                                fontSize: 14, color: AppColors.textPrimary),
                            decoration: _deco('Blood Group', Icons.bloodtype_rounded),
                            hint: const Text('Select blood group',
                                style: TextStyle(fontFamily: 'Poppins')),
                            items: _bloodGroups.map((g) => DropdownMenuItem(
                                value: g, child: Text(g))).toList(),
                            onChanged: (v) => _bloodCtrl.text = v ?? '',
                          ),
                        ),
                        Row(children: [
                          Expanded(child: _Field(ctrl: _heightCtrl, label: 'Height (cm)',
                              icon: Icons.height_rounded, hint: '175',
                              keyboard: TextInputType.number)),
                          const SizedBox(width: 12),
                          Expanded(child: _Field(ctrl: _weightCtrl, label: 'Weight (kg)',
                              icon: Icons.monitor_weight_rounded, hint: '70',
                              keyboard: TextInputType.number)),
                        ]),
                        _Field(ctrl: _allergiesCtrl, label: 'Allergies',
                            icon: Icons.warning_amber_rounded,
                            hint: 'Peanuts, Penicillin (comma separated)'),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Emergency contact
                    _FormSection(
                      icon: Icons.emergency_rounded,
                      iconColor: AppColors.error,
                      title: 'Emergency Contact',
                      children: [
                        _Field(ctrl: _emergNameCtrl, label: 'Contact Name',
                            icon: Icons.person_rounded,
                            hint: 'Family member name'),
                        _Field(ctrl: _emergPhoneCtrl, label: 'Contact Phone *',
                            icon: Icons.phone_rounded, required: true,
                            hint: '03001234567',
                            keyboard: TextInputType.phone,
                            validator: (v) => v!.isEmpty ? 'Required' : null),
                      ],
                    ),
                    const SizedBox(height: 28),

                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _save,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16)),
                          elevation: 4,
                          shadowColor: AppColors.primary.withOpacity(0.4),
                          textStyle: const TextStyle(fontFamily: 'Poppins',
                              fontSize: 16, fontWeight: FontWeight.w700),
                        ),
                        child: _saving
                            ? const SizedBox(width: 22, height: 22,
                                child: CircularProgressIndicator(
                                    color: Colors.white, strokeWidth: 2.5))
                            : const Row(mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.save_rounded, size: 20),
                                  SizedBox(width: 10),
                                  Text('Save Profile'),
                                ]),
                      ),
                    ),
                  ]),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  InputDecoration _deco(String label, IconData icon, {Widget? suffix}) =>
      InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 13),
        prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      );
}

// ── Form section ──────────────────────────────────────────────────────────

class _FormSection extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final List<Widget> children;
  const _FormSection({required this.icon, required this.iconColor,
      required this.title, required this.children});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(20),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04),
          blurRadius: 12, offset: const Offset(0, 2))],
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: iconColor),
        ),
        const SizedBox(width: 10),
        Text(title, style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
            fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      ]),
      const SizedBox(height: 16),
      const Divider(height: 1, color: Color(0xFFF0F0F5)),
      const SizedBox(height: 16),
      ...children,
    ]),
  );
}

// ── Reusable field ────────────────────────────────────────────────────────

class _Field extends StatelessWidget {
  final TextEditingController ctrl;
  final String label;
  final IconData icon;
  final String? hint;
  final bool required;
  final TextInputType keyboard;
  final String? Function(String?)? validator;
  const _Field({required this.ctrl, required this.label, required this.icon,
      this.hint, this.required = false, this.keyboard = TextInputType.text,
      this.validator});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: TextFormField(
      controller: ctrl,
      keyboardType: keyboard,
      textInputAction: TextInputAction.next,
      style: const TextStyle(fontFamily: 'Poppins', fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 13),
        hintText: hint,
        hintStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 12),
        prefixIcon: Icon(icon, size: 18, color: AppColors.primary),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: Colors.grey.shade200)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.primary, width: 2)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: AppColors.error)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      validator: validator,
    ),
  );
}
