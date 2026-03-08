const jwt = require('jsonwebtoken');
const { User, Scan, Appointment } = require('../models');

// Permission Matrix
const PERMISSIONS = {
    patient: [
        'read:own_scans', 'write:own_scans', 'delete:own_scans',
        'read:own_appointments', 'write:own_appointments',
        'read:own_profile', 'write:own_profile'
    ],
    doctor: [
        'read:all_scans', 'write:reports',
        'read:assigned_appointments', 'write:prescriptions',
        'read:patients', 'write:own_profile'
    ],
    admin: [
        'user_management', 'doctor_verification',
        'read:all_scans', 'write:internal_scans',
        'read:all_appointments', 'read:analytics'
    ]
};

// Protect Middleware - Verify JWT
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findByPk(decoded.userId, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            // Check if user is active/banned
            if (req.user.status === 'banned') {
                return res.status(403).json({ message: 'Account is banned. Contact support.' });
            }

            // Attach permissions to request object for easy access
            req.user.permissions = PERMISSIONS[req.user.role] || [];

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Role Middleware
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// Permission Middleware
const requirePermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!req.user.permissions.includes(permission)) {
            return res.status(403).json({
                message: `Missing permission: ${permission}`
            });
        }
        next();
    };
};

// Ownership Middleware
const requireOwnership = (modelName) => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params.id;
            let resource;

            // Dynamic model selection
            switch (modelName) {
                case 'Scan':
                    resource = await Scan.findByPk(resourceId);
                    break;
                case 'Appointment':
                    resource = await Appointment.findByPk(resourceId);
                    break;
                // Add cases for other models as needed
                default:
                    return res.status(500).json({ message: 'Invalid model for ownership check' });
            }

            if (!resource) {
                return res.status(404).json({ message: 'Resource not found' });
            }

            // Check ownership based on role
            if (req.user.role === 'admin') {
                return next(); // Admins can access everything
            }

            if (req.user.role === 'patient') {
                // Check if resource belongs to patient
                // Assuming models have patient_id which links to PatientProfile which links to User
                // This might need adjustment based on exact model associations
                // For direct user_id check (if applicable):
                // if (resource.user_id === req.user.id) return next();

                // For now, assuming we need to check via patient_id
                // We need to fetch patient profile id for the user first if not in req.user
                // Ideally protect middleware should attach profile id too

                // Simplified check if models use direct user_id or we fetch relation
                // Let's assume standard foreign keys: patient_id for Patient, doctor_id for Doctor

                // We need to get the patient_id of the current user
                const { Patient: PatientModel } = require('../models');
                const patientProfile = await PatientModel.findOne({ where: { user_id: req.user.id } });

                if (resource.patient_id === patientProfile.id) {
                    return next();
                }
            }

            if (req.user.role === 'doctor') {
                const { Doctor: DoctorModel } = require('../models');
                const doctorProfile = await DoctorModel.findOne({ where: { user_id: req.user.id } });

                if (resource.doctor_id === doctorProfile.id) {
                    return next();
                }

                // Doctors should also be able to see scans/appointments of their patients
                // This logic can get complex, for now strict ownership or assignment
            }

            return res.status(403).json({ message: 'Not authorized to access this resource' });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error during ownership check' });
        }
    };
};

module.exports = {
    protect,
    requireRole,
    requirePermission,
    requireOwnership
};
