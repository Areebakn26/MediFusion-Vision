# MediFusionVision - Quick Reference Cheat Sheet

## 🎯 Quick Facts

**Project Name**: MediFusionVision  
**Type**: Healthcare Management System with AI-Powered Scan Analysis  
**Tech Stack**: Node.js, Express, PostgreSQL, React, Socket.io, Stripe  
**Database**: PostgreSQL with Sequelize ORM

---

## 🔑 Key Database Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `Users` | All user accounts | id, email, password, role, status |
| `Patients` | Patient profiles | user_id, cnic, date_of_birth, allergies |
| `Doctors` | Doctor profiles | user_id, pmdc_number, specialization, verification_status |
| `Appointments` | Appointment bookings | patient_id, doctor_id, date, time_slot, status |
| `Scans` | Medical scans | patient_id, scan_type, file_url, ai_prediction |
| `Payments` | Payment transactions | appointment_id, amount, status, payment_intent_id |
| `ChatLogs` | Consultation messages | appointment_id, sender_id, message |
| `Reports` | Medical reports | scan_id, doctor_id, diagnosis |

---

## 🚫 Appointment Conflict Prevention

**3 Layers of Protection**:

1. **Application Check** (in `bookAppointment`):
   ```javascript
   const existing = await Appointment.findOne({
       where: {
           doctor_id, date, time_slot,
           status: { [Op.ne]: 'cancelled' }
       }
   });
   ```

2. **Database Unique Index**:
   ```sql
   CREATE UNIQUE INDEX unique_doctor_appointment_slot 
   ON "Appointments"(doctor_id, date, time_slot) 
   WHERE status != 'cancelled';
   ```

3. **Real-time Check**: `/api/appointments/check-availability`

---

## 🔐 Authentication Flow

1. **Register** → Hash password (bcrypt) → Create User + Profile → Send verification email
2. **Login** → Compare password → Generate JWT tokens (access 15min, refresh 7days)
3. **Protected Route** → `protect` middleware verifies JWT → Attach user to `req.user`
4. **Role Check** → `requireRole(['patient'])` → Verify user role

**Account Lockout**: 5 failed attempts → Lock 15 minutes

---

## 📅 Appointment Booking Process

1. Validate date (not past)
2. Validate time (30-min buffer for today)
3. Check doctor slot conflict
4. Check patient conflict
5. Check doctor unavailable dates
6. Check working hours
7. Create appointment

**Key Query**:
```javascript
Appointment.findOne({
    where: {
        doctor_id, date, time_slot,
        status: { [Op.ne]: 'cancelled' }
    }
});
```

---

## 💰 Payment Flow

1. Frontend calls `/api/payments/create-intent`
2. **Server calculates amount** (consultation fee + platform fee) ⚠️ **SECURITY**
3. Create Stripe PaymentIntent → Return `clientSecret`
4. Frontend processes payment with Stripe.js
5. On success → Call `/api/payments/confirm`
6. Create Payment record → Update appointment status

**Refund Policy**:
- > 24 hours: 100% refund
- 12-24 hours: 50% refund
- < 12 hours: No refund

---

## 🏥 Doctor Verification

1. Doctor registers → Fills profile (PMDC number)
2. Status: `pending`
3. Admin reviews → Approves/Rejects
4. **Auto-verify**: PMDC contains "123" → Auto-approve (testing)
5. Only verified doctors can accept appointments

**Check**:
```javascript
if (doctorProfile.verification_status !== 'approved') {
    return error;
}
```

---

## 🔬 AI Scan Analysis

**Current**: Mock implementation  
**Process**:
1. Doctor calls `/api/scans/:id/analyze`
2. Generate mock analysis based on scan type
3. Store in `ai_prediction` JSONB field
4. Status → 'analyzed'

**In Production**: Would call external AI microservice

---

## 💬 Real-time Chat (Socket.io)

**Server**:
```javascript
io.on('connection', (socket) => {
    socket.on('join_room', (roomId) => socket.join(roomId));
    socket.on('send_message', async (data) => {
        await ChatLog.create({...});
        socket.to(data.room).emit('receive_message', data);
    });
});
```

**Client**:
```javascript
socket.emit('join_room', appointmentId);
socket.emit('send_message', { appointmentId, message });
socket.on('receive_message', (data) => {...});
```

---

## 🗄️ Database Relationships

- **User → Patient/Doctor**: 1:1 (one user has one profile)
- **Patient → Appointments**: 1:M (patient has many appointments)
- **Doctor → Appointments**: 1:M (doctor has many appointments)
- **Appointment → Payment**: 1:1 (one payment per appointment)
- **Patient → Scans**: 1:M (patient has many scans)
- **Scan → Report**: 1:M (scan can have multiple reports)

---

## 🔒 Security Features

1. **Password**: bcrypt hashing (salt rounds = 10)
2. **Account Lockout**: 5 attempts → 15 min lock
3. **JWT**: Short-lived tokens (15 min access, 7 days refresh)
4. **SQL Injection**: Sequelize ORM (parameterized queries)
5. **File Upload**: Type validation, size limit (50MB)
6. **Payment**: Amount calculated server-side (not from client)

---

## 📡 Important API Endpoints

| Endpoint | Method | Access | Purpose |
|----------|--------|--------|---------|
| `/api/auth/register` | POST | Public | Register user |
| `/api/auth/login` | POST | Public | Login |
| `/api/appointments` | POST | Patient | Book appointment |
| `/api/appointments/check-availability` | GET | Public | Check slot |
| `/api/scans/upload` | POST | Patient | Upload scan |
| `/api/scans/:id/analyze` | POST | Doctor | Run AI analysis |
| `/api/payments/create-intent` | POST | Private | Create payment |

---

## 🎓 Common Viva Questions

**Q: How do you prevent double-booking?**  
A: Application check + Database unique index + Real-time availability check

**Q: Explain authentication.**  
A: JWT tokens (access 15min, refresh 7days), bcrypt password hashing, account lockout

**Q: How does payment work?**  
A: Stripe integration, server-side amount calculation, webhook for events

**Q: Database relationships?**  
A: User 1:1 Patient/Doctor, Patient 1:M Appointments, Appointment 1:1 Payment

**Q: Appointment conflict handling?**  
A: Check doctor slot, check patient conflict, check unavailable dates, check working hours

---

## 📁 Important Files

- `server/controllers/appointmentController.js` - Booking logic
- `server/middleware/authMiddleware.js` - Auth & authorization
- `server/models/index.js` - Database relationships
- `server/schema.sql` - Database schema
- `server/index.js` - Server + Socket.io setup

---

## ⚡ Quick Code Snippets

**Check Appointment Conflict**:
```javascript
const conflict = await Appointment.findOne({
    where: {
        doctor_id, date, time_slot,
        status: { [Op.ne]: 'cancelled' }
    }
});
```

**Verify JWT Token**:
```javascript
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.user = await User.findByPk(decoded.userId);
```

**Hash Password**:
```javascript
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(password, salt);
```

**Check Role**:
```javascript
if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Not authorized' });
}
```

---

**Good Luck! 🎯**

