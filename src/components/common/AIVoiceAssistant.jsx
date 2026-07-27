import React, { useState, useEffect } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

export const AIVoiceAssistant = ({ 
  mode = "stt", // "stt" or "tts" or "both"
  textToSpeak = "", 
  onTranscript = () => {},
  placeholder = "" 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    // Initialize Web Speech API Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onTranscript(transcript);
        }
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition Error:", event.error);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, [onTranscript]);

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      // Stop any speech synthesis if running
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      recognition.start();
    }
  };

  const handleSpeak = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!textToSpeak) return;
      
      // Stop recognition
      if (isListening && recognition) {
        recognition.stop();
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
      {(mode === "stt" || mode === "both") && (
        <button
          type="button"
          onClick={toggleListening}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #cbd5e1",
            background: isListening ? "#ef4444" : "#f1f5f9",
            color: isListening ? "#ffffff" : "#475569",
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: isListening ? "0 0 10px rgba(239, 68, 68, 0.4)" : "none"
          }}
          title={isListening ? "Listening... click to stop" : "Speak to dictate"}
        >
          {isListening ? <MicOff size={16} className="animate-pulse" /> : <Mic size={16} />}
        </button>
      )}

      {(mode === "tts" || mode === "both") && (
        <button
          type="button"
          onClick={handleSpeak}
          disabled={!textToSpeak}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            border: "1px solid #cbd5e1",
            background: isSpeaking ? "#0ea5e9" : "#f1f5f9",
            color: isSpeaking ? "#ffffff" : textToSpeak ? "#475569" : "#94a3b8",
            cursor: textToSpeak ? "pointer" : "not-allowed",
            transition: "all 0.2s ease"
          }}
          title={isSpeaking ? "Mute Narration" : "Read aloud"}
        >
          {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      )}
    </div>
  );
};
