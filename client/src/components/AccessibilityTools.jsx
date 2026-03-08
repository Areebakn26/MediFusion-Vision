import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { updatePatientSettings } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { initVoiceCommands } from '../utils/voiceCommands';
import { speakText } from '../utils/tts';

const AccessibilityTools = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Default to false if not logged in
    const [highContrast, setHighContrast] = useState(false);
    const [largeText, setLargeText] = useState(false);
    const [ttsEnabled, setTtsEnabled] = useState(false);
    const [voiceCommands, setVoiceCommands] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    // Sync from AuthContext
    useEffect(() => {
        if (user && user.accessibilitySettings) {
            setHighContrast(!!user.accessibilitySettings.highContrast);
            setLargeText(!!user.accessibilitySettings.largeText);
            setTtsEnabled(!!user.accessibilitySettings.ttsEnabled);
            setVoiceCommands(!!user.accessibilitySettings.voiceCommands);
        }
    }, [user]);

    // Handle Toggles
    const handleToggle = async (setting, value) => {
        // Update Local State for immediate feedback
        if (setting === 'highContrast') setHighContrast(value);
        if (setting === 'largeText') setLargeText(value);
        if (setting === 'ttsEnabled') setTtsEnabled(value);
        if (setting === 'voiceCommands') setVoiceCommands(value);

        // Immediately apply CSS classes for instant feedback
        const settings = { highContrast, largeText, ttsEnabled, voiceCommands, [setting]: value };
        if (settings.highContrast) {
            document.body.classList.add('high-contrast');
        } else {
            document.body.classList.remove('high-contrast');
        }
        if (settings.largeText) {
            document.body.classList.add('large-text');
        } else {
            document.body.classList.remove('large-text');
        }

        // Build Payload
        const apiPayload = { [setting]: value };

        if (user && user.role === 'patient') {
            try {
                // Background Sync
                await updatePatientSettings({ accessibilitySettings: apiPayload });

                // Keep Context strictly synced to prevent jumpy UI renders 
                updateUser({
                    accessibilitySettings: {
                        ...(user.accessibilitySettings || {}),
                        ...apiPayload
                    }
                });
            } catch (err) {
                console.error("Failed to update accessibility settings", err);
            }
        } else if (user && user.role !== 'patient') {
            updateUser({
                accessibilitySettings: {
                    ...(user.accessibilitySettings || {}),
                    ...apiPayload
                }
            });
        }
    };

    // Voice Commands Listener
    useEffect(() => {
        if (!voiceCommands) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
            return;
        }

        const handleCommand = (action) => {
            if (action === 'LOGOUT_ACTION') {
                if (logout) {
                    logout();
                    navigate('/login');
                }
            } else if (action === 'READ_REPORT_ACTION') {
                window.dispatchEvent(new Event('voice-read-report'));
            } else if (action.startsWith('/')) {
                navigate(action);
            }
        };

        handleCommand.onListenerEnd = () => {
            // Restart if voiceCommands is still true
            if (voiceCommands && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) { }
            }
        };

        if (!recognitionRef.current) {
            recognitionRef.current = initVoiceCommands(handleCommand);
        }

        if (recognitionRef.current) {
            try {
                recognitionRef.current.start();
                setIsListening(true);
            } catch (e) { }
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
                setIsListening(false);
            }
        };
    }, [voiceCommands, navigate, logout]);


    // Simple TTS implementation
    useEffect(() => {
        const handleMouseUp = () => {
            if (!ttsEnabled) return;
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                speakText(selectedText);
            }
        };

        document.addEventListener('mouseup', handleMouseUp);
        return () => document.removeEventListener('mouseup', handleMouseUp);
    }, [ttsEnabled]);

    return (
        <>
            {/* Feedback when Voice Commands are listening */}
            {isListening && voiceCommands && (
                <div className="fixed bottom-24 right-6 bg-red-500 text-white rounded-full p-3 shadow-lg flex items-center gap-2 animate-pulseSlow z-50">
                    <span className="text-xl">🎙️</span>
                    <span className="text-sm font-medium">Listening...</span>
                </div>
            )}

            <div className="fixed bottom-6 right-6 z-50">
                {/* Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
                    aria-label="Accessibility Tools"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                    </svg>
                </button>

                {/* Menu */}
                {isOpen && (
                    <div className="absolute bottom-16 right-0 bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-200 animate-slide-up">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Accessibility</h3>

                        <div className="space-y-4">
                            {/* High Contrast */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">High Contrast</span>
                                <button
                                    aria-label="Toggle High Contrast"
                                    onClick={() => handleToggle('highContrast', !highContrast)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${highContrast ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${highContrast ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Large Text */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Large Text</span>
                                <button
                                    aria-label="Toggle Large Text"
                                    onClick={() => handleToggle('largeText', !largeText)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${largeText ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${largeText ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Text to Speech */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Text-to-Speech</span>
                                <button
                                    aria-label="Toggle Text to Speech"
                                    onClick={() => handleToggle('ttsEnabled', !ttsEnabled)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${ttsEnabled ? 'bg-green-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${ttsEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            {/* Voice Commands */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Voice Commands</span>
                                <button
                                    aria-label="Toggle Voice Commands"
                                    onClick={() => handleToggle('voiceCommands', !voiceCommands)}
                                    className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${voiceCommands ? 'bg-purple-500' : 'bg-gray-200'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1 ${voiceCommands ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </button>
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                {ttsEnabled ? "Select text to hear it spoken." : "Enable settings for better accessibility."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default AccessibilityTools;
