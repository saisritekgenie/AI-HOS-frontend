import React, { useState, useEffect } from "react";
import { Hospital as HospitalIcon, Plus, CheckCircle, XCircle, Bell, Search, MapPin, Building, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { fetchHospitals, registerHospital, approveHospital, rejectHospital } from "../services/api";

const HospitalManagement = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (!isModalOpen) {
      setShowPassword(false);
    }
  }, [isModalOpen]);

  const [formData, setFormData] = useState({
    hospitalName: "",
    hospitalCode: "",
    hospitalLocation: "",
    adminFirstName: "",
    adminLastName: "",
    adminEmail: "",
    adminMobile: "",
    adminPassword: "",
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const res = await fetchHospitals({ status: filterStatus });
      setHospitals(res.data || []);
      setPendingCount(res.meta?.pendingCount || 0);
    } catch (err) {
      console.error("Failed to fetch hospitals", err);
      showToast("error", "Failed to fetch hospitals list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, [filterStatus]);

  const handleApprove = async (id, name) => {
    try {
      await approveHospital(id);
      showToast("success", `Access granted! ${name} is now ACTIVE.`);
      loadHospitals();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to approve hospital");
    }
  };

  const handleReject = async (id, name) => {
    try {
      await rejectHospital(id);
      showToast("success", `Hospital ${name} status set to INACTIVE.`);
      loadHospitals();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to reject hospital");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await registerHospital(formData);
      showToast("success", "Hospital registered! Access is pending approval.");
      setIsModalOpen(false);
      setFormData({
        hospitalName: "",
        hospitalCode: "",
        hospitalLocation: "",
        adminFirstName: "",
        adminLastName: "",
        adminEmail: "",
        adminMobile: "",
        adminPassword: "",
      });
      loadHospitals();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div>
      {/* Toast Alert */}
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
            background: toast.type === "success" ? "#059669" : "#dc2626",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      {/* Super Admin Notification Banner for Pending Approvals */}
      {pendingCount > 0 && (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "16px",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706",
              }}
            >
              <Bell size={20} />
            </div>
            <div>
              <h4 style={{ fontSize: "1rem", fontWeight: 700, color: "#92400e" }}>
                {pendingCount} Pending Hospital Registration Request{pendingCount > 1 ? "s" : ""}
              </h4>
              <p style={{ fontSize: "0.85rem", color: "#b45309" }}>
                Review and approve hospital accounts below to grant them login access.
              </p>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => setFilterStatus("PENDING_APPROVAL")}
            style={{ background: "var(--bg-secondary)", borderColor: "#fde68a", color: "#b45309" }}
          >
            Filter Pending Requests
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>SaaS Hospital Tenants & Onboarding</h1>
          <p>Register new hospitals, grant login access, and manage hospital branches.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Register New Hospital</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filters-card">
        <div className="filter-selects">
          <select
            className="select-control"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Hospital Statuses</option>
            <option value="PENDING_APPROVAL">PENDING_APPROVAL</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {/* Hospital Table */}
      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading hospitals list...</p>
        </div>
      ) : hospitals.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <HospitalIcon size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No hospitals registered matching query.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Hospital Name</th>
                <th>Code</th>
                <th>Location</th>
                <th>Hospital Admin</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Access Control</th>
              </tr>
            </thead>
            <tbody>
              {hospitals.map((h) => (
                <tr key={h._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <Building size={20} className="text-sky-600" />
                      <strong style={{ color: "var(--text-primary)" }}>{h.name}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                      {h.code}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)" }}>
                      <MapPin size={16} />
                      <span>{h.location}</span>
                    </div>
                  </td>
                  <td>
                    {h.adminUser ? (
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {h.adminUser.firstName} {h.adminUser.lastName}
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{h.adminUser.email}</div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-status-${h.status}`}>{h.status}</span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {h.status === "PENDING_APPROVAL" ? (
                      <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleApprove(h._id, h.name)}
                          style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#059669" }}
                        >
                          <ShieldCheck size={16} />
                          <span>Approve & Grant Access</span>
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => handleReject(h._id, h.name)}
                          style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : h.status === "ACTIVE" ? (
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleReject(h._id, h.name)}
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}
                      >
                        Suspend Access
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleApprove(h._id, h.name)}
                        style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#059669" }}
                      >
                        Grant Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register New Hospital & Admin</h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Hospital Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hospitalName}
                      onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                      placeholder="e.g. Apollo Health City"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Hospital Code *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hospitalCode}
                      onChange={(e) => setFormData({ ...formData, hospitalCode: e.target.value })}
                      placeholder="APOLLO-01"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Location / Campus *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.hospitalLocation}
                      onChange={(e) => setFormData({ ...formData, hospitalLocation: e.target.value })}
                      placeholder="Hyderabad Campus"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Admin Mobile (10 digits) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.adminMobile}
                      onChange={(e) => setFormData({ ...formData, adminMobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Initial Admin Password *</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        className="form-control"
                        value={formData.adminPassword}
                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                        style={{ width: "100%", paddingRight: "2.5rem" }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: "absolute",
                          right: "0.75rem",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0
                        }}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Hospital Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalManagement;
