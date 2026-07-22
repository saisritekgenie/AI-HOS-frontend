import React from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

const Layout = ({ activeTab, setActiveTab, children }) => {
  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Navbar />
        <main className="content-body">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
