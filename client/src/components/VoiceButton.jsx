/**
 * VoiceButton - Minimal voice input toggle component
 * Phase 6: Voice Assistant
 */

import { useState, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import voiceInputService from '../services/voiceInputService';
import voiceOutputService from '../services/voiceOutputService';
import './VoiceButton.css';

function VoiceButton({ onTranscript }) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);

    useEffect(() => {
        // Check browser support on mount
        setIsSupported(voiceInputService.isSupported() && voiceOutputService.isSupported());
    }, []);

    const handleToggleListening = () => {
        if (isListening) {
            // Stop listening
            voiceInputService.stopListening();
            setIsListening(false);
        } else {
            // Start listening
            setError(null);
            setIsListening(true);
            setIsProcessing(true);

            voiceInputService.startListening(
                // onTranscript - speech converted to text
                (transcript) => {
                    setIsListening(false);
                    setIsProcessing(false);

                    // Send transcript to parent component
                    if (onTranscript) {
                        onTranscript(transcript);
                    }
                },
                // onError
                (errorMessage) => {
                    setIsListening(false);
                    setIsProcessing(false);
                    setError(errorMessage);
                    console.error('Voice input error:', errorMessage);
                },
                // onEnd
                () => {
                    setIsListening(false);
                    setIsProcessing(false);
                }
            );
        }
    };

    // Expose speak function to parent via useEffect
    useEffect(() => {
        // Store reference for parent to call
        window.speakResponse = (text) => {
            if (text) {
                voiceOutputService.speak(text);
            }
        };
        return () => {
            delete window.speakResponse;
        };
    }, []);

    if (!isSupported) {
        return (
            <button
                id="btn_voice_toggle"
                className="action-btn voice-btn"
                disabled
                title="Voice not supported in this browser"
                style={{ opacity: 0.3, cursor: 'not-allowed' }}
            >
                <MicOff size={18} />
            </button>
        );
    }

    return (
        <button
            id="btn_voice_toggle"
            className={`action-btn voice-btn ${isListening ? 'listening' : ''}`}
            onClick={handleToggleListening}
            disabled={isProcessing}
            title={isListening ? 'Stop listening' : 'Start voice input'}
        >
            {isProcessing ? (
                <Loader2 size={18} className="spin" />
            ) : isListening ? (
                <Mic size={18} />
            ) : (
                <MicOff size={18} />
            )}
        </button>
    );
}

export default VoiceButton;