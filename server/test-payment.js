const { Doctor, Patient, User, Appointment, sequelize } = require('./models');

async function testQuery() {
    try {
        await sequelize.authenticate();
        console.log("DB connected");

        // Simulate doctor fetch
        const doctorId = "747dfe4e-ff28-432b-a2f5-b7019b249b2f"; // from previous logs
        const doctor = await Doctor.findByPk(doctorId, {
            include: [{ model: User, attributes: ['name', 'email'] }]
        });
        console.log("Doctor found:", !!doctor);
        if (doctor) {
            console.log("Fee:", doctor.consultation_fee);
        }

        process.exit(0);
    } catch (err) {
        console.error("Crash:", err);
        process.exit(1);
    }
}
testQuery();
