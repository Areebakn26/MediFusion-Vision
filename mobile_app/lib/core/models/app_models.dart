// Helper to safely parse any id (int or UUID string) to String
String _parseId(dynamic val, [String fallback = '']) =>
    val?.toString() ?? fallback;

int _parseInt(dynamic val, [int fallback = 0]) {
  if (val == null) return fallback;
  if (val is int) return val;
  return int.tryParse(val.toString()) ?? fallback;
}

double? _parseDouble(dynamic val) {
  if (val == null) return null;
  if (val is double) return val;
  return double.tryParse(val.toString());
}

// ─── User Model ───────────────────────────────────────────────────

class UserModel {
  final String id;
  final String name;
  final String email;
  final String role;
  final String? phone;
  final String? profilePicture;
  final String? language;
  final bool? isVerified;
  final PatientProfileModel? patientProfile;
  final DoctorProfileModel? doctorProfile;

  UserModel({
    required this.id, required this.name, required this.email,
    required this.role, this.phone, this.profilePicture,
    this.language, this.isVerified, this.patientProfile, this.doctorProfile,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: _parseId(json['id']),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'patient',
      phone: json['phone'],
      profilePicture: json['profile_picture'] ?? json['profilePicture'],
      language: json['preferred_language'] ?? json['language'],
      isVerified: json['email_verified'] ?? json['isVerified'],
      patientProfile: json['PatientProfile'] != null
          ? PatientProfileModel.fromJson(json['PatientProfile'])
          : json['profile'] != null && json['role'] == 'patient'
          ? PatientProfileModel.fromJson(json['profile'])
          : null,
      doctorProfile: json['DoctorProfile'] != null
          ? DoctorProfileModel.fromJson(json['DoctorProfile'])
          : json['profile'] != null && json['role'] == 'doctor'
          ? DoctorProfileModel.fromJson(json['profile'])
          : null,
    );
  }

  bool get isPatient => role == 'patient';
  bool get isDoctor  => role == 'doctor';
  bool get isAdmin   => role == 'admin';
}

// ─── Patient Profile ──────────────────────────────────────────────

class PatientProfileModel {
  final String? id;
  final String? dateOfBirth;
  final String? gender;
  final String? bloodGroup;
  final String? address;
  final String? emergencyContact;
  final String? medicalHistory;
  final String? cnic;
  final double? height;
  final double? weight;
  final List<String>? allergies;

  PatientProfileModel({
    this.id, this.dateOfBirth, this.gender, this.bloodGroup,
    this.address, this.emergencyContact, this.medicalHistory,
    this.cnic, this.height, this.weight, this.allergies,
  });

  factory PatientProfileModel.fromJson(Map<String, dynamic> json) {
    String? parseStringOrList(dynamic val) {
      if (val == null) return null;
      if (val is String) return val.isEmpty ? null : val;
      if (val is List) return val.isEmpty ? null : val.join(', ');
      return val.toString();
    }

    List<String>? parseList(dynamic val) {
      if (val == null) return null;
      if (val is List) return val.map((e) => e.toString()).toList();
      if (val is String) return val.isEmpty ? null : val.split(',').map((e) => e.trim()).toList();
      return null;
    }

    return PatientProfileModel(
      id: _parseId(json['id']),
      dateOfBirth: json['date_of_birth'] ?? json['dateOfBirth'],
      gender: json['gender'],
      bloodGroup: json['blood_group'] ?? json['bloodGroup'],
      address: json['address'],
      emergencyContact: json['emergency_contact_phone'] ?? json['emergency_contact'] ?? json['emergencyContact'],
      medicalHistory: parseStringOrList(json['medical_history'] ?? json['medicalHistory']),
      cnic: json['cnic'],
      height: _parseDouble(json['height']),
      weight: _parseDouble(json['weight']),
      allergies: parseList(json['allergies']),
    );
  }
}

// ─── Doctor Profile ───────────────────────────────────────────────

class DoctorProfileModel {
  final String? id;
  final String? specialization;
  final String? licenseNumber;
  final int? yearsOfExperience;
  final String? education;
  final String? bio;
  final double? consultationFee;
  final String? status;
  final double? rating;
  final int? totalReviews;
  final bool? availableForVirtual;
  final bool? availableForPhysical;
  final Map<String, dynamic>? workingHours;

  DoctorProfileModel({
    this.id, this.specialization, this.licenseNumber,
    this.yearsOfExperience, this.education, this.bio,
    this.consultationFee, this.status, this.rating,
    this.totalReviews, this.availableForVirtual, this.availableForPhysical,
    this.workingHours,
  });

  factory DoctorProfileModel.fromJson(Map<String, dynamic> json) {
    return DoctorProfileModel(
      id: _parseId(json['id']),
      specialization: json['specialization'],
      licenseNumber: json['pmdc_number'] ?? json['license_number'] ?? json['licenseNumber'],
      yearsOfExperience: _parseInt(json['experience_years'] ?? json['yearsOfExperience'], 0),
      education: json['medical_college'] ?? json['education'],
      bio: json['bio'],
      consultationFee: _parseDouble(json['consultation_fee'] ?? json['consultationFee']),
      status: json['verification_status'] ?? json['status'],
      rating: _parseDouble(json['rating']),
      totalReviews: _parseInt(json['review_count'] ?? json['totalReviews'], 0),
      availableForVirtual: json['available_for_virtual'] ?? json['availableForVirtual'],
      availableForPhysical: json['available_for_physical'] ?? json['availableForPhysical'],
      workingHours: (json['working_hours'] ?? json['workingHours']) is Map
          ? Map<String, dynamic>.from(json['working_hours'] ?? json['workingHours'])
          : null,
    );
  }
}

// ─── Doctor List Item (from GET /api/doctors) ─────────────────────
// Backend returns a flat array of DoctorProfile rows,
// each with a nested  User: { id, name, email, profile_picture }

class DoctorListItemModel {
  final String id;            // DoctorProfile UUID
  final String userId;        // User UUID  (use for routing)
  final String name;          // User.name
  final String email;         // User.email
  final String? profilePicture;
  final DoctorProfileModel profile;

  DoctorListItemModel({
    required this.id,
    required this.userId,
    required this.name,
    required this.email,
    this.profilePicture,
    required this.profile,
  });

  factory DoctorListItemModel.fromJson(Map<String, dynamic> json) {
    final user = (json['User'] ?? {}) as Map<String, dynamic>;
    return DoctorListItemModel(
      id: _parseId(json['id']),
      userId: _parseId(user['id']),
      name: user['name'] ?? '',
      email: user['email'] ?? '',
      profilePicture: user['profile_picture'] ?? user['profilePicture'],
      profile: DoctorProfileModel.fromJson(json),
    );
  }
}

// ─── Auth Response Model ──────────────────────────────────────────
// Backend login returns: { accessToken, refreshToken, id, name, email, role, ... }
// Backend register returns: { message, userId } — NO token

class AuthResponseModel {
  final String token;        // mapped from accessToken
  final String? refreshToken;
  final UserModel user;

  AuthResponseModel({required this.token, this.refreshToken, required this.user});

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    // Backend uses 'accessToken' key
    final token = json['accessToken'] ?? json['token'] ?? json['access_token'] ?? '';
    // User data is flat in login response (not nested under 'user')
    final user = UserModel.fromJson(json);
    return AuthResponseModel(token: token, refreshToken: json['refreshToken'], user: user);
  }
}

// ─── Appointment Model ────────────────────────────────────────────

class AppointmentModel {
  final String id;
  final String patientId;
  final String doctorId;
  final String dateTime;
  final String type;
  final String status;
  final String? reason;
  final String? meetingLink;
  final UserModel? patient;
  final UserModel? doctor;
  final PaymentModel? payment;

  AppointmentModel({
    required this.id, required this.patientId, required this.doctorId,
    required this.dateTime, required this.type, required this.status,
    this.reason, this.meetingLink, this.patient, this.doctor, this.payment,
  });

  factory AppointmentModel.fromJson(Map<String, dynamic> json) {
    return AppointmentModel(
      id: _parseId(json['id']),
      patientId: _parseId(json['patient_id'] ?? json['patientId']),
      doctorId: _parseId(json['doctor_id'] ?? json['doctorId']),
      dateTime: json['date_time'] ?? json['dateTime'] ?? json['appointment_date'] ?? '',
      type: json['type'] ?? 'physical',
      status: json['status'] ?? 'pending',
      reason: json['reason'],
      meetingLink: json['meeting_link'] ?? json['meetingLink'],
      patient: json['Patient'] != null ? UserModel.fromJson(json['Patient']) : null,
      doctor: (() {
        final rawD = json['doctor'] ?? json['Doctor'];
        if (rawD == null) return null;
        final d = Map<String, dynamic>.from(rawD as Map);
        final nestedUser = d['User'] is Map ? Map<String, dynamic>.from(d['User'] as Map) : <String, dynamic>{};
        final name  = d['name']?.toString()  ?? nestedUser['name']?.toString()  ?? '';
        final email = d['email']?.toString() ?? nestedUser['email']?.toString() ?? '';
        final userId = d['user_id']?.toString() ?? nestedUser['id']?.toString() ?? '';
        return UserModel.fromJson({'id': userId, 'name': name, 'email': email, 'role': 'doctor', 'profile': d});
      })(),
      payment: json['Payment'] != null ? PaymentModel.fromJson(json['Payment']) : null,
    );
  }

  bool get isUpcoming  => status == 'pending' || status == 'confirmed';
  bool get isVirtual   => type == 'virtual';
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
}

// ─── Scan Model ───────────────────────────────────────────────────

class ScanModel {
  final String id;
  final String patientId;
  final String scanType;
  final String filePath;
  final String uploadDate;
  final String status;
  final String? uploadedBy;
  final AIAnalysisModel? aiAnalysis;
  final ReportModel? report;

  ScanModel({
    required this.id, required this.patientId, required this.scanType,
    required this.filePath, required this.uploadDate, required this.status,
    this.uploadedBy, this.aiAnalysis, this.report,
  });

  factory ScanModel.fromJson(Map<String, dynamic> json) {
    return ScanModel(
      id: _parseId(json['id']),
      patientId: _parseId(json['patient_id'] ?? json['patientId']),
      scanType: json['scan_type'] ?? json['scanType'] ?? '',
      filePath: json['file_path'] ?? json['filePath'] ?? json['file_url'] ?? '',
      uploadDate: json['upload_date'] ?? json['uploadDate'] ?? json['createdAt'] ?? '',
      status: json['status'] ?? 'pending',
      uploadedBy: json['uploaded_by'] ?? json['uploadedBy'],
      aiAnalysis: json['AIAnalysis'] != null
          ? AIAnalysisModel.fromJson(json['AIAnalysis'])
          : json['aiAnalysis'] != null
          ? AIAnalysisModel.fromJson(json['aiAnalysis'])
          : null,
      report: json['Report'] != null ? ReportModel.fromJson(json['Report']) : null,
    );
  }
}

// ─── AI Analysis Model ────────────────────────────────────────────

class AIAnalysisModel {
  final String? id;
  final String? prediction;
  final double? confidence;
  final String? gradcamUrl;
  final String? findings;
  final String? analysisDate;
  final Map<String, dynamic>? rawResult;

  AIAnalysisModel({
    this.id, this.prediction, this.confidence, this.gradcamUrl,
    this.findings, this.analysisDate, this.rawResult,
  });

  factory AIAnalysisModel.fromJson(Map<String, dynamic> json) {
    return AIAnalysisModel(
      id: _parseId(json['id']),
      prediction: json['prediction'],
      confidence: _parseDouble(json['confidence']),
      gradcamUrl: json['gradcam_url'] ?? json['gradcamUrl'],
      findings: json['findings'],
      analysisDate: json['analysis_date'] ?? json['analysisDate'],
      rawResult: json['raw_result'] ?? json['rawResult'],
    );
  }
}

// ─── Report Model ─────────────────────────────────────────────────

class ReportModel {
  final String? id;
  final String? finalDiagnosis;
  final String? doctorNotes;
  final String? status;
  final String? generatedDate;
  final String? doctorId;

  ReportModel({
    this.id, this.finalDiagnosis, this.doctorNotes,
    this.status, this.generatedDate, this.doctorId,
  });

  factory ReportModel.fromJson(Map<String, dynamic> json) {
    return ReportModel(
      id: _parseId(json['id']),
      finalDiagnosis: json['final_diagnosis'] ?? json['finalDiagnosis'],
      doctorNotes: json['doctor_notes'] ?? json['doctorNotes'],
      status: json['status'],
      generatedDate: json['generated_date'] ?? json['generatedDate'],
      doctorId: _parseId(json['doctor_id'] ?? json['doctorId']),
    );
  }
}

// ─── Payment Model ────────────────────────────────────────────────

class PaymentModel {
  final String? id;
  final double? amount;
  final String? status;
  final String? paymentMethod;
  final String? transactionId;
  final String? createdAt;

  PaymentModel({
    this.id, this.amount, this.status,
    this.paymentMethod, this.transactionId, this.createdAt,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      id: _parseId(json['id']),
      amount: _parseDouble(json['amount']),
      status: json['status'],
      paymentMethod: json['payment_method'] ?? json['paymentMethod'],
      transactionId: json['transaction_id'] ?? json['transactionId'],
      createdAt: json['created_at'] ?? json['createdAt'],
    );
  }
}

// ─── Chat Message Model ───────────────────────────────────────────

class ChatMessageModel {
  final String? id;
  final String message;
  final String senderId;
  final String senderName;
  final String? createdAt;
  final bool isMe;

  ChatMessageModel({
    this.id, required this.message, required this.senderId,
    required this.senderName, this.createdAt, required this.isMe,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    final sid = json['sender_id']?.toString() ?? json['author']?.toString() ?? '';
    return ChatMessageModel(
      id: _parseId(json['id']),
      message: json['message'] ?? '',
      senderId: sid,
      senderName: json['sender_name'] ?? json['senderName'] ?? '',
      createdAt: json['created_at'] ?? json['createdAt'],
      isMe: sid == currentUserId,
    );
  }
}

// ─── Available Slot Model ─────────────────────────────────────────

class TimeSlotModel {
  final String time;
  final bool isAvailable;

  TimeSlotModel({required this.time, required this.isAvailable});

  factory TimeSlotModel.fromJson(Map<String, dynamic> json) {
    return TimeSlotModel(
      time: json['time'] ?? '',
      isAvailable: json['isAvailable'] ?? json['available'] ?? true,
    );
  }
}