import React from "react";
import { Activity, Bell, ShieldCheck, LogOut, Building, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const hospitalName = user?.hospital?.name || "SaaS Master HQ";

  return (
    <header className="navbar">
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <button 
          className="menu-toggle-btn" 
          onClick={(e) => {
            console.log("Hamburger Menu Button Clicked!");
            if (onMenuClick) onMenuClick();
          }}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            display: "none", // Block displays this on mobile via CSS
            alignItems: "center",
            justifyContent: "center",
            padding: "0.25rem"
          }}
        >
          <Menu size={24} />
        </button>

        <div className="navbar-brand">
          <Activity className="w-6 h-6 text-sky-600" />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span className="brand-title-main">AI Hospital System</span>
            <span className="brand-title-sub" style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <Building size={12} />
              {hospitalName}
            </span>
          </div>
        </div>
      </div>

      <div className="navbar-user">
        <button className="action-btn" title="Notifications">
          <Bell size={20} />
        </button>

        <div className="user-badge">
          <div className="user-avatar">
            {user ? user.firstName.charAt(0).toUpperCase() : <ShieldCheck size={18} />}
          </div>
          <div className="user-info">
            <span className="user-name">
              {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
            </span>
            <span className="user-role">{user ? user.role : "SUPER_ADMIN"}</span>
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={logout}
          title="Sign Out"
          style={{ padding: "0.5rem 0.85rem", gap: "0.4rem" }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
