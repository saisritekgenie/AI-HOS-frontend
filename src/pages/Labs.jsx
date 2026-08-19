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
  const [viewingLab, setViewingLab] = useState(null);

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
      const fileName = reportFileInput.trim() 
        ? (reportFileInput.trim().endsWith(".pdf") ? reportFileInput.trim().replace(/\.pdf$/, ".html") : reportFileInput.trim())
        : `lab_report_${selectedLab.testName.replace(/\s+/g, "_").toLowerCase()}_${Date.now().toString().slice(-4)}.html`;
      if (!fileName.endsWith(".html")) {
        fileName += ".html";
      }
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

  const handlePrintSingleLab = (lab) => {
    if (!lab) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Laboratory Report - ${lab.testName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.5; position: relative; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
            .hospital-title { font-size: 20px; font-weight: 800; color: #10b981; text-transform: uppercase; margin: 0; }
            .doc-title { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0; }
            
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
            .meta-item { color: #334155; }
            
            .result-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .result-card h3 { color: #15803d; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            .result-text { font-size: 13px; color: #1e293b; line-height: 1.6; }
            
            .footer { border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 55px;
              color: rgba(239, 68, 68, 0.09);
              font-weight: 900;
              letter-spacing: 4px;
              pointer-events: none;
              white-space: nowrap;
              user-select: none;
              text-transform: uppercase;
              z-index: -1;
            }
          </style>
        </head>
        <body>
          <div class="watermark">DUPLICATE REPORT</div>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="hospital-title">${lab.patient?.hospital?.name || "AI Hospital Group"}</h1>
                <h2 class="doc-title">Pathology & Diagnostic Lab Report</h2>
              </td>
              <td style="text-align: right; font-size: 11px; color: #64748b;">
                <div style="font-size: 11px; font-weight: 800; color: #ef4444; border: 2px solid #ef4444; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">DUPLICATE COPY</div>
                <div>Report Date: ${lab.sampleCollectedAt ? new Date(lab.sampleCollectedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div>Status: RELEASED</div>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${lab.patient?.firstName} ${lab.patient?.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${lab.patient?.uhid || "N/A"}</div>
            <div class="meta-item"><strong>Test Parameter:</strong> ${lab.testName}</div>
            <div class="meta-item"><strong>Ordered By:</strong> Dr. ${lab.prescribedBy?.firstName} ${lab.prescribedBy?.lastName}</div>
          </div>

          <div class="result-card">
            <h3>Diagnostic Findings</h3>
            <div class="result-text">
              ${lab.results || "Standard physiological values fall within reference ranges. No clinical pathology detected."}
            </div>
          </div>

          <div style="font-size: 12px; color: #64748b; margin-top: 20px;">
            <strong>Lab Assistant Notes:</strong> Test completed and verified by pathology technician.
          </div>

          <div class="footer">
            * Verified Medical Diagnostic Document. *
          </div>

          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadSingleLab = (lab) => {
    if (!lab) return;
    const htmlContent = `
      <html>
        <head>
          <title>Laboratory Report - ${lab.testName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.5; position: relative; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
            .hospital-title { font-size: 20px; font-weight: 800; color: #10b981; text-transform: uppercase; margin: 0; }
            .doc-title { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
            .meta-item { color: #334155; }
            .result-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .result-card h3 { color: #15803d; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            .result-text { font-size: 13px; color: #1e293b; line-height: 1.6; }
            .footer { border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 55px;
              color: rgba(239, 68, 68, 0.09);
              font-weight: 900;
              letter-spacing: 4px;
              pointer-events: none;
              white-space: nowrap;
              user-select: none;
              text-transform: uppercase;
              z-index: -1;
            }
          </style>
        </head>
        <body>
          <div class="watermark">DUPLICATE REPORT</div>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="hospital-title">${lab.patient?.hospital?.name || "AI Hospital Group"}</h1>
                <h2 class="doc-title">Pathology & Diagnostic Lab Report</h2>
              </td>
              <td style="text-align: right; font-size: 11px; color: #64748b;">
                <div style="font-size: 11px; font-weight: 800; color: #ef4444; border: 2px solid #ef4444; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px;">DUPLICATE COPY</div>
                <div>Report Date: ${lab.sampleCollectedAt ? new Date(lab.sampleCollectedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div>Status: RELEASED</div>
              </td>
            </tr>
          </table>
          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${lab.patient?.firstName} ${lab.patient?.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${lab.patient?.uhid || "N/A"}</div>
            <div class="meta-item"><strong>Test Parameter:</strong> ${lab.testName}</div>
            <div class="meta-item"><strong>Ordered By:</strong> Dr. ${lab.prescribedBy?.firstName} ${lab.prescribedBy?.lastName}</div>
          </div>
          <div class="result-card">
            <h3>Diagnostic Findings</h3>
            <div class="result-text">
              ${lab.results || "Standard physiological values fall within reference ranges. No clinical pathology detected."}
            </div>
          </div>
          <div style="font-size: 12px; color: #64748b; margin-top: 20px;">
            <strong>Lab Assistant Notes:</strong> Test completed and verified by pathology technician.
          </div>
          <div class="footer">
            * Verified Medical Diagnostic Document. *
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `lab_report_${lab.testName.replace(/\s+/g, "_")}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                      <span className="badge" style={{ background: "#f1f5f9", color: "var(--text-secondary)" }}>ROUTINE</span>
                    )}
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{lab.patient?.firstName} {lab.patient?.lastName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {lab.patient?.uhid} (Room {lab.patient?.roomNo || "N/A"})</div>
                    </div>
                  </td>
                  <td>
                    <strong 
                      onClick={() => setViewingLab(lab)} 
                      style={{ color: "#0ea5e9", cursor: "pointer", textDecoration: "underline" }}
                      title="Click to view report details"
                    >
                      {lab.testName}
                    </strong>
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
                        <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>{new Date(lab.sampleCollectedAt).toLocaleString()}</span>
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
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                          <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 700 }}>{lab.results}</span>
                          <div style={{ display: "flex", gap: "0.4rem" }}>
                            <span 
                              onClick={() => handlePrintSingleLab(lab)} 
                              style={{ fontSize: "0.7rem", color: "#0ea5e9", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Print
                            </span>
                            <span 
                              onClick={() => handleDownloadSingleLab(lab)} 
                              style={{ fontSize: "0.7rem", color: "#0ea5e9", cursor: "pointer", textDecoration: "underline" }}
                            >
                              Download HTML
                            </span>
                          </div>
                          <span 
                            onClick={() => setViewingLab(lab)}
                            style={{ fontSize: "0.7rem", color: "var(--text-secondary)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.15rem", textDecoration: "underline" }}
                          >
                            <FileText size={10} />
                            <span>{lab.reportFile}</span>
                          </span>
                        </div>
                      )}
                      {lab.status === "REJECTED" && (
                        <span 
                          onClick={() => setViewingLab(lab)}
                          style={{ color: "#ef4444", fontSize: "0.75rem", cursor: "pointer", textDecoration: "underline" }}
                          title="Click to view details"
                        >
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
                  <strong style={{ fontSize: "0.8rem", color: "var(--accent-primary)", display: "block", marginBottom: "0.4rem" }}>📄 Simulated OCR Document Parser</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>Paste raw scanned report text below. The AI will extract clinical results.</span>
                  
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
                    style={{ flex: 1, padding: "0.5rem", fontSize: "0.8rem", color: "var(--accent-primary)", bordercolor: "var(--accent-primary)", background: "#f0f9ff" }}
                  >
                    {aiLoading ? "AI is analyzing findings..." : "🔍 Run AI Diagnostic Screening"}
                  </button>
                </div>

                {/* AI Screening Card */}
                {aiAnalysis && (
                  <div style={{ padding: "1rem", background: "#f8fafc", border: "1px solid var(--border-glass)", borderRadius: "12px", marginTop: "0.5rem" }}>
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

                    <div style={{ marginTop: "0.75rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem", fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>
                      * Advisory screening only. Final results verified by doctor.
                    </div>
                  </div>
                )}
 
                <div className="form-group">
                  <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Diagnostic Report Document Name (Simulated Upload)</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={reportFileInput}
                    onChange={(e) => setReportFileInput(e.target.value)}
                    placeholder="E.g. cbc_panel_report.html"
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
      {/* View Lab Details Modal */}
      {viewingLab && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2rem", borderRadius: "16px", background: "var(--bg-secondary)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)" }}>LABORATORY REPORT DETAILS</h4>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Test Request ID: {viewingLab._id.slice(-6).toUpperCase()}</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "#334155", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Test Name:</span>
                <strong>{viewingLab.testName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient Name:</span>
                <strong>{viewingLab.patient?.firstName} {viewingLab.patient?.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>UHID (Patient ID):</span>
                <strong>{viewingLab.patient?.uhid || "N/A"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Ordered By:</span>
                <strong>Dr. {viewingLab.prescribedBy?.firstName} {viewingLab.prescribedBy?.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sample Collected At:</span>
                <span>{viewingLab.sampleCollectedAt ? new Date(viewingLab.sampleCollectedAt).toLocaleString() : "Pending Collection"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #cbd5e1", paddingBottom: "0.5rem" }}>
                <span>Report Status:</span>
                <strong style={{ color: viewingLab.status === "COMPLETED" ? "#15803d" : viewingLab.status === "REJECTED" ? "#ef4444" : viewingLab.status === "SAMPLE_COLLECTED" ? "#0284c7" : viewingLab.status === "ACCEPTED" ? "#16a34a" : "#d97706" }}>
                  {viewingLab.status.replace("_", " ")}
                </strong>
              </div>
            </div>

            {viewingLab.status === "REJECTED" && (
              <div style={{ background: "#fee2e2", padding: "1rem", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "1rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#dc2626", fontWeight: 700 }}>REJECTION PROBLEM DETAILS</h5>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#b91c1c", lineHeight: 1.4 }}>
                  {viewingLab.rejectionReason || "No rejection reason specified."}
                </p>
              </div>
            )}

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "1rem" }}>
              <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-primary)" }}>DIAGNOSTIC FINDINGS / RESULTS</h5>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                {viewingLab.status === "COMPLETED" 
                  ? (viewingLab.results || "Standard physiological values fall within reference ranges.") 
                  : viewingLab.status === "REJECTED"
                  ? `This lab test request was rejected. Reason: ${viewingLab.rejectionReason || "N/A"}`
                  : viewingLab.status === "SAMPLE_COLLECTED"
                  ? "Sample has been collected and is currently being processed by pathology."
                  : viewingLab.status === "ACCEPTED"
                  ? "Lab request accepted. Awaiting specimen collection."
                  : "Laboratory analysis will release medical details shortly upon sample reception."}
              </p>
            </div>

            {viewingLab.status === "COMPLETED" && viewingLab.reportFile && (
              <div style={{ marginTop: "0.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "1.2rem" }}>📄</span>
                <a 
                  href={`http://localhost:8086/uploads/${viewingLab.reportFile}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}
                >
                  View Complete Lab Report ({viewingLab.reportFile})
                </a>
              </div>
            )}
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              {viewingLab.status === "COMPLETED" && (
                <>
                  <button className="btn btn-secondary" onClick={() => handlePrintSingleLab(viewingLab)} style={{ flex: 1 }}>Print</button>
                  <button className="btn btn-secondary" onClick={() => handleDownloadSingleLab(viewingLab)} style={{ flex: 1 }}>Download HTML</button>
                </>
              )}
              <button className="btn btn-primary" onClick={() => setViewingLab(null)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Labs;
