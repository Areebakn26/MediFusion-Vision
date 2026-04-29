import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import '../bloc/auth_bloc.dart';
import '../../../../core/theme/app_theme.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl    = TextEditingController();
  final _emailCtrl   = TextEditingController();
  final _phoneCtrl   = TextEditingController();
  final _passCtrl    = TextEditingController();
  final _confirmCtrl = TextEditingController();
  // Doctor fields
  final _specCtrl = TextEditingController();
  final _licCtrl  = TextEditingController();
  final _expCtrl  = TextEditingController();
  final _feeCtrl  = TextEditingController();
  // Patient optional fields
  final _dobCtrl       = TextEditingController();
  final _cnicCtrl      = TextEditingController();
  final _emergCtrl     = TextEditingController();
  final _bloodCtrl     = TextEditingController();
  final _addressCtrl   = TextEditingController();

  String _role = 'patient';
  String? _selectedGender;
  bool _obscure = true;
  bool _obscureConfirm = true;
  bool _showOptional = false; // toggle optional patient fields
  int _step = 0;

  @override
  void dispose() {
    for (final c in [
      _nameCtrl, _emailCtrl, _phoneCtrl, _passCtrl, _confirmCtrl,
      _specCtrl, _licCtrl, _expCtrl, _feeCtrl,
      _dobCtrl, _cnicCtrl, _emergCtrl, _bloodCtrl, _addressCtrl,
    ]) c.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;
    context.read<AuthBloc>().add(AuthRegisterRequested(
      name: _nameCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      password: _passCtrl.text,
      role: _role,
      phone: _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      specialization: _role == 'doctor' ? _specCtrl.text.trim() : null,
      licenseNumber: _role == 'doctor' ? _licCtrl.text.trim() : null,
      yearsOfExperience: _role == 'doctor' && _expCtrl.text.isNotEmpty ? int.tryParse(_expCtrl.text) : null,
      consultationFee: _role == 'doctor' && _feeCtrl.text.isNotEmpty ? double.tryParse(_feeCtrl.text) : null,
      // Patient optional fields
      dateOfBirth: _role == 'patient' && _dobCtrl.text.isNotEmpty ? _dobCtrl.text.trim() : null,
      cnic: _role == 'patient' && _cnicCtrl.text.isNotEmpty ? _cnicCtrl.text.trim() : null,
      emergencyContact: _role == 'patient' && _emergCtrl.text.isNotEmpty ? _emergCtrl.text.trim() : null,
      gender: _role == 'patient' ? _selectedGender : null,
      bloodGroup: _role == 'patient' && _bloodCtrl.text.isNotEmpty ? _bloodCtrl.text.trim() : null,
      address: _role == 'patient' && _addressCtrl.text.isNotEmpty ? _addressCtrl.text.trim() : null,
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Create Account'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_step == 1) setState(() => _step = 0);
            else context.pop();
          },
        ),
      ),
      body: BlocConsumer<AuthBloc, AuthState>(
        listener: (context, state) {
          if (state is AuthRegisterSuccess) {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (_) => AlertDialog(
                title: const Text('Registration Successful!'),
                content: Text(state.message),
                actions: [
                  TextButton(
                    onPressed: () { Navigator.pop(context); context.go('/auth/login'); },
                    child: const Text('Go to Login'),
                  ),
                ],
              ),
            );
          } else if (state is AuthError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message), backgroundColor: AppColors.error),
            );
          }
        },
        builder: (context, state) {
          final loading = state is AuthLoading;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _step == 0 ? _buildRoleStep() : _buildDetailsStep(loading),
          );
        },
      ),
    );
  }

  // ── Step 0: Role selection ─────────────────────────────────────
  Widget _buildRoleStep() {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Who are you?', style: AppTextStyles.h3),
      const SizedBox(height: 8),
      Text('Select your role to get started',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
      const SizedBox(height: 40),
      _RoleCard(
        icon: Icons.person_outlined,
        title: 'Patient',
        subtitle: 'Book appointments & get AI-powered diagnoses',
        selected: _role == 'patient',
        onTap: () => setState(() => _role = 'patient'),
      ),
      const SizedBox(height: 16),
      _RoleCard(
        icon: Icons.medical_information_outlined,
        title: 'Doctor',
        subtitle: 'Manage patients & review AI diagnostic results',
        selected: _role == 'doctor',
        onTap: () => setState(() => _role = 'doctor'),
      ),
      const SizedBox(height: 48),
      ElevatedButton(
        onPressed: () => setState(() => _step = 1),
        child: const Text('Continue'),
      ),
      const SizedBox(height: 16),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Already have an account? ',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        GestureDetector(
          onTap: () => context.pushReplacement('/auth/login'),
          child: Text('Sign In',
              style: AppTextStyles.bodyMedium.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.w600)),
        ),
      ]),
    ]);
  }

  // ── Step 1: Details ────────────────────────────────────────────
  Widget _buildDetailsStep(bool loading) {
    return Form(
      key: _formKey,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(_role == 'patient' ? 'Patient Details' : 'Doctor Details', style: AppTextStyles.h3),
        const SizedBox(height: 8),
        Text('Fill in your information below',
            style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 32),

        // ── Common fields ────────────────────────────────────
        TextFormField(
          controller: _nameCtrl,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Full Name', prefixIcon: Icon(Icons.person_outline)),
          validator: (v) => (v == null || v.isEmpty) ? 'Enter your name' : null,
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _emailCtrl,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_outlined)),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Enter your email';
            if (!v.contains('@')) return 'Enter a valid email';
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _phoneCtrl,
          keyboardType: TextInputType.phone,
          textInputAction: TextInputAction.next,
          decoration: const InputDecoration(labelText: 'Phone (optional)', prefixIcon: Icon(Icons.phone_outlined)),
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _passCtrl,
          obscureText: _obscure,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'Password',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscure = !_obscure),
            ),
          ),
          validator: (v) {
            if (v == null || v.isEmpty) return 'Enter a password';
            if (v.length < 6) return 'At least 6 characters required';
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _confirmCtrl,
          obscureText: _obscureConfirm,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'Confirm Password',
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined),
              onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            ),
          ),
          validator: (v) => v != _passCtrl.text ? 'Passwords do not match' : null,
        ),

        // ── Patient optional fields ──────────────────────────
        if (_role == 'patient') ...[
          const SizedBox(height: 24),
          GestureDetector(
            onTap: () => setState(() => _showOptional = !_showOptional),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.primaryLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withOpacity(0.3)),
              ),
              child: Row(children: [
                const Icon(Icons.person_add_outlined, color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Complete Your Profile (Optional)',
                        style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
                    Text('Required to book appointments. You can add this later in Profile.',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary.withOpacity(0.7))),
                  ]),
                ),
                Icon(_showOptional ? Icons.expand_less : Icons.expand_more,
                    color: AppColors.primary),
              ]),
            ),
          ),
          if (_showOptional) ...[
            const SizedBox(height: 16),
            // DOB
            TextFormField(
              controller: _dobCtrl,
              readOnly: true,
              decoration: const InputDecoration(
                labelText: 'Date of Birth',
                prefixIcon: Icon(Icons.cake_outlined),
                hintText: 'YYYY-MM-DD',
              ),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: DateTime(1995),
                  firstDate: DateTime(1930),
                  lastDate: DateTime.now().subtract(const Duration(days: 365 * 5)),
                );
                if (picked != null) {
                  _dobCtrl.text = '${picked.year}-${picked.month.toString().padLeft(2,'0')}-${picked.day.toString().padLeft(2,'0')}';
                }
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _cnicCtrl,
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'CNIC',
                prefixIcon: Icon(Icons.badge_outlined),
                hintText: '12345-1234567-1',
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _emergCtrl,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Emergency Contact Phone',
                prefixIcon: Icon(Icons.emergency_outlined),
                hintText: '03001234567',
              ),
            ),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              value: _selectedGender,
              decoration: const InputDecoration(
                labelText: 'Gender',
                prefixIcon: Icon(Icons.wc_outlined),
              ),
              items: const [
                DropdownMenuItem(value: 'male', child: Text('Male')),
                DropdownMenuItem(value: 'female', child: Text('Female')),
                DropdownMenuItem(value: 'other', child: Text('Other')),
              ],
              onChanged: (v) => setState(() => _selectedGender = v),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _bloodCtrl,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'Blood Group (optional)',
                prefixIcon: Icon(Icons.bloodtype_outlined),
                hintText: 'A+, B-, O+...',
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressCtrl,
              textInputAction: TextInputAction.done,
              decoration: const InputDecoration(
                labelText: 'Address (optional)',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
          ],
        ],

        // ── Doctor fields ────────────────────────────────────
        if (_role == 'doctor') ...[
          const SizedBox(height: 24),
          const Divider(),
          const SizedBox(height: 16),
          Text('Professional Details', style: AppTextStyles.h5),
          const SizedBox(height: 16),
          TextFormField(
            controller: _specCtrl,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
                labelText: 'Specialization', prefixIcon: Icon(Icons.local_hospital_outlined)),
            validator: (v) =>
            (_role == 'doctor' && (v == null || v.isEmpty)) ? 'Enter your specialization' : null,
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _licCtrl,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
                labelText: 'License Number', prefixIcon: Icon(Icons.badge_outlined)),
            validator: (v) =>
            (_role == 'doctor' && (v == null || v.isEmpty)) ? 'Enter your license number' : null,
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(
              child: TextFormField(
                controller: _expCtrl,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                    labelText: 'Years of Experience', prefixIcon: Icon(Icons.work_outline)),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextFormField(
                controller: _feeCtrl,
                keyboardType: TextInputType.number,
                textInputAction: TextInputAction.done,
                decoration: const InputDecoration(
                    labelText: 'Consultation Fee', prefixIcon: Icon(Icons.attach_money)),
              ),
            ),
          ]),
        ],

        const SizedBox(height: 32),
        ElevatedButton(
          onPressed: loading ? null : _submit,
          child: loading
              ? const SizedBox(width: 22, height: 22,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Text(_role == 'doctor' ? 'Register as Doctor' : 'Create Account'),
        ),
        if (_role == 'doctor') ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.warningLight, borderRadius: BorderRadius.circular(10)),
            child: Row(children: [
              const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
              const SizedBox(width: 8),
              Expanded(
                child: Text('Doctor accounts require admin approval before activation.',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.warning)),
              ),
            ]),
          ),
        ],
        const SizedBox(height: 32),
      ]),
    );
  }
}

class _RoleCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool selected;
  final VoidCallback onTap;
  const _RoleCard({required this.icon, required this.title, required this.subtitle,
    required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: selected ? AppColors.primaryLight : AppColors.white,
          border: Border.all(color: selected ? AppColors.primary : AppColors.border, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(children: [
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(
              color: selected ? AppColors.primary : AppColors.background,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Icon(icon, color: selected ? Colors.white : AppColors.textSecondary, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: AppTextStyles.h5.copyWith(
                color: selected ? AppColors.primary : AppColors.textPrimary)),
            const SizedBox(height: 4),
            Text(subtitle, style: AppTextStyles.bodySmall),
          ])),
          if (selected) const Icon(Icons.check_circle, color: AppColors.primary, size: 24),
        ]),
      ),
    );
  }
}