import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/models/app_models.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';
import 'payment_screen.dart';

class BookAppointmentScreen extends StatefulWidget {
  final String doctorId;
  final DoctorListItemModel? doctor;
  const BookAppointmentScreen({super.key, required this.doctorId, this.doctor});
  @override
  State<BookAppointmentScreen> createState() => _BookAppointmentScreenState();
}

class _BookAppointmentScreenState extends State<BookAppointmentScreen> {
  DoctorListItemModel? _doctor;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String? _selectedSlot;
  String _type = 'virtual';
  final _reasonCtrl = TextEditingController();
  List<String> _slots = [];
  bool _loadingDoctor = false;
  bool _loadingSlots = false;
  bool _booking = false;

  @override
  void initState() {
    super.initState();
    if (widget.doctor != null) {
      _doctor = widget.doctor;
      _loadSlots();
    } else {
      _loadDoctor();
    }
  }

  @override
  void dispose() { _reasonCtrl.dispose(); super.dispose(); }

  Future<void> _loadDoctor() async {
    setState(() => _loadingDoctor = true);
    try {
      final res = await ApiClient().dio.get('${ApiConstants.doctors}/${widget.doctorId}');
      final json = (res.data is Map && res.data['doctor'] != null)
          ? res.data['doctor'] as Map<String, dynamic>
          : res.data as Map<String, dynamic>;
      if (mounted) {
        setState(() { _doctor = DoctorListItemModel.fromJson(json); _loadingDoctor = false; });
        _loadSlots();
      }
    } catch (e) {
      debugPrint('❌ loadDoctor error: $e');
      if (mounted) setState(() => _loadingDoctor = false);
    }
  }

  Future<void> _loadSlots() async {
    if (_doctor == null) return;
    setState(() { _loadingSlots = true; _selectedSlot = null; _slots = []; });
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    try {
      final res = await ApiClient().dio.get(
        ApiConstants.availableSlots,
        queryParameters: {'doctorId': _doctor!.id, 'date': dateStr},
      );
      final raw = res.data['availableSlots'] ?? res.data['slots'] ?? res.data ?? [];
      if (mounted) setState(() { _slots = List<String>.from(raw as List); _loadingSlots = false; });
    } catch (e) {
      debugPrint('❌ loadSlots error: $e');
      if (mounted) setState(() { _slots = []; _loadingSlots = false; });
    }
  }

  Future<void> _book() async {
    if (_selectedSlot == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(children: [
            Icon(Icons.warning_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Please select a time slot'),
          ]),
          backgroundColor: AppColors.warning,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    if (kIsWeb) { await _bookDirectly(dateStr); return; }
    Navigator.of(context, rootNavigator: true).push(
      MaterialPageRoute(builder: (_) => PaymentScreen(extra: {
        'doctorProfileId': _doctor!.id,
        'doctorUserId':    widget.doctorId,
        'date':            dateStr,
        'timeSlot':        _selectedSlot!,
        'type':            _type,
        'notes':           _reasonCtrl.text.trim().isEmpty ? null : _reasonCtrl.text.trim(),
        'doctorName':      'Dr. ${_doctor?.name ?? ''}',
        'fee':             _doctor?.profile.consultationFee ?? 0,
      })),
    );
  }

  Future<void> _bookDirectly(String dateStr) async {
    setState(() => _booking = true);
    try {
      await ApiClient().dio.post(ApiConstants.appointments, data: {
        'doctorId': widget.doctorId,
        'date':     dateStr,
        'timeSlot': _selectedSlot!,
        'type':     _type,
        'notes':    _reasonCtrl.text.trim().isEmpty ? null : _reasonCtrl.text.trim(),
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: const Row(children: [
            Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('Appointment booked successfully!'),
          ]),
          backgroundColor: AppColors.success,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        final msg = e.toString().contains('400')
            ? 'Booking failed — slot may be unavailable or profile incomplete.'
            : 'Booking failed. Please try again.';
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(msg), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _booking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadingDoctor || _doctor == null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF5F7FF),
        body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text('Loading doctor info…',
              style: TextStyle(fontFamily: 'Poppins', fontSize: 14,
                  color: Colors.grey.shade500)),
        ])),
      );
    }

    final profile = _doctor!.profile;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FF),
      body: CustomScrollView(
        slivers: [
          // ── Gradient header ──────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 8,
                left: 16, right: 16, bottom: 24,
              ),
              child: Column(children: [
                // Back button row
                Row(children: [
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.arrow_back_rounded, color: Colors.white, size: 20),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text('Book Appointment',
                      style: TextStyle(fontFamily: 'Poppins', fontSize: 20,
                          fontWeight: FontWeight.w700, color: Colors.white)),
                ]),
                const SizedBox(height: 20),
                // Doctor card inside header
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.25),
                        borderRadius: BorderRadius.circular(16),
                        image: _doctor!.profilePicture != null
                            ? DecorationImage(
                                image: NetworkImage(_doctor!.profilePicture!),
                                fit: BoxFit.cover)
                            : null,
                      ),
                      child: _doctor!.profilePicture == null
                          ? Center(child: Text(
                              _doctor!.name.isNotEmpty
                                  ? _doctor!.name[0].toUpperCase() : 'D',
                              style: const TextStyle(fontFamily: 'Poppins',
                                  color: Colors.white, fontWeight: FontWeight.w700, fontSize: 22)))
                          : null,
                    ),
                    const SizedBox(width: 14),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Dr. ${_doctor!.name}',
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 16,
                              fontWeight: FontWeight.w700, color: Colors.white)),
                      const SizedBox(height: 3),
                      Text(profile.specialization ?? 'General Physician',
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 13,
                              color: Colors.white70)),
                      const SizedBox(height: 6),
                      Row(children: [
                        const Icon(Icons.star_rounded, size: 14, color: Color(0xFFF59E0B)),
                        const SizedBox(width: 3),
                        Text(profile.rating?.toStringAsFixed(1) ?? '—',
                            style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                                color: Colors.white70)),
                        const SizedBox(width: 10),
                        const Icon(Icons.work_outline_rounded, size: 13, color: Colors.white54),
                        const SizedBox(width: 3),
                        Text('${profile.yearsOfExperience ?? 0} yrs',
                            style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
                                color: Colors.white70)),
                      ]),
                    ])),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      const Text('Fee', style: TextStyle(fontFamily: 'Poppins',
                          fontSize: 11, color: Colors.white60)),
                      Text('PKR ${profile.consultationFee?.toStringAsFixed(0) ?? '—'}',
                          style: const TextStyle(fontFamily: 'Poppins', fontSize: 15,
                              fontWeight: FontWeight.w800, color: Colors.white)),
                    ]),
                  ]),
                ),
              ]),
            ),
          ),

          // ── Content ──────────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
            sliver: SliverList(
              delegate: SliverChildListDelegate([

                // ── Appointment type ───────────────────────────
                _SectionLabel(icon: Icons.calendar_month_rounded, label: 'Appointment Type'),
                const SizedBox(height: 12),
                Row(children: ['virtual', 'physical'].map((t) => Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 5),
                    child: GestureDetector(
                      onTap: () { setState(() => _type = t); _loadSlots(); },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: _type == t ? AppColors.primary : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                              color: _type == t ? AppColors.primary : Colors.grey.shade200,
                              width: _type == t ? 2 : 1),
                          boxShadow: _type == t ? [BoxShadow(
                              color: AppColors.primary.withOpacity(0.25),
                              blurRadius: 10, offset: const Offset(0, 4))] : [],
                        ),
                        child: Column(children: [
                          Icon(
                            t == 'virtual'
                                ? Icons.videocam_rounded
                                : Icons.local_hospital_rounded,
                            color: _type == t ? Colors.white : Colors.grey.shade400,
                            size: 28,
                          ),
                          const SizedBox(height: 6),
                          Text(t == 'virtual' ? 'Virtual' : 'In-Person',
                              style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: _type == t ? Colors.white : Colors.grey.shade500)),
                          const SizedBox(height: 2),
                          Text(
                            t == 'virtual' ? 'Video call' : 'Clinic visit',
                            style: TextStyle(fontFamily: 'Poppins', fontSize: 10,
                                color: _type == t
                                    ? Colors.white70 : Colors.grey.shade400),
                          ),
                        ]),
                      ),
                    ),
                  ),
                )).toList()),
                const SizedBox(height: 28),

                // ── Date picker ────────────────────────────────
                _SectionLabel(icon: Icons.date_range_rounded, label: 'Select Date'),
                const SizedBox(height: 4),
                Text('Swipe to see more dates →',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                        color: Colors.grey.shade400)),
                const SizedBox(height: 12),

                SizedBox(
                  height: 86,
                  child: ScrollConfiguration(
                    behavior: _AllScrollBehavior(),
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      primary: false,
                      clipBehavior: Clip.none,
                      itemCount: 30,
                      separatorBuilder: (_, __) => const SizedBox(width: 10),
                      itemBuilder: (_, i) {
                        final d = DateTime.now().add(Duration(days: i + 1));
                        final sel = DateFormat('yyyy-MM-dd').format(d) ==
                            DateFormat('yyyy-MM-dd').format(_selectedDate);
                        final isWeekend =
                            d.weekday == DateTime.saturday ||
                            d.weekday == DateTime.sunday;
                        return GestureDetector(
                          onTap: () {
                            setState(() => _selectedDate = d);
                            _loadSlots();
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            width: 60,
                            decoration: BoxDecoration(
                              color: sel ? AppColors.primary : Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                  color: sel
                                      ? AppColors.primary
                                      : isWeekend
                                          ? Colors.grey.shade200
                                          : Colors.grey.shade200),
                              boxShadow: sel ? [BoxShadow(
                                  color: AppColors.primary.withOpacity(0.3),
                                  blurRadius: 10, offset: const Offset(0, 4))] : [
                                BoxShadow(color: Colors.black.withOpacity(0.03),
                                    blurRadius: 4, offset: const Offset(0, 2))
                              ],
                            ),
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Text(DateFormat('EEE').format(d),
                                  style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: sel ? Colors.white70
                                          : isWeekend ? Colors.orange.shade300
                                          : Colors.grey.shade400)),
                              const SizedBox(height: 4),
                              Text('${d.day}',
                                  style: TextStyle(fontFamily: 'Poppins', fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                      color: sel ? Colors.white : AppColors.textPrimary)),
                              Text(DateFormat('MMM').format(d),
                                  style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                      color: sel ? Colors.white70 : Colors.grey.shade400)),
                            ]),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // ── Time slots ─────────────────────────────────
                _SectionLabel(icon: Icons.access_time_rounded, label: 'Available Time Slots'),
                const SizedBox(height: 12),
                if (_loadingSlots)
                  Container(
                    height: 80,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Center(child: CircularProgressIndicator()),
                  )
                else if (_slots.isEmpty)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade100),
                    ),
                    child: Column(children: [
                      Icon(Icons.event_busy_rounded, size: 36,
                          color: Colors.grey.shade300),
                      const SizedBox(height: 10),
                      Text('No slots available for this date',
                          style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                              color: Colors.grey.shade400)),
                      const SizedBox(height: 4),
                      Text('Try selecting a different date',
                          style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                              color: Colors.grey.shade400)),
                    ]),
                  )
                else
                  Wrap(
                    spacing: 10,
                    runSpacing: 10,
                    children: _slots.map((slot) {
                      final sel = _selectedSlot == slot;
                      return GestureDetector(
                        onTap: () => setState(() => _selectedSlot = slot),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 150),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                          decoration: BoxDecoration(
                            color: sel ? AppColors.primary : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: sel ? AppColors.primary : Colors.grey.shade200,
                                width: sel ? 2 : 1),
                            boxShadow: sel ? [BoxShadow(
                                color: AppColors.primary.withOpacity(0.25),
                                blurRadius: 8, offset: const Offset(0, 3))] : [],
                          ),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Icon(Icons.access_time_rounded, size: 13,
                                color: sel ? Colors.white70 : Colors.grey.shade400),
                            const SizedBox(width: 5),
                            Text(slot,
                                style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: sel ? Colors.white : AppColors.textPrimary)),
                          ]),
                        ),
                      );
                    }).toList(),
                  ),
                const SizedBox(height: 28),

                // ── Reason ─────────────────────────────────────
                _SectionLabel(icon: Icons.edit_note_rounded, label: 'Reason for Visit'),
                const SizedBox(height: 4),
                Text('Optional — helps the doctor prepare',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                        color: Colors.grey.shade400)),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03),
                        blurRadius: 8, offset: const Offset(0, 2))],
                  ),
                  child: TextFormField(
                    controller: _reasonCtrl,
                    maxLines: 3,
                    style: const TextStyle(fontFamily: 'Poppins', fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Describe your symptoms or reason for the visit…',
                      hintStyle: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                          color: Colors.grey.shade400),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                    ),
                  ),
                ),
                const SizedBox(height: 28),

                // ── Web notice ─────────────────────────────────
                if (kIsWeb) ...[
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.warning.withOpacity(0.3)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.info_outline_rounded,
                          color: AppColors.warning, size: 18),
                      const SizedBox(width: 10),
                      Expanded(child: Text(
                        'Payment is processed on the mobile app. '
                        'Booking will be confirmed without payment on web.',
                        style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                            color: Colors.orange.shade700),
                      )),
                    ]),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Summary card before booking ─────────────────
                if (_selectedSlot != null) ...[
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [AppColors.primary.withOpacity(0.05),
                            AppColors.primary.withOpacity(0.02)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.primary.withOpacity(0.15)),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Booking Summary',
                          style: TextStyle(fontFamily: 'Poppins', fontSize: 13,
                              fontWeight: FontWeight.w700, color: AppColors.primary)),
                      const SizedBox(height: 12),
                      _SummaryRow(icon: Icons.person_rounded, label: 'Doctor',
                          value: 'Dr. ${_doctor!.name}'),
                      _SummaryRow(icon: Icons.calendar_today_rounded, label: 'Date',
                          value: DateFormat('EEE, MMM d yyyy').format(_selectedDate)),
                      _SummaryRow(icon: Icons.access_time_rounded, label: 'Time',
                          value: _selectedSlot!),
                      _SummaryRow(
                          icon: _type == 'virtual'
                              ? Icons.videocam_rounded : Icons.local_hospital_rounded,
                          label: 'Type',
                          value: _type == 'virtual' ? 'Virtual (Video call)' : 'In-Person'),
                      _SummaryRow(icon: Icons.payments_rounded, label: 'Fee',
                          value: 'PKR ${profile.consultationFee?.toStringAsFixed(0) ?? '—'}',
                          isHighlighted: true),
                    ]),
                  ),
                  const SizedBox(height: 20),
                ],

                // ── Book button ────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _booking ? null : _book,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: AppColors.primary.withOpacity(0.5),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      elevation: 4,
                      shadowColor: AppColors.primary.withOpacity(0.4),
                      textStyle: const TextStyle(fontFamily: 'Poppins',
                          fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    child: _booking
                        ? const SizedBox(width: 22, height: 22,
                            child: CircularProgressIndicator(
                                strokeWidth: 2.5, color: Colors.white))
                        : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                            Icon(kIsWeb
                                ? Icons.check_circle_rounded
                                : Icons.payment_rounded, size: 20),
                            const SizedBox(width: 10),
                            Text(kIsWeb ? 'Confirm Booking' : 'Proceed to Payment'),
                          ]),
                  ),
                ),
                const SizedBox(height: 8),
                Center(
                  child: Text(
                    kIsWeb
                        ? 'Free cancellation up to 24 hours before'
                        : 'Secure payment via Stripe',
                    style: TextStyle(fontFamily: 'Poppins', fontSize: 11,
                        color: Colors.grey.shade400),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Scroll behavior that allows mouse drag on web ─────────────────────────

class _AllScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
    PointerDeviceKind.touch,
    PointerDeviceKind.mouse,
    PointerDeviceKind.trackpad,
  };
}

// ── Helper widgets ────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final IconData icon;
  final String label;
  const _SectionLabel({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Row(children: [
    Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, size: 16, color: AppColors.primary),
    ),
    const SizedBox(width: 10),
    Text(label, style: const TextStyle(fontFamily: 'Poppins', fontSize: 16,
        fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
  ]);
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool isHighlighted;
  const _SummaryRow({required this.icon, required this.label,
      required this.value, this.isHighlighted = false});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [
      Icon(icon, size: 15, color: AppColors.primary.withOpacity(0.6)),
      const SizedBox(width: 8),
      Text('$label: ', style: const TextStyle(fontFamily: 'Poppins', fontSize: 12,
          color: AppColors.textSecondary)),
      Expanded(
        child: Text(value,
            style: TextStyle(fontFamily: 'Poppins', fontSize: 12,
                fontWeight: isHighlighted ? FontWeight.w800 : FontWeight.w600,
                color: isHighlighted ? AppColors.primary : AppColors.textPrimary),
            textAlign: TextAlign.end),
      ),
    ]),
  );
}