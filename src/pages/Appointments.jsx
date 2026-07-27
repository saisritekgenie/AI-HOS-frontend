import React, { useState, useEffect } from "react";
import { fetchAppointments, bookAppointment, updateAppointmentStatus, fetchUsers } from "../services/api";
import { Plus, Search, Calendar, Clock, User, CheckCircle, AlertCircle, RefreshCw, XCircle } from "lucide-react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM",
    notes: "",
  });

  // Rescheduling states
  const [rescheduleAppointment, setRescheduleAppointment] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("10:00 AM");

  const handleOpenReschedule = (appt) => {
    setRescheduleAppointment(appt);
    setRescheduleDate(new Date(appt.appointmentDate).toISOString().split("T")[0]);
    setRescheduleTimeSlot(appt.timeSlot || "10:00 AM");
  };

  const handleReschedule = async (e) => {
    e.preventDefault();
    try {
      await updateAppointmentStatus(rescheduleAppointment._id, {
        appointmentDate: rescheduleDate,
        timeSlot: rescheduleTimeSlot
      });
      showToast("success", "Appointment rescheduled successfully");
      setRescheduleAppointment(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to reschedule appointment");
    }
  };

  const getWaitingTime = (appt) => {
    if (appt.status !== "CHECKED_IN") return null;

    // Find all CHECKED_IN appointments for the same doctor on the same day
    const activeQueue = appointments.filter(a => 
      a.doctor?._id === appt.doctor?._id && 
      a.status === "CHECKED_IN" &&
      new Date(a.appointmentDate).toDateString() === new Date(appt.appointmentDate).toDateString()
    );

    // Sort them by check-in time
    const sortedQueue = [...activeQueue].sort((a, b) => {
      const timeA = a.checkInTime ? new Date(a.checkInTime).getTime() : 0;
      const timeB = b.checkInTime ? new Date(b.checkInTime).getTime() : 0;
      return timeA - timeB;
    });

    // Find position of the current appointment in the queue
    const index = sortedQueue.findIndex(a => a._id === appt._id);
    if (index === -1) return "15 mins wait";

    const minutes = index * 15;
    if (minutes === 0) return "Next in line";
    return `${minutes} mins wait`;
  };

  const filteredAppointments = appointments.filter(appt => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const patientName = `${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}`.toLowerCase();
    const doctorName = `${appt.doctor?.firstName || ''} ${appt.doctor?.lastName || ''}`.toLowerCase();
    return (
      patientName.includes(term) ||
      doctorName.includes(term) ||
      (appt.patient?.uhid || '').toLowerCase().includes(term) ||
      (appt.tokenNumber || '').toLowerCase().includes(term) ||
      (appt.status || '').toLowerCase().includes(term)
    );
  });

  const handleExportCSV = () => {
    if (filteredAppointments.length === 0) return;
    const headers = [
      "Queue Token",
      "Patient UHID",
      "Patient Name",
      "Assigned Doctor",
      "Appointment Date",
      "Preferred Time Slot",
      "Check-in Time (In)",
      "Completion Time (Out)",
      "Status",
      "Notes"
    ];
    const rows = filteredAppointments.map(appt => [
      appt.tokenNumber || "N/A",
      appt.patient?.uhid || "N/A",
      `"${appt.patient?.firstName || ''} ${appt.patient?.lastName || ''}"`,
      `"Dr. ${appt.doctor?.firstName || ''} ${appt.doctor?.lastName || ''}"`,
      new Date(appt.appointmentDate).toLocaleDateString(),
      appt.timeSlot || "N/A",
      appt.checkInTime ? new Date(appt.checkInTime).toLocaleString() : "N/A",
      appt.completionTime ? new Date(appt.completionTime).toLocaleString() : "N/A",
      appt.status,
      `"${appt.notes || ''}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `outpatient_appointments_report.csv`);
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
      const [apptRes, patientRes, docRes] = await Promise.all([
        fetchAppointments(),
        fetchUsers({ role: "PATIENT", limit: 100 }),
        fetchUsers({ role: "DOCTOR", limit: 100 })
      ]);
      setAppointments(apptRes.data || []);
      setPatients(patientRes.data || []);
      setDoctors(docRes.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load appointment records");
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
      await bookAppointment(formData);
      showToast("success", "Appointment booked successfully");
      setIsModalOpen(false);
      setFormData({
        patientId: "",
        doctorId: "",
        appointmentDate: new Date().toISOString().split("T")[0],
        timeSlot: "10:00 AM",
        notes: "",
      });
      loadData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to schedule appointment");
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateAppointmentStatus(id, { status });
      showToast("success", `Appointment status updated to ${status}`);
      loadData();
    } catch (err) {
      showToast("error", "Failed to update appointment status");
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
          <h1>Appointment Scheduling & Queue</h1>
          <p>Book new consultations, manage check-in arrival times, issue tokens, and handle queue statuses.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Search Bar & Export Tools */}
      <div className="filters-card" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "1rem", marginBottom: "1.5rem" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "250px" }}>
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search appointments by UHID, Patient, Doctor, or Token..."
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
          <p style={{ color: "var(--text-secondary)" }}>Loading appointment book...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <Calendar size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No appointments scheduled matching criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Queue Token</th>
                <th>Patient Details</th>
                <th>Assigned Doctor</th>
                <th>Appointment Date</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map((appt) => (
                <tr key={appt._id}>
                  <td>
                    <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700 }}>
                      {appt.tokenNumber || "N/A"}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{appt.patient?.firstName} {appt.patient?.lastName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {appt.patient?.uhid || "N/A"}</div>
                    </div>
                  </td>
                  <td>
                    <strong>Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</strong>
                  </td>
                  <td>{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                  <td>{appt.timeSlot}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                      <span className="badge" style={{
                        background: appt.status === "CHECKED_IN" ? "#e0f2fe" : appt.status === "CANCELLED" ? "#fee2e2" : appt.status === "COMPLETED" ? "#dcfce7" : "#fef3c7",
                        color: appt.status === "CHECKED_IN" ? "#0284c7" : appt.status === "CANCELLED" ? "#ef4444" : appt.status === "COMPLETED" ? "#15803d" : "#d97706",
                        fontWeight: 700,
                        alignSelf: "flex-start"
                      }}>
                        {appt.status}
                      </span>
                      {appt.status === "CHECKED_IN" && (
                        <span className="badge" style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.65rem", fontWeight: 700, alignSelf: "flex-start", marginTop: "0.1rem" }}>
                          Est. Wait: {getWaitingTime(appt)}
                        </span>
                      )}
                      {appt.checkInTime && (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          In: {new Date(appt.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {appt.completionTime && (
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                          Out: {new Date(appt.completionTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {appt.status === "BOOKED" && (
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button 
                          onClick={() => handleUpdateStatus(appt._id, "CHECKED_IN")} 
                          className="btn btn-primary" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                        >
                          Check In
                        </button>
                        <button 
                          onClick={() => handleOpenReschedule(appt)} 
                          className="btn btn-secondary" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderColor: "var(--primary-color)", color: "var(--primary-color)" }}
                        >
                          Reschedule
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(appt._id, "CANCELLED")} 
                          className="btn btn-secondary" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444" }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {appt.status === "CHECKED_IN" && (
                      <button 
                        onClick={() => handleUpdateStatus(appt._id, "COMPLETED")} 
                        className="btn btn-secondary" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                      >
                        Complete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Schedule Patient Consultation</h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Select Patient *</label>
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
                    <label>Select Doctor *</label>
                    <select 
                      className="form-control"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Doctor --</option>
                      {doctors.map(d => (
                        <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} ({d.department || "General"})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Date *</label>
                      <input 
                        type="date"
                        className="form-control"
                        value={formData.appointmentDate}
                        onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Preferred Slot *</label>
                      <select 
                        className="form-control"
                        value={formData.timeSlot}
                        onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                        required
                      >
                        <option value="09:00 AM">09:00 AM</option>
                        <option value="09:30 AM">09:30 AM</option>
                        <option value="10:00 AM">10:00 AM</option>
                        <option value="10:30 AM">10:30 AM</option>
                        <option value="11:00 AM">11:00 AM</option>
                        <option value="11:30 AM">11:30 AM</option>
                        <option value="12:00 PM">12:00 PM</option>
                        <option value="02:00 PM">02:00 PM</option>
                        <option value="02:30 PM">02:30 PM</option>
                        <option value="03:00 PM">03:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Symptoms / Consultation Notes</label>
                    <textarea 
                      className="form-control"
                      rows="3"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Enter symptoms or reasons for visit..."
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Book & Assign Token</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {rescheduleAppointment && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Reschedule Appointment</h3>
              <button className="action-btn" onClick={() => setRescheduleAppointment(null)}>×</button>
            </div>

            <form onSubmit={handleReschedule}>
              <div className="modal-body">
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <div style={{ background: "#e0f2fe", color: "#0284c7", padding: "0.5rem", borderRadius: "50%", display: "flex" }}>
                      <Calendar size={24} />
                    </div>
                    <div>
                      <strong style={{ display: "block" }}>
                        {rescheduleAppointment.patient?.firstName} {rescheduleAppointment.patient?.lastName}
                      </strong>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        UHID: {rescheduleAppointment.patient?.uhid} | Current Token: {rescheduleAppointment.tokenNumber}
                      </span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Select New Date *</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Select New Time Slot *</label>
                    <select 
                      className="form-control"
                      value={rescheduleTimeSlot}
                      onChange={(e) => setRescheduleTimeSlot(e.target.value)}
                      required
                    >
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="09:30 AM">09:30 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="10:30 AM">10:30 AM</option>
                      <option value="11:00 AM">11:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="12:00 PM">12:00 PM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="02:30 PM">02:30 PM</option>
                      <option value="03:00 PM">03:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setRescheduleAppointment(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
