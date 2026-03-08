const { sequelize, User, Doctor, Patient } = require('./models');
const dotenv = require('dotenv');

dotenv.config();

const seedData = async () => {
    try {
        await sequelize.sync({ force: true }); // WARNING: This clears the DB
        console.log('Database Synced & Cleared');

        // Create Users (Password hashing is handled by User hooks)
        const adminUser = await User.create({
            name: 'Admin User',
            email: 'medifusionvision@gmail.com',
            password: '12345678',
            role: 'admin',
            phone: '1234567890'
        });

        const doctorUser = await User.create({
            name: 'Dr. Sarah Khan',
            email: 'doctor@example.com',
            password: 'password123',
            role: 'doctor',
            phone: '03001234567'
        });

        const patientUser = await User.create({
            name: 'Ali Raza',
            email: 'patient@example.com',
            password: 'password123',
            role: 'patient',
            phone: '03007654321'
        });

        // Create Profiles
        await Doctor.create({
            user_id: doctorUser.id,
            specialization: 'Cardiologist',
            experience_years: 12,
            medical_college: 'King Edward Medical University',
            passing_year: 2010,
            license_number: '12345-P',
            bio: 'Expert in heart diseases with over a decade of experience.',
            consultation_fee: 2000,
            availability_schedule: {
                "Monday": ["10:00-14:00"],
                "Wednesday": ["10:00-14:00"],
                "Friday": ["15:00-18:00"]
            },
            is_verified: true,
            verification_status: 'approved'
        });

        await Patient.create({
            user_id: patientUser.id,
            date_of_birth: '1995-05-15',
            gender: 'male',
            blood_group: 'B+',
            height: 175,
            weight: 70,
            address: 'House 123, Street 4, Lahore',
            emergency_contact_phone: '03001112222',
            allergies: ['Peanuts', 'Penicillin']
        });

        console.log('Database Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
