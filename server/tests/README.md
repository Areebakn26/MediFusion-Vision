# Testing Guide for MediFusion Vision

This directory contains unit tests and integration tests for the MediFusion Vision system.

## Setup

1. Install testing dependencies:
```bash
npm install --save-dev jest supertest
```

2. Update `server/package.json` to include test scripts:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## Running Tests

### Run all tests:
```bash
npm test
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Run tests with coverage:
```bash
npm run test:coverage
```

### Run specific test file:
```bash
npm test validators.test.js
```

## Test Structure

- `unit/` - Unit tests for individual functions and modules
- `integration/` - Integration tests for module interactions

## Test Files

1. **validators.test.js** - Tests for email validation function
2. **scanValidation.test.js** - Tests for scan file validation
3. **appointment.test.js** - Integration tests for appointment system

## Notes

- Tests use Jest as the testing framework
- Integration tests require a test database to be set up
- Make sure to configure test environment variables in `.env.test`

