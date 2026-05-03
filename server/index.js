const express = require('express'); 
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { sequelize } = require('./models');
const { ChatLog } = require('./models');
const initCronJobs = require('./appointmentReminders');
const { initRetrainingCron } = require('./jobs/retrainingTrigger');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/scans', require('./routes/scanRoutes'));
app.use('/api/consultation', require('./routes/consultationRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/patient', require('./routes/patientSettingsRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));

// Serve Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database Health Check
app.get('/api/health/db', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({
            status: 'connected',
            database: sequelize.getDatabaseName(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Socket.io Logic
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_room', (data) => {
        socket.join(data);
        console.log(`User with ID: ${socket.id} joined room: ${data}`);
    });

    socket.on('send_message', async (data) => {
        try {
            await ChatLog.create({
                appointment_id: data.appointmentId,
                sender_id: data.author,
                message: data.message
            });
        } catch (err) {
            console.error("Error saving chat:", err);
        }
        socket.to(data.room).emit('receive_message', data);
    });

    socket.on('send_note', async (data) => {
        // Broadcast note to room
        socket.to(data.room).emit('receive_note', {
            ...data,
            createdAt: new Date().toISOString()
        });
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// Database sync and server start
const startServer = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connected successfully.');

        // SAFE sync - only creates NEW tables, never alters or drops existing ones
        // This protects all registered user data from being wiped on server restarts
        // To add new columns, use: node scripts/migrate.js (run once manually)
        await sequelize.sync({ alter: false, force: false });
        console.log('Database models synchronized (safe mode - data preserved).');

        // Initialize background jobs
        initCronJobs();
        initRetrainingCron();

        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to start server:', error);
        process.exit(1);
    }
};

// Export app for testing
module.exports = app;

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
