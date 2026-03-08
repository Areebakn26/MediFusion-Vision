/**
 * Integration Tests for Appointment System
 * Tests the integration between Patient/Doctor Management and Appointment/Scheduling modules
 */

const request = require('supertest');
const { sequelize } = require('../../models');
const { User, Patient, Doctor, Appointment } = require('../../models');

// Import app after models are loaded
const app = require('../../index');

describe('Appointment Integration Tests', () => {
    let patientToken;
    let doctorToken;
    let patientId;
    let doctorId;
    let appointmentId;

    // Setup: Create test users and login
    beforeAll(async () => {
        // Sync database for tests
        await sequelize.sync({ force: false });
        // Create test patient user
        const patientUser = await User.create({
            name: 'Test Patient',
            email: 'testpatient@test.com',
            password: 'password123',
            role: 'patient',
            email_verified: true,
            status: 'active'
        });

        const patientProfile = await Patient.create({
            user_id: patientUser.id,
            cnic: '12345-1234567-1',
            date_of_birth: '1990-01-01',
            emergency_contact_phone: '03001234567'
        });

        patientId = patientUser.id;

        // Create test doctor user
        const doctorUser = await User.create({
            name: 'Test Doctor',
            email: 'testdoctor@test.com',
            password: 'password123',
            role: 'doctor',
            email_verified: true,
            status: 'active'
        });

        const doctorProfile = await Doctor.create({
            user_id: doctorUser.id,
            pmdc_number: 'PMDC12345',
            specialization: 'Cardiology',
            verification_status: 'approved',
            is_verified: true
        });

        doctorId = doctorUser.id;

        // Login as patient
        const patientLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'testpatient@test.com', password: 'password123' });
        patientToken = patientLoginRes.body.accessToken;

        // Login as doctor
        const doctorLoginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'testdoctor@test.com', password: 'password123' });
        doctorToken = doctorLoginRes.body.accessToken;
    });

    // Cleanup: Remove test data
    afterAll(async () => {
        if (appointmentId) {
            await Appointment.destroy({ where: { id: appointmentId } });
        }
        await Patient.destroy({ where: { user_id: patientId } });
        await Doctor.destroy({ where: { user_id: doctorId } });
        await User.destroy({ where: { id: [patientId, doctorId] } });
    });

    // Integration Test 1: Create Appointment
    test('Create Appointment (Patient ↔ Doctor ↔ Scheduler)', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        const dateString = futureDate.toISOString().split('T')[0];

        const res = await request(app)
            .post('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                doctorId: doctorId,
                date: dateString,
                timeSlot: '10:00 AM',
                type: 'virtual',
                notes: 'Regular checkup'
            });

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('patient_id');
        expect(res.body).toHaveProperty('doctor_id');
        expect(res.body).toHaveProperty('date', dateString);
        expect(res.body).toHaveProperty('time_slot', '10:00 AM');
        expect(res.body).toHaveProperty('type', 'virtual');
        expect(res.body).toHaveProperty('meeting_link');
        expect(res.body.status).toBe('pending');

        appointmentId = res.body.id;
    });

    // Integration Test 2: Update Appointment
    test('Update Appointment (Scheduler ↔ Database ↔ Notification)', async () => {
        if (!appointmentId) {
            // Create appointment first if not exists
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const dateString = futureDate.toISOString().split('T')[0];

            const createRes = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctorId: doctorId,
                    date: dateString,
                    timeSlot: '10:00 AM',
                    type: 'virtual'
                });
            appointmentId = createRes.body.id;
        }

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 8);
        const newDateString = futureDate.toISOString().split('T')[0];

        const res = await request(app)
            .put(`/api/appointments/${appointmentId}/reschedule`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                newDate: newDateString,
                newTimeSlot: '2:00 PM'
            });

        expect(res.status).toBe(200);
        expect(res.body.appointment).toHaveProperty('date', newDateString);
        expect(res.body.appointment).toHaveProperty('time_slot', '2:00 PM');
    });

    // Integration Test 3: View Appointments
    test('View Appointments (Patient ↔ Doctor ↔ Database)', async () => {
        const res = await request(app)
            .get('/api/appointments')
            .set('Authorization', `Bearer ${patientToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('doctor');
            expect(res.body[0]).toHaveProperty('patient');
        }
    });

    // Integration Test 4: Cancel Appointment
    test('Cancel Appointment (Patient ↔ Payment ↔ Notification)', async () => {
        if (!appointmentId) {
            // Create appointment first if not exists
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 7);
            const dateString = futureDate.toISOString().split('T')[0];

            const createRes = await request(app)
                .post('/api/appointments')
                .set('Authorization', `Bearer ${patientToken}`)
                .send({
                    doctorId: doctorId,
                    date: dateString,
                    timeSlot: '10:00 AM',
                    type: 'virtual'
                });
            appointmentId = createRes.body.id;
        }

        const res = await request(app)
            .delete(`/api/appointments/${appointmentId}`)
            .set('Authorization', `Bearer ${patientToken}`)
            .send({
                reason: 'Test cancellation'
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message');
        expect(res.body).toHaveProperty('refundAmount');
    });
});

