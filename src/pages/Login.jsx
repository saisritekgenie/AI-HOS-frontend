import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, KeyRound, Smartphone, Clock, ShieldOff } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("email"); // "email" or "otp"

  // Placeholder alert modal state for requested future buttons
  const [placeholderNotice, setPlaceholderNotice] = useState(null);

  const handlePlaceholderClick = (featureName) => {
    setPlaceholderNotice(`${featureName} is configured as a UI placeholder for Phase 2 integration.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (activeTab === "otp") {
      handlePlaceholderClick("OTP Login");
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        padding: "1.5rem",
      }}
    >
      <div
        className="modal-card"
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "2.5rem",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.08)",
        }}
      >
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 8px 20px rgba(2, 132, 199, 0.25)",
              marginBottom: "1rem",
            }}
          >
            <Activity size={32} />
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>
            MediCore AI Login
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.35rem" }}>
            Hospital Employee & Admin Portal
          </p>
        </div>

        {/* Tab Switcher for Email vs OTP Login */}
        <div
          style={{
            display: "flex",
            background: "#f1f5f9",
            padding: "0.3rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "9px",
              border: "none",
              background: activeTab === "email" ? "#ffffff" : "transparent",
              color: activeTab === "email" ? "#0284c7" : "#64748b",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeTab === "email" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => setActiveTab("email")}
          >
            Email Login
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: "0.6rem",
              borderRadius: "9px",
              border: "none",
              background: activeTab === "otp" ? "#ffffff" : "transparent",
              color: activeTab === "otp" ? "#0284c7" : "#64748b",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: activeTab === "otp" ? "0 2px 5px rgba(0,0,0,0.05)" : "none",
            }}
            onClick={() => setActiveTab("otp")}
          >
            OTP Login
          </button>
        </div>

        {/* Placeholder Notification Banner */}
        {placeholderNotice && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#1d4ed8",
              padding: "0.75rem 1rem",
              borderRadius: "12px",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
            }}
          >
            <span>{placeholderNotice}</span>
            <button
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
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
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "0.85rem 1rem",
              borderRadius: "12px",
              marginBottom: "1.5rem",
              fontSize: "0.85rem",
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {activeTab === "email" ? (
            <>
              <div className="form-group">
                <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                  Email Address
                </label>
                <div className="search-box" style={{ minWidth: "auto", background: "#f8fafc" }}>
                  <Mail size={18} className="text-slate-400" />
                  <input
                    type="email"
                    placeholder="superadmin@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                    Password
                  </label>
                  <button
                    type="button"
                    style={{ background: "none", border: "none", color: "#0284c7", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                    onClick={() => handlePlaceholderClick("Forgot Password")}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="search-box" style={{ minWidth: "auto", background: "#f8fafc" }}>
                  <Lock size={18} className="text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="action-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ padding: "0.2rem" }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>
                Mobile Number for 6-Digit OTP
              </label>
              <div className="search-box" style={{ minWidth: "auto", background: "#f8fafc" }}>
                <Smartphone size={18} className="text-slate-400" />
                <input type="text" placeholder="Enter 10-digit mobile number..." />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{
              width: "100%",
              justifyContent: "center",
              padding: "0.9rem",
              fontSize: "1rem",
              borderRadius: "12px",
              marginTop: "0.5rem",
            }}
          >
            <LogIn size={20} />
            <span>{submitting ? "Signing in..." : activeTab === "email" ? "Sign In to Dashboard" : "Request OTP Code"}</span>
          </button>
        </form>

        {/* Secondary Placeholder Action Buttons as Requested */}
        <div style={{ marginTop: "1.75rem", paddingTop: "1.25rem", borderTop: "1px solid #e2e8f0", display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "center" }}>
          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
            onClick={() => handlePlaceholderClick("Reset Password")}
          >
            <KeyRound size={14} />
            <span>Reset Password</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
            onClick={() => handlePlaceholderClick("Session Timeout Config")}
          >
            <Clock size={14} />
            <span>Session Timeout</span>
          </button>

          <button
            className="btn btn-secondary"
            style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem" }}
            onClick={() => handlePlaceholderClick("Multi Device Logout")}
          >
            <ShieldOff size={14} />
            <span>Multi-Device Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
