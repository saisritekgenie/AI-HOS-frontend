import React, { useState, useEffect } from "react";
import { fetchAdmissions, createAdmission, dischargePatient, fetchUsers } from "../services/api";
import { Plus, Search, CheckCircle, AlertCircle, Building, LogOut, Calendar } from "lucide-react";

const Admissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    department: "General Medicine",
    wardNo: "",
    bedNo: "",
  });

  const filteredAdmissions = admissions.filter(adm => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const patientName = `${adm.patient?.firstName || ''} ${adm.patient?.lastName || ''}`.toLowerCase();
    return (
      patientName.includes(term) ||
      (adm.patient?.uhid || '').toLowerCase().includes(term) ||
      (adm.wardNo || '').toLowerCase().includes(term) ||
      (adm.bedNo || '').toLowerCase().includes(term) ||
      (adm.department || '').toLowerCase().includes(term)
    );
  });

  const handleExportCSV = () => {
    if (filteredAdmissions.length === 0) return;
    const headers = ["UHID", "Patient Name", "Department", "Room/Ward", "Bed No", "Admission Date (In)", "Discharge Date (Out)", "Status"];
    const rows = filteredAdmissions.map(adm => [
      adm.patient?.uhid || "N/A",
      `"${adm.patient?.firstName || ''} ${adm.patient?.lastName || ''}"`,
      adm.department,
      adm.wardNo,
      adm.bedNo,
      new Date(adm.admissionDate).toLocaleString(),
      adm.dischargeDate ? new Date(adm.dischargeDate).toLocaleString() : "N/A",
      adm.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inpatient_admissions_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [admRes, patientRes] = await Promise.all([
        fetchAdmissions(),
        fetchUsers({ role: "PATIENT", limit: 100 })
      ]);
      setAdmissions(admRes.data || []);
      setPatients(patientRes.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load admission records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createAdmission(formData);
      showToast("success", "Patient admitted and ward/bed assigned");
      setIsModalOpen(false);
      setFormData({
        patientId: "",
        department: "General Medicine",
        wardNo: "",
        bedNo: "",
      });
      loadData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to admit patient");
    }
  };

  const handleDischarge = async (id) => {
    try {
      await dischargePatient(id);
      showToast("success", "Patient discharged and bed released successfully");
      loadData();
    } catch (err) {
      showToast("error", "Failed to process patient discharge");
    }
  };

  return (
    <div>
      {toast && (
        <div style={{ position: "fixed", top: "20px", right: "20px", zIndex: 999, display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.25rem", borderRadius: "12px", background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)", color: "white", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-title-group">
          <h1>Inpatient Admissions Registry</h1>
          <p>Assign inpatient wards and bed numbers, manage medical departments, and handle discharges.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Admission</span>
        </button>
      </div>

      {/* Search Bar & Export Tools */}
      <div className="filters-card" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "1rem", marginBottom: "1.5rem" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "250px" }}>
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search admissions by UHID, Patient, Room, or Dept..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading admission list...</p>
        </div>
      ) : filteredAdmissions.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <Building size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No admitted patients matching criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>UHID</th>
                <th>Patient Name</th>
                <th>Department</th>
                <th>Room / Ward</th>
                <th>Bed No</th>
                <th>Admission Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAdmissions.map((adm) => (
                <tr key={adm._id}>
                  <td>
                    <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7", fontWeight: 700 }}>
                      {adm.patient?.uhid || "N/A"}
                    </span>
                  </td>
                  <td>
                    <strong>{adm.patient?.firstName} {adm.patient?.lastName}</strong>
                  </td>
                  <td>{adm.department}</td>
                  <td>
                    <strong>{adm.wardNo}</strong>
                  </td>
                  <td>
                    <strong>{adm.bedNo}</strong>
                  </td>
                  <td>{new Date(adm.admissionDate).toLocaleDateString()}</td>
                  <td>
                    <span className="badge" style={{
                      background: adm.status === "ADMITTED" ? "#fee2e2" : "#f1f5f9",
                      color: adm.status === "ADMITTED" ? "#ef4444" : "#64748b",
                      fontWeight: 700
                    }}>
                      {adm.status}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {adm.status === "ADMITTED" ? (
                      <button 
                        onClick={() => handleDischarge(adm._id)} 
                        className="btn btn-secondary" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem", borderColor: "#ef4444", color: "#ef4444", background: "#fdf2f2" }}
                      >
                        <LogOut size={12} />
                        <span>Discharge</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        Released {new Date(adm.dischargeDate).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Admission Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Admit Patient</h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Select Admitted Patient *</label>
                    <select 
                      className="form-control"
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p._id} value={p._id}>{p.firstName} {p.lastName} (UHID: {p.uhid})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Medical Department *</label>
                    <select 
                      className="form-control"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      required
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="ICU & Nursing">ICU & Emergency Nursing</option>
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Ward / Room No *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.wardNo}
                        onChange={(e) => setFormData({ ...formData, wardNo: e.target.value })}
                        placeholder="E.g. Room 302"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Bed Number *</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={formData.bedNo}
                        onChange={(e) => setFormData({ ...formData, bedNo: e.target.value })}
                        placeholder="E.g. Bed B"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Allocate Bed & Admit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;
