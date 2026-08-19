import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Activity, Lock, Mail, Eye, EyeOff, LogIn, AlertCircle, KeyRound, Smartphone, Clock, ShieldOff, ShieldCheck, Cpu, Cloud } from "lucide-react";

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
    <div
      className="login-page-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 50%, #0F172A 0%, #0A0F1D 100%)",
        padding: "3.5rem 1.5rem",
        fontFamily: "var(--font-family)",
        position: "relative",
        overflowY: "auto",
      }}
    >
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1) translate(0px, 0px); opacity: 0.20; }
          50% { transform: scale(1.1) translate(15px, -15px); opacity: 0.30; }
        }
        @keyframes floatLeft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
        @keyframes floatRight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulseLogo {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 4px rgba(25, 181, 165, 0.4)); }
          50% { transform: scale(1.08); filter: drop-shadow(0 0 12px rgba(8, 127, 140, 0.5)); }
        }
        .pulse-indigo {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .pulse-pink {
          animation: pulseGlow 10s ease-in-out infinite;
        }
        .floating-blueprint-left {
          animation: floatLeft 12s ease-in-out infinite;
        }
        .floating-blueprint-right {
          animation: floatRight 14s ease-in-out infinite;
        }
        .logo-glow {
          transition: all 0.3s ease;
        }
        .logo-glow:hover {
          animation: pulseLogo 2s infinite ease-in-out;
        }
        .feature-card-hover {
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
          cursor: pointer;
        }
        .feature-card-hover:hover {
          transform: translateY(-4px) scale(1.02);
          border-color: rgba(25, 181, 165, 0.25) !important;
          background: rgba(255, 255, 255, 0.05) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35), 0 0 15px rgba(25, 181, 165, 0.08) !important;
        }
        .shimmer-button {
          background: linear-gradient(135deg, #087F8C, #19B5A5, #B8EFE4, #087F8C) !important;
          background-size: 300% 100% !important;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .shimmer-button:hover {
          background-position: 100% 50% !important;
          box-shadow: 0 8px 30px rgba(25, 181, 165, 0.4) !important;
          transform: translateY(-2px);
        }
        .shimmer-button:active {
          transform: translateY(0) scale(0.97) !important;
        }
        @keyframes ecgScroll {
          0% { stroke-dashoffset: 1200; }
          100% { stroke-dashoffset: 0; }
        }
        .ecg-line-anim {
          stroke-dasharray: 600;
          stroke-dashoffset: 600;
          animation: ecgScroll 15s linear infinite;
        }
        @keyframes portalFadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .portal-fade-enter {
          animation: portalFadeSlide 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (max-width: 1023px) {
          .desktop-only { display: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .pulse-indigo, .pulse-pink, .floating-blueprint-left, .floating-blueprint-right, .logo-glow, .ecg-line-anim, .portal-fade-enter {
            animation: none !important;
          }
        }
      `}</style>

      {/* 1. Subtle Tech Grid Overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Interactive Cursor Glow (Desktop Only) */}
      {isHovering && (
        <div
          style={{
            position: "fixed",
            left: mousePos.x - 150,
            top: mousePos.y - 150,
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(25, 181, 165, 0.08) 0%, rgba(25, 181, 165, 0) 70%)",
            pointerEvents: "none",
            zIndex: 0,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}

      {/* Optical Refraction Glass Spheres (Z-Index 0) */}
      <div
        className="pulse-indigo"
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8, 127, 140, 0.18) 0%, rgba(8, 127, 140, 0) 70%)",
          top: "10%",
          left: "15%",
          filter: "blur(20px)",
          zIndex: 0,
        }}
      />
      <div
        className="pulse-pink"
        style={{
          position: "absolute",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(25, 181, 165, 0.18) 0%, rgba(25, 181, 165, 0) 70%)",
          bottom: "5%",
          right: "15%",
          filter: "blur(25px)",
          zIndex: 0,
        }}
      />

      {/* 100% Locally Rendered SVG Hospital Blueprint (Z-Index 1) */}
      <svg
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: "100%",
          opacity: 0.18,
          pointerEvents: "none",
          zIndex: 1,
        }}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          <linearGradient id="leftGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#087F8C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#087F8C" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="rightGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#19B5A5" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#19B5A5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lightRay" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#19B5A5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Light ray sweeps */}
        <polygon points="0,0 350,600 -150,600" fill="url(#lightRay)" />
        <polygon points="800,0 1150,600 650,600" fill="url(#lightRay)" />

        {/* ECG Vitals Wave Line - Left */}
        <path
          d="M 0,520 L 70,520 L 80,500 L 90,535 L 100,520 L 125,520 L 135,465 L 145,565 L 155,520 L 195,520 L 210,500 L 220,535 L 230,520 L 320,520"
          stroke="#087F8C"
          strokeWidth="2.5"
          fill="none"
          filter="url(#glow)"
        />

        {/* ECG Vitals Wave Line - Right */}
        <path
          d="M 680,520 L 740,520 L 750,465 L 760,565 L 770,520 L 810,520 L 825,500 L 835,535 L 845,520 L 900,520 L 910,500 L 920,535 L 930,520 L 1000,520"
          stroke="#19B5A5"
          strokeWidth="2.5"
          fill="none"
          filter="url(#glow)"
        />

        {/* Circular HUD elements */}
        <circle cx="160" cy="380" r="190" stroke="rgba(8, 127, 140, 0.08)" strokeWidth="1.5" strokeDasharray="6 8" fill="none" />
        <circle cx="160" cy="380" r="130" stroke="rgba(25, 181, 165, 0.12)" strokeWidth="1" fill="none" />
        
        <circle cx="840" cy="390" r="180" stroke="rgba(25, 181, 165, 0.08)" strokeWidth="1.5" strokeDasharray="5 7" fill="none" />
        <circle cx="840" cy="390" r="120" stroke="rgba(25, 181, 165, 0.12)" strokeWidth="1" fill="none" />

        {/* --- LEFT HOSPITAL TOWER (Wireframe) --- */}
        <g className="floating-blueprint-left" transform="translate(100, 0)">
          <polygon 
            points="60,220 160,270 160,560 60,510" 
            fill="url(#leftGlow)" 
            stroke="#087F8C" 
            strokeWidth="2" 
            opacity="0.85" 
          />
          <polygon 
            points="160,270 260,220 260,510 160,560" 
            fill="url(#leftGlow)" 
            stroke="#19B5A5" 
            strokeWidth="2.5" 
            opacity="0.9" 
          />
          <polygon 
            points="60,220 160,170 260,220 160,270" 
            fill="rgba(8, 127, 140, 0.05)" 
            stroke="#087F8C" 
            strokeWidth="1.5" 
          />

          {/* Windows Left Side */}
          <g fill="#B8EFE4" opacity="0.65">
            <polygon points="80,260 100,270 100,285 80,275" />
            <polygon points="115,277 135,287 135,302 115,292" />
            <polygon points="80,310 100,320 100,335 80,325" />
            <polygon points="115,327 135,337 135,352 115,342" />
            <polygon points="80,360 100,370 100,385 80,375" />
            <polygon points="115,377 135,387 135,402 115,392" opacity="0.2" />
            <polygon points="80,410 100,420 100,435 80,425" opacity="0.3" />
            <polygon points="115,427 135,437 135,452 115,442" />
          </g>

          {/* Windows Right Side */}
          <g fill="#B8EFE4" opacity="0.8">
            <polygon points="185,287 205,277 205,292 185,302" />
            <polygon points="220,270 240,260 240,275 220,285" />
            <polygon points="185,337 205,327 205,342 185,352" opacity="0.2" />
            <polygon points="220,320 240,310 240,325 220,335" />
            <polygon points="185,387 205,377 205,392 185,402" />
            <polygon points="220,370 240,360 240,375 220,385" />
            <polygon points="185,437 205,427 205,442 185,452" />
            <polygon points="220,420 240,410 240,425 220,435" opacity="0.4" />
          </g>

          {/* Antenna */}
          <line x1="160" y1="170" x2="160" y2="120" stroke="#19B5A5" strokeWidth="2" filter="url(#glow)" />
          <circle cx="160" cy="120" r="4" fill="#ffffff" filter="url(#glow)" />
          <circle cx="160" cy="120" r="10" stroke="rgba(25, 181, 165, 0.4)" strokeWidth="1" fill="none" />
          <circle cx="160" cy="120" r="18" stroke="rgba(25, 181, 165, 0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* Medical Cross */}
          <g transform="translate(210, 310) skewY(-26.5) scale(0.95)">
            <circle cx="0" cy="0" r="22" fill="#19B5A5" opacity="0.3" filter="url(#glow)" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#087F8C" strokeWidth="2.5" />
            <rect x="-4" y="-12" width="8" height="24" fill="#ffffff" rx="2" />
            <rect x="-12" y="-4" width="24" height="8" fill="#ffffff" rx="2" />
          </g>
          <text x="210" y="360" fill="#B8EFE4" fontSize="9" fontWeight="800" textAnchor="middle" transform="skewY(-26.5)" letterSpacing="2">AI HOSPITAL</text>
        </g>

        {/* --- RIGHT HOSPITAL TOWER (Wireframe) --- */}
        <g className="floating-blueprint-right" transform="translate(-100, 0)">
          <polygon 
            points="740,270 840,320 840,560 740,510" 
            fill="url(#rightGlow)" 
            stroke="#19B5A5" 
            strokeWidth="2.5" 
            opacity="0.9" 
          />
          <polygon 
            points="840,320 940,270 940,510 840,560" 
            fill="url(#rightGlow)" 
            stroke="#19B5A5" 
            strokeWidth="2" 
            opacity="0.85" 
          />
          <polygon 
            points="740,270 840,220 940,270 840,320" 
            fill="rgba(25, 181, 165, 0.05)" 
            stroke="#19B5A5" 
            strokeWidth="1.5" 
          />

          {/* Windows Left Side */}
          <g fill="#B8EFE4" opacity="0.8">
            <polygon points="760,310 780,320 780,335 760,325" />
            <polygon points="795,327 815,337 815,352 795,342" />
            <polygon points="760,360 780,370 780,385 760,375" opacity="0.3" />
            <polygon points="795,377 815,387 815,402 795,392" />
            <polygon points="760,410 780,420 780,435 760,425" />
            <polygon points="795,427 815,437 815,452 795,442" />
            <polygon points="760,460 780,470 780,485 760,475" />
            <polygon points="795,477 815,487 815,502 795,492" opacity="0.2" />
          </g>

          {/* Windows Right Side */}
          <g fill="#B8EFE4" opacity="0.65">
            <polygon points="865,337 885,327 885,342 865,352" />
            <polygon points="900,320 920,310 920,325 900,335" />
            <polygon points="865,387 885,377 885,392 865,402" />
            <polygon points="900,370 920,360 920,375 900,385" opacity="0.3" />
            <polygon points="865,437 885,427 885,442 865,452" opacity="0.1" />
            <polygon points="900,420 920,410 920,425 900,435" />
            <polygon points="865,487 885,477 885,492 865,502" />
            <polygon points="900,470 920,460 920,475 900,485" />
          </g>

          {/* Antenna */}
          <line x1="840" y1="220" x2="840" y2="170" stroke="#19B5A5" strokeWidth="2" filter="url(#glow)" />
          <circle cx="840" cy="170" r="4" fill="#ffffff" filter="url(#glow)" />
          <circle cx="840" cy="170" r="10" stroke="rgba(25, 181, 165, 0.4)" strokeWidth="1" fill="none" />
          <circle cx="840" cy="170" r="18" stroke="rgba(25, 181, 165, 0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* Medical Cross */}
          <g transform="translate(790, 355) skewY(26.5) scale(0.95)">
            <circle cx="0" cy="0" r="22" fill="#19B5A5" opacity="0.3" filter="url(#glow)" />
            <circle cx="0" cy="0" r="18" fill="none" stroke="#19B5A5" strokeWidth="2.5" />
            <rect x="-4" y="-12" width="8" height="24" fill="#ffffff" rx="2" />
            <rect x="-12" y="-4" width="24" height="8" fill="#ffffff" rx="2" />
          </g>
          <text x="790" y="405" fill="#B8EFE4" fontSize="9" fontWeight="800" textAnchor="middle" transform="skewY(26.5)" letterSpacing="2">AI HOSPITAL</text>
        </g>
      </svg>

      {/* Outer Flex Container for Left Column + Login Card + Right Column */}
      <div
        style={{
          display: "flex",
          width: "100%",
          maxWidth: "1200px",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1.5rem",
          zIndex: 2,
        }}
      >
        {/* Left Features column (Desktop only) */}
        <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "250px" }}>
          {/* Card 1 */}
          <div 
            className="feature-card-hover"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "1.1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <ShieldCheck size={26} style={{ color: "#39A96B", flexShrink: 0 }} />
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>Enterprise Security</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", margin: "0.15rem 0 0 0" }}>Role-based access & data protection</p>
            </div>
          </div>

          {/* Card 2 */}
          <div 
            className="feature-card-hover"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "1.1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Cpu size={26} style={{ color: "#19B5A5", flexShrink: 0 }} />
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>AI-Powered Platform</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", margin: "0.15rem 0 0 0" }}>Smart automation & insights</p>
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className="feature-card-hover"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "1.1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Cloud size={26} style={{ color: "#087F8C", flexShrink: 0 }} />
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>Cloud Integrated</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", margin: "0.15rem 0 0 0" }}>Scalable, reliable & always available</p>
            </div>
          </div>

          {/* Card 4 */}
          <div 
            className="feature-card-hover"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "16px",
              padding: "1.1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
            }}
          >
            <Clock size={26} style={{ color: "#39A96B", flexShrink: 0 }} />
            <div>
              <h4 style={{ color: "#ffffff", fontSize: "0.85rem", fontWeight: 700, margin: 0 }}>24/7 Availability</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.72rem", margin: "0.15rem 0 0 0" }}>Always here for you and your patients</p>
            </div>
          </div>
        </div>

        {/* Center column: The Login Card Wrapper */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", flex: 1, maxWidth: "430px" }}>
          <div
            className="modal-card login-card"
            style={{
              width: "100%",
              maxWidth: "430px",
              padding: "2.5rem 2.25rem",
              background: "linear-gradient(135deg, rgba(30, 41, 59, 0.55) 0%, rgba(15, 23, 42, 0.35) 100%)",
              backdropFilter: "blur(24px) saturate(110%)",
              WebkitBackdropFilter: "blur(24px) saturate(110%)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "24px",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
              zIndex: 2,
              overflow: "hidden"
            }}
          >
            {/* Header Branding */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <div
                className="logo-glow"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "18px",
                  background: "linear-gradient(135deg, #087F8C 0%, #19B5A5 100%)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  boxShadow: "0 8px 32px rgba(8, 127, 140, 0.35)",
                  marginBottom: "1rem",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <Activity size={34} />
              </div>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#ffffff", letterSpacing: "-0.5px", textShadow: "0 0 20px rgba(8, 127, 140, 0.25)" }}>
                AI Hospital
              </h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.35rem", fontWeight: 500 }}>
                Hospital Employee & Patient Portal
              </p>
            </div>

            {/* Tab Switcher for Staff vs Patient Portal */}
            <div
              style={{
                display: "flex",
                background: "rgba(255, 255, 255, 0.03)",
                padding: "0.3rem",
                borderRadius: "14px",
                marginBottom: "2rem",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  borderRadius: "11px",
                  border: "none",
                  background: activeTab === "staff" ? "linear-gradient(135deg, #087F8C 0%, #19B5A5 100%)" : "transparent",
                  color: activeTab === "staff" ? "#ffffff" : "#94a3b8",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: activeTab === "staff" ? "0 4px 12px rgba(8, 127, 140, 0.25)" : "none",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onClick={() => setActiveTab("staff")}
              >
                Staff Portal
              </button>
              <button
                type="button"
                style={{
                  flex: 1,
                  padding: "0.7rem",
                  borderRadius: "11px",
                  border: "none",
                  background: activeTab === "patient" ? "linear-gradient(135deg, #087F8C 0%, #19B5A5 100%)" : "transparent",
                  color: activeTab === "patient" ? "#ffffff" : "#94a3b8",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: activeTab === "patient" ? "0 4px 12px rgba(8, 127, 140, 0.25)" : "none",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
                onClick={() => setActiveTab("patient")}
              >
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
                  background: "rgba(8, 127, 140, 0.2)",
                  border: "1px solid rgba(25, 181, 165, 0.3)",
                  color: "#B8EFE4",
                  padding: "0.75rem 1rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <span>{placeholderNotice}</span>
                <button
                  style={{ background: "none", border: "none", color: "#B8EFE4", cursor: "pointer", fontWeight: "bold" }}
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
                  background: "rgba(220, 38, 38, 0.15)",
                  border: "1px solid rgba(248, 113, 113, 0.3)",
                  color: "#fca5a5",
                  padding: "0.85rem 1rem",
                  borderRadius: "12px",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                }}
              >
                <AlertCircle size={20} style={{ flexShrink: 0, color: "#f87171" }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div key={activeTab} className="portal-fade-enter" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {activeTab === "staff" ? (
                  <>
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Email Address
                      </label>
                      <div 
                        className="login-input-wrapper" 
                        style={{ 
                          minWidth: "auto", 
                          background: focusedInput === "email" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)", 
                          border: focusedInput === "email" ? "1.5px solid rgba(25, 181, 165, 0.8)" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          padding: "0.3rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backdropFilter: "blur(5px)",
                          WebkitBackdropFilter: "blur(5px)",
                          boxShadow: focusedInput === "email" ? "0 0 15px rgba(25, 181, 165, 0.3)" : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <Mail size={18} style={{ color: focusedInput === "email" ? "#19B5A5" : "#64748b", transition: "color 0.3s ease" }} />
                        <input
                          type="email"
                          placeholder="superadmin@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setFocusedInput("email")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "#ffffff", 
                            outline: "none",
                            width: "100%",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                          Password
                        </label>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "#19B5A5", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}
                          onClick={() => handlePlaceholderClick("Forgot Password")}
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div 
                        className="login-input-wrapper" 
                        style={{ 
                          minWidth: "auto", 
                          background: focusedInput === "password" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)", 
                          border: focusedInput === "password" ? "1.5px solid rgba(25, 181, 165, 0.8)" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          padding: "0.3rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backdropFilter: "blur(5px)",
                          WebkitBackdropFilter: "blur(5px)",
                          boxShadow: focusedInput === "password" ? "0 0 15px rgba(25, 181, 165, 0.3)" : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <Lock size={18} style={{ color: focusedInput === "password" ? "#19B5A5" : "#64748b", transition: "color 0.3s ease" }} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setFocusedInput("password")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "#ffffff", 
                            outline: "none",
                            width: "100%",
                            fontSize: "0.9rem"
                          }}
                        />
                        <button
                          type="button"
                          className="action-btn"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ padding: "0.2rem", background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Patient ID (UHID) *
                      </label>
                      <div 
                        className="login-input-wrapper" 
                        style={{ 
                          minWidth: "auto", 
                          background: focusedInput === "uhid" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)", 
                          border: focusedInput === "uhid" ? "1.5px solid rgba(25, 181, 165, 0.8)" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          padding: "0.3rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backdropFilter: "blur(5px)",
                          WebkitBackdropFilter: "blur(5px)",
                          boxShadow: focusedInput === "uhid" ? "0 0 15px rgba(25, 181, 165, 0.3)" : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <KeyRound size={18} style={{ color: focusedInput === "uhid" ? "#19B5A5" : "#64748b", transition: "color 0.3s ease" }} />
                        <input
                          type="text"
                          placeholder="E.g. KIMS-W-10001"
                          value={uhid}
                          onChange={(e) => setUhid(e.target.value)}
                          onFocus={() => setFocusedInput("uhid")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "#ffffff", 
                            outline: "none",
                            width: "100%",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                        Registered Mobile Number *
                      </label>
                      <div 
                        className="login-input-wrapper" 
                        style={{ 
                          minWidth: "auto", 
                          background: focusedInput === "mobile" ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.03)", 
                          border: focusedInput === "mobile" ? "1.5px solid rgba(25, 181, 165, 0.8)" : "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "12px",
                          padding: "0.3rem 0.75rem",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          backdropFilter: "blur(5px)",
                          WebkitBackdropFilter: "blur(5px)",
                          boxShadow: focusedInput === "mobile" ? "0 0 15px rgba(25, 181, 165, 0.3)" : "none",
                          transition: "all 0.3s ease"
                        }}
                      >
                        <Smartphone size={18} style={{ color: focusedInput === "mobile" ? "#19B5A5" : "#64748b", transition: "color 0.3s ease" }} />
                        <input
                          type="text"
                          placeholder="Enter 10-digit mobile number..."
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          onFocus={() => setFocusedInput("mobile")}
                          onBlur={() => setFocusedInput(null)}
                          required
                          style={{ 
                            background: "transparent", 
                            border: "none", 
                            color: "#ffffff", 
                            outline: "none",
                            width: "100%",
                            fontSize: "0.9rem"
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary shimmer-button"
                disabled={submitting}
                style={{
                  width: "100%",
                  justifyContent: "center",
                  padding: "0.9rem",
                  fontSize: "1rem",
                  borderRadius: "14px",
                  marginTop: "0.5rem",
                  background: "linear-gradient(135deg, #087F8C 0%, #19B5A5 50%, #B8EFE4 100%)",
                  border: "none",
                  color: "#ffffff",
                  boxShadow: "0 8px 24px rgba(25, 181, 165, 0.35)",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.3s ease",
                }}
              >
                <LogIn size={20} />
                <span>{submitting ? "Signing in..." : activeTab === "staff" ? "Sign In to Dashboard" : "Sign In to Patient Portal"}</span>
              </button>
            </form>

            {/* Secondary Placeholder Action Buttons */}
            <div 
              style={{ 
                marginTop: "2rem", 
                paddingTop: "1.5rem", 
                borderTop: "1px solid rgba(255, 255, 255, 0.08)", 
                display: "flex", 
                flexWrap: "wrap", 
                gap: "0.5rem", 
                justifyContent: "center" 
              }}
            >
              <button
                className="btn btn-secondary"
                style={{ 
                  fontSize: "0.75rem", 
                  padding: "0.5rem 0.85rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#cbd5e1",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onClick={() => handlePlaceholderClick("Reset Password")}
              >
                <KeyRound size={14} />
                <span>Reset Password</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ 
                  fontSize: "0.75rem", 
                  padding: "0.5rem 0.85rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#cbd5e1",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onClick={() => handlePlaceholderClick("Session Timeout Config")}
              >
                <Clock size={14} />
                <span>Session Timeout</span>
              </button>

              <button
                className="btn btn-secondary"
                style={{ 
                  fontSize: "0.75rem", 
                  padding: "0.5rem 0.85rem",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "#cbd5e1",
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                }}
                onClick={() => handlePlaceholderClick("Multi Device Logout")}
              >
                <ShieldOff size={14} />
                <span>Multi-Device Logout</span>
              </button>
            </div>
          </div>

          {/* Center Column Tagline */}
          <div style={{
            color: "#ffffff",
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "1.5px",
            opacity: 0.85,
            textAlign: "center",
            marginTop: "1.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            textShadow: "0 0 10px rgba(25, 181, 165, 0.45)"
          }}>
            <span style={{ color: "#19B5A5", fontWeight: "bold" }}>&rarr;</span>
            <span>Caring with Technology, Healing with Intelligence</span>
            <span style={{ color: "#087F8C", fontWeight: "bold" }}>&larr;</span>
          </div>
        </div>

        {/* Right Column: Security Lock Badge */}
        <div className="desktop-only" style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "250px", alignItems: "flex-end" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "20px",
            padding: "1.25rem 1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            maxWidth: "250px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#cbd5e1",
              flexShrink: 0
            }}>
              <Lock size={18} />
            </div>
            <div>
              <span style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: "#cbd5e1",
                letterSpacing: "0.5px",
                opacity: 0.8
              }}>Secure • Smart • Reliable</span>
              <h4 style={{ color: "#ffffff", fontSize: "0.8rem", fontWeight: 700, marginTop: "0.25rem", marginBottom: 0 }}>AI-Powered Healthcare</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.7rem", margin: "0.2rem 0 0 0" }}>Management System</p>
            </div>
          </div>
        </div>

        {/* Animated Bottom ECG Waveform */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "45px",
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 1,
            opacity: 0.25,
          }}
        >
          <svg width="100%" height="100%" viewBox="0 0 1200 45" preserveAspectRatio="none">
            <defs>
              <linearGradient id="ecgGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#087F8C" />
                <stop offset="50%" stopColor="#19B5A5" />
                <stop offset="100%" stopColor="#B8EFE4" />
              </linearGradient>
            </defs>
            <path
              className="ecg-line-anim"
              d="M 0,22 L 200,22 L 210,12 L 220,32 L 230,22 L 280,22 L 290,2 L 300,42 L 310,22 L 325,22 L 335,17 L 345,27 L 355,22 L 550,22 L 560,12 L 570,32 L 580,22 L 630,22 L 640,2 L 650,42 L 660,22 L 675,22 L 685,17 L 695,27 L 705,22 L 900,22 L 910,12 L 920,32 L 930,22 L 980,22 L 990,2 L 1000,42 L 1010,22 L 1025,22 L 1035,17 L 1045,27 L 1055,22 L 1250,22"
              fill="none"
              stroke="url(#ecgGlow)"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Login;
