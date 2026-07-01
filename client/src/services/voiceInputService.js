/**
 * VoiceInputService - Speech-to-Text using Web Speech API
 * Phase 6: Voice Assistant
 */

class VoiceInputService {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.onTranscript = null;
        this.onError = null;
        this.onEnd = null;

        this.init();
    }

    init() {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.error('SpeechRecognition API not supported in this browser');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false; // Single utterance per click
        this.recognition.interimResults = false; // Only final results
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Event handlers
        this.recognition.onstart = () => {
            this.isListening = true;
        };

        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            if (this.onTranscript) {
                this.onTranscript(transcript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            this.isListening = false;
            if (this.onError) {
                this.onError(event.error);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) {
                this.onEnd();
            }
        };
    }

    /**
     * Start listening for voice input
     * @param {Function} onTranscript - Callback with transcript text
     * @param {Function} onError - Callback with error message
     * @param {Function} onEnd - Callback when listening ends
     */
    startListening(onTranscript, onError, onEnd) {
        if (!this.recognition) {
            onError('Speech recognition not supported');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        this.onTranscript = onTranscript;
        this.onError = onError;
        this.onEnd = onEnd;

        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            onError(error.message);
        }
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.recognition && this.isListening) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Error stopping recognition:', error);
            }
        }
    }

    /**
     * Check if speech recognition is supported
     * @returns {boolean}
     */
    isSupported() {
        return !!this.recognition;
    }

    /**
     * Get current listening state
     * @returns {boolean}
     */
    getIsListening() {
        return this.isListening;
    }
}

// Export singleton instance
export default new VoiceInputService();