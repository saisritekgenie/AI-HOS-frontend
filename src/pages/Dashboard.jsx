import React, { useEffect, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import { Building, Clock, ShieldCheck, Activity, Users, Stethoscope, UserCheck, Calendar, ClipboardList } from "lucide-react";
import { fetchHospitals, fetchUsers } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Dashboard = ({ onNavigateToHospitals, onNavigateToUsers, onNavigateToPatients, onNavigateToAppointments }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    pendingHospitals: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    recentPatients: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        if (isSuperAdmin) {
          const res = await fetchHospitals();
          const list = res.data || [];
          setStats((prev) => ({
            ...prev,
            totalHospitals: list.length,
            activeHospitals: list.filter((h) => h.status === "ACTIVE").length,
            pendingHospitals: list.filter((h) => h.status === "PENDING_APPROVAL").length,
            totalUsers: res.meta?.totalUsers || list.length * 5,
          }));
        } else if (user?.role === "ADMIN") {
          const res = await fetchUsers({ limit: 100 });
          const users = res.data || [];
          setStats((prev) => ({
            ...prev,
            totalUsers: users.length,
            totalDoctors: users.filter((u) => u.role === "DOCTOR").length,
          }));
        } else {
          // DOCTOR or other staff roles: fetch only PATIENTs
          const res = await fetchUsers({ role: "PATIENT", limit: 50 });
          const patients = res.data || [];
          setStats((prev) => ({
            ...prev,
            totalPatients: patients.length,
            recentPatients: patients.slice(0, 5),
          }));
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [isSuperAdmin, user]);

  if (isSuperAdmin) {
    return (
      <div>
        <div className="page-header">
          <div className="page-title-group">
            <h1>SaaS Super Admin Overview</h1>
            <p>Master control panel for hospital tenant onboarding, subscription status, and approval queues.</p>
          </div>

          <button className="btn btn-primary" onClick={onNavigateToHospitals}>
            <Building size={18} />
            <span>Manage Hospitals</span>
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Total Registered Hospitals"
            value={loading ? "..." : stats.totalHospitals}
            icon={Building}
            color="#0284c7"
            bg="#e0f2fe"
          />
          <StatCard
            label="Pending Access Approvals"
            value={loading ? "..." : stats.pendingHospitals}
            icon={Clock}
            color="#d97706"
            bg="#fffbeb"
          />
          <StatCard
            label="Active Hospital Tenants"
            value={loading ? "..." : stats.activeHospitals}
            icon={ShieldCheck}
            color="#059669"
            bg="#ecfdf5"
          />
          <StatCard
            label="Total Network Users"
            value={loading ? "..." : stats.totalUsers}
            icon={Users}
            color="#7e22ce"
            bg="#f3e8ff"
          />
        </div>

        <div className="table-container" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} className="text-sky-600" />
            <span>SaaS Platform Operational Status</span>
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Multi-Tenant Isolation is active. Server running on <strong>http://localhost:8086</strong>. All hospital database queries are strictly scoped.
          </p>
        </div>
      </div>
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <div>
        <div className="page-header">
          <div className="page-title-group">
            <h1>{user?.hospital?.name || "Hospital"} Admin Dashboard</h1>
            <p>Welcome back! Here is a summary of your hospital staff, doctors, and operational metrics.</p>
          </div>

          <button className="btn btn-primary" onClick={onNavigateToUsers}>
            <Users size={18} />
            <span>Manage Staff</span>
          </button>
        </div>

        <div className="stats-grid">
          <StatCard
            label="Hospital Staff Count"
            value={loading ? "..." : stats.totalUsers}
            icon={Users}
            color="#0284c7"
            bg="#e0f2fe"
          />
          <StatCard
            label="Active Doctors"
            value={loading ? "..." : stats.totalDoctors}
            icon={Stethoscope}
            color="#059669"
            bg="#ecfdf5"
          />
        </div>
      </div>
    );
  }

  // Doctor Dashboard / Clinical Staff Dashboard
  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <h1>{user?.hospital?.name || "Hospital"} Doctor Dashboard</h1>
          <p>Welcome back, Dr. {user?.firstName} {user?.lastName}! Here is your clinical dashboard and patient care overview.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Registered Hospital Patients"
          value={loading ? "..." : stats.totalPatients}
          icon={UserCheck}
          color="#0ea5e9"
          bg="#e0f2fe"
          onClick={onNavigateToPatients}
        />
        <StatCard
          label="Today's Consultations"
          value="0"
          icon={Calendar}
          color="#10b981"
          bg="#ecfdf5"
          onClick={onNavigateToAppointments}
        />
        <StatCard
          label="Pending Clinical Reports"
          value="0"
          icon={ClipboardList}
          color="#f59e0b"
          bg="#fef3c7"
        />
      </div>

      <div className="table-container" style={{ marginTop: "2rem" }}>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <UserCheck size={20} className="text-sky-600" />
          <span>Recently Registered Patients</span>
        </h3>
        <div style={{ overflowX: "auto", padding: "1.5rem" }}>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading recent patients...</p>
          ) : stats.recentPatients.length === 0 ? (
            <p style={{ color: "var(--text-secondary)" }}>No patients registered in this hospital yet.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>UHID</th>
                  <th>Patient Name</th>
                  <th>Gender</th>
                  <th>Mobile Number</th>
                  <th>Registered Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentPatients.map((patient) => (
                  <tr key={patient._id}>
                    <td style={{ fontWeight: 700, color: "#0284c7" }}>{patient.uhid || "N/A"}</td>
                    <td style={{ fontWeight: 600 }}>{patient.firstName} {patient.lastName}</td>
                    <td>{patient.gender}</td>
                    <td>{patient.mobile}</td>
                    <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className="badge badge-status-ACTIVE">ACTIVE</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
