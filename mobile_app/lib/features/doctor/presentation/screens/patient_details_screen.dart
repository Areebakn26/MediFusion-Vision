import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import 'scan_viewer_screen.dart';
import 'patient_list_screen.dart';

class PatientDetailsScreen extends StatelessWidget {
  final DoctorPatient patient;
  final List<Map<String, dynamic>> appointments;
  final List<Map<String, dynamic>> scans;

  const PatientDetailsScreen({
    super.key,
    required this.patient,
    required this.appointments,
    required this.scans,
  });

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: NestedScrollView(
          headerSliverBuilder: (_, __) => [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              backgroundColor: AppColors.primary,
              flexibleSpace: FlexibleSpaceBar(
                background: _Header(patient: patient),
              ),
              bottom: const TabBar(
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white60,
                tabs: [
                  Tab(text: 'Profile'),
                  Tab(text: 'Appointments'),
                  Tab(text: 'Scans'),
                ],
              ),
            ),
          ],
          body: TabBarView(children: [
            _ProfileTab(patient: patient),
            _AppointmentsTab(appointments: appointments),
            _ScansTab(scans: scans, patientName: patient.name),
          ]),
        ),
      ),
    );
  }
}

// ── Collapsible header ──────────────────────────────────────────────

class _Header extends StatelessWidget {
  final DoctorPatient patient;
  const _Header({required this.patient});

  static const List<Color> _avatarColors = [
    Color(0xFF6366F1), Color(0xFF10B981), Color(0xFFF59E0B),
    Color(0xFFEF4444), Color(0xFF3B82F6), Color(0xFF8B5CF6),
  ];
  Color get _avatarColor => _avatarColors[patient.name.codeUnitAt(0) % _avatarColors.length];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E40AF), AppColors.primary],
        ),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 48, 16, 0),
          child: Row(children: [
            Container(
              width: 64, height: 64,
              decoration: BoxDecoration(color: _avatarColor.withOpacity(0.25), shape: BoxShape.circle,
                  border: Border.all(color: Colors.white30, width: 2)),
              child: Center(child: Text(patient.initials,
                  style: const TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700,
                      color: Colors.white, fontSize: 22))),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(patient.name, style: const TextStyle(fontFamily: 'Poppins', fontSize: 18,
                  fontWeight: FontWeight.w700, color: Colors.white)),
              const SizedBox(height: 2),
              Text(patient.email, style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                  color: Colors.white70)),
              const SizedBox(height: 6),
              Row(children: [
                if (patient.gender != null)
                  _HeaderBadge(patient.gender![0].toUpperCase() + patient.gender!.substring(1)),
                if (patient.bloodGroup != null) ...[
                  const SizedBox(width: 6),
                  _HeaderBadge(patient.bloodGroup!),
                ],
                const SizedBox(width: 6),
                _HeaderBadge('${patient.appointmentCount} appt${patient.appointmentCount == 1 ? '' : 's'}'),
              ]),
            ])),
          ]),
        ),
      ),
    );
  }
}

class _HeaderBadge extends StatelessWidget {
  final String label;
  const _HeaderBadge(this.label);
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
    decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 11, color: Colors.white, fontWeight: FontWeight.w500)),
  );
}

// ── Profile tab ─────────────────────────────────────────────────────

class _ProfileTab extends StatelessWidget {
  final DoctorPatient patient;
  const _ProfileTab({required this.patient});

  @override
  Widget build(BuildContext context) {
    final dob = patient.dateOfBirth;
    String? age;
    if (dob != null) {
      final d = DateTime.tryParse(dob);
      if (d != null) {
        final years = DateTime.now().difference(d).inDays ~/ 365;
        age = '$years yrs';
      }
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(children: [

        // Demographics
        _InfoCard(title: 'Demographics', icon: Icons.person_outline, items: [
          _InfoRow('Date of Birth', patient.dateOfBirth ?? '—'),
          _InfoRow('Age', age ?? '—'),
          _InfoRow('Gender', patient.gender != null
              ? patient.gender![0].toUpperCase() + patient.gender!.substring(1) : '—'),
          _InfoRow('CNIC', patient.cnic ?? '—'),
        ]),
        const SizedBox(height: 12),

        // Medical info
        _InfoCard(title: 'Medical Information', icon: Icons.medical_information_outlined, items: [
          _InfoRow('Blood Group', patient.bloodGroup ?? '—'),
          _InfoRow('Height', patient.height != null ? '${patient.height} cm' : '—'),
          _InfoRow('Weight', patient.weight != null ? '${patient.weight} kg' : '—'),
          _InfoRow('Allergies', patient.allergies?.isNotEmpty == true
              ? patient.allergies!.join(', ') : 'None reported'),
        ]),
        const SizedBox(height: 12),

        // Contact
        _InfoCard(title: 'Contact & Emergency', icon: Icons.contact_phone_outlined, items: [
          _InfoRow('Address', patient.address ?? '—'),
          _InfoRow('Emergency Contact', patient.emergencyContact ?? '—'),
        ]),
        const SizedBox(height: 12),

        // Medical history
        if (patient.medicalHistory != null && patient.medicalHistory!.isNotEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.history_edu_outlined, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Text('Medical History', style: AppTextStyles.h5),
              ]),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Text(patient.medicalHistory!, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
            ]),
          ),

        const SizedBox(height: 32),
      ]),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<_InfoRow> items;
  const _InfoCard({required this.title, required this.icon, required this.items});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, color: AppColors.primary, size: 18),
        const SizedBox(width: 8),
        Text(title, style: AppTextStyles.h5),
      ]),
      const SizedBox(height: 12),
      const Divider(height: 1),
      const SizedBox(height: 8),
      ...items,
    ]),
  );
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow(this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      SizedBox(width: 140, child: Text(label, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint))),
      Expanded(child: Text(value, style: AppTextStyles.bodyMedium)),
    ]),
  );
}

// ── Appointments tab ────────────────────────────────────────────────

class _AppointmentsTab extends StatelessWidget {
  final List<Map<String, dynamic>> appointments;
  const _AppointmentsTab({required this.appointments});

  Color _statusColor(String s) {
    switch (s) {
      case 'confirmed':  return AppColors.success;
      case 'completed':  return AppColors.primary;
      case 'cancelled':  return AppColors.error;
      default:           return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (appointments.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.calendar_today_outlined, size: 48, color: AppColors.textHint.withOpacity(0.4)),
        const SizedBox(height: 12),
        Text('No appointments yet', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
      ]));
    }

    final sorted = [...appointments]..sort((a, b) {
      final da = a['date']?.toString() ?? '';
      final db = b['date']?.toString() ?? '';
      return db.compareTo(da); // newest first
    });

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sorted.length,
      itemBuilder: (_, i) {
        final a = sorted[i];
        final date   = a['date']?.toString() ?? '';
        final slot   = (a['time_slot'] ?? a['timeSlot'])?.toString() ?? '';
        final type   = a['type']?.toString() ?? 'physical';
        final status = a['status']?.toString() ?? 'pending';
        final reason = (a['reason'] ?? a['notes'])?.toString();

        final statusColor = _statusColor(status);

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: AppColors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6)],
          ),
          child: Row(children: [
            // Status bar
            Container(
              width: 4,
              height: 76,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(14), bottomLeft: Radius.circular(14)),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(date, style: AppTextStyles.labelLarge),
                    const SizedBox(height: 4),
                    Row(children: [
                      Icon(Icons.access_time_outlined, size: 13, color: AppColors.textHint),
                      const SizedBox(width: 3),
                      Text(slot, style: AppTextStyles.bodySmall),
                      const SizedBox(width: 10),
                      Icon(type == 'virtual' ? Icons.videocam_outlined : Icons.local_hospital_outlined,
                          size: 13, color: AppColors.textHint),
                      const SizedBox(width: 3),
                      Text(type == 'virtual' ? 'Virtual' : 'In-Person', style: AppTextStyles.bodySmall),
                    ]),
                    if (reason != null && reason.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(reason, style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ])),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(status[0].toUpperCase() + status.substring(1),
                        style: AppTextStyles.labelSmall.copyWith(color: statusColor)),
                  ),
                ]),
              ),
            ),
          ]),
        );
      },
    );
  }
}

// ── Scans tab ───────────────────────────────────────────────────────

class _ScansTab extends StatelessWidget {
  final List<Map<String, dynamic>> scans;
  final String patientName;
  const _ScansTab({required this.scans, required this.patientName});

  IconData _scanIcon(String type) {
    switch (type.toLowerCase()) {
      case 'chest':  return Icons.monitor_heart_outlined;
      case 'brain':  return Icons.psychology_outlined;
      case 'eye':    return Icons.remove_red_eye_outlined;
      case 'skin':   return Icons.face_outlined;
      default:       return Icons.document_scanner_outlined;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'analyzed':  return AppColors.success;
      case 'pending':   return AppColors.warning;
      case 'failed':    return AppColors.error;
      default:          return AppColors.primary;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (scans.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.document_scanner_outlined, size: 48, color: AppColors.textHint.withOpacity(0.4)),
        const SizedBox(height: 12),
        Text('No scans uploaded', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
        const SizedBox(height: 4),
        Text('$patientName has not uploaded any scans yet.',
            style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint)),
      ]));
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: scans.length,
      itemBuilder: (_, i) {
        final s = scans[i];
        final type      = (s['scan_type'] ?? s['scanType'])?.toString() ?? 'other';
        final status    = s['status']?.toString() ?? 'pending';
        final date      = (s['createdAt'] ?? s['upload_date'])?.toString() ?? '';
        final aiResult  = (s['ai_prediction'] ?? s['aiPrediction'])?.toString();
        final statusColor = _statusColor(status);
        final shortDate = date.length >= 10 ? date.substring(0, 10) : date;

        return GestureDetector(
          onTap: () => Navigator.of(context).push(MaterialPageRoute(
            builder: (_) => ScanViewerScreen(scan: s),
          )),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6)],
            ),
            child: Row(children: [
              // Scan type icon bubble
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
                child: Icon(_scanIcon(type), color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(type.toUpperCase(), style: AppTextStyles.labelLarge),
                const SizedBox(height: 4),
                Row(children: [
                  Icon(Icons.calendar_today_outlined, size: 12, color: AppColors.textHint),
                  const SizedBox(width: 4),
                  Text(shortDate, style: AppTextStyles.bodySmall),
                ]),
                if (aiResult != null) ...[
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.auto_awesome, size: 12, color: AppColors.primary),
                    const SizedBox(width: 4),
                    Expanded(child: Text('AI: $aiResult',
                        style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary),
                        maxLines: 1, overflow: TextOverflow.ellipsis)),
                  ]),
                ],
              ])),
              Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(status[0].toUpperCase() + status.substring(1),
                      style: AppTextStyles.labelSmall.copyWith(color: statusColor)),
                ),
                const SizedBox(height: 8),
                const Icon(Icons.chevron_right, color: AppColors.textHint, size: 18),
              ]),
            ]),
          ),
        );
      },
    );
  }
}
