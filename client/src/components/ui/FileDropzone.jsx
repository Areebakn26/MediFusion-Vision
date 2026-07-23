import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

const FileDropzone = ({
    onFileSelect,
    accept = { 'image/*': [] },
    maxSize = 10485760,
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
                'bg-surface-secondary/60 backdrop-blur-sm transition-all duration-300',
                'cursor-pointer group',
                isDragActive && !isDragReject && 'border-accent bg-accent-subtle shadow-card-hover',
                isDragReject && 'border-error bg-error/10',
                !isDragActive && 'border-white/[0.12] hover:border-accent/50 hover:bg-accent-subtle/30',
                className
            )}
        >
            <input {...getInputProps()} />

            <div className="flex flex-col items-center justify-center text-center space-y-4">
                <motion.div
                    animate={{ y: isDragActive ? -5 : 0 }}
                    transition={{ duration: 0.2 }}
                    className={clsx(
                        'p-4 rounded-full transition-colors',
                        isDragActive ? 'bg-accent-subtle' : 'bg-surface-tertiary group-hover:bg-accent-subtle/50'
                    )}
                >
                    <svg
                        className={clsx(
                            'w-12 h-12 transition-colors',
                            isDragActive ? 'text-accent' : 'text-foreground-subtle group-hover:text-accent'
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

                <div>
                    {isDragActive ? (
                        <p className="text-lg font-medium text-accent">
                            {multiple ? t('dropFilesHere_msg', 'Drop the files here...') : t('dropFileHere_msg', 'Drop the file here...')}
                        </p>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-foreground">
                                {multiple ? t('dragDropFiles_msg', 'Drag & drop files here') : t('dragDropFile_msg', 'Drag & drop a file here')}
                            </p>
                            <p className="text-sm text-foreground-muted mt-1">
                                {t('clickToBrowse_msg', 'or click to browse')}
                            </p>
                        </>
                    )}
                </div>

                <div className="text-xs text-foreground-subtle">
                    <p>{t('supportedFormats_msg', 'Supported formats:')} {Object.keys(accept).join(', ')}</p>
                    <p>{t('maxSize_msg', 'Max size:')} {(maxSize / 1048576).toFixed(0)}MB</p>
                </div>
            </div>

            {isDragActive && (
                <motion.div
                    className="absolute inset-0 rounded-2xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                        boxShadow: '0 0 20px rgba(91, 106, 255, 0.3)',
                    }}
                />
            )}
        </motion.div>
    );
};

export default FileDropzone;
