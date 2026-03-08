# MediFusionVision - Complete Project Explanation for Viva

## 📚 Table of Contents
1. [Project Overview](#1-project-overview)
2. [System Architecture](#2-system-architecture)
3. [Database Schema & Queries](#3-database-schema--queries)
4. [Appointment Conflict Handling](#4-appointment-conflict-handling-detailed)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [API Endpoints & Controllers](#6-api-endpoints--controllers)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Key Features Explained](#8-key-features-explained)
9. [Security Features](#9-security-features)
10. [Common Viva Questions & Answers](#10-common-viva-questions--answers)

---

## 1. Project Overview

### What is MediFusionVision?
**MediFusionVision** is a comprehensive healthcare management system that combines:
- **Telemedicine Platform**: Virtual and physical appointment booking
- **AI-Powered Medical Scan Analysis**: Automated analysis of medical scans (MRI, X-Ray, CT, Retinal scans)
- **Patient-Doctor Management**: Complete patient records, prescriptions, and consultation management
- **Payment Integration**: Stripe payment gateway for appointment fees
- **Real-time Consultation**: Socket.io based chat during virtual consultations

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Frontend**: React.js with Vite
- **Real-time**: Socket.io
- **Payment**: Stripe
- **File Upload**: Multer
- **Authentication**: JWT (JSON Web Tokens)

---

## 2. System Architecture

### Architecture Pattern
The project follows a **3-tier architecture**:

```
┌─────────────────┐
│   Frontend      │  React.js (Client)
│   (React)       │
└────────┬────────┘
         │ HTTP/REST API
         │ Socket.io (WebSocket)
┌────────▼────────┐
│   Backend       │  Express.js (Server)
│   (Node.js)     │
└────────┬────────┘
         │ SQL Queries
┌────────▼────────┐
│   Database      │  PostgreSQL
│   (PostgreSQL)  │
└─────────────────┘
```

### Project Structure
```
MediFusionVision/
├── server/                    # Backend code
│   ├── config/               # Database configuration
│   ├── controllers/          # Business logic (appointmentController, authController, etc.)
│   ├── models/               # Database models (User, Appointment, Scan, etc.)
│   ├── routes/               # API route definitions
│   ├── middleware/           # Authentication & authorization middleware
│   ├── utils/                # Utility functions (email, validation)
│   ├── jobs/                 # Cron jobs (appointment reminders)
│   └── index.js              # Server entry point
├── client/                   # Frontend code
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components (patient, doctor, admin)
│   │   ├── context/        # React Context (Auth, Language)
│   │   ├── services/       # API service functions
│   │   └── App.jsx         # Main app component with routing
│   └── package.json
└── schema.sql                # Database schema definition
```

---

## 3. Database Schema & Queries

### Core Tables

#### 1. **Users Table** (Core Authentication)
```sql
CREATE TABLE "Users" (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,  -- Hashed with bcrypt
    role ENUM('patient', 'doctor', 'admin'),
    status ENUM('active', 'inactive', 'banned', 'pending_verification'),
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    email_verified BOOLEAN DEFAULT false
);
```

**Purpose**: Stores all user accounts (patients, doctors, admins). Single table for all roles.

**Key Queries**:
```javascript
// Find user by email (Login)
const user = await User.findOne({ where: { email } });

// Find user with profile (Get Me)
const user = await User.findByPk(userId, {
    include: [{ model: Patient }] // or Doctor
});
```

#### 2. **Patients Table** (Patient-Specific Data)
```sql
CREATE TABLE "Patients" (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    date_of_birth DATE,
    gender ENUM('male', 'female', 'other'),
    blood_group VARCHAR(10),
    cnic VARCHAR(20) UNIQUE,
    allergies JSONB DEFAULT '[]',
    medical_history JSONB DEFAULT '[]'
);
```

**Purpose**: Stores patient-specific medical information. Linked to Users via `user_id`.

**Key Queries**:
```javascript
// Get patient profile by user_id
const patient = await Patient.findOne({ 
    where: { user_id: req.user.id } 
});

// Get patient with user info
const patient = await Patient.findOne({
    where: { user_id },
    include: [{ model: User, attributes: ['name', 'email'] }]
});
```

#### 3. **Doctors Table** (Doctor-Specific Data)
```sql
CREATE TABLE "Doctors" (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES Users(id),
    pmdc_number VARCHAR(50) UNIQUE,  -- Pakistan Medical & Dental Council
    specialization VARCHAR(255),
    consultation_fee DECIMAL(10, 2),
    verification_status ENUM('pending', 'approved', 'rejected'),
    working_hours JSONB,  -- {"Monday": {"start": "9:00 AM", "end": "5:00 PM"}}
    unavailable_dates DATE[]
);
```

**Purpose**: Stores doctor credentials, fees, and availability. PMDC number is used for verification.

**Key Queries**:
```javascript
// Get verified doctors only
const doctors = await Doctor.findAll({
    where: { verification_status: 'approved' },
    include: [{ model: User }]
});

// Get doctor by user_id
const doctor = await Doctor.findOne({ 
    where: { user_id: req.user.id } 
});
```

#### 4. **Appointments Table** (Core Booking System)
```sql
CREATE TABLE "Appointments" (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES Patients(id),
    doctor_id UUID REFERENCES Doctors(id),
    date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,  -- "10:00 AM"
    type ENUM('physical', 'virtual'),
    status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no_show'),
    meeting_link VARCHAR(500),  -- For virtual consultations
    reason TEXT,
    diagnosis TEXT,
    doctor_notes TEXT
);
```

**Purpose**: Central table for all appointments. Links patients to doctors.

**Key Queries**:
```javascript
// Get appointments for a doctor
const appointments = await Appointment.findAll({
    where: { doctor_id: doctorProfile.id },
    include: [{ model: Patient, include: [User] }],
    order: [['date', 'ASC'], ['time_slot', 'ASC']]
});

// Get appointments for a patient
const appointments = await Appointment.findAll({
    where: { patient_id: patientProfile.id },
    include: [{ model: Doctor, include: [User] }]
});
```

**Unique Constraint** (Prevents Double Booking):
```sql
CREATE UNIQUE INDEX unique_doctor_appointment_slot 
ON "Appointments"(doctor_id, date, time_slot) 
WHERE status != 'cancelled';
```

This ensures **one appointment per doctor per time slot** (excluding cancelled ones).

#### 5. **Scans Table** (Medical Scan Management)
```sql
CREATE TABLE "Scans" (
    id UUID PRIMARY KEY,
    patient_id UUID REFERENCES Patients(id),
    doctor_id UUID REFERENCES Doctors(id),
    scan_type ENUM('mri_brain', 'retinal', 'xray', 'ct_scan', 'ultrasound', 'other'),
    file_url VARCHAR(500),  -- Path to uploaded file
    scan_source ENUM('internal', 'external'),
    uploaded_by ENUM('patient', 'admin'),
    ai_prediction JSONB,  -- AI analysis results
    status ENUM('pending', 'analyzed', 'verified', 'flagged')
);
```

**Purpose**: Stores medical scan images and AI analysis results.

**Key Queries**:
```javascript
// Get all scans for a patient
const scans = await Scan.findAll({
    where: { patient_id: patientProfile.id },
    include: [{ model: Report }],
    order: [['createdAt', 'DESC']]
});

// Get scan with patient info (for doctors)
const scan = await Scan.findByPk(scanId, {
    include: [
        { model: Patient, include: [User] },
        { model: Report }
    ]
});
```

#### 6. **Payments Table** (Payment Transactions)
```sql
CREATE TABLE "Payments" (
    id UUID PRIMARY KEY,
    appointment_id UUID REFERENCES Appointments(id),
    amount DECIMAL(10, 2),
    payment_method ENUM('card', 'wallet', 'bank_transfer'),
    status ENUM('pending', 'processing', 'succeeded', 'failed', 'refunded'),
    payment_intent_id VARCHAR(255),  -- Stripe payment intent ID
    refund_amount DECIMAL(10, 2),
    refund_reason TEXT
);
```

**Purpose**: Tracks all payment transactions linked to appointments.

**Key Queries**:
```javascript
// Get payment for an appointment
const payment = await Payment.findOne({
    where: { appointment_id }
});

// Get payment history for patient
const payments = await Payment.findAll({
    include: [{
        model: Appointment,
        where: { patient_id: patientProfile.id },
        include: [{ model: Doctor, include: [User] }]
    }],
    order: [['createdAt', 'DESC']]
});
```

### Database Relationships (Associations)

Using Sequelize ORM, relationships are defined in `server/models/index.js`:

```javascript
// User -> Patient (1:1)
User.hasOne(Patient, { foreignKey: 'user_id' });
Patient.belongsTo(User, { foreignKey: 'user_id' });

// User -> Doctor (1:1)
User.hasOne(Doctor, { foreignKey: 'user_id' });
Doctor.belongsTo(User, { foreignKey: 'user_id' });

// Patient -> Appointments (1:M)
Patient.hasMany(Appointment, { foreignKey: 'patient_id' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id' });

// Doctor -> Appointments (1:M)
Doctor.hasMany(Appointment, { foreignKey: 'doctor_id' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id' });

// Appointment -> Payment (1:1)
Appointment.hasOne(Payment, { foreignKey: 'appointment_id' });
Payment.belongsTo(Appointment, { foreignKey: 'appointment_id' });

// Patient -> Scans (1:M)
Patient.hasMany(Scan, { foreignKey: 'patient_id' });
Scan.belongsTo(Patient, { foreignKey: 'patient_id' });
```

---

## 4. Appointment Conflict Handling (DETAILED)

This is a **critical feature** that prevents double-booking. Let me explain how it works:

### 4.1 Conflict Detection Logic

Located in: `server/controllers/appointmentController.js`

#### Step-by-Step Conflict Check (in `bookAppointment` function):

**Step 1: Date Validation**
```javascript
const appointmentDate = new Date(date);
const today = new Date();
today.setHours(0, 0, 0, 0);

if (appointmentDate < today) {
    return res.status(400).json({ 
        message: 'Cannot book appointments for past dates.' 
    });
}
```
**Purpose**: Prevents booking appointments in the past.

**Step 2: Time Validation (for today's appointments)**
```javascript
if (appointmentDate.toDateString() === now.toDateString()) {
    const slotMinutes = parseTime(timeSlot);  // Convert "10:00 AM" to minutes
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // 30-minute buffer - can't book if appointment starts in less than 30 mins
    if (slotMinutes <= currentMinutes + 30) {
        return res.status(400).json({ 
            message: 'This time slot has already passed or is too soon.' 
        });
    }
}
```
**Purpose**: Prevents booking appointments that are too soon (less than 30 minutes away).

**Step 3: Doctor Slot Conflict Check** ⭐ **MAIN CONFLICT CHECK**
```javascript
const existingAppointment = await Appointment.findOne({
    where: {
        doctor_id: doctorProfile.id,
        date: date,
        time_slot: timeSlot,
        status: { [Op.ne]: 'cancelled' }  // Exclude cancelled appointments
    }
});

if (existingAppointment) {
    return res.status(400).json({ 
        message: 'This time slot is already booked. Please select another time.' 
    });
}
```
**Purpose**: **Prevents double-booking** - ensures one doctor can't have two appointments at the same time.

**SQL Query Generated**:
```sql
SELECT * FROM "Appointments" 
WHERE doctor_id = 'doctor-uuid' 
  AND date = '2024-01-15' 
  AND time_slot = '10:00 AM' 
  AND status != 'cancelled';
```

**Step 4: Patient Conflict Check**
```javascript
const patientConflict = await Appointment.findOne({
    where: {
        patient_id: patientProfile.id,
        date: date,
        time_slot: timeSlot,
        status: { [Op.ne]: 'cancelled' }
    }
});

if (patientConflict) {
    return res.status(400).json({ 
        message: 'You already have an appointment at this time.' 
    });
}
```
**Purpose**: Prevents a patient from booking two appointments at the same time (with different doctors).

**Step 5: Doctor Unavailable Dates Check**
```javascript
if (doctorProfile.unavailable_dates && 
    doctorProfile.unavailable_dates.includes(date)) {
    return res.status(400).json({ 
        message: 'Doctor is not available on this date.' 
    });
}
```
**Purpose**: Checks if doctor has marked this date as unavailable.

**Step 6: Working Hours Validation**
```javascript
if (doctorProfile.working_hours) {
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = doctorProfile.working_hours[dayName];  // e.g., "Monday"
    
    if (!daySchedule || !daySchedule.start) {
        return res.status(400).json({ 
            message: `Doctor is not available on ${dayName}s.` 
        });
    }
    
    const slotTime = parseTime(timeSlot);  // Convert to minutes
    const startTime = parseTime(daySchedule.start);  // e.g., "9:00 AM" -> 540 minutes
    const endTime = parseTime(daySchedule.end);      // e.g., "5:00 PM" -> 1020 minutes
    
    if (slotTime < startTime || slotTime >= endTime) {
        return res.status(400).json({ 
            message: `Selected time is outside doctor's working hours.` 
        });
    }
}
```
**Purpose**: Ensures appointment time is within doctor's working hours.

### 4.2 Database-Level Protection

**Unique Index** (in `schema.sql`):
```sql
CREATE UNIQUE INDEX unique_doctor_appointment_slot 
ON "Appointments"(doctor_id, date, time_slot) 
WHERE status != 'cancelled';
```

**How it works**:
- Database **enforces uniqueness** at the database level
- Even if application logic fails, database will reject duplicate entries
- Only applies to non-cancelled appointments (using `WHERE` clause)

**Example**:
```sql
-- First appointment - SUCCESS
INSERT INTO "Appointments" (doctor_id, date, time_slot, ...) 
VALUES ('doc-123', '2024-01-15', '10:00 AM', ...);

-- Second appointment at same slot - FAILS (Database Error)
INSERT INTO "Appointments" (doctor_id, date, time_slot, ...) 
VALUES ('doc-123', '2024-01-15', '10:00 AM', ...);
-- ERROR: duplicate key value violates unique constraint
```

### 4.3 Reschedule Conflict Handling

In `rescheduleAppointment` function, similar checks are performed, but **excludes the current appointment**:

```javascript
const conflictingAppointment = await Appointment.findOne({
    where: {
        doctor_id: appointment.doctor_id,
        date: newDate,
        time_slot: newTimeSlot,
        status: { [Op.ne]: 'cancelled' },
        id: { [Op.ne]: id }  // ⭐ Exclude current appointment
    }
});
```

**Purpose**: When rescheduling, we need to check conflicts but ignore the appointment being rescheduled.

### 4.4 Availability Check Endpoint

**Route**: `GET /api/appointments/check-availability`

**Purpose**: Allows frontend to check if a slot is available **before** attempting to book.

**Query Parameters**:
- `doctorId`: Doctor's ID
- `date`: Appointment date
- `timeSlot`: Time slot (e.g., "10:00 AM")

**Response**:
```json
{
    "available": true,
    "message": "Slot is available!"
}
```
or
```json
{
    "available": false,
    "message": "This slot is already booked."
}
```

**Use Case**: Frontend can call this endpoint when user selects a time slot to show real-time availability.

---

## 5. Authentication & Authorization

### 5.1 Authentication Flow

#### Registration Process:
1. User fills registration form (name, email, password, role)
2. Backend creates User record with:
   - Hashed password (bcrypt)
   - Email verification token
   - Status: `pending_verification`
3. Creates role-specific profile (Patient or Doctor)
4. Sends verification email (mock in current implementation)

**Code** (`authController.js`):
```javascript
const registerUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    
    // Check if user exists
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    // Create user
    const user = await User.create({
        name, email, password, role,
        email_verification_token: verificationToken,
        status: 'pending_verification'
    });
    
    // Create profile based on role
    if (role === 'doctor') {
        await Doctor.create({ user_id: user.id, verification_status: 'pending' });
    } else if (role === 'patient') {
        await Patient.create({ user_id: user.id });
    }
    
    res.status(201).json({ message: 'Registration successful' });
};
```

#### Login Process:
1. User provides email and password
2. Backend finds user by email
3. Checks account lockout (if `locked_until` > now)
4. Compares password using `bcrypt.compare()`
5. On success:
   - Resets `login_attempts` to 0
   - Updates `last_login`
   - Generates JWT tokens (access + refresh)
6. On failure:
   - Increments `login_attempts`
   - If >= 5 attempts, locks account for 15 minutes

**Code**:
```javascript
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    // Check lockout
    if (user.locked_until && user.locked_until > new Date()) {
        return res.status(403).json({ 
            message: 'Account locked. Try again later.' 
        });
    }
    
    // Check password
    if (await user.matchPassword(password)) {
        // Success
        user.login_attempts = 0;
        user.locked_until = null;
        user.last_login = new Date();
        await user.save();
        
        res.json({
            accessToken: generateAccessToken(user),  // 15 min expiry
            refreshToken: generateRefreshToken(user) // 7 days expiry
        });
    } else {
        // Failure
        user.login_attempts += 1;
        if (user.login_attempts >= 5) {
            user.locked_until = new Date(Date.now() + 15 * 60 * 1000);
        }
        await user.save();
        res.status(401).json({ message: 'Invalid credentials' });
    }
};
```

### 5.2 JWT Token System

**Access Token** (Short-lived):
- Expiry: 15 minutes
- Contains: `userId`, `role`, `permissions`
- Used for: API requests

**Refresh Token** (Long-lived):
- Expiry: 7 days
- Contains: `userId` only
- Used for: Getting new access tokens

**Token Generation**:
```javascript
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            permissions: []
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};
```

### 5.3 Authorization Middleware

Located in: `server/middleware/authMiddleware.js`

#### `protect` Middleware:
- Verifies JWT token from `Authorization: Bearer <token>` header
- Attaches user to `req.user`
- Checks if user is banned
- Attaches permissions based on role

**Code**:
```javascript
const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];  // Extract token
    
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findByPk(decoded.userId);
        
        if (req.user.status === 'banned') {
            return res.status(403).json({ message: 'Account is banned' });
        }
        
        req.user.permissions = PERMISSIONS[req.user.role] || [];
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
```

#### `requireRole` Middleware:
- Checks if user's role is in allowed roles array

**Code**:
```javascript
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `User role ${req.user.role} is not authorized` 
            });
        }
        next();
    };
};
```

**Usage**:
```javascript
router.post('/appointments', 
    protect,                    // Must be logged in
    requireRole(['patient']),    // Must be patient
    bookAppointment
);
```

### 5.4 Permission Matrix

Defined in `authMiddleware.js`:
```javascript
const PERMISSIONS = {
    patient: [
        'read:own_scans',
        'write:own_scans',
        'read:own_appointments',
        'write:own_appointments',
        'read:own_profile',
        'write:own_profile'
    ],
    doctor: [
        'read:all_scans',
        'write:reports',
        'read:assigned_appointments',
        'write:prescriptions',
        'read:patients',
        'write:own_profile'
    ],
    admin: [
        'user_management',
        'doctor_verification',
        'read:all_scans',
        'write:internal_scans',
        'read:all_appointments',
        'read:analytics'
    ]
};
```

---

## 6. API Endpoints & Controllers

### 6.1 Authentication Routes (`/api/auth`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| POST | `/api/auth/verify-email` | Public | Verify email with token |
| POST | `/api/auth/refresh-token` | Public | Get new access token |
| POST | `/api/auth/forgot-password` | Public | Request password reset |
| POST | `/api/auth/reset-password` | Public | Reset password with token |
| GET | `/api/auth/me` | Private | Get current user data |
| PUT | `/api/auth/profile` | Private | Update user profile |

### 6.2 Appointment Routes (`/api/appointments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/appointments` | Private (Patient) | Book new appointment |
| GET | `/api/appointments` | Private | Get user's appointments |
| PUT | `/api/appointments/:id/status` | Private (Doctor/Admin) | Update appointment status |
| GET | `/api/appointments/check-availability` | Public | Check if slot is available |
| PUT | `/api/appointments/:id/reschedule` | Private (Patient) | Reschedule appointment |
| DELETE | `/api/appointments/:id` | Private | Cancel appointment |

**Key Controller Functions**:

1. **`bookAppointment`**:
   - Validates date/time
   - Checks conflicts (doctor + patient)
   - Checks doctor availability
   - Creates appointment record

2. **`getAppointments`**:
   - Returns appointments based on user role
   - For doctors: appointments assigned to them
   - For patients: appointments they booked
   - Includes related data (patient/doctor info)

3. **`checkAvailability`**:
   - Public endpoint (no auth required)
   - Checks if slot is available
   - Returns `{ available: true/false, message: "..." }`

4. **`rescheduleAppointment`**:
   - Similar to booking but updates existing appointment
   - Excludes current appointment from conflict check

5. **`cancelAppointment`**:
   - Updates status to 'cancelled'
   - Calculates refund based on cancellation policy:
     - > 24 hours: 100% refund
     - > 12 hours: 50% refund
     - < 12 hours: No refund

### 6.3 Scan Routes (`/api/scans`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/scans/upload` | Private (Patient) | Upload scan file |
| GET | `/api/scans` | Private | Get user's scans |
| GET | `/api/scans/:id` | Private | Get single scan details |
| POST | `/api/scans/:id/analyze` | Private (Doctor) | Run AI analysis |
| POST | `/api/scans/:id/report` | Private (Doctor) | Create medical report |

**Key Functions**:

1. **`uploadScan`**:
   - Uses Multer for file upload
   - Validates file type (JPEG, PNG, DICOM, etc.)
   - Saves file to `server/uploads/`
   - Creates Scan record with metadata

2. **`runAIAnalysis`**:
   - Currently uses **mock AI analysis** (for demo)
   - In production, would call AI microservice
   - Updates scan with `ai_prediction`, `ai_explanation`
   - Sets status to 'analyzed'

3. **`createReport`**:
   - Doctor creates final report
   - Links report to scan
   - Updates scan status to 'verified'

### 6.4 Payment Routes (`/api/payments`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/payments/create-intent` | Private | Create Stripe payment intent |
| POST | `/api/payments/confirm` | Private | Confirm payment success |
| POST | `/api/payments/webhook` | Public (Stripe) | Stripe webhook handler |
| POST | `/api/payments/:id/refund` | Private (Admin) | Process refund |
| GET | `/api/payments/history` | Private | Get payment history |

**Payment Flow**:
1. Patient selects appointment slot
2. Frontend calls `/api/payments/create-intent`
3. Backend:
   - Calculates amount (consultation fee + platform fee)
   - Creates Stripe PaymentIntent
   - Returns `clientSecret` to frontend
4. Frontend uses Stripe.js to process payment
5. On success, frontend calls `/api/payments/confirm`
6. Backend creates Payment record and updates appointment status

**Security**: Amount is calculated on **server-side** (not from client) to prevent tampering.

### 6.5 Consultation Routes (`/api/consultation`)

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/consultation/:appointmentId/chat` | Private | Get chat history |
| GET | `/api/consultation/:appointmentId/notes` | Private | Get consultation notes |
| POST | `/api/consultation/:appointmentId/notes` | Private (Doctor) | Add consultation note |
| GET | `/api/consultation/:appointmentId/prescription` | Private | Get prescription |
| POST | `/api/consultation/:appointmentId/prescription` | Private (Doctor) | Save prescription |

**Real-time Chat**: Uses Socket.io (see section 7.3)

---

## 7. Frontend Architecture

### 7.1 Routing Structure

**Main Router** (`App.jsx`):
- Uses React Router v6
- Three main route groups:
  - `/patient/*` - Patient routes
  - `/doctor/*` - Doctor routes
  - `/admin/*` - Admin routes

**Protected Routes**:
- `ProtectedRoute` component checks authentication
- `ProfileGuard` ensures profile is completed
- `DoctorVerificationGuard` ensures doctor is verified

**Example**:
```jsx
<Route path="/patient/book-appointment" element={
    <ProtectedRoute role="patient">
        <ProfileGuard>
            <BookAppointment />
        </ProfileGuard>
    </ProtectedRoute>
} />
```

### 7.2 State Management

**React Context**:
- `AuthContext`: Manages user authentication state
- `LanguageContext`: Manages language preferences

**AuthContext** provides:
- `user`: Current user object
- `login`: Login function
- `logout`: Logout function
- `isAuthenticated`: Boolean

### 7.3 Real-time Communication (Socket.io)

**Server Setup** (`server/index.js`):
```javascript
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => {
        socket.join(roomId);  // Join appointment room
    });
    
    socket.on('send_message', async (data) => {
        // Save to database
        await ChatLog.create({
            appointment_id: data.appointmentId,
            sender_id: data.author,
            message: data.message
        });
        
        // Broadcast to room
        socket.to(data.room).emit('receive_message', data);
    });
});
```

**Client Usage**:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

// Join appointment room
socket.emit('join_room', appointmentId);

// Send message
socket.emit('send_message', {
    appointmentId,
    author: userId,
    message: text,
    room: appointmentId
});

// Listen for messages
socket.on('receive_message', (data) => {
    setMessages([...messages, data]);
});
```

---

## 8. Key Features Explained

### 8.1 Doctor Verification System

**Process**:
1. Doctor registers and fills profile (including PMDC number)
2. Status set to `pending`
3. Admin reviews and approves/rejects
4. **Auto-verification**: If PMDC number contains "123", auto-approves (for testing)

**Code** (`authController.js`):
```javascript
if (pmdcNumber && pmdcNumber.includes('123')) {
    doctor.verification_status = 'approved';
    doctor.is_verified = true;
    await doctor.save();
}
```

**Verification Check** (before booking):
```javascript
if (doctorProfile.verification_status !== 'approved') {
    return res.status(400).json({ 
        message: 'Doctor is not verified' 
    });
}
```

### 8.2 AI Scan Analysis (Mock Implementation)

**Current Implementation**: Mock analysis for demo purposes.

**Function** (`scanController.js`):
```javascript
function generateMockAIAnalysis(scanType) {
    const analyses = {
        mri_brain: {
            predictions: {
                primary: { condition: 'No significant abnormality', confidence: 0.92 }
            },
            findings: ['Brain parenchyma appears normal', ...],
            explanation: 'AI model analyzed using deep learning...',
            severity: 'Normal',
            urgency: 'Routine'
        },
        // ... other scan types
    };
    return analyses[scanType] || defaultAnalysis;
}
```

**In Production**: Would call external AI service API.

### 8.3 Appointment Reminders (Cron Jobs)

**Location**: `server/jobs/appointmentReminders.js`

**Functionality**:
- Runs daily at 9:00 AM
- Finds all confirmed appointments for tomorrow
- Sends email reminders to patients and doctors

**Code**:
```javascript
cron.schedule('0 9 * * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    
    const appointments = await Appointment.findAll({
        where: {
            date: tomorrowDate,
            status: 'confirmed'
        },
        include: [Patient, Doctor]
    });
    
    // Send reminders
    for (const appointment of appointments) {
        await sendAppointmentReminder(appointment);
    }
});
```

### 8.4 Profile Completion Guards

**Patient Profile Requirements**:
- CNIC
- Date of Birth
- Emergency Contact Phone

**Check** (`appointmentController.js`):
```javascript
if (!patientProfile.cnic || 
    !patientProfile.date_of_birth || 
    !patientProfile.emergency_contact_phone) {
    return res.status(400).json({ 
        message: 'Please complete your profile before booking appointments.' 
    });
}
```

**Frontend Guard**: `ProfileGuard` component redirects to profile page if incomplete.

---

## 9. Security Features

### 9.1 Password Security
- **Hashing**: bcrypt with salt rounds = 10
- **Never stored in plain text**
- **Hooks**: Automatically hash before create/update

### 9.2 Account Lockout
- **5 failed login attempts** → Account locked for 15 minutes
- **Prevents brute force attacks**

### 9.3 JWT Token Security
- **Short-lived access tokens** (15 min)
- **Refresh token rotation**
- **Token stored in memory** (not localStorage)

### 9.4 SQL Injection Prevention
- **Sequelize ORM** uses parameterized queries
- **No raw SQL** with user input

### 9.5 File Upload Security
- **File type validation** (only medical image formats)
- **File size limit** (50MB)
- **Stored outside public directory**

### 9.6 CORS Configuration
- **Configured for specific origins** (in production)
- **Currently allows all** (for development)

---

## 10. Common Viva Questions & Answers

### Q1: How do you prevent double-booking of appointments?

**Answer**:
We use **multiple layers of protection**:

1. **Application-level checks** in `bookAppointment`:
   - Query database for existing appointment with same `doctor_id`, `date`, and `time_slot`
   - Exclude cancelled appointments from conflict check
   - Return error if conflict found

2. **Database-level constraint**:
   - Unique index on `(doctor_id, date, time_slot)` where `status != 'cancelled'`
   - Database enforces uniqueness even if application logic fails

3. **Real-time availability check**:
   - Frontend can call `/api/appointments/check-availability` before booking
   - Shows user if slot is available

**Code Example**:
```javascript
const existingAppointment = await Appointment.findOne({
    where: {
        doctor_id: doctorProfile.id,
        date: date,
        time_slot: timeSlot,
        status: { [Op.ne]: 'cancelled' }
    }
});
```

---

### Q2: Explain the database schema and relationships.

**Answer**:
The database uses **PostgreSQL** with **12 main tables**:

**Core Tables**:
- `Users`: All user accounts (patients, doctors, admins)
- `Patients`: Patient-specific medical data (linked to Users via `user_id`)
- `Doctors`: Doctor credentials and availability (linked to Users via `user_id`)
- `Appointments`: Links patients to doctors with date/time
- `Scans`: Medical scan images and AI analysis
- `Payments`: Payment transactions linked to appointments

**Relationships**:
- **User → Patient/Doctor**: One-to-One (one user has one profile)
- **Patient → Appointments**: One-to-Many (patient can have multiple appointments)
- **Doctor → Appointments**: One-to-Many (doctor can have multiple appointments)
- **Appointment → Payment**: One-to-One (each appointment has one payment)
- **Patient → Scans**: One-to-Many (patient can upload multiple scans)

**Foreign Keys**: All relationships use foreign keys with `ON DELETE CASCADE` to maintain referential integrity.

---

### Q3: How does authentication work in your system?

**Answer**:
We use **JWT (JSON Web Tokens)** for authentication:

1. **Registration**:
   - User provides email, password, role
   - Password is hashed using bcrypt (salt rounds = 10)
   - Email verification token generated
   - Status set to `pending_verification`

2. **Login**:
   - User provides email and password
   - Backend finds user and compares password using `bcrypt.compare()`
   - On success: generates access token (15 min) and refresh token (7 days)
   - On failure: increments login attempts, locks account after 5 attempts

3. **Protected Routes**:
   - `protect` middleware verifies JWT token from `Authorization: Bearer <token>` header
   - Extracts `userId` from token
   - Attaches user object to `req.user`
   - Checks if user is banned

4. **Role-based Access**:
   - `requireRole` middleware checks if user's role matches required roles
   - Permission matrix defines what each role can do

---

### Q4: How do you handle appointment conflicts when rescheduling?

**Answer**:
The `rescheduleAppointment` function performs similar conflict checks as booking, but **excludes the current appointment** from conflict detection:

```javascript
const conflictingAppointment = await Appointment.findOne({
    where: {
        doctor_id: appointment.doctor_id,
        date: newDate,
        time_slot: newTimeSlot,
        status: { [Op.ne]: 'cancelled' },
        id: { [Op.ne]: id }  // ⭐ Exclude current appointment
    }
});
```

This ensures:
- We can reschedule to a new time slot
- But we still prevent conflicts with other appointments
- Patient can't reschedule to a time they already have another appointment

---

### Q5: Explain the payment flow.

**Answer**:
1. **Patient selects appointment slot** → Frontend calls `/api/payments/create-intent`
2. **Backend calculates amount** (consultation fee + platform fee) - **server-side for security**
3. **Creates Stripe PaymentIntent** → Returns `clientSecret` to frontend
4. **Frontend uses Stripe.js** → Processes payment with card details
5. **On success** → Frontend calls `/api/payments/confirm`
6. **Backend creates Payment record** → Updates appointment status to 'confirmed'
7. **Stripe webhook** → Handles payment events (succeeded, failed, refunded)

**Security**: Amount is **never** accepted from client - always calculated on server to prevent tampering.

---

### Q6: How does the AI scan analysis work?

**Answer**:
Currently, we use **mock AI analysis** for demonstration:

1. **Doctor uploads/selects scan** → Calls `/api/scans/:id/analyze`
2. **Backend generates mock analysis** based on scan type (MRI, X-Ray, etc.)
3. **Analysis includes**:
   - Primary prediction with confidence score
   - Differential diagnoses
   - Findings list
   - Explanation
   - Severity and urgency
4. **Results stored** in `ai_prediction` JSONB field
5. **Scan status** updated to 'analyzed'

**In Production**: Would call external AI microservice API (e.g., TensorFlow Serving, PyTorch model).

---

### Q7: What happens when a patient cancels an appointment?

**Answer**:
The `cancelAppointment` function:

1. **Verifies ownership** (patient or doctor can cancel)
2. **Checks if already cancelled**
3. **Calculates refund** based on cancellation policy:
   - **> 24 hours before**: 100% refund
   - **12-24 hours before**: 50% refund
   - **< 12 hours before**: No refund
4. **Processes refund** via Stripe (if applicable)
5. **Updates appointment status** to 'cancelled'
6. **Updates payment status** to 'refunded' (if refund processed)

**Code**:
```javascript
const hoursUntilAppointment = (appointmentDateTime - now) / (1000 * 60 * 60);

if (hoursUntilAppointment > 24) {
    refundPercentage = 100;
} else if (hoursUntilAppointment > 12) {
    refundPercentage = 50;
} else {
    refundPercentage = 0;
}
```

---

### Q8: How do you ensure data security?

**Answer**:
Multiple security measures:

1. **Password Security**:
   - bcrypt hashing (salt rounds = 10)
   - Never stored in plain text

2. **Account Lockout**:
   - 5 failed login attempts → 15-minute lockout
   - Prevents brute force attacks

3. **JWT Tokens**:
   - Short-lived access tokens (15 min)
   - Refresh token rotation
   - Stored in memory (not localStorage)

4. **SQL Injection Prevention**:
   - Sequelize ORM uses parameterized queries
   - No raw SQL with user input

5. **File Upload Security**:
   - File type validation
   - File size limits
   - Stored outside public directory

6. **Authorization**:
   - Role-based access control
   - Permission matrix
   - Ownership checks

---

### Q9: Explain the doctor verification process.

**Answer**:
1. **Doctor registers** → Creates User and Doctor profile
2. **Doctor fills profile** → Includes PMDC number, specialization, etc.
3. **Status set to 'pending'** → Awaiting admin approval
4. **Admin reviews** → Via `/admin/verification` page
5. **Admin approves/rejects** → Updates `verification_status`
6. **Auto-verification** (for testing): If PMDC contains "123", auto-approves
7. **Only verified doctors** can accept appointments

**Check before booking**:
```javascript
if (doctorProfile.verification_status !== 'approved') {
    return res.status(400).json({ 
        message: 'Doctor is not verified' 
    });
}
```

---

### Q10: How does real-time chat work during consultations?

**Answer**:
We use **Socket.io** for real-time communication:

**Server**:
1. Socket.io server attached to Express server
2. On connection, user joins appointment room
3. On `send_message` event:
   - Saves message to `ChatLogs` table
   - Broadcasts to all users in room

**Client**:
1. Connects to Socket.io server
2. Joins appointment room on mount
3. Sends messages via `socket.emit('send_message', ...)`
4. Receives messages via `socket.on('receive_message', ...)`

**Database**: All messages stored in `ChatLogs` table for history.

---

### Q11: What database queries are used for appointment booking?

**Answer**:
**Query 1: Check Doctor Slot Conflict**
```sql
SELECT * FROM "Appointments" 
WHERE doctor_id = 'doctor-uuid' 
  AND date = '2024-01-15' 
  AND time_slot = '10:00 AM' 
  AND status != 'cancelled';
```

**Query 2: Check Patient Conflict**
```sql
SELECT * FROM "Appointments" 
WHERE patient_id = 'patient-uuid' 
  AND date = '2024-01-15' 
  AND time_slot = '10:00 AM' 
  AND status != 'cancelled';
```

**Query 3: Get Doctor Profile**
```sql
SELECT * FROM "Doctors" 
WHERE user_id = 'user-uuid';
```

**Query 4: Get Patient Profile**
```sql
SELECT * FROM "Patients" 
WHERE user_id = 'user-uuid';
```

**Query 5: Create Appointment**
```sql
INSERT INTO "Appointments" 
(patient_id, doctor_id, date, time_slot, type, status) 
VALUES 
('patient-uuid', 'doctor-uuid', '2024-01-15', '10:00 AM', 'virtual', 'pending');
```

**Using Sequelize ORM**:
```javascript
const existingAppointment = await Appointment.findOne({
    where: {
        doctor_id: doctorProfile.id,
        date: date,
        time_slot: timeSlot,
        status: { [Op.ne]: 'cancelled' }
    }
});
```

---

### Q12: How do you handle working hours validation?

**Answer**:
Doctor's working hours stored as JSONB:
```json
{
    "Monday": { "start": "9:00 AM", "end": "5:00 PM" },
    "Tuesday": { "start": "9:00 AM", "end": "5:00 PM" },
    ...
}
```

**Validation Process**:
1. Extract day name from appointment date
2. Get day schedule from `working_hours` JSONB
3. Convert time slot and schedule times to minutes
4. Check if slot time is within start and end times

**Code**:
```javascript
const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
const daySchedule = doctorProfile.working_hours[dayName];

const slotTime = parseTime(timeSlot);  // "10:00 AM" → 600 minutes
const startTime = parseTime(daySchedule.start);  // "9:00 AM" → 540 minutes
const endTime = parseTime(daySchedule.end);      // "5:00 PM" → 1020 minutes

if (slotTime < startTime || slotTime >= endTime) {
    return res.status(400).json({ 
        message: 'Outside working hours' 
    });
}
```

---

## 📝 Summary

### Key Takeaways for Viva:

1. **Appointment Conflicts**: Multi-layer protection (application + database unique index)
2. **Authentication**: JWT tokens with refresh mechanism, account lockout
3. **Database**: PostgreSQL with Sequelize ORM, proper relationships
4. **Security**: Password hashing, SQL injection prevention, file upload validation
5. **Real-time**: Socket.io for consultation chat
6. **Payment**: Stripe integration with server-side amount calculation
7. **AI Analysis**: Mock implementation (ready for production AI service)
8. **Authorization**: Role-based access control with permission matrix

### Important Files to Remember:
- `server/controllers/appointmentController.js` - Appointment booking logic
- `server/middleware/authMiddleware.js` - Authentication & authorization
- `server/models/index.js` - Database relationships
- `server/schema.sql` - Database schema
- `server/index.js` - Server setup with Socket.io

---

**Good luck with your viva! 🎓**

