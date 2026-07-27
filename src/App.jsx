import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/layout/Layout";
import "./styles/main.css";

// Lazy-load page components for optimized bundle size and speed
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const UserManagement = React.lazy(() => import("./pages/UserManagement"));
const DoctorManagement = React.lazy(() => import("./pages/DoctorManagement"));
const HospitalManagement = React.lazy(() => import("./pages/HospitalManagement"));
const PatientManagement = React.lazy(() => import("./pages/PatientManagement"));
const PendingTasks = React.lazy(() => import("./pages/PendingTasks"));
const MedicationsDue = React.lazy(() => import("./pages/MedicationsDue"));
const CriticalAlerts = React.lazy(() => import("./pages/CriticalAlerts"));
const Appointments = React.lazy(() => import("./pages/Appointments"));
const Billing = React.lazy(() => import("./pages/Billing"));
const Admissions = React.lazy(() => import("./pages/Admissions"));
const Labs = React.lazy(() => import("./pages/Labs"));
const Pharmacy = React.lazy(() => import("./pages/Pharmacy"));
const CashierBilling = React.lazy(() => import("./pages/CashierBilling"));
const Login = React.lazy(() => import("./pages/Login"));
const PatientPortal = React.lazy(() => import("./pages/PatientPortal"));
const AuditLogs = React.lazy(() => import("./pages/AuditLogs"));


// Custom aesthetic visual skeleton loader representing dashboard structure
const SkeletonLoader = () => (
  <div style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", boxSizing: "border-box" }}>
    <div className="skeleton-pulse" style={{ height: "32px", width: "30%", background: "#e2e8f0", borderRadius: "8px" }} />
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", width: "100%" }}>
      <div className="skeleton-pulse" style={{ height: "120px", background: "#e2e8f0", borderRadius: "16px" }} />
      <div className="skeleton-pulse" style={{ height: "120px", background: "#e2e8f0", borderRadius: "16px" }} />
      <div className="skeleton-pulse" style={{ height: "120px", background: "#e2e8f0", borderRadius: "16px" }} />
    </div>
    <div className="skeleton-pulse" style={{ height: "320px", background: "#e2e8f0", borderRadius: "16px", width: "100%" }} />
  </div>
);

const MainAppContent = () => {
  const { user, isAuthenticated, loading } = useAuth();
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
    return (
      <React.Suspense fallback={<SkeletonLoader />}>
        <Login />
      </React.Suspense>
    );
  }

  if (user?.role === "PATIENT") {
    return (
      <React.Suspense fallback={<SkeletonLoader />}>
        <PatientPortal />
      </React.Suspense>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <React.Suspense fallback={<SkeletonLoader />}>
        {activeTab === "dashboard" && (
          <Dashboard
            onNavigateToHospitals={() => setActiveTab("hospitals")}
            onNavigateToUsers={() => setActiveTab("users")}
            onNavigateToPatients={(filter) => {
              if (filter) {
                localStorage.setItem("patient_filter", filter);
              } else {
                localStorage.removeItem("patient_filter");
              }
              setActiveTab("patients");
            }}
            onNavigateToAppointments={() => setActiveTab("appointments")}
            onNavigateToPendingTasks={() => setActiveTab("pending-tasks")}
            onNavigateToMedicationsDue={() => setActiveTab("medications-due")}
            onNavigateToCriticalAlerts={() => setActiveTab("critical-alerts")}
            onNavigateToLabs={() => setActiveTab("labs")}
            onNavigateToPharmacy={() => setActiveTab("pharmacy")}
            onNavigateToBilling={() => setActiveTab("billing")}
          />
        )}

        {activeTab === "hospitals" && <HospitalManagement />}

        {activeTab === "users" && <UserManagement />}

        {activeTab === "doctors" && <DoctorManagement />}

        {activeTab === "patients" && <PatientManagement />}

        {activeTab === "appointments" && <Appointments />}

        {activeTab === "billing" && (user?.role === "CASHIER" ? <CashierBilling /> : <Billing />)}

        {activeTab === "admissions" && <Admissions />}

        {activeTab === "labs" && <Labs />}

        {activeTab === "pharmacy" && <Pharmacy />}

        {activeTab === "pending-tasks" && (
          <PendingTasks onBackToDashboard={() => setActiveTab("dashboard")} />
        )}

        {activeTab === "medications-due" && (
          <MedicationsDue onBackToDashboard={() => setActiveTab("dashboard")} />
        )}

        {activeTab === "critical-alerts" && (
          <CriticalAlerts onBackToDashboard={() => setActiveTab("dashboard")} />
        )}

        {activeTab === "audit-logs" && <AuditLogs />}

        {activeTab !== "dashboard" &&
          activeTab !== "hospitals" &&
          activeTab !== "users" &&
          activeTab !== "doctors" &&
          activeTab !== "patients" &&
          activeTab !== "appointments" &&
          activeTab !== "billing" &&
          activeTab !== "admissions" &&
          activeTab !== "labs" &&
          activeTab !== "pharmacy" &&
          activeTab !== "pending-tasks" &&
          activeTab !== "medications-due" &&
          activeTab !== "critical-alerts" &&
          activeTab !== "audit-logs" && (
            <div style={{ padding: "3rem", textAlign: "center" }}>
              <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module
              </h2>
              <p style={{ color: "var(--text-secondary)" }}>
                This module is ready for integration in the next build phase.
              </p>
            </div>
          )}
      </React.Suspense>
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
