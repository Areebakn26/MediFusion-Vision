const express = require('express');
const router = express.Router();
const {
    bookAppointment,
    getAppointments,
    updateAppointmentStatus,
    checkAvailability,
    cancelAppointment,
    rescheduleAppointment,
    getAvailableSlots,
    markNoShow
} = require('../controllers/appointmentController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, requireRole(['patient']), bookAppointment);
router.get('/', protect, getAppointments);
router.get('/check-availability', checkAvailability);
router.get('/available-slots', getAvailableSlots);

router.put('/:id/status', protect, requireRole(['doctor', 'admin']), updateAppointmentStatus);
router.put('/:id/reschedule', protect, requireRole(['patient']), rescheduleAppointment);
router.post('/:id/mark-no-show', protect, requireRole(['doctor']), markNoShow);
router.delete('/:id', protect, cancelAppointment);

module.exports = router;
