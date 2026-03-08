const moment = require('moment-timezone');

/**
 * Timezone Utility for converting and calculating appointment times accurately
 * across different geographical boundaries.
 */

// Parses a date (YYYY-MM-DD) and a time string (e.g., "09:30 AM") 
// in the doctor's specific timezone to a UTC Date object.
const getRegionalTime = (dateStr, timeStr, timezone = 'Asia/Karachi') => {
    return moment.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD hh:mm A", timezone).toDate();
};

// Gets the current moment in a specific timezone
const getCurrentRegionalTime = (timezone = 'Asia/Karachi') => {
    return moment.tz(timezone);
};

// Calculates exact hours between now and a scheduled event
const getHoursUntil = (dateStr, timeStr, timezone = 'Asia/Karachi') => {
    const aptTime = moment.tz(`${dateStr} ${timeStr}`, "YYYY-MM-DD hh:mm A", timezone);
    const now = moment();
    return aptTime.diff(now, 'hours', true);
};

// Format a universal date to a local string for user-facing views or emails
const formatLocalized = (dateObj, timezone = 'Asia/Karachi', formatStr = 'YYYY-MM-DD hh:mm A') => {
    return moment(dateObj).tz(timezone).format(formatStr);
};

module.exports = {
    getRegionalTime,
    getCurrentRegionalTime,
    getHoursUntil,
    formatLocalized,
    moment
};
