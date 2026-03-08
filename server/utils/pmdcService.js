/**
 * Mock PMDC Verification Service
 * Simulates checking a PMDC number against an official database.
 * 
 * @param {string} pmdcNumber - The PMDC number to verify
 * @returns {Promise<boolean>} - Returns true if valid, false otherwise
 */
const verifyPMDC = async (pmdcNumber) => {
    return new Promise((resolve) => {
        // Simulate network delay
        setTimeout(() => {
            // Mock Logic: 
            // - PMDC numbers starting with '123' are considered VALID.
            // - All others are INVALID.
            // - In a real app, this would be an API call to PMDC.

            const isValid = pmdcNumber.startsWith('123');
            console.log(`[Mock PMDC Service] Verifying ${pmdcNumber}... Result: ${isValid ? 'Valid' : 'Invalid'}`);
            resolve(isValid);
        }, 1000);
    });
};

module.exports = { verifyPMDC };
