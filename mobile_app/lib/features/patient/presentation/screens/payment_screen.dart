import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/api_constants.dart';

class PaymentScreen extends StatefulWidget {
  final Map<String, dynamic> extra;
  const PaymentScreen({super.key, required this.extra});
  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _processing = false;

  Future<void> _pay() async {
    setState(() => _processing = true);
    try {
      // 1. Create PaymentIntent — slot availability checked here, NO appointment yet
      final intentRes = await ApiClient().dio.post(ApiConstants.createPaymentIntent, data: {
        'doctorId': widget.extra['doctorProfileId'],  // DoctorProfile UUID
        'date':     widget.extra['date'],
        'timeSlot': widget.extra['timeSlot'],
      });
      final clientSecret = intentRes.data['clientSecret'] as String;
      final amountPKR = (intentRes.data['amount'] as num).toDouble();

      // 2. Init Payment Sheet
      await Stripe.instance.initPaymentSheet(
        paymentSheetParameters: SetupPaymentSheetParameters(
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: 'MediFusion Vision',
          style: ThemeMode.light,
        ),
      );

      // 3. Present Payment Sheet — user pays here
      await Stripe.instance.presentPaymentSheet();

      // 4. Payment succeeded — NOW create the appointment
      final apptRes = await ApiClient().dio.post(ApiConstants.appointments, data: {
        'doctorId': widget.extra['doctorUserId'],   // User UUID
        'date':     widget.extra['date'],
        'timeSlot': widget.extra['timeSlot'],
        'type':     widget.extra['type'],
        'notes':    widget.extra['notes'],
      });
      final apptJson = (apptRes.data is Map && apptRes.data['appointment'] != null)
          ? apptRes.data['appointment'] as Map<String, dynamic>
          : apptRes.data as Map<String, dynamic>;
      final appointmentId = apptJson['id']?.toString() ?? '';

      // 5. Link payment to appointment on backend
      await ApiClient().dio.post(ApiConstants.confirmPayment, data: {
        'paymentIntentId': clientSecret.split('_secret_')[0],
        'appointmentId':   appointmentId,
        'method':          'card',
        'amountPKR':       amountPKR,
      });

      if (mounted) _showSuccess();
    } on StripeException catch (e) {
      if (mounted) {
        setState(() => _processing = false);
        if (e.error.code != FailureCode.Canceled) {
          ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(e.error.localizedMessage ?? 'Payment failed'), backgroundColor: AppColors.error));
        }
      }
    } catch (e) {
      debugPrint('❌ Payment error type: ${e.runtimeType}');
      debugPrint('❌ Payment error: $e');
      if (mounted) {
        setState(() => _processing = false);
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Payment failed. Please try again.'), backgroundColor: AppColors.error));
      }
    }
  }

  void _showSuccess() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            width: 80, height: 80,
            decoration: BoxDecoration(color: AppColors.successLight, borderRadius: BorderRadius.circular(40)),
            child: const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 48),
          ),
          const SizedBox(height: 20),
          Text('Booking Confirmed!', style: AppTextStyles.h4, textAlign: TextAlign.center),
          const SizedBox(height: 8),
          Text('Your appointment has been successfully booked.',
              style: AppTextStyles.bodyMedium.copyWith(color: AppColors.textSecondary), textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () { Navigator.of(context).pop(); context.go('/patient/appointments'); },
            child: const Text('View Appointments'),
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final fee = widget.extra['fee'] as num;
    final total = fee + 50; // PKR 50 platform fee added by server
    final doctorName = widget.extra['doctorName'] as String;
    final type = widget.extra['type'] as String;
    return Scaffold(
      appBar: AppBar(title: const Text('Payment')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          // Summary card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Consultation Fee', style: TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 14)),
                Text('PKR ${fee.toStringAsFixed(0)}', style: const TextStyle(fontFamily: 'Poppins', color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
              ]),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Platform Fee', style: TextStyle(fontFamily: 'Poppins', color: Colors.white70, fontSize: 14)),
                const Text('PKR 50', style: TextStyle(fontFamily: 'Poppins', color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
              ]),
              const SizedBox(height: 12),
              const Divider(color: Colors.white24),
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.person_outline, color: Colors.white70, size: 18),
                const SizedBox(width: 8),
                Text(doctorName, style: const TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 14)),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                Icon(type == 'virtual' ? Icons.videocam_outlined : Icons.local_hospital_outlined, color: Colors.white70, size: 18),
                const SizedBox(width: 8),
                Text(type == 'virtual' ? 'Virtual Consultation' : 'In-Person Visit',
                    style: const TextStyle(fontFamily: 'Poppins', color: Colors.white, fontSize: 14)),
              ]),
            ]),
          ),
          const SizedBox(height: 32),
          Text('Payment Method', style: AppTextStyles.h5),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.white, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.primary)),
            child: Row(children: [
              const Icon(Icons.credit_card, color: AppColors.primary),
              const SizedBox(width: 12),
              const Expanded(child: Text('Credit / Debit Card', style: AppTextStyles.labelLarge)),
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
            ]),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(14)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Total Amount', style: AppTextStyles.h5),
              Text('PKR ${total.toStringAsFixed(0)}', style: AppTextStyles.h4.copyWith(color: AppColors.primary)),
            ]),
          ),
          const SizedBox(height: 16),
          if (kIsWeb)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(color: const Color(0xFFFFF8E1), borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.warning.withOpacity(0.4))),
              child: Row(children: [
                const Icon(Icons.info_outline, color: AppColors.warning, size: 18),
                const SizedBox(width: 8),
                Expanded(child: Text('Card payment is only available on the mobile app (Android/iOS).',
                    style: AppTextStyles.bodySmall.copyWith(color: AppColors.warning))),
              ]),
            )
          else
            ElevatedButton(
              onPressed: _processing ? null : _pay,
              child: _processing
                  ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text('Pay PKR ${total.toStringAsFixed(0)}'),
            ),
          const SizedBox(height: 8),
          Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            const Icon(Icons.lock_outline, size: 14, color: AppColors.textHint),
            const SizedBox(width: 4),
            Text('Secured by Stripe', style: AppTextStyles.caption),
          ])),
          const SizedBox(height: 16),
        ]),
      ),
    );
  }
}