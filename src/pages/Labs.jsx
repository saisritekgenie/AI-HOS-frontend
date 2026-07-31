import React, { useState, useEffect } from "react";
import { fetchLabRequests, updateLabStatus, completeLabTest, fetchAILabAnalysis, parseLabReportOCR } from "../services/api";
import { CheckCircle, AlertCircle, Activity, ShieldAlert, Check, X, FileText, Download } from "lucide-react";

const Labs = () => {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Results modal
  const [resultsModalOpen, setResultsModalOpen] = useState(false);
  const [resultsInput, setResultsInput] = useState("");
  const [reportFileInput, setReportFileInput] = useState("");
  const [ocrReportText, setOcrReportText] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);

  // AI Diagnostic screening
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadLabsData = async () => {
    try {
      setLoading(true);
      const res = await fetchLabRequests();
      setLabs(res.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch lab worklist requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabsData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateLabStatus(id, { status });
      showToast("success", `Lab order marked as ${status.replace("_", " ")}`);
      loadLabsData();
    } catch (err) {
      showToast("error", "Failed to update lab request status");
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectionReason.trim()) return;
    try {
      await updateLabStatus(selectedLab._id, { status: "REJECTED", rejectionReason });
      showToast("success", "Lab request order rejected");
      setRejectModalOpen(false);
      setSelectedLab(null);
      setRejectionReason("");
      loadLabsData();
    } catch (err) {
      showToast("error", "Failed to reject lab order");
    }
  };

  const handleCompleteTest = async () => {
    if (!resultsInput.trim()) return;
    try {
      const fileName = reportFileInput.trim() || `lab_report_${selectedLab.testName.replace(/\s+/g, "_").toLowerCase()}_${Date.now().toString().slice(-4)}.pdf`;
      await completeLabTest(selectedLab._id, { results: resultsInput, reportFile: fileName });
      showToast("success", "Test results logged and reported successfully!");
      
      // Simulate socket alert notification to Doctor
      showToast("success", `ALERT: Doctor Dr. ${selectedLab.prescribedBy?.lastName || "Staff"} has been notified of ready reports!`);
      
      setResultsModalOpen(false);
      setSelectedLab(null);
      setResultsInput("");
      setReportFileInput("");
      setAiAnalysis(null);
      loadLabsData();
    } catch (err) {
      showToast("error", "Failed to finalize diagnostic report");
    }
  };

  const handleRunAIAnalysis = async () => {
    if (!resultsInput.trim()) {
      showToast("error", "Please write the findings first before analyzing.");
      return;
    }
    try {
      setAiLoading(true);
      const res = await fetchAILabAnalysis(selectedLab.testName, resultsInput);
      setAiAnalysis(res.data);
      showToast("success", "AI analysis complete!");
    } catch (err) {
      showToast("error", "AI report analysis failed.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleRunOCR = async () => {
    if (!ocrReportText.trim()) {
      showToast("error", "Please write or paste the lab report sheet text first.");
      return;
    }
    try {
      setOcrLoading(true);
      const res = await parseLabReportOCR(selectedLab._id, ocrReportText);
      if (res.data) {
        setResultsInput(res.data.results || "");
        showToast("success", "AI OCR parsed raw document contents successfully!");
      }
    } catch (err) {
      showToast("error", "AI OCR parsing failed");
    } finally {
      setOcrLoading(false);
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
          <h1>Lab Diagnostic Worklist Queue</h1>
          <p>Process laboratory test orders, log specimen samples, register diagnostic values, and dispatch reports.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading diagnostic orders...</p>
        </div>
      ) : labs.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <Activity size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No diagnostic requests in worklist queue.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Patient Name</th>
                <th>Test Parameter</th>
                <th>Prescribed By</th>
                <th>Status</th>
                <th>Collected Sample Info</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr key={lab._id}>
                  <td>
                    {lab.isEmergency ? (
                      <span className="badge" style={{ background: "#fee2e2", color: "#ef4444", fontWeight: 800, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                        <ShieldAlert size={12} />
                        <span>STAT EMERGENCY</span>
                      </span>
                    ) : (
                      <span className="badge" style={{ background: "#f1f5f9", color: "#64748b" }}>ROUTINE</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{lab.patient?.firstName} {lab.patient?.lastName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {lab.patient?.uhid} (Room {lab.patient?.roomNo || "N/A"})</div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: "#0f172a" }}>{lab.testName}</strong>
                  </td>
                  <td>
                    <span>Dr. {lab.prescribedBy?.firstName} {lab.prescribedBy?.lastName}</span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: lab.status === "COMPLETED" ? "#dcfce7" : lab.status === "REJECTED" ? "#fee2e2" : lab.status === "SAMPLE_COLLECTED" ? "#e0f2fe" : "#fef3c7",
                      color: lab.status === "COMPLETED" ? "#15803d" : lab.status === "REJECTED" ? "#ef4444" : lab.status === "SAMPLE_COLLECTED" ? "#0284c7" : "#d97706",
                      fontWeight: 700
                    }}>
                      {lab.status.replace("_", " ")}
                    </span>
                  </td>
                  <td>
                    {lab.status === "COMPLETED" || lab.status === "SAMPLE_COLLECTED" ? (
                      <div style={{ fontSize: "0.8rem" }}>
                        <div>Logged by {lab.sampleCollectedBy?.firstName || "Technician"}</div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b" }}>{new Date(lab.sampleCollectedAt).toLocaleString()}</span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.8rem" }}>Awaiting collection</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                      {lab.status === "PENDING" && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(lab._id, "ACCEPTED")} 
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", background: "#0ea5e9", border: "1px solid #0ea5e9" }}
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => { setSelectedLab(lab); setRejectModalOpen(true); }} 
                            className="btn btn-secondary" 
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444" }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {lab.status === "ACCEPTED" && (
                        <button 
                          onClick={() => handleUpdateStatus(lab._id, "SAMPLE_COLLECTED")} 
                          className="btn btn-primary" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                        >
                          Collect Specimen
                        </button>
                      )}
                      {lab.status === "SAMPLE_COLLECTED" && (
                        <button 
                          onClick={() => { setSelectedLab(lab); setResultsModalOpen(true); setOcrReportText(""); }} 
                          className="btn btn-primary" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                        >
                          Enter Results
                        </button>
                      )}
                      {lab.status === "COMPLETED" && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                          <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 700 }}>{lab.results}</span>
                          <span style={{ fontSize: "0.7rem", color: "#0ea5e9", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.15rem" }}>
                            <Download size={10} />
                            <span>{lab.reportFile}</span>
                          </span>
                        </div>
                      )}
                      {lab.status === "REJECTED" && (
                        <span style={{ color: "#ef4444", fontSize: "0.75rem" }}>
                          Reason: {lab.rejectionReason}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h3>Reject Lab Request</h3>
              <button className="action-btn" onClick={() => setRejectModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Specify Rejection Reason *</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g. Inadequate specimen volume, incorrect patient labeling..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRejectModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRejectRequest} style={{ background: "#ef4444", border: "1px solid #ef4444" }}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Results Modal */}
      {resultsModalOpen && selectedLab && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2rem", borderRadius: "16px" }}>
            <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800 }}>Enter Lab Diagnostic Report</h3>
              <button className="action-btn" onClick={() => { setResultsModalOpen(false); setAiAnalysis(null); }} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
            </div>
            <div className="modal-body" style={{ marginTop: "1rem" }}>
              <p style={{ margin: "0 0 1rem 0" }}>Entering values for <strong>{selectedLab.testName}</strong> ordered for patient <strong>{selectedLab.patient?.firstName} {selectedLab.patient?.lastName}</strong></p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ border: "1px dashed #0284c7", padding: "1rem", borderRadius: "8px", background: "#f0f9ff" }}>
                  <strong style={{ fontSize: "0.8rem", color: "#0284c7", display: "block", marginBottom: "0.4rem" }}>📄 Simulated OCR Document Parser</strong>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.5rem" }}>Paste raw scanned report text below. The AI will extract clinical results.</span>
                  
                  <textarea 
                    className="form-control"
                    rows="2"
                    value={ocrReportText}
                    onChange={(e) => setOcrReportText(e.target.value)}
                    placeholder="E.g. CBC Panel: Hemoglobin value is low at 9.2 g/dL, WBC: 6,800..."
                    style={{ fontSize: "0.75rem", marginBottom: "0.5rem", width: "100%", padding: "0.35rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                  <button 
                    type="button" 
                    onClick={handleRunOCR} 
                    disabled={ocrLoading} 
                    className="btn btn-primary"
                    style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#0284c7", border: "1px solid #0284c7", width: "100%" }}
                  >
                    {ocrLoading ? "Running AI Document OCR..." : "Scan & Parse Report"}
                  </button>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Diagnostic Test Findings/Results *</label>
                  <textarea 
                    className="form-control"
                    rows="3"
                    value={resultsInput}
                    onChange={(e) => setResultsInput(e.target.value)}
                    placeholder="E.g. Hemoglobin: 14.2 g/dL (Normal: 12-16 g/dL), White Blood Cells: 6,800 /uL..."
                    required
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "1rem" }}>
                  <button 
                    type="button" 
                    onClick={handleRunAIAnalysis} 
                    disabled={aiLoading} 
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", color: "#0284c7", borderColor: "#0284c7", background: "#f0f9ff" }}
                  >
                    {aiLoading ? "AI is analyzing findings..." : "🔍 Run AI Diagnostic Screening"}
                  </button>
                </div>

                {/* AI Screening Card */}
                {aiAnalysis && (
                  <div style={{ padding: "1rem", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", marginTop: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>AI TEST INTERPRETATION</span>
                      <span className="badge" style={{ 
                        fontSize: "0.65rem", 
                        background: aiAnalysis.criticalAlertLevel === "HIGH" ? "#fee2e2" : aiAnalysis.criticalAlertLevel === "MEDIUM" ? "#fef3c7" : "#ecfdf5",
                        color: aiAnalysis.criticalAlertLevel === "HIGH" ? "#ef4444" : aiAnalysis.criticalAlertLevel === "MEDIUM" ? "#d97706" : "#059669",
                        fontWeight: 800
                      }}>
                        {aiAnalysis.criticalAlertLevel} ALERT
                      </span>
                    </div>

                    <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "#334155", lineHeight: 1.4 }}>
                      <strong>Summary:</strong> {aiAnalysis.summary}
                    </p>

                    <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                      <strong>Detected Abnormal Values:</strong>
                      <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.2rem", color: "#b91c1c" }}>
                        {aiAnalysis.abnormalValues?.map((val, idx) => (
                          <li key={idx} style={{ marginBottom: "0.15rem" }}>{val}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ marginTop: "0.75rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem", fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600, textAlign: "right" }}>
                      * Advisory screening only. Final results verified by doctor.
                    </div>
                  </div>
                )}
 
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Diagnostic PDF Document Name (Simulated Upload)</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={reportFileInput}
                    onChange={(e) => setReportFileInput(e.target.value)}
                    placeholder="E.g. cbc_panel_report.pdf"
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => { setResultsModalOpen(false); setAiAnalysis(null); }} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCompleteTest} style={{ flex: 1 }}>
                Submit & Notify Doctor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labs;
