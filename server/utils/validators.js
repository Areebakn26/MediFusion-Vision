/**
 * Email validation utility function
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if email is valid, false otherwise
 */
const validateEmail = (email) => {
    if (!email || typeof email !== 'string') {
        return false;
    }
    
    // Basic email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Check if email matches the pattern
    return emailRegex.test(email.trim());
};

module.exports = { validateEmail };

