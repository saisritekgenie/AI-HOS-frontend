import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import DoctorManagement from "./pages/DoctorManagement";
import HospitalManagement from "./pages/HospitalManagement";
import PatientManagement from "./pages/PatientManagement";
import Login from "./pages/Login";
import "./styles/main.css";

const MainAppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (user) {
      if (user.role === "SUPER_ADMIN") {
        setActiveTab("hospitals");
      } else if (user.role === "ADMIN") {
        setActiveTab("users");
      } else {
        setActiveTab("dashboard");
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
        }}
      >
        <p>Loading security session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === "dashboard" && (
        <Dashboard
          onNavigateToHospitals={() => setActiveTab("hospitals")}
          onNavigateToUsers={() => setActiveTab("users")}
          onNavigateToPatients={() => setActiveTab("patients")}
          onNavigateToAppointments={() => setActiveTab("appointments")}
        />
      )}

      {activeTab === "hospitals" && <HospitalManagement />}

      {activeTab === "users" && <UserManagement />}

      {activeTab === "doctors" && <DoctorManagement />}

      {activeTab === "patients" && <PatientManagement />}

      {activeTab !== "dashboard" && activeTab !== "hospitals" && activeTab !== "users" && activeTab !== "doctors" && activeTab !== "patients" && (
        <div style={{ padding: "3rem", textAlign: "center" }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
          </h2>
          <p style={{ color: "var(--text-secondary)" }}>
            This module is ready for integration in the next build phase.
          </p>
        </div>
      )}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}

export default App;
