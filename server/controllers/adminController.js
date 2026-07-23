const { User, Doctor, Patient, Appointment, Payment, Notification, Scan, AIFeedback, sequelize } = require('../models');
const { sendDoctorStatusNotification } = require('../utils/emailService');
const { Op } = require('sequelize');


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

// @desc    Block or unblock a user
// @route   PUT /api/admin/users/:id/block
// @access  Private/Admin
const blockUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot block an admin account' });
        // block=true → is_active=false (blocked), block=false → is_active=true (unblocked)
        user.is_active = req.body.block === true ? false : true;
        await user.save();
        res.json({ message: `User ${!user.is_active ? 'blocked' : 'unblocked'} successfully`, user });
    } catch (error) {
        console.error('Block User Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin account' });
        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
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
    const { status, reason } = req.body;

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
        doctor.is_verified = status === 'approved';
        await doctor.save();

        if (doctor.User && doctor.User.email) {
            await sendDoctorStatusNotification(doctor.User.email, doctor.User.name, status);
        }

        try {
            await Notification.create({
                user_id: doctor.user_id,
                title: status === 'approved' ? 'Profile Verified' : 'Verification Rejected',
                message: status === 'approved'
                    ? 'Your doctor profile has been approved. You can now accept appointments.'
                    : `Your verification was rejected. Reason: ${reason || 'Please contact the admin for more information.'}`,
                type: 'system',
                link: '/doctor/profile'
            });
        } catch (notifErr) {
            console.error('[NOTIF] verifyDoctor notification failed:', notifErr.message);
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
        const totalUsers        = await User.count();
        const totalDoctors      = await Doctor.count();
        const totalPatients     = await Patient.count();
        const totalScans        = await Scan.count();
        const pendingVerifications = await Doctor.count({ where: { verification_status: 'pending' } });
        const totalAppointments = await Appointment.count();
        const revenueResult     = await Payment.sum('amount', { where: { status: 'succeeded' } });
        const revenue           = revenueResult || 0;

        res.json({ totalUsers, totalDoctors, totalPatients, totalScans, pendingVerifications, totalAppointments, revenue });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get monthly analytics for dashboard charts
// @route   GET /api/admin/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res) => {
    try {
        // Use all-time data so charts always populate regardless of creation dates
        const groupByMonth = [
            [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month']
        ];
        const orderByMonth = [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'ASC']];

        const revenueRows = await Payment.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            where: { status: 'succeeded' },
            group: groupByMonth,
            order: orderByMonth,
            raw: true
        });

        const patientRows = await Patient.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: groupByMonth,
            order: orderByMonth,
            raw: true
        });

        const doctorRows = await Doctor.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: groupByMonth,
            order: orderByMonth,
            raw: true
        });

        const scanRows = await Scan.findAll({
            attributes: [
                [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('createdAt')), 'month'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            group: groupByMonth,
            order: orderByMonth,
            raw: true
        });

        res.json({ revenue: revenueRows, patients: patientRows, doctors: doctorRows, scans: scanRows });
    } catch (error) {
        console.error('Admin Analytics Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get AI model & scan statistics
// @route   GET /api/admin/ai-stats
// @access  Private/Admin
const getAIStats = async (req, res) => {
    try {
        const totalScans = await Scan.count();
        const analyzedScans = await Scan.count({ where: { status: { [Op.ne]: 'pending' } } });
        const flaggedScans = await Scan.count({ where: { status: 'flagged' } });
        const pendingFeedback = await AIFeedback.count({ where: { admin_review_status: 'pending' } });
        const brainScans = await Scan.count({ where: { scan_type: 'mri_brain' } });
        const retinalScans = await Scan.count({ where: { scan_type: 'retinal' } });

        res.json({ totalScans, analyzedScans, flaggedScans, pendingFeedback, brainScans, retinalScans });
    } catch (error) {
        console.error('AI Stats Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getAllUsers,
    blockUser,
    deleteUser,
    getAllDoctors,
    verifyDoctor,
    getAdminStats,
    getAdminAnalytics,
    getAIStats
};
