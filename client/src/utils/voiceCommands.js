/**
 * Voice Commands Utility using Web Speech API (webkitSpeechRecognition)
 */

export const initVoiceCommands = (onCommandMatch) => {
    // Check support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.warn('Voice commands are not supported in this browser.');
        return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const COMMAND_MAP = {
        'book appointment': '/patient/book-appointment',
        'upload scan': '/patient/upload-scan',
        'read report': 'READ_REPORT_ACTION',
        'logout': 'LOGOUT_ACTION',
        'dashboard': '/patient/dashboard',
        'settings': '/patient/profile',
        'appointments': '/patient/appointments'
    };

    recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.trim().toLowerCase();
        console.log('🗣️ Voice Command Heard:', transcript);

        // Simple matching logic
        for (const [command, action] of Object.entries(COMMAND_MAP)) {
            if (transcript.includes(command)) {
                console.log(`✅ Matched Voice Command: "${command}" -> Action/Route: ${action}`);
                if (onCommandMatch) {
                    onCommandMatch(action);
                }
                break;
            }
        }
    };

    recognition.onerror = (event) => {
        // Ignore "no-speech" as it just means the user is quiet
        if (event.error !== 'no-speech') {
            console.error('Speech recognition error =>', event.error);
        }
    };

    recognition.onend = () => {
        // Continuous mode can sometimes stop unexpectedly. 
        // We'll rely on the React component to restart it if the toggle is still ON.
        if (onCommandMatch && onCommandMatch.onListenerEnd) {
            onCommandMatch.onListenerEnd();
        }
    }

    return recognition;
};
