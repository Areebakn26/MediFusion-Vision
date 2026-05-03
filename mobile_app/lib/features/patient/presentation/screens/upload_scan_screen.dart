import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class UploadScanScreen extends StatefulWidget {
  const UploadScanScreen({super.key});
  @override
  State<UploadScanScreen> createState() => _UploadScanScreenState();
}

class _UploadScanScreenState extends State<UploadScanScreen> {
  // Backend accepts: mri_brain, retinal (matches mock AI analysis keys)
  String _scanType = 'mri_brain';
  PlatformFile? _file;
  bool _uploading = false;
  double _progress = 0;
  String? _errorMsg;

  final List<Map<String, dynamic>> _scanTypes = [
    {
      'value': 'mri_brain',
      'label': 'Brain MRI',
      'icon': Icons.psychology_outlined,
      'desc': "Brain tumor & Alzheimer's detection",
      'color': const Color(0xFF6C63FF),
      'bgColor': const Color(0xFFF0EFFE),
    },
    {
      'value': 'retinal',
      'label': 'Retinal Scan',
      'icon': Icons.remove_red_eye_outlined,
      'desc': 'Diabetic retinopathy & glaucoma',
      'color': const Color(0xFF00BFA5),
      'bgColor': const Color(0xFFE0F7F4),
    },
  ];

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'dcm', 'dicom', 'tiff', 'tif'],
      withData: true,
    );
    if (result != null && result.files.isNotEmpty) {
      setState(() { _file = result.files.first; _errorMsg = null; });
    }
  }

  Future<void> _upload() async {
    if (_file == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please select a scan file first')));
      return;
    }
    setState(() { _uploading = true; _progress = 0; _errorMsg = null; });
    try {
      MultipartFile multipartFile;
      if (kIsWeb) {
        final bytes = _file!.bytes;
        if (bytes == null) throw Exception('Could not read file bytes');
        multipartFile = MultipartFile.fromBytes(bytes, filename: _file!.name);
      } else {
        multipartFile = await MultipartFile.fromFile(_file!.path!, filename: _file!.name);
      }

      // Backend uploadScan expects: 'scan' field + 'type' field
      final formData = FormData.fromMap({
        'scan': multipartFile,
        'type': _scanType,
      });

      final res = await ApiClient().dio.post(
        ApiConstants.uploadScan,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
        onSendProgress: (sent, total) =>
            setState(() => _progress = total > 0 ? sent / total : 0),
      );

      if (mounted) {
        final scanId = res.data['id']?.toString();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('✅ Scan uploaded successfully!'),
            backgroundColor: AppColors.success));
        if (scanId != null && scanId.isNotEmpty) {
          context.go('/patient/scan/$scanId');
        } else {
          context.go('/patient/scans');
        }
      }
    } catch (e) {
      if (mounted) {
        String msg;
        if (e is DioException) {
          msg = e.response?.data?['message'] ?? e.message ?? 'Upload failed';
          if (kDebugMode) print('❌ Upload error: ${e.response?.data}');
        } else {
          msg = e.toString();
        }
        setState(() { _uploading = false; _errorMsg = msg; });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: Text('Upload failed: $msg'),
            backgroundColor: AppColors.error));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Upload Medical Scan'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

          // ── Header ──────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(children: [
              const Icon(Icons.medical_services_outlined, color: Colors.white, size: 32),
              const SizedBox(width: 14),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('AI-Powered Analysis',
                    style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('Upload your scan for instant AI diagnosis',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.85), fontSize: 13)),
              ])),
            ]),
          ),
          const SizedBox(height: 24),

          // ── Scan Type Selection ──────────────────────────────────
          Text('Select Scan Type', style: AppTextStyles.h5),
          const SizedBox(height: 12),
          Row(children: _scanTypes.map((t) {
            final selected = _scanType == t['value'];
            return Expanded(
              child: Padding(
                padding: EdgeInsets.only(
                    right: t == _scanTypes.last ? 0 : 12),
                child: GestureDetector(
                  onTap: () => setState(() => _scanType = t['value']),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: selected ? t['bgColor'] : AppColors.white,
                      border: Border.all(
                          color: selected ? t['color'] : AppColors.border,
                          width: selected ? 2 : 1),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: selected ? [BoxShadow(
                          color: (t['color'] as Color).withValues(alpha: 0.2),
                          blurRadius: 8, offset: const Offset(0, 4))] : [],
                    ),
                    child: Column(children: [
                      Container(
                        width: 52, height: 52,
                        decoration: BoxDecoration(
                          color: selected
                              ? (t['color'] as Color).withValues(alpha: 0.15)
                              : AppColors.background,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(t['icon'] as IconData,
                            color: selected ? t['color'] : AppColors.textSecondary,
                            size: 26),
                      ),
                      const SizedBox(height: 10),
                      Text(t['label'] as String,
                          style: AppTextStyles.labelLarge.copyWith(
                              color: selected ? t['color'] : AppColors.textPrimary),
                          textAlign: TextAlign.center),
                      const SizedBox(height: 4),
                      Text(t['desc'] as String,
                          style: AppTextStyles.bodySmall.copyWith(
                              color: AppColors.textSecondary),
                          textAlign: TextAlign.center,
                          maxLines: 2),
                      const SizedBox(height: 8),
                      if (selected)
                        Icon(Icons.check_circle, color: t['color'] as Color, size: 18),
                    ]),
                  ),
                ),
              ),
            );
          }).toList()),
          const SizedBox(height: 24),

          // ── File Picker ──────────────────────────────────────────
          Text('Select File', style: AppTextStyles.h5),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: _uploading ? null : _pickFile,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: double.infinity,
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: AppColors.white,
                border: Border.all(
                    color: _file != null ? AppColors.primary : AppColors.border,
                    width: _file != null ? 2 : 1,
                    style: _file == null ? BorderStyle.solid : BorderStyle.solid),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(children: [
                Icon(
                    _file != null ? Icons.check_circle_outline : Icons.cloud_upload_outlined,
                    size: 56,
                    color: _file != null ? AppColors.primary : AppColors.textHint),
                const SizedBox(height: 12),
                Text(
                    _file != null ? _file!.name : 'Tap to select file',
                    style: AppTextStyles.bodyMedium.copyWith(
                        color: _file != null ? AppColors.primary : AppColors.textSecondary,
                        fontWeight: _file != null ? FontWeight.w600 : FontWeight.normal),
                    textAlign: TextAlign.center),
                const SizedBox(height: 4),
                if (_file != null)
                  Text(
                      '${(_file!.size / 1024 / 1024).toStringAsFixed(2)} MB',
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary))
                else ...[
                  Text('JPEG, PNG, DICOM, TIFF supported',
                      style: AppTextStyles.bodySmall),
                  const SizedBox(height: 4),
                  Text('Max 50MB', style: AppTextStyles.bodySmall),
                ],
                if (_file != null) ...[
                  const SizedBox(height: 12),
                  TextButton.icon(
                    onPressed: _uploading ? null : _pickFile,
                    icon: const Icon(Icons.swap_horiz, size: 16),
                    label: const Text('Change file'),
                  ),
                ],
              ]),
            ),
          ),

          // ── Progress ─────────────────────────────────────────────
          if (_uploading) ...[
            const SizedBox(height: 20),
            Row(children: [
              Expanded(child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                    value: _progress,
                    minHeight: 8,
                    backgroundColor: AppColors.border,
                    color: AppColors.primary),
              )),
              const SizedBox(width: 12),
              Text('${(_progress * 100).toInt()}%',
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary)),
            ]),
            const SizedBox(height: 8),
            const Text('Uploading scan...', style: TextStyle(color: AppColors.textSecondary)),
          ],

          // ── Error ─────────────────────────────────────────────────
          if (_errorMsg != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                  color: AppColors.errorLight,
                  borderRadius: BorderRadius.circular(12)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                const SizedBox(width: 10),
                Expanded(child: Text(_errorMsg!,
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.error))),
              ]),
            ),
          ],

          const SizedBox(height: 24),

          // ── Info Banner ───────────────────────────────────────────
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
                color: const Color(0xFFF0EFFE),
                borderRadius: BorderRadius.circular(12)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
                const SizedBox(width: 8),
                Text('How it works', style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary)),
              ]),
              const SizedBox(height: 10),
              _step('1', 'Upload your Brain MRI or Retinal scan'),
              _step('2', 'Scan is saved to your profile'),
              _step('3', 'Book appointment with a doctor'),
              _step('4', 'Doctor runs AI analysis & creates report'),
            ]),
          ),

          const SizedBox(height: 32),

          // ── Upload Button ─────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton(
              onPressed: (_uploading || _file == null) ? null : _upload,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                disabledBackgroundColor: AppColors.border,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _uploading
                  ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                SizedBox(width: 12),
                Text('Uploading...', style: TextStyle(color: Colors.white, fontSize: 16)),
              ])
                  : const Text('Upload & Analyze',
                  style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
            ),
          ),
          const SizedBox(height: 24),
        ]),
      ),
    );
  }

  Widget _step(String num, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(children: [
        Container(
            width: 22, height: 22,
            decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
            child: Center(child: Text(num,
                style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)))),
        const SizedBox(width: 10),
        Text(text, style: AppTextStyles.bodySmall),
      ]),
    );
  }
}