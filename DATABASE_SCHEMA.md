# MediFusionVision Database Schema

## Overview
This document describes the complete database schema for the MediFusionVision application. The database uses PostgreSQL with Sequelize ORM.

## Database Configuration
- **Database System**: PostgreSQL
- **ORM**: Sequelize
- **Database Name**: `medifusionvision` (configurable via environment variables)

---

## Tables

### 1. Users
Core user authentication and profile information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique user identifier |
| `name` | STRING | NOT NULL | User's full name |
| `email` | STRING | NOT NULL, UNIQUE | User's email address |
| `password` | STRING | NOT NULL | Hashed password (bcrypt) |
| `role` | ENUM | DEFAULT 'patient' | User role: 'patient', 'doctor', 'admin' |
| `phone` | STRING | | Contact phone number |
| `is_active` | BOOLEAN | DEFAULT true | Account active status |
| `preferred_language` | STRING | DEFAULT 'en' | Language preference |
| `accessibility_settings` | JSONB | DEFAULT {} | UI accessibility settings |
| `login_attempts` | INTEGER | DEFAULT 0 | Failed login attempt counter |
| `locked_until` | DATE | | Account lock expiration timestamp |
| `last_login` | DATE | | Last successful login timestamp |
| `status` | ENUM | DEFAULT 'pending_verification' | Account status: 'active', 'inactive', 'banned', 'pending_verification' |
| `email_verified` | BOOLEAN | DEFAULT false | Email verification status |
| `email_verification_token` | STRING | | Email verification token |
| `password_reset_token` | STRING | | Password reset token |
| `password_reset_expires` | DATE | | Password reset token expiration |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Hooks:**
- `beforeCreate`: Hashes password using bcrypt
- `beforeUpdate`: Re-hashes password if changed

**Methods:**
- `matchPassword(enteredPassword)`: Compares entered password with stored hash

---

### 2. Patients
Patient-specific medical information and demographics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique patient identifier |
| `user_id` | UUID | FOREIGN KEY → Users.id, CASCADE DELETE | Reference to User account |
| `date_of_birth` | DATEONLY | | Patient's date of birth |
| `gender` | ENUM | | Gender: 'male', 'female', 'other' |
| `blood_group` | STRING | | Blood group (e.g., 'A+', 'O-') |
| `height` | FLOAT | | Height in centimeters |
| `weight` | FLOAT | | Weight in kilograms |
| `address` | TEXT | | Physical address |
| `emergency_contact_phone` | STRING | | Emergency contact phone number |
| `allergies` | JSONB | DEFAULT [] | Array of allergies |
| `cnic` | STRING | UNIQUE | National ID number (CNIC) |
| `emergency_contact` | JSONB | | Emergency contact details: {name, relation, phone} |
| `medical_history` | JSONB | DEFAULT [] | Summary of medical conditions and surgeries |
| `current_medications` | ARRAY(TEXT) | DEFAULT [] | List of current medications |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: User (1:1)
- Has many: MedicalHistory, Appointment, Scan, Report

---

### 3. Doctors
Doctor-specific professional information and credentials.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique doctor identifier |
| `user_id` | UUID | FOREIGN KEY → Users.id, CASCADE DELETE | Reference to User account |
| `specialization` | STRING | | Medical specialization |
| `experience_years` | INTEGER | | Years of experience |
| `medical_college` | STRING | | Medical college attended |
| `passing_year` | INTEGER | | Year of graduation |
| `pmdc_number` | STRING | UNIQUE | Pakistan Medical & Dental Council registration number |
| `qualifications` | JSONB | DEFAULT [] | Array of qualifications: {degree, institute, year} |
| `bio` | TEXT | | Professional biography |
| `consultation_fee` | DECIMAL(10,2) | | Consultation fee in PKR |
| `working_hours` | JSONB | | Detailed schedule: {"Monday": {start: "09:00", end: "17:00"}} |
| `unavailable_dates` | ARRAY(DATEONLY) | DEFAULT [] | Days when doctor is unavailable |
| `availability_schedule` | JSONB | | Legacy availability schedule |
| `profile_image` | STRING | | URL to profile image |
| `is_verified` | BOOLEAN | DEFAULT false | Verification status |
| `verification_status` | ENUM | DEFAULT 'pending' | Verification status: 'pending', 'approved', 'rejected' |
| `verified_at` | DATE | | Verification timestamp |
| `verified_by` | UUID | | Admin ID who verified the doctor |
| `rating` | FLOAT | DEFAULT 0 | Average rating (0-5) |
| `review_count` | INTEGER | DEFAULT 0 | Total number of reviews |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: User (1:1)
- Has many: Appointment, Scan, Report, AIFeedback

---

### 4. MedicalHistory
Patient medical history records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique record identifier |
| `patient_id` | UUID | FOREIGN KEY → Patients.id, CASCADE DELETE | Reference to Patient |
| `type` | ENUM | NOT NULL | Record type: 'disease', 'surgery', 'chronic_condition' |
| `condition` | STRING | NOT NULL | Condition name |
| `diagnosis_date` | DATEONLY | | Date of diagnosis |
| `status` | ENUM | DEFAULT 'active' | Status: 'active', 'cured', 'managed' |
| `notes` | TEXT | | Additional notes |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Patient (Many:1)

---

### 5. Appointments
Patient-doctor appointment scheduling.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique appointment identifier |
| `patient_id` | UUID | FOREIGN KEY → Patients.id | Reference to Patient |
| `doctor_id` | UUID | FOREIGN KEY → Doctors.id | Reference to Doctor |
| `date` | DATEONLY | NOT NULL | Appointment date |
| `time_slot` | STRING | NOT NULL | Time slot identifier (legacy) |
| `start_time` | DATE | | Full appointment start timestamp |
| `end_time` | DATE | | Full appointment end timestamp |
| `timezone` | STRING | DEFAULT 'Asia/Karachi' | Timezone for appointment |
| `type` | ENUM | DEFAULT 'physical' | Appointment type: 'physical', 'virtual' |
| `meeting_link` | STRING | | Virtual meeting link (for virtual appointments) |
| `status` | ENUM | DEFAULT 'pending' | Status: 'pending', 'confirmed', 'completed', 'cancelled', 'no_show' |
| `reason` | TEXT | | Appointment reason/chief complaint |
| `symptoms` | TEXT | | Patient symptoms |
| `diagnosis` | TEXT | | Doctor's diagnosis |
| `consultation_summary` | TEXT | | AI-generated consultation summary |
| `transcript` | TEXT | | Full conversation transcript |
| `doctor_notes` | TEXT | | Manual doctor notes/edits |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Indexes:**
- Unique index on (`doctor_id`, `date`, `time_slot`) where status != 'cancelled'

**Relationships:**
- Belongs to: Patient (Many:1), Doctor (Many:1)
- Has one: Prescription, Payment
- Has many: ChatLog, ConsultationNote

---

### 6. Prescriptions
Medication prescriptions for appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique prescription identifier |
| `appointment_id` | UUID | FOREIGN KEY → Appointments.id, CASCADE DELETE | Reference to Appointment |
| `medications` | JSONB | NOT NULL, DEFAULT [] | Array of medications: {name, dosage, frequency, duration, instructions} |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Appointment (1:1)

---

### 7. Payments
Payment transactions for appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique payment identifier |
| `appointment_id` | UUID | FOREIGN KEY → Appointments.id, CASCADE DELETE | Reference to Appointment |
| `payment_intent_id` | STRING | UNIQUE | Stripe payment intent ID |
| `stripe_customer_id` | STRING | | Stripe customer ID |
| `amount` | DECIMAL(10,2) | NOT NULL | Payment amount |
| `currency` | STRING | DEFAULT 'pkr' | Currency code |
| `payment_method` | ENUM | NOT NULL | Payment method: 'card', 'wallet', 'bank_transfer' |
| `status` | ENUM | DEFAULT 'pending' | Payment status: 'pending', 'processing', 'succeeded', 'failed', 'refunded' |
| `transaction_id` | STRING | | Transaction ID |
| `refund_id` | STRING | | Refund transaction ID |
| `refund_amount` | DECIMAL(10,2) | | Refunded amount |
| `refund_reason` | TEXT | | Reason for refund |
| `metadata` | JSONB | DEFAULT {} | Additional payment metadata |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Appointment (1:1)

---

### 8. ChatLogs
Chat messages during virtual consultations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique message identifier |
| `appointment_id` | UUID | FOREIGN KEY → Appointments.id, CASCADE DELETE | Reference to Appointment |
| `sender_id` | UUID | FOREIGN KEY → Users.id | Reference to User (sender) |
| `message` | TEXT | NOT NULL | Message content |
| `timestamp` | DATE | DEFAULT NOW | Message timestamp |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Appointment (Many:1)
- Belongs to: User (Many:1, as 'sender')

---

### 9. ConsultationNotes
Clinical notes for appointments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique note identifier |
| `appointment_id` | UUID | FOREIGN KEY → Appointments.id, CASCADE DELETE | Reference to Appointment |
| `author_id` | UUID | FOREIGN KEY → Users.id, NOT NULL | Reference to User (author) |
| `content` | TEXT | NOT NULL | Note content |
| `note_type` | ENUM | DEFAULT 'clinical' | Note type: 'clinical', 'observation', 'recommendation', 'follow_up' |
| `is_private` | BOOLEAN | DEFAULT false | If true, only visible to doctor |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Appointment (Many:1)
- Belongs to: User (Many:1, as 'author')

---

### 10. Scans
Medical scan images and analysis.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique scan identifier |
| `patient_id` | UUID | FOREIGN KEY → Patients.id, CASCADE DELETE | Reference to Patient |
| `doctor_id` | UUID | FOREIGN KEY → Doctors.id | Reference to Doctor (reviewer) |
| `scan_source` | ENUM | NOT NULL | Source: 'internal', 'external' |
| `scan_type` | ENUM | NOT NULL | Type: 'mri_brain', 'retinal', 'xray', 'ct_scan', 'ultrasound', 'other' |
| `file_url` | STRING | NOT NULL | URL to scan file |
| `uploaded_by` | ENUM | NOT NULL | Uploader: 'patient', 'admin' |
| `body_part` | STRING(100) | | Body part scanned |
| `taken_date` | DATEONLY | | Date scan was taken |
| `facility_name` | STRING(255) | | Facility where scan was taken |
| `lab_technician` | STRING(255) | | Lab technician name |
| `file_format` | STRING(20) | | File format: 'jpeg', 'png', 'dicom', 'tiff' |
| `file_size` | BIGINT | | File size in bytes |
| `image_dimensions` | JSONB | | Image dimensions: {width, height} |
| `quality_score` | DECIMAL(3,2) | | Quality score (0.00 to 1.00) |
| `validation_status` | ENUM | DEFAULT 'pending' | Validation status: 'pending', 'validated', 'rejected' |
| `validation_notes` | TEXT | | Validation notes |
| `is_authentic` | BOOLEAN | DEFAULT true | Authenticity verification |
| `metadata` | JSONB | DEFAULT {} | EXIF data, DICOM tags, etc. |
| `notes` | TEXT | | Additional notes |
| `ai_prediction` | JSONB | | AI model output and confidence scores |
| `ai_heatmap_url` | STRING | | URL to AI-generated heatmap |
| `ai_explanation` | TEXT | | AI explanation of findings |
| `processed_at` | DATE | | AI processing timestamp |
| `doctor_comments` | TEXT | | Doctor's review comments |
| `report_medical` | TEXT | | Technical medical report |
| `report_patient_friendly` | TEXT | | Patient-friendly report |
| `status` | ENUM | DEFAULT 'pending' | Scan status: 'pending', 'analyzed', 'verified', 'flagged' |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Patient (Many:1), Doctor (Many:1)
- Has many: AIFeedback, Report

---

### 11. Reports
Medical reports generated from scans.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique report identifier |
| `scan_id` | UUID | FOREIGN KEY → Scans.id, CASCADE DELETE | Reference to Scan |
| `doctor_id` | UUID | FOREIGN KEY → Doctors.id | Reference to Doctor (author) |
| `patient_id` | UUID | FOREIGN KEY → Patients.id | Reference to Patient |
| `diagnosis` | TEXT | NOT NULL | Primary diagnosis |
| `ai_findings` | JSONB | DEFAULT {} | AI model output |
| `doctor_notes` | TEXT | | Doctor's additional notes |
| `final_report` | TEXT | | Combined AI + Doctor report |
| `report_medical` | TEXT | | Technical medical report |
| `report_patient_friendly` | TEXT | | Patient-friendly report |
| `finalized` | BOOLEAN | DEFAULT false | Report finalization status |
| `finalized_at` | DATE | | Finalization timestamp |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Scan (Many:1), Doctor (Many:1), Patient (Many:1)

---

### 12. AIFeedback
Doctor feedback on AI predictions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT UUIDV4 | Unique feedback identifier |
| `scan_id` | UUID | FOREIGN KEY → Scans.id | Reference to Scan |
| `doctor_id` | UUID | FOREIGN KEY → Doctors.id | Reference to Doctor |
| `is_flagged` | BOOLEAN | DEFAULT false | Whether AI prediction was flagged |
| `correction_details` | TEXT | | Details of corrections made |
| `admin_review_status` | ENUM | DEFAULT 'pending' | Admin review status: 'pending', 'validated', 'rejected' |
| `flag_count` | INTEGER | DEFAULT 1 | Number of times flagged |
| `createdAt` | DATE | | Record creation timestamp |
| `updatedAt` | DATE | | Record update timestamp |

**Relationships:**
- Belongs to: Scan (Many:1), Doctor (Many:1)

---

## Entity Relationship Diagram (ERD)

```
Users (1) ──< (1) Patients
         └──< (1) Doctors

Patients (1) ──< (M) MedicalHistory
           └──< (M) Appointments
           └──< (M) Scans
           └──< (M) Reports

Doctors (1) ──< (M) Appointments
         └──< (M) Scans
         └──< (M) Reports
         └──< (M) AIFeedback

Appointments (1) ──< (1) Prescriptions
              └──< (1) Payments
              └──< (M) ChatLogs
              └──< (M) ConsultationNotes

Scans (1) ──< (M) Reports
      └──< (M) AIFeedback

Users (1) ──< (M) ChatLogs (as sender)
      └──< (M) ConsultationNotes (as author)
```

---

## Enums

### User.role
- `patient`
- `doctor`
- `admin`

### User.status
- `active`
- `inactive`
- `banned`
- `pending_verification`

### Patient.gender
- `male`
- `female`
- `other`

### Doctor.verification_status
- `pending`
- `approved`
- `rejected`

### Appointment.type
- `physical`
- `virtual`

### Appointment.status
- `pending`
- `confirmed`
- `completed`
- `cancelled`
- `no_show`

### Payment.payment_method
- `card`
- `wallet`
- `bank_transfer`

### Payment.status
- `pending`
- `processing`
- `succeeded`
- `failed`
- `refunded`

### ConsultationNote.note_type
- `clinical`
- `observation`
- `recommendation`
- `follow_up`

### Scan.scan_source
- `internal`
- `external`

### Scan.scan_type
- `mri_brain`
- `retinal`
- `xray`
- `ct_scan`
- `ultrasound`
- `other`

### Scan.uploaded_by
- `patient`
- `admin`

### Scan.validation_status
- `pending`
- `validated`
- `rejected`

### Scan.status
- `pending`
- `analyzed`
- `verified`
- `flagged`

### MedicalHistory.type
- `disease`
- `surgery`
- `chronic_condition`

### MedicalHistory.status
- `active`
- `cured`
- `managed`

### AIFeedback.admin_review_status
- `pending`
- `validated`
- `rejected`

---

## Indexes

1. **Users.email** - UNIQUE index
2. **Patients.cnic** - UNIQUE index
3. **Doctors.pmdc_number** - UNIQUE index
4. **Appointments** - UNIQUE composite index on (`doctor_id`, `date`, `time_slot`) where status != 'cancelled'
5. **Payments.payment_intent_id** - UNIQUE index

---

## Foreign Key Constraints

All foreign keys use CASCADE DELETE where appropriate:
- `Patients.user_id` → `Users.id` (CASCADE)
- `Doctors.user_id` → `Users.id` (CASCADE)
- `MedicalHistory.patient_id` → `Patients.id` (CASCADE)
- `Appointments.patient_id` → `Patients.id`
- `Appointments.doctor_id` → `Doctors.id`
- `Prescriptions.appointment_id` → `Appointments.id` (CASCADE)
- `Payments.appointment_id` → `Appointments.id` (CASCADE)
- `ChatLogs.appointment_id` → `Appointments.id` (CASCADE)
- `ChatLogs.sender_id` → `Users.id`
- `ConsultationNotes.appointment_id` → `Appointments.id` (CASCADE)
- `ConsultationNotes.author_id` → `Users.id`
- `Scans.patient_id` → `Patients.id` (CASCADE)
- `Scans.doctor_id` → `Doctors.id`
- `Reports.scan_id` → `Scans.id` (CASCADE)
- `Reports.doctor_id` → `Doctors.id`
- `Reports.patient_id` → `Patients.id`
- `AIFeedback.scan_id` → `Scans.id`
- `AIFeedback.doctor_id` → `Doctors.id`

---

## Data Types Reference

- **UUID**: Universally Unique Identifier (v4)
- **STRING**: Variable-length string
- **STRING(n)**: Fixed-length string with max length n
- **TEXT**: Unlimited length text
- **INTEGER**: 32-bit integer
- **BIGINT**: 64-bit integer
- **FLOAT**: Floating-point number
- **DECIMAL(p,s)**: Fixed-point decimal (precision, scale)
- **BOOLEAN**: True/false value
- **DATE**: Date and time
- **DATEONLY**: Date only (no time)
- **ENUM**: Enumeration of predefined values
- **JSONB**: Binary JSON (PostgreSQL-specific, indexed)
- **ARRAY(TYPE)**: Array of specified type

---

## Notes

1. All tables include `createdAt` and `updatedAt` timestamps (managed by Sequelize)
2. UUIDs are used for all primary keys for better distributed system support
3. JSONB fields allow flexible schema for complex nested data
4. Password hashing is handled automatically via Sequelize hooks
5. Soft deletes are not implemented; use status fields for soft deletion logic
6. Timezone handling is important for appointments (default: 'Asia/Karachi')
7. File URLs are stored as strings; actual file storage is handled separately
8. AI-related fields support integration with machine learning models

---

## Migration Notes

When creating or modifying this schema:
1. Always use migrations for production changes
2. Test foreign key constraints and cascades
3. Verify enum values match application logic
4. Ensure indexes are created for frequently queried fields
5. Consider adding indexes for JSONB fields if querying nested properties

---

*Last Updated: Generated from current model definitions*

