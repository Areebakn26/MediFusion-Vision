const sharp = require('sharp');
const fileType = require('file-type');
const sizeOf = require('image-size');

/**
 * Validate file type using magic numbers
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<Object>} - File type info
 */
const validateFileType = async (buffer) => {
    try {
        const type = await fileType.fromBuffer(buffer);

        if (!type) {
            return { valid: false, message: 'Unknown file type' };
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/dicom'];
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'tif', 'tiff', 'dcm'];

        if (!allowedTypes.includes(type.mime) && !allowedExtensions.includes(type.ext)) {
            return {
                valid: false,
                message: `File type ${type.mime} not allowed. Allowed: JPEG, PNG, TIFF, DICOM`
            };
        }

        return {
            valid: true,
            fileType: type.mime,
            extension: type.ext
        };
    } catch (error) {
        console.error('File type validation error:', error);
        return { valid: false, message: 'Error validating file type' };
    }
};

/**
 * Validate image quality (resolution, clarity)
 * @param {String} filePath - Path to image file
 * @returns {Promise<Object>} - Quality validation result
 */
const validateImageQuality = async (filePath) => {
    try {
        const dimensions = sizeOf(filePath);

        // Minimum resolution check
        const minWidth = 512;
        const minHeight = 512;

        if (dimensions.width < minWidth || dimensions.height < minHeight) {
            return {
                valid: false,
                message: `Image resolution too low. Minimum: ${minWidth}x${minHeight}. Got: ${dimensions.width}x${dimensions.height}`,
                dimensions
            };
        }

        // Use sharp to analyze image quality
        const metadata = await sharp(filePath).metadata();

        // Basic quality score (can be enhanced with ML)
        let qualityScore = 1.0;

        // Penalize very small files (likely compressed/low quality)
        const stats = await sharp(filePath).stats();
        if (stats.isOpaque === false) {
            qualityScore -= 0.1; // Transparency might indicate screenshot
        }

        return {
            valid: true,
            dimensions: {
                width: dimensions.width,
                height: dimensions.height
            },
            qualityScore: Math.max(0, qualityScore),
            metadata
        };
    } catch (error) {
        console.error('Image quality validation error:', error);
        return { valid: false, message: 'Error validating image quality' };
    }
};

/**
 * Validate scan authenticity (basic checks)
 * @param {String} filePath - Path to image file
 * @param {String} scanType - Type of scan (mri_brain, retinal, etc.)
 * @returns {Promise<Object>} - Authenticity validation result
 */
const validateScanAuthenticity = async (filePath, scanType) => {
    try {
        // Basic authenticity checks
        // In production, this would use ML models to detect:
        // - Photos of scans vs actual scans
        // - Edited/manipulated images
        // - Screenshots

        const metadata = await sharp(filePath).metadata();

        let isAuthentic = true;
        let confidence = 0.9;
        const warnings = [];

        // Check for common screenshot indicators
        if (metadata.density && metadata.density < 72) {
            warnings.push('Low DPI - might be a screenshot');
            confidence -= 0.2;
        }

        // Check for EXIF data (medical scans usually have specific metadata)
        if (!metadata.exif && scanType !== 'external') {
            warnings.push('Missing EXIF data');
            confidence -= 0.1;
        }

        // Flag for manual review if confidence is low
        if (confidence < 0.7) {
            isAuthentic = false;
        }

        return {
            valid: true,
            isAuthentic,
            confidence,
            warnings,
            requiresManualReview: !isAuthentic
        };
    } catch (error) {
        console.error('Scan authenticity validation error:', error);
        return { valid: false, message: 'Error validating scan authenticity' };
    }
};

/**
 * Extract metadata from image
 * @param {String} filePath - Path to image file
 * @returns {Promise<Object>} - Extracted metadata
 */
const extractMetadata = async (filePath) => {
    try {
        const metadata = await sharp(filePath).metadata();

        // Extract EXIF data if available
        const exifData = metadata.exif ? {
            make: metadata.exif.Make,
            model: metadata.exif.Model,
            dateTime: metadata.exif.DateTime,
            software: metadata.exif.Software
        } : null;

        // For DICOM files, additional parsing would be needed
        // Using dicom-parser library (to be added if needed)

        return {
            format: metadata.format,
            width: metadata.width,
            height: metadata.height,
            space: metadata.space,
            channels: metadata.channels,
            depth: metadata.depth,
            density: metadata.density,
            hasAlpha: metadata.hasAlpha,
            exif: exifData,
            size: metadata.size
        };
    } catch (error) {
        console.error('Metadata extraction error:', error);
        return null;
    }
};

module.exports = {
    validateFileType,
    validateImageQuality,
    validateScanAuthenticity,
    extractMetadata
};
