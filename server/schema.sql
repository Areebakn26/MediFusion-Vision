-- MediFusionVision Database Schema
-- PostgreSQL Database Schema
-- This file can be used to create the database schema directly in PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'banned', 'pending_verification');
CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE appointment_type AS ENUM ('physical', 'virtual');
CREATE TYPE appointment_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_method AS ENUM ('card', 'wallet', 'bank_transfer');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');
CREATE TYPE note_type AS ENUM ('clinical', 'observation', 'recommendation', 'follow_up');
CREATE TYPE scan_source AS ENUM ('internal', 'external');
CREATE TYPE scan_type AS ENUM ('mri_brain', 'retinal', 'xray', 'ct_scan', 'ultrasound', 'other');
CREATE TYPE uploaded_by AS ENUM ('patient', 'admin');
CREATE TYPE validation_status AS ENUM ('pending', 'validated', 'rejected');
CREATE TYPE scan_status AS ENUM ('pending', 'analyzed', 'verified', 'flagged');
CREATE TYPE medical_history_type AS ENUM ('disease', 'surgery', 'chronic_condition');
CREATE TYPE medical_history_status AS ENUM ('active', 'cured', 'managed');
CREATE TYPE admin_review_status AS ENUM ('pending', 'validated', 'rejected');

-- ============================================
-- TABLES
-- ============================================

-- Users Table
CREATE TABLE "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'patient',
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    preferred_language VARCHAR(10) DEFAULT 'en',
    accessibility_settings JSONB DEFAULT '{}',
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    last_login TIMESTAMP,
    status user_status DEFAULT 'pending_verification',
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Patients Table
CREATE TABLE "Patients" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES "Users"(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender gender_type,
    blood_group VARCHAR(10),
    height FLOAT,
    weight FLOAT,
    address TEXT,
    emergency_contact_phone VARCHAR(50),
    allergies JSONB DEFAULT '[]',
    cnic VARCHAR(20) UNIQUE,
    emergency_contact JSONB,
    medical_history JSONB DEFAULT '[]',
    current_medications TEXT[] DEFAULT '{}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Doctors Table
CREATE TABLE "Doctors" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES "Users"(id) ON DELETE CASCADE,
    specialization VARCHAR(255),
    experience_years INTEGER,
    medical_college VARCHAR(255),
    passing_year INTEGER,
    pmdc_number VARCHAR(50) UNIQUE,
    qualifications JSONB DEFAULT '[]',
    bio TEXT,
    consultation_fee DECIMAL(10, 2),
    working_hours JSONB,
    unavailable_dates DATE[] DEFAULT '{}',
    availability_schedule JSONB,
    profile_image VARCHAR(500),
    is_verified BOOLEAN DEFAULT false,
    verification_status verification_status DEFAULT 'pending',
    verified_at TIMESTAMP,
    verified_by UUID,
    rating FLOAT DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- MedicalHistory Table
CREATE TABLE "MedicalHistories" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES "Patients"(id) ON DELETE CASCADE,
    type medical_history_type NOT NULL,
    condition VARCHAR(255) NOT NULL,
    diagnosis_date DATE,
    status medical_history_status DEFAULT 'active',
    notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE "Appointments" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES "Patients"(id),
    doctor_id UUID NOT NULL REFERENCES "Doctors"(id),
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    timezone VARCHAR(50) DEFAULT 'Asia/Karachi',
    type appointment_type DEFAULT 'physical',
    meeting_link VARCHAR(500),
    status appointment_status DEFAULT 'pending',
    reason TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    consultation_summary TEXT,
    transcript TEXT,
    doctor_notes TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions Table
CREATE TABLE "Prescriptions" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES "Appointments"(id) ON DELETE CASCADE,
    medications JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE "Payments" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES "Appointments"(id) ON DELETE CASCADE,
    payment_intent_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'pkr',
    payment_method payment_method NOT NULL,
    status payment_status DEFAULT 'pending',
    transaction_id VARCHAR(255),
    refund_id VARCHAR(255),
    refund_amount DECIMAL(10, 2),
    refund_reason TEXT,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ChatLogs Table
CREATE TABLE "ChatLogs" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES "Appointments"(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES "Users"(id),
    message TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ConsultationNotes Table
CREATE TABLE "ConsultationNotes" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES "Appointments"(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES "Users"(id),
    content TEXT NOT NULL,
    note_type note_type DEFAULT 'clinical',
    is_private BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Scans Table
CREATE TABLE "Scans" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES "Patients"(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES "Doctors"(id),
    scan_source scan_source NOT NULL,
    scan_type scan_type NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_by uploaded_by NOT NULL,
    body_part VARCHAR(100),
    taken_date DATE,
    facility_name VARCHAR(255),
    lab_technician VARCHAR(255),
    file_format VARCHAR(20),
    file_size BIGINT,
    image_dimensions JSONB,
    quality_score DECIMAL(3, 2),
    validation_status validation_status DEFAULT 'pending',
    validation_notes TEXT,
    is_authentic BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    ai_prediction JSONB,
    ai_heatmap_url VARCHAR(500),
    ai_explanation TEXT,
    processed_at TIMESTAMP,
    doctor_comments TEXT,
    report_medical TEXT,
    report_patient_friendly TEXT,
    status scan_status DEFAULT 'pending',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Reports Table
CREATE TABLE "Reports" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES "Scans"(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES "Doctors"(id),
    patient_id UUID NOT NULL REFERENCES "Patients"(id),
    diagnosis TEXT NOT NULL,
    ai_findings JSONB DEFAULT '{}',
    doctor_notes TEXT,
    final_report TEXT,
    report_medical TEXT,
    report_patient_friendly TEXT,
    finalized BOOLEAN DEFAULT false,
    finalized_at TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- AIFeedback Table
CREATE TABLE "AIFeedbacks" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    scan_id UUID NOT NULL REFERENCES "Scans"(id),
    doctor_id UUID NOT NULL REFERENCES "Doctors"(id),
    is_flagged BOOLEAN DEFAULT false,
    correction_details TEXT,
    admin_review_status admin_review_status DEFAULT 'pending',
    flag_count INTEGER DEFAULT 1,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

-- Unique indexes (already created via UNIQUE constraints)
-- Additional indexes for performance

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);
CREATE INDEX idx_users_status ON "Users"(status);
CREATE INDEX idx_patients_user_id ON "Patients"(user_id);
CREATE INDEX idx_patients_cnic ON "Patients"(cnic);
CREATE INDEX idx_doctors_user_id ON "Doctors"(user_id);
CREATE INDEX idx_doctors_pmdc_number ON "Doctors"(pmdc_number);
CREATE INDEX idx_doctors_verification_status ON "Doctors"(verification_status);
CREATE INDEX idx_medical_histories_patient_id ON "MedicalHistories"(patient_id);
CREATE INDEX idx_appointments_patient_id ON "Appointments"(patient_id);
CREATE INDEX idx_appointments_doctor_id ON "Appointments"(doctor_id);
CREATE INDEX idx_appointments_date ON "Appointments"(date);
CREATE INDEX idx_appointments_status ON "Appointments"(status);
CREATE INDEX idx_appointments_doctor_date ON "Appointments"(doctor_id, date);
CREATE UNIQUE INDEX unique_doctor_appointment_slot ON "Appointments"(doctor_id, date, time_slot) 
    WHERE status != 'cancelled';
CREATE INDEX idx_prescriptions_appointment_id ON "Prescriptions"(appointment_id);
CREATE INDEX idx_payments_appointment_id ON "Payments"(appointment_id);
CREATE INDEX idx_payments_status ON "Payments"(status);
CREATE INDEX idx_payments_payment_intent_id ON "Payments"(payment_intent_id);
CREATE INDEX idx_chat_logs_appointment_id ON "ChatLogs"(appointment_id);
CREATE INDEX idx_chat_logs_sender_id ON "ChatLogs"(sender_id);
CREATE INDEX idx_consultation_notes_appointment_id ON "ConsultationNotes"(appointment_id);
CREATE INDEX idx_consultation_notes_author_id ON "ConsultationNotes"(author_id);
CREATE INDEX idx_scans_patient_id ON "Scans"(patient_id);
CREATE INDEX idx_scans_doctor_id ON "Scans"(doctor_id);
CREATE INDEX idx_scans_status ON "Scans"(status);
CREATE INDEX idx_scans_scan_type ON "Scans"(scan_type);
CREATE INDEX idx_reports_scan_id ON "Reports"(scan_id);
CREATE INDEX idx_reports_doctor_id ON "Reports"(doctor_id);
CREATE INDEX idx_reports_patient_id ON "Reports"(patient_id);
CREATE INDEX idx_ai_feedback_scan_id ON "AIFeedbacks"(scan_id);
CREATE INDEX idx_ai_feedback_doctor_id ON "AIFeedbacks"(doctor_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updatedAt on all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON "Patients"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON "Doctors"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_histories_updated_at BEFORE UPDATE ON "MedicalHistories"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON "Appointments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON "Prescriptions"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON "Payments"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_logs_updated_at BEFORE UPDATE ON "ChatLogs"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultation_notes_updated_at BEFORE UPDATE ON "ConsultationNotes"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON "Scans"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON "Reports"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_feedbacks_updated_at BEFORE UPDATE ON "AIFeedbacks"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE "Users" IS 'Core user authentication and profile information';
COMMENT ON TABLE "Patients" IS 'Patient-specific medical information and demographics';
COMMENT ON TABLE "Doctors" IS 'Doctor-specific professional information and credentials';
COMMENT ON TABLE "MedicalHistories" IS 'Patient medical history records';
COMMENT ON TABLE "Appointments" IS 'Patient-doctor appointment scheduling';
COMMENT ON TABLE "Prescriptions" IS 'Medication prescriptions for appointments';
COMMENT ON TABLE "Payments" IS 'Payment transactions for appointments';
COMMENT ON TABLE "ChatLogs" IS 'Chat messages during virtual consultations';
COMMENT ON TABLE "ConsultationNotes" IS 'Clinical notes for appointments';
COMMENT ON TABLE "Scans" IS 'Medical scan images and analysis';
COMMENT ON TABLE "Reports" IS 'Medical reports generated from scans';
COMMENT ON TABLE "AIFeedbacks" IS 'Doctor feedback on AI predictions';

