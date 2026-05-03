import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class _Notif {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic> data;

  _Notif({
    required this.id, required this.type, required this.title,
    required this.message, required this.isRead, required this.createdAt,
    required this.data,
  });

  factory _Notif.fromJson(Map<String, dynamic> j) => _Notif(
    id:        j['id']?.toString() ?? '',
    type:      j['type']?.toString() ?? 'info',
    title:     j['title']?.toString() ?? '',
    message:   j['message']?.toString() ?? '',
    isRead:    j['is_read'] as bool? ?? false,
    createdAt: DateTime.tryParse(j['createdAt']?.toString() ?? '') ?? DateTime.now(),
    data:      (j['data'] is Map) ? Map<String, dynamic>.from(j['data'] as Map) : {},
  );

  _Notif copyWithRead() => _Notif(
    id: id, type: type, title: title, message: message,
    isRead: true, createdAt: createdAt, data: data,
  );
}

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<_Notif> _notifs = [];
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient().dio.get(ApiConstants.notifications);
      final list = (res.data as List<dynamic>)
          .map((e) => _Notif.fromJson(e as Map<String, dynamic>))
          .toList();
      if (mounted) setState(() { _notifs = list; _loading = false; });
    } catch (e) {
      debugPrint('❌ notifications load: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _markRead(String id) async {
    try {
      await ApiClient().dio.put('/notifications/$id/read');
      if (mounted) {
        setState(() {
          _notifs = _notifs.map((n) => n.id == id ? n.copyWithRead() : n).toList();
        });
      }
    } catch (_) {}
  }

  Future<void> _markAllRead() async {
    try {
      await ApiClient().dio.put(ApiConstants.notificationsReadAll);
      if (mounted) {
        setState(() {
          _notifs = _notifs.map((n) => n.copyWithRead()).toList();
        });
      }
    } catch (_) {}
  }

  int get _unreadCount => _notifs.where((n) => !n.isRead).length;

  // Group by date label
  Map<String, List<_Notif>> _grouped() {
    final now = DateTime.now();
    final today = DateFormat('yyyy-MM-dd').format(now);
    final yesterday = DateFormat('yyyy-MM-dd').format(now.subtract(const Duration(days: 1)));
    final groups = <String, List<_Notif>>{};
    for (final n in _notifs) {
      final d = DateFormat('yyyy-MM-dd').format(n.createdAt);
      String label;
      if (d == today) label = 'Today';
      else if (d == yesterday) label = 'Yesterday';
      else label = DateFormat('MMMM d, yyyy').format(n.createdAt);
      groups.putIfAbsent(label, () => []).add(n);
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllRead,
              child: Text('Mark all read',
                  style: TextStyle(fontFamily: 'Poppins',
                      color: AppColors.primary, fontSize: 13)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _notifs.isEmpty
          ? _emptyState()
          : RefreshIndicator(
              onRefresh: _load,
              child: _buildList(),
            ),
    );
  }

  Widget _buildList() {
    final groups = _grouped();
    final entries = groups.entries.toList();

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
      itemCount: entries.fold<int>(0, (sum, e) => sum + 1 + e.value.length),
      itemBuilder: (_, idx) {
        // Flatten groups with headers
        int cursor = 0;
        for (final entry in entries) {
          if (idx == cursor) {
            return _DateHeader(entry.key);
          }
          cursor++;
          final itemIdx = idx - cursor;
          if (itemIdx < entry.value.length) {
            return _NotifCard(
              notif: entry.value[itemIdx],
              onTap: () { if (!entry.value[itemIdx].isRead) _markRead(entry.value[itemIdx].id); },
            );
          }
          cursor += entry.value.length;
        }
        return const SizedBox();
      },
    );
  }

  Widget _emptyState() => Center(
    child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.notifications_none_outlined, size: 64,
          color: AppColors.textHint.withOpacity(0.35)),
      const SizedBox(height: 12),
      Text('No notifications yet',
          style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary)),
      const SizedBox(height: 4),
      Text('You\'ll see updates about appointments and reports here.',
          style: AppTextStyles.bodySmall.copyWith(color: AppColors.textHint),
          textAlign: TextAlign.center),
    ]),
  );
}

// ── Date group header ─────────────────────────────────────────────────

class _DateHeader extends StatelessWidget {
  final String label;
  const _DateHeader(this.label);
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(2, 16, 2, 8),
    child: Text(label,
        style: AppTextStyles.labelLarge.copyWith(
            color: AppColors.textSecondary, fontSize: 13)),
  );
}

// ── Notification card ─────────────────────────────────────────────────

class _NotifCard extends StatelessWidget {
  final _Notif notif;
  final VoidCallback onTap;
  const _NotifCard({required this.notif, required this.onTap});

  _NotifStyle get _style => _styleFor(notif.type);

  @override
  Widget build(BuildContext context) {
    final timeStr = DateFormat('h:mm a').format(notif.createdAt);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: notif.isRead ? AppColors.white : _style.bg,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: notif.isRead ? AppColors.border : _style.color.withOpacity(0.25),
            width: notif.isRead ? 1 : 1.5,
          ),
          boxShadow: [BoxShadow(
            color: Colors.black.withOpacity(notif.isRead ? 0.03 : 0.05),
            blurRadius: 6, offset: const Offset(0, 2),
          )],
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Icon circle
          Container(
            width: 44, height: 44,
            decoration: BoxDecoration(
                color: _style.color.withOpacity(0.12), shape: BoxShape.circle),
            child: Icon(_style.icon, color: _style.color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(notif.title,
                  style: AppTextStyles.labelLarge.copyWith(
                      fontSize: 14,
                      color: notif.isRead ? AppColors.textPrimary : _style.color))),
              if (!notif.isRead)
                Container(width: 8, height: 8,
                    decoration: BoxDecoration(color: _style.color, shape: BoxShape.circle)),
            ]),
            const SizedBox(height: 4),
            Text(notif.message,
                style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary, height: 1.4)),
            const SizedBox(height: 6),
            Text(timeStr,
                style: AppTextStyles.labelSmall.copyWith(
                    color: AppColors.textHint, fontSize: 11)),
          ])),
        ]),
      ),
    );
  }

  static _NotifStyle _styleFor(String type) {
    switch (type) {
      case 'appointment_booked':
        return _NotifStyle(Icons.event_available_outlined,
            AppColors.success, AppColors.successLight);
      case 'appointment_cancelled':
        return _NotifStyle(Icons.event_busy_outlined,
            AppColors.error, AppColors.error.withOpacity(0.07));
      case 'appointment_rescheduled':
        return _NotifStyle(Icons.update_outlined,
            AppColors.warning, AppColors.warning.withOpacity(0.07));
      case 'appointment_confirmed':
        return _NotifStyle(Icons.check_circle_outline,
            AppColors.success, AppColors.successLight);
      case 'appointment_reminder':
        return _NotifStyle(Icons.alarm_outlined,
            const Color(0xFF8B5CF6), const Color(0xFF8B5CF6).withOpacity(0.07));
      case 'report_ready':
        return _NotifStyle(Icons.description_outlined,
            AppColors.primary, AppColors.primaryLight);
      default:
        return _NotifStyle(Icons.info_outline,
            AppColors.textSecondary, AppColors.background);
    }
  }
}

class _NotifStyle {
  final IconData icon;
  final Color color, bg;
  const _NotifStyle(this.icon, this.color, this.bg);
}

// ── Unread badge widget (used by dashboards) ──────────────────────────

class NotificationBell extends StatefulWidget {
  final VoidCallback onTap;
  const NotificationBell({super.key, required this.onTap});
  @override
  State<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell> {
  int _count = 0;

  @override
  void initState() { super.initState(); _loadCount(); }

  Future<void> _loadCount() async {
    try {
      final res = await ApiClient().dio.get(ApiConstants.notificationsUnread);
      final c = (res.data['count'] as num?)?.toInt() ?? 0;
      if (mounted) setState(() => _count = c);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () { widget.onTap(); _loadCount(); },
      child: Stack(clipBehavior: Clip.none, children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.18),
              borderRadius: BorderRadius.circular(12)),
          child: const Icon(Icons.notifications_outlined, color: Colors.white, size: 22),
        ),
        if (_count > 0)
          Positioned(
            top: -2, right: -2,
            child: Container(
              padding: const EdgeInsets.all(3),
              decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: _count > 9 ? BoxShape.rectangle : BoxShape.circle,
                  borderRadius: _count > 9 ? BorderRadius.circular(8) : null),
              child: Text('${_count > 99 ? '99+' : _count}',
                  style: const TextStyle(fontFamily: 'Poppins', color: Colors.white,
                      fontSize: 9, fontWeight: FontWeight.w700)),
            ),
          ),
      ]),
    );
  }
}
