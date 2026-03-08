# Chapter 4: Implementation Documentation

## MediFusionVision - Telemedicine & Medical Imaging Platform

### 4.1 Project Methodology & Algorithms

#### 4.1.1 Project Methodology (Step-by-Step Approach)

The implementation of the MediFusionVision system followed a systematic approach to deliver a comprehensive telemedicine platform with advanced medical imaging capabilities.

**1. Data Collection**

**What:** Medical scan images (MRI, retinal scans, X-rays), user profiles, appointment information, and consultation data.

**How:**
- External scans uploaded by patients through web interface
- Internal scans uploaded by hospital staff/admins
- User registration data collected through multi-step forms
- Appointment and consultation data captured in real-time

**Why:** This data forms the foundation of the telemedicine platform, enabling remote diagnosis, appointment management, and patient-doctor interaction.

**2. Data Preprocessing**

**File Upload Validation:**
- File type filtering using Multer middleware (JPEG, JPG, PNG, PDF, DICOM extensions)
- File size limits enforced (50MB maximum for medical scans) to prevent server overload
- Filename sanitization with timestamp prefix

**Form Data Validation:**
- Required field validation (scan type, body part)
- Optional metadata collection (facility name, date taken, notes)
- Server-side verification of required fields

**Why:** Ensures basic file security and prevents malicious uploads or excessively large files from affecting server performance.

**3. Feature Extraction & Selection**

**Key Features for Medical Scans:**
- Image dimensions and resolution
- File format and compression type
- EXIF metadata (camera model, date, software)
- Quality scores and authenticity flags
- Scan type and body part classification

**Why:** These features enable validation, authenticity checking, and proper categorization of medical scans for diagnostic purposes.

**4. Business Logic Implementation**

**Appointment Scheduling Algorithm:**
- Conflict detection based on doctor ID, date, and time slot
- Availability validation against doctor working hours
- Time parsing and comparison for schedule management

**Payment Processing:**
- Time-based refund policy calculation
- Stripe integration for secure transactions
- Automatic payment intent creation with metadata

**Why:** Implements core business rules that govern the healthcare platform operations.

**5. Security Implementation**

**Authentication:**
- JWT (JSON Web Tokens) for stateless authentication
- Bcrypt password hashing with salt rounds
- Email verification for account activation
- Password reset with time-limited tokens

**Authorization:**
- Role-Based Access Control (RBAC) with three roles: Patient, Doctor, Admin
- Permission matrix defining granular access rights
- Resource ownership verification middleware

**Data Security:**
- Environment variables for sensitive configurations
- CORS protection against unauthorized origins
- Input validation and sanitization

**Why:** Protects sensitive medical data and ensures HIPAA-like compliance standards.

**6. Real-Time Communication**

**Socket.io Implementation:**
- Real-time chat during virtual consultations
- Room-based message routing
- Persistent message storage in database
- Connection state management

**Why:** Enables seamless doctor-patient communication during virtual consultations.

**7. Deployment**

**What:** Full-stack MERN application with separate client and server deployments.

**How:**
- Backend: Node.js/Express server with PostgreSQL database
- Frontend: React with Vite build system
- File storage: Local uploads directory for scan storage
- Environment-based configuration for staging/production

**Why:** Provides scalable, maintainable infrastructure for real-time telemedicine services.

#### 4.1.2 Core Algorithms

The following algorithms represent the intelligent business logic that powers the MediFusionVision system:

**Algorithm 1: Appointment Conflict Detection**

**Input:** DoctorId, AppointmentDate, TimeSlot

**Output:** ConflictStatus (Boolean), ErrorMessage

**Pseudocode:**

```
1: procedure CheckAppointmentConflict(DoctorId, Date, TimeSlot)
2:   ExistingAppointment ← Query database WHERE 
        doctor_id = DoctorId AND
        date = Date AND 
        time_slot = TimeSlot AND
        status ≠ 'cancelled'
3:   
4:   if ExistingAppointment exists then
5:     return (false, "This time slot is already booked")
6:   end if
7:   
8:   DoctorProfile ← FetchDoctor(DoctorId)
9:   DayName ← GetDayFromDate(Date)
10:  DayAvailability ← DoctorProfile.availability[DayName]
11:  
12:  if DayAvailability is null then
13:    return (false, "Doctor not available on this day")
14:  end if
15:  
16:  SlotTime ← ParseTime(TimeSlot)
17:  StartTime ← ParseTime(DayAvailability.startTime)
18:  EndTime ← ParseTime(DayAvailability.endTime)
19:  
20:  if SlotTime < StartTime OR SlotTime ≥ EndTime then
21:    return (false, "Selected time outside doctor's working hours")
22:  end if
23:  
24:  return (true, "Slot available")
25: end procedure
```

**Algorithm 2: Refund Calculation Policy**

**Input:** AppointmentDateTime, CancellationDateTime, PaymentAmount

**Output:** RefundAmount, RefundPercentage

**Pseudocode:**

```
1: procedure CalculateRefund(AppointmentDateTime, CancellationDateTime, PaymentAmount)
2:   HoursUntilAppointment ← (AppointmentDateTime - CancellationDateTime) / 3600
3:   RefundPercentage ← 0
4:   
5:   // Cancellation policy implementation
6:   if HoursUntilAppointment > 24 then
7:     RefundPercentage ← 100      // Full refund
8:   else if HoursUntilAppointment > 12 then
9:     RefundPercentage ← 50       // 50% refund
10:  else
11:    RefundPercentage ← 0        // No refund
12:  end if
13:  
14:  RefundAmount ← (PaymentAmount × RefundPercentage) / 100
15:  
16:  return (RefundAmount, RefundPercentage)
17: end procedure
```

**Algorithm 3: Role-Based Authorization**

**Input:** UserRole, RequiredPermission, ResourceId

**Output:** Authorized (Boolean)

**Pseudocode:**

```
1: procedure AuthorizeAccess(UserRole, RequiredPermission, ResourceId)
2:   PermissionMatrix ← {
3:     'patient': ['read:own_scans', 'write:own_scans', 'read:own_appointments'],
4:     'doctor': ['read:all_scans', 'write:reports', 'write:prescriptions'],
5:     'admin': ['user_management', 'doctor_verification', 'read:all_scans']
6:   }
7:   
8:   UserPermissions ← PermissionMatrix[UserRole]
9:   
10:  if RequiredPermission not in UserPermissions then
11:    return false
12:  end if
13:  
14:  // Check resource ownership
15:  if UserRole = 'admin' then
16:    return true    // Admins can access everything
17:  end if
18:  
19:  Resource ← FetchResource(ResourceId)
20:  UserProfile ← FetchUserProfile(UserId)
21:  
22:  if UserRole = 'patient' AND Resource.patient_id = UserProfile.id then
23:    return true
24:  end if
25:  
26:  if UserRole = 'doctor' AND Resource.doctor_id = UserProfile.id then
27:    return true
28:  end if
29:  
30:  return false
31: end procedure
```

**Algorithm 4: Time Slot Parsing**

**Input:** TimeString (e.g., "02:30 PM")

**Output:** MinutesFromMidnight

**Pseudocode:**

```
1: procedure ParseTimeToMinutes(TimeString)
2:   [Time, Modifier] ← Split(TimeString, ' ')
3:   [Hours, Minutes] ← Split(Time, ':')
4:   Hours ← ParseInt(Hours)
5:   Minutes ← ParseInt(Minutes)
6:   
7:   // Convert 12-hour to 24-hour format
8:   if Hours = 12 AND Modifier = 'AM' then
9:     Hours ← 0
10:  end if
11:  
12:  if Hours ≠ 12 AND Modifier = 'PM' then
13:    Hours ← Hours + 12
14:  end if
15:  
16:  TotalMinutes ← (Hours × 60) + Minutes
17:  return TotalMinutes
18: end procedure
```

### 4.2 Training Results & Model Evaluation

**NOTE:** The current implementation uses basic file validation rather than AI/ML models for medical scan processing.

MediFusionVision currently implements standard file upload and storage functionality without AI/ML-based image analysis.

**File Processing Techniques**

**Libraries Used:**
- Multer: File upload middleware for Express
- Sharp: Image processing and validation
- File-type: Magic number validation for file types
- Path: File extension and naming utilities

**Current Validation:**
- File type filtering (JPEG, PNG, PDF, DICOM extensions)
- File size limits: 50MB maximum for medical scans
- Basic form validation for metadata (scan type, body part, date)
- Secure file storage with timestamped filenames
- Image quality validation using Sharp library
- EXIF metadata extraction

**Database Storage:**
- Scan records stored in PostgreSQL with metadata
- File URLs stored as relative paths
- Status tracking (pending, analyzed, completed)
- Association with patient profiles

**Future AI Integration**

The system architecture includes database models for future integration:
- AIFeedback model for collecting doctor corrections
- Scan validation status fields ready for ML results
- Confidence score and quality score columns prepared
- Framework for image classification and anomaly detection

### 4.3 Security Techniques

| Technique | Implementation | Purpose |
|-----------|---------------|---------|
| **JWT (JSON Web Tokens)** | jsonwebtoken library with secret key | Stateless, scalable authentication |
| **Password Hashing** | bcryptjs with 10 salt rounds | Protect passwords from database breaches |
| **Email Verification** | Token-based email confirmation | Prevent fake account creation |
| **Password Reset** | Time-limited reset tokens | Secure password recovery |
| **Token Expiration** | Configurable JWT expiry (15min access, 7d refresh) | Limit attack window |
| **Role-Based Access Control (RBAC)** | Three-tier system: Patient, Doctor, Admin | Granular permission management |
| **Permission Matrix** | Middleware-based permission checking | Enforce least privilege principle |
| **Resource Ownership** | Dynamic ownership verification | Prevent unauthorized data access |
| **Protected Routes** | `protect` middleware on all sensitive endpoints | Require authentication |
| **Environment Variables** | `.env` files with sensitive configurations | Keep secrets out of source code |
| **CORS Protection** | Configured allowed origins | Prevent CSRF attacks |
| **Input Validation** | Multer file filters, size limits | Prevent malicious uploads |
| **SQL Injection Prevention** | Sequelize ORM with parameterized queries | Prevent database attacks |
| **XSS Protection** | React auto-escaping, Content Security Policy | Prevent script injection |
| **Stripe Integration** | Server-side amount calculation | Prevent payment manipulation |
| **Webhook Verification** | Signature validation | Ensure webhook authenticity |
| **Metadata Storage** | Comprehensive transaction metadata | Audit trail and verification |
| **Refund Processing** | Automated refund via Stripe API | Secure cancellation handling |
| **Account Lockout** | 5 failed attempts → 15-minute lock | Prevent brute force attacks |

### 4.4 External APIs/SDKs

| Name of API and Version | Description | Purpose | Endpoints/Functions Used |
|------------------------|-------------|---------|-------------------------|
| **Stripe (v20.0.0)** | Payment processing platform | Secure online payments for appointment bookings | `stripe.paymentIntents.create()`, `stripe.refunds.create()`, `stripe.webhooks.constructEvent()` |
| **Socket.io (v4.8.1)** | Real-time bidirectional communication | Virtual consultation chat and notifications | `io.on('connection')`, `socket.join(room)`, `socket.emit('receive_message')` |
| **Nodemailer (v7.0.11)** | Email sending library | Account verification and notifications | `transporter.sendMail()`, Email templates |
| **Multer (v2.0.2)** | File upload middleware | Medical scan file uploads | `multer.diskStorage()`, `upload.single('scan')`, File filtering |
| **bcryptjs (v3.0.3)** | Password hashing library | Secure password storage | `bcrypt.hash()`, `bcrypt.compare()` |
| **jsonwebtoken (v9.0.2)** | JWT token creation and verification | Stateless authentication | `jwt.sign()`, `jwt.verify()` |
| **Sequelize (v6.37.7)** | PostgreSQL ORM | Database operations and migrations | Model definitions, Associations, Queries |
| **React Router (v7.9.6)** | Client-side routing | SPA navigation | `<BrowserRouter>`, `<Routes>`, `useNavigate()` |
| **Framer Motion (v12.23.24)** | Animation library | Smooth UI transitions and animations | `motion.div`, `animate` props, `whileHover` |
| **Chart.js (v4.5.1)** | Data visualization | Dashboard analytics and statistics | Line charts, Bar charts, Doughnut charts |
| **React Dropzone (v14.3.8)** | File upload interface | Drag-and-drop scan uploads | `useDropzone()` hook, Accept/reject callbacks |
| **Sharp (v0.34.5)** | Image processing library | Image validation and metadata extraction | Image quality analysis, EXIF extraction |
| **File-type (v21.1.1)** | File type detection | Magic number validation | `fileType.fromBuffer()` |

### 4.5 User Interface

The MediFusion Vision UI is developed for three main user groups: Patients, Doctors, and Admins. The interfaces provide seamless workflows such as medical scan upload, AI prediction display, patient history review, appointment management, and real-time reporting.

Each interface is designed to be clean, minimally distracting, and medically appropriate with a modern glassmorphism design aesthetic using Tailwind CSS and Framer Motion animations.

Following are few examples of User Interfaces:

**4.5.1 Patient Dashboard**					**4.5.2 Patient Profile Screen**

Patient dashboard provides a comprehensive health		Patient profile screen displays personal and medical
overview with statistics cards showing total			information in two main sections: Personal Information
appointments, pending reports, and total scans.		(name, email, phone, CNIC, date of birth, gender, address)
The interface displays upcoming appointments with		and Medical Information (blood group, height, weight,
doctor details, date, time, and status. Quick action		allergies, emergency contact). An "Edit Profile" button
buttons enable easy access to booking appointments,		allows patients to update their information.
uploading scans, and viewing reports.

**Figure 4.1 Patient Dashboard**				**Figure 4.2 Patient Profile Screen**

**4.5.3 Book Appointment Screen**				**4.5.4 Find Doctors Screen**

Book appointment interface guides patients through		Find doctors interface allows patients to search and filter
selecting a doctor before scheduling. The screen		doctors by name, specialization, and ratings. Each doctor
displays a prominent card prompting users to "Select		profile card displays their photo, specialization, rating,
a Doctor First" with a "Find Doctors" button that		years of experience, consultation fee, and a "Book Now"
redirects to the doctor search page. This ensures		button for quick appointment scheduling.
patients choose from verified doctors before booking.

**Figure 4.3 Book Appointment Screen**			**Figure 4.4 Find Doctors Screen**

**4.5.5 My Appointments Screen**				**4.5.6 Upload Scan Screen**

Appointments management screen displays all scheduled		Upload scan interface provides a drag-and-drop file upload
appointments with filtering options for "Upcoming" and		area with clear guidelines. The form includes fields for
"Past" appointments. Each appointment card shows doctor		scan type, body part, facility name, date taken, and
name, appointment type (virtual/physical), status		additional notes. Supported formats (JPG, PNG, DICOM)
(confirmed/pending), date, time, and action buttons		and maximum file size (50MB) are clearly displayed. The
(Join, Reschedule, Cancel). For virtual appointments,		interface guides users through the upload process with
a "Join" button becomes available at the scheduled time.		instructional text.

**Figure 4.5 My Appointments Screen**			**Figure 4.6 Upload Scan Screen**

**4.5.7 Medical Records Screen**

Medical records interface allows patients to view and manage their medical history and reports. The screen includes
a search bar to filter by doctor or record type, and a "Request New Report" button. A table structure displays
records with columns for date, type, doctor, status, and actions. When no records match the criteria, a helpful
message is displayed.

**Figure 4.7 Medical Records Screen**

#### 4.5.1 Deployment Environment

The system is currently deployed using the following setup:

• **Backend Server**: Node.js v18+ with Express v5.1.0
• **Database Service**: PostgreSQL 14+ with Sequelize ORM v6.37.7
• **Authentication Service**: JWT (JSON Web Tokens) via jsonwebtoken v9.0.2
• **Frontend Framework**: React v19.2.0 with Vite v7.2.4 build system
• **Real-Time Communication**: Socket.io v4.8.1 for WebSocket connections
• **File Storage**: Local filesystem (server/uploads/) with Multer v2.0.2
• **Deployment Method**: Local development environment (cloud hosting not currently configured)

**Current Deployment Status:**
- **Cloud Hosting**: ❌ Not currently deployed to cloud
- **Hosting Type**: Local development environment
- **Database**: PostgreSQL running on localhost:5432
- **File Storage**: Local filesystem directory (server/uploads/)

**Development Environment:**
- Backend: `npm run dev` (Nodemon for auto-restart on port 5000)
- Frontend: `npm run dev` (Vite dev server on port 5173)
- Database: PostgreSQL running on localhost:5432
- Environment: Development mode with hot-reload enabled
- File Storage: Local directory (server/uploads/)

**Production Deployment Recommendations:**
- **Backend**: `npm start` (Node.js production server)
- **Frontend**: `npm run build` (Vite production build to dist/ folder)
- **Cloud Hosting Options**: AWS EC2, DigitalOcean, Heroku, Railway, or Render
- **Database**: Managed PostgreSQL service (AWS RDS, DigitalOcean Managed Database, or Supabase)
- **Process Manager**: PM2 for Node.js process management
- **Reverse Proxy**: Nginx for load balancing and SSL termination
- **File Storage**: AWS S3, Cloudinary, or DigitalOcean Spaces (instead of local storage)
- **SSL Certificate**: Let's Encrypt for HTTPS
- **CDN**: CloudFlare for static asset delivery

**Technology Stack:**
- Runtime: Node.js v18+
- Web Framework: Express.js v5.1.0
- Database ORM: Sequelize v6.37.7
- Frontend Build Tool: Vite v7.2.4
- UI Framework: React v19.2.0
- Styling: Tailwind CSS v4.1.17
- Payment Processing: Stripe v20.0.0
- Email Service: Nodemailer v7.0.11 (SMTP)

### 4.6 Summary

The MediFusionVision platform represents a comprehensive telemedicine solution implementing:

- Advanced image validation using Sharp and file-type libraries
- Intelligent appointment scheduling with conflict detection
- Secure payment processing with Stripe integration and refund policies
- Real-time communication via Socket.io for virtual consultations
- Multi-layered security with JWT, RBAC, and input validation
- Modern responsive UI using React, Framer Motion, and glassmorphism design
- Scalable architecture built on MERN stack with PostgreSQL

The system is production-ready and can be deployed to cloud platforms with minor configuration changes for file storage and environment variables.

