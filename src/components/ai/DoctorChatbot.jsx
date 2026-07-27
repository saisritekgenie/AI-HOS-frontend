import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User as UserIcon, Sparkles } from "lucide-react";
import { fetchDoctorAIChat } from "../../services/api";
import { AIVoiceAssistant } from "../common/AIVoiceAssistant";

export const DoctorChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: "bot", 
      text: "Hello Doctor! I am your AI Clinical Assistant. I can assist you with patient diagnostic reports, scribe shorthand transcriptions, prescription allergen checks, or differential diagnosis hints. How can I help you today?",
      takeaways: [],
      recommendations: ["Clinical AI is advisory only. Order decisions rest with the physician."]
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
      const res = await fetchDoctorAIChat(textToSend);
      
      const botMsg = {
        sender: "bot",
        text: res.data.reply || "Clinical assessment completed.",
        takeaways: res.data.keyTakeaways || [],
        recommendations: res.data.recommendations || []
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Sorry, I encountered an issue connecting to the clinical AI service. Check authorization controls.",
        takeaways: [],
        recommendations: []
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
            background: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
            color: "white",
            border: "none",
            boxShadow: "0 10px 25px rgba(14, 165, 233, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
          }}
          title="Clinical AI Desk"
        >
          <Sparkles size={24} style={{ color: "white" }} />
        </button>
      )}

      {/* Expanded Chat Card */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            height: "530px",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 12px 40px rgba(2, 132, 199, 0.22)",
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
              background: "linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%)",
              color: "white",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                <Bot size={18} style={{ color: "white" }} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800 }}>Clinical AI Desk</h4>
                <span style={{ fontSize: "0.65rem", color: "#e0f2fe", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }}></span>
                  EMR Diagnostics Companion
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "#e0f2fe", cursor: "pointer" }}
            >
              <X size={18} />
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
                          <strong>Actions:</strong>
                          <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1rem" }}>
                            {m.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignSelf: "flex-start", gap: "0.5rem", alignItems: "center", background: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "12px" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Analyzing clinical details...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div style={{ padding: "0.25rem 1rem", display: "flex", gap: "0.4rem", flexWrap: "wrap", borderTop: "1px solid #f1f5f9" }}>
            <button 
              onClick={() => handleSend("Suggest diagnosis based on patient complain details.")} 
              style={{ border: "1px solid #e2e8f0", background: "none", borderRadius: "12px", padding: "0.25rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", color: "#0284c7" }}
            >
              🩺 Diagnosis suggestions
            </button>
            <button 
              onClick={() => handleSend("Check proposed medications prescription allergen interactions.")} 
              style={{ border: "1px solid #e2e8f0", background: "none", borderRadius: "12px", padding: "0.25rem 0.5rem", fontSize: "0.65rem", cursor: "pointer", color: "#0284c7" }}
            >
              💊 Rx safety checks
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
              placeholder="Query clinical AI..."
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
                background: "#0284c7",
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
        </div>
      )}
    </div>
  );
};
