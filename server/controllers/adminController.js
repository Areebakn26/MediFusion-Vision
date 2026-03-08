const { User, Doctor, Patient, Appointment, Payment } = require('../models');
const { sendDoctorStatusNotification } = require('../utils/emailService');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get all doctors (with profile)
// @route   GET /api/admin/doctors
// @access  Private/Admin
const getAllDoctors = async (req, res) => {
    try {
        const whereClause = {};
        if (req.query.status) {
            whereClause.verification_status = req.query.status;
        }

        const doctors = await Doctor.findAll({
            where: whereClause,
            include: [
                {
                    model: User,
                    attributes: { exclude: ['password'] }
                }
            ]
        });
        res.json(doctors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Approve or Reject Doctor
// @route   PUT /api/admin/doctor/:id/verify
// @access  Private/Admin
const verifyDoctor = async (req, res) => {
    const { status, reason } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            include: [{ model: User, attributes: ['name', 'email'] }]
        });

        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.verification_status = status;
        if (status === 'approved') {
            doctor.is_verified = true; // Admin manual override
        } else {
            doctor.is_verified = false;
        }

        await doctor.save();

        // Send Notification Email
        if (doctor.User && doctor.User.email) {
            await sendDoctorStatusNotification(doctor.User.email, doctor.User.name, status);
        }

        res.json({ message: `Doctor ${status} successfully`, doctor });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalDoctors = await Doctor.count();
        const pendingVerifications = await Doctor.count({ where: { verification_status: 'pending' } });
        const totalAppointments = await Appointment.count();

        // Calculate total revenue
        const revenueResult = await Payment.sum('amount', { where: { status: 'completed' } });
        const revenue = revenueResult || 0;

        res.json({
            totalUsers,
            totalDoctors,
            pendingVerifications,
            totalAppointments,
            revenue
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    getAllDoctors,
    verifyDoctor,
    getAdminStats
};
