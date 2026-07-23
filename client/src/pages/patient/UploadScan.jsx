import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { GlassCard, Button, Input, FileDropzone } from '../../components/ui';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const UploadScan = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [validationWarnings, setValidationWarnings] = useState([]);

    // Phase 4: New fields
    const [formData, setFormData] = useState({
        scanType: '',
        bodyPart: '',
        facilityName: '',
        takenDate: '',
        notes: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileSelect = (selectedFile) => {
        setFile(selectedFile);
        setValidationWarnings([]);
    };

    const handleUpload = async () => {
        if (!file || !formData.scanType || !formData.bodyPart) {
            toast.error('Please fill in all required fields');
            return;
        }

        setUploading(true);
        setProgress(0);

        try {
            const data = new FormData();
            data.append('scan', file);
            data.append('scanType', formData.scanType);
            data.append('bodyPart', formData.bodyPart);
            data.append('facilityName', formData.facilityName);
            data.append('takenDate', formData.takenDate);
            data.append('notes', formData.notes);

            // Phase 4: Upload to external endpoint
            const response = await api.post('/scans/external', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setProgress(percentCompleted);
                }
            });

            // Show validation warnings if any
            if (response.data.validationWarnings?.length > 0) {
                setValidationWarnings(response.data.validationWarnings);
            }

            toast.success('Scan uploaded successfully!');
            navigate('/patient/scans');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error.response?.data?.message || 'Error uploading scan');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold mb-2 text-accent">
                        {t('uploadMedicalScan_title', 'Upload Medical Scan')}
                    </h1>
                    <p className="text-foreground-muted">
                        {t('uploadMedicalScan_subtitle', 'Upload your MRI, Retinal, X-Ray, CT, or Ultrasound scan for AI analysis')}
                    </p>
                </motion.div>

                <GlassCard className="p-8">
                    <div className="space-y-6">
                        {/* Scan Type & Body Part */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                    {t('scanType_label', 'Scan Type')} <span className="text-error">*</span>
                                </label>
                                <select
                                    name="scanType"
                                    value={formData.scanType}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                                >
                                    <option value="">{t('selectScanType_opt', 'Select scan type')}</option>
                                    <option value="mri_brain">{t('mriBrain_opt', 'MRI Brain')}</option>
                                    <option value="retinal">{t('retinalScan_opt', 'Retinal Scan')}</option>
                                    <option value="xray">{t('xray_opt', 'X-Ray')}</option>
                                    <option value="ct_scan">{t('ctScan_opt', 'CT Scan')}</option>
                                    <option value="ultrasound">{t('ultrasound_opt', 'Ultrasound')}</option>
                                </select>
                            </div>

                            <Input
                                label={<>{t('bodyPart_label', 'Body Part')} <span className="text-error">*</span></>}
                                name="bodyPart"
                                type="text"
                                placeholder="e.g., Brain, Left Eye, Chest"
                                value={formData.bodyPart}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Facility & Date */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label={t('facilityName_label', 'Facility Name')}
                                name="facilityName"
                                type="text"
                                placeholder="e.g., City Hospital"
                                value={formData.facilityName}
                                onChange={handleChange}
                            />

                            <Input
                                label={t('dateTaken_label', 'Date Taken')}
                                name="takenDate"
                                type="date"
                                max={new Date().toISOString().split('T')[0]}
                                value={formData.takenDate}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                {t('additionalNotes_label', 'Additional Notes')}
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows="3"
                                placeholder="Any additional information about the scan..."
                                className="w-full px-4 py-3 rounded-xl bg-surface-secondary border border-white/[0.06] focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
                            />
                        </div>

                        {/* File Dropzone */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-foreground-muted">
                                {t('uploadScanFile_label', 'Upload Scan File')} <span className="text-error">*</span>
                            </label>
                            <FileDropzone
                                onFileSelect={handleFileSelect}
                                accept={{
                                    'image/*': ['.jpg', '.jpeg', '.png', '.dcm', '.dicom']
                                }}
                                maxSize={52428800} // 50MB
                            />
                            {file && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-4 p-4 bg-success/10 rounded-xl border border-success/20"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                                                <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-medium text-foreground">{file.name}</p>
                                                <p className="text-sm text-foreground-muted">
                                                    {(file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFile(null)}
                                            className="text-error hover:text-error text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Validation Warnings */}
                        {validationWarnings.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-warning/10 rounded-xl border border-warning/20"
                            >
                                <h4 className="font-semibold text-warning mb-2">⚠️ Validation Warnings:</h4>
                                <ul className="list-disc list-inside text-sm text-warning space-y-1">
                                    {validationWarnings.map((warning, index) => (
                                        <li key={index}>{warning}</li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}

                        {/* Upload Progress */}
                        {uploading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-2"
                            >
                                <div className="flex justify-between text-sm font-medium text-foreground-muted">
                                    <span>Uploading & Analyzing...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-surface-secondary rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        className="h-full bg-accent rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2 pt-4">
                            <Button
                                onClick={handleUpload}
                                disabled={!file || !formData.scanType || !formData.bodyPart || uploading}
                                className="w-full"
                            >
                                {uploading ? 'Processing...' : t('upload.submit', 'Submit Scan')}
                            </Button>
                            {(!file || !formData.scanType || !formData.bodyPart) && !uploading && (
                                <p className="text-xs text-error text-center animate-pulse">
                                    {t('upload.selectFileFirst', 'Please select a file and required fields to continue')}
                                </p>
                            )}
                            <Button
                                variant="secondary"
                                onClick={() => navigate('/patient/scans')}
                                disabled={uploading}
                                className="w-full"
                            >
                                {t('cancel_btn', 'Cancel')}
                            </Button>
                        </div>
                    </div>
                </GlassCard>

                {/* Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                >
                    <GlassCard className="p-6">
                        <h3 className="font-semibold text-foreground mb-3">📋 {t('uploadGuidelines_title', 'Upload Guidelines:')}</h3>
                        <ul className="text-sm text-foreground-muted space-y-2">
                            <li>• {t('guideline1_msg', 'Supported formats: JPG, PNG, DICOM (.dcm)')}</li>
                            <li>• {t('guideline2_msg', 'Maximum file size: 50MB')}</li>
                            <li>• {t('guideline3_msg', 'Ensure the scan image is clear and properly oriented')}</li>
                            <li>• {t('guideline4_msg', 'AI analysis typically takes 30-60 seconds')}</li>
                            <li>• {t('guideline5_msg', 'You\'ll receive a notification when the analysis is complete')}</li>
                        </ul>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
};

export default UploadScan;
