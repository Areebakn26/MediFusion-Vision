# Testing Chapter Guide - MediFusion Vision

This guide explains how to use the testing chapter document and the test files created for your Final Year Project.

## 📋 What Was Created

### 1. Testing Chapter Document
**File:** `Chapter_5_Testing_and_Evaluation.md`

This is your complete testing chapter following the FYP template. It includes:
- **Unit Testing** (5.1) - Tests for individual functions
- **Functional Testing** (5.2) - Tests for user-facing features
- **Business Rules Testing** (5.3) - Decision table based testing
- **Integration Testing** (5.4) - Tests for module interactions
- **Test Summary** (5.5) - Overall results and findings

### 2. Test Implementation Files
**Location:** `server/tests/`

- `unit/validators.test.js` - Unit tests for email validation
- `unit/scanValidation.test.js` - Unit tests for scan file validation
- `integration/appointment.test.js` - Integration tests for appointment system
- `setup.js` - Jest configuration setup
- `README.md` - Testing guide

### 3. Supporting Files
- `server/utils/validators.js` - Email validation function
- `server/jest.config.js` - Jest test configuration
- `server/package.json` - Updated with test scripts

## 🚀 How to Use This Chapter

### Step 1: Review the Testing Chapter
1. Open `Chapter_5_Testing_and_Evaluation.md`
2. Review all test cases and ensure they match your system
3. Update test cases with your actual test results when you run them

### Step 2: Install Testing Dependencies
```bash
cd server
npm install --save-dev jest supertest
```

### Step 3: Run the Tests
```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Step 4: Update Test Results
After running tests, update the "Actual Result" and "Result" columns in the testing chapter document with your real test outcomes.

## 📊 Test Coverage

The testing chapter covers:

### Unit Tests (19 test cases)
- Email validation function
- Scan file validation
- Password hashing and matching

### Functional Tests (20 test cases)
- Login with different roles
- User registration
- Appointment booking
- Scan upload and analysis

### Business Rules Tests (20 test cases)
- Appointment cancellation refund policy
- Account lockout policy
- Doctor verification status
- Appointment time validation

### Integration Tests (12 test cases)
- Appointment scheduling (Patient ↔ Doctor ↔ Scheduler)
- Scan upload and AI analysis
- User registration and profile completion
- Payment processing

**Total: 71 test cases**

## 📝 Customizing for Your System

### 1. Update Test Credentials
In the functional tests, update the test credentials to match your seed data:
```javascript
// Update these in the test files
Username: 'admin@medifusion.com'
Username: 'doctor@medifusion.com'
Username: 'patient@medifusion.com'
```

### 2. Add More Test Cases
You can add more test cases following the same format:
- Add rows to the test tables
- Update the test count in the summary
- Implement the tests in the test files

### 3. Update Business Rules
If your business rules differ, update:
- The decision tables in section 5.3
- The test cases accordingly
- The expected results

## 🎯 Key Features of This Testing Chapter

1. **Follows FYP Template** - Matches the exact format you provided
2. **Comprehensive Coverage** - Covers all major system components
3. **Decision Tables** - Includes business rules testing with decision tables
4. **Integration Focus** - Emphasizes module interactions (important for team projects)
5. **Practical Implementation** - Includes actual test code you can run

## 📌 Important Notes

1. **Test Environment**: Make sure to set up a test database separate from your development database
2. **Test Data**: The integration tests create and clean up test data automatically
3. **Mock Services**: Some services (like email) are mocked - update these if needed
4. **Actual Results**: You need to run the tests and fill in the "Actual Result" column

## 🔧 Troubleshooting

### Tests not running?
- Make sure Jest is installed: `npm install --save-dev jest`
- Check that `jest.config.js` exists
- Verify test file paths match the pattern in `jest.config.js`

### Integration tests failing?
- Ensure test database is set up
- Check that models are properly synced
- Verify environment variables are set correctly

### Need help?
- Review the test files in `server/tests/`
- Check the `README.md` in the tests directory
- Refer to Jest documentation: https://jestjs.io/

## ✅ Checklist Before Submission

- [ ] All test cases have "Actual Result" filled in
- [ ] All test cases have "Result" (Pass/Fail) marked
- [ ] Test summary table is updated with actual results
- [ ] Decision tables match your business rules
- [ ] Integration test scenarios match your system architecture
- [ ] Test code is working (optional but recommended)
- [ ] Screenshots of test results (if required by your supervisor)

## 📚 Additional Resources

- Jest Documentation: https://jestjs.io/docs/getting-started
- Supertest Documentation: https://github.com/visionmedia/supertest
- Decision Table Testing: https://www.guru99.com/decision-table-testing.html

---

**Good luck with your FYP!** 🎓

If you need any modifications or have questions, feel free to ask.

