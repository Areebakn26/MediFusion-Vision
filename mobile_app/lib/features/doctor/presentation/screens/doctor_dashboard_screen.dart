import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../auth/presentation/bloc/auth_bloc.dart';
import '../../../shared/presentation/screens/notifications_screen.dart';

// Lightweight models matching actual backend response
class _Appt {
  final String id, date, timeSlot, type, status, patientName, patientId;
  const _Appt({required this.id, required this.date, required this.timeSlot,
      required this.type, required this.status, required this.patientName, required this.patientId});
  factory _Appt.fromJson(Map<String, dynamic> j) {
    final p = j['patient'] as Map<String, dynamic>?;
    return _Appt(
      id:          j['id']?.toString() ?? '',
      date:        j['date']?.toString() ?? '',
      timeSlot:    (j['time_slot'] ?? j['timeSlot'])?.toString() ?? '',
      type:        j['type']?.toString() ?? 'physical',
      status:      j['status']?.toString() ?? 'pending',
      patientName: p?['name']?.toString() ?? 'Patient',
      patientId:   j['patient_id']?.toString() ?? '',
    );
  }
}

class DoctorDashboardScreen extends StatefulWidget {
  const DoctorDashboardScreen({super.key});
  @override
  State<DoctorDashboardScreen> createState() => _DoctorDashboardScreenState();
}

class _DoctorDashboardScreenState extends State<DoctorDashboardScreen> {
  List<_Appt> _appts = [];
  List<Map<String, dynamic>> _scans = [];
  bool _loading = true;

  final _today     = DateFormat('yyyy-MM-dd').format(DateTime.now());
  final _monthKey  = DateFormat('yyyy-MM').format(DateTime.now());

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final dio = ApiClient().dio;
      final results = await Future.wait([
        dio.get(ApiConstants.appointments),
        dio.get(ApiConstants.scans),
      ]);
      final appts = (results[0].data as List<dynamic>)
          .cast<Map<String, dynamic>>()
          .map(_Appt.fromJson)
          .toList();
      final scans = (results[1].data as List<dynamic>)
          .cast<Map<String, dynamic>>();
      if (mounted) setState(() { _appts = appts; _scans = scans; _loading = false; });
    } catch (e) {
      debugPrint('❌ dashboard load error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Computed analytics ───────────────────────────────────────────

  List<_Appt> get _todayAppts =>
      _appts.where((a) => a.date == _today).toList()
        ..sort((a, b) => a.timeSlot.compareTo(b.timeSlot));

  int get _totalPatients => _appts.map((a) => a.patientId).toSet().length;

  int get _thisMonthCount =>
      _appts.where((a) => a.date.startsWith(_monthKey)).length;

  int get _completedCount =>
      _appts.where((a) => a.status == 'completed').length;

  int get _confirmedCount =>
      _appts.where((a) => a.status == 'confirmed').length;

  int get _pendingScansCount =>
      _scans.where((s) => (s['status'] ?? '') == 'pending').length;

  int get _virtualCount =>
      _appts.where((a) => a.type == 'virtual').length;

  double get _virtualPct =>
      _appts.isEmpty ? 0 : (_virtualCount / _appts.length * 100);

  // appointment counts for last 7 days (Mon → today's weekday)
  List<int> get _weekCounts {
    final now = DateTime.now();
    final monday = now.subtract(Duration(days: now.weekday - 1));
    return List.generate(7, (i) {
      final d = monday.add(Duration(days: i));
      final key = DateFormat('yyyy-MM-dd').format(d);
      return _appts.where((a) => a.date == key).length;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = (context.read<AuthBloc>().state as AuthAuthenticated).user;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(slivers: [
          SliverToBoxAdapter(child: _Header(user: user, greeting: _greeting(),
              onNotif: () => context.push('/notifications'))),
          if (_loading)
            const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
          else ...[
            SliverToBoxAdapter(child: _buildStatGrid()),
            SliverToBoxAdapter(child: _buildWeekChart()),
            SliverToBoxAdapter(child: _buildTypeBreakdown()),
            SliverToBoxAdapter(child: _buildTodaySchedule()),
            SliverToBoxAdapter(child: _buildQuickActions(context)),
            const SliverToBoxAdapter(child: SizedBox(height: 32)),
          ],
        ]),
      ),
    );
  }

  // ── Stat grid ────────────────────────────────────────────────────

  Widget _buildStatGrid() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(children: [
        Row(children: [
          _StatCard(label: 'Total Patients', value: '$_totalPatients',
              icon: Icons.people_alt_outlined, color: AppColors.primary,
              sub: 'all time'),
          const SizedBox(width: 12),
          _StatCard(label: 'This Month', value: '$_thisMonthCount',
              icon: Icons.calendar_month_outlined, color: const Color(0xFF8B5CF6),
              sub: DateFormat('MMMM').format(DateTime.now())),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _StatCard(label: 'Completed', value: '$_completedCount',
              icon: Icons.check_circle_outline, color: AppColors.success,
              sub: 'all time'),
          const SizedBox(width: 12),
          _StatCard(label: 'Pending Scans', value: '$_pendingScansCount',
              icon: Icons.document_scanner_outlined, color: AppColors.warning,
              sub: 'need review'),
        ]),
      ]),
    );
  }

  // ── Weekly bar chart ─────────────────────────────────────────────

  Widget _buildWeekChart() {
    final counts = _weekCounts;
    final maxY = counts.reduce((a, b) => a > b ? a : b).toDouble();
    final clampedMax = maxY < 4 ? 4.0 : maxY + 1;
    final todayIdx = DateTime.now().weekday - 1; // 0=Mon
    final labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final thisWeekTotal = counts.reduce((a, b) => a + b);

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('This Week', style: AppTextStyles.h5),
            Text('$thisWeekTotal appointment${thisWeekTotal == 1 ? '' : 's'}',
                style: AppTextStyles.bodySmall),
          ])),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(20)),
            child: Text(DateFormat('MMM d').format(DateTime.now()),
                style: AppTextStyles.labelSmall.copyWith(color: AppColors.primary)),
          ),
        ]),
        const SizedBox(height: 24),
        SizedBox(
          height: 130,
          child: BarChart(
            BarChartData(
              maxY: clampedMax,
              barGroups: List.generate(7, (i) => BarChartGroupData(
                x: i,
                barRods: [BarChartRodData(
                  toY: counts[i].toDouble(),
                  gradient: LinearGradient(
                    colors: i == todayIdx
                        ? [AppColors.primary, const Color(0xFF8B8FF8)]
                        : [AppColors.primary.withOpacity(0.3), AppColors.primary.withOpacity(0.5)],
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                  ),
                  width: 28,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
                  backDrawRodData: BackgroundBarChartRodData(
                    show: true, toY: clampedMax,
                    color: AppColors.background,
                  ),
                )],
              )),
              titlesData: FlTitlesData(
                leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(sideTitles: SideTitles(
                  showTitles: true, reservedSize: 28,
                  getTitlesWidget: (v, _) {
                    final i = v.toInt();
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(labels[i],
                        style: TextStyle(
                          fontFamily: 'Poppins', fontSize: 11,
                          fontWeight: i == todayIdx ? FontWeight.w700 : FontWeight.w400,
                          color: i == todayIdx ? AppColors.primary : AppColors.textHint,
                        ),
                      ),
                    );
                  },
                )),
              ),
              gridData: FlGridData(
                show: true, drawVerticalLine: false,
                horizontalInterval: 1,
                getDrawingHorizontalLine: (_) =>
                    FlLine(color: AppColors.border, strokeWidth: 0.8),
              ),
              borderData: FlBorderData(show: false),
              barTouchData: BarTouchData(
                touchTooltipData: BarTouchTooltipData(
                  getTooltipColor: (_) => AppColors.primary,
                  tooltipRoundedRadius: 8,
                  getTooltipItem: (_, __, rod, ___) => BarTooltipItem(
                    '${rod.toY.toInt()}',
                    const TextStyle(fontFamily: 'Poppins', color: Colors.white,
                        fontWeight: FontWeight.w700, fontSize: 13),
                  ),
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }

  // ── Appointment type breakdown ───────────────────────────────────

  Widget _buildTypeBreakdown() {
    if (_appts.isEmpty) return const SizedBox();
    final total = _appts.length;
    final virtual  = _virtualCount;
    final physical = total - virtual;
    final vPct = _virtualPct;
    final pPct = 100 - vPct;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Appointment Types', style: AppTextStyles.h5),
        const SizedBox(height: 4),
        Text('All time — $total total', style: AppTextStyles.bodySmall),
        const SizedBox(height: 16),
        // Stacked progress bar
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Row(children: [
            if (virtual > 0)
              Flexible(flex: virtual, child: Container(height: 10, color: AppColors.primary)),
            if (physical > 0)
              Flexible(flex: physical, child: Container(height: 10, color: AppColors.secondary)),
          ]),
        ),
        const SizedBox(height: 16),
        Row(children: [
          _TypeLegend(color: AppColors.primary,   label: 'Virtual',   count: virtual,  pct: vPct),
          const SizedBox(width: 24),
          _TypeLegend(color: AppColors.secondary, label: 'In-Person', count: physical, pct: pPct),
          const Spacer(),
          // Confirmed badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(20)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.check_circle_outline, size: 14, color: AppColors.success),
              const SizedBox(width: 4),
              Text('$_confirmedCount confirmed',
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.success)),
            ]),
          ),
        ]),
      ]),
    );
  }

  // ── Today's schedule ─────────────────────────────────────────────

  Widget _buildTodaySchedule() {
    final appts = _todayAppts;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text("Today's Schedule", style: AppTextStyles.h5)),
          if (appts.isNotEmpty)
            GestureDetector(
              onTap: () => context.go('/doctor/schedule'),
              child: Text('See all', style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary)),
            ),
        ]),
        const SizedBox(height: 12),
        if (appts.isEmpty)
          _emptyToday()
        else
          ...appts.take(4).map((a) => _ApptTile(appt: a, onJoin: () => context.push('/consultation/${a.id}'))),
        if (appts.length > 4) ...[
          const SizedBox(height: 8),
          Center(child: Text('+${appts.length - 4} more — check Schedule',
              style: AppTextStyles.bodySmall.copyWith(color: AppColors.primary))),
        ],
      ]),
    );
  }

  Widget _emptyToday() => Container(
    padding: const EdgeInsets.all(20),
    decoration: BoxDecoration(
      color: AppColors.white, borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.border),
    ),
    child: Row(children: [
      Container(width: 44, height: 44,
        decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(12)),
        child: const Icon(Icons.event_available_outlined, color: AppColors.success, size: 22)),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('No appointments today', style: AppTextStyles.labelLarge),
        Text('Enjoy your free day!', style: AppTextStyles.bodySmall),
      ])),
    ]),
  );

  // ── Quick actions ────────────────────────────────────────────────

  Widget _buildQuickActions(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Quick Actions', style: AppTextStyles.h5),
        const SizedBox(height: 12),
        Row(children: [
          _ActionTile(icon: Icons.calendar_month_outlined, label: 'Schedule',
              color: AppColors.primary, onTap: () => context.go('/doctor/schedule')),
          const SizedBox(width: 12),
          _ActionTile(icon: Icons.people_alt_outlined, label: 'Patients',
              color: const Color(0xFF8B5CF6), onTap: () => context.go('/doctor/patients')),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _ActionTile(icon: Icons.document_scanner_outlined, label: 'Scans',
              color: AppColors.warning, onTap: () {}),
          const SizedBox(width: 12),
          _ActionTile(icon: Icons.settings_outlined, label: 'Profile',
              color: AppColors.secondary, onTap: () => context.go('/doctor/profile')),
        ]),
      ]),
    );
  }

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Morning';
    if (h < 17) return 'Afternoon';
    return 'Evening';
  }
}

// ── Header ──────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  final UserModel user;
  final String greeting;
  final VoidCallback onNotif;
  const _Header({required this.user, required this.greeting, required this.onNotif});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.fromLTRB(24, MediaQuery.of(context).padding.top + 16, 24, 28),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF3F43D4), Color(0xFF5B5FEF), Color(0xFF8B8FF8)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Top row
        Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Good $greeting 👋',
                style: const TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 13)),
            const SizedBox(height: 2),
            Text('Dr. ${user.name}',
                style: const TextStyle(fontFamily: 'Poppins', fontSize: 22,
                    fontWeight: FontWeight.w700, color: Colors.white)),
            Text(user.doctorProfile?.specialization ?? 'Doctor',
                style: const TextStyle(fontFamily: 'Poppins', color: Colors.white60, fontSize: 13)),
          ])),
          NotificationBell(onTap: onNotif),
        ]),
        const SizedBox(height: 20),
        // Date card
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.15),
              borderRadius: BorderRadius.circular(14)),
          child: Row(children: [
            const Icon(Icons.calendar_today_outlined, color: Colors.white70, size: 16),
            const SizedBox(width: 8),
            Text(DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now()),
                style: const TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 13,
                    fontWeight: FontWeight.w500)),
          ]),
        ),
      ]),
    );
  }
}

// ── Stat card ────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  final Color color;
  const _StatCard({required this.label, required this.value, required this.icon,
      required this.color, required this.sub});

  @override
  Widget build(BuildContext context) => Expanded(
    child: Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 3))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 40, height: 40,
          decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 20)),
        const SizedBox(height: 12),
        Text(value, style: TextStyle(fontFamily: 'Poppins', fontSize: 28,
            fontWeight: FontWeight.w700, color: color, height: 1)),
        const SizedBox(height: 4),
        Text(label, style: AppTextStyles.labelLarge.copyWith(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(sub, style: AppTextStyles.labelSmall.copyWith(color: color.withOpacity(0.7))),
      ]),
    ),
  );
}

// ── Type legend item ────────────────────────────────────────────────

class _TypeLegend extends StatelessWidget {
  final Color color;
  final String label;
  final int count;
  final double pct;
  const _TypeLegend({required this.color, required this.label, required this.count, required this.pct});

  @override
  Widget build(BuildContext context) => Row(mainAxisSize: MainAxisSize.min, children: [
    Container(width: 10, height: 10, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
    const SizedBox(width: 6),
    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: AppTextStyles.labelSmall),
      Text('$count (${pct.toStringAsFixed(0)}%)',
          style: TextStyle(fontFamily: 'Poppins', fontSize: 13, fontWeight: FontWeight.w700, color: color)),
    ]),
  ]);
}

// ── Today appointment tile ──────────────────────────────────────────

class _ApptTile extends StatelessWidget {
  final _Appt appt;
  final VoidCallback onJoin;
  const _ApptTile({required this.appt, required this.onJoin});

  Color get _statusColor {
    switch (appt.status) {
      case 'confirmed':  return AppColors.success;
      case 'completed':  return AppColors.primary;
      case 'cancelled':  return AppColors.error;
      default:           return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    final parts = appt.timeSlot.split(' ');
    final time   = parts.isNotEmpty ? parts[0] : appt.timeSlot;
    final ampm   = parts.length > 1 ? parts[1] : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 6)],
      ),
      child: Row(children: [
        // Time column
        Column(children: [
          Text(time, style: AppTextStyles.h5.copyWith(color: AppColors.primary, fontSize: 15)),
          Text(ampm, style: AppTextStyles.caption.copyWith(color: AppColors.primary, fontSize: 11)),
        ]),
        Container(width: 1, height: 36, color: AppColors.border, margin: const EdgeInsets.symmetric(horizontal: 14)),
        // Patient info
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(appt.patientName, style: AppTextStyles.labelLarge, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 2),
          Row(children: [
            Icon(appt.type == 'virtual' ? Icons.videocam_outlined : Icons.local_hospital_outlined,
                size: 12, color: AppColors.textSecondary),
            const SizedBox(width: 4),
            Text(appt.type == 'virtual' ? 'Virtual' : 'In-Person', style: AppTextStyles.bodySmall),
          ]),
        ])),
        // Status / Join
        if (appt.type == 'virtual' && appt.status == 'confirmed')
          GestureDetector(
            onTap: onJoin,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
              child: const Text('Join', style: TextStyle(fontFamily: 'Poppins', color: Colors.white,
                  fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          )
        else
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: _statusColor.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
            child: Text(appt.status[0].toUpperCase() + appt.status.substring(1),
                style: AppTextStyles.labelSmall.copyWith(color: _statusColor)),
          ),
      ]),
    );
  }
}

// ── Quick action tile ────────────────────────────────────────────────

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _ActionTile({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(children: [
          Container(width: 44, height: 44,
            decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 22)),
          const SizedBox(height: 8),
          Text(label, style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
              fontWeight: FontWeight.w600, color: color)),
        ]),
      ),
    ),
  );
}
