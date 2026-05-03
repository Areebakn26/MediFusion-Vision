import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class MyScansScreen extends StatefulWidget {
  const MyScansScreen({super.key});
  @override
  State<MyScansScreen> createState() => _MyScansScreenState();
}

class _MyScansScreenState extends State<MyScansScreen> {
  List<ScanModel> _scans = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().dio.get(ApiConstants.scans);
      if (kDebugMode) print('📋 Scans response type: ${res.data.runtimeType}');
      final list = res.data is List ? res.data as List : (res.data['scans'] ?? res.data ?? []);
      if (mounted) setState(() {
        _scans = list.map<ScanModel>((j) => ScanModel.fromJson(j as Map<String, dynamic>)).toList();
        _loading = false;
      });
    } catch (e) {
      if (kDebugMode) print('❌ Scans error: $e');
      if (mounted) setState(() { _loading = false; _error = e.toString(); });
    }
  }

  int get _pendingCount   => _scans.where((s) => s.status == 'pending').length;
  int get _analyzedCount  => _scans.where((s) => s.status == 'analyzed').length;
  int get _verifiedCount  => _scans.where((s) => s.status == 'verified').length;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/patient/upload-scan'),
        icon: const Icon(Icons.add_rounded),
        label: const Text('Upload Scan',
            style: TextStyle(fontFamily: 'Poppins', fontWeight: FontWeight.w600)),
        backgroundColor: AppColors.primary,
        elevation: 4,
      ),
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
                Row(children: [
                  const Expanded(
                    child: Text('My Scans',
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 26,
                            fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                  IconButton(
                    onPressed: _load,
                    icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                  ),
                ]),
                const SizedBox(height: 4),
                Text('${_scans.length} scan${_scans.length == 1 ? '' : 's'} uploaded',
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        color: Colors.white70)),
                if (_scans.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  // Stats row
                  Row(children: [
                    _HeaderStat(label: 'Pending', count: _pendingCount,
                        icon: Icons.schedule_rounded, color: const Color(0xFFF59E0B)),
                    const SizedBox(width: 10),
                    _HeaderStat(label: 'Analyzed', count: _analyzedCount,
                        icon: Icons.psychology_rounded, color: const Color(0xFF4A90D9)),
                    const SizedBox(width: 10),
                    _HeaderStat(label: 'Ready', count: _verifiedCount,
                        icon: Icons.task_alt_rounded, color: const Color(0xFF00C853)),
                  ]),
                ],
              ]),
            ),
          ),

          // ── Body ────────────────────────────────────────────────
          if (_loading)
            const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()))
          else if (_error != null)
            SliverFillRemaining(
              child: Center(child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                        color: AppColors.error.withOpacity(0.08),
                        shape: BoxShape.circle),
                    child: const Icon(Icons.error_outline_rounded,
                        size: 48, color: AppColors.error),
                  ),
                  const SizedBox(height: 20),
                  const Text('Failed to load scans',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 18,
                          fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 8),
                  Text(_error!, textAlign: TextAlign.center,
                      style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                          color: AppColors.textSecondary)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _load,
                    icon: const Icon(Icons.refresh_rounded),
                    label: const Text('Retry'),
                  ),
                ]),
              )),
            )
          else if (_scans.isEmpty)
            SliverFillRemaining(
              child: Center(child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary.withOpacity(0.1),
                            AppColors.primary.withOpacity(0.05)],
                        begin: Alignment.topLeft, end: Alignment.bottomRight,
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.document_scanner_outlined,
                        size: 56, color: AppColors.primary),
                  ),
                  const SizedBox(height: 24),
                  const Text('No Scans Yet',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 22,
                          fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                  const SizedBox(height: 10),
                  const Text('Upload your medical scans to get\nAI-powered analysis and insights',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 14,
                          color: AppColors.textSecondary, height: 1.5)),
                  const SizedBox(height: 32),
                  ElevatedButton.icon(
                    onPressed: () => context.push('/patient/upload-scan'),
                    icon: const Icon(Icons.upload_file_rounded),
                    label: const Text('Upload Your First Scan'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14)),
                      textStyle: const TextStyle(fontFamily: 'Poppins',
                          fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ),
                ]),
              )),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 100),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (_, i) => Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _ScanCard(
                      scan: _scans[i],
                      onTap: () => context.push('/patient/scan/${_scans[i].id}'),
                    ),
                  ),
                  childCount: _scans.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Header stat widget ────────────────────────────────────────────────────

class _HeaderStat extends StatelessWidget {
  final String label;
  final int count;
  final IconData icon;
  final Color color;
  const _HeaderStat({required this.label, required this.count,
      required this.icon, required this.color});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(color: color.withOpacity(0.2), shape: BoxShape.circle),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 8),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('$count', style: const TextStyle(fontFamily: 'Poppins', fontSize: 18,
              fontWeight: FontWeight.w800, color: Colors.white)),
          Text(label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 10,
              color: Colors.white70)),
        ]),
      ]),
    ),
  );
}

// ── Scan card ─────────────────────────────────────────────────────────────

class _ScanCard extends StatelessWidget {
  final ScanModel scan;
  final VoidCallback onTap;
  const _ScanCard({required this.scan, required this.onTap});

  IconData get _icon {
    final t = scan.scanType.toLowerCase();
    if (t.contains('mri') || t.contains('brain')) return Icons.psychology_rounded;
    if (t.contains('retinal') || t.contains('eye')) return Icons.remove_red_eye_rounded;
    if (t.contains('xray') || t.contains('x-ray')) return Icons.medical_information_rounded;
    return Icons.document_scanner_rounded;
  }

  List<Color> get _gradientColors {
    final t = scan.scanType.toLowerCase();
    if (t.contains('mri') || t.contains('brain'))
      return [const Color(0xFF6C63FF), const Color(0xFF4A90D9)];
    if (t.contains('retinal'))
      return [const Color(0xFF00BFA5), const Color(0xFF00897B)];
    if (t.contains('xray'))
      return [const Color(0xFFFF6B6B), const Color(0xFFEE5A24)];
    return [const Color(0xFF4A90D9), const Color(0xFF2E86C1)];
  }

  String get _scanLabel => switch (scan.scanType) {
    'mri_brain' => 'Brain MRI',
    'retinal'   => 'Retinal Scan',
    'xray'      => 'X-Ray',
    _           => scan.scanType.toUpperCase(),
  };

  String get _statusLabel => switch (scan.status) {
    'pending'  => 'Pending Review',
    'analyzed' => 'AI Analyzed',
    'verified' => 'Report Ready',
    _          => scan.status,
  };

  Color get _statusColor => switch (scan.status) {
    'pending'  => const Color(0xFFF59E0B),
    'analyzed' => const Color(0xFF4A90D9),
    'verified' => const Color(0xFF00C853),
    _          => AppColors.textHint,
  };

  IconData get _statusIcon => switch (scan.status) {
    'pending'  => Icons.schedule_rounded,
    'analyzed' => Icons.psychology_rounded,
    'verified' => Icons.task_alt_rounded,
    _          => Icons.help_outline_rounded,
  };

  String _formatDate(String date) {
    if (date.length < 10) return date;
    try {
      final d = DateTime.parse(date);
      const months = ['Jan','Feb','Mar','Apr','May','Jun',
                      'Jul','Aug','Sep','Oct','Nov','Dec'];
      return '${d.day} ${months[d.month - 1]} ${d.year}';
    } catch (_) { return date.substring(0, 10); }
  }

  @override
  Widget build(BuildContext context) {
    final hasReport = scan.report != null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 16, offset: const Offset(0, 4))],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            // Icon with gradient
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                    colors: _gradientColors,
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(18),
              ),
              child: Icon(_icon, color: Colors.white, size: 30),
            ),
            const SizedBox(width: 14),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(
                  child: Text(_scanLabel,
                      style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
                          fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                ),
                if (hasReport)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00C853).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.description_rounded,
                          size: 11, color: Color(0xFF00C853)),
                      SizedBox(width: 3),
                      Text('Report',
                          style: TextStyle(fontFamily: 'Poppins', fontSize: 10,
                              fontWeight: FontWeight.w700, color: Color(0xFF00C853))),
                    ]),
                  ),
              ]),
              const SizedBox(height: 4),
              Text('Uploaded ${_formatDate(scan.uploadDate)}',
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                      color: AppColors.textSecondary)),
              const SizedBox(height: 10),
              // Status + progress
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: _statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(_statusIcon, size: 12, color: _statusColor),
                    const SizedBox(width: 4),
                    Text(_statusLabel,
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                            fontWeight: FontWeight.w700, color: _statusColor)),
                  ]),
                ),
                const Spacer(),
                const Icon(Icons.chevron_right_rounded,
                    color: AppColors.textHint, size: 20),
              ]),
            ])),
          ]),
        ),
      ),
    );
  }
}