import React, { useState, useEffect } from "react";
import { Users, LayoutDashboard, Stethoscope, UserCheck, Calendar, Settings, Hospital, Building, ClipboardList, Activity, Pill, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { fetchUsers } from "../../services/api";

const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user } = useAuth();
  const [roleCounts, setRoleCounts] = useState({
    ADMIN: 0,
    DOCTOR: 0,
    NURSE: 0,
    RECEPTIONIST: 0,
    LAB_TECHNICIAN: 0,
    PHARMACIST: 0,
    CASHIER: 0
  });

  const [isStaffExpanded, setIsStaffExpanded] = useState(() => {
    const savedActiveSub = localStorage.getItem("sidebar_active_sub");
    return activeTab === "users" || (savedActiveSub && savedActiveSub.startsWith("role-"));
  });

  const loadCounts = async () => {
    try {
      const res = await fetchUsers({ limit: 500 });
      const list = res.data || [];
      setRoleCounts({
        ADMIN: list.filter(u => u.role === "ADMIN").length,
        DOCTOR: list.filter(u => u.role === "DOCTOR").length,
        NURSE: list.filter(u => u.role === "NURSE").length,
        RECEPTIONIST: list.filter(u => u.role === "RECEPTIONIST").length,
        LAB_TECHNICIAN: list.filter(u => u.role === "LAB_TECHNICIAN").length,
        PHARMACIST: list.filter(u => u.role === "PHARMACIST").length,
        CASHIER: list.filter(u => u.role === "CASHIER").length
      });
    } catch (e) {
      console.error("Failed to load sidebar counts", e);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      loadCounts();
      window.addEventListener("staff_list_updated", loadCounts);
      return () => window.removeEventListener("staff_list_updated", loadCounts);
    }
  }, [user]);

  useEffect(() => {
    const savedActiveSub = localStorage.getItem("sidebar_active_sub");
    if (activeTab === "users") {
      setIsStaffExpanded(true);
    } else if (!savedActiveSub?.startsWith("role-")) {
      setIsStaffExpanded(false);
    }
  }, [activeTab]);

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
      { id: "role-admin", label: "Hospital Admins", icon: ShieldCheck, isSub: true },
      { id: "role-doctor", label: "Doctors", icon: Stethoscope, isSub: true },
      { id: "role-nurse", label: "Nurses", icon: Activity, isSub: true },
      { id: "role-receptionist", label: "Receptionists", icon: Calendar, isSub: true },
      { id: "role-lab_technician", label: "Lab Technicians", icon: Activity, isSub: true },
      { id: "role-pharmacist", label: "Pharmacists", icon: Pill, isSub: true },
      { id: "role-cashier", label: "Cashiers", icon: ClipboardList, isSub: true },
      { id: "doctors", label: "Doctors Directory", icon: Stethoscope },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "settings", label: "Hospital Settings", icon: Settings },
      { id: "audit-logs", label: "Audit Activity Logs", icon: ShieldCheck },
    ];
  } else if (user?.role === "DOCTOR") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "settings", label: "Hospital Settings", icon: Settings },
    ];
  } else if (user?.role === "NURSE") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients", icon: UserCheck },
    ];
  } else if (user?.role === "RECEPTIONIST") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients Directory", icon: UserCheck },
      { id: "walkin-booking", label: "Walk-in Booking", icon: UserCheck },
      { id: "online-booking", label: "Online Booking", icon: Users },
      { id: "appointments", label: "Appointments", icon: Calendar },
      { id: "doctors", label: "Doctors", icon: Stethoscope },
      { id: "billing", label: "Billing", icon: ClipboardList },
      { id: "admissions", label: "Admissions", icon: Building },
    ];
  } else if (user?.role === "LAB_TECHNICIAN") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "labs", label: "Lab Worklist Queue", icon: Activity },
    ];
  } else if (user?.role === "PHARMACIST") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "pharmacy", label: "Pharmacy Store", icon: Pill },
    ];
  } else if (user?.role === "CASHIER") {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "billing", label: "Billing Counter", icon: ClipboardList },
    ];
  } else {
    navItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { id: "patients", label: "Patients", icon: UserCheck },
      { id: "appointments", label: "Appointments", icon: Calendar },
    ];
  }

  const savedActiveSub = localStorage.getItem("sidebar_active_sub");

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay" 
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(4px)",
            zIndex: 990
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        {/* Mobile Close Button */}
        <div style={{ display: "none", justifyContent: "flex-end", padding: "0.25rem 0.5rem" }} className="mobile-close-container">
          <button 
            onClick={onClose} 
            style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "1.2rem", fontWeight: "bold" }}
          >
            ✕
          </button>
        </div>

        <div className="sidebar-logo">
          <div className="logo-icon">
            <Hospital size={22} />
          </div>
          <div className="logo-text">AI Hospital</div>
        </div>

        <nav className="sidebar-nav">
          {navItems
            .filter((item) => !item.isSub || isStaffExpanded)
            .map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || 
                               (activeTab === "patients" && item.id === savedActiveSub) ||
                               (activeTab === "users" && item.id === savedActiveSub);
              
              const isPatientRelated = ["patients", "walkin-booking", "online-booking", "appointments", "admissions"].includes(item.id);
              
              return (
              <div
                key={item.id}
                className={`nav-item ${isActive ? "active" : ""} ${isActive && isPatientRelated ? "patient-related-active" : ""}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingLeft: item.isSub ? "2.5rem" : "1.25rem",
                  fontSize: item.isSub ? "0.8rem" : "inherit",
                  opacity: item.isSub && !isActive ? 0.8 : 1,
                  cursor: "pointer",
                  paddingTop: item.isSub ? "0.4rem" : "0.75rem",
                  paddingBottom: item.isSub ? "0.4rem" : "0.75rem"
                }}
                onClick={() => {
                  if (item.id === "walkin-booking") {
                    localStorage.setItem("patient_filter", "WALK_IN");
                    localStorage.setItem("sidebar_active_sub", "walkin-booking");
                    setActiveTab("patients");
                    window.dispatchEvent(new CustomEvent("patient_filter_changed", { detail: "WALK_IN" }));
                  } else if (item.id === "online-booking") {
                    localStorage.setItem("patient_filter", "ONLINE");
                    localStorage.setItem("sidebar_active_sub", "online-booking");
                    setActiveTab("patients");
                    window.dispatchEvent(new CustomEvent("patient_filter_changed", { detail: "ONLINE" }));
                  } else if (item.id.startsWith("role-")) {
                    const role = item.id.replace("role-", "").toUpperCase();
                    localStorage.setItem("staff_role_filter", role);
                    localStorage.setItem("sidebar_active_sub", item.id);
                    setActiveTab("users");
                    window.dispatchEvent(new CustomEvent("staff_role_filter_changed", { detail: role }));
                  } else {
                    localStorage.removeItem("sidebar_active_sub");
                    if (item.id === "patients") {
                      localStorage.removeItem("patient_filter");
                      window.dispatchEvent(new Event("clear_patient_filter"));
                    }
                    if (item.id === "users") {
                      localStorage.removeItem("staff_role_filter");
                      window.dispatchEvent(new CustomEvent("staff_role_filter_changed", { detail: "" }));
                      if (activeTab === "users") {
                        setIsStaffExpanded(!isStaffExpanded);
                      } else {
                        setIsStaffExpanded(true);
                      }
                    }
                    setActiveTab(item.id);
                  }
                  if (onClose) onClose(); // Auto-close drawer on mobile when clicking any menu link
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Icon size={item.isSub ? 16 : 20} />
                  <span>{item.label}</span>
                </div>
                {item.id === "users" && (
                  <div style={{ display: "flex", alignItems: "center", color: "var(--text-secondary)" }}>
                    {isStaffExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
                {item.isSub && (
                  <span style={{
                    fontSize: "0.75rem",
                    padding: "0.15rem 0.45rem",
                    borderRadius: "20px",
                    background: isActive ? "rgba(255, 255, 255, 0.25)" : "rgba(8, 127, 140, 0.08)",
                    color: isActive ? "white" : "var(--accent-primary)"
                  }}>
                    {roleCounts[item.id.replace("role-", "").toUpperCase()] || 0}
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
