/**
 * Unit Tests for Validators
 * Tests the validateEmail() function with various inputs
 */

const { validateEmail } = require('../../utils/validators');

describe('validateEmail() function', () => {
    // Test Case 1: Valid email
    test('should return true for valid email (abc@gmail.com)', () => {
        const result = validateEmail('abc@gmail.com');
        expect(result).toBe(true);
    });

    // Test Case 2: Invalid email without @
    test('should return false for email without @ (abc.gmail.com)', () => {
        const result = validateEmail('abc.gmail.com');
        expect(result).toBe(false);
    });

    // Test Case 3: Empty string
    test('should return false for empty string', () => {
        const result = validateEmail('');
        expect(result).toBe(false);
    });

    // Test Case 4: Invalid email missing domain
    test('should return false for email missing domain (abc@)', () => {
        const result = validateEmail('abc@');
        expect(result).toBe(false);
    });

    // Test Case 5: Invalid email missing TLD
    test('should return false for email missing TLD (abc@domain)', () => {
        const result = validateEmail('abc@domain');
        expect(result).toBe(false);
    });

    // Test Case 6: Valid email with subdomain
    test('should return true for valid email with subdomain (user@mail.example.com)', () => {
        const result = validateEmail('user@mail.example.com');
        expect(result).toBe(true);
    });

    // Test Case 7: Null value
    test('should return false for null value', () => {
        const result = validateEmail(null);
        expect(result).toBe(false);
    });

    // Test Case 8: Undefined value
    test('should return false for undefined value', () => {
        const result = validateEmail(undefined);
        expect(result).toBe(false);
    });

    // Additional edge cases
    test('should return false for email with spaces', () => {
        const result = validateEmail('abc @gmail.com');
        expect(result).toBe(false);
    });

    test('should return true for email with numbers', () => {
        const result = validateEmail('user123@example.com');
        expect(result).toBe(true);
    });

    test('should return true for email with special characters', () => {
        const result = validateEmail('user.name+tag@example.co.uk');
        expect(result).toBe(true);
    });
});

