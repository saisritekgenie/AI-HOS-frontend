import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, KeyRound, Smartphone, Shield, User, Users } from "lucide-react";

const Login = () => {
  const { login, loginPatient } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [uhid, setUhid] = useState("");
  const [mobile, setMobile] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("staff"); // "staff" or "patient"
  const [placeholderNotice, setPlaceholderNotice] = useState(null);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.innerWidth >= 1024) {
        setMousePos({ x: e.clientX, y: e.clientY });
        setIsHovering(true);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUhid = params.get("uhid");
    if (urlUhid) {
      setUhid(urlUhid);
      setActiveTab("patient");
    }
  }, []);

  useEffect(() => {
    document.body.classList.remove("light-theme", "dark-theme");
  }, []);

  const handlePlaceholderClick = (featureName) => {
    setPlaceholderNotice(`${featureName} is configured as a UI placeholder for Phase 2 integration.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeTab === "patient") {
      if (!uhid || !mobile) {
        setErrorMsg("Please enter both Patient ID (UHID) and Mobile number.");
        return;
      }
      try {
        setSubmitting(true);
        await loginPatient({ uhid, mobile });
      } catch (err) {
        const msg = err.response?.data?.message || err.message || "Invalid Patient ID or Mobile number.";
        setErrorMsg(msg);
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!email || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    try {
      setSubmitting(true);
      await login({ email, password });
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Invalid credentials. Please try again.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        .login-page-container {
          display: block;
          min-height: 100vh;
          width: 100%;
          font-family: 'Plus Jakarta Sans', var(--font-family), sans-serif;
          position: relative;
          overflow: hidden;
          background: url('/login_side.jpg') no-repeat center center / cover !important;
        }
        .login-page-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(8, 127, 140, 0.02) 0%, rgba(10, 20, 40, 0.06) 100%) !important;
          z-index: 1;
          pointer-events: none;
        }
        
        /* Floating Left Branding Container - Hidden on desktop because it's printed in login_side.jpg background */
        .login-left-brand-container {
          display: none !important;
        }
        
        /* Floating Login Card Wrapper */
        .login-card-floating-wrapper {
          position: absolute;
          right: 7vw;
          top: 50%;
          transform: translateY(-50%);
          z-index: 3;
          width: 390px;
          max-width: calc(100vw - 40px);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .login-card-floating-wrapper::before {
          content: "";
          position: absolute;
          top: -10%;
          left: -10%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle, rgba(25, 181, 165, 0.08) 0%, rgba(25, 181, 165, 0) 70%) !important;
          pointer-events: none;
          z-index: -1;
        }

        /* Glass Login Card */
        .login-card {
          background: rgba(235, 248, 250, 0.72) !important;
          backdrop-filter: blur(24px) saturate(120%) !important;
          -webkit-backdrop-filter: blur(24px) saturate(120%) !important;
          border: 1px solid rgba(255, 255, 255, 0.75) !important;
          border-radius: 28px !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 25px 70px rgba(0, 80, 90, 0.15) !important;
          width: 100% !important;
          padding: 32px 28px !important;
          max-height: none !important;
          overflow: visible !important;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        body.light-theme .login-card {
          background: rgba(235, 248, 250, 0.72) !important;
          border: 1px solid rgba(255, 255, 255, 0.75) !important;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8), 0 25px 70px rgba(0, 80, 90, 0.18) !important;
          border-radius: 28px !important;
        }
        .login-card:hover {
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 30px 80px rgba(0, 80, 90, 0.22) !important;
        }
        .login-brand-header {
          text-align: center;
          margin-bottom: 1.25rem;
        }

        /* Spacing and layout tokens */
        .login-input-wrapper {
          background: rgba(255, 255, 255, 0.30) !important;
          border: 1px solid rgba(255, 255, 255, 0.65) !important;
          border-radius: 18px !important;
          padding: 0.75rem 1.25rem !important;
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          transition: all 0.3s ease !important;
          width: 100% !important;
        }
        .login-input-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.50) !important;
          border-color: #19B5A5 !important;
          box-shadow: 0 0 12px rgba(25, 181, 165, 0.12) !important;
        }
        .login-input-wrapper input {
          background: transparent !important;
          border: none !important;
          color: #234047 !important;
          outline: none !important;
          width: 100% !important;
          font-size: 0.9rem !important;
          font-family: inherit !important;
        }
        .shimmer-button {
          height: 52px !important;
          background: linear-gradient(90deg, #087F8C 0%, #19B5A5 100%) !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 18px !important;
          font-weight: 700 !important;
          letter-spacing: 1.5px !important;
          text-transform: uppercase !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          box-shadow: 0 8px 24px rgba(25, 181, 165, 0.2) !important;
          width: 100% !important;
        }
        .shimmer-button:hover {
          transform: translateY(-2px) !important;
          filter: brightness(1.05) !important;
          box-shadow: 0 12px 30px rgba(25, 181, 165, 0.3) !important;
        }
        .shimmer-button:active {
          transform: translateY(0) scale(0.98) !important;
        }
        .portal-selector-wrapper {
          display: flex !important;
          background: rgba(255, 255, 255, 0.25) !important;
          padding: 0.25rem !important;
          border-radius: 50px !important;
          margin-bottom: 1.25rem !important;
          border: 1px solid rgba(25, 181, 165, 0.15) !important;
          width: 100% !important;
        }
        .portal-tab-btn {
          flex: 1 !important;
          padding: 0.65rem 1.25rem !important;
          border-radius: 50px !important;
          border: none !important;
          font-weight: 700 !important;
          font-size: 0.85rem !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          gap: 0.5rem !important;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .portal-tab-btn.active {
          background: linear-gradient(90deg, #087F8C 0%, #19B5A5 100%) !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(25, 181, 165, 0.2) !important;
        }
        .portal-tab-btn.inactive {
          background: transparent !important;
          color: #234047 !important;
        }
        .portal-tab-btn.inactive:hover {
          color: #087F8C !important;
        }
        .security-badge-container {
          display: flex !important;
          align-items: center !important;
          gap: 0.75rem !important;
          background: rgba(25, 181, 165, 0.05) !important;
          border: 1px solid rgba(25, 181, 165, 0.15) !important;
          padding: 0.65rem 1.25rem !important;
          border-radius: 16px !important;
          margin-top: 1.25rem !important;
          text-align: left !important;
        }
        .logo-glow {
          width: 64px !important;
          height: 64px !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          background: rgba(25, 181, 165, 0.12) !important;
          border-radius: 50% !important;
          color: #19B5A5 !important;
          filter: drop-shadow(0 0 15px rgba(25, 181, 165, 0.4)) !important;
          box-shadow: 0 0 20px rgba(25, 181, 165, 0.2) !important;
          border: 1px solid rgba(25, 181, 165, 0.25) !important;
          transition: all 0.3s ease;
        }
        .logo-glow:hover {
          animation: pulseLogo 2s infinite ease-in-out;
        }
        @keyframes pulseLogo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(25, 181, 165, 0.4)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 12px rgba(8, 127, 140, 0.5)); }
        }
        @keyframes portalFadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .portal-fade-enter {
          animation: portalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (max-width: 1023px) {
          .login-page-container {
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            align-items: center !important;
            overflow-y: auto !important;
            padding: 1.5rem !important;
            box-sizing: border-box !important;
          }
          .login-left-brand-container {
            display: none !important;
          }
          .login-card-floating-wrapper {
            position: relative !important;
            right: auto !important;
            top: auto !important;
            transform: none !important;
            width: 100% !important;
            max-width: 400px !important;
            padding: 0 !important;
            box-sizing: border-box !important;
          }
          .login-card {
            max-height: none !important;
            background: rgba(240, 250, 252, 0.85) !important;
            border-radius: 24px !important;
            padding: 24px 20px !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
      <div className="login-page-overlay" />

      {/* Floating Left Branding Container */}
      <div className="login-left-brand-container">
        <div className="logo-glow">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#19B5A5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            <path d="M12 6v6" stroke="#ffffff" />
            <path d="M9 9h6" stroke="#ffffff" />
          </svg>
        </div>
        <div>
          <h1 className="login-left-title">AI Hospital</h1>
          <p className="login-left-subtitle">System</p>
          <p className="login-left-tagline">
            Caring with Technology,<br />Healing with Intelligence
          </p>
        </div>
      </div>

      {/* Floating Right Login Card Wrapper */}
      <div className="login-card-floating-wrapper">
        <div className="modal-card login-card">
          {/* Header Branding */}
          <div className="login-brand-header">
            <div
              className="logo-glow"
              style={{
                width: "64px",
                height: "64px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(25, 181, 165, 0.12)",
                borderRadius: "50%",
                color: "#19B5A5",
                marginBottom: "1rem",
                boxShadow: "0 0 20px rgba(25, 181, 165, 0.2)",
                border: "1px solid rgba(25, 181, 165, 0.25)"
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="#19B5A5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M12 6v6" stroke="#ffffff" />
                <path d="M9 9h6" stroke="#ffffff" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800, color: "var(--text-primary, #234047)", letterSpacing: "1px", textTransform: "uppercase", margin: 0 }}>
              AI Hospital
            </h2>
            <p style={{ color: "#19B5A5", fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", marginTop: "0.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>
              System
            </p>
            <p style={{ color: "var(--text-secondary, #6B7F7B)", fontSize: "0.82rem", fontWeight: 600, margin: 0 }}>
              Caring with Technology, Healing with Intelligence
            </p>
          </div>

          {/* Tab Switcher for Staff vs Patient Portal */}
          <div className="portal-selector-wrapper">
            <button
              type="button"
              className={`portal-tab-btn ${activeTab === "staff" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("staff")}
            >
              <Users size={16} />
              Staff Portal
            </button>
            <button
              type="button"
              className={`portal-tab-btn ${activeTab === "patient" ? "active" : "inactive"}`}
              onClick={() => setActiveTab("patient")}
            >
              <User size={16} />
              Patient Portal
            </button>
          </div>

          {/* Placeholder Notification Banner */}
          {placeholderNotice && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "rgba(8, 127, 140, 0.1)",
                border: "1px solid rgba(25, 181, 165, 0.2)",
                color: "var(--accent-primary, #087F8C)",
                padding: "0.75rem 1rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
              }}
            >
              <span>{placeholderNotice}</span>
              <button
                style={{ background: "none", border: "none", color: "var(--accent-primary, #087F8C)", cursor: "pointer", fontWeight: "bold" }}
                onClick={() => setPlaceholderNotice(null)}
              >
                ×
              </button>
            </div>
          )}

          {/* Error Alert */}
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                background: "rgba(220, 38, 38, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.2)",
                color: "#dc2626",
                padding: "0.85rem 1rem",
                borderRadius: "12px",
                marginBottom: "1.5rem",
                fontSize: "0.85rem",
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, color: "#ef4444" }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div key={activeTab} className="portal-fade-enter" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {activeTab === "staff" ? (
                <>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary, #6B7F7B)", paddingLeft: "0.75rem" }}>
                      Email Address
                    </label>
                    <div className="login-input-wrapper">
                      <Mail size={18} style={{ color: focusedInput === "email" ? "#19B5A5" : "var(--text-secondary, #6B7F7B)", transition: "color 0.3s ease" }} />
                      <input
                        type="email"
                        placeholder="superadmin@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary, #6B7F7B)", paddingLeft: "0.75rem" }}>
                      Password
                    </label>
                    <div className="login-input-wrapper">
                      <Lock size={18} style={{ color: focusedInput === "password" ? "#19B5A5" : "var(--text-secondary, #6B7F7B)", transition: "color 0.3s ease" }} />
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        required
                      />
                      <button
                        type="button"
                        className="action-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ padding: "0.2rem", background: "none", border: "none", color: "var(--text-secondary, #6B7F7B)", cursor: "pointer" }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary, #6B7F7B)", paddingLeft: "0.75rem" }}>
                      Patient ID (UHID) *
                    </label>
                    <div className="login-input-wrapper">
                      <KeyRound size={18} style={{ color: focusedInput === "uhid" ? "#19B5A5" : "var(--text-secondary, #6B7F7B)", transition: "color 0.3s ease" }} />
                      <input
                        type="text"
                        placeholder="E.g. KIMS-W-10001"
                        value={uhid}
                        onChange={(e) => setUhid(e.target.value)}
                        onFocus={() => setFocusedInput("uhid")}
                        onBlur={() => setFocusedInput(null)}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary, #6B7F7B)", paddingLeft: "0.75rem" }}>
                      Registered Mobile Number *
                    </label>
                    <div className="login-input-wrapper">
                      <Smartphone size={18} style={{ color: focusedInput === "mobile" ? "#19B5A5" : "var(--text-secondary, #6B7F7B)", transition: "color 0.3s ease" }} />
                      <input
                        type="text"
                        placeholder="Enter 10-digit mobile number..."
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        onFocus={() => setFocusedInput("mobile")}
                        onBlur={() => setFocusedInput(null)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              type="submit"
              className="shimmer-button"
              disabled={submitting}
              style={{ width: "100%" }}
            >
              <span>{submitting ? "Signing in..." : "LOGIN"}</span>
              <LogIn size={20} />
            </button>
          </form>

          {/* Clean Action Links matching mockup */}
          <div style={{ display: "flex", flexDirection: "row", gap: "0.75rem", alignItems: "center", justifyContent: "center", marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-secondary, #6B7F7B)" }}>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--text-secondary, #6B7F7B)", fontSize: "0.82rem", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.target.style.color = "var(--accent-primary, #087F8C)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-secondary, #6B7F7B)"}
              onClick={() => handlePlaceholderClick("Forgot Password")}
            >
              Forgot Password?
            </button>
            <span>|</span>
            <button
              type="button"
              style={{ background: "none", border: "none", color: "var(--text-secondary, #6B7F7B)", fontSize: "0.82rem", cursor: "pointer", transition: "color 0.2s" }}
              onMouseEnter={(e) => e.target.style.color = "var(--accent-primary, #087F8C)"}
              onMouseLeave={(e) => e.target.style.color = "var(--text-secondary, #6B7F7B)"}
              onClick={() => handlePlaceholderClick("Request Access")}
            >
              Request Access?
            </button>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Login;
