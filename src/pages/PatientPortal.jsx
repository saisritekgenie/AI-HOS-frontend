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
  fetchAIPatientSummary,
  fetchConsolidatedReport
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
          fetchPatientClinicalSummary(user._id).catch(err => { console.error("Clinical summary fetch failed:", err); return { data: null }; }),
          fetchBillingInvoices().catch(err => { console.error("Billing invoices fetch failed:", err); return { data: [] }; }),
          fetchInvoices().catch(err => { console.error("Reception invoices fetch failed:", err); return { data: [] }; }),
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

  const handleDownloadSingleInvoice = (inv) => {
    if (!inv) return;
    const htmlContent = `
      <html>
        <head>
          <title>Hospital Invoice - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 500px; margin: 0 auto; line-height: 1.6; }
            .receipt-header { border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
            .receipt-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .receipt-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .meta-section { margin-bottom: 20px; font-size: 13px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .charges-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; }
            .charges-title { font-size: 11px; font-weight: 800; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
            .total-section { font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            .footer { border-top: 2px dashed #cbd5e1; margin-top: 30px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1 class="receipt-title">${patient.hospital?.name || "AI Hospital Group"}</h1>
            <div class="receipt-subtitle">Official Billing Receipt & Clearance Slip</div>
          </div>
          <div class="meta-section">
            <div class="meta-row"><span>Receipt ID:</span> <strong>#${inv.invoiceNumber}</strong></div>
            <div class="meta-row"><span>Date:</span> <span>${new Date(inv.createdAt).toLocaleString()}</span></div>
            <div class="meta-row"><span>Patient Name:</span> <strong>${patient.firstName} ${patient.lastName}</strong></div>
            <div class="meta-row"><span>UHID:</span> <strong>${patient.uhid || "N/A"}</strong></div>
          </div>
          <div class="charges-card">
            <div class="charges-title">Charges Breakdown</div>
            <div class="meta-row">
              <span>${inv.type === "OUTPATIENT_CONSULTATION" ? "OPD Consultation Check-up" : inv.itemName || "Medical service fee"}</span>
              <strong>₹${inv.totalAmount}.00</strong>
            </div>
            ${inv.type === "OUTPATIENT_CONSULTATION" && inv.doctor ? `
              <div class="meta-row" style="font-size: 11px; color: #64748b;">
                <span>Consultant: Dr. ${inv.doctor.firstName} ${inv.doctor.lastName}</span>
              </div>
            ` : ""}
          </div>
          <div class="total-section">
            <div class="total-row"><span>Total Amount:</span> <strong>₹${inv.totalAmount}.00</strong></div>
            <div class="total-row" style="color: #16a34a;"><span>Paid Amount:</span> <strong>₹${inv.paidAmount}.00</strong></div>
            <div class="total-row" style="color: #ef4444; font-weight: 700;"><span>Remaining Due:</span> <strong>₹${inv.balanceAmount}.00</strong></div>
            <div class="total-row"><span>Payment Status:</span> <strong style="text-transform: uppercase;">${inv.status}</strong></div>
            <div class="total-row"><span>Settle Mode:</span> <strong>${inv.paymentMethod || "CASH"}</strong></div>
          </div>
          <div class="footer">
            Thank you for choosing ${patient.hospital?.name || "MediCore"}.<br>
            * Computer-generated invoice. No physical signature required. *
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${inv.invoiceNumber}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadSingleLab = (lab) => {
    if (!lab) return;
    const htmlContent = `
      <html>
        <head>
          <title>Laboratory Report - ${lab.testName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 600px; margin: 0 auto; line-height: 1.5; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #10b981; padding-bottom: 15px; }
            .hospital-title { font-size: 20px; font-weight: 800; color: #10b981; text-transform: uppercase; margin: 0; }
            .doc-title { font-size: 13px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-size: 13px; }
            .meta-item { color: #334155; }
            .result-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 25px; }
            .result-card h3 { color: #15803d; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; }
            .result-text { font-size: 13px; color: #1e293b; line-height: 1.6; }
            .footer { border-top: 1px dashed #cbd5e1; margin-top: 40px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 class="hospital-title">${patient.hospital?.name || "AI Hospital Group"}</h1>
                <h2 class="doc-title">Pathology & Diagnostic Lab Report</h2>
              </td>
              <td style="text-align: right; font-size: 11px; color: #64748b;">
                <div>Report Date: ${lab.sampleCollectedAt ? new Date(lab.sampleCollectedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div>Status: RELEASED</div>
              </td>
            </tr>
          </table>
          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${patient.firstName} ${patient.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${patient.uhid || "N/A"}</div>
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

  const handlePrintAllReceipts = () => {
    if (invoices.length === 0) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Billing Receipts Statement - ${patient.firstName} ${patient.lastName}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1e293b; }
            .header { border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 0; }
            .meta { font-size: 12px; color: #64748b; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; }
            th { background-color: #f8fafc; color: #475569; }
            .amount { font-weight: 700; text-align: right; }
            .status { font-weight: 700; text-transform: uppercase; font-size: 10px; }
            .total-row { border-top: 2px solid #cbd5e1; font-weight: 700; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">STATEMENT OF OUTSTANDING & PAID INVOICES</h1>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Patient Name: ${patient.firstName} ${patient.lastName} | UHID: ${patient.uhid || "N/A"}</div>
            </div>
            <div class="meta">
              <div style="font-weight: 800; font-size: 13px; color: #0284c7;">🏥 ${patient.hospital?.name || "AI Hospital Outlet"}</div>
              <div>Date Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice Number</th>
                <th>Description / Category</th>
                <th>Issued Date</th>
                <th>Settle Status</th>
                <th>Payment Mode</th>
                <th style="text-align: right;">Total Amount</th>
                <th style="text-align: right;">Amount Paid</th>
                <th style="text-align: right;">Remaining Due</th>
              </tr>
            </thead>
            <tbody>
              ${invoices.map(inv => `
                <tr>
                  <td><strong>${inv.invoiceNumber}</strong></td>
                  <td>${inv.type === "OUTPATIENT_CONSULTATION" ? "OPD Consultation" : inv.category || "Clinical Item"} - ${inv.itemName || "General Charge"}</td>
                  <td>${new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td class="status" style="color: ${inv.status === "PAID" ? "#16a34a" : "#ef4444"};">${inv.status}</td>
                  <td>${inv.paymentMethod}</td>
                  <td class="amount">₹${inv.totalAmount}.00</td>
                  <td class="amount" style="color: #16a34a;">₹${inv.paidAmount}.00</td>
                  <td class="amount" style="color: #ef4444;">₹${inv.balanceAmount}.00</td>
                </tr>
              `).join("")}
              <tr class="total-row">
                <td colspan="5" style="text-align: right;">Grand Total Accumulations:</td>
                <td style="text-align: right;">₹${invoices.reduce((acc, curr) => acc + curr.totalAmount, 0)}.00</td>
                <td style="text-align: right; color: #16a34a;">₹${invoices.reduce((acc, curr) => acc + curr.paidAmount, 0)}.00</td>
                <td style="text-align: right; color: #ef4444;">₹${invoices.reduce((acc, curr) => acc + curr.balanceAmount, 0)}.00</td>
              </tr>
            </tbody>
          </table>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintConsolidatedReport = async (patientId) => {
    try {
      const res = await fetchConsolidatedReport(patientId);
      const data = res.data;
      if (!data) return;

      const { patient, consultations, vitals, labs, invoices, discharge, medications = [] } = data;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Consolidated Medical Dossier - ${patient.firstName} ${patient.lastName}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; line-height: 1.5; }
              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #0284c7; padding-bottom: 15px; }
              .hospital-title { font-size: 24px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin: 0; }
              .doc-title { font-size: 14px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0; }
              
              .patient-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
              .meta-item { font-size: 13px; color: #334155; }
              .meta-item strong { color: #0f172a; }

              .section-title { font-size: 15px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin: 30px 0 15px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              
              .report-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
              .report-table th, .report-table td { border: 1px solid #e2e8f0; padding: 8px 10px; text-align: left; }
              .report-table th { background-color: #f1f5f9; color: #475569; font-weight: 700; }
              
              .notes-block { background: #f8fafc; border-left: 3px solid #0ea5e9; padding: 10px 15px; font-style: italic; font-size: 13px; margin: 8px 0; border-radius: 0 6px 6px 0; }
              .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: 700; border-radius: 4px; text-transform: uppercase; }
              .badge-paid { background: #dcfce7; color: #16a34a; }
              .badge-unpaid { background: #fee2e2; color: #ef4444; }

              .discharge-card { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 15px; margin-bottom: 25px; }
              .discharge-card h3 { color: #065f46; margin: 0 0 10px 0; font-size: 15px; text-transform: uppercase; }
              
              @media print {
                body { padding: 20px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <!-- Header section -->
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="hospital-title">${patient.hospital?.name || "AI Hospital Group"}</h1>
                  <h2 class="doc-title">Consolidated EMR Clinical Case Dossier</h2>
                </td>
                <td style="text-align: right; font-size: 12px; color: #64748b;">
                  <div>Date Exported: ${new Date().toLocaleString()}</div>
                  <div>ID QR Authentication: Active</div>
                </td>
              </tr>
            </table>

            <!-- Patient Profile Grid -->
            <div class="patient-meta-grid">
              <div class="meta-item"><strong>Patient Name:</strong> ${patient.firstName} ${patient.lastName}</div>
              <div class="meta-item"><strong>UHID (Patient ID):</strong> ${patient.uhid || "N/A"}</div>
              <div class="meta-item"><strong>Age / Gender:</strong> ${patient.age || "N/A"} / ${patient.gender || "N/A"}</div>
              <div class="meta-item"><strong>Contact:</strong> ${patient.mobile || "N/A"}</div>
              <div class="meta-item"><strong>Department:</strong> ${patient.department || "General Medicine"}</div>
              <div class="meta-item"><strong>Room / Bed Assignment:</strong> Room ${patient.roomNo || "N/A"} | Bed ${patient.bedNo || "N/A"}</div>
            </div>

            <!-- 1. Discharge Summary Section -->
            ${discharge ? `
              <div class="discharge-card">
                <h3>✓ Clinical Discharge Completed</h3>
                <div style="font-size: 13px; color: #065f46; margin-bottom: 10px;">
                  <strong>Authorized by:</strong> Dr. ${discharge.doctor?.firstName || ""} ${discharge.doctor?.lastName || ""} | 
                  <strong>Discharged At:</strong> ${new Date(discharge.dischargedAt).toLocaleString()}
                </div>
                <div style="font-size: 13px; margin-bottom: 10px;">
                  <strong>Clinical Advisory Summary:</strong>
                  <div class="notes-block" style="border-left-color: #10b981; background: #f0fdf4;">${discharge.dischargeSummary}</div>
                </div>
                ${discharge.takeHomeMedications && discharge.takeHomeMedications.length > 0 ? `
                  <div style="font-size: 12px; font-weight: 700; margin-bottom: 5px; color: #065f46;">Take-Home Medication Regimen:</div>
                  <table class="report-table" style="background: white;">
                    <thead>
                      <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency / Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${discharge.takeHomeMedications.map(m => `
                        <tr>
                          <td><strong>${m.medicationName}</strong></td>
                          <td>${m.dosage}</td>
                          <td>${m.frequency}</td>
                        </tr>
                      `).join("")}
                    </tbody>
                  </table>
                ` : ""}
              </div>
            ` : ""}

            <!-- 2. Consultation Logs -->
            <div class="section-title">Consultation & Diagnosis History</div>
            ${consultations.length === 0 ? `<p style="font-size: 12px; color: #64748b;">No consultations recorded.</p>` : `
              <div style="display: flex; flex-direction: column; gap: 15px;">
                ${consultations.map(c => `
                  <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: #1e293b;">
                      <span>Dr. ${c.doctor?.firstName || ""} ${c.doctor?.lastName || ""}</span>
                      <span style="font-weight: normal; color: #64748b;">${new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style="font-size: 12px; margin-top: 4px;"><strong>Diagnosis:</strong> ${c.diagnosis}</div>
                    <div class="notes-block">${c.clinicalNotes}</div>
                  </div>
                `).join("")}
              </div>
            `}

            <!-- 3. Historical Vitals Trend -->
            <div class="section-title">Vitals Charting Record</div>
            ${vitals.length === 0 ? `<p style="font-size: 12px; color: #64748b;">No vital charting records.</p>` : `
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Blood Pressure</th>
                    <th>Heart Rate</th>
                    <th>Temp (°F)</th>
                    <th>SpO2 (%)</th>
                    <th>Blood Sugar</th>
                  </tr>
                </thead>
                <tbody>
                  ${vitals.map(v => `
                    <tr>
                      <td>${new Date(v.recordedAt || v.createdAt).toLocaleString()}</td>
                      <td>${v.bp || "N/A"}</td>
                      <td>${v.heartRate ? v.heartRate + " bpm" : "N/A"}</td>
                      <td>${v.temperature ? v.temperature + " °F" : "N/A"}</td>
                      <td>${v.spo2 ? v.spo2 + " %" : "N/A"}</td>
                      <td>${v.sugar ? v.sugar + " mg/dL" : "N/A"}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `}

            <!-- 4. Clinical Medications & Prescriptions -->
            <div class="section-title">Clinical Medications & Prescriptions</div>
            ${medications.length === 0 ? `<p style="font-size: 12px; color: #64748b;">No clinical medications logged.</p>` : `
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Medication Name</th>
                    <th>Dosage</th>
                    <th>Frequency</th>
                    <th>Prescribed By</th>
                    <th>Given By / Administered</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${medications.map(m => `
                    <tr>
                      <td><strong>${m.medicationName}</strong></td>
                      <td>${m.dosage}</td>
                      <td>${m.frequency}</td>
                      <td>Dr. ${m.prescribedBy ? m.prescribedBy.firstName + " " + m.prescribedBy.lastName : "N/A"}</td>
                      <td>${m.givenBy ? m.givenBy.firstName + " " + m.givenBy.lastName + " at " + new Date(m.givenAt).toLocaleString() : "Not Administered"}</td>
                      <td><span class="badge ${m.status === "DISPENSED" || m.status === "GIVEN" ? "badge-paid" : "badge-unpaid"}">${m.status}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `}

            <!-- 5. Laboratory Report Diagnostics -->
            <div class="section-title">Diagnostic Laboratory Investigations</div>
            ${labs.length === 0 ? `<p style="font-size: 12px; color: #64748b;">No lab orders recorded.</p>` : `
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Prescribed Date</th>
                    <th>Test Parameter</th>
                    <th>Diagnostic Results / Findings</th>
                    <th>Priority</th>
                    <th>Settle Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${labs.map(l => `
                    <tr>
                      <td>${new Date(l.createdAt).toLocaleDateString()}</td>
                      <td><strong>${l.testName}</strong></td>
                      <td>${l.results || `<span style="color: #d97706; font-style: italic;">Results Pending</span>`}</td>
                      <td>${l.isEmergency ? "STAT EMERGENCY" : "ROUTINE"}</td>
                      <td><span class="badge ${l.status === "COMPLETED" ? "badge-paid" : "badge-unpaid"}">${l.status}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            `}

            <!-- 6. Hospital Billing Statement -->
            <div class="section-title">Hospital Billing Ledger Statement</div>
            ${invoices.length === 0 ? `<p style="font-size: 12px; color: #64748b;">No billing invoices recorded.</p>` : `
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Invoice ID</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Issued Date</th>
                    <th>Payment Mode</th>
                    <th>Amount Paid</th>
                    <th style="text-align: right;">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoices.map(i => `
                    <tr>
                      <td><strong>${i.invoiceNumber || i.billNumber || i._id}</strong></td>
                      <td>${i.category || "Consultation Fee"}</td>
                      <td>${i.itemName || "OPD Check-up"}</td>
                      <td>${new Date(i.createdAt).toLocaleDateString()}</td>
                      <td>${i.paymentMethod}</td>
                      <td>₹${i.paidAmount !== undefined ? i.paidAmount : (i.status === "PAID" ? i.totalAmount : 0)}.00</td>
                      <td style="text-align: right; font-weight: 700;">₹${i.totalAmount}.00</td>
                    </tr>
                  `).join("")}
                  <tr style="font-weight: 700; font-size: 13px; background-color: #f8fafc;">
                    <td colspan="5" style="text-align: right;">Total Settle Summary:</td>
                    <td style="color: #16a34a;">₹${invoices.reduce((acc, curr) => acc + (curr.paidAmount !== undefined ? curr.paidAmount : (curr.status === "PAID" ? curr.totalAmount : 0)), 0)}.00</td>
                    <td style="text-align: right; color: #0284c7;">₹${invoices.reduce((acc, curr) => acc + curr.totalAmount, 0)}.00</td>
                  </tr>
                </tbody>
              </table>
            `}

            <script>
              setTimeout(() => { window.print(); }, 800);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {
      console.error(err);
      alert("Failed to compile consolidated EMR report document.");
    }
  };

  const handlePrintSingleInvoice = (inv) => {
    if (!inv) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Hospital Invoice - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 500px; margin: 0 auto; line-height: 1.6; }
            .receipt-header { border-bottom: 2px dashed #cbd5e1; padding-bottom: 15px; margin-bottom: 20px; text-align: center; }
            .receipt-title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
            .receipt-subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            
            .meta-section { margin-bottom: 20px; font-size: 13px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            
            .charges-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 20px; font-size: 13px; }
            .charges-title { font-size: 11px; font-weight: 800; color: #475569; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 8px; text-transform: uppercase; }
            
            .total-section { font-size: 14px; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
            
            .footer { border-top: 2px dashed #cbd5e1; margin-top: 30px; padding-top: 15px; text-align: center; font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="receipt-header">
            <h1 class="receipt-title">${patient.hospital?.name || "AI Hospital Group"}</h1>
            <div class="receipt-subtitle">Official Billing Receipt & Clearance Slip</div>
          </div>
          
          <div class="meta-section">
            <div class="meta-row"><span>Receipt ID:</span> <strong>#${inv.invoiceNumber}</strong></div>
            <div class="meta-row"><span>Date:</span> <span>${new Date(inv.createdAt).toLocaleString()}</span></div>
            <div class="meta-row"><span>Patient Name:</span> <strong>${patient.firstName} ${patient.lastName}</strong></div>
            <div class="meta-row"><span>UHID:</span> <strong>${patient.uhid || "N/A"}</strong></div>
          </div>

          <div class="charges-card">
            <div class="charges-title">Charges Breakdown</div>
            <div class="meta-row">
              <span>${inv.type === "OUTPATIENT_CONSULTATION" ? "OPD Consultation Check-up" : inv.itemName || "Medical service fee"}</span>
              <strong>₹${inv.totalAmount}.00</strong>
            </div>
            ${inv.type === "OUTPATIENT_CONSULTATION" && inv.doctor ? `
              <div class="meta-row" style="font-size: 11px; color: #64748b;">
                <span>Consultant: Dr. ${inv.doctor.firstName} ${inv.doctor.lastName}</span>
              </div>
            ` : ""}
          </div>

          <div class="total-section">
            <div class="total-row"><span>Total Amount:</span> <strong>₹${inv.totalAmount}.00</strong></div>
            <div class="total-row" style="color: #16a34a;"><span>Paid Amount:</span> <strong>₹${inv.paidAmount}.00</strong></div>
            <div class="total-row" style="color: #ef4444; font-weight: 700;"><span>Remaining Due:</span> <strong>₹${inv.balanceAmount}.00</strong></div>
            <div class="total-row"><span>Payment Status:</span> <strong style="text-transform: uppercase;">${inv.status}</strong></div>
            <div class="total-row"><span>Settle Mode:</span> <strong>${inv.paymentMethod || "CASH"}</strong></div>
          </div>

          <div class="footer">
            Thank you for choosing ${patient.hospital?.name || "MediCore"}.<br>
            * Computer-generated invoice. No physical signature required. *
          </div>
          
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
                <h1 class="hospital-title">${patient.hospital?.name || "AI Hospital Group"}</h1>
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
            <div class="meta-item"><strong>Patient Name:</strong> ${patient.firstName} ${patient.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${patient.uhid || "N/A"}</div>
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ border: "4px solid #f3f3f3", borderTop: "4px solid #0284c7", borderRadius: "50%", width: "40px", height: "40px", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }}></div>
          <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Loading your secure medical portal...</p>
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
      <header style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-glass)", padding: "1rem 2rem", position: "sticky", top: 0, zIndex: 10 }}>
        <div className="portal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: "1280px", margin: "0 auto" }}>
          <div className="portal-header-left" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
              <Activity size={24} />
            </div>
            <div style={{ textAlign: "left" }}>
              <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.5px" }}>MediCore Patient Portal</h1>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 500 }}>Secure Clinical Access</span>
            </div>
          </div>

          <div className="portal-header-right" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{patient.firstName} {patient.lastName}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>{patient.uhid}</div>
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
        
        {(!clinicalData?.vitals?.length && !invoices?.length && !clinicalData?.medications?.length) && (
          <div style={{ gridColumn: "1 / -1", background: "#f0fdfa", border: "1px solid #ccfbf1", color: "#0d9488", padding: "1.25rem", borderRadius: "12px", marginBottom: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <span style={{ fontSize: "1.25rem" }}>ℹ️</span>
            <div>
              <strong style={{ display: "block", fontSize: "0.9rem", color: "#0f766e", marginBottom: "0.25rem" }}>How to view your clinical files & details:</strong>
              <span style={{ fontSize: "0.8rem" }}>Since you are a newly registered outpatient, your medical chart is currently empty. To get details, ask your primary consulting doctor or nurse at the front counter to log your vitals, file diagnostic orders, or dispense medications. Once logged by the hospital staff, your complete EMR file will immediately synchronize and display here.</span>
            </div>
          </div>
        )}
        
        {/* Left Column: Personal info & Warning Tags */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          
          {/* Card: My File Profile */}
          <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "var(--text-primary)", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
              My Patient File
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Assigned Hospital:</span>
                <strong style={{ display: "block", color: "var(--text-primary)" }}>{patient.hospital?.name || "MediCore General Hospital"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Contact Number:</span>
                <strong style={{ display: "block", color: "var(--text-primary)" }}>{patient.mobile || "N/A"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Blood Group:</span>
                <strong style={{ display: "block", color: "var(--text-primary)" }}>{patient.bloodGroup || "O+"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--text-secondary)" }}>Registered Type:</span>
                <strong style={{ display: "block", color: "var(--text-primary)" }}>{patient.registrationType || "WALK_IN"}</strong>
              </div>
              {patient.assignedDoctor && (
                <div>
                  <span style={{ color: "var(--text-secondary)" }}>Primary Physician:</span>
                  <strong style={{ display: "block", color: "var(--text-primary)" }}>Dr. {patient.assignedDoctor.firstName} {patient.assignedDoctor.lastName}</strong>
                </div>
              )}
              
              <button 
                onClick={() => handlePrintConsolidatedReport(patient._id)}
                className="btn btn-primary"
                style={{ width: "100%", marginTop: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", background: "#0284c7", border: "1px solid #0284c7" }}
              >
                <FileText size={16} />
                <span>Print Complete EMR Dossier</span>
              </button>
            </div>
          </div>

          {/* Card: Active Clinical Alerts */}
          <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "var(--text-primary)", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
              Clinical Warnings & Allergies
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(!patient.allergies?.length && !patient.chronicDiseases?.length && !patient.vaccinations?.length) ? (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>No clinical alerts or allergies recorded.</p>
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
          <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <DollarSign size={18} className="text-amber-500" />
                <span>My Invoices</span>
              </h3>
              {invoices.length > 0 && (
                <button
                  onClick={handlePrintAllReceipts}
                  className="btn btn-secondary"
                  style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "#0ea5e9", borderColor: "#0ea5e9", background: "none", cursor: "pointer" }}
                >
                  🖨️ Print Statement PDF
                </button>
              )}
            </div>
            {invoices.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>No billing invoices generated.</p>
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
                      border: "1px solid var(--border-glass)", 
                      padding: "0.85rem 1rem", 
                      borderRadius: "10px", 
                      background: "var(--bg-secondary)", 
                      cursor: "pointer",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      transition: "transform 0.15s ease"
                    }}
                    title="Click to view full receipt"
                    onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                    onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                  >
                    <div>
                      <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "block" }}>
                        Inv: {inv.invoiceNumber}
                        <span style={{ fontSize: "0.7rem", color: "#6366f1", fontWeight: 700, marginLeft: "0.35rem" }}>
                          ({inv.type === "OUTPATIENT_CONSULTATION" ? "Consultation" : inv.category || "Clinical"})
                        </span>
                      </strong>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
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
                      <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700 }}>Receipt →</span>
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
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>Loading clinical summaries...</p>
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
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No active prescriptions logged.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {clinicalData.medications.map((m) => (
                    <div 
                      key={m._id} 
                      style={{ 
                        display: "flex", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        border: "1px solid var(--border-glass)", 
                        padding: "1rem 1.25rem", 
                        borderRadius: "12px", 
                        background: m.status === "GIVEN" ? "#f0fdf4" : "#ffffff",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>{m.medicationName}</strong>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          Dosage: <strong>{m.dosage}</strong> | Frequency: <strong>{m.frequency}</strong>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
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
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No nursing or care instructions listed.</p>
              ) : (
                clinicalData.instructions.map((inst) => (
                  <div key={inst._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "10px", background: inst.status === "COMPLETED" ? "#f8fafc" : "white" }}>
                    <div>
                      <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "var(--text-primary)" }}>{inst.instruction}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Ordered by Dr. {inst.prescribedBy?.firstName} {inst.prescribedBy?.lastName}</span>
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
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No lab test records found.</p>
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
                        border: "1px solid var(--border-glass)", 
                        padding: "1.25rem", 
                        borderRadius: "12px", 
                        background: "var(--bg-secondary)",
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
                        <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)", display: "block" }}>{lab.testName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.25rem" }}>
                          Ordered by Dr. {lab.prescribedBy?.firstName} {lab.prescribedBy?.lastName}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                        <span className="badge" style={{ 
                          background: lab.status === "COMPLETED" ? "#dcfce7" : lab.status === "REJECTED" ? "#fee2e2" : lab.status === "SAMPLE_COLLECTED" ? "#e0f2fe" : lab.status === "ACCEPTED" ? "#ecfdf5" : "#fef3c7", 
                          color: lab.status === "COMPLETED" ? "#15803d" : lab.status === "REJECTED" ? "#ef4444" : lab.status === "SAMPLE_COLLECTED" ? "#0284c7" : lab.status === "ACCEPTED" ? "#16a34a" : "#d97706", 
                          fontSize: "0.75rem", 
                          fontWeight: 700 
                        }}>
                          {lab.status === "COMPLETED" ? "REPORT RELEASED" : lab.status === "REJECTED" ? "REJECTED" : lab.status === "SAMPLE_COLLECTED" ? "SAMPLE COLLECTED (PROCESSING)" : lab.status === "ACCEPTED" ? "ACCEPTED (PROCESSING)" : "AWAITING SAMPLE"}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 700 }}>View Details →</span>
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
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No vitals recorded by nursing staff yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {clinicalData.vitals.map((v) => (
                    <div 
                      key={v._id} 
                      style={{ 
                        border: "1px solid var(--border-glass)", 
                        padding: "1.25rem", 
                        borderRadius: "12px", 
                        background: "var(--bg-secondary)",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600 }}>Record Date: {new Date(v.createdAt).toLocaleDateString()}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>By: {v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : "Nurse"}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: "0.75rem" }}>
                        {v.temperature && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Temp</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.temperature}°F</div>
                          </div>
                        )}
                        {v.bp && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>BP</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.bp}</div>
                          </div>
                        )}
                        {v.heartRate && (
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Pulse</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.heartRate} bpm</div>
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
                          <div style={{ background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Blood Sugar</div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>{v.sugar} mg/dL</div>
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
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No file attachments uploaded to your record.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {patient.documents.map((doc, idx) => (
                    <div key={idx} className="doc-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "0.85rem 1.25rem", borderRadius: "10px", background: "#f8fafc" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <FileText size={20} style={{ color: "var(--text-secondary)" }} />
                        <div>
                          <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{doc.name}</strong>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                            Uploaded on {new Date(doc.uploadedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <a 
                        href={doc.url.startsWith("http") ? doc.url : `http://localhost:8086${doc.url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ fontSize: "0.8rem", color: "var(--accent-primary)", fontWeight: 700, textDecoration: "none" }}
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
          <div className="modal-card" style={{ maxWidth: "450px", padding: "2rem", borderRadius: "16px", background: "var(--bg-secondary)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)" }}>MEDICORE HOSPITAL RECEIPT</h4>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Invoice #{selectedInvoice.invoiceNumber}</span>
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
              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid var(--border-glass)", margin: "0.25rem 0" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.25rem", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Charges breakdown
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem" }}>
                  {selectedInvoice.type === "OUTPATIENT_CONSULTATION" ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Doctor Consultation Fee:</span>
                        <strong style={{ color: "var(--text-primary)" }}>₹{selectedInvoice.totalAmount}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Consulting Doctor:</span>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {selectedInvoice.doctor ? `Dr. ${selectedInvoice.doctor.firstName} ${selectedInvoice.doctor.lastName}` : "Assigned Physician"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Service Location:</span>
                        <strong style={{ color: "var(--text-primary)" }}>Outpatient Desk</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Processor:</span>
                        <strong style={{ color: "var(--text-primary)" }}>Receptionist Staff</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Service Description:</span>
                        <strong style={{ color: "var(--text-primary)" }}>{selectedInvoice.itemName || "Medical service fee"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Category:</span>
                        <strong style={{ color: "var(--accent-primary)" }}>{selectedInvoice.category || "Clinical"}</strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Billing Processor:</span>
                        <strong style={{ color: "var(--text-primary)" }}>
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
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", color: "var(--text-primary)" }}>
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
                <button className="btn btn-secondary" onClick={() => handlePrintSingleInvoice(selectedInvoice)} style={{ flex: 1 }}>Print</button>
                <button className="btn btn-secondary" onClick={() => handleDownloadSingleInvoice(selectedInvoice)} style={{ flex: 1 }}>Download HTML</button>
                <button className="btn btn-primary" onClick={() => setSelectedInvoice(null)} style={{ flex: 1, background: "#64748b" }}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Modal */}
      {selectedLab && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "500px", padding: "2rem", borderRadius: "16px", background: "var(--bg-secondary)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)" }}>LABORATORY REPORT</h4>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Test Request ID: {selectedLab._id.slice(-6).toUpperCase()}</span>
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
                <strong style={{ color: selectedLab.status === "COMPLETED" ? "#15803d" : selectedLab.status === "REJECTED" ? "#ef4444" : selectedLab.status === "SAMPLE_COLLECTED" ? "#0284c7" : selectedLab.status === "ACCEPTED" ? "#16a34a" : "#d97706" }}>
                  {selectedLab.status === "COMPLETED" ? "COMPLETED" : selectedLab.status === "REJECTED" ? "REJECTED" : selectedLab.status === "SAMPLE_COLLECTED" ? "SAMPLE COLLECTED (PROCESSING)" : selectedLab.status === "ACCEPTED" ? "ACCEPTED (PROCESSING)" : "AWAITING SAMPLE"}
                </strong>
              </div>
            </div>

            {selectedLab.status === "REJECTED" && (
              <div style={{ background: "#fee2e2", padding: "1rem", borderRadius: "8px", border: "1px solid #fecaca", marginBottom: "1rem" }}>
                <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#dc2626", fontWeight: 700 }}>REJECTION PROBLEM DETAILS</h5>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#b91c1c", lineHeight: 1.4 }}>
                  {selectedLab.rejectionReason || "No rejection reason specified. Please contact reception."}
                </p>
              </div>
            )}

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "1rem" }}>
              <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-primary)" }}>DIAGNOSTIC OBSERVATION</h5>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>
                {selectedLab.status === "COMPLETED" 
                  ? (selectedLab.results || "Standard reference values are normal. Hemoglobin count, blood counts, and sugar indices fall within healthy physiological ranges.") 
                  : selectedLab.status === "REJECTED"
                  ? `This lab test request was rejected/cancelled. Reason: ${selectedLab.rejectionReason || "No reason specified."}`
                  : selectedLab.status === "SAMPLE_COLLECTED"
                  ? "Sample has been collected and is currently being processed by pathology."
                  : selectedLab.status === "ACCEPTED"
                  ? "Lab request accepted. Awaiting sample collection."
                  : "Laboratory analysis will release medical details shortly upon sample reception."}
              </p>
            </div>

            {selectedLab.status === "COMPLETED" && selectedLab.reportFile && (
              <div style={{ marginTop: "0.5rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.6rem", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "1.2rem" }}>📄</span>
                <a 
                  href={`http://localhost:8086/uploads/${selectedLab.reportFile}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}
                >
                  Download Complete Lab Report PDF
                </a>
              </div>
            )}
            
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <button className="btn btn-secondary" onClick={() => handlePrintSingleLab(selectedLab)} style={{ flex: 1 }}>Print</button>
              <button className="btn btn-secondary" onClick={() => handleDownloadSingleLab(selectedLab)} style={{ flex: 1 }}>Download HTML</button>
              <button className="btn btn-primary" onClick={() => setSelectedLab(null)} style={{ flex: 1 }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mock Payment Gateway Modal */}
      {payingInvoice && (
        <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div className="modal-card" style={{ maxWidth: "450px", width: "90%", padding: "2rem", borderRadius: "20px", background: "var(--bg-secondary)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)" }}>
            <div style={{ textAlign: "center", borderBottom: "1px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "inline-flex", padding: "0.5rem", borderRadius: "12px", background: "#f0fdf4", color: "#16a34a", marginBottom: "0.5rem" }}>
                <DollarSign size={24} />
              </div>
              <h4 style={{ margin: 0, fontSize: "1.2rem", color: "var(--text-primary)", fontWeight: 800 }}>MediCore Secure Checkout</h4>
              <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Simulated Payment Gateway</span>
            </div>

            <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-glass)", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Invoice Reference:</span>
                <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>#{payingInvoice.invoiceNumber}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Total Due Amount:</span>
                <strong style={{ fontSize: "1rem", color: "#4f46e5" }}>₹{payingInvoice.totalAmount}</strong>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: "0.5rem" }}>SELECT PAYMENT METHOD</label>
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
              <div style={{ textAlign: "center", padding: "1.5rem 1rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid var(--border-glass)", marginBottom: "1.5rem" }}>
                <div style={{ display: "inline-block", padding: "0.75rem", background: "var(--bg-secondary)", borderRadius: "8px", border: "1px solid var(--border-glass)", marginBottom: "0.75rem" }}>
                  {/* Mock QR Code representation */}
                  <div style={{ width: "120px", height: "120px", background: "repeating-conic-gradient(from 45deg, #0f172a 0% 25%, transparent 0% 50%) 50% / 15px 15px", opacity: 0.85, margin: "0 auto" }}></div>
                </div>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-secondary)" }}>Scan mock QR code with GPay/PhonePe to simulate direct payment authorization.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Card Number</label>
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
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Expiry Date</label>
                    <input 
                      type="text" 
                      placeholder="MM/YY" 
                      defaultValue="12/29" 
                      style={{ width: "100%", padding: "0.6rem 0.8rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: "0.7rem", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>CVV</label>
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
                style={{ width: "100%", padding: "0.75rem", background: "var(--bg-secondary)", border: "1px solid #cbd5e1", color: "var(--text-secondary)", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}
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
