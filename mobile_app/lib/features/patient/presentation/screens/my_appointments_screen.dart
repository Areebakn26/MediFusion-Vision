import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

// ── Local model ───────────────────────────────────────────────────────────

class _Appt {
  final String id;
  final String date;
  final String timeSlot;
  final String? startTime;
  final String type;
  final String status;
  final String? reason;
  final String doctorName;
  final String? doctorSpec;
  final String doctorProfileId;
  final String doctorUserId;

  const _Appt({
    required this.id, required this.date, required this.timeSlot,
    this.startTime,
    required this.type, required this.status, this.reason,
    required this.doctorName, this.doctorSpec,
    required this.doctorProfileId, required this.doctorUserId,
  });

  factory _Appt.fromJson(Map<String, dynamic> j) {
    final rawDoc = j['doctor'] ?? j['Doctor'];
    final doc = rawDoc != null ? Map<String, dynamic>.from(rawDoc as Map) : <String, dynamic>{};
    return _Appt(
      id:              j['id']?.toString() ?? '',
      date:            j['date']?.toString() ?? '',
      timeSlot:        (j['time_slot'] ?? j['timeSlot'])?.toString() ?? '',
      startTime:       (j['start_time'] ?? j['startTime'])?.toString(),
      type:            j['type']?.toString() ?? 'physical',
      status:          j['status']?.toString() ?? 'pending',
      reason:          j['reason']?.toString(),
      doctorName:      doc['name']?.toString().trim().isNotEmpty == true ? doc['name']!.toString() : 'Doctor',
      doctorSpec:      doc['specialization']?.toString(),
      doctorProfileId: doc['id']?.toString() ?? '',
      doctorUserId:    doc['user_id']?.toString() ?? '',
    );
  }

  bool get isUpcoming  => status == 'pending'   || status == 'confirmed';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isVirtual   => type   == 'virtual';

  // Resolve full appointment DateTime from start_time or date + time_slot
  DateTime? get appointmentDateTime {
    if (startTime != null && startTime!.isNotEmpty) {
      return DateTime.tryParse(startTime!)?.toLocal();
    }
    if (date.isEmpty || timeSlot.isEmpty) return null;
    final datePart = DateTime.tryParse(date);
    if (datePart == null) return null;
    return _parseTimeSlot(timeSlot, datePart);
  }

  // Returns true if current time is within the join window
  // Window: appointment time (with 2 min early tolerance) → appointment time + 30 min
  bool get isJoinWindowOpen {
    final apptTime = appointmentDateTime;
    if (apptTime == null) return false;
    final now = DateTime.now();
    return now.isAfter(apptTime.subtract(const Duration(minutes: 2))) &&
        now.isBefore(apptTime.add(const Duration(minutes: 30)));
  }

  // Minutes until appointment (null if already past or no time data)
  int? get minutesUntilJoin {
    final apptTime = appointmentDateTime;
    if (apptTime == null) return null;
    final diff = apptTime.difference(DateTime.now()).inMinutes;
    return diff > 0 ? diff : null;
  }

  static DateTime? _parseTimeSlot(String ts, DateTime date) {
    final amPm = RegExp(r'^(\d{1,2}):(\d{2})\s*(AM|PM)$', caseSensitive: false)
        .firstMatch(ts.trim());
    if (amPm != null) {
      int h = int.parse(amPm.group(1)!);
      final m = int.parse(amPm.group(2)!);
      final isPM = amPm.group(3)!.toUpperCase() == 'PM';
      if (isPM && h != 12) h += 12;
      if (!isPM && h == 12) h = 0;
      return DateTime(date.year, date.month, date.day, h, m);
    }
    final plain = RegExp(r'^(\d{1,2}):(\d{2})$').firstMatch(ts.trim());
    if (plain != null) {
      return DateTime(date.year, date.month, date.day,
          int.parse(plain.group(1)!), int.parse(plain.group(2)!));
    }
    return null;
  }

  String get formattedDate {
    final dt = DateTime.tryParse(date);
    if (dt == null) return date;
    return DateFormat('EEE, MMM d yyyy').format(dt);
  }
}

// ── Screen ────────────────────────────────────────────────────────────────

class MyAppointmentsScreen extends StatefulWidget {
  const MyAppointmentsScreen({super.key});
  @override
  State<MyAppointmentsScreen> createState() => _MyAppointmentsScreenState();
}

class _MyAppointmentsScreenState extends State<MyAppointmentsScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<_Appt> _all = [];
  bool _loading = true;
  Timer? _windowTimer;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
    // Refresh every 30s so "Join Now" button appears/disappears at the right time
    _windowTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) setState(() {});
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    _windowTimer?.cancel();
    super.dispose();
  }

  // Fire-and-forget: notify doctor that patient has joined
  void _notifyPatientJoined(String appointmentId) {
    ApiClient().dio
        .post('${ApiConstants.consultation}/$appointmentId/patient-joined')
        .ignore();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().dio.get(ApiConstants.appointments);
      final raw = res.data is List ? res.data as List : (res.data['appointments'] ?? []);
      final list = (raw as List)
          .map((e) => _Appt.fromJson(e as Map<String, dynamic>))
          .toList()
        ..sort((a, b) => b.date.compareTo(a.date));
      if (mounted) setState(() { _all = list; _loading = false; });
    } catch (e) {
      debugPrint('❌ appointments load: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  List<_Appt> get _upcoming  => _all.where((a) => a.isUpcoming).toList();
  List<_Appt> get _completed => _all.where((a) => a.isCompleted).toList();
  List<_Appt> get _cancelled => _all.where((a) => a.isCancelled).toList();

  Future<void> _showCancelSheet(_Appt a) async {
    final reason = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CancelSheet(appt: a),
    );
    if (reason == null) return;
    try {
      await ApiClient().dio.delete(
        '${ApiConstants.appointments}/${a.id}',
        data: {'reason': reason},
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Appointment cancelled'),
          backgroundColor: AppColors.success,
        ));
        _load();
      }
    } catch (e) {
      if (mounted) {
        final msg = _extractError(e, 'Failed to cancel appointment');
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg), backgroundColor: AppColors.error));
      }
    }
  }

  Future<void> _showRescheduleSheet(_Appt a) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RescheduleSheet(appt: a, onDone: _load),
    );
  }

  String _extractError(Object e, String fallback) {
    try {
      final resp = (e as dynamic).response;
      return resp?.data?['message']?.toString() ?? fallback;
    } catch (_) { return fallback; }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      body: NestedScrollView(
        headerSliverBuilder: (_, __) => [
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20, right: 20, bottom: 24,
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Expanded(
                    child: Text('My Appointments',
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 24,
                            fontWeight: FontWeight.w700, color: Colors.white)),
                  ),
                  IconButton(
                    onPressed: _load,
                    icon: const Icon(Icons.refresh_rounded, color: Colors.white),
                  ),
                ]),
                const SizedBox(height: 16),
                // Stats row
                Row(children: [
                  _StatPill(label: 'Upcoming', count: _upcoming.length,
                      color: Colors.white, textColor: AppColors.primary),
                  const SizedBox(width: 10),
                  _StatPill(label: 'Done', count: _completed.length,
                      color: Colors.white.withOpacity(0.2), textColor: Colors.white),
                  const SizedBox(width: 10),
                  _StatPill(label: 'Cancelled', count: _cancelled.length,
                      color: Colors.white.withOpacity(0.2), textColor: Colors.white),
                ]),
                const SizedBox(height: 20),
                // Tab bar
             Container(
                  height: 44,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: TabBar(
                    controller: _tabs,
                    indicator: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(11),
                    ),
                    indicatorSize: TabBarIndicatorSize.tab,
                    labelColor: AppColors.primary,
                    unselectedLabelColor: Colors.white,
                    labelStyle: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                        fontWeight: FontWeight.w700),
                    unselectedLabelStyle: const TextStyle(fontFamily: 'Poppins',
                        fontSize: 13, fontWeight: FontWeight.w500),
                    dividerColor: Colors.transparent,
                    tabs: [
                      Tab(text: 'Upcoming (${_upcoming.length})'),
                      Tab(text: 'Done (${_completed.length})'),
                      Tab(text: 'Cancelled'),
                    ],
                  ),
                ),
              ]),
            ),
          ),
        ],
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _load,
                child: TabBarView(
                  controller: _tabs,
                  children: [
                    _buildList(_upcoming, actions: true),
                    _buildList(_completed),
                    _buildList(_cancelled),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildList(List<_Appt> list, {bool actions = false}) {
    if (list.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.08),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.calendar_today_rounded, size: 48,
              color: AppColors.primary.withOpacity(0.4)),
        ),
        const SizedBox(height: 20),
        const Text('No appointments here',
            style: TextStyle(fontFamily: 'Poppins', fontSize: 17,
                fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
        const Text('Your appointments will appear here',
            style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                color: AppColors.textSecondary)),
      ]));
    }
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 40),
      itemCount: list.length,
      separatorBuilder: (_, __) => const SizedBox(height: 14),
      itemBuilder: (_, i) {
        final a = list[i];
        final inWindow = a.isVirtual && a.status == 'confirmed' && a.isJoinWindowOpen;
        return _ApptCard(
          appt: a,
          showActions: actions,
          // "Join Now" — only in the 30-min time window (confirmed virtual)
          onJoinNow: (actions && inWindow)
              ? () {
                  _notifyPatientJoined(a.id);
                  context.push('/consultation/${a.id}', extra: true);
                }
              : null,
          // Regular chat — for virtual upcoming NOT in the window
          onJoin: (actions && a.isVirtual && !inWindow)
              ? () => context.push('/consultation/${a.id}')
              : null,
          onViewSummary: (!actions && a.isCompleted && a.isVirtual)
              ? () => context.push('/consultation/${a.id}')
              : null,
          onCancel:     actions ? () => _showCancelSheet(a)     : null,
          onReschedule: actions ? () => _showRescheduleSheet(a) : null,
        );
      },
    );
  }
}

// ── Stat pill ─────────────────────────────────────────────────────────────

class _StatPill extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  final Color textColor;
  const _StatPill({required this.label, required this.count,
      required this.color, required this.textColor});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
    decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
    child: Row(mainAxisSize: MainAxisSize.min, children: [
      Text('$count', style: TextStyle(fontFamily: 'Poppins', fontSize: 16,
          fontWeight: FontWeight.w800, color: textColor)),
      const SizedBox(width: 5),
      Text(label, style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
          fontWeight: FontWeight.w500, color: textColor.withOpacity(0.85))),
    ]),
  );
}

// ── Appointment card ──────────────────────────────────────────────────────

class _ApptCard extends StatelessWidget {
  final _Appt appt;
  final bool showActions;
  final VoidCallback? onJoinNow;   // time-window join (auto-video)
  final VoidCallback? onJoin;      // regular chat / consultation
  final VoidCallback? onViewSummary;
  final VoidCallback? onCancel;
  final VoidCallback? onReschedule;

  const _ApptCard({
    required this.appt, required this.showActions,
    this.onJoinNow, this.onJoin, this.onViewSummary, this.onCancel, this.onReschedule,
  });

  String _fmtApptTime(_Appt a) {
    final dt = a.appointmentDateTime;
    if (dt == null) return a.timeSlot;
    return DateFormat('h:mm a').format(dt);
  }

  Color get _statusColor => switch (appt.status) {
    'confirmed'  => const Color(0xFF00C853),
    'completed'  => AppColors.primary,
    'cancelled'  => AppColors.error,
    _            => const Color(0xFFF59E0B),
  };

  String get _statusLabel => switch (appt.status) {
    'confirmed'  => 'Confirmed',
    'completed'  => 'Completed',
    'cancelled'  => 'Cancelled',
    _            => 'Pending',
  };

  IconData get _statusIcon => switch (appt.status) {
    'confirmed'  => Icons.check_circle_rounded,
    'completed'  => Icons.task_alt_rounded,
    'cancelled'  => Icons.cancel_rounded,
    _            => Icons.schedule_rounded,
  };

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05),
            blurRadius: 16, offset: const Offset(0, 4))],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: IntrinsicHeight(
          child: Row(children: [
            // Left status strip
            Container(width: 5, color: _statusColor),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  // ── Doctor row ─────────────────────────────────
                  Row(children: [
                    Container(
                      width: 50, height: 50,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6C63FF), Color(0xFF4A90D9)],
                          begin: Alignment.topLeft, end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(15),
                      ),
                      child: Center(
                        child: Text(
                          appt.doctorName.isNotEmpty
                              ? appt.doctorName[0].toUpperCase() : 'D',
                          style: const TextStyle(fontFamily: 'Poppins',
                              color: Colors.white, fontWeight: FontWeight.w700, fontSize: 20),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                      Text('Dr. ${appt.doctorName}',
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
                              fontWeight: FontWeight.w700, color: AppColors.textPrimary),
                          overflow: TextOverflow.ellipsis),
                      if (appt.doctorSpec != null && appt.doctorSpec!.isNotEmpty)
                        Text(appt.doctorSpec!,
                            style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                                fontWeight: FontWeight.w500, color: AppColors.primary),
                            overflow: TextOverflow.ellipsis),
                    ])),
                    // Status badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                          color: _statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(_statusIcon, size: 12, color: _statusColor),
                        const SizedBox(width: 4),
                        Text(_statusLabel,
                            style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                                fontWeight: FontWeight.w700, color: _statusColor)),
                      ]),
                    ),
                  ]),

                  const SizedBox(height: 14),

                  // ── Info row ───────────────────────────────────
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7FF),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(children: [
                      const Icon(Icons.calendar_today_rounded,
                          size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(appt.formattedDate,
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                              fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      const SizedBox(width: 14),
                      const Icon(Icons.access_time_rounded,
                          size: 14, color: AppColors.primary),
                      const SizedBox(width: 6),
                      Text(appt.timeSlot,
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                              fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: appt.isVirtual
                              ? AppColors.primary.withOpacity(0.1)
                              : Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(
                            appt.isVirtual
                                ? Icons.videocam_rounded
                                : Icons.local_hospital_rounded,
                            size: 12,
                            color: appt.isVirtual ? AppColors.primary : Colors.green,
                          ),
                          const SizedBox(width: 4),
                          Text(appt.isVirtual ? 'Virtual' : 'In-Person',
                              style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: appt.isVirtual ? AppColors.primary : Colors.green)),
                        ]),
                      ),
                    ]),
                  ),

                  // ── Reason ─────────────────────────────────────
                  if (appt.reason != null && appt.reason!.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Icon(Icons.notes_rounded, size: 14, color: AppColors.textHint),
                      const SizedBox(width: 6),
                      Expanded(child: Text(appt.reason!,
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                              color: AppColors.textSecondary),
                          maxLines: 2, overflow: TextOverflow.ellipsis)),
                    ]),
                  ],

                  // ── Action buttons ─────────────────────────────
                  if (showActions && appt.isUpcoming) ...[
                    const SizedBox(height: 14),
                    const Divider(height: 1, color: Color(0xFFF0F0F5)),
                    const SizedBox(height: 12),

                    // ── "Join Now" button (within 30-min window) ──
                    if (onJoinNow != null) ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: onJoinNow,
                          icon: const Icon(Icons.videocam_rounded, size: 18),
                          label: const Text('Join Now'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00C853),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            textStyle: const TextStyle(fontFamily: 'Poppins',
                                fontSize: 14, fontWeight: FontWeight.w800),
                            elevation: 4,
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Container(width: 6, height: 6,
                            decoration: const BoxDecoration(
                                color: Color(0xFF00C853), shape: BoxShape.circle)),
                        const SizedBox(width: 5),
                        const Text('Live · Available for 30 minutes',
                            style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                                color: Color(0xFF00C853), fontWeight: FontWeight.w600)),
                      ]),
                      const SizedBox(height: 8),
                    ]

                    // ── Regular chat/consultation button (outside window) ──
                    else if (onJoin != null) ...[
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: onJoin,
                          icon: Icon(
                            appt.status == 'confirmed'
                                ? Icons.chat_bubble_rounded
                                : Icons.chat_rounded,
                            size: 16,
                          ),
                          label: Text(
                            appt.status == 'confirmed'
                                ? 'Open Chat'
                                : 'Open Consultation Chat',
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            textStyle: const TextStyle(fontFamily: 'Poppins',
                                fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                      // Show "Starts at X:XX" hint for confirmed appointments
                      if (appt.status == 'confirmed' &&
                          appt.minutesUntilJoin != null) ...[
                        const SizedBox(height: 5),
                        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          const Icon(Icons.schedule_rounded,
                              size: 12, color: AppColors.textHint),
                          const SizedBox(width: 4),
                          Text(
                            'Join Now available at ${_fmtApptTime(appt)}',
                            style: const TextStyle(fontFamily: 'Poppins',
                                fontSize: 11, color: AppColors.textHint),
                          ),
                        ]),
                      ],
                      const SizedBox(height: 8),
                    ],
                    Row(children: [
                      Expanded(child: OutlinedButton.icon(
                        onPressed: onReschedule,
                        icon: const Icon(Icons.edit_calendar_rounded, size: 15),
                        label: const Text('Reschedule'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          textStyle: const TextStyle(fontFamily: 'Poppins',
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      )),
                      const SizedBox(width: 10),
                      Expanded(child: OutlinedButton.icon(
                        onPressed: onCancel,
                        icon: const Icon(Icons.close_rounded, size: 15),
                        label: const Text('Cancel'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error,
                          side: const BorderSide(color: AppColors.error),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          textStyle: const TextStyle(fontFamily: 'Poppins',
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      )),
                    ]),
                  ] else if (onViewSummary != null) ...[
                    const SizedBox(height: 10),
                    const Divider(height: 1, color: Color(0xFFF0F0F5)),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: onViewSummary,
                        icon: const Icon(Icons.receipt_long_rounded, size: 15),
                        label: const Text('View Summary & Prescription'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.primary,
                          side: const BorderSide(color: AppColors.primary),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          textStyle: const TextStyle(fontFamily: 'Poppins',
                              fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                  ] else
                    const SizedBox(height: 4),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ── Cancel Sheet ──────────────────────────────────────────────────────────

class _CancelSheet extends StatefulWidget {
  final _Appt appt;
  const _CancelSheet({required this.appt});
  @override
  State<_CancelSheet> createState() => _CancelSheetState();
}

class _CancelSheetState extends State<_CancelSheet> {
  final _ctrl = TextEditingController();

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24, 20, 24,
          MediaQuery.of(context).viewInsets.bottom + 32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 40, height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 20),
        Text('Cancel Appointment', style: AppTextStyles.h4),
        const SizedBox(height: 4),
        Text('Dr. ${widget.appt.doctorName}  ·  ${widget.appt.formattedDate} at ${widget.appt.timeSlot}',
            style: AppTextStyles.bodySmall),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.warning.withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.warning.withOpacity(0.3)),
          ),
          child: Row(children: [
            const Icon(Icons.info_outline_rounded, color: AppColors.warning, size: 16),
            const SizedBox(width: 8),
            Expanded(child: Text(
              'Cancellations made more than 24h before get a full refund. '
              'Between 12–24h: 50% refund. Under 12h: no refund.',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.warning),
            )),
          ]),
        ),
        const SizedBox(height: 16),
        Text('Reason (optional)', style: AppTextStyles.labelLarge),
        const SizedBox(height: 8),
        TextFormField(
          controller: _ctrl,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: 'Tell us why you\'re cancelling...',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        const SizedBox(height: 20),
        Row(children: [
          Expanded(child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Keep Appointment'),
          )),
          const SizedBox(width: 12),
          Expanded(child: ElevatedButton(
            onPressed: () => Navigator.of(context).pop(
                _ctrl.text.trim().isEmpty ? 'No reason provided' : _ctrl.text.trim()),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Cancel Appointment'),
          )),
        ]),
      ]),
    );
  }
}

// ── Reschedule Sheet ──────────────────────────────────────────────────────

class _RescheduleSheet extends StatefulWidget {
  final _Appt appt;
  final VoidCallback onDone;
  const _RescheduleSheet({required this.appt, required this.onDone});
  @override
  State<_RescheduleSheet> createState() => _RescheduleSheetState();
}

class _RescheduleSheetState extends State<_RescheduleSheet> {
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedSlot;
  List<String> _slots = [];
  bool _loadingSlots = false;
  bool _saving = false;
  String? _error;

  @override
  void initState() { super.initState(); _loadSlots(); }

  Future<void> _loadSlots() async {
    if (widget.appt.doctorProfileId.isEmpty) return;
    setState(() { _loadingSlots = true; _selectedSlot = null; _slots = []; _error = null; });
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final res = await ApiClient().dio.get(
        ApiConstants.availableSlots,
        queryParameters: {'doctorId': widget.appt.doctorProfileId, 'date': dateStr},
      );
      final raw = res.data['availableSlots'] ?? res.data['slots'] ?? [];
      if (mounted) setState(() {
        _slots = List<String>.from(raw as List);
        _loadingSlots = false;
      });
    } catch (e) {
      if (mounted) setState(() { _slots = []; _loadingSlots = false; });
    }
  }

  Future<void> _confirm() async {
    if (_selectedSlot == null) { setState(() => _error = 'Please select a time slot'); return; }
    setState(() { _saving = true; _error = null; });
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      await ApiClient().dio.put(
        '${ApiConstants.appointments}/${widget.appt.id}/reschedule',
        data: {'newDate': dateStr, 'newTimeSlot': _selectedSlot},
      );
      widget.onDone();
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text('Appointment rescheduled successfully'),
          backgroundColor: AppColors.success,
        ));
      }
    } catch (e) {
      String msg;
      try { msg = (e as dynamic).response?.data?['message']?.toString() ?? 'Reschedule failed'; }
      catch (_) { msg = 'Reschedule failed'; }
      if (mounted) setState(() { _error = msg; _saving = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    return Container(
      padding: EdgeInsets.fromLTRB(0, 20, 0,
          MediaQuery.of(context).viewInsets.bottom + 16),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Center(child: Container(width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(2)))),
            const SizedBox(height: 20),
            Text('Reschedule Appointment', style: AppTextStyles.h4),
            const SizedBox(height: 4),
            Text('Dr. ${widget.appt.doctorName}',
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary)),
            const SizedBox(height: 4),
            Text('Current: ${widget.appt.formattedDate} at ${widget.appt.timeSlot}',
                style: AppTextStyles.bodySmall),
          ]),
        ),
        const SizedBox(height: 20),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text('Select New Date', style: AppTextStyles.labelLarge),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 76,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: 30,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) {
              final d = DateTime.now().add(Duration(days: i + 1));
              final dStr = DateFormat('yyyy-MM-dd').format(d);
              final sel = dStr == dateStr;
              return GestureDetector(
                onTap: () { setState(() => _selectedDate = d); _loadSlots(); },
                child: Container(
                  width: 54,
                  decoration: BoxDecoration(
                    color: sel ? AppColors.primary : AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: sel ? AppColors.primary : AppColors.border),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(DateFormat('EEE').format(d),
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                            color: sel ? Colors.white70 : AppColors.textSecondary)),
                    const SizedBox(height: 2),
                    Text('${d.day}', style: TextStyle(fontFamily: 'Poppins',
                        fontSize: 17, fontWeight: FontWeight.w700,
                        color: sel ? Colors.white : AppColors.textPrimary)),
                    Text(DateFormat('MMM').format(d),
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                            color: sel ? Colors.white70 : AppColors.textSecondary)),
                  ]),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),

        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Available Slots', style: AppTextStyles.labelLarge),
            const SizedBox(height: 10),
            if (_loadingSlots)
              const Center(child: Padding(padding: EdgeInsets.symmetric(vertical: 16),
                  child: CircularProgressIndicator()))
            else if (_slots.isEmpty)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Center(child: Text('No slots available for this date',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.textSecondary))),
              )
            else
              Wrap(
                spacing: 8, runSpacing: 8,
                children: _slots.map((slot) {
                  final sel = _selectedSlot == slot;
                  return GestureDetector(
                    onTap: () => setState(() { _selectedSlot = slot; _error = null; }),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                      decoration: BoxDecoration(
                        color: sel ? AppColors.primary : AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: sel ? AppColors.primary : AppColors.border),
                      ),
                      child: Text(slot, style: TextStyle(
                        fontFamily: 'Poppins', fontSize: 13, fontWeight: FontWeight.w500,
                        color: sel ? Colors.white : AppColors.textPrimary,
                      )),
                    ),
                  );
                }).toList(),
              ),

            if (_error != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.error.withOpacity(0.07),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.error.withOpacity(0.3)),
                ),
                child: Row(children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.error, size: 16),
                  const SizedBox(width: 8),
                  Expanded(child: Text(_error!,
                      style: AppTextStyles.bodySmall.copyWith(color: AppColors.error))),
                ]),
              ),
            ],

            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _saving ? null : _confirm,
              child: _saving
                  ? const SizedBox(width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Confirm Reschedule'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Keep Original Time'),
            ),
          ]),
        ),
        const SizedBox(height: 8),
      ]),
    );
  }
}