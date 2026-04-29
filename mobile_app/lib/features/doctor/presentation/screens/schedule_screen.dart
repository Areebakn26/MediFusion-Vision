import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

// Lightweight appointment model that matches the actual backend response shape.
// Backend returns: { id, date, time_slot, type, status, reason, patient: { name, email } }
class _Appt {
  final String id;
  final String date;       // "yyyy-MM-dd"
  final String timeSlot;   // "09:00 AM"
  final String type;
  final String status;
  final String patientName;
  final String? reason;

  const _Appt({
    required this.id, required this.date, required this.timeSlot,
    required this.type, required this.status,
    required this.patientName, this.reason,
  });

  factory _Appt.fromJson(Map<String, dynamic> j) {
    final patient = j['patient'] as Map<String, dynamic>?;
    return _Appt(
      id:          j['id']?.toString() ?? '',
      date:        j['date'] ?? '',
      timeSlot:    j['time_slot'] ?? j['timeSlot'] ?? '',
      type:        j['type'] ?? 'physical',
      status:      j['status'] ?? 'pending',
      patientName: patient?['name'] ?? 'Patient',
      reason:      j['reason'] ?? j['notes'],
    );
  }
}

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});
  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);
  DateTime _selected = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);
  List<_Appt> _all = [];
  bool _loading = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      // Backend returns a flat JSON array — do NOT wrap in { appointments: [] }
      final res = await ApiClient().dio.get(ApiConstants.appointments);
      final list = (res.data as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(_Appt.fromJson)
          .toList();
      if (mounted) setState(() { _all = list; _loading = false; });
    } catch (e) {
      debugPrint('❌ schedule load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  // Appointments on a specific day
  List<_Appt> _forDay(DateTime d) {
    final key = DateFormat('yyyy-MM-dd').format(d);
    return _all.where((a) => a.date == key).toList()
      ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));
  }

  // Appointments in the current month
  bool _hasAppts(DateTime d) {
    final key = DateFormat('yyyy-MM-dd').format(d);
    return _all.any((a) => a.date == key);
  }

  int get _daysInMonth => DateTime(_month.year, _month.month + 1, 0).day;
  int get _firstWeekday => DateTime(_month.year, _month.month, 1).weekday; // 1=Mon … 7=Sun

  void _prevMonth() => setState(() {
    _month = DateTime(_month.year, _month.month - 1);
    _selected = DateTime(_month.year, _month.month, 1);
  });

  void _nextMonth() => setState(() {
    _month = DateTime(_month.year, _month.month + 1);
    _selected = DateTime(_month.year, _month.month, 1);
  });

  Color _statusColor(String status) {
    switch (status) {
      case 'confirmed':  return AppColors.success;
      case 'completed':  return AppColors.primary;
      case 'cancelled':  return AppColors.error;
      default:           return AppColors.warning; // pending
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'confirmed':  return AppColors.successLight;
      case 'completed':  return AppColors.primaryLight;
      case 'cancelled':  return const Color(0xFFFFEBEE);
      default:           return const Color(0xFFFFF8E1);
    }
  }

  @override
  Widget build(BuildContext context) {
    final selectedAppts = _forDay(_selected);
    final today = DateTime(DateTime.now().year, DateTime.now().month, DateTime.now().day);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Schedule'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _load,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _load,
              child: CustomScrollView(
                slivers: [
                  // ── Calendar card ─────────────────────────────
                  SliverToBoxAdapter(
                    child: Container(
                      margin: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 12, offset: const Offset(0, 4))],
                      ),
                      child: Column(children: [

                        // Month navigation header
                        Padding(
                          padding: const EdgeInsets.fromLTRB(20, 18, 12, 8),
                          child: Row(children: [
                            Expanded(child: Text(
                              DateFormat('MMMM yyyy').format(_month),
                              style: AppTextStyles.h4,
                            )),
                            // Summary badge
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '${_all.where((a) {
                                  final d = DateTime.tryParse(a.date);
                                  return d != null && d.year == _month.year && d.month == _month.month;
                                }).length} this month',
                                style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary),
                              ),
                            ),
                            const SizedBox(width: 4),
                            IconButton(icon: const Icon(Icons.chevron_left), onPressed: _prevMonth, iconSize: 22),
                            IconButton(icon: const Icon(Icons.chevron_right), onPressed: _nextMonth, iconSize: 22),
                          ]),
                        ),

                        // Weekday headers
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Row(
                            children: ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d) => Expanded(
                              child: Center(child: Text(d,
                                style: AppTextStyles.labelSmall.copyWith(
                                  color: AppColors.textHint,
                                  fontWeight: FontWeight.w700,
                                ))),
                            )).toList(),
                          ),
                        ),
                        const SizedBox(height: 6),

                        // Calendar grid
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 0, 12, 16),
                          child: _buildGrid(today),
                        ),
                      ]),
                    ),
                  ),

                  // ── Appointments for selected day ──────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                      child: Row(children: [
                        Expanded(child: Text(
                          DateFormat('EEEE, MMMM d').format(_selected),
                          style: AppTextStyles.h5,
                        )),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: selectedAppts.isEmpty ? AppColors.background : AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            '${selectedAppts.length} appointment${selectedAppts.length == 1 ? '' : 's'}',
                            style: AppTextStyles.labelSmall.copyWith(
                              color: selectedAppts.isEmpty ? AppColors.textHint : AppColors.primary,
                            ),
                          ),
                        ),
                      ]),
                    ),
                  ),

                  if (selectedAppts.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.event_available_outlined, size: 48, color: AppColors.textHint.withOpacity(0.5)),
                          const SizedBox(height: 12),
                          Text('No appointments on this day',
                              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
                        ]),
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, i) => _ApptCard(appt: selectedAppts[i], statusColor: _statusColor(selectedAppts[i].status), statusBg: _statusBg(selectedAppts[i].status)),
                          childCount: selectedAppts.length,
                        ),
                      ),
                    ),
                ],
              ),
            ),
    );
  }

  Widget _buildGrid(DateTime today) {
    // blank leading cells + day cells
    final leading = _firstWeekday - 1; // 0=Mon starts on first column
    final total = leading + _daysInMonth;
    final rows = (total / 7).ceil();

    return Column(
      children: List.generate(rows, (row) {
        return Row(
          children: List.generate(7, (col) {
            final cellIndex = row * 7 + col;
            final dayNum = cellIndex - leading + 1;

            if (dayNum < 1 || dayNum > _daysInMonth) {
              return const Expanded(child: SizedBox(height: 48));
            }

            final day = DateTime(_month.year, _month.month, dayNum);
            final isToday = day == today;
            final isSelected = day.year == _selected.year && day.month == _selected.month && day.day == _selected.day;
            final hasAppts = _hasAppts(day);
            final apptCount = _forDay(day).length;

            return Expanded(
              child: GestureDetector(
                onTap: () => setState(() => _selected = day),
                child: Container(
                  height: 52,
                  margin: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.primary : isToday ? AppColors.primaryLight : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text(
                      '$dayNum',
                      style: TextStyle(
                        fontFamily: 'Poppins',
                        fontSize: 14,
                        fontWeight: isSelected || isToday ? FontWeight.w700 : FontWeight.w400,
                        color: isSelected ? Colors.white : isToday ? AppColors.primary : AppColors.textPrimary,
                      ),
                    ),
                    if (hasAppts) ...[
                      const SizedBox(height: 3),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(apptCount.clamp(0, 3), (_) => Container(
                          width: 5, height: 5,
                          margin: const EdgeInsets.symmetric(horizontal: 1),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white70 : AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        )),
                      ),
                    ],
                  ]),
                ),
              ),
            );
          }),
        );
      }),
    );
  }
}

class _ApptCard extends StatelessWidget {
  final _Appt appt;
  final Color statusColor;
  final Color statusBg;
  const _ApptCard({required this.appt, required this.statusColor, required this.statusBg});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(children: [
        // Time sidebar
        Container(
          width: 72,
          padding: const EdgeInsets.symmetric(vertical: 20),
          decoration: BoxDecoration(
            color: AppColors.primaryLight,
            borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), bottomLeft: Radius.circular(16)),
          ),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(
              appt.timeSlot.split(' ')[0], // "09:00"
              style: AppTextStyles.labelLarge.copyWith(color: AppColors.primary, fontSize: 15),
            ),
            Text(
              appt.timeSlot.split(' ').length > 1 ? appt.timeSlot.split(' ')[1] : '', // "AM"/"PM"
              style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary),
            ),
          ]),
        ),

        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 12, 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(appt.patientName, style: AppTextStyles.labelLarge, overflow: TextOverflow.ellipsis)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: statusBg, borderRadius: BorderRadius.circular(20)),
                  child: Text(
                    appt.status[0].toUpperCase() + appt.status.substring(1),
                    style: AppTextStyles.labelSmall.copyWith(color: statusColor),
                  ),
                ),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                Icon(
                  appt.type == 'virtual' ? Icons.videocam_outlined : Icons.local_hospital_outlined,
                  size: 14, color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  appt.type == 'virtual' ? 'Virtual Consultation' : 'In-Person Visit',
                  style: AppTextStyles.bodySmall,
                ),
              ]),
              if (appt.reason != null && appt.reason!.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  appt.reason!,
                  style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ]),
          ),
        ),
      ]),
    );
  }
}
