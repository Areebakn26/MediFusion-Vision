const path = require('path');

const ALLOWED_EXTENSIONS = ['.dcm', '.dicom', '.jpg', '.jpeg', '.png', '.tiff', '.pdf', '.doc', '.txt'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.tiff', '.dcm', '.dicom'];
const REPORT_EXTENSIONS = ['.pdf', '.doc', '.txt'];

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_REPORT_SIZE = 10 * 1024 * 1024; // 10MB

const validateScan = (file, scanType) => {
    const errors = [];

    if (!file) {
        return ['No file uploaded.'];
    }

    const ext = path.extname(file.originalname).toLowerCase();

    // 1. File Type Validation
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`Invalid file type: ${ext}. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
    }

    // 2. File Size Validation
    if (IMAGE_EXTENSIONS.includes(ext)) {
        if (file.size > MAX_IMAGE_SIZE) {
            errors.push(`Image file too large. Max: 50MB.`);
        }
    } else if (REPORT_EXTENSIONS.includes(ext)) {
        if (file.size > MAX_REPORT_SIZE) {
            errors.push(`Report file too large. Max: 10MB.`);
        }
    }

    // 3. Scan-Type Specific Logic (Mocked for now as we don't have real DICOM parsers installed yet)
    if (scanType === 'MRI') {
        if (!['.dcm', '.dicom'].includes(ext)) {
            // For MVP, we might allow images too, but strictly speaking MRI should be DICOM
            // errors.push('MRI scans must be in DICOM format (.dcm, .dicom)');
        }
    } else if (scanType === 'Retinal') {
        // Retinal scans are usually high-res images
        if (!IMAGE_EXTENSIONS.includes(ext)) {
            errors.push('Retinal scans must be image files.');
        }
    } else if (scanType === 'Report') {
        if (!REPORT_EXTENSIONS.includes(ext)) {
            errors.push('Medical reports must be document files (.pdf, .doc, .txt)');
        }
    }

    return errors;
};

module.exports = { validateScan };
