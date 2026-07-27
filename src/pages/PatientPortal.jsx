import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  fetchPatientClinicalSummary, 
  fetchBillingInvoices, 
  fetchInvoices,
  fetchSystemIp,
  payInvoice,
  payBillingInvoice,
  fetchAIPatientBuddy,
  fetchAIPatientSummary
} from "../services/api";
import { AIVoiceAssistant } from "../components/common/AIVoiceAssistant";
import { PatientChatbot } from "../components/ai/PatientChatbot";
import { 
  Activity, 
  Clock, 
  Pill, 
  ClipboardList, 
  ShieldAlert, 
  LogOut, 
  DollarSign, 
  CheckCircle, 
  FileText, 
  Building,
  User
} from "lucide-react";

const PatientPortal = () => {
  const { user, logout } = useAuth();
  const [clinicalData, setClinicalData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemIp, setSystemIp] = useState("localhost");
  const [toast, setToast] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedLab, setSelectedLab] = useState(null);
  
  // Payment states
  const [payingInvoice, setPayingInvoice] = useState(null);

  // AI Medi-Buddy Chatbot States
  const [aiPatientSummary, setAiPatientSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatType, setChatType] = useState("general");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Hello! I am Medi-Buddy, your AI healthcare assistant. How can I help you understand your symptoms, prescriptions, or lab reports today?" }
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardHolder, setCardHolder] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput;
    setChatInput("");
    setChatHistory(prev => [...prev, { sender: "user", text: userMessage }]);
    setChatLoading(true);

    try {
      let contentToSend = userMessage;
      if (chatType === "prescriptions" && clinicalData?.medications) {
        contentToSend = `${userMessage}. My active medications: ${JSON.stringify(clinicalData.medications.map(m => m.medicationName))}`;
      } else if (chatType === "labs" && clinicalData?.labs) {
        contentToSend = `${userMessage}. My completed lab parameters: ${JSON.stringify(clinicalData.labs.map(l => ({ test: l.testName, results: l.results }))) }`;
      }

      const backendChatType =
        chatType === "symptoms" || chatType === "general"
          ? "symptom-checker"
          : chatType === "prescriptions"
            ? "prescription-explanation"
            : chatType === "labs"
              ? "report-explanation"
              : chatType;

      const res = await fetchAIPatientBuddy(backendChatType, contentToSend);
      setChatHistory(prev => [...prev, { sender: "ai", text: res.data.reply || res.data.response || "I've reviewed your prompt. Here is my analysis." }]);
    } catch (err) {
      console.error(err);
      setChatHistory(prev => [...prev, { sender: "ai", text: "I'm sorry, I encountered an issue checking our AI medical gateway. Please try again shortly." }]);
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    const loadPortalData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        setAiSummaryLoading(true);
        // Fetch clinical summary, inpatient bills & outpatient invoices
        const [clinicalRes, billingRes, receptionRes, ipRes, aiRes] = await Promise.all([
          fetchPatientClinicalSummary(user._id),
          fetchBillingInvoices(),
          fetchInvoices(),
          fetchSystemIp().catch(() => null),
          fetchAIPatientSummary(user._id).catch(() => null)
        ]);

        setClinicalData(clinicalRes.data);
        if (aiRes) setAiPatientSummary(aiRes.data);

        // Normalize and combine invoices
        const normalizedBilling = (billingRes.data || []).map(inv => {
          const status = inv.paymentStatus || inv.status || "UNPAID";
          const totalAmount = inv.totalAmount || inv.amount || 0;
          return {
            _id: inv._id,
            invoiceNumber: inv.invoiceNumber || inv.billNumber,
            totalAmount,
            paidAmount: inv.paidAmount !== undefined ? inv.paidAmount : (status === "PAID" ? totalAmount : 0),
            balanceAmount: inv.balanceAmount !== undefined ? inv.balanceAmount : (status === "PAID" ? 0 : totalAmount),
            status,
            paymentMethod: inv.paymentMethod || "N/A",
            createdAt: inv.createdAt,
            type: "INPATIENT_CLINICAL",
            category: inv.category,
            itemName: inv.itemName,
            processedBy: inv.processedBy
          };
        });

        const normalizedReception = (receptionRes.data || []).map(inv => ({
          _id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          totalAmount: inv.billAmount,
          paidAmount: inv.paymentStatus === "PAID" ? inv.billAmount : 0,
          balanceAmount: inv.paymentStatus === "PAID" ? 0 : inv.billAmount,
          status: inv.paymentStatus,
          paymentMethod: inv.paymentMethod || "CASH",
          createdAt: inv.createdAt,
          type: "OUTPATIENT_CONSULTATION",
          doctor: inv.doctor,
          processedBy: { firstName: "Receptionist", lastName: "Desk" }
        }));

        setInvoices([...normalizedBilling, ...normalizedReception]);

        if (ipRes?.data?.localIp) {
          setSystemIp(ipRes.data.localIp);
        }
      } catch (err) {
        console.error("Failed to load patient portal data", err);
      } finally {
        setLoading(false);
      }
    };
    loadPortalData();
  }, [user]);

  const handleMockPayment = async (method) => {
    if (!payingInvoice) return;
    try {
      setPaymentProcessing(true);
      // Simulated processing lag for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let updatedInv;
      if (payingInvoice.type === "OUTPATIENT_CONSULTATION") {
        const response = await payInvoice(payingInvoice._id, method);
        const data = response.data;
        updatedInv = {
          _id: data._id,
          invoiceNumber: data.invoiceNumber,
          totalAmount: data.billAmount,
          paidAmount: data.paymentStatus === "PAID" ? data.billAmount : 0,
          balanceAmount: data.paymentStatus === "PAID" ? 0 : data.billAmount,
          status: data.paymentStatus,
          paymentMethod: data.paymentMethod || "CASH",
          createdAt: data.createdAt,
          type: "OUTPATIENT_CONSULTATION",
          doctor: payingInvoice.doctor,
          processedBy: { firstName: "Receptionist", lastName: "Desk" }
        };
      } else {
        const response = await payBillingInvoice(payingInvoice._id, {
          paymentMethod: method,
          amountPaidThisTime: payingInvoice.balanceAmount,
          transactionId: "MOCK-PORTAL-PAY"
        });
        const data = response.data;
        updatedInv = {
          _id: data._id,
          invoiceNumber: data.invoiceNumber || data.billNumber,
          totalAmount: data.amount,
          paidAmount: data.paymentStatus === "PAID" ? data.amount : 0,
          balanceAmount: data.paymentStatus === "PAID" ? 0 : data.amount,
          status: data.paymentStatus,
          paymentMethod: data.paymentMethod || "CASH",
          createdAt: data.createdAt,
          type: "INPATIENT_CLINICAL",
          category: data.category,
          itemName: data.itemName,
          processedBy: data.processedBy || user
        };
      }

      setInvoices(prev => prev.map(inv => inv._id === updatedInv._id ? updatedInv : inv));
      if (selectedInvoice && selectedInvoice._id === updatedInv._id) {
        setSelectedInvoice(updatedInv);
      }
      showToast("success", `Secure payment of ₹${updatedInv.totalAmount} processed successfully!`);
      setPayingInvoice(null);
    } catch (err) {
      console.error("Payment failed", err);
      showToast("error", "Simulated payment processing encountered an error.");
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #0284c7", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }}></div>
          <p style={{ color: "#64748b", fontWeight: 600 }}>Loading your secure medical portal...</p>
        </div>
      </div>
    );
  }

  const patient = clinicalData?.patient || user;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: "3rem" }}>
      <style>{`
        @media (max-width: 768px) {
          .portal-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 1rem !important;
            padding: 1rem !important;
            text-align: center;
          }
          .portal-header-left {
            justify-content: center;
          }
          .portal-header-right {
            justify-content: space-between;
            width: 100%;
          }
          .portal-main {
            grid-template-columns: 1fr !important;
            padding: 0 1rem !important;
            margin-top: 1rem !important;
          }
        }
        @media (max-width: 480px) {
          .doc-item {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.75rem !important;
          }
          .doc-item a {
            align-self: flex-end;
          }
        }
      `}</style>
      {/* Top Navbar */}
      <header style={{ background: "white", borderBottom: "1px solid #e2e8f0", padding: "1rem 2rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="portal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1280px", margin: "0 auto" }}>
          <div className="portal-header-left" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Activity size={24} />
            </div>
            <div style={{ textAlign: "left" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0, letterSpacing: "-0.5px" }}>MediCore Patient Portal</h1>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>Secure Clinical Access</span>
            </div>
          </div>

          <div className="portal-header-right" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{patient.firstName} {patient.lastName}</div>
              <div style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>{patient.uhid}</div>
            </div>
            <button 
              onClick={logout}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "#fee2e2", color: "#ef4444", border: "none", padding: "0.5rem 1rem", borderRadius: "8px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="portal-main" style={{ maxWidth: "1280px", margin: "2rem auto 0", padding: "0 2rem", display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: "2rem" }}>
        
        {/* Left Column: Personal info & Warning Tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card: My File Profile */}
          <div className="table-container" style={{ padding: "1.5rem", background: "white" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              My Patient File
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "#64748b" }}>Assigned Hospital:</span>
                <strong style={{ display: "block", color: "#0f172a" }}>{patient.hospital?.name || "MediCore General Hospital"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Contact Number:</span>
                <strong style={{ display: "block", color: "#0f172a" }}>{patient.mobile || "N/A"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Blood Group:</span>
                <strong style={{ display: "block", color: "#0f172a" }}>{patient.bloodGroup || "O+"}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b" }}>Registered Type:</span>
                <strong style={{ display: "block", color: "#0f172a" }}>{patient.registrationType || "WALK_IN"}</strong>
              </div>
              {patient.assignedDoctor && (
                <div>
                  <span style={{ color: "#64748b" }}>Primary Physician:</span>
                  <strong style={{ display: "block", color: "#0f172a" }}>Dr. {patient.assignedDoctor.firstName} {patient.assignedDoctor.lastName}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Card: Active Clinical Alerts */}
          <div className="table-container" style={{ padding: "1.5rem", background: "white" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
              Clinical Warnings & Allergies
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(!patient.allergies?.length && !patient.chronicDiseases?.length && !patient.vaccinations?.length) ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>No clinical alerts or allergies recorded.</p>
              ) : (
                <>
                  {patient.allergies?.length > 0 && (
                    <div>
                      <span style={{ fontSize: "0.8rem", color: "#ef4444", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>⚠️ ALLERGIES</span>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {patient.allergies.map((a, i) => (
                          <span key={i} className="badge" style={{ background: "#fee2e2", color: "#ef4444", fontSize: "0.7rem", fontWeight: 700 }}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient.chronicDiseases?.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#d97706", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>☣️ CHRONIC DISEASES</span>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {patient.chronicDiseases.map((d, i) => (
                          <span key={i} className="badge" style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.7rem", fontWeight: 700 }}>{d}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {patient.vaccinations?.length > 0 && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>💉 VACCINATIONS</span>
                      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
                        {patient.vaccinations.map((v, i) => (
                          <span key={i} className="badge" style={{ background: "#dcfce7", color: "#15803d", fontSize: "0.7rem", fontWeight: 700 }}>{v}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Card: Billing Receipts & Invoices */}
          <div className="table-container" style={{ padding: "1.5rem", background: "white" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#0f172a", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <DollarSign size={18} className="text-amber-500" />
              <span>My Invoices</span>
            </h3>
            {invoices.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>No billing invoices generated.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {invoices.map((inv) => (
                  <div 
                    key={inv._id} 
                    onClick={() => setSelectedInvoice(inv)}
                    style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center", 
                      border: "1px solid #e2e8f0", 
                      padding: "0.85rem 1rem", 
                      borderRadius: "10px", 
                      background: "#ffffff", 
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      transition: "transform 0.15s ease"
                    }}
                    title="Click to view full receipt"
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block" }}>
                        Inv: {inv.invoiceNumber}
                        <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 700, marginLeft: "0.35rem" }}>
                          ({inv.type === "OUTPATIENT_CONSULTATION" ? "Consultation" : inv.category || "Clinical"})
                        </span>
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        Balance: <strong>₹{inv.balanceAmount}</strong> / Total: ₹{inv.totalAmount}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span className="badge" style={{ 
                        background: inv.status === "PAID" ? "#dcfce7" : inv.status === "PARTIALLY_PAID" ? "#fef3c7" : "#fee2e2", 
                        color: inv.status === "PAID" ? "#15803d" : inv.status === "PARTIALLY_PAID" ? "#d97706" : "#ef4444", 
                        fontSize: "0.65rem", 
                        fontWeight: 700 
                      }}>
                        {inv.status}
                      </span>
                      <span style={{ fontSize: "0.75rem", color: "#0284c7", fontWeight: 700 }}>Receipt →</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: EMR medical summary data */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Admitted Bed Info Bar */}
          {patient.bedNo && patient.bedNo !== "N/A" && (
            <div style={{ background: "linear-gradient(90deg, #0284c7 0%, #0369a1 100%)", color: "white", padding: "1.25rem 1.5rem", borderRadius: "16px", display: "flex", alignItems: "center", gap: "1rem", boxShadow: "0 4px 12px rgba(2, 132, 199, 0.15)" }}>
              <Building size={28} />
              <div>
                <strong style={{ fontSize: "1.05rem", display: "block" }}>Active Inpatient Admission Stay</strong>
                <span style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                  You are currently admitted to **Ward Room {patient.roomNo}** / **Bed No {patient.bedNo}**.
                </span>
              </div>
            </div>
          )}

          {/* AI Layman EMR Summary */}
          <div className="table-container" style={{ background: "#f0f9ff", padding: "1.5rem", borderRadius: "16px", border: "1px solid #bae6fd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#0369a1", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <span>📋 My AI EMR Medical History Summary (Layman Terms)</span>
                <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px" }}>Advisory</span>
              </h3>
              {aiPatientSummary && (
                <AIVoiceAssistant mode="tts" textToSpeak={`${aiPatientSummary.summary} My active prescriptions summary: ${aiPatientSummary.medicationReview} Lab results interpretation: ${aiPatientSummary.labInterpretation}`} />
              )}
            </div>

            {aiSummaryLoading ? (
              <p style={{ color: "#0369a1", fontSize: "0.85rem", margin: 0 }}>Compiling your medical history in easy layman terms...</p>
            ) : aiPatientSummary ? (
              <div style={{ fontSize: "0.85rem", color: "#1e293b", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <p style={{ margin: 0, lineHeight: 1.4 }}><strong>My Health Status:</strong> {aiPatientSummary.summary}</p>
                <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Active Medications:</strong> {aiPatientSummary.medicationReview}</p>
                <p style={{ margin: 0, lineHeight: 1.4 }}><strong>My Diagnostic Reports:</strong> {aiPatientSummary.labInterpretation}</p>
                {aiPatientSummary.healthTips?.length > 0 && (
                  <div style={{ marginTop: "0.25rem" }}>
                    <strong>Daily Care Tips for Me:</strong>
                    <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1.2rem" }}>
                      {aiPatientSummary.healthTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Loading clinical summaries...</p>
            )}
          </div>

          {/* Active Prescriptions Sheet */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Pill size={20} style={{ color: "#ec4899" }} />
              <span>My Active Prescriptions & Medications</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {!clinicalData?.medications || clinicalData.medications.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No active prescriptions logged.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {clinicalData.medications.map((m) => (
                    <div 
                      key={m._id} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        border: "1px solid #e2e8f0", 
                        padding: "1rem 1.25rem", 
                        borderRadius: "12px", 
                        background: m.status === "GIVEN" ? "#f0fdf4" : "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>{m.medicationName}</strong>
                        <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
                          Dosage: <strong>{m.dosage}</strong> | Frequency: <strong>{m.frequency}</strong>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                          Prescribed by Dr. {m.prescribedBy ? `${m.prescribedBy.firstName} ${m.prescribedBy.lastName}` : "Doctor"}
                        </div>
                      </div>
                      <div>
                        <span className="badge" style={{ 
                          background: m.status === "GIVEN" ? "#dcfce7" : "#fee2e2", 
                          color: m.status === "GIVEN" ? "#15803d" : "#ef4444", 
                          fontSize: "0.7rem", 
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem"
                        }}>
                          {m.status === "GIVEN" && <CheckCircle size={12} />}
                          {m.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Care Instructions Timeline */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ClipboardList size={20} style={{ color: "#3b82f6" }} />
              <span>Doctor Care Instructions</span>
            </h3>
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              {!clinicalData?.instructions || clinicalData.instructions.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No nursing or care instructions listed.</p>
              ) : (
                clinicalData.instructions.map((inst) => (
                  <div key={inst._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "10px", background: inst.status === "COMPLETED" ? "#f8fafc" : "white" }}>
                    <div>
                      <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "#0f172a" }}>{inst.instruction}</p>
                      <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Ordered by Dr. {inst.prescribedBy?.firstName} {inst.prescribedBy?.lastName}</span>
                    </div>
                    <span className="badge" style={{ 
                      background: inst.priority === "HIGH" ? "#fee2e2" : inst.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9", 
                      color: inst.priority === "HIGH" ? "#ef4444" : inst.priority === "MEDIUM" ? "#f59e0b" : "#64748b", 
                      fontSize: "0.7rem", 
                      fontWeight: 700 
                    }}>
                      {inst.priority} Priority
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Lab Test Reports Tracking */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={20} style={{ color: "#10b981" }} />
              <span>My Laboratory Diagnostics & Scan Requests</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {!clinicalData?.labs || clinicalData.labs.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No lab test records found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {clinicalData.labs.map((lab) => (
                    <div 
                      key={lab._id} 
                      onClick={() => setSelectedLab(lab)} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        border: "1px solid #e2e8f0", 
                        padding: "1.25rem", 
                        borderRadius: "12px", 
                        background: "#ffffff",
                        cursor: "pointer",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                        transition: "transform 0.15s ease, box-shadow 0.15s ease"
                      }}
                      title="Click to view full report"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 6px rgba(0,0,0,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "#0f172a", display: "block" }}>{lab.testName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                          Ordered by Dr. {lab.prescribedBy?.firstName} {lab.prescribedBy?.lastName}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className="badge" style={{ 
                          background: lab.status === "PENDING" ? "#fef3c7" : "#dcfce7", 
                          color: lab.status === "PENDING" ? "#d97706" : "#15803d", 
                          fontSize: "0.75rem", 
                          fontWeight: 700 
                        }}>
                          {lab.status === "PENDING" ? "AWAITING SAMPLE" : "REPORT RELEASED"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700 }}>View Report →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Vitals History List */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={20} style={{ color: "#f59e0b" }} />
              <span>My Recorded Vitals Logs</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {!clinicalData?.vitals || clinicalData.vitals.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No vitals recorded by nursing staff yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {clinicalData.vitals.map((v) => (
                    <div 
                      key={v._id} 
                      style={{ 
                        border: "1px solid #e2e8f0", 
                        padding: "1.25rem", 
                        borderRadius: "12px", 
                        background: "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Record Date: {new Date(v.createdAt).toLocaleDateString()}</span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>By: {v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : "Nurse"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
                        {v.temperature && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Temp</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{v.temperature}°F</div>
                          </div>
                        )}
                        {v.bp && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>BP</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{v.bp}</div>
                          </div>
                        )}
                        {v.heartRate && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Pulse</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{v.heartRate} bpm</div>
                          </div>
                        )}
                        {v.spo2 && (
                          <div style={{ background: v.spo2 < 95 ? "#fef2f2" : "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: v.spo2 < 95 ? "1px solid #fecaca" : "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "0.7rem", color: v.spo2 < 95 ? "#dc2626" : "#64748b" }}>SpO2</div>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: v.spo2 < 95 ? "#dc2626" : "#0f172a" }}>{v.spo2}%</span>
                              {v.spo2 < 95 && <ShieldAlert size={12} style={{ color: "#dc2626" }} />}
                            </div>
                          </div>
                        )}
                        {v.sugar && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                            <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Blood Sugar</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{v.sugar} mg/dL</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scanned Documents Upload List */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileText size={20} style={{ color: "#6366f1" }} />
              <span>My Scanned Reports & Uploaded Files</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {!patient.documents || patient.documents.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No file attachments uploaded to your record.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {patient.documents.map((doc, idx) => (
                    <div key={idx} className="doc-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "0.85rem 1.25rem", borderRadius: "10px", background: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FileText size={20} style={{ color: "#64748b" }} />
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{doc.name}</strong>
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>
                            Uploaded on {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <a 
                        href={doc.url.startsWith("http") ? doc.url : `http://localhost:8086${doc.url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.8rem", color: "#0284c7", fontWeight: 700, textDecoration: "none" }}
                      >
                        View Attachment
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </main>

      {/* Invoice Receipt Modal */}
      {selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "450px", padding: "2rem", borderRadius: "16px", background: "white" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>MEDICORE HOSPITAL RECEIPT</h4>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Invoice #{selectedInvoice.invoiceNumber}</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient Name:</span>
                <strong>{patient.firstName} {patient.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient UHID:</span>
                <strong>{patient.uhid}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Bill Date:</span>
                <span>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Detailed Breakdown section */}
              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "0.25rem 0" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.25rem", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Charges breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem" }}>
                  {selectedInvoice.type === "OUTPATIENT_CONSULTATION" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Doctor Consultation Fee:</span>
                        <strong style={{ color: "#0f172a" }}>₹{selectedInvoice.totalAmount}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Consulting Doctor:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {selectedInvoice.doctor ? `Dr. ${selectedInvoice.doctor.firstName} ${selectedInvoice.doctor.lastName}` : "Assigned Physician"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Service Location:</span>
                        <strong style={{ color: "#0f172a" }}>Outpatient Desk</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Processor:</span>
                        <strong style={{ color: "#0f172a" }}>Receptionist Staff</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Service Description:</span>
                        <strong style={{ color: "#0f172a" }}>{selectedInvoice.itemName || "Medical service fee"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Category:</span>
                        <strong style={{ color: "#0284c7" }}>{selectedInvoice.category || "Clinical"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Processor:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {selectedInvoice.processedBy ? `${selectedInvoice.processedBy.firstName} ${selectedInvoice.processedBy.lastName} (Cashier)` : "Billing Desk (Unprocessed)"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #cbd5e1", paddingBottom: "0.5rem" }}>
                <span>Payment Method:</span>
                <strong>{selectedInvoice.paymentMethod || "CASH"}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", color: "#0f172a" }}>
                <span>Total Amount:</span>
                <strong>₹{selectedInvoice.totalAmount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#059669" }}>
                <span>Paid Amount:</span>
                <strong>₹{selectedInvoice.paidAmount}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#dc2626" }}>
                <span>Balance Amount:</span>
                <strong>₹{selectedInvoice.balanceAmount}</strong>
              </div>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "1.5rem" }}>
              {selectedInvoice.status !== "PAID" && selectedInvoice.balanceAmount > 0 && (
                <button 
                  onClick={() => setPayingInvoice(selectedInvoice)}
                  style={{ width: "100%", padding: "0.8rem", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", border: "none", color: "white", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", boxShadow: "0 4px 6px rgba(2, 132, 199, 0.2)", transition: "opacity 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.95"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  💳 Pay Securely Online
                </button>
              )}
              <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
                <button className="btn btn-secondary" onClick={() => window.print()} style={{ flex: 1 }}>Print</button>
                <button className="btn btn-primary" onClick={() => setSelectedInvoice(null)} style={{ flex: 1, background: "#64748b" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Modal */}
      {selectedLab && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2rem", borderRadius: "16px", background: "white" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a" }}>LABORATORY REPORT</h4>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Test Request ID: {selectedLab._id.slice(-6).toUpperCase()}</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem", color: "#334155", marginBottom: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Test Name:</span>
                <strong>{selectedLab.testName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Patient Name:</span>
                <strong>{patient.firstName} {patient.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Ordered By:</span>
                <strong>Dr. {selectedLab.prescribedBy?.firstName} {selectedLab.prescribedBy?.lastName}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Sample Collected At:</span>
                <span>{selectedLab.sampleCollectedAt ? new Date(selectedLab.sampleCollectedAt).toLocaleString() : "Pending Collection"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #cbd5e1", paddingBottom: "0.5rem" }}>
                <span>Report Status:</span>
                <strong style={{ color: selectedLab.status === "SAMPLE_COLLECTED" ? "#059669" : "#d97706" }}>
                  {selectedLab.status === "SAMPLE_COLLECTED" ? "COMPLETED" : "AWAITING SAMPLE"}
                </strong>
              </div>
            </div>

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "1rem" }}>
              <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#0f172a" }}>DIAGNOSTIC OBSERVATION</h5>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                {selectedLab.status === "SAMPLE_COLLECTED" 
                  ? "Standard reference values are normal. Hemoglobin count, blood counts, and sugar indices fall within healthy physiological ranges." 
                  : "Laboratory analysis will release medical details shortly upon sample reception."}
              </p>
            </div>
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => window.print()} style={{ flex: 1 }}>Print</button>
              <button className="btn btn-primary" onClick={() => setSelectedLab(null)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {payingInvoice && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ maxWidth: "450px", width: "90%", padding: "2rem", borderRadius: "20px", background: "white", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-flex", padding: "0.5rem", borderRadius: "12px", background: "#f0fdf4", color: "#16a34a", marginBottom: "0.5rem" }}>
                <DollarSign size={24} />
              </div>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "#0f172a", fontWeight: 800 }}>MediCore Secure Checkout</h4>
              <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Simulated Payment Gateway</span>
            </div>

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Invoice Reference:</span>
                <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>#{payingInvoice.invoiceNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Total Due Amount:</span>
                <strong style={{ fontSize: "1rem", color: "#4f46e5" }}>₹{payingInvoice.totalAmount}</strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>SELECT PAYMENT METHOD</label>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button 
                  onClick={() => setPaymentMethod("UPI")}
                  style={{ 
                    flex: 1, 
                    padding: "0.75rem", 
                    borderRadius: "10px", 
                    border: paymentMethod === "UPI" ? "2px solid #4f46e5" : "1px solid #e2e8f0", 
                    background: paymentMethod === "UPI" ? "#f5f3ff" : "white", 
                    color: paymentMethod === "UPI" ? "#4f46e5" : "#64748b", 
                    fontWeight: 700, 
                    cursor: "pointer" 
                  }}
                >
                  📲 UPI / QR
                </button>
                <button 
                  onClick={() => setPaymentMethod("CARD")}
                  style={{ 
                    flex: 1, 
                    padding: "0.75rem", 
                    borderRadius: "10px", 
                    border: paymentMethod === "CARD" ? "2px solid #4f46e5" : "1px solid #e2e8f0", 
                    background: paymentMethod === "CARD" ? "#f5f3ff" : "white", 
                    color: paymentMethod === "CARD" ? "#4f46e5" : "#64748b", 
                    fontWeight: 700, 
                    cursor: "pointer" 
                  }}
                >
                  💳 Debit/Credit Card
                </button>
              </div>
            </div>

            {/* Method Content */}
            {paymentMethod === "UPI" ? (
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                <div style={{ display: "inline-block", padding: "0.75rem", background: "white", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "0.75rem" }}>
                  {/* Mock QR Code representation */}
                  <div style={{ width: "120px", height: "120px", background: "repeating-conic-gradient(from 45deg, #0f172a 0% 25%, transparent 0% 50%) 50% / 15px 15px", opacity: 0.85, margin: "0 auto" }}></div>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>Scan mock QR code with GPay/PhonePe to simulate direct payment authorization.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Card Number</label>
                  <input 
                    type="text" 
                    placeholder="xxxx xxxx xxxx xxxx" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      defaultValue="12/29" 
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", color: "#64748b", display: "block", marginBottom: "0.25rem" }}>CVV</label>
                    <input 
                      type="password" 
                      placeholder="***" 
                      defaultValue="123" 
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <button 
                onClick={() => handleMockPayment(paymentMethod)}
                disabled={paymentProcessing}
                style={{ 
                  width: "100%", 
                  padding: "0.85rem", 
                  background: "#16a34a", 
                  border: "none", 
                  color: "white", 
                  borderRadius: "10px", 
                  fontWeight: 700, 
                  fontSize: "0.95rem", 
                  cursor: paymentProcessing ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {paymentProcessing ? (
                  <>
                    <span style={{ border: "2px solid white", borderTop: "2px solid transparent", borderRadius: "50%", width: "14px", height: "14px", animation: "spin 0.8s linear infinite" }}></span>
                    <span>Processing Payment...</span>
                  </>
                ) : (
                  <span>🔒 Complete Simulated Payment</span>
                )}
              </button>
              <button 
                onClick={() => setPayingInvoice(null)}
                disabled={paymentProcessing}
                style={{ width: "100%", padding: "0.75rem", background: "white", border: "1px solid #cbd5e1", color: "#64748b", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      <PatientChatbot />

      {/* Toast popup */}
      {toast && (
        <div style={{ position: "fixed", bottom: "2rem", right: "2rem", background: toast.type === "success" ? "#10b981" : "#ef4444", color: "white", padding: "0.85rem 1.5rem", borderRadius: "10px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", fontWeight: 600, zIndex: 100, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <CheckCircle size={18} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default PatientPortal;
