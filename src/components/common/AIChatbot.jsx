import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { fetchAIPatientBuddy } from "../../services/api";
import { AIVoiceAssistant } from "./AIVoiceAssistant";

export const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [queryType, setQueryType] = useState("general"); // "symptom-checker", "report-explanation", "general"
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "Hello! I am your Medi-Buddy AI. I can explain clinical terms, review symptoms, or answer quick hospital flow questions. How can I help you today?",
      takeaways: [],
      recommendations: ["AI suggestions are advisory only. Final medical decisions remain with authorized physicians."]
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend = inputVal) => {
    if (!textToSend.trim()) return;
    
    const userMsg = { sender: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      // Map general queries to appropriate patient buddy modes
      const type = queryType === "general" ? "symptom-checker" : queryType;
      const res = await fetchAIPatientBuddy(type, textToSend);
      
      const botMsg = {
        sender: "bot",
        text: res.data.reply || "I've reviewed your prompt. Here is my analysis.",
        takeaways: res.data.keyTakeaways || [],
        recommendations: res.data.recommendations || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "I apologize, I'm having trouble connecting to the medical AI service. Please try again shortly.",
        takeaways: [],
        recommendations: ["Ensure your API key is correctly configured in backend environment variables."]
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = (transcript) => {
    setInputVal(prev => prev + " " + transcript);
  };

  return (
    <div style={{ position: "fixed", bottom: "25px", right: "25px", zIndex: 1000, fontFamily: "inherit" }}>
      {/* Floating Circle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
            color: "white",
            border: "none",
            boxShadow: "0 10px 25px rgba(2, 132, 199, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
          title="Consult Medi-Buddy AI"
        >
          <Sparkles size={24} style={{ animation: "pulse 2s infinite" }} />
        </button>
      )}

      {/* Expanded Chat Card */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            height: "550px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 12px 40px rgba(15, 23, 42, 0.22)",
            border: "1px solid #e2e8f0",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideIn 0.3s ease"
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "1rem 1.25rem",
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(14, 165, 233, 0.2)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Bot size={18} style={{ color: "#38bdf8" }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Medi-Buddy AI</h4>
                <span style={{ fontSize: "0.65rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                  Clinical Support Assistant
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.25rem" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", padding: "0.5rem 0.75rem", gap: "0.3rem", background: "#f8fafc" }}>
            <button 
              onClick={() => setQueryType("general")}
              style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.7rem", borderRadius: "6px", border: "none", cursor: "pointer", background: queryType === "general" ? "#0ea5e9" : "none", color: queryType === "general" ? "white" : "#64748b", fontWeight: 700 }}
            >
              Symptom Check
            </button>
            <button 
              onClick={() => setQueryType("report-explanation")}
              style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.7rem", borderRadius: "6px", border: "none", cursor: "pointer", background: queryType === "report-explanation" ? "#0ea5e9" : "none", color: queryType === "report-explanation" ? "white" : "#64748b", fontWeight: 700 }}
            >
              Explain Reports
            </button>
            <button 
              onClick={() => setQueryType("prescription-explanation")}
              style={{ flex: 1, padding: "0.35rem 0.5rem", fontSize: "0.7rem", borderRadius: "6px", border: "none", cursor: "pointer", background: queryType === "prescription-explanation" ? "#0ea5e9" : "none", color: queryType === "prescription-explanation" ? "white" : "#64748b", fontWeight: 700 }}
            >
              Meds Explainer
            </button>
          </div>

          {/* Messages Window */}
          <div style={{ flex: 1, padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {messages.map((m, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  flexDirection: "column",
                  alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%"
                }}
              >
                {/* Message Bubble */}
                <div
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: m.sender === "user" ? "16px 16px 0 16px" : "16px 16px 16px 0",
                    background: m.sender === "user" ? "#0ea5e9" : "#f1f5f9",
                    color: m.sender === "user" ? "white" : "#1e293b",
                    fontSize: "0.85rem",
                    lineHeight: 1.4,
                    boxShadow: "0 2px 5px rgba(0,0,0,0.03)"
                  }}
                >
                  {m.text}
                  
                  {/* Takeaways & recommendations (Only for Bot advice) */}
                  {m.sender === "bot" && (m.takeaways?.length > 0 || m.recommendations?.length > 0) && (
                    <div style={{ marginTop: "0.6rem", borderTop: "1px solid #cbd5e1", paddingTop: "0.5rem", fontSize: "0.75rem" }}>
                      {m.takeaways?.length > 0 && (
                        <div style={{ marginBottom: "0.3rem" }}>
                          <strong>Takeaways:</strong>
                          <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1rem" }}>
                            {m.takeaways.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {m.recommendations?.length > 0 && (
                        <div>
                          <strong>Advice:</strong>
                          <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1rem" }}>
                            {m.recommendations.map((r, i) => <li key={i} style={{ color: r.includes("🚨") || r.includes("Warning") ? "#ef4444" : "inherit" }}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Speak button for bot responses */}
                {m.sender === "bot" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                    <AIVoiceAssistant mode="tts" textToSpeak={m.text} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignSelf: "flex-start", gap: "0.5rem", alignItems: "center", background: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "12px" }}>
                <span className="dot-pulse" style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Medi-Buddy is analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div style={{ padding: "0.25rem 1rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", borderTop: "1px solid #f1f5f9" }}>
            <button 
              onClick={() => handleSend("I have a persistent cough and mild fever. What should I monitor?")} 
              style={{ border: "1px solid #e2e8f0", background: "none", borderRadius: "12px", padding: "0.25rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", color: "#0284c7" }}
            >
              🌡️ Fever & Cough Check
            </button>
            <button 
              onClick={() => handleSend("Describe drug interactions between Aspirin and Warfarin.")} 
              style={{ border: "1px solid #e2e8f0", background: "none", borderRadius: "12px", padding: "0.25rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", color: "#0284c7" }}
            >
              💊 Pill Interactions
            </button>
          </div>

          {/* Footer Input Area */}
          <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #f1f5f9", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <AIVoiceAssistant mode="stt" onTranscript={handleVoiceInput} />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={queryType === "symptom-checker" ? "Describe your symptoms..." : "Type/dictate medical query..."}
              style={{
                flex: 1,
                padding: "0.5rem 0.75rem",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.85rem",
                outline: "none"
              }}
            />
            <button
              onClick={() => handleSend()}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "#0ea5e9",
                color: "white",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Send size={16} />
            </button>
          </div>

          {/* Advisory Notice */}
          <div style={{ background: "#f8fafc", padding: "0.3rem 1rem", fontSize: "0.55rem", color: "#94a3b8", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
            * Advisory screening. Final medical advice rests with doctor.
          </div>
        </div>
      )}
    </div>
  );
};
