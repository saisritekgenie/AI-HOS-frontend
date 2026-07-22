import React, { useState, useEffect } from "react";
import { Stethoscope, Search, Mail, Phone, MapPin, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { fetchUsers, createUser } from "../services/api";
import UserModal from "../components/users/UserModal";

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers({ role: "DOCTOR", search, limit: 50 });
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to load doctors list", err);
      showToast("error", "Failed to fetch doctors list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, [search]);

  const handleAddDoctor = async (formData) => {
    await createUser({ ...formData, role: "DOCTOR" });
    showToast("success", "New doctor profile created successfully");
    loadDoctors();
  };

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Doctor Directory & Management</h1>
          <p>View and manage all registered medical practitioners and department specialists.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Add New Doctor</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="filters-card" style={{ marginBottom: "1.5rem" }}>
        <div className="search-box">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search doctor by name or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Doctors Grid */}
      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading doctors directory...</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <Stethoscope size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No doctors registered yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.25rem" }}>
          {doctors.map((doc) => (
            <div
              key={doc._id}
              className="stat-card"
              style={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "1rem",
                padding: "1.5rem",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", width: "100%" }}>
                <div
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "50%",
                    background: "rgba(52, 211, 153, 0.15)",
                    border: "2px solid #34d399",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#34d399",
                  }}
                >
                  <Stethoscope size={24} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {doc.firstName} {doc.lastName}
                  </h3>
                  <span className="badge badge-role-DOCTOR" style={{ marginTop: "0.2rem" }}>
                    {doc.department || "General Practitioner"}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Mail size={16} className="text-slate-400" />
                  <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{doc.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Phone size={16} className="text-slate-400" />
                  <span>{doc.mobile}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <MapPin size={16} className="text-slate-400" />
                  <span>{doc.branch || "Main Branch"}</span>
                </div>
              </div>

              <div style={{ width: "100%", paddingTop: "0.75rem", borderTop: "1px solid var(--card-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Status</span>
                <span className={`badge badge-status-${doc.status}`}>{doc.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal to add doctor */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddDoctor}
        editingUser={null}
      />
    </div>
  );
};

export default DoctorManagement;
