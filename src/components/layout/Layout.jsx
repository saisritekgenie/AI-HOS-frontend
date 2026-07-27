import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ activeTab, setActiveTab, children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isMobileSidebarOpen} 
        onClose={() => {
          console.log("Layout: Closing Mobile Sidebar");
          setIsMobileSidebarOpen(false);
        }} 
      />
      <div className="main-content">
        <Navbar onMenuClick={() => {
          console.log("Layout: Opening Mobile Sidebar");
          setIsMobileSidebarOpen(true);
        }} />
        <main className="content-body">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
