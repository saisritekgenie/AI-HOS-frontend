import React from "react";
import { Users, LayoutDashboard, Stethoscope, UserCheck, Calendar, Settings, Hospital, Building } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();

  // Navigation Items customized by Role
  let navItems = [];
  if (user?.role === "SUPER_ADMIN") {
    navItems = [
      { id: "dashboard", label: "Overview", icon: LayoutDashboard },
      { id: "hospitals", label: "Hospitals & Approvals", icon: Building },
      { id: "settings", label: "Platform Settings", icon: Settings },
    ];
  } else if (user?.role === "ADMIN") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "users", label: "Hospital Staff", icon: Users },
      { id: "doctors", label: "Doctors", icon: Stethoscope },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "settings", label: "Hospital Settings", icon: Settings },
    ];
  } else if (user?.role === "DOCTOR") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "settings", label: "Hospital Settings", icon: Settings },
    ];
  } else {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
    ];
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Hospital size={22} />
        </div>
        <div className="logo-text">MediCore AI</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
