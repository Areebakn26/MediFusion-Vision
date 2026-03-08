const { Doctor, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all doctors (with search/filter)
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    const { search, specialization } = req.query;

    try {
        let whereClause = {
            verification_status: 'approved' // Only show approved doctors
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
                    attributes: ['name', 'email', 'role'], // Exclude password
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

// @desc    Get doctor by ID
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    try {
        const doctor = await Doctor.findByPk(req.params.id, {
            include: [
                {
                    model: User,
                    attributes: ['name', 'email', 'phone']
                }
            ]
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
    getDoctorById
};
