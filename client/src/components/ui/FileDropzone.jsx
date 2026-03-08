import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const FileDropzone = ({
    onFileSelect,
    accept = { 'image/*': [] },
    maxSize = 10485760, // 10MB
    multiple = false,
    className = ''
}) => {
    const { t } = useTranslation();

    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            onFileSelect(multiple ? acceptedFiles : acceptedFiles[0]);
        }
    }, [onFileSelect, multiple]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept,
        maxSize,
        multiple,
    });

    return (
        <motion.div
            {...getRootProps()}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className={clsx(
                'relative border-2 border-dashed rounded-2xl p-8',
                'bg-white/50 backdrop-blur-sm transition-all duration-300',
                'cursor-pointer group',
                isDragActive && !isDragReject && 'border-primary-blue bg-primary-blue/5 shadow-glow',
                isDragReject && 'border-red-400 bg-red-50',
                !isDragActive && 'border-gray-300 hover:border-primary-teal hover:bg-primary-teal/5',
                className
            )}
        >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center justify-center text-center space-y-4">
                {/* Upload Icon */}
                <motion.div
                    animate={{ y: isDragActive ? -5 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={clsx(
                        'p-4 rounded-full transition-colors',
                        isDragActive ? 'bg-primary-blue/20' : 'bg-gray-100 group-hover:bg-primary-teal/20'
                    )}
                >
                    <svg
                        className={clsx(
                            'w-12 h-12 transition-colors',
                            isDragActive ? 'text-primary-blue' : 'text-gray-400 group-hover:text-primary-teal'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                </motion.div>

                {/* Text */}
                <div>
                    {isDragActive ? (
                        <p className="text-lg font-medium text-primary-blue">
                            {multiple ? t('dropFilesHere_msg', 'Drop the files here...') : t('dropFileHere_msg', 'Drop the file here...')}
                        </p>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-gray-700">
                                {multiple ? t('dragDropFiles_msg', 'Drag & drop files here') : t('dragDropFile_msg', 'Drag & drop a file here')}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {t('clickToBrowse_msg', 'or click to browse')}
                            </p>
                        </>
                    )}
                </div>

                {/* File info */}
                <div className="text-xs text-gray-400">
                    <p>{t('supportedFormats_msg', 'Supported formats:')} {Object.keys(accept).join(', ')}</p>
                    <p>{t('maxSize_msg', 'Max size:')} {(maxSize / 1048576).toFixed(0)}MB</p>
                </div>
            </div>

            {/* Animated border glow */}
            {isDragActive && (
                <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                        boxShadow: '0 0 20px rgba(80, 201, 206, 0.5)',
                    }}
                />
            )}
        </motion.div>
    );
};

export default FileDropzone;
