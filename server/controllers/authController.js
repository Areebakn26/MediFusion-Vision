const { User, Doctor, Patient } = require('../models');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Generate Access Token (15 min)
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            userId: user.id,
            role: user.role,
            permissions: [] // Can populate from matrix if needed in token
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );
};

// Generate Refresh Token (7 days)
const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, ...profileData } = req.body;

    try {
        // Check if user exists
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Create User
        const user = await User.create({
            name,
            email,
            password,
            role,
            phone: profileData.phone,
            email_verification_token: verificationToken,
            status: 'pending_verification' // Enforce verification
        });

        if (user) {
            // Create minimal profile based on role - user completes profile after registration
            if (role === 'doctor') {
                // Create empty doctor profile - to be completed in profile settings
                await Doctor.create({
                    user_id: user.id,
                    is_verified: false,
                    verification_status: 'pending',
                });
            } else if (role === 'patient') {
                // Create empty patient profile - to be completed in profile settings
                await Patient.create({
                    user_id: user.id,
                });
            }

            // Send Welcome Email
            const loginLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/login`;
            await sendVerificationEmail(user.email, user.name, loginLink);

            res.status(201).json({
                message: 'Registration successful. Please check your email to verify your account.',
                userId: user.id
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Check Account Lockout
        if (user.locked_until && user.locked_until > new Date()) {
            const minutesLeft = Math.ceil((user.locked_until - new Date()) / 60000);
            return res.status(403).json({
                message: `Account locked. Try again in ${minutesLeft} minutes.`
            });
        }

        // Check Password
        if (await user.matchPassword(password)) {
            // Reset login attempts on success
            user.login_attempts = 0;
            user.locked_until = null;
            user.last_login = new Date();
            await user.save();

            // Fetch accessibility settings if patient
            let accessibilitySettings = user.accessibility_settings || {};
            if (user.role === 'patient') {
                const patient = await Patient.findOne({ where: { user_id: user.id } });
                if (patient && patient.accessibility_settings) {
                    accessibilitySettings = patient.accessibility_settings;
                }
            }

            res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                preferredLanguage: user.preferred_language || 'en',
                accessibilitySettings: accessibilitySettings,
                accessToken: generateAccessToken(user),
                refreshToken: generateRefreshToken(user),
            });
        } else {
            // Handle Failed Attempt
            user.login_attempts += 1;

            if (user.login_attempts >= 5) {
                user.locked_until = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 mins
                await user.save();
                return res.status(403).json({ message: 'Account locked due to too many failed attempts. Try again in 15 minutes.' });
            }

            await user.save();
            res.status(401).json({
                message: 'Invalid email or password',
                attemptsLeft: 5 - user.login_attempts
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Verify Email
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
    const { token } = req.body;

    try {
        const user = await User.findOne({ where: { email_verification_token: token } });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }

        user.email_verified = true;
        user.email_verification_token = null;
        user.status = 'active';
        await user.save();

        res.json({ message: 'Email verified successfully. You can now login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        res.json({
            accessToken: generateAccessToken(user)
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid refresh token' });
    }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate Reset Token
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.password_reset_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.password_reset_expires = Date.now() + 60 * 60 * 1000; // 1 hour
        await user.save();

        await sendPasswordResetEmail(user.email, resetToken);

        res.json({ message: 'Password reset link sent to email' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            where: {
                password_reset_token: hashedToken,
                password_reset_expires: { [Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.password = newPassword; // Will be hashed by model hook
        user.password_reset_token = null;
        user.password_reset_expires = null;
        await user.save();

        res.json({ message: 'Password reset successful. Please login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });

        let profile = null;
        let accessibilitySettings = user.accessibility_settings || {};

        if (user.role === 'doctor') {
            profile = await Doctor.findOne({ where: { user_id: user.id } });
        } else if (user.role === 'patient') {
            profile = await Patient.findOne({ where: { user_id: user.id } });
            if (profile && profile.accessibility_settings) {
                accessibilitySettings = profile.accessibility_settings;
            }
        }

        res.status(200).json({
            ...user.toJSON(),
            profile,
            accessibilitySettings,
            preferredLanguage: user.preferred_language || 'en'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    console.log('Profile update request received:', req.body);
    console.log('User from token:', req.user);

    try {
        const user = await User.findByPk(req.user.id);

        if (!user) {
            console.log('User not found:', req.user.id);
            return res.status(404).json({ message: 'User not found' });
        }

        console.log('Found user:', user.id, 'DB Role:', user.role, 'Type:', typeof user.role, 'Length:', user.role?.length);

        // Update basic user info if provided
        if (req.body.phone) {
            user.phone = req.body.phone;
            await user.save();
            console.log('Updated user phone');
        }

        // Update role-specific profile
        if (user.role === 'patient') {
            const {
                cnic,
                dateOfBirth,
                gender,
                bloodGroup,
                height,
                weight,
                address,
                emergencyContactPhone,
                allergies
            } = req.body;

            // Validate gender enum if provided
            if (gender && !['male', 'female', 'other'].includes(gender)) {
                return res.status(400).json({
                    message: 'Invalid gender. Must be one of: male, female, other'
                });
            }

            // Validate date format if provided
            if (dateOfBirth) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(dateOfBirth)) {
                    return res.status(400).json({
                        message: 'Invalid date format. Please use YYYY-MM-DD format.'
                    });
                }
                // Check if date is not in the future
                const birthDate = new Date(dateOfBirth);
                if (birthDate > new Date()) {
                    return res.status(400).json({
                        message: 'Date of birth cannot be in the future.'
                    });
                }
            }

            // Find or create patient profile
            let patient = await Patient.findOne({ where: { user_id: user.id } });

            // Prepare update data (only include defined values)
            const updateData = {};
            if (cnic !== undefined && cnic !== null && cnic !== '') updateData.cnic = cnic;
            if (dateOfBirth !== undefined && dateOfBirth !== null && dateOfBirth !== '') updateData.date_of_birth = dateOfBirth;
            if (gender !== undefined && gender !== null && gender !== '') updateData.gender = gender;
            if (bloodGroup !== undefined && bloodGroup !== null && bloodGroup !== '') updateData.blood_group = bloodGroup;
            if (height !== undefined && height !== null) updateData.height = height;
            if (weight !== undefined && weight !== null) updateData.weight = weight;
            if (address !== undefined && address !== null && address !== '') updateData.address = address;
            if (emergencyContactPhone !== undefined && emergencyContactPhone !== null && emergencyContactPhone !== '') {
                updateData.emergency_contact_phone = emergencyContactPhone;
            }
            if (allergies !== undefined) updateData.allergies = allergies || [];

            if (!patient) {
                // Create new profile - ensure required fields are present
                if (!updateData.cnic || !updateData.date_of_birth || !updateData.emergency_contact_phone) {
                    return res.status(400).json({
                        message: 'Please provide CNIC, Date of Birth, and Emergency Contact Phone to create your profile.',
                        missingFields: [
                            !updateData.cnic ? 'CNIC' : null,
                            !updateData.date_of_birth ? 'Date of Birth' : null,
                            !updateData.emergency_contact_phone ? 'Emergency Contact Phone' : null
                        ].filter(Boolean)
                    });
                }

                try {
                    patient = await Patient.create({
                        user_id: user.id,
                        ...updateData
                    });
                } catch (createError) {
                    console.error('Error creating patient profile:', createError);
                    // Check if it's a unique constraint violation (duplicate CNIC)
                    if (createError.name === 'SequelizeUniqueConstraintError') {
                        return res.status(400).json({
                            message: 'A profile with this CNIC already exists. Please use a different CNIC or contact support.',
                            error: 'DUPLICATE_CNIC'
                        });
                    }
                    throw createError; // Re-throw to be caught by outer catch
                }
            } else {
                    if (updateData.cnic && patient.cnic === updateData.cnic) {
                    delete updateData.cnic;
                }
                // Update existing profile
                try {
                    Object.assign(patient, updateData);
                    await patient.save();
                } catch (updateError) {
                    console.error('Error updating patient profile:', updateError);
                    // Check if it's a unique constraint violation (duplicate CNIC)
                    if (updateError.name === 'SequelizeUniqueConstraintError') {
                        return res.status(400).json({
                            message: 'A profile with this CNIC already exists. Please use a different CNIC or contact support.',
                            error: 'DUPLICATE_CNIC'
                        });
                    }
                    throw updateError; // Re-throw to be caught by outer catch
                }
            }

            console.log('Patient profile saved successfully');
            return res.json({ message: 'Profile updated successfully', profile: patient });

        } else if (user.role === 'doctor') {
            const {
                pmdcNumber,
                specialization,
                experience,
                consultationFee,
                bio,
                medicalCollege,
                passingYear,
                workingHours,
            } = req.body;

            // Find or create doctor profile
            let doctor = await Doctor.findOne({ where: { user_id: user.id } });

            if (!doctor) {
                doctor = await Doctor.create({
                    user_id: user.id,
                    pmdc_number: pmdcNumber,
                    specialization,
                    experience_years: experience,
                    consultation_fee: consultationFee,
                    bio,
                    medical_college: medicalCollege,
                    passing_year: passingYear,
                    is_verified: false,
                    verification_status: 'pending',
                });
            } else {
                // Update existing profile (except verified PMDC if already approved)
                if (pmdcNumber && doctor.verification_status !== 'approved') {
                    doctor.pmdc_number = pmdcNumber;
                }
                if (specialization) doctor.specialization = specialization;
                if (experience !== undefined) doctor.experience_years = experience;
                if (consultationFee !== undefined) doctor.consultation_fee = consultationFee;
                if (bio !== undefined) doctor.bio = bio;
                if (medicalCollege) doctor.medical_college = medicalCollege;
                if (passingYear !== undefined) doctor.passing_year = passingYear;
                if (workingHours !== undefined) doctor.working_hours = workingHours;

                await doctor.save();
            }

            if (doctor.verification_status === 'pending') {
                console.log('Doctor profile submitted for verification (pending)');
            }

            console.log('Doctor profile saved successfully');
            res.json({
                message: 'Profile updated successfully',
                profile: doctor,
                verificationStatus: doctor.verification_status
            });
        } else {
            console.log('Invalid role:', user.role);
            res.status(400).json({ message: 'Invalid role for profile update' });
        }

    } catch (error) {
        console.error('Profile Update Error:', error);
        console.error('Error stack:', error.stack);

        // Handle specific database errors
        if (error.name === 'SequelizeValidationError') {
            const validationErrors = error.errors.map(e => e.message).join(', ');
            return res.status(400).json({
                message: `Validation error: ${validationErrors}`,
                errors: error.errors
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'A record with this information already exists. Please check your CNIC or other unique fields.',
                error: 'UNIQUE_CONSTRAINT_VIOLATION'
            });
        }

        if (error.name === 'SequelizeDatabaseError') {
            return res.status(400).json({
                message: 'Database error. Please check your input data and try again.',
                error: error.message
            });
        }

        res.status(500).json({
            message: 'Server error while updating profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
        });
    }
};

// @desc    Update user language preference
// @route   PUT /api/auth/language
// @access  Private
const updateLanguage = async (req, res) => {
    const { language } = req.body;

    if (!language) {
        return res.status(400).json({ message: 'Language is required' });
    }

    try {
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.preferred_language = language;
        await user.save();

        res.json({ message: 'Language updated successfully', language: user.preferred_language });
    } catch (error) {
        console.error('Update Language Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getMe,
    verifyEmail,
    refreshToken,
    forgotPassword,
    resetPassword,
    updateProfile,
    updateLanguage
};
