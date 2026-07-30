import React, { useState, useEffect } from "react";
import { 
  fetchInventory, 
  addMedicine, 
  updateMedicineStock, 
  fetchPharmacyBills, 
  createPharmacyBill, 
  payPharmacyBill, 
  dispensePrescription,
  fetchLabRequests, // Reuse clinical queries to list prescriptions
  fetchAIPharmacyCompanion,
  fetchAIPharmacyForecast
} from "../services/api";
import api from "../services/api";
import { 
  CheckCircle, 
  AlertCircle, 
  Pill, 
  Plus, 
  TrendingUp, 
  ClipboardList, 
  Calendar, 
  AlertTriangle, 
  DollarSign, 
  Printer, 
  Check, 
  X,
  CreditCard
} from "lucide-react";

const Pharmacy = () => {
  const [activeTab, setActiveTab] = useState("prescriptions");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // States
  const [inventory, setInventory] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [bills, setBills] = useState([]);

  // AI companion states
  const [aiInteractionReport, setAiInteractionReport] = useState(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  // AI Forecast states
  const [aiForecast, setAiForecast] = useState(null);
  const [aiForecastLoading, setAiForecastLoading] = useState(false);

  // Restock modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [newStockCount, setNewStockCount] = useState(0);

  // Add new medicine modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMedForm, setNewMedForm] = useState({
    name: "",
    stock: 20,
    price: 15,
    expiryDate: "",
    batchNumber: ""
  });

  // Print invoice modal
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Process payment modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPharmacyForecast = async () => {
    try {
      setAiForecastLoading(true);
      const res = await fetchAIPharmacyForecast();
      setAiForecast(res.data);
    } catch (err) {
      console.error("Failed to load pharmacy forecast:", err);
    } finally {
      setAiForecastLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch inventory
      const invRes = await fetchInventory();
      setInventory(invRes.data || []);

      // Fetch all medications
      const medRes = await api.get("/clinical/all-pending-medications");
      setPrescriptions(medRes.data?.data || []);

      // Fetch billing invoices
      const billsRes = await fetchPharmacyBills();
      setBills(billsRes.data || []);
      
      // Load AI Pharmacy Forecast
      loadPharmacyForecast();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to refresh pharmacy data stores");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckSafety = async () => {
    if (prescriptions.length === 0) return;
    try {
      setAiReportLoading(true);
      const res = await fetchAIPharmacyCompanion(prescriptions);
      setAiInteractionReport(res.data);
      showToast("success", "AI prescription safety screening complete!");
    } catch (err) {
      console.error(err);
      showToast("error", "AI safety screen failed");
    } finally {
      setAiReportLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRestock = async () => {
    if (newStockCount < 0) return;
    try {
      await updateMedicineStock(selectedMed._id, newStockCount);
      showToast("success", "Inventory stock refilled successfully");
      setRestockModalOpen(false);
      setSelectedMed(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to update stock");
    }
  };

  const handleAddNewMedicine = async (e) => {
    e.preventDefault();
    if (!newMedForm.name.trim() || !newMedForm.batchNumber.trim()) return;
    try {
      await addMedicine(newMedForm);
      showToast("success", "New pharmaceutical drug added to inventory");
      setAddModalOpen(false);
      setNewMedForm({ name: "", stock: 20, price: 15, expiryDate: "", batchNumber: "" });
      loadData();
    } catch (err) {
      showToast("error", "Failed to register new medicine");
    }
  };

  const handleDispense = async (presc) => {
    try {
      // 1. Mark as DISPENSED and decrement stock
      await dispensePrescription(presc._id);
      
      // 2. Lookup medicine price in inventory, default to 15 if missing
      const medName = presc.medicationName || "";
      const cleanName = medName.split("(")[0].trim();
      const match = inventory.find(m => m.name.toLowerCase().includes(cleanName.toLowerCase()));
      const unitPrice = match ? match.price : 15;

      // 3. Auto-generate billing invoice
      await createPharmacyBill({
        patientId: presc.patient._id,
        items: [
          {
            medicineName: presc.medicationName,
            quantity: 1,
            price: unitPrice
          }
        ],
        paymentStatus: "UNPAID"
      });

      showToast("success", "Prescription Dispensed! Invoice bill generated.");
      loadData();
    } catch (err) {
      showToast("error", "Failed to process dispensation");
    }
  };

  const handleProcessPayment = async () => {
    try {
      await payPharmacyBill(selectedBill._id, paymentMethod);
      showToast("success", "Bill paid and receipt settled successfully");
      setPayModalOpen(false);
      setSelectedBill(null);
      loadData();
    } catch (err) {
      showToast("error", "Payment processing failed");
    }
  };

  // Expiry date formatter
  const isExpiringSoon = (expiryStr) => {
    if (!expiryStr) return false;
    const exp = new Date(expiryStr);
    if (isNaN(exp.getTime())) return false;
    const today = new Date();
    const diffTime = exp - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 90; // True if expiring within 90 days
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
          <h1>Pharmacy Inventory & Billing</h1>
          <p>Verify doctor prescriptions, dispense drugs, manage stock inventory levels, and process payments.</p>
        </div>
        <div className="page-actions" style={{ display: "flex", gap: "1rem" }}>
          <button className="btn btn-primary" onClick={() => setAddModalOpen(true)}>
            <Plus size={16} />
            <span>Add New Drug</span>
          </button>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="tab-container" style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem" }}>
        <button 
          onClick={() => setActiveTab("prescriptions")} 
          style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "prescriptions" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "prescriptions" ? "var(--primary)" : "#64748b", fontWeight: activeTab === "prescriptions" ? 700 : 500, cursor: "pointer" }}
        >
          Prescription Worklist ({prescriptions.filter(p => p.status === "PENDING").length})
        </button>
        <button 
          onClick={() => setActiveTab("inventory")} 
          style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "inventory" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "inventory" ? "var(--primary)" : "#64748b", fontWeight: activeTab === "inventory" ? 700 : 500, cursor: "pointer" }}
        >
          Drug Inventory Stock
        </button>
        <button 
          onClick={() => setActiveTab("billing")} 
          style={{ padding: "0.75rem 1.5rem", background: "none", border: "none", borderBottom: activeTab === "billing" ? "3px solid var(--primary)" : "3px solid transparent", color: activeTab === "billing" ? "var(--primary)" : "#64748b", fontWeight: activeTab === "billing" ? 700 : 500, cursor: "pointer" }}
        >
          Invoice Receipts
        </button>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Refreshing pharmacy catalog...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PRESCRIPTIONS LIST */}
          {activeTab === "prescriptions" && (
            <div className="table-container" style={{ border: "none", boxShadow: "none" }}>
              {/* AI Drug-Drug Interaction screening */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: "#0f172a", display: "block" }}>🛡️ AI Pharmacist Companion - Drug Safety Screening</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Screen active queue prescriptions for cross-drug clinical interactions.</span>
                  </div>
                  <button 
                    onClick={handleCheckSafety} 
                    disabled={aiReportLoading || prescriptions.filter(p => p.status === "PENDING").length === 0}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", color: "#6b21a8", borderColor: "#c084fc", background: "#faf5ff", cursor: "pointer" }}
                  >
                    {aiReportLoading ? "Screening Prescription List..." : "Run AI Drug Safety Screen"}
                  </button>
                </div>

                {aiInteractionReport && (
                  <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
                    <div style={{ background: "white", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#e11d48", display: "block", marginBottom: "0.4rem" }}>⚠️ DETECTED CROSS-DRUG INTERACTIONS:</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {aiInteractionReport.interactionWarnings?.map((warn, i) => (
                          <div key={i} style={{ borderLeft: "3px solid #f43f5e", paddingLeft: "0.5rem", fontSize: "0.75rem" }}>
                            <span className="badge" style={{ fontSize: "0.6rem", background: warn.severity === "CRITICAL" ? "#fee2e2" : "#fef3c7", color: warn.severity === "CRITICAL" ? "#ef4444" : "#d97706", marginRight: "0.35rem", display: "inline-block" }}>
                              {warn.severity}
                            </span>
                            <span style={{ color: "#334155" }}>{warn.details}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ background: "white", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#16a34a", display: "block", marginBottom: "0.4rem" }}>🌱 SUGGESTED GENERIC ALTERNATIVES:</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.75rem", color: "#334155" }}>
                        {Object.entries(aiInteractionReport.genericAlternatives || {}).map(([med, gen]) => (
                          <div key={med} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#64748b" }}>{med.split("(")[0].trim()}:</span>
                            <strong style={{ color: "#15803d", marginLeft: "0.5rem" }}>{gen}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <div style={{ marginTop: "0.75rem", textAlign: "right", fontSize: "0.65rem", color: "#94a3b8", fontWeight: 600 }}>
                  * AI safety warning suggestions are advisory only. Final medication validation rests with the dispensing pharmacist.
                </div>
              </div>

              {prescriptions.filter(p => p.status === "PENDING").length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <ClipboardList size={40} style={{ color: "#94a3b8", marginBottom: "0.5rem" }} />
                  <p style={{ color: "var(--text-secondary)" }}>No pending prescriptions to dispense.</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Patient Details</th>
                      <th>Prescribed Medication</th>
                      <th>Dosage & Routine</th>
                      <th>Prescribed By</th>
                      <th>Requested Date</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptions.filter(p => p.status === "PENDING").map((p) => (
                      <tr key={p._id}>
                        <td>
                          <strong>{p.patient?.firstName} {p.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {p.patient?.uhid}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: "#0f172a", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <Pill size={14} style={{ color: "#0ea5e9" }} />
                            <span>{p.medicationName}</span>
                          </span>
                        </td>
                        <td>{p.dosage} - {p.frequency}</td>
                        <td>Dr. {p.prescribedBy?.firstName} {p.prescribedBy?.lastName}</td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => handleDispense(p)} 
                            className="btn btn-primary"
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                          >
                            Verify & Dispense
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TAB 2: INVENTORY CATALOG */}
          {activeTab === "inventory" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* AI Pharmacy Forecast Analytics */}
              <div className="table-container" style={{ padding: "1.5rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
                <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 800, color: "#0284c7", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                  <span>📊 AI Pharmacy Stock Forecasting & Expiry Alerts</span>
                  <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px" }}>Active</span>
                </h4>
                
                {aiForecastLoading ? (
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Compiling inventory data and running prediction algorithms...</p>
                ) : aiForecast ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                    {/* Stockout risks */}
                    <div style={{ padding: "0.85rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#f59e0b", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>⚠️ CRITICAL STOCKOUT FORECAST</span>
                      {(!aiForecast.stockoutRisks || aiForecast.stockoutRisks.length === 0) ? (
                        <p style={{ fontSize: "0.75rem", margin: 0, color: "#64748b" }}>All medication stocks stable.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {(aiForecast.stockoutRisks || []).map((risk, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                              <strong>{risk.medicineName}</strong>
                              <span style={{ color: "#ef4444", fontWeight: 700 }}>Est. stockout: {risk.predictedDaysLeft} days ({risk.severity})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Expiry Warnings */}
                    <div style={{ padding: "0.85rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>🚨 UPCOMING BATCH EXPIRIES</span>
                      {(!aiForecast.expiryWarnings || aiForecast.expiryWarnings.length === 0) ? (
                        <p style={{ fontSize: "0.75rem", margin: 0, color: "#64748b" }}>No batches expiring within 6 months.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {(aiForecast.expiryWarnings || []).map((exp, i) => (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                              <strong>{exp.medicineName} (Batch {exp.batchNumber})</strong>
                              <span style={{ color: "#ef4444", fontWeight: 700 }}>{exp.daysRemaining} days left</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Replenishments */}
                    <div style={{ padding: "0.85rem", background: "white", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                      <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>📦 REPLENISHMENT ADVICE</span>
                      {(!aiForecast.replenishmentRecommendations || aiForecast.replenishmentRecommendations.length === 0) ? (
                        <p style={{ fontSize: "0.75rem", margin: 0, color: "#64748b" }}>Stocks meet standard demand thresholds.</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                          {(aiForecast.replenishmentRecommendations || []).slice(0, 3).map((rec, i) => (
                            <div key={i} style={{ fontSize: "0.72rem", color: "#334155" }}>
                              • Order <strong>{rec.suggestedQuantity} units</strong> of <strong>{rec.medicineName}</strong> ({rec.reason})
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Click refresh to fetch AI forecasting suggestions.</p>
                )}
              </div>

              <div className="table-container">
                <table className="custom-table">
                <thead>
                  <tr>
                    <th>Medicine Details</th>
                    <th>Batch ID</th>
                    <th>Price (Per Unit)</th>
                    <th>Available Stock</th>
                    <th>Expiration Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((item) => {
                    const isExp = isExpiringSoon(item.expiryDate);
                    return (
                      <tr key={item._id} style={{ background: item.stock < 10 ? "#fffbeb" : "inherit" }}>
                        <td>
                          <strong style={{ color: "var(--text-primary)" }}>{item.name}</strong>
                          {item.stock < 10 && (
                            <span className="badge" style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.7rem", marginLeft: "0.5rem" }}>
                              LOW STOCK
                            </span>
                          )}
                        </td>
                        <td><code>{item.batchNumber}</code></td>
                        <td>₹{item.price}.00</td>
                        <td>
                          <span style={{ fontWeight: 700, color: item.stock < 10 ? "#ef4444" : "#1e293b" }}>
                            {item.stock} Units
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: isExp ? "#ef4444" : "#15803d", 
                            fontWeight: isExp ? 700 : 500,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem"
                          }}>
                            {isExp && <AlertTriangle size={12} />}
                            <span>{new Date(item.expiryDate).toLocaleDateString()} {isExp ? "(Expiring Soon)" : ""}</span>
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => { setSelectedMed(item); setNewStockCount(item.stock); setRestockModalOpen(true); }}
                            className="btn btn-secondary"
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Refill Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* TAB 3: BILLING RECEIPTS */}
          {activeTab === "billing" && (
            <div className="table-container">
              {bills.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center" }}>
                  <p style={{ color: "var(--text-secondary)" }}>No billing logs registered.</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient Name</th>
                      <th>Drugs Dispensed</th>
                      <th>Grand Total</th>
                      <th>Settle Status</th>
                      <th style={{ textAlign: "right" }}>Receipt Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((bill) => (
                      <tr key={bill._id}>
                        <td><code>{bill.billNumber}</code></td>
                        <td>
                          <strong>{bill.patient?.firstName} {bill.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {bill.patient?.uhid}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                            {bill.items?.map((it, idx) => (
                              <span key={idx} style={{ fontSize: "0.8rem", color: "#334155" }}>
                                {it.medicineName} x{it.quantity}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>${bill.totalAmount}.00</strong>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: bill.paymentStatus === "PAID" ? "#dcfce7" : "#fee2e2",
                            color: bill.paymentStatus === "PAID" ? "#15803d" : "#ef4444",
                            fontWeight: 700
                          }}>
                            {bill.paymentStatus} {bill.paymentStatus === "PAID" ? `(${bill.paymentMethod})` : ""}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            {bill.paymentStatus === "UNPAID" && (
                              <button 
                                onClick={() => { setSelectedBill(bill); setPayModalOpen(true); }}
                                className="btn btn-primary"
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                              >
                                Settle Payment
                              </button>
                            )}
                            <button 
                              onClick={() => { setSelectedBill(bill); setPrintModalOpen(true); }}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              <Printer size={12} />
                              <span>View Receipt</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}

      {/* Restock Modal */}
      {restockModalOpen && selectedMed && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "350px" }}>
            <div className="modal-header">
              <h3>Refill Inventory Stock</h3>
              <button className="action-btn" onClick={() => setRestockModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Set stock units for <strong>{selectedMed.name}</strong></p>
              <div className="form-group" style={{ marginTop: "1rem" }}>
                <label>Inventory Quantity (Units)</label>
                <input 
                  type="number"
                  className="form-control"
                  value={newStockCount}
                  onChange={(e) => setNewStockCount(parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRestockModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleRestock}>Save Stock</button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Drug Modal */}
      {addModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Register New Medicine Catalog</h3>
              <button className="action-btn" onClick={() => setAddModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleAddNewMedicine}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>Medicine Name (Brand/Dosage) *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={newMedForm.name}
                    onChange={(e) => setNewMedForm({ ...newMedForm, name: e.target.value })}
                    placeholder="E.g. Metformin 500mg (Glycomet)"
                    required
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Initial Stock Count *</label>
                    <input 
                      type="number"
                      className="form-control"
                      value={newMedForm.stock}
                      onChange={(e) => setNewMedForm({ ...newMedForm, stock: parseInt(e.target.value) || 0 })}
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price Per Unit (₹) *</label>
                    <input 
                      type="number"
                      className="form-control"
                      value={newMedForm.price}
                      onChange={(e) => setNewMedForm({ ...newMedForm, price: parseInt(e.target.value) || 0 })}
                      min="0"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Batch Number *</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={newMedForm.batchNumber}
                      onChange={(e) => setNewMedForm({ ...newMedForm, batchNumber: e.target.value })}
                      placeholder="E.g. BAT-904"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date *</label>
                    <input 
                      type="date"
                      className="form-control"
                      value={newMedForm.expiryDate}
                      onChange={(e) => setNewMedForm({ ...newMedForm, expiryDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Drug</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      {payModalOpen && selectedBill && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "350px" }}>
            <div className="modal-header">
              <h3>Process Pharmacy Payment</h3>
              <button className="action-btn" onClick={() => setPayModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Settling invoice <strong>{selectedBill.billNumber}</strong> for patient <strong>{selectedBill.patient?.firstName} {selectedBill.patient?.lastName}</strong></p>
              <h4 style={{ fontSize: "1.2rem", margin: "1rem 0", color: "#10b981", fontWeight: 700 }}>Total Amount: ₹{selectedBill.totalAmount}.00</h4>
              
              <div className="form-group">
                <label>Select Payment Mode</label>
                <select 
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">CREDIT/DEBIT CARD</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessPayment}>Process Settle</button>
            </div>
          </div>
        </div>
      )}

      {/* Print invoice receipt modal */}
      {printModalOpen && selectedBill && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2.5rem" }}>
            <div style={{ textAlign: "center", borderBottom: "2px dashed #e2e8f0", paddingBottom: "1.5rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
                <div style={{ background: "#0ea5e9", color: "white", padding: "0.35rem", borderRadius: "8px" }}>
                  <Pill size={20} />
                </div>
                <strong style={{ fontSize: "1.2rem", color: "#0f172a" }}>MEDICORE PHARMACY OUTLET</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>AI-HOS Digital Pharmacy Systems</p>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>24x7 Diagnostic & Prescription Settle Counter</p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "1rem", color: "#334155" }}>
              <div>
                <div><strong>Invoice To:</strong></div>
                <div>{selectedBill.patient?.firstName} {selectedBill.patient?.lastName}</div>
                <div>UHID: {selectedBill.patient?.uhid}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div><strong>Bill Receipt Info:</strong></div>
                <div>Receipt: {selectedBill.billNumber}</div>
                <div>Date: {new Date(selectedBill.createdAt).toLocaleDateString()}</div>
              </div>
            </div>

            <table className="custom-table" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              <thead>
                <tr>
                  <th>Medicine description</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th style={{ textAlign: "right" }}>Price</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedBill.items?.map((it, idx) => (
                  <tr key={idx}>
                    <td>{it.medicineName}</td>
                    <td style={{ textAlign: "center" }}>{it.quantity}</td>
                    <td style={{ textAlign: "right" }}>₹{it.price}.00</td>
                    <td style={{ textAlign: "right" }}>₹{it.price * it.quantity}.00</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: "2px dashed #e2e8f0", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span className="badge" style={{
                  background: selectedBill.paymentStatus === "PAID" ? "#dcfce7" : "#fee2e2",
                  color: selectedBill.paymentStatus === "PAID" ? "#15803d" : "#ef4444",
                  fontWeight: 800
                }}>
                  {selectedBill.paymentStatus} {selectedBill.paymentStatus === "PAID" ? `(${selectedBill.paymentMethod})` : ""}
                </span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.85rem", color: "#64748b", marginRight: "0.5rem" }}>Grand Total:</span>
                <strong style={{ fontSize: "1.2rem", color: "#0f172a" }}>₹{selectedBill.totalAmount}.00</strong>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: "none", marginTop: "2rem", padding: 0 }}>
              <button className="btn btn-secondary" style={{ width: "100%" }} onClick={() => setPrintModalOpen(false)}>
                Close Invoice Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pharmacy;
