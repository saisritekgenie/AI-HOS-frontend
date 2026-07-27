import React, { useState, useEffect } from "react";
import { 
  fetchAllCriticalAlerts,
  fetchPatientClinicalSummary,
  addPatientVitals,
  addNursingNote,
  administerMedication,
  completeInstruction,
  collectLabSample,
  updatePatientAssignment,
  fetchUsers
} from "../services/api";
import { 
  Activity, 
  CheckCircle, 
  ArrowLeft, 
  MapPin, 
  ShieldAlert, 
  ChevronRight, 
  User, 
  Clock, 
  Save, 
  Plus, 
  CheckCircle as SuccessIcon, 
  Calendar, 
  ClipboardList 
} from "lucide-react";

const CriticalAlerts = ({ onBackToDashboard }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Clinical Charting Drawer State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState("overview");
  const [doctors, setDoctors] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Forms
  const [vitalsForm, setVitalsForm] = useState({
    temperature: "",
    bp: "",
    heartRate: "",
    spo2: "",
    respiratoryRate: "",
    weight: "",
    sugar: "",
  });

  const [assignmentForm, setAssignmentForm] = useState({
    roomNo: "",
    bedNo: "",
    assignedDoctor: "",
  });

  const [noteText, setNoteText] = useState("");

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetchAllCriticalAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error("Failed to load critical alerts", err);
      setError("Failed to load clinical alerts.");
    } finally {
      setLoading(false);
    }
  };

  const loadDoctors = async () => {
    try {
      const res = await fetchUsers({ role: "DOCTOR", limit: 100 });
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to load doctors", err);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadDoctors();
  }, []);

  const handleOpenChart = async (patient) => {
    setSelectedPatient(patient);
    setActiveDrawerTab("vitals"); // Open to vitals by default on critical alerts
    setVitalsForm({
      temperature: "",
      bp: "",
      heartRate: "",
      spo2: "",
      respiratoryRate: "",
      weight: "",
      sugar: "",
    });
    setAssignmentForm({
      roomNo: patient.roomNo || "N/A",
      bedNo: patient.bedNo || "N/A",
      assignedDoctor: patient.assignedDoctor?._id || patient.assignedDoctor || "",
    });
    setNoteText("");
    
    try {
      setChartLoading(true);
      const res = await fetchPatientClinicalSummary(patient._id);
      setClinicalData(res.data);
      if (res.data?.patient) {
        setAssignmentForm({
          roomNo: res.data.patient.roomNo || "N/A",
          bedNo: res.data.patient.bedNo || "N/A",
          assignedDoctor: res.data.patient.assignedDoctor?._id || res.data.patient.assignedDoctor || "",
        });
      }
    } catch (err) {
      console.error("Failed to load clinical summary", err);
      setSelectedPatient(null);
    } finally {
      setChartLoading(false);
    }
  };

  const reloadChartData = async () => {
    if (!selectedPatient) return;
    try {
      const res = await fetchPatientClinicalSummary(selectedPatient._id);
      setClinicalData(res.data);
      if (res.data?.patient) {
        setSelectedPatient(res.data.patient);
      }
      // Reload alerts list in background to reflect resolved states
      const alertsRes = await fetchAllCriticalAlerts();
      setAlerts(alertsRes.data || []);
    } catch (err) {
      console.error("Failed to reload chart", err);
    }
  };

  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await addPatientVitals(selectedPatient._id, vitalsForm);
      setVitalsForm({
        temperature: "",
        bp: "",
        heartRate: "",
        spo2: "",
        respiratoryRate: "",
        weight: "",
        sugar: "",
      });
      reloadChartData();
    } catch (err) {
      console.error("Failed to save vitals", err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveAllocation = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await updatePatientAssignment(selectedPatient._id, assignmentForm);
      reloadChartData();
    } catch (err) {
      console.error("Failed to save assignment", err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setSubmittingAction(true);
      await addNursingNote(selectedPatient._id, { note: noteText });
      setNoteText("");
      reloadChartData();
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAdministerMed = async (medId) => {
    try {
      await administerMedication(medId, "GIVEN");
      reloadChartData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteInstruction = async (instId) => {
    try {
      await completeInstruction(instId);
      reloadChartData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCollectLabSample = async (labId) => {
    try {
      await collectLabSample(labId);
      reloadChartData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <button 
              onClick={onBackToDashboard}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                padding: "0.35rem 0.65rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.85rem",
                color: "#475569"
              }}
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          </div>
          <h1>Critical Patient Alerts</h1>
          <p>Real-time patient monitoring showing warning flags for patients whose logged vitals are out of threshold.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading critical alerts...</p>
        </div>
      ) : error ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
          <p>{error}</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="table-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>Hospital Status Normal</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>There are no patients with critical vital status alerts at the moment.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {alerts.map((alert) => (
            <div 
              key={alert._id} 
              style={{ 
                background: "white", 
                border: "1px solid #fee2e2", 
                borderLeft: "5px solid #ef4444", 
                padding: "1.25rem", 
                borderRadius: "12px", 
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ background: "#fee2e2", padding: "0.75rem", borderRadius: "10px", color: "#ef4444" }}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                    {alert.patient?.firstName} {alert.patient?.lastName}
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.8rem", color: "#64748b", alignItems: "center" }}>
                    <span>UHID: <strong>{alert.patient?.uhid}</strong></span>
                    <span>|</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                      <MapPin size={12} />
                      <strong>{alert.patient?.roomNo && alert.patient?.roomNo !== "N/A" ? `Room ${alert.patient?.roomNo} / Bed ${alert.patient?.bedNo}` : "Unallocated"}</strong>
                    </span>
                  </div>
                  <div style={{ marginTop: "0.6rem", display: "inline-flex", background: "#fef2f2", color: "#b91c1c", fontSize: "0.8rem", fontWeight: 700, padding: "0.25rem 0.5rem", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                    Vitals Trigger: {alert.issues}
                  </div>
                </div>
              </div>
              <div>
                <button
                  onClick={() => handleOpenChart(alert.patient)}
                  className="btn btn-secondary"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    borderColor: "#ef4444",
                    color: "#ef4444",
                    background: "#fdf2f2",
                    fontSize: "0.85rem",
                    padding: "0.45rem 1rem",
                    fontWeight: 600
                  }}
                >
                  <span>Open Clinical Chart</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Embedded Charting Drawer */}
      {selectedPatient && (
        <div 
          className="modal-overlay" 
          style={{ 
            position: "fixed", 
            top: 0, 
            left: 0, 
            width: "100vw", 
            height: "100vh", 
            background: "rgba(15, 23, 42, 0.4)", 
            backdropFilter: "blur(4px)", 
            zIndex: 100, 
            display: "flex", 
            justifyContent: "flex-end", 
            alignItems: "stretch" 
          }}
        >
          <div 
            className="modal-card" 
            style={{ 
              width: "100%", 
              maxWidth: "750px", 
              height: "100vh", 
              maxHeight: "none", 
              borderRadius: "20px 0 0 20px", 
              margin: 0,
              display: "flex",
              flexDirection: "column",
              boxShadow: "-8px 0 24px rgba(0,0,0,0.12)",
              background: "#ffffff",
              overflow: "hidden"
            }}
          >
            <div 
              style={{ 
                borderBottom: "1px solid #e2e8f0", 
                padding: "1.25rem 1.75rem", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}
            >
              <div>
                <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "0.75rem", fontWeight: 700 }}>
                  {selectedPatient.uhid || "PATIENT UHID"}
                </span>
                <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h2>
              </div>
              <button 
                onClick={() => { setSelectedPatient(null); setClinicalData(null); }}
                style={{ 
                  background: "#f1f5f9", 
                  border: "none", 
                  borderRadius: "50%", 
                  width: "36px", 
                  height: "36px", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  cursor: "pointer", 
                  fontSize: "1.2rem", 
                  color: "#64748b",
                  fontWeight: "bold"
                }}
              >
                ×
              </button>
            </div>

            <div 
              style={{ 
                display: "flex", 
                background: "#f8fafc", 
                borderBottom: "1px solid #e2e8f0", 
                padding: "0 1rem", 
                overflowX: "auto" 
              }}
            >
              {[
                { id: "overview", label: "Overview", icon: User },
                { id: "vitals", label: "Vitals", icon: Activity },
                { id: "medications", label: "Medications", icon: Calendar },
                { id: "instructions", label: "Instructions", icon: ClipboardList },
                { id: "notes", label: "Notes", icon: Save },
                { id: "labs", label: "Labs", icon: Activity }
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeDrawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.85rem 1rem",
                      border: "none",
                      background: "none",
                      borderBottom: isActive ? "3px solid #0284c7" : "3px solid transparent",
                      color: isActive ? "#0284c7" : "#64748b",
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      outline: "none"
                    }}
                  >
                    <TabIcon size={16} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem", background: "#f8fafc" }}>
              {chartLoading ? (
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                  <p style={{ color: "#64748b" }}>Loading clinical history...</p>
                </div>
              ) : (
                <>
                  {activeDrawerTab === "overview" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Bed Allocation & Doctor Assignment</h4>
                        <form onSubmit={handleSaveAllocation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                            <div className="form-group">
                              <label>Ward/Room No</label>
                              <input 
                                type="text" 
                                className="form-control"
                                value={assignmentForm.roomNo} 
                                onChange={(e) => setAssignmentForm({ ...assignmentForm, roomNo: e.target.value })}
                                placeholder="E.g. Ward A"
                              />
                            </div>
                            <div className="form-group">
                              <label>Bed Number</label>
                              <input 
                                type="text" 
                                className="form-control"
                                value={assignmentForm.bedNo} 
                                onChange={(e) => setAssignmentForm({ ...assignmentForm, bedNo: e.target.value })}
                                placeholder="E.g. Bed 4"
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Assigned Medical Practitioner (Doctor)</label>
                            <select 
                              className="form-control"
                              value={assignmentForm.assignedDoctor}
                              onChange={(e) => setAssignmentForm({ ...assignmentForm, assignedDoctor: e.target.value })}
                            >
                              <option value="">No Doctor Assigned</option>
                              {doctors.map(doc => (
                                <option key={doc._id} value={doc._id}>Dr. {doc.firstName} {doc.lastName} ({doc.department || "General"})</option>
                              ))}
                            </select>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Save size={16} />
                            <span>Save Allocation & Assignment</span>
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {activeDrawerTab === "vitals" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Record New Patient Vitals</h4>
                        <form onSubmit={handleSaveVitals}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1rem" }}>
                            <div className="form-group">
                              <label>Temp (°F)</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={vitalsForm.temperature}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                                placeholder="E.g. 98.6"
                              />
                            </div>
                            <div className="form-group">
                              <label>BP (mmHg)</label>
                              <input 
                                type="text" 
                                className="form-control" 
                                value={vitalsForm.bp}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, bp: e.target.value })}
                                placeholder="E.g. 120/80"
                              />
                            </div>
                            <div className="form-group">
                              <label>Heart Rate (bpm)</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={vitalsForm.heartRate}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                                placeholder="E.g. 72"
                              />
                            </div>
                            <div className="form-group">
                              <label>SpO2 (%)</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={vitalsForm.spo2}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, spo2: e.target.value })}
                                placeholder="E.g. 98"
                              />
                            </div>
                            <div className="form-group">
                              <label>Respiratory Rate</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={vitalsForm.respiratoryRate}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })}
                                placeholder="E.g. 16"
                              />
                            </div>
                            <div className="form-group">
                              <label>Blood Sugar (mg/dL)</label>
                              <input 
                                type="number" 
                                className="form-control" 
                                value={vitalsForm.sugar}
                                onChange={(e) => setVitalsForm({ ...vitalsForm, sugar: e.target.value })}
                                placeholder="E.g. 110"
                              />
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Plus size={16} />
                            <span>Save Vitals Record</span>
                          </button>
                        </form>
                      </div>

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Vitals History Log</h4>
                        {!clinicalData?.vitals || clinicalData.vitals.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No vitals history logged.</p>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid #e2e8f0", background: "#f8fafc", textAlign: "left" }}>
                                  <th style={{ padding: "0.5rem" }}>Date/Time</th>
                                  <th style={{ padding: "0.5rem" }}>Temp</th>
                                  <th style={{ padding: "0.5rem" }}>BP</th>
                                  <th style={{ padding: "0.5rem" }}>Pulse</th>
                                  <th style={{ padding: "0.5rem" }}>SpO2</th>
                                  <th style={{ padding: "0.5rem" }}>Sugar</th>
                                </tr>
                              </thead>
                              <tbody>
                                {clinicalData.vitals.map((v) => (
                                  <tr key={v._id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.5rem", color: "#64748b" }}>{new Date(v.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: "0.5rem", fontWeight: 600 }}>{v.temperature}°F</td>
                                    <td style={{ padding: "0.5rem" }}>{v.bp}</td>
                                    <td style={{ padding: "0.5rem" }}>{v.heartRate || "N/A"} bpm</td>
                                    <td style={{ padding: "0.5rem", color: v.spo2 && v.spo2 < 95 ? "#dc2626" : "inherit", fontWeight: v.spo2 && v.spo2 < 95 ? 700 : "normal" }}>{v.spo2 || "N/A"}%</td>
                                    <td style={{ padding: "0.5rem" }}>{v.sugar || "N/A"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeDrawerTab === "medications" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Medication Administration Record</h4>
                        {clinicalData?.medications?.map((med) => (
                          <div key={med._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
                            <div>
                              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{med.medicationName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{med.dosage} - {med.frequency}</div>
                            </div>
                            {med.status === "PENDING" ? (
                              <button onClick={() => handleAdministerMed(med._id)} className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#10b981", border: "1px solid #10b981" }}>
                                Mark Given
                              </button>
                            ) : (
                              <span className="badge" style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700 }}>
                                GIVEN
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDrawerTab === "instructions" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {clinicalData?.instructions?.map((inst) => (
                        <div key={inst._id} style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", background: "white" }}>
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{inst.instruction}</p>
                          {inst.status === "PENDING" ? (
                            <button onClick={() => handleCompleteInstruction(inst._id)} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                              Mark Completed
                            </button>
                          ) : (
                            <span className="badge" style={{ background: "#f1f5f9", color: "#64748b" }}>COMPLETED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeDrawerTab === "notes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Add Observation Note</h4>
                        <form onSubmit={handleSaveNote}>
                          <textarea 
                            className="form-control" 
                            rows="3" 
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Write care details..."
                            required
                            style={{ marginBottom: "1rem" }}
                          />
                          <button type="submit" className="btn btn-primary" disabled={submittingAction}>
                            Save Note
                          </button>
                        </form>
                      </div>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        {clinicalData?.notes?.map((n) => (
                          <div key={n._id} style={{ borderLeft: "3px solid #0284c7", paddingLeft: "0.75rem", marginBottom: "1rem" }}>
                            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem" }}>{n.note}</p>
                            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Logged on {new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeDrawerTab === "labs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {clinicalData?.labs?.map((lab) => (
                        <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", background: "white" }}>
                          <div>
                            <strong style={{ fontSize: "0.95rem" }}>{lab.testName}</strong>
                          </div>
                          {lab.status === "PENDING" ? (
                            <button onClick={() => handleCollectLabSample(lab._id)} className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#0284c7" }}>
                              Collect Sample
                            </button>
                          ) : (
                            <span className="badge" style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700 }}>
                              SAMPLE COLLECTED
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalAlerts;
