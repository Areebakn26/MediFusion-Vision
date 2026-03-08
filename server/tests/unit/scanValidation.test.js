/**
 * Unit Tests for Scan Validation
 * Tests the validateScan() function with different file types and sizes
 */

const { validateScan } = require('../../utils/scanValidation');
const path = require('path');

describe('validateScan() function', () => {
    // Test Case 1: Valid MRI DICOM file
    test('should return empty errors for valid MRI DICOM file', () => {
        const mockFile = {
            originalname: 'brain_scan.dcm',
            size: 5 * 1024 * 1024 // 5MB
        };
        const errors = validateScan(mockFile, 'MRI');
        expect(errors).toEqual([]);
    });

    // Test Case 2: Invalid file type for MRI
    test('should return error for invalid file type (document.txt for MRI)', () => {
        const mockFile = {
            originalname: 'document.txt',
            size: 1 * 1024 * 1024 // 1MB
        };
        const errors = validateScan(mockFile, 'MRI');
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.includes('Invalid file type'))).toBe(true);
    });

    // Test Case 3: File exceeding size limit
    test('should return error for file exceeding size limit (60MB image)', () => {
        const mockFile = {
            originalname: 'large.jpg',
            size: 60 * 1024 * 1024 // 60MB
        };
        const errors = validateScan(mockFile, 'Retinal');
        expect(errors.some(e => e.includes('too large'))).toBe(true);
    });

    // Test Case 4: Valid Retinal scan
    test('should return empty errors for valid Retinal scan', () => {
        const mockFile = {
            originalname: 'retina.png',
            size: 2 * 1024 * 1024 // 2MB
        };
        const errors = validateScan(mockFile, 'Retinal');
        expect(errors).toEqual([]);
    });

    // Test Case 5: Null file
    test('should return error for null file', () => {
        const errors = validateScan(null, 'MRI');
        expect(errors).toEqual(['No file uploaded.']);
    });

    // Test Case 6: Valid Report type PDF
    test('should return empty errors for valid Report PDF', () => {
        const mockFile = {
            originalname: 'report.pdf',
            size: 3 * 1024 * 1024 // 3MB
        };
        const errors = validateScan(mockFile, 'Report');
        expect(errors).toEqual([]);
    });

    // Test Case 7: Invalid file type for Report
    test('should return error for image file when Report type expected', () => {
        const mockFile = {
            originalname: 'image.jpg',
            size: 1 * 1024 * 1024 // 1MB
        };
        const errors = validateScan(mockFile, 'Report');
        expect(errors.some(e => e.includes('document files'))).toBe(true);
    });

    // Test Case 8: Report file exceeding size limit
    test('should return error for report file exceeding 10MB limit', () => {
        const mockFile = {
            originalname: 'large_report.pdf',
            size: 15 * 1024 * 1024 // 15MB
        };
        const errors = validateScan(mockFile, 'Report');
        expect(errors.some(e => e.includes('too large'))).toBe(true);
    });
});

