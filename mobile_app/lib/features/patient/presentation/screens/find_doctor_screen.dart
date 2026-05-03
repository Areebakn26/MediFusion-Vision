import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import 'doctor_profile_screen.dart';

class FindDoctorScreen extends StatefulWidget {
  const FindDoctorScreen({super.key});
  @override
  State<FindDoctorScreen> createState() => _FindDoctorScreenState();
}

class _FindDoctorScreenState extends State<FindDoctorScreen> {
  final _searchCtrl = TextEditingController();
  List<DoctorListItemModel> _doctors = [];
  List<DoctorListItemModel> _filtered = [];
  bool _loading = true;
  String? _error;
  String? _selectedSpec;

  final List<String> _specializations = [
    'All', 'Neurologist', 'Ophthalmologist',
    'Radiologist', 'General Physician', 'Psychiatrist',
  ];

  @override
  void initState() { super.initState(); _loadDoctors(); }

  @override
  void dispose() { _searchCtrl.dispose(); super.dispose(); }

  Future<void> _loadDoctors() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().dio.get(ApiConstants.doctors);
      final rawList = res.data is List
          ? res.data as List
          : (res.data['doctors'] ?? res.data['data'] ?? []) as List;
      final list = rawList
          .map<DoctorListItemModel>((j) => DoctorListItemModel.fromJson(j as Map<String, dynamic>))
          .toList();
      if (mounted) setState(() { _doctors = list; _filtered = list; _loading = false; });
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = 'Failed to load doctors. Please try again.'; });
    }
  }

  void _filter() {
    final q = _searchCtrl.text.toLowerCase();
    setState(() {
      _filtered = _doctors.where((d) {
        final matchName = d.name.toLowerCase().contains(q);
        final matchSpec = d.profile.specialization?.toLowerCase().contains(q) ?? false;
        final matchFilter = _selectedSpec == null || _selectedSpec == 'All' ||
            (d.profile.specialization?.toLowerCase() == _selectedSpec!.toLowerCase());
        return (matchName || matchSpec) && matchFilter;
      }).toList();
    });
  }

  void _openDoctor(DoctorListItemModel doctor) {
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(
        builder: (_) => DoctorProfileScreen(doctorId: doctor.id, doctor: doctor),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      body: CustomScrollView(
        slivers: [
          // ── Header ──────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20, right: 20, bottom: 28,
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('Find a Doctor',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 26,
                        fontWeight: FontWeight.w700, color: Colors.white)),
                const SizedBox(height: 4),
                Text('${_doctors.length} verified specialists available',
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        color: Colors.white70)),
                const SizedBox(height: 20),
                // Search bar
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.08),
                        blurRadius: 16, offset: const Offset(0, 4))],
                  ),
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (_) => _filter(),
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search by name or specialization…',
                      hintStyle: TextStyle(fontFamily: 'Poppins', fontSize: 14,
                          color: Colors.grey.shade400),
                      prefixIcon: Icon(Icons.search_rounded, color: AppColors.primary),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded, size: 18),
                              onPressed: () { _searchCtrl.clear(); _filter(); })
                          : null,
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ]),
            ),
          ),

          // ── Filter chips ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.only(top: 20, bottom: 4),
              child: SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: _specializations.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final s = _specializations[i];
                    final selected = (_selectedSpec ?? 'All') == s;
                    return GestureDetector(
                      onTap: () { setState(() => _selectedSpec = s); _filter(); },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.primary : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                              color: selected ? AppColors.primary : Colors.grey.shade200),
                          boxShadow: selected ? [BoxShadow(
                              color: AppColors.primary.withOpacity(0.3),
                              blurRadius: 8, offset: const Offset(0, 2))] : [],
                        ),
                        child: Text(s,
                            style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: selected ? Colors.white : Colors.grey.shade600)),
                      ),
                    );
                  },
                ),
              ),
            ),
          ),

          // ── Results count ────────────────────────────────────────
          if (!_loading && _error == null)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Text('${_filtered.length} doctors found',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        fontWeight: FontWeight.w600, color: Colors.grey.shade500)),
              ),
            ),

          // ── Body ────────────────────────────────────────────────
          if (_loading)
            const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                      color: AppColors.error.withOpacity(0.08),
                      shape: BoxShape.circle),
                  child: const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.error),
                ),
                const SizedBox(height: 20),
                const Text('Connection Error',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 18,
                        fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                Text(_error!, textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        color: AppColors.textSecondary)),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _loadDoctors,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Try Again'),
                  style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                ),
              ])),
            )
          else if (_filtered.isEmpty)
            SliverFillRemaining(
              child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                      color: AppColors.primary.withOpacity(0.08),
                      shape: BoxShape.circle),
                  child: const Icon(Icons.person_search_rounded, size: 48, color: AppColors.primary),
                ),
                const SizedBox(height: 20),
                const Text('No Doctors Found',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 18,
                        fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                const SizedBox(height: 8),
                const Text('Try a different name or specialization',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        color: AppColors.textSecondary)),
              ])),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _DoctorCard(doctor: _filtered[i], onTap: () => _openDoctor(_filtered[i])),
                  ),
                  childCount: _filtered.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  final DoctorListItemModel doctor;
  final VoidCallback onTap;
  const _DoctorCard({required this.doctor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final profile = doctor.profile;
    final stars = (profile.rating ?? 0).clamp(0.0, 5.0);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 16, offset: const Offset(0, 4))],
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Avatar
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              gradient: doctor.profilePicture == null
                  ? const LinearGradient(
                      colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)],
                      begin: Alignment.topLeft, end: Alignment.bottomRight)
                  : null,
              borderRadius: BorderRadius.circular(18),
              image: doctor.profilePicture != null
                  ? DecorationImage(image: NetworkImage(doctor.profilePicture!), fit: BoxFit.cover)
                  : null,
            ),
            child: doctor.profilePicture == null
                ? Center(
                    child: Text(
                      doctor.name.isNotEmpty ? doctor.name[0].toUpperCase() : 'D',
                      style: const TextStyle(fontFamily: 'Poppins', color: Colors.white,
                          fontWeight: FontWeight.w700, fontSize: 24),
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text('Dr. ${doctor.name}',
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
                        fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                    overflow: TextOverflow.ellipsis),
              ),
              if (profile.status == 'approved' || profile.status == 'verified')
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                      color: const Color(0xFF00C853).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20)),
                  child: const Row(children: [
                    Icon(Icons.verified_rounded, color: Color(0xFF00C853), size: 12),
                    SizedBox(width: 3),
                    Text('Verified', style: TextStyle(fontFamily: 'Poppins', fontSize: 10,
                        fontWeight: FontWeight.w600, color: Color(0xFF00C853))),
                  ]),
                ),
            ]),
            const SizedBox(height: 3),
            Text(profile.specialization ?? 'General Physician',
                style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                    fontWeight: FontWeight.w500, color: AppColors.primary)),
            const SizedBox(height: 8),
            Row(children: [
              // Stars
              Row(children: List.generate(5, (i) => Icon(
                i < stars.round() ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 14,
                color: i < stars.round() ? const Color(0xFFF59E0B) : Colors.grey.shade300,
              ))),
              const SizedBox(width: 4),
              Text(stars > 0 ? stars.toStringAsFixed(1) : 'New',
                  style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: stars > 0 ? const Color(0xFFF59E0B) : Colors.grey.shade400)),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              _InfoChip(icon: Icons.work_outline_rounded,
                  label: '${profile.yearsOfExperience ?? 0} yrs exp'),
              const SizedBox(width: 8),
              _InfoChip(icon: Icons.people_outline_rounded,
                  label: '${profile.totalReviews} reviews'),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                      colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)]),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text('PKR ${profile.consultationFee?.toStringAsFixed(0) ?? '—'}',
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 11,
                        fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ]),
          ])),
        ]),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 12, color: AppColors.textSecondary),
    const SizedBox(width: 3),
    Text(label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 11,
        color: AppColors.textSecondary)),
  ]);
}