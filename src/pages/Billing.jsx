import React, { useState, useEffect } from "react";
import { fetchInvoices, createInvoice, payInvoice, fetchUsers } from "../services/api";
import { Plus, Search, CheckCircle, AlertCircle, FileText, Printer, Check } from "lucide-react";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Billing states
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState(null);

  const [formData, setFormData] = useState({
    patientId: "",
    doctorId: "",
    billAmount: 500,
    paymentMethod: "N/A",
    paymentStatus: "UNPAID"
  });

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [invRes, patientRes, docRes] = await Promise.all([
        fetchInvoices(),
        fetchUsers({ role: "PATIENT", limit: 100 }),
        fetchUsers({ role: "DOCTOR", limit: 100 })
      ]);
      setInvoices(invRes.data || []);
      setPatients(patientRes.data || []);
      setDoctors(docRes.data || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load invoices");
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
      if (formData.paymentStatus === "PAID" && formData.paymentMethod === "N/A") {
        formData.paymentMethod = "CASH";
      }
      await createInvoice(formData);
      showToast("success", "Consultation invoice created");
      setIsModalOpen(false);
      setFormData({
        patientId: "",
        doctorId: "",
        billAmount: 500,
        paymentMethod: "N/A",
        paymentStatus: "UNPAID"
      });
      loadData();
    } catch (err) {
      showToast("error", "Failed to generate bill");
    }
  };

  const handleOpenPayment = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentMethod("UPI");
    setPaymentModalOpen(true);
  };

  const handleProcessPayment = async () => {
    try {
      await payInvoice(selectedInvoice._id, paymentMethod);
      showToast("success", "Payment received successfully!");
      setPaymentModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to process invoice payment");
    }
  };

  const handlePrint = (invoice) => {
    setReceiptInvoice(invoice);
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
          <h1>Billing Control Center</h1>
          <p>Generate outpatient consultation invoices, verify payment settlements, and print medical receipts.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>New Invoice</span>
        </button>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading invoice log...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <FileText size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No consultation bills generated yet.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Patient Details</th>
                <th>Prescribing Doctor</th>
                <th>Bill Amount</th>
                <th>Payment Mode</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id}>
                  <td>
                    <strong style={{ color: "#475569" }}>{inv.invoiceNumber}</strong>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>{inv.patient?.firstName} {inv.patient?.lastName}</strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {inv.patient?.uhid}</div>
                    </div>
                  </td>
                  <td>
                    <span>Dr. {inv.doctor?.firstName} {inv.doctor?.lastName}</span>
                  </td>
                  <td>
                    <strong style={{ color: "#0f172a" }}>₹{inv.billAmount}.00</strong>
                  </td>
                  <td>
                    <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                      {inv.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      background: inv.paymentStatus === "PAID" ? "#dcfce7" : "#fee2e2",
                      color: inv.paymentStatus === "PAID" ? "#15803d" : "#ef4444",
                      fontWeight: 700
                    }}>
                      {inv.paymentStatus}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {inv.paymentStatus === "UNPAID" ? (
                      <button 
                        onClick={() => handleOpenPayment(inv)} 
                        className="btn btn-primary" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                      >
                        Collect Payment
                      </button>
                    ) : (
                      <button 
                        onClick={() => handlePrint(inv)} 
                        className="btn btn-secondary" 
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                      >
                        <Printer size={12} />
                        <span>Print Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invoice Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Create Consultation Bill</h3>
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
                    <label>Select Treating Doctor *</label>
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
                      <label>Consultation Fee (INR) *</label>
                      <input 
                        type="number"
                        className="form-control"
                        value={formData.billAmount}
                        onChange={(e) => setFormData({ ...formData, billAmount: parseInt(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Payment Settlement *</label>
                      <select 
                        className="form-control"
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                        required
                      >
                        <option value="UNPAID">UNPAID (Generate Due)</option>
                        <option value="PAID">PAID (Collect Now)</option>
                      </select>
                    </div>
                  </div>

                  {formData.paymentStatus === "PAID" && (
                    <div className="form-group">
                      <label>Payment Method</label>
                      <select 
                        className="form-control"
                        value={formData.paymentMethod}
                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI / QR Scan</option>
                        <option value="CASH">CASH</option>
                        <option value="CARD">Debit / Credit Card</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Dialog */}
      {paymentModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Collect Invoice Payment</h3>
              <button className="action-btn" onClick={() => setPaymentModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Settling Consultation Bill for <strong>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</strong></p>
              <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", margin: "1rem 0", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span>Bill Amount:</span>
                  <strong>₹{selectedInvoice.billAmount}.00</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Invoice Reference:</span>
                  <span style={{ fontWeight: 600 }}>{selectedInvoice.invoiceNumber}</span>
                </div>
              </div>
              <div className="form-group">
                <label>Select Settle Mode *</label>
                <select 
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI (QR Code Scan)</option>
                  <option value="CASH">CASH Payment</option>
                  <option value="CARD">Debit/Credit Card swipe</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPaymentModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessPayment} style={{ background: "#10b981", border: "1px solid #10b981" }}>
                Confirm Settlement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {receiptInvoice && (
        <div className="modal-overlay" style={{ background: "rgba(15,23,42,0.6)" }}>
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2rem", background: "white", borderRadius: "16px" }}>
            <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>MediCore AI Clinics</h2>
              <p style={{ color: "#64748b", fontSize: "0.8rem", margin: "0.25rem 0 0" }}>Main Outpatient Billing Receipt</p>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem", color: "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Invoice Ref:</span>
                <strong style={{ color: "#0f172a" }}>{receiptInvoice.invoiceNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Date of Issue:</span>
                <span>{new Date(receiptInvoice.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient Name:</span>
                <strong>{receiptInvoice.patient?.firstName} {receiptInvoice.patient?.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient UHID:</span>
                <span style={{ fontWeight: 600 }}>{receiptInvoice.patient?.uhid}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Consultant:</span>
                <span>Dr. {receiptInvoice.doctor?.firstName} {receiptInvoice.doctor?.lastName}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #e2e8f0", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                <span>Payment Mode:</span>
                <span style={{ fontWeight: 700 }}>{receiptInvoice.paymentMethod}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, borderTop: "2px dashed #cbd5e1", paddingTop: "0.75rem", marginTop: "0.5rem", color: "#0f172a" }}>
                <span>Grand Total:</span>
                <span>₹{receiptInvoice.billAmount}.00</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button className="btn btn-secondary" onClick={() => setReceiptInvoice(null)} style={{ flex: 1 }}>Close</button>
              <button 
                className="btn btn-primary" 
                onClick={() => { window.print(); }} 
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <Printer size={16} />
                <span>Print Bill</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;
