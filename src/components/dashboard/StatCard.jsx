import React from "react";

const StatCard = ({ label, value, icon: Icon, color = "#38bdf8", bg = "rgba(56, 189, 248, 0.15)", onClick }) => {
  return (
    <div 
      className="stat-card" 
      onClick={onClick}
      style={{ 
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div className="stat-info">
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
      </div>
      <div className="stat-icon-wrapper" style={{ backgroundColor: bg, color }}>
        <Icon size={24} />
      </div>
    </div>
  );
};

export default StatCard;
