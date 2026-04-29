const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import Models
const User = require('./User');
const Patient = require('./PatientProfile');
const Doctor = require('./DoctorProfile');
const MedicalHistory = require('./MedicalHistory');
const Appointment = require('./Appointment');
const Prescription = require('./Prescription');
const Scan = require('./Scan');
const Payment = require('./Payment');
const PaymentTransaction = require('./PaymentTransaction');
const AIFeedback = require('./AIFeedback');
const ChatLog = require('./ChatLog');
const Report = require('./Report');
const ConsultationNote = require('./ConsultationNote');
const Notification = require('./Notification');

// Define Associations

// User -> Patient/Doctor (1:1)
User.hasOne(Patient, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

User.hasOne(Doctor, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// Patient -> MedicalHistory (1:M)
Patient.hasMany(MedicalHistory, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
MedicalHistory.belongsTo(Patient, { foreignKey: 'patient_id' });

// Patient/Doctor -> Appointments (1:M)
Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Appointment -> Prescription (1:1)
Appointment.hasOne(Prescription, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
Prescription.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Appointment -> Payment (1:1)
Appointment.hasOne(Payment, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
Payment.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Appointment -> PaymentTransaction (1:1)
Appointment.hasOne(PaymentTransaction, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
PaymentTransaction.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Appointment -> ChatLogs (1:M)
Appointment.hasMany(ChatLog, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
ChatLog.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// ChatLog -> User (sender)
User.hasMany(ChatLog, { foreignKey: 'sender_id', as: 'sentMessages' });
ChatLog.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Appointment -> ConsultationNotes (1:M)
Appointment.hasMany(ConsultationNote, { foreignKey: 'appointment_id', onDelete: 'CASCADE' });
ConsultationNote.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// ConsultationNote -> User (author)
User.hasMany(ConsultationNote, { foreignKey: 'author_id', as: 'authoredNotes' });
ConsultationNote.belongsTo(User, { foreignKey: 'author_id', as: 'author' });

// Scans
Patient.hasMany(Scan, { foreignKey: 'patient_id', onDelete: 'CASCADE' });
Scan.belongsTo(Patient, { foreignKey: 'patient_id' });

Doctor.hasMany(Scan, { foreignKey: 'doctor_id' });
Scan.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Scans -> AI Feedback (1:M)
Scan.hasMany(AIFeedback, { foreignKey: 'scan_id' });
AIFeedback.belongsTo(Scan, { foreignKey: 'scan_id' });

Doctor.hasMany(AIFeedback, { foreignKey: 'doctor_id' });
AIFeedback.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Reports
Scan.hasMany(Report, { foreignKey: 'scan_id', onDelete: 'CASCADE' });
Report.belongsTo(Scan, { foreignKey: 'scan_id' });

Doctor.hasMany(Report, { foreignKey: 'doctor_id' });
Report.belongsTo(Doctor, { foreignKey: 'doctor_id' });

Patient.hasMany(Report, { foreignKey: 'patient_id' });
Report.belongsTo(Patient, { foreignKey: 'patient_id' });

// Notifications
User.hasMany(Notification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
    sequelize,
    User,
    Patient,
    Doctor,
    MedicalHistory,
    Appointment,
    Prescription,
    Scan,
    Payment,
    PaymentTransaction,
    AIFeedback,
    ChatLog,
    Report,
    ConsultationNote,
    Notification,
};
