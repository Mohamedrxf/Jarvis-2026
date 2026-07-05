/**
 * VoiceOutputService - Text-to-Speech using Web Speech API
 * Phase 6: Voice Assistant
 */

class VoiceOutputService {
    constructor() {
        this.synth = window.speechSynthesis;
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.enabled = true;
        this.voice = null;

        this.init();
    }

    init() {
        if (!this.synth) {
            console.error('SpeechSynthesis API not supported in this browser');
            return;
        }

        // Load voices (they load asynchronously in some browsers)
        this.loadVoices();

        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => this.loadVoices();
        }
    }

    loadVoices() {
        const voices = this.synth.getVoices();
        // Prefer a natural-sounding voice, fallback to default
        this.voice = voices.find(voice =>
            voice.name.includes('Google') ||
            voice.name.includes('Natural') ||
            voice.name.includes('Samantha') ||
            voice.lang.startsWith('en')
        ) || voices[0];
    }

    /**
     * Speak text aloud
     * @param {string} text - Text to speak
     * @param {Function} onEnd - Callback when speaking ends
     */
    speak(text, onEnd) {
        if (!this.synth || !this.enabled) {
            if (onEnd) onEnd();
            return;
        }

        // Cancel any ongoing speech
        this.cancel();

        this.currentUtterance = new SpeechSynthesisUtterance(text);

        if (this.voice) {
            this.currentUtterance.voice = this.voice;
        }

        this.currentUtterance.rate = 1.0; // Normal speed
        this.currentUtterance.pitch = 1.0; // Normal pitch
        this.currentUtterance.volume = 1.0; // Full volume

        this.currentUtterance.onstart = () => {
            this.isSpeaking = true;
        };

        this.currentUtterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (onEnd) onEnd();
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event.error);
            this.isSpeaking = false;
            this.currentUtterance = null;
            if (onEnd) onEnd();
        };

        try {
            this.synth.speak(this.currentUtterance);
        } catch (error) {
            console.error('Error speaking:', error);
            this.isSpeaking = false;
            if (onEnd) onEnd();
        }
    }

    /**
     * Cancel current speech
     */
    cancel() {
        if (this.synth) {
            this.synth.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
        }
    }

    /**
     * Pause speech
     */
    pause() {
        if (this.synth && this.isSpeaking) {
            this.synth.pause();
        }
    }

    /**
     * Resume speech
     */
    resume() {
        if (this.synth && this.isSpeaking) {
            this.synth.resume();
        }
    }

    /**
     * Enable/disable voice output
     * @param {boolean} enabled 
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.cancel();
        }
    }

    /**
     * Check if speech synthesis is supported
     * @returns {boolean}
     */
    isSupported() {
        return !!this.synth;
    }

    /**
     * Get current speaking state
     * @returns {boolean}
     */
    getIsSpeaking() {
        return this.isSpeaking;
    }
}

// Export singleton instance
export default new VoiceOutputService();