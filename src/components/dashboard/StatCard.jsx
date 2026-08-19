import React from "react";

const StatCard = ({ label, value, icon: Icon, color = "#2563EB", bg = "rgba(37, 99, 235, 0.05)", onClick }) => {
  const cardClass = label ? `card-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}` : "";
  
  // Dynamic top-right badges matching the Lumina Health Portal design mockup image!
  let badge = null;
  let progress = null;
  let valueSuffix = "";

  const labelLower = label.toLowerCase();
  
  if (labelLower.includes("patient")) {
    badge = (
      <span style={{ 
        fontSize: "0.75rem", 
        fontWeight: "600", 
        color: "var(--status-active-text)", 
        background: "var(--status-active-bg)", 
        padding: "0.25rem 0.5rem", 
        borderRadius: "20px",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.15rem"
      }}>
        ↗ 4.2%
      </span>
    );
  } else if (labelLower.includes("bed") || labelLower.includes("capacity")) {
    badge = (
      <span style={{ 
        fontSize: "0.75rem", 
        fontWeight: "500", 
        color: "var(--text-secondary)", 
        background: "rgba(8, 127, 140, 0.08)", 
        padding: "0.25rem 0.5rem", 
        borderRadius: "4px"
      }}>
        Capacity
      </span>
    );
    // Render progress bar below value (e.g. 85%)
    progress = (
      <div style={{ width: "100%", height: "6px", background: "rgba(8, 127, 140, 0.08)", borderRadius: "3px", marginTop: "0.75rem", overflow: "hidden" }}>
        <div style={{ width: "85%", height: "100%", background: "var(--accent-secondary)", borderRadius: "3px" }} />
      </div>
    );
    valueSuffix = (
      <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "500", marginLeft: "0.25rem" }}>
        / 450 total
      </span>
    );
  } else if (labelLower.includes("doctor") || labelLower.includes("staff")) {
    badge = (
      <span style={{ 
        fontSize: "0.75rem", 
        fontWeight: "600", 
        color: "var(--status-active-text)", 
        display: "inline-flex",
        alignItems: "center",
        gap: "0.25rem"
      }}>
        <span style={{ width: "6px", height: "6px", background: "var(--status-active-text)", borderRadius: "50%" }} />
        Active Now
      </span>
    );
  } else if (labelLower.includes("emergency") || labelLower.includes("critical") || labelLower.includes("alert") || labelLower.includes("alarm")) {
    badge = (
      <span style={{ 
        fontSize: "0.75rem", 
        fontWeight: "600", 
        color: "var(--status-inactive-text)", 
        background: "var(--status-inactive-bg)", 
        padding: "0.25rem 0.5rem", 
        borderRadius: "20px",
        display: "inline-flex",
        alignItems: "center",
        gap: "0.15rem"
      }}>
        ↗ High
      </span>
    );
    valueSuffix = (
      <span style={{ color: "var(--status-inactive-text)", fontWeight: "800", marginLeft: "0.25rem", fontSize: "1.25rem" }}>
        ↑
      </span>
    );
  }

  return (
    <div 
      className={`stat-card ${cardClass}`} 
      onClick={onClick}
      style={{ 
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <div className="stat-card-header">
        <div className="stat-icon-wrapper" style={{ backgroundColor: bg, color }}>
          <Icon size={20} />
        </div>
        {badge}
      </div>

      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">
          {value}
          {valueSuffix}
        </div>
        {progress}
      </div>
    </div>
  );
};

export default StatCard;
