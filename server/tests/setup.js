/**
 * Jest setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.DB_NAME = 'medifusionvision_test';
process.env.CLIENT_URL = 'http://localhost:5173';

// Increase timeout for integration tests
jest.setTimeout(30000);

