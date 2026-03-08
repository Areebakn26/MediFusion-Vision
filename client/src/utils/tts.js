/**
 * Text-to-Speech (TTS) Utility using Web Speech API
 */

export const speakText = (text, language = 'en-US') => {
    if (!window.speechSynthesis) {
        console.warn('Text-to-Speech not supported in this browser.');
        return;
    }

    // Stop currently speaking utterance
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    window.speechSynthesis.speak(utterance);
};

export const stopSpeaking = () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};
