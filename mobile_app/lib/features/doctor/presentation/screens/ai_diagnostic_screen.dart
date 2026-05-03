import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class AIDiagnosticScreen extends StatefulWidget {
  final String scanId;
  const AIDiagnosticScreen({super.key, required this.scanId});
  @override
  State<AIDiagnosticScreen> createState() => _AIDiagnosticScreenState();
}

class _AIDiagnosticScreenState extends State<AIDiagnosticScreen> {
  ScanModel? _scan;
  bool _loading = true;
  bool _analyzing = false;
  double _heatmapOpacity = 0.6;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await ApiClient().dio.get('${ApiConstants.scans}/${widget.scanId}');
      if (mounted) setState(() { _scan = ScanModel.fromJson(res.data['scan'] ?? res.data); _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  Future<void> _runAnalysis() async {
    setState(() => _analyzing = true);
    try {
      final res = await ApiClient().dio.post('${ApiConstants.scans}/${widget.scanId}/analyze');
      if (mounted) setState(() {
        _scan = ScanModel.fromJson(res.data['scan'] ?? res.data);
        _analyzing = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() => _analyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Analysis failed. Please try again.'), backgroundColor: AppColors.error));
      }
    }
  }

  Future<void> _flagFeedback() async {
    final ctrl = TextEditingController();
    final result = await showDialog<String>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Flag AI Error'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          const Text('What was the correct diagnosis?'),
          const SizedBox(height: 12),
          TextField(controller: ctrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Enter correct diagnosis...')),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, ctrl.text), child: const Text('Submit Feedback')),
        ],
      ),
    );
    if (result != null && result.isNotEmpty) {
      try {
        await ApiClient().dio.post('/scans/${widget.scanId}/feedback', data: {
          'aiPrediction': _scan?.aiAnalysis?.prediction,
          'correctedDiagnosis': result,
        });
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Feedback submitted. Thank you!'), backgroundColor: AppColors.success));
      } catch (_) {}
    }
    ctrl.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Diagnostic'),
        actions: [
          if (_scan?.aiAnalysis != null)
            IconButton(icon: const Icon(Icons.flag_outlined), onPressed: _flagFeedback, tooltip: 'Flag AI Error'),
          if (_scan?.aiAnalysis != null)
            IconButton(icon: const Icon(Icons.edit_document), onPressed: () => context.push('/doctor/scan/${widget.scanId}/report'), tooltip: 'Write Report'),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _scan == null
          ? const Center(child: Text('Scan not found'))
          : SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Patient info
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              const Icon(Icons.person_outline, color: AppColors.primary),
              const SizedBox(width: 10),
              Text(_scan!.scanType.toUpperCase(), style: AppTextStyles.labelLarge),
              const Spacer(),
              Text(_scan!.uploadDate.substring(0, 10), style: AppTextStyles.bodySmall),
            ]),
          ),
          const SizedBox(height: 20),

          // Scan viewer with heatmap overlay
          Text('Medical Scan', style: AppTextStyles.h5),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: SizedBox(
              height: 280, width: double.infinity,
              child: Stack(fit: StackFit.expand, children: [
                CachedNetworkImage(
                  imageUrl: '${ApiConstants.uploadsUrl}/${_scan!.filePath}',
                  fit: BoxFit.cover,
                  placeholder: (_, __) => Container(color: AppColors.background, child: const Center(child: CircularProgressIndicator())),
                  errorWidget: (_, __, ___) => Container(color: AppColors.background,
                      child: const Center(child: Icon(Icons.image_not_supported, size: 48, color: AppColors.textHint))),
                ),
                if (_scan!.aiAnalysis?.gradcamUrl != null)
                  Opacity(
                    opacity: _heatmapOpacity,
                    child: CachedNetworkImage(
                      imageUrl: '${ApiConstants.uploadsUrl}/${_scan!.aiAnalysis!.gradcamUrl}',
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => const SizedBox(),
                    ),
                  ),
                if (_analyzing)
                  Container(color: Colors.black54, child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    const CircularProgressIndicator(color: Colors.white),
                    const SizedBox(height: 16),
                    const Text('Running AI Analysis...', style: TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 14)),
                  ]))),
              ]),
            ),
          ),
          if (_scan!.aiAnalysis?.gradcamUrl != null) ...[
            const SizedBox(height: 8),
            Row(children: [
              Text('Heatmap: ', style: AppTextStyles.bodySmall),
              Expanded(child: Slider(
                value: _heatmapOpacity, min: 0, max: 1,
                onChanged: (v) => setState(() => _heatmapOpacity = v),
                activeColor: AppColors.primary,
              )),
              Text('${(_heatmapOpacity * 100).toInt()}%', style: AppTextStyles.bodySmall),
            ]),
          ],
          const SizedBox(height: 20),

          // Run AI button or AI results
          if (_scan!.aiAnalysis == null)
            ElevatedButton.icon(
              onPressed: _analyzing ? null : _runAnalysis,
              icon: _analyzing ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Icon(Icons.psychology_outlined),
              label: Text(_analyzing ? 'Analyzing...' : 'Run AI Analysis'),
            )
          else ...[
            // AI Results
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [AppColors.primary.withOpacity(0.05), AppColors.secondary.withOpacity(0.05)]),
                border: Border.all(color: AppColors.primary.withOpacity(0.2)),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.psychology_outlined, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text('AI Results', style: AppTextStyles.h5.copyWith(color: AppColors.primary)),
                ]),
                const SizedBox(height: 16),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Prediction', style: AppTextStyles.bodySmall),
                    Text(_scan!.aiAnalysis!.prediction ?? 'N/A', style: AppTextStyles.h4),
                  ]),
                  Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                    Text('Confidence', style: AppTextStyles.bodySmall),
                    Text('${((_scan!.aiAnalysis!.confidence ?? 0) * 100).toStringAsFixed(1)}%', style: AppTextStyles.h4.copyWith(color: AppColors.primary)),
                  ]),
                ]),
                const SizedBox(height: 12),
                LinearProgressIndicator(
                  value: _scan!.aiAnalysis!.confidence ?? 0,
                  backgroundColor: AppColors.border,
                  color: AppColors.primary,
                  minHeight: 8,
                  borderRadius: BorderRadius.circular(4),
                ),
                if (_scan!.aiAnalysis!.findings != null) ...[
                  const SizedBox(height: 14),
                  Text('Key Findings', style: AppTextStyles.labelLarge),
                  const SizedBox(height: 4),
                  Text(_scan!.aiAnalysis!.findings!, style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
                ],
              ]),
            ),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                onPressed: _flagFeedback,
                icon: const Icon(Icons.flag_outlined, size: 18),
                label: const Text('Flag Error'),
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.warning, side: const BorderSide(color: AppColors.warning)),
              )),
              const SizedBox(width: 12),
              Expanded(child: ElevatedButton.icon(
                onPressed: () => context.push('/doctor/scan/${widget.scanId}/report'),
                icon: const Icon(Icons.edit_document, size: 18),
                label: const Text('Write Report'),
              )),
            ]),
          ],
        ]),
      ),
    );
  }
}