import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import 'patient_details_screen.dart';

/// Flat patient model assembled from appointment + scan data.
class DoctorPatient {
  final String profileId;      // PatientProfile UUID — matches scan.patient_id
  final String name;
  final String email;
  final String? gender;
  final String? dateOfBirth;
  final String? bloodGroup;
  final String? cnic;
  final String? address;
  final String? emergencyContact;
  final String? medicalHistory;
  final double? height;
  final double? weight;
  final List<String>? allergies;
  final int appointmentCount;
  final String? lastApptDate;

  const DoctorPatient({
    required this.profileId,
    required this.name,
    required this.email,
    this.gender,
    this.dateOfBirth,
    this.bloodGroup,
    this.cnic,
    this.address,
    this.emergencyContact,
    this.medicalHistory,
    this.height,
    this.weight,
    this.allergies,
    required this.appointmentCount,
    this.lastApptDate,
  });

  static double? _pd(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    return double.tryParse(v.toString());
  }

  static List<String>? _pl(dynamic v) {
    if (v == null) return null;
    if (v is List) return v.map((e) => e.toString()).toList();
    if (v is String && v.isNotEmpty) return v.split(',').map((e) => e.trim()).toList();
    return null;
  }

  factory DoctorPatient.fromAppointment(Map<String, dynamic> appt, int count) {
    final p = appt['patient'] as Map<String, dynamic>? ?? {};
    return DoctorPatient(
      profileId:      appt['patient_id']?.toString() ?? '',
      name:           p['name']?.toString() ?? 'Unknown',
      email:          p['email']?.toString() ?? '',
      gender:         p['gender']?.toString(),
      dateOfBirth:    (p['date_of_birth'] ?? p['dateOfBirth'])?.toString(),
      bloodGroup:     (p['blood_group'] ?? p['bloodGroup'])?.toString(),
      cnic:           p['cnic']?.toString(),
      address:        p['address']?.toString(),
      emergencyContact: (p['emergency_contact_phone'] ?? p['emergency_contact'])?.toString(),
      medicalHistory: p['medical_history']?.toString(),
      height:         _pd(p['height']),
      weight:         _pd(p['weight']),
      allergies:      _pl(p['allergies']),
      appointmentCount: count,
      lastApptDate:   appt['date']?.toString(),
    );
  }

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    return name.isNotEmpty ? name[0].toUpperCase() : 'P';
  }
}

class PatientListScreen extends StatefulWidget {
  const PatientListScreen({super.key});
  @override
  State<PatientListScreen> createState() => _PatientListScreenState();
}

class _PatientListScreenState extends State<PatientListScreen> {
  final _search = TextEditingController();
  List<DoctorPatient> _patients = [];
  List<DoctorPatient> _filtered = [];
  List<Map<String, dynamic>> _allAppts = [];
  List<Map<String, dynamic>> _allScans = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() { _search.dispose(); super.dispose(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dio = ApiClient().dio;
      final results = await Future.wait([
        dio.get(ApiConstants.appointments),
        dio.get(ApiConstants.scans),
      ]);

      // Both endpoints return plain JSON arrays
      final appts = (results[0].data as List<dynamic>).cast<Map<String, dynamic>>();
      final scans = (results[1].data as List<dynamic>).cast<Map<String, dynamic>>();

      debugPrint('📋 Loaded ${appts.length} appts, ${scans.length} scans');
      if (scans.isNotEmpty) {
        debugPrint('🔬 First scan keys: ${scans[0].keys.toList()}');
        debugPrint('🔬 First scan patient_id: ${scans[0]['patient_id']}');
      }
      if (appts.isNotEmpty) {
        debugPrint('📅 First appt patient_id: ${appts[0]['patient_id']}');
      }

      // Deduplicate patients by profileId, accumulate appointment counts
      final countMap = <String, int>{};
      final firstAppt = <String, Map<String, dynamic>>{};
      for (final a in appts) {
        final pid = a['patient_id']?.toString() ?? '';
        if (pid.isEmpty) continue;
        countMap[pid] = (countMap[pid] ?? 0) + 1;
        firstAppt[pid] ??= a;
      }

      final patients = countMap.entries
          .map((e) => DoctorPatient.fromAppointment(firstAppt[e.key]!, e.value))
          .toList()
        ..sort((a, b) => a.name.compareTo(b.name));

      if (mounted) {
        setState(() {
          _allAppts   = appts;
          _allScans   = scans;
          _patients   = patients;
          _filtered   = patients;
          _loading    = false;
        });
      }
    } catch (e) {
      debugPrint('❌ patient list error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  void _filter(String q) {
    final lower = q.toLowerCase();
    setState(() {
      _filtered = q.isEmpty
          ? _patients
          : _patients.where((p) =>
              p.name.toLowerCase().contains(lower) ||
              p.email.toLowerCase().contains(lower)).toList();
    });
  }

  void _open(DoctorPatient patient) {
    final appts = _allAppts.where((a) => a['patient_id']?.toString() == patient.profileId).toList();
    final scans = _allScans.where((s) => s['patient_id']?.toString() == patient.profileId).toList();
    debugPrint('👤 Opening patient ${patient.name} | profileId=${patient.profileId}');
    debugPrint('   → ${appts.length} appts, ${scans.length} scans');
    if (_allScans.isNotEmpty) {
      debugPrint('   → All scan patient_ids: ${_allScans.map((s) => s['patient_id']).toSet()}');
    }
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => PatientDetailsScreen(patient: patient, appointments: appts, scans: scans),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Patients'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load, tooltip: 'Refresh'),
        ],
      ),
      body: Column(children: [
        // Search bar
        Container(
          color: AppColors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          child: TextField(
            controller: _search,
            onChanged: _filter,
            decoration: InputDecoration(
              hintText: 'Search by name or email…',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _search.text.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear), onPressed: () { _search.clear(); _filter(''); })
                  : null,
            ),
          ),
        ),

        // Count header
        if (!_loading)
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
            child: Row(children: [
              Text('${_filtered.length} patient${_filtered.length == 1 ? '' : 's'}',
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.textHint)),
            ]),
          ),

        Expanded(
          child: _loading
              ? const Center(child: CircularProgressIndicator())
              : _filtered.isEmpty
              ? _emptyState()
              : RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                    itemCount: _filtered.length,
                    itemBuilder: (_, i) => _PatientCard(
                      patient: _filtered[i],
                      onTap: () => _open(_filtered[i]),
                    ),
                  ),
                ),
        ),
      ]),
    );
  }

  Widget _emptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.people_outline, size: 56, color: AppColors.textHint.withOpacity(0.4)),
      const SizedBox(height: 12),
      Text('No patients found', style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
      const SizedBox(height: 4),
      Text('Patients who book appointments will appear here.',
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint)),
    ]),
  );
}

// ── Patient card ────────────────────────────────────────────────────

class _PatientCard extends StatelessWidget {
  final DoctorPatient patient;
  final VoidCallback onTap;
  const _PatientCard({required this.patient, required this.onTap});

  static const List<Color> _avatarColors = [
    Color(0xFF6366F1), Color(0xFF10B981), Color(0xFFF59E0B),
    Color(0xFFEF4444), Color(0xFF3B82F6), Color(0xFF8B5CF6),
  ];

  Color get _avatarColor => _avatarColors[patient.name.codeUnitAt(0) % _avatarColors.length];

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        child: Row(children: [
          // Avatar
          Container(
            width: 52, height: 52,
            decoration: BoxDecoration(color: _avatarColor.withOpacity(0.12), shape: BoxShape.circle),
            child: Center(child: Text(patient.initials,
                style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w700,
                    color: _avatarColor, fontSize: 18))),
          ),
          const SizedBox(width: 14),
          // Info
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(patient.name, style: AppTextStyles.labelLarge, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(patient.email, style: AppTextStyles.bodySmall, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 6),
            Row(children: [
              if (patient.gender != null) ...[
                _Chip(patient.gender!.isNotEmpty
                    ? patient.gender![0].toUpperCase() + patient.gender!.substring(1)
                    : patient.gender!, color: AppColors.primary),
                const SizedBox(width: 6),
              ],
              if (patient.bloodGroup != null) ...[
                _Chip(patient.bloodGroup!, color: AppColors.error),
                const SizedBox(width: 6),
              ],
              _Chip('${patient.appointmentCount} appt${patient.appointmentCount == 1 ? '' : 's'}',
                  color: AppColors.success),
            ]),
          ])),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, color: AppColors.textHint),
        ]),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  const _Chip(this.label, {required this.color});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: AppTextStyles.labelSmall.copyWith(color: color, fontSize: 10)),
  );
}
