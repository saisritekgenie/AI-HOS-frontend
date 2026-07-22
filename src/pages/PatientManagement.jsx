import React, { useState, useEffect } from "react";
import { UserCheck, Search, Plus, Phone, Droplet, ShieldAlert, CheckCircle, AlertCircle } from "lucide-react";
import { fetchUsers, createUser } from "../services/api";

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "PatientPass123!",
    gender: "MALE",
    bloodGroup: "O+",
    emergencyContact: "",
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const res = await fetchUsers({ role: "PATIENT", search, limit: 50 });
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patients", err);
      showToast("error", "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser({ ...formData, role: "PATIENT" });
      showToast("success", "New patient registered successfully with auto UHID");
      setIsModalOpen(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "PatientPass123!",
        gender: "MALE",
        bloodGroup: "O+",
        emergencyContact: "",
      });
      loadPatients();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Patient registration failed");
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
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Hospital Patient Directory & EMR</h1>
          <p>Full patient registration details, UHID identifiers, blood groups, and emergency contacts.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="filters-card">
        <div className="search-box">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by UHID, Name, or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Patient Table */}
      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading patient directory...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <UserCheck size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No patient records found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient UHID</th>
                <th>Patient Name</th>
                <th>Mobile</th>
                <th>Blood Group</th>
                <th>Emergency Contact</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id}>
                  <td>
                    <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7" }}>
                      {p.uhid || `UHID-2026-${p._id.slice(-4)}`}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {p.firstName} {p.lastName}
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{p.email}</div>
                    </div>
                  </td>
                  <td>{p.mobile}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#dc2626", fontWeight: 700 }}>
                      <Droplet size={16} />
                      <span>{p.bloodGroup || "O+"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-secondary)" }}>
                      <Phone size={14} />
                      <span>{p.emergencyContact || p.mobile}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-status-${p.status}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register Patient</h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      className="form-control"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Family contact phone"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Patient & Issue UHID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
