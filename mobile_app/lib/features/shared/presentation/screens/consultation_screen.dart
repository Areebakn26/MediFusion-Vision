import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:intl/intl.dart';
import 'package:jitsi_meet_flutter_sdk/jitsi_meet_flutter_sdk.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/socket_service.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';

class ConsultationScreen extends StatefulWidget {
  final String appointmentId;
  final bool autoJoinVideo;
  const ConsultationScreen({
    super.key,
    required this.appointmentId,
    this.autoJoinVideo = false,
  });
  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  List<ChatMessageModel> _messages = [];
  final List<String> _notes = [];
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  bool _loading = true;
  bool _inCall = false;
  final _jitsi = JitsiMeet();

  // Appointment context
  String _doctorName = '';
  String _doctorSpec = '';
  String _apptDate = '';
  String _apptTime = '';
  bool _isVirtual = true;
  String _apptStatus = '';

  // Prescription (patient-facing)
  Map<String, dynamic>? _prescription;

  @override
  void initState() {
    super.initState();
    _load().then((_) {
      if (widget.autoJoinVideo && mounted && _isVirtual) {
        Future.delayed(const Duration(milliseconds: 600), _joinVideoCall);
      }
    });
  }

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    SocketService().offReceiveMessage();
    SocketService().offReceiveNote();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final dio = ApiClient().dio;
      final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;

      // Fire all requests in parallel.
      // apptFuture and prescFuture use .onError so they never produce unhandled
      // rejections on web if the endpoint is temporarily unavailable.
      final chatFuture = dio.get('${ApiConstants.consultation}/${widget.appointmentId}/chat');
      final apptFuture = dio
          .get('${ApiConstants.appointments}/${widget.appointmentId}')
          .then<dynamic>((r) => r)
          .onError((_, __) => null);
      final prescFuture = dio
          .get('${ApiConstants.consultation}/${widget.appointmentId}/prescription')
          .then<dynamic>((r) => r)
          .onError((_, __) => null);

      final chatRes = await chatFuture;
      final rawChat = chatRes.data['messages'] ?? chatRes.data ?? [];

      // Appointment details — apptFuture returns null on error (no throw)
      final apptRes = await apptFuture;
      if (apptRes != null && (apptRes as dynamic).data != null) {
        final appt = apptRes.data is Map
            ? Map<String, dynamic>.from(apptRes.data as Map)
            : <String, dynamic>{};
        final rawDoc = appt['doctor'] ?? appt['Doctor'];
        final doc = rawDoc != null
            ? Map<String, dynamic>.from(rawDoc as Map)
            : <String, dynamic>{};
        _doctorName = doc['name']?.toString() ?? '';
        _doctorSpec = doc['specialization']?.toString() ?? '';
        _apptDate   = appt['date']?.toString() ?? '';
        _apptTime   = (appt['time_slot'] ?? appt['timeSlot'])?.toString() ?? '';
        _isVirtual  = (appt['type']?.toString() ?? 'virtual') == 'virtual';
        _apptStatus = appt['status']?.toString() ?? '';
      }

      // Prescription — best-effort (prescFuture returns null on error)
      final prescRes = await prescFuture;
      if (prescRes != null && (prescRes as dynamic).data is Map) {
        _prescription = Map<String, dynamic>.from(prescRes.data as Map);
      }

      if (mounted) {
        setState(() {
          _messages = (rawChat as List).map<ChatMessageModel>((j) =>
              ChatMessageModel.fromJson(
                Map<String, dynamic>.from(j as Map),
                user.id.toString(),
              )
          ).toList();
          _loading = false;
        });
        SocketService().joinRoom('appointment_${widget.appointmentId}');
        _setupSocket(user);
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showPrescription() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PrescriptionSheet(prescription: _prescription),
    );
  }

  void _setupSocket(UserModel user) {
    SocketService().onReceiveMessage((dynamic data) {
      if (!mounted) return;
      final map = Map<String, dynamic>.from(data as Map);
      setState(() {
        _messages.add(ChatMessageModel.fromJson(map, user.id.toString()));
      });
      _scrollToBottom();
    });
    SocketService().onReceiveNote((dynamic data) {
      if (!mounted) return;
      final map = Map<String, dynamic>.from(data as Map);
      setState(() => _notes.add(map['note']?.toString() ?? ''));
    });
  }

  void _sendMessage() {
    if (_msgCtrl.text.trim().isEmpty) return;
    final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;
    SocketService().sendMessage(
      room: 'appointment_${widget.appointmentId}',
      appointmentId: widget.appointmentId.toString(),
      author: user.id.toString(),
      message: _msgCtrl.text.trim(),
    );
    setState(() {
      _messages.add(ChatMessageModel(
        message: _msgCtrl.text.trim(),
        senderId: user.id.toString(),
        senderName: user.name,
        isMe: true,
      ));
    });
    _msgCtrl.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _joinVideoCall() async {
    final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;
    // Notify doctor via socket when patient joins
    if (!user.isDoctor) {
      SocketService().notifyPatientJoined(
        room: 'appointment_${widget.appointmentId}',
        appointmentId: widget.appointmentId,
        patientName: user.name,
      );
    }
    setState(() => _inCall = true);
    final options = JitsiMeetConferenceOptions(
      serverURL: 'https://meet.jit.si',
      room: 'medifusion_appt_${widget.appointmentId}',
      configOverrides: {
        'startWithAudioMuted': false,
        'startWithVideoMuted': false,
        'subject': 'Medical Consultation',
      },
      featureFlags: {'welcomepage.enabled': false, 'pip.enabled': true},
      userInfo: JitsiMeetUserInfo(
        displayName: user.isDoctor ? 'Dr. ${user.name}' : user.name,
        email: user.email,
      ),
    );
    await _jitsi.join(options);
    if (mounted) setState(() => _inCall = false);
  }

  String get _formattedDate {
    if (_apptDate.isEmpty) return '';
    final dt = DateTime.tryParse(_apptDate);
    if (dt == null) return _apptDate;
    return DateFormat('EEE, MMM d yyyy').format(dt);
  }

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;
    final appBarTitle = _doctorName.isNotEmpty
        ? 'Dr. $_doctorName'
        : 'Virtual Consultation';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(appBarTitle,
                style: const TextStyle(fontFamily: 'Poppins', fontSize: 16, fontWeight: FontWeight.w700)),
            if (_doctorSpec.isNotEmpty)
              Text(_doctorSpec,
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                      fontWeight: FontWeight.w400, color: Colors.white70)),
          ],
        ),
        actions: [
          if (!user.isDoctor)
            IconButton(
              onPressed: _showPrescription,
              icon: const Icon(Icons.receipt_long_rounded),
              tooltip: 'Prescription',
              color: Colors.white,
            ),
          if (_isVirtual && _apptStatus != 'completed')
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: ElevatedButton.icon(
                onPressed: _joinVideoCall,
                icon: Icon(
                  _inCall ? Icons.call_end_rounded : Icons.videocam_rounded,
                  size: 16,
                ),
                label: Text(_inCall ? 'End Call' : 'Join Video'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _inCall ? AppColors.error : const Color(0xFF00C853),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  textStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 12, fontWeight: FontWeight.w600),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
              ),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(children: [
        // Appointment info header (patient view)
        if (!user.isDoctor && (_formattedDate.isNotEmpty || _apptTime.isNotEmpty))
          _AppointmentInfoBanner(
            date: _formattedDate,
            time: _apptTime,
            isVirtual: _isVirtual,
          ),
        // AI notes banner (doctor only)
        if (user.isDoctor && _notes.isNotEmpty)
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.primaryLight,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.sticky_note_2_outlined, color: AppColors.primary, size: 16),
                const SizedBox(width: 6),
                Text('AI Note', style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary)),
              ]),
              const SizedBox(height: 4),
              Text(_notes.last, style: AppTextStyles.bodySmall),
            ]),
          ),
        // Chat messages
        Expanded(
          child: _messages.isEmpty
              ? _EmptyChat(isPatient: !user.isDoctor, isVirtual: _isVirtual)
              : ListView.separated(
            controller: _scrollCtrl,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (_, i) => _ChatBubble(msg: _messages[i]),
          ),
        ),
        // Message input
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(
            color: AppColors.white,
            border: Border(top: BorderSide(color: AppColors.border)),
          ),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _msgCtrl,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.border),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: const BorderSide(color: AppColors.primary),
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  isDense: true,
                ),
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _sendMessage,
              child: Container(
                width: 44, height: 44,
                decoration: const BoxDecoration(
                  color: AppColors.primary,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ]),
        ),
      ]),
    );
  }
}

// ── Appointment info banner (shown to patient) ─────────────────────────────

class _AppointmentInfoBanner extends StatelessWidget {
  final String date;
  final String time;
  final bool isVirtual;
  const _AppointmentInfoBanner({required this.date, required this.time, required this.isVirtual});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.06),
        border: const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.12),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            isVirtual ? Icons.videocam_rounded : Icons.local_hospital_rounded,
            color: AppColors.primary, size: 16,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            isVirtual ? 'Virtual Consultation' : 'In-Person Appointment',
            style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
          if (date.isNotEmpty || time.isNotEmpty)
            Text(
              [if (date.isNotEmpty) date, if (time.isNotEmpty) time].join('  ·  '),
              style: const TextStyle(fontFamily: 'Poppins', fontSize: 11,
                  color: AppColors.textSecondary),
            ),
        ])),
      ]),
    );
  }
}

// ── Empty chat state ───────────────────────────────────────────────────────

class _EmptyChat extends StatelessWidget {
  final bool isPatient;
  final bool isVirtual;
  const _EmptyChat({required this.isPatient, required this.isVirtual});

  @override
  Widget build(BuildContext context) {
    return Center(child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Icon(
            isVirtual ? Icons.videocam_outlined : Icons.chat_bubble_outline,
            size: 48, color: AppColors.primary.withOpacity(0.5),
          ),
        ),
        const SizedBox(height: 20),
        Text(
          isPatient ? 'Consultation Started' : 'Ready to Consult',
          style: const TextStyle(fontFamily: 'Poppins', fontSize: 17,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
        const SizedBox(height: 8),
        Text(
          isPatient
              ? isVirtual
                  ? 'You can chat with your doctor or tap "Join Video" to start the video call.'
                  : 'Send a message to your doctor to get started.'
              : 'No messages yet. The patient can chat or join the video call.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
              color: AppColors.textSecondary, height: 1.5),
        ),
      ]),
    ));
  }
}

// ── Prescription Sheet (patient view) ─────────────────────────────────────

class _PrescriptionSheet extends StatelessWidget {
  final Map<String, dynamic>? prescription;
  const _PrescriptionSheet({this.prescription});

  bool get _hasPrescription =>
      prescription != null && prescription!['_id'] != null;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.82,
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 12),
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
              child: _hasPrescription ? _buildContent() : _buildEmpty(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.08),
          shape: BoxShape.circle,
        ),
        child: const Icon(Icons.receipt_long_outlined, size: 40, color: AppColors.primary),
      ),
      const SizedBox(height: 16),
      const Text('No Prescription Yet',
          style: TextStyle(fontFamily: 'Poppins', fontSize: 17,
              fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
      const SizedBox(height: 8),
      const Text(
        'Your doctor hasn\'t added a prescription yet.\nCheck back after your consultation.',
        textAlign: TextAlign.center,
        style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
            color: AppColors.textSecondary, height: 1.5),
      ),
      const SizedBox(height: 16),
    ]);
  }

  Widget _buildContent() {
    final medications = (prescription!['medications'] as List?) ?? [];
    final diagnosis   = prescription!['diagnosis']?.toString();
    final instructions = prescription!['instructions']?.toString();
    final followUp    = prescription!['follow_up_date']?.toString();

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Header
      Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(Icons.receipt_long_rounded, color: AppColors.primary, size: 20),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Text('Prescription',
              style: TextStyle(fontFamily: 'Poppins', fontSize: 18,
                  fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ),
      ]),

      if (diagnosis != null && diagnosis.isNotEmpty) ...[
        const SizedBox(height: 18),
        _label('Diagnosis'),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.infoLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.info.withOpacity(0.2)),
          ),
          child: Text(diagnosis,
              style: const TextStyle(fontFamily: 'Poppins', fontSize: 14,
                  color: AppColors.textPrimary, height: 1.5)),
        ),
      ],

      if (medications.isNotEmpty) ...[
        const SizedBox(height: 18),
        _label('Medications (${medications.length})'),
        const SizedBox(height: 8),
        ...medications.asMap().entries.map((entry) {
          final i = entry.key;
          final med = entry.value is Map
              ? Map<String, dynamic>.from(entry.value as Map)
              : <String, dynamic>{};
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 26, height: 26,
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text('${i + 1}',
                        style: const TextStyle(fontFamily: 'Poppins',
                            color: Colors.white, fontSize: 12,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(
                      med['name']?.toString() ?? 'Medication',
                      style: const TextStyle(fontFamily: 'Poppins', fontSize: 14,
                          fontWeight: FontWeight.w600, color: AppColors.textPrimary),
                    ),
                    if (med['dosage'] != null)
                      _medRow('Dosage', med['dosage'].toString()),
                    if (med['frequency'] != null)
                      _medRow('Frequency', med['frequency'].toString()),
                    if (med['duration'] != null)
                      _medRow('Duration', med['duration'].toString()),
                  ]),
                ),
              ]),
            ),
          );
        }),
      ],

      if (instructions != null && instructions.isNotEmpty) ...[
        const SizedBox(height: 8),
        _label('Instructions'),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.warningLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.warning.withOpacity(0.2)),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(instructions,
                  style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                      color: AppColors.textPrimary, height: 1.5)),
            ),
          ]),
        ),
      ],

      if (followUp != null && followUp.isNotEmpty) ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.successLight,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.success.withOpacity(0.2)),
          ),
          child: Row(children: [
            const Icon(Icons.event_rounded, color: AppColors.success, size: 16),
            const SizedBox(width: 8),
            Text(
              'Follow-up: ${_formatDate(followUp)}',
              style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                  fontWeight: FontWeight.w600, color: AppColors.success),
            ),
          ]),
        ),
      ],
    ]);
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
          fontWeight: FontWeight.w700, color: AppColors.primary));

  Widget _medRow(String key, String value) => Padding(
    padding: const EdgeInsets.only(top: 2),
    child: Row(children: [
      Text('$key: ', style: const TextStyle(fontFamily: 'Poppins',
          fontSize: 12, fontWeight: FontWeight.w500, color: AppColors.textSecondary)),
      Text(value, style: const TextStyle(fontFamily: 'Poppins',
          fontSize: 12, color: AppColors.textPrimary)),
    ]),
  );

  String _formatDate(String raw) {
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    return DateFormat('EEE, MMM d yyyy').format(dt);
  }
}

// ── Chat Bubble ───────────────────────────────────────────────────────────

class _ChatBubble extends StatelessWidget {
  final ChatMessageModel msg;
  const _ChatBubble({required this.msg});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: msg.isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Column(
        crossAxisAlignment: msg.isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          if (!msg.isMe && msg.senderName.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(left: 4, bottom: 4),
              child: Text(
                msg.senderName,
                style: const TextStyle(
                  fontFamily: 'Poppins', fontSize: 11,
                  fontWeight: FontWeight.w600, color: AppColors.primary,
                ),
              ),
            ),
          ConstrainedBox(
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: msg.isMe ? AppColors.primary : AppColors.white,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(msg.isMe ? 16 : 4),
                  bottomRight: Radius.circular(msg.isMe ? 4 : 16),
                ),
                border: msg.isMe ? null : Border.all(color: AppColors.border),
              ),
              child: Text(
                msg.message,
                style: AppTextStyles.bodyMedium.copyWith(
                  color: msg.isMe ? Colors.white : AppColors.textPrimary,
                ),
              ),
            ),
          ),
          if (msg.createdAt != null) ...[
            const SizedBox(height: 2),
            Padding(
              padding: EdgeInsets.only(
                left: msg.isMe ? 0 : 4,
                right: msg.isMe ? 4 : 0,
              ),
              child: Text(
                _formatTime(msg.createdAt!),
                style: const TextStyle(
                  fontFamily: 'Poppins', fontSize: 10, color: AppColors.textHint,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatTime(String raw) {
    final dt = DateTime.tryParse(raw);
    if (dt == null) return '';
    return DateFormat('h:mm a').format(dt.toLocal());
  }
}