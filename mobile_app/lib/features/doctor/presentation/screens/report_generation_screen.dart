import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class ReportGenerationScreen extends StatefulWidget {
  final String scanId;
  const ReportGenerationScreen({super.key, required this.scanId});
  @override
  State<ReportGenerationScreen> createState() => _ReportGenerationScreenState();
}

class _ReportGenerationScreenState extends State<ReportGenerationScreen> {
  ScanModel? _scan;
  final _diagnosisCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  bool _loading = true;
  bool _saving = false;

  @override
  void initState() { super.initState(); _load(); }

  @override
  void dispose() { _diagnosisCtrl.dispose(); _notesCtrl.dispose(); super.dispose(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient().dio.get('${ApiConstants.scans}/${widget.scanId}');
      if (mounted) {
        final scan = ScanModel.fromJson(res.data['scan'] ?? res.data);
        _diagnosisCtrl.text = scan.aiAnalysis?.prediction ?? '';
        _notesCtrl.text = scan.report?.doctorNotes ?? '';
        setState(() { _scan = scan; _loading = false; });
      }
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _save({bool finalize = false}) async {
    if (_diagnosisCtrl.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter a final diagnosis')));
      return;
    }
    setState(() => _saving = true);
    try {
      await ApiClient().dio.post('${ApiConstants.scans}/${widget.scanId}/report', data: {
        'finalDiagnosis': _diagnosisCtrl.text.trim(),
        'doctorNotes': _notesCtrl.text.trim(),
        'status': finalize ? 'finalized' : 'draft',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(finalize ? 'Report published!' : 'Draft saved'), backgroundColor: AppColors.success));
        if (finalize) context.pop();
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save report'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Write Report'),
        actions: [
          TextButton(onPressed: _saving ? null : () => _save(), child: const Text('Save Draft')),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // AI suggestion banner
          if (_scan?.aiAnalysis != null)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(14)),
              child: Row(children: [
                const Icon(Icons.psychology_outlined, color: AppColors.primary, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('AI Suggested: ${_scan!.aiAnalysis!.prediction ?? 'N/A'}', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
                  Text('Confidence: ${((_scan!.aiAnalysis!.confidence ?? 0) * 100).toStringAsFixed(1)}%', style: AppTextStyles.bodySmall),
                ])),
                TextButton(
                  onPressed: () => _diagnosisCtrl.text = _scan!.aiAnalysis!.prediction ?? '',
                  child: const Text('Use'),
                ),
              ]),
            ),
          const SizedBox(height: 20),

          Text('Final Diagnosis *', style: AppTextStyles.h5),
          const SizedBox(height: 8),
          TextFormField(
            controller: _diagnosisCtrl,
            maxLines: 3,
            decoration: const InputDecoration(hintText: 'Enter the final diagnosis...'),
          ),
          const SizedBox(height: 20),

          Text("Doctor's Notes", style: AppTextStyles.h5),
          const SizedBox(height: 8),
          TextFormField(
            controller: _notesCtrl,
            maxLines: 6,
            decoration: const InputDecoration(hintText: 'Enter treatment notes, recommendations, follow-up instructions...'),
          ),
          const SizedBox(height: 32),

          ElevatedButton.icon(
            onPressed: _saving ? null : () => _save(finalize: true),
            icon: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.publish),
            label: const Text('Publish Final Report'),
          ),
          const SizedBox(height: 8),
          Center(child: Text('Patient will be notified once the report is published.', style: AppTextStyles.caption, textAlign: TextAlign.center)),
        ]),
      ),
    );
  }
}