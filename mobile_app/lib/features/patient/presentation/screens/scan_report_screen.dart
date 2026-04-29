import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class ScanReportScreen extends StatefulWidget {
  final String scanId;
  const ScanReportScreen({super.key, required this.scanId});
  @override
  State<ScanReportScreen> createState() => _ScanReportScreenState();
}

class _ScanReportScreenState extends State<ScanReportScreen> {
  ScanModel? _scan;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await ApiClient().dio.get('${ApiConstants.scans}/${widget.scanId}');
      if (kDebugMode) print('🔍 Scan response: ${res.data}');
      // Backend returns flat object directly (not wrapped in {scan:...})
      if (mounted) setState(() {
        _scan = ScanModel.fromJson(res.data as Map<String, dynamic>);
        _loading = false;
      });
    } catch (e) {
      if (kDebugMode) print('❌ Scan load error: $e');
      if (mounted) setState(() { _loading = false; _error = e.toString(); });
    }
  }

  // Backend stores file_url as '/uploads/filename.jpg'
  // Full URL = 'http://localhost:5000' + '/uploads/filename.jpg'
  String get _scanImageUrl {
    final filePath = _scan?.filePath ?? '';
    if (filePath.startsWith('http')) return filePath;
    // Remove leading slash if present, then build full URL
    final clean = filePath.startsWith('/') ? filePath : '/$filePath';
    return 'http://localhost:5000$clean';
  }

  String get _scanTypeLabel {
    switch (_scan?.scanType) {
      case 'mri_brain': return 'Brain MRI';
      case 'retinal':   return 'Retinal Scan';
      case 'xray':      return 'X-Ray';
      default:          return _scan?.scanType.toUpperCase() ?? 'Scan';
    }
  }

  String _formatDate(String? date) {
    if (date == null || date.isEmpty) return 'N/A';
    try {
      final d = DateTime.parse(date);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) { return date.length > 10 ? date.substring(0, 10) : date; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Scan Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Icon(Icons.error_outline, size: 48, color: AppColors.error),
        const SizedBox(height: 12),
        Text('Failed to load scan', style: AppTextStyles.h5),
        const SizedBox(height: 8),
        Text(_error!, style: AppTextStyles.bodySmall, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        ElevatedButton(onPressed: _load, child: const Text('Retry')),
      ]))
          : _scan == null
          ? const Center(child: Text('Scan not found'))
          : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Scan Info Card ─────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(children: [
              Container(
                width: 52, height: 52,
                decoration: BoxDecoration(
                    color: AppColors.primaryLight,
                    borderRadius: BorderRadius.circular(14)),
                child: Icon(
                    _scan!.scanType.contains('retinal')
                        ? Icons.remove_red_eye_outlined
                        : Icons.psychology_outlined,
                    color: AppColors.primary, size: 28),
              ),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_scanTypeLabel, style: AppTextStyles.h5),
                Text('Uploaded ${_formatDate(_scan!.uploadDate)}',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: 6),
                _StatusBadge(status: _scan!.status),
              ])),
            ]),
          ),
          const SizedBox(height: 20),

          // ── Scan Image ─────────────────────────────────
          Text('Scan Image', style: AppTextStyles.h5),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 260,
              width: double.infinity,
              color: const Color(0xFF1A1A2E),
              child: Image.network(
                _scanImageUrl,
                fit: BoxFit.contain,
                loadingBuilder: (_, child, progress) {
                  if (progress == null) return child;
                  return const Center(child: CircularProgressIndicator(color: Colors.white));
                },
                errorBuilder: (_, error, __) {
                  if (kDebugMode) print('🖼 Image load error: $error | URL: $_scanImageUrl');
                  return Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const Icon(Icons.image_not_supported, size: 48, color: Colors.white54),
                    const SizedBox(height: 8),
                    Text('Image preview not available',
                        style: AppTextStyles.bodySmall.copyWith(color: Colors.white54)),
                    const SizedBox(height: 4),
                    Text(_scanImageUrl,
                        style: const TextStyle(color: Colors.white30, fontSize: 10),
                        textAlign: TextAlign.center),
                  ]);
                },
              ),
            ),
          ),
          const SizedBox(height: 24),

          // ── Status Section ────────────────────────────
          if (_scan!.aiAnalysis == null && _scan!.report == null)
            _buildPending()
          else ...[
            if (_scan!.aiAnalysis != null) _buildAISection(),
            if (_scan!.report != null) _buildReportSection(),
          ],
        ]),
      ),
    );
  }

  Widget _buildPending() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
          color: AppColors.warningLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.warning.withValues(alpha: 0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.hourglass_top_rounded, color: AppColors.warning, size: 24),
          const SizedBox(width: 10),
          Text('Awaiting Doctor Review',
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.warning)),
        ]),
        const SizedBox(height: 10),
        const Text(
            'Your scan has been uploaded successfully and saved to your profile. '
                'Book an appointment with a doctor — they will run the AI analysis and provide a detailed report.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.5)),
        const SizedBox(height: 16),
        Row(children: [
          const Icon(Icons.check_circle, color: AppColors.success, size: 16),
          const SizedBox(width: 6),
          Text('Scan uploaded', style: AppTextStyles.bodySmall.copyWith(color: AppColors.success)),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          Icon(Icons.radio_button_unchecked, color: Colors.grey[400], size: 16),
          const SizedBox(width: 6),
          Text('Book appointment with doctor', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          Icon(Icons.radio_button_unchecked, color: Colors.grey[400], size: 16),
          const SizedBox(width: 6),
          Text('Doctor runs AI analysis', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        ]),
        const SizedBox(height: 6),
        Row(children: [
          Icon(Icons.radio_button_unchecked, color: Colors.grey[400], size: 16),
          const SizedBox(width: 6),
          Text('Report generated', style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary)),
        ]),
      ]),
    );
  }

  Widget _buildAISection() {
    final ai = _scan!.aiAnalysis!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('AI Analysis', style: AppTextStyles.h5),
      const SizedBox(height: 12),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.auto_awesome, color: AppColors.primary, size: 20),
            const SizedBox(width: 8),
            Text('AI Prediction', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
          ]),
          const SizedBox(height: 12),
          Text(ai.prediction ?? 'N/A', style: AppTextStyles.h4),
          if (ai.confidence != null) ...[
            const SizedBox(height: 8),
            Row(children: [
              Text('Confidence: ', style: AppTextStyles.bodySmall),
              Expanded(child: LinearProgressIndicator(
                  value: ai.confidence,
                  backgroundColor: AppColors.border,
                  color: AppColors.primary, minHeight: 8)),
              const SizedBox(width: 8),
              Text('${((ai.confidence ?? 0) * 100).toStringAsFixed(1)}%',
                  style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
            ]),
          ],
          if (ai.findings != null) ...[
            const SizedBox(height: 12),
            Text('Findings', style: AppTextStyles.labelLarge),
            const SizedBox(height: 4),
            Text(ai.findings!,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
          ],
        ]),
      ),
      const SizedBox(height: 24),
    ]);
  }

  Widget _buildReportSection() {
    final report = _scan!.report!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text("Doctor's Report", style: AppTextStyles.h5),
      const SizedBox(height: 12),
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
            color: AppColors.successLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.success.withValues(alpha: 0.3))),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.verified_outlined, color: AppColors.success, size: 20),
            const SizedBox(width: 8),
            Text('Final Diagnosis',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.success)),
          ]),
          const SizedBox(height: 10),
          Text(report.finalDiagnosis ?? 'N/A', style: AppTextStyles.h5),
          if (report.doctorNotes != null) ...[
            const SizedBox(height: 12),
            Text("Doctor's Notes", style: AppTextStyles.labelLarge),
            const SizedBox(height: 4),
            Text(report.doctorNotes!,
                style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
          ],
        ]),
      ),
    ]);
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color color;
    String label;
    switch (status) {
      case 'pending':  color = AppColors.warning; label = '⏳ Pending Review'; break;
      case 'analyzed': color = AppColors.info;    label = '🤖 AI Analyzed';    break;
      case 'verified': color = AppColors.success; label = '✅ Report Ready';   break;
      default:         color = AppColors.textHint; label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: color.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}