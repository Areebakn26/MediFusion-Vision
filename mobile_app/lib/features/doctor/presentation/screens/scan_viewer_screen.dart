import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/constants/api_constants.dart';

/// Doctor-side scan viewer — shows the scan image and its metadata.
/// AI analysis is NOT triggered here (it runs on the web platform).
class ScanViewerScreen extends StatelessWidget {
  final Map<String, dynamic> scan;

  const ScanViewerScreen({super.key, required this.scan});

  String get _imageUrl {
    final raw = (scan['file_url'] ?? scan['filePath'] ?? scan['file_path'] ?? '').toString();
    if (raw.isEmpty) return '';
    if (raw.startsWith('http')) return raw;
    // Relative path e.g. "/uploads/filename.jpg"
    return '${ApiConstants.baseUrl.replaceFirst('/api', '')}$raw';
  }

  String get _scanType  => (scan['scan_type'] ?? scan['scanType'] ?? 'Unknown').toString();
  String get _status    => (scan['status'] ?? 'pending').toString();
  String get _date {
    final raw = (scan['createdAt'] ?? scan['upload_date'] ?? '').toString();
    return raw.length >= 10 ? raw.substring(0, 10) : raw;
  }
  String? get _aiResult => (scan['ai_prediction'] ?? scan['aiAnalysis'] ?? scan['aiPrediction'])?.toString();
  String? get _bodyPart => (scan['body_part'] ?? scan['bodyPart'])?.toString();
  String? get _notes    => scan['notes']?.toString();
  String? get _facility => (scan['facility_name'] ?? scan['facilityName'])?.toString();

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
    final url = _imageUrl;
    final statusColor = _statusColor(_status);

    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        title: Text(_scanType.toUpperCase(),
            style: const TextStyle(fontFamily: 'Poppins', color: Colors.white)),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: statusColor.withOpacity(0.4)),
            ),
            child: Text(
              _status[0].toUpperCase() + _status.substring(1),
              style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                  fontWeight: FontWeight.w600, color: statusColor),
            ),
          ),
        ],
      ),
      body: Column(children: [
        // Scan image — fills most of the screen
        Expanded(
          child: url.isEmpty
              ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.image_not_supported_outlined, size: 56, color: Colors.white30),
                  SizedBox(height: 12),
                  Text('Scan image not available',
                      style: TextStyle(fontFamily: 'Poppins', color: Colors.white54)),
                ]))
              : InteractiveViewer(
                  minScale: 0.5,
                  maxScale: 4.0,
                  child: Center(
                    child: Image.network(
                      url,
                      fit: BoxFit.contain,
                      loadingBuilder: (_, child, progress) => progress == null
                          ? child
                          : Center(child: CircularProgressIndicator(
                              value: progress.expectedTotalBytes != null
                                  ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                  : null,
                              color: AppColors.primary,
                            )),
                      errorBuilder: (_, __, ___) => const Center(child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.broken_image_outlined, size: 56, color: Colors.white30),
                          SizedBox(height: 8),
                          Text('Could not load image',
                              style: TextStyle(fontFamily: 'Poppins', color: Colors.white54)),
                        ],
                      )),
                    ),
                  ),
                ),
        ),

        // Info panel at the bottom
        Container(
          decoration: const BoxDecoration(
            color: Color(0xFF1A1A2E),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [

            // Handle bar
            Center(child: Container(width: 36, height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 16),

            // Scan type + date row
            Row(children: [
              Expanded(child: Text(_scanType.toUpperCase(),
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 16,
                      fontWeight: FontWeight.w700, color: Colors.white))),
              Text(_date, style: const TextStyle(fontFamily: 'Poppins', fontSize: 13, color: Colors.white54)),
            ]),
            const SizedBox(height: 12),

            // Info rows
            if (_bodyPart != null && _bodyPart!.isNotEmpty)
              _InfoRow(Icons.location_on_outlined, 'Body Part', _bodyPart!),
            if (_facility != null && _facility!.isNotEmpty)
              _InfoRow(Icons.local_hospital_outlined, 'Facility', _facility!),
            if (_notes != null && _notes!.isNotEmpty)
              _InfoRow(Icons.notes_outlined, 'Notes', _notes!),

            // AI result — read-only, already computed on web
            if (_aiResult != null && _aiResult!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.primary.withOpacity(0.3)),
                ),
                child: Row(children: [
                  const Icon(Icons.auto_awesome, color: AppColors.primary, size: 18),
                  const SizedBox(width: 10),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Text('AI Analysis Result',
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                            color: AppColors.primary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(_aiResult!,
                        style: const TextStyle(fontFamily: 'Poppins', fontSize: 14,
                            color: Colors.white, fontWeight: FontWeight.w500)),
                  ])),
                ]),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Icon(icon, size: 15, color: Colors.white38),
      const SizedBox(width: 8),
      Text('$label: ', style: const TextStyle(fontFamily: 'Poppins', fontSize: 13, color: Colors.white38)),
      Expanded(child: Text(value,
          style: const TextStyle(fontFamily: 'Poppins', fontSize: 13, color: Colors.white70),
          overflow: TextOverflow.ellipsis)),
    ]),
  );
}
