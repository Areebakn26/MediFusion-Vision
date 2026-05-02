const { Doctor, User, Appointment, Patient, ConsultationNote, Scan, Report, MedicalHistory, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all doctors (with search/filter)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    const { search, specialization } = req.query;

    try {
        let whereClause = {
            verification_status: 'approved'
        };

        if (specialization) {
            whereClause.specialization = specialization;
        }

        let userWhereClause = {};
        if (search) {
            userWhereClause.name = { [Op.iLike]: `%${search}%` };
        }

        const doctors = await Doctor.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    attributes: ['name', 'email', 'role'],
                    where: userWhereClause
                }
            ]
        });

        res.json(doctors);
    } catch (error) {
        console.error("Get Doctors Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all unique patients for a specific doctor (based on appointments)
// @route   GET /api/doctor/my-patients
// @access  Private (Doctor)
const getMyPatients = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        // Step 1: Get distinct patient IDs that have appointments with this doctor
        // We use a clean query to avoid GROUP BY issues with non-aggregated columns
        const patientData = await Appointment.findAll({
            where: { doctor_id: doctor.id },
            attributes: [
                'patient_id',
                [sequelize.fn('MAX', sequelize.col('date')), 'lastVisit']
            ],
            group: ['patient_id'],
            raw: true
        });

        if (patientData.length === 0) return res.json([]);

        const uniquePatientIds = patientData.map(p => p.patient_id);
        const lastVisitMap = {};
        patientData.forEach(p => { lastVisitMap[p.patient_id] = p.lastVisit; });

        // Step 2: Fetch detailed patient profiles for these IDs
        const patients = await Patient.findAll({
            where: { id: { [Op.in]: uniquePatientIds } },
            include: [
                { 
                    model: User, 
                    attributes: ['name', 'email', 'phone'] 
                },
                { 
                    model: MedicalHistory,
                    attributes: ['condition', 'status', 'type']
                }
            ],
            order: [[User, 'name', 'ASC']]
        });

        // Step 3: Format the response to include calculated fields and summaries
        const result = patients.map(p => {
            const plainPatient = p.get({ plain: true });
            
            // Create a medical history summary string
            const medicalHistorySummary = plainPatient.MedicalHistories?.length > 0
                ? plainPatient.MedicalHistories.map(h => h.condition).join(', ')
                : 'No recorded conditions';

            return {
                ...plainPatient,
                lastVisit: lastVisitMap[p.id] || null,
                medical_history_summary: medicalHistorySummary
            };
        });

        res.json(result);
    } catch (error) {
        console.error("Get My Patients Error:", error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

// @desc    Get detailed patient history for a doctor (with security check)
// @route   GET /api/doctor/patients/:patientId/history
// @access  Private (Doctor) — only if they've had an appointment with this patient
const getPatientHistory = async (req, res) => {
    try {
        const { patientId } = req.params;
        const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        // SECURITY: Verify this doctor has had at least one appointment with this patient
        const hasRelationship = await Appointment.findOne({
            where: { patient_id: patientId, doctor_id: doctor.id }
        });
        if (!hasRelationship) {
            return res.status(403).json({ message: 'Access denied: You only have access to your own patients.' });
        }

        // Get full patient profile
        const patient = await Patient.findByPk(patientId, {
            include: [
                { model: User, attributes: ['name', 'email', 'phone'] },
                { model: MedicalHistory }
            ]
        });
        if (!patient) return res.status(404).json({ message: 'Patient not found' });

        // Get all appointments with THIS doctor only (Timeline)
        const appointments = await Appointment.findAll({
            where: { patient_id: patientId, doctor_id: doctor.id },
            attributes: [
                'id', 'date', 'type', 'status', 'reason', 
                'consultation_summary', 'doctor_notes', 'transcript', 'symptoms'
            ],
            include: [
                {
                    model: ConsultationNote,
                    include: [{ model: User, as: 'author', attributes: ['name'] }]
                }
            ],
            order: [['date', 'DESC']]
        });

        // Get all scans for this patient
        const scans = await Scan.findAll({
            where: { patient_id: patientId },
            include: [
                {
                    model: Report,
                    attributes: ['id', 'diagnosis', 'ai_findings', 'doctor_notes', 'recommendations', 'report_patient_friendly', 'finalized', 'finalized_at', 'createdAt'],
                    where: { finalized: true },
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            profile: patient.get({ plain: true }),
            appointments: appointments.map(a => a.get({ plain: true })),
            scans: scans.map(s => s.get({ plain: true }))
        });
    } catch (error) {
        console.error("Get Patient History Error:", error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

// @desc    Get analytics stats for the logged-in doctor
// @route   GET /api/doctors/analytics
// @access  Private (Doctor)
const getDoctorAnalytics = async (req, res) => {
    try {
        const doctor = await Doctor.findOne({ where: { user_id: req.user.id } });
        if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const trendStart = new Date(now);
        trendStart.setDate(now.getDate() - 6);
        trendStart.setHours(0, 0, 0, 0);

        const [totalPatients, monthlyAppts, completedAppts, upcomingAppts, trendAppts, virtualAppts, physicalAppts] = await Promise.all([
            Appointment.count({ where: { doctor_id: doctor.id }, distinct: true, col: 'patient_id' }),
            Appointment.count({ where: { doctor_id: doctor.id, date: { [Op.gte]: monthStart } } }),
            Appointment.count({ where: { doctor_id: doctor.id, status: 'completed' } }),
            Appointment.count({ where: { doctor_id: doctor.id, status: { [Op.in]: ['confirmed', 'pending'] }, date: { [Op.gte]: now } } }),
            Appointment.findAll({ where: { doctor_id: doctor.id, date: { [Op.gte]: trendStart } }, attributes: ['date'], raw: true }),
            Appointment.count({ where: { doctor_id: doctor.id, type: 'virtual' } }),
            Appointment.count({ where: { doctor_id: doctor.id, type: 'physical' } })
        ]);

        // Build 7-day trend with day labels
        const weeklyTrend = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-US', { weekday: 'short' });
            const count = trendAppts.filter(a => new Date(a.date).toISOString().split('T')[0] === dateStr).length;
            weeklyTrend.push({ date: dateStr, label, count });
        }

        const totalAppts = virtualAppts + physicalAppts;
        const completionRate = totalAppts > 0 ? Math.round((completedAppts / totalAppts) * 100) : 0;

        res.json({ totalPatients, monthlyAppts, completedAppts, upcomingAppts, completionRate, virtualAppts, physicalAppts, weeklyTrend });
    } catch (error) {
        console.error("Get Doctor Analytics Error:", error);
        res.status(500).json({ message: 'Server error', details: error.message });
    }
};

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['name', 'email', 'phone'] }]
        });

        if (doctor) {
            res.json(doctor);
        } else {
            res.status(404).json({ message: 'Doctor not found' });
        }
    } catch (error) {
        console.error("Get Doctor By ID Error:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDoctors,
    getDoctorById,
    getMyPatients,
    getPatientHistory,
    getDoctorAnalytics
};
