import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { useAuth } from "../../context/AuthContext";
import { AdminChatbot } from "../ai/AdminChatbot";
import { ReceptionistChatbot } from "../ai/ReceptionistChatbot";
import { DoctorChatbot } from "../ai/DoctorChatbot";
import { NurseChatbot } from "../ai/NurseChatbot";
import { LabTechnicianChatbot } from "../ai/LabTechnicianChatbot";
import { PharmacistChatbot } from "../ai/PharmacistChatbot";
import { CashierChatbot } from "../ai/CashierChatbot";

const Layout = ({ activeTab, setActiveTab, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { user } = useAuth();

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMousePos({ x, y });
    };

    if (window.matchMedia("(pointer: fine)").matches) {
      window.addEventListener("mousemove", handleMouseMove);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="app-layout">
      {/* Premium Glassmorphic Background Orbs with Cursor Parallax */}
      <div className="glass-orbs">
        <div 
          className="orb-wrapper" 
          style={{ 
            transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)`, 
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)" 
          }}
        >
          <div className="orb orb-1"></div>
        </div>
        <div 
          className="orb-wrapper" 
          style={{ 
            transform: `translate(${mousePos.x * -28}px, ${mousePos.y * -28}px)`, 
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)" 
          }}
        >
          <div className="orb orb-2"></div>
        </div>
        <div 
          className="orb-wrapper" 
          style={{ 
            transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 12}px)`, 
            transition: "transform 0.3s cubic-bezier(0.1, 0.8, 0.3, 1)" 
          }}
        >
          <div className="orb orb-3"></div>
        </div>
      </div>

      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => {
          console.log("Layout: Closing Mobile Sidebar");
          setIsMobileSidebarOpen(false);
        }} 
      />
      <div className="main-content" style={{ position: "relative" }}>
        {/* Animated background waves */}
        <div className="right-bg-waves">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path className="wave-path wave-path-1" d="M0,96C288,160,576,64,864,128C1152,192,1344,96,1440,48L1440,320L1152,320C864,320,576,320,288,320L0,320Z" />
            <path className="wave-path wave-path-2" d="M0,192C240,149.3,480,64,720,106.7C960,149,1200,213,1320,245.3L1440,277L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,0,320Z" />
            <path className="wave-path wave-path-3" d="M0,224C180,256,360,160,540,149.3C720,139,900,213,1080,245.3C1260,277,1350,267,1440,256L1440,320L1350,320C1260,320,1080,320,900,320C720,320,540,320,360,320L180,320L0,320Z" />
          </svg>
        </div>
        <Navbar onMenuClick={() => {
          console.log("Layout: Opening Mobile Sidebar");
          setIsMobileSidebarOpen(true);
        }} />
        <main className="content-body" style={{ position: "relative", zIndex: 1 }}>{children}</main>
      </div>

      {/* Role-Based AI Assistants rendered globally across all pages */}
      {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && <AdminChatbot activeTab={activeTab} />}
      {user?.role === "RECEPTIONIST" && <ReceptionistChatbot activeTab={activeTab} />}
      {user?.role === "DOCTOR" && <DoctorChatbot activeTab={activeTab} />}
      {user?.role === "NURSE" && <NurseChatbot activeTab={activeTab} />}
      {user?.role === "LAB_TECHNICIAN" && <LabTechnicianChatbot activeTab={activeTab} />}
      {user?.role === "PHARMACIST" && <PharmacistChatbot activeTab={activeTab} />}
      {user?.role === "CASHIER" && <CashierChatbot activeTab={activeTab} />}
    </div>
  );
};

export default Layout;
