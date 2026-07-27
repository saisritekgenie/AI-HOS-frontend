import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { 
  fetchBillingInvoices, 
  createBillingInvoice, 
  payBillingInvoice, 
  refundBillingInvoice,
  fetchUsers,
  fetchAICashierInsights,
  fetchPatientUnpaidCharges,
  createAdvancePayment,
  fetchPatientAdvanceBalance,
  fetchDischargeSummary,
  generateDischargeBill,
  fetchDailyCashReport,
  updateUserProfile,
  changeUserPassword
} from "../services/api";
import { 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Printer, 
  DollarSign, 
  CreditCard, 
  QrCode, 
  AlertTriangle, 
  ClipboardList, 
  Activity, 
  Pill, 
  Clock, 
  RotateCcw,
  Sparkles,
  Download,
  FileSpreadsheet,
  User,
  Key,
  ShieldCheck,
  TrendingUp,
  PieChart,
  Grid,
  Bell,
  RefreshCw,
  X,
  FileText
} from "lucide-react";

const CashierBilling = () => {
  const [activeTab, setActiveTab] = useState("counter"); // counter, discharge, advances, reports, analytics, profile
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Real-time socket notification states
  const [notifications, setNotifications] = useState([]);

  // AI cashier insights states
  const [aiCashierReport, setAiCashierReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Core Ledgers
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [admittedPatients, setAdmittedPatients] = useState([]);
  
  // Search & Pagination & Filter controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Billing Counter Form Modals
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    patientId: "",
    category: "CONSULTATION",
    itemName: "General OPD Consultation Fee",
    amount: 500
  });

  // Payment settle modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [amountPaidThisTime, setAmountPaidThisTime] = useState(0);
  const [transactionId, setTransactionId] = useState("");

  // Integrated Patient Charges drawer (Unpaid Lab & Pharmacy checklist)
  const [unpaidChargesDrawerOpen, setUnpaidChargesDrawerOpen] = useState(false);
  const [unpaidChargesPatient, setUnpaidChargesPatient] = useState(null);
  const [unpaidChargesData, setUnpaidChargesData] = useState({ pharmacy: [], labs: [], consultation: [] });
  const [selectedUnpaidCharges, setSelectedUnpaidCharges] = useState([]);

  // Inpatient Discharge Billing Calculator States
  const [selectedDischargePatient, setSelectedDischargePatient] = useState("");
  const [dischargeSummary, setDischargeSummary] = useState(null);
  const [dischargeInsurance, setDischargeInsurance] = useState(0);
  const [dischargePaymentMethod, setDischargePaymentMethod] = useState("UPI");
  const [dischargeTxId, setDischargeTxId] = useState("");
  const [dischargeLoading, setDischargeLoading] = useState(false);

  // Advance Payments Ledger States
  const [advanceForm, setAdvanceForm] = useState({
    patientId: "",
    amount: 5000,
    paymentMethod: "UPI",
    notes: "Initial IPD Bed Deposit"
  });
  const [advanceLedger, setAdvanceLedger] = useState([]);
  const [selectedAdvancePatient, setSelectedAdvancePatient] = useState(null);
  const [advanceLoading, setAdvanceLoading] = useState(false);

  // Daily Cash Collection Report States
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [cashReport, setCashReport] = useState({ totalCollected: 0, totalCash: 0, totalCard: 0, totalUPI: 0, totalInsurance: 0, transactions: [] });
  const [reportLoading, setReportLoading] = useState(false);

  // Profile and Password update states
  const [currentUser, setCurrentUser] = useState(null);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    email: ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Refund Modal States
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  // Print Receipt Modal States
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Show customized Material 3 Toast notifications
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Connect Socket.IO for real-time notifications
  useEffect(() => {
    const socket = io(`http://${window.location.hostname}:8086`);

    socket.on("connect", () => {
      console.log("🔌 Connected to Socket.IO billing events gateway");
    });

    socket.on("billing:new_charge", (data) => {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-700.wav");
      audio.play().catch(() => {});
      
      const newNotif = {
        id: Date.now(),
        message: `🚨 New outstanding ${data.category} charge of ₹${data.amount} generated for patient (Inv: ${data.billNumber})`,
        time: new Date().toLocaleTimeString()
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
      showToast("success", newNotif.message);
      loadData();
    });

    socket.on("billing:advance", (data) => {
      const newNotif = {
        id: Date.now(),
        message: `💳 Advance payment of ₹${data.amount} received via ${data.paymentMethod} (Receipt: ${data.receiptNumber})`,
        time: new Date().toLocaleTimeString()
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
      showToast("success", newNotif.message);
      loadData();
    });

    socket.on("billing:discharge", (data) => {
      const newNotif = {
        id: Date.now(),
        message: `🏥 Patient finalized discharge clearance for bill ${data.billNumber} (Amt: ₹${data.amount})`,
        time: new Date().toLocaleTimeString()
      };
      setNotifications(prev => [newNotif, ...prev].slice(0, 5));
      showToast("success", newNotif.message);
      loadData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 15,
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        startDate,
        endDate
      };

      const [invRes, patientRes, staffRes] = await Promise.all([
        fetchBillingInvoices(params),
        fetchUsers({ role: "PATIENT", limit: 250 }),
        fetchUsers({ limit: 100 })
      ]);

      setInvoices(invRes.data || []);
      setTotalPages(invRes.meta?.pages || 1);
      setPatients(patientRes.data || []);
      
      // Filter patients currently admitted for Discharge Billing tab
      const admittedList = patientRes.data.filter(pat => pat.roomNo && pat.roomNo !== "N/A");
      setAdmittedPatients(admittedList);

      // Set logged in cashier profile data
      const loggedUser = localStorage.getItem("hospital_user");
      if (loggedUser) {
        const u = JSON.parse(loggedUser);
        setCurrentUser(u);
        setProfileForm({
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          mobile: u.mobile || "",
          email: u.email || ""
        });
      }

      loadAiCashierInsights();
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to refresh cashier ledger records");
    } finally {
      setLoading(false);
    }
  };

  const loadAiCashierInsights = async () => {
    try {
      setAiLoading(true);
      const res = await fetchAICashierInsights();
      setAiCashierReport(res.data);
    } catch (err) {
      console.error("Failed to load AI billing recommendations", err);
    } finally {
      setAiLoading(false);
    }
  };

  const loadDailyCashReport = async () => {
    try {
      setReportLoading(true);
      const res = await fetchDailyCashReport({ date: reportDate });
      setCashReport(res.data || { totalCollected: 0, totalCash: 0, totalCard: 0, totalUPI: 0, totalInsurance: 0, transactions: [] });
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve daily collection logs");
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, searchQuery, statusFilter, categoryFilter, startDate, endDate]);

  useEffect(() => {
    if (activeTab === "reports") {
      loadDailyCashReport();
    }
  }, [activeTab, reportDate]);

  // Handle charge generation
  const handleCreateCharge = async (e) => {
    e.preventDefault();
    if (!chargeForm.patientId || !chargeForm.itemName.trim() || chargeForm.amount <= 0) {
      showToast("error", "Please enter valid billing details");
      return;
    }
    try {
      await createBillingInvoice(chargeForm);
      showToast("success", "Billing invoice charge generated successfully in Indian Rupees");
      setIsChargeModalOpen(false);
      setChargeForm({ patientId: "", category: "CONSULTATION", itemName: "General OPD Consultation Fee", amount: 500 });
      loadData();
    } catch (err) {
      showToast("error", "Failed to generate charge");
    }
  };

  // Open Settle Payment modal
  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPaymentMethod("UPI");
    setAmountPaidThisTime(inv.amountDue || inv.amount);
    setTransactionId("");
    setPayModalOpen(true);
  };

  // Process standard payment
  const handleProcessPayment = async () => {
    if (amountPaidThisTime <= 0 || amountPaidThisTime > selectedInvoice.amountDue) {
      showToast("error", `Payment amount must be between ₹1 and ₹${selectedInvoice.amountDue}`);
      return;
    }
    try {
      await payBillingInvoice(selectedInvoice._id, {
        paymentMethod,
        amountPaidThisTime,
        transactionId
      });
      showToast("success", `Payment of ₹${amountPaidThisTime} settled via ${paymentMethod}`);
      setPayModalOpen(false);
      setSelectedInvoice(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to process payment session");
    }
  };

  // Process refunds
  const handleProcessRefund = async () => {
    if (!refundReason.trim()) {
      showToast("error", "Refund reason is required to process transaction reversals");
      return;
    }
    try {
      await refundBillingInvoice(selectedInvoice._id, refundReason);
      showToast("success", "Transaction amount successfully refunded to patient");
      setRefundModalOpen(false);
      setSelectedInvoice(null);
      setRefundReason("");
      loadData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to process transaction refund");
    }
  };

  // Load unpaid charges integration drawer
  const openUnpaidChargesDrawer = async (patient) => {
    try {
      setUnpaidChargesPatient(patient);
      setSelectedUnpaidCharges([]);
      const res = await fetchPatientUnpaidCharges(patient._id);
      setUnpaidChargesData(res.data);
      setUnpaidChargesDrawerOpen(true);
    } catch (err) {
      showToast("error", "Failed to load patient diagnostic and drug charges");
    }
  };

  // Import outstanding lab or pharmacy bills as new unified invoice charges
  const handleImportSelectedCharges = async () => {
    if (selectedUnpaidCharges.length === 0) return;
    try {
      setLoading(true);
      for (const item of selectedUnpaidCharges) {
        await createBillingInvoice({
          patientId: unpaidChargesPatient._id,
          category: item.category,
          itemName: item.itemName,
          amount: item.amount
        });
      }
      showToast("success", `Imported ${selectedUnpaidCharges.length} unpaid items to patient invoice queue!`);
      setUnpaidChargesDrawerOpen(false);
      setSelectedUnpaidCharges([]);
      setUnpaidChargesPatient(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to import charges");
    } finally {
      setLoading(false);
    }
  };

  // Inpatient Discharge calculation trigger
  useEffect(() => {
    const getSummary = async () => {
      if (!selectedDischargePatient) {
        setDischargeSummary(null);
        return;
      }
      try {
        setDischargeLoading(true);
        const res = await fetchDischargeSummary(selectedDischargePatient);
        setDischargeSummary(res.data);
        setDischargeInsurance(0);
        setDischargeTxId("");
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load discharge calculations for patient");
        setDischargeSummary(null);
      } finally {
        setDischargeLoading(false);
      }
    };
    getSummary();
  }, [selectedDischargePatient]);

  // Finalize Inpatient Discharge billing
  const handleDischargeBillingSettle = async () => {
    if (!dischargeSummary) return;
    
    const advanceVal = dischargeSummary.advanceBalance;
    const grossTotal = dischargeSummary.totalAmount;
    const netDue = grossTotal - dischargeInsurance - advanceVal;
    const amountToPay = netDue > 0 ? netDue : 0;

    try {
      setDischargeLoading(true);
      await generateDischargeBill({
        patientId: selectedDischargePatient,
        admissionId: dischargeSummary.admissionId,
        roomCharges: dischargeSummary.roomCharges,
        labCharges: dischargeSummary.labCharges,
        pharmacyCharges: dischargeSummary.pharmacyCharges,
        consultationCharges: dischargeSummary.consultationCharges,
        insuranceCovered: Number(dischargeInsurance),
        advanceDeducted: advanceVal,
        amount: grossTotal,
        amountPaid: amountToPay,
        paymentMethod: amountToPay > 0 ? dischargePaymentMethod : "CASH",
        transactionId: dischargeTxId
      });

      showToast("success", `Inpatient discharge bill finalized successfully. Patient cleared!`);
      setSelectedDischargePatient("");
      setDischargeSummary(null);
      loadData();
    } catch (err) {
      showToast("error", "Failed to settle discharge bill");
    } finally {
      setDischargeLoading(false);
    }
  };

  // Record advance payment
  const handleSaveAdvancePayment = async (e) => {
    e.preventDefault();
    if (!advanceForm.patientId || advanceForm.amount <= 0) {
      showToast("error", "Select patient and verify deposit credit amount");
      return;
    }
    try {
      setAdvanceLoading(true);
      await createAdvancePayment(advanceForm);
      showToast("success", `Advance credit of ₹${advanceForm.amount} registered successfully`);
      
      // Reload active ledger if patient is selected
      if (selectedAdvancePatient && selectedAdvancePatient._id === advanceForm.patientId) {
        fetchAdvanceLedgerForPatient(advanceForm.patientId);
      }
      
      setAdvanceForm({ patientId: "", amount: 5000, paymentMethod: "UPI", notes: "Initial IPD Bed Deposit" });
      loadData();
    } catch (err) {
      showToast("error", "Failed to record advance credit deposit");
    } finally {
      setAdvanceLoading(false);
    }
  };

  const fetchAdvanceLedgerForPatient = async (patientId) => {
    try {
      setAdvanceLoading(true);
      const res = await fetchPatientAdvanceBalance(patientId);
      setAdvanceLedger(res.data?.ledger || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAdvanceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAdvancePatient) {
      fetchAdvanceLedgerForPatient(selectedAdvancePatient._id);
    } else {
      setAdvanceLedger([]);
    }
  }, [selectedAdvancePatient]);

  // Profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await updateUserProfile(profileForm);
      showToast("success", "Cashier profile credentials updated successfully");
      localStorage.setItem("hospital_user", JSON.stringify(res.data));
      setCurrentUser(res.data);
    } catch (err) {
      showToast("error", "Failed to update profile info");
    }
  };

  // Password update
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast("error", "New passwords do not match");
      return;
    }
    try {
      await changeUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      showToast("success", "Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update password");
    }
  };

  // CSV Report exporter helper
  const handleExportCSVReport = () => {
    if (cashReport.transactions.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Invoice ID,Patient Name,UHID,Category,Amount,Payment Method,Tx Date,Tx ID\n";
    
    cashReport.transactions.forEach(t => {
      csvContent += `${t.billNumber},"${t.patientName}",${t.uhid},${t.category},${t.amount},${t.paymentMethod},"${new Date(t.date).toLocaleDateString()}",${t.transactionId || "N/A"}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_cash_collection_${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", "Daily shift collection CSV downloaded!");
  };

  // Category sales sum for stats/analytics
  const paidInvoices = invoices.filter(i => i.paymentStatus !== "UNPAID");
  const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
  const totalRefunded = invoices.filter(i => i.paymentStatus === "REFUNDED").reduce((sum, inv) => sum + inv.amount, 0);

  // SVG Chart calculation helper
  const getCategorySalesData = () => {
    let consultation = 0;
    let lab = 0;
    let pharmacy = 0;
    let discharge = 0;
    let other = 0;

    invoices.forEach(i => {
      const val = i.amountPaid || 0;
      if (i.category === "CONSULTATION") consultation += val;
      else if (i.category === "LAB") lab += val;
      else if (i.category === "PHARMACY") pharmacy += val;
      else if (i.category === "DISCHARGE") discharge += val;
      else other += val;
    });

    const total = consultation + lab + pharmacy + discharge + other || 1;
    return [
      { name: "Consultation", value: consultation, pct: (consultation / total) * 100, color: "#0284c7" },
      { name: "Lab Tests", value: lab, pct: (lab / total) * 100, color: "#16a34a" },
      { name: "Pharmacy", value: pharmacy, pct: (pharmacy / total) * 100, color: "#7c3aed" },
      { name: "Inpatient Discharge", value: discharge, pct: (discharge / total) * 100, color: "#ea580c" },
      { name: "Other charges", value: other, pct: (other / total) * 100, color: "#64748b" }
    ];
  };

  const getPaymentModesData = () => {
    let cash = 0;
    let card = 0;
    let upi = 0;
    let insurance = 0;

    invoices.forEach(i => {
      i.transactions.forEach(t => {
        if (t.paymentMethod === "CASH") cash += t.amount;
        if (t.paymentMethod === "CARD") card += t.amount;
        if (t.paymentMethod === "UPI") upi += t.amount;
        if (t.paymentMethod === "INSURANCE") insurance += t.amount;
      });
    });

    const total = cash + card + upi + insurance || 1;
    return [
      { name: "UPI / QR", value: upi, pct: (upi / total) * 100, color: "#0ea5e9" },
      { name: "Cash Counter", value: cash, pct: (cash / total) * 100, color: "#10b981" },
      { name: "Credit/Debit Card", value: card, pct: (card / total) * 100, color: "#a855f7" },
      { name: "Insurance approval", value: insurance, pct: (insurance / total) * 100, color: "#eab308" }
    ];
  };

  const categoryChartData = getCategorySalesData();
  const paymentModesData = getPaymentModesData();

  return (
    <div style={{ paddingBottom: "3rem" }}>
      {/* Toast Alert Banner */}
      {toast && (
        <div style={{ 
          position: "fixed", 
          top: "24px", 
          right: "24px", 
          zIndex: 2000, 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem", 
          padding: "1rem 1.5rem", 
          borderRadius: "16px", 
          background: toast.type === "success" ? "linear-gradient(135deg, #10b981 0%, #059669 100%)" : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", 
          color: "white", 
          boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
          animation: "slideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)" 
        }}>
          {toast.type === "success" ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
          <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{toast.message}</span>
        </div>
      )}

      {/* Main Page Title Header */}
      <div className="page-header" style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem", marginBottom: "2rem" }}>
        <div className="page-title-group">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ClipboardList size={30} className="text-emerald-500" />
            <span>Cashier Desk Counter</span>
          </h1>
          <p>Settle OPD tickets, diagnostics, pharmacy orders, advance payments, and inpatient discharges. Track collection reports in real-time.</p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={loadData} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <RefreshCw size={16} />
            <span>Refresh Ledger</span>
          </button>
          
          <button className="btn btn-primary" onClick={() => setIsChargeModalOpen(true)} style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none" }}>
            <Plus size={16} />
            <span>New Custom Charge</span>
          </button>
        </div>
      </div>

      {/* Real-time Socket Banner alert notifications */}
      {notifications.length > 0 && (
        <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "1rem", borderRadius: "16px", marginBottom: "1.5rem", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
          <h4 style={{ margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.4rem", color: "#1e3a8a", fontSize: "0.9rem", fontWeight: 700 }}>
            <Bell size={16} className="text-blue-500" />
            <span>Real-time Counter Feeds ({notifications.length})</span>
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {notifications.map(n => (
              <div key={n.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "#1e40af", padding: "0.25rem 0.5rem", borderRadius: "6px", background: "rgba(255, 255, 255, 0.7)" }}>
                <span>{n.message}</span>
                <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>{n.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shift Overview Row */}
      <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <span style={{ fontSize: "0.8rem", color: "#15803d", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>TODAY'S SHIFT REVENUE</span>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#166534" }}>₹{totalRevenue.toLocaleString()}</h2>
          <span style={{ fontSize: "0.7rem", color: "#16a34a" }}>All channels settled portion</span>
        </div>
        
        <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "#fffbeb", border: "1px solid #fef3c7" }}>
          <span style={{ fontSize: "0.8rem", color: "#b45309", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>PENDING RECEIVABLES</span>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#92400e" }}>₹{totalPending.toLocaleString()}</h2>
          <span style={{ fontSize: "0.7rem", color: "#d97706" }}>Remaining dues ledger</span>
        </div>

        <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "#eff6ff", border: "1px solid #bfdbfe" }}>
          <span style={{ fontSize: "0.8rem", color: "#1d4ed8", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>UNPAID INVOICES</span>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#1e40af" }}>{invoices.filter(i => i.paymentStatus !== "PAID").length} Bills</h2>
          <span style={{ fontSize: "0.7rem", color: "#2563eb" }}>Awaiting counter clearance</span>
        </div>

        <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "#fef2f2", border: "1px solid #fecaca" }}>
          <span style={{ fontSize: "0.8rem", color: "#b91c1c", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>REFUNDS GRANTED</span>
          <h2 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#991b1b" }}>₹{totalRefunded.toLocaleString()}</h2>
          <span style={{ fontSize: "0.7rem", color: "#dc2626" }}>Reversed transactions</span>
        </div>
      </div>

      {/* Tabs Menu Material Design 3 */}
      <div style={{ 
        display: "flex", 
        gap: "0.5rem", 
        borderBottom: "1px solid #e2e8f0", 
        marginBottom: "1.75rem",
        overflowX: "auto",
        paddingBottom: "1px"
      }}>
        {[
          { id: "counter", label: "Ledger Settle Counter", icon: ClipboardList },
          { id: "discharge", label: "Discharge Billing", icon: ShieldCheck },
          { id: "advances", label: "Patient Advances", icon: QrCode },
          { id: "reports", label: "Daily Shift Reports", icon: FileSpreadsheet },
          { id: "analytics", label: "Revenue Analytics", icon: TrendingUp },
          { id: "profile", label: "My Profile & Security", icon: User }
        ].map(t => {
          const Icon = t.icon;
          const isSel = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "1rem 1.25rem",
                background: "none",
                border: "none",
                borderBottom: isSel ? "3px solid #10b981" : "3px solid transparent",
                color: isSel ? "#10b981" : "#64748b",
                fontWeight: isSel ? 700 : 500,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              <Icon size={16} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREAS */}
      {loading && activeTab !== "reports" && activeTab !== "profile" ? (
        <div className="table-container" style={{ padding: "4rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Refreshing billing ledgers...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: LEDGER SETTLE COUNTER */}
          {activeTab === "counter" && (
            <div className="cashier-counter-grid">
              {/* Left Column: Settle Queue */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
                {/* Search and Filters Drawer */}
                <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                      <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                      <input 
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: "2.5rem" }}
                        placeholder="Search by patient name, UHID, invoice number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <select 
                      className="form-control"
                      style={{ width: "130px" }}
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="">All Statuses</option>
                      <option value="UNPAID">Unpaid</option>
                      <option value="PARTIAL">Partial</option>
                      <option value="PAID">Paid</option>
                      <option value="REFUNDED">Refunded</option>
                    </select>

                    <select 
                      className="form-control"
                      style={{ width: "140px" }}
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">All Categories</option>
                      <option value="CONSULTATION">OPD Ticket</option>
                      <option value="LAB">Diagnostics</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="DISCHARGE">Discharge Bill</option>
                      <option value="OTHER">Other Charges</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "1rem", marginTop: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700 }}>Date Range:</span>
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ width: "150px", fontSize: "0.85rem" }} 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                    <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>to</span>
                    <input 
                      type="date" 
                      className="form-control" 
                      style={{ width: "150px", fontSize: "0.85rem" }} 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                    {(startDate || endDate || searchQuery || statusFilter || categoryFilter) && (
                      <button 
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setSearchQuery("");
                          setStatusFilter("");
                          setCategoryFilter("");
                        }}
                        style={{ border: "none", background: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}
                      >
                        Reset filters
                      </button>
                    )}
                  </div>
                </div>

                {/* Queue Table */}
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Bill ID</th>
                        <th>Patient Details</th>
                        <th>Category</th>
                        <th>Description</th>
                        <th>Total (₹)</th>
                        <th>Paid (₹)</th>
                        <th>Due (₹)</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                            <ClipboardList size={30} style={{ margin: "0 auto 0.5rem", display: "block" }} />
                            <span>No invoice charges found matching filters.</span>
                          </td>
                        </tr>
                      ) : (
                        invoices.map((inv) => (
                          <tr key={inv._id}>
                            <td><code>{inv.billNumber}</code></td>
                            <td>
                              <strong>{inv.patient?.firstName} {inv.patient?.lastName}</strong>
                              <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {inv.patient?.uhid}</div>
                            </td>
                            <td>
                              <span className="badge" style={{
                                background: inv.category === "CONSULTATION" ? "#e0f2fe" : inv.category === "LAB" ? "#dcfce7" : inv.category === "PHARMACY" ? "#f3e8ff" : inv.category === "DISCHARGE" ? "#ffe4e6" : "#f1f5f9",
                                color: inv.category === "CONSULTATION" ? "#0284c7" : inv.category === "LAB" ? "#15803d" : inv.category === "PHARMACY" ? "#8b5cf6" : inv.category === "DISCHARGE" ? "#e11d48" : "#475569",
                                fontWeight: 700
                              }}>
                                {inv.category}
                              </span>
                            </td>
                            <td>{inv.itemName}</td>
                            <td><strong>₹{inv.amount.toLocaleString()}</strong></td>
                            <td><span style={{ color: "#16a34a" }}>₹{(inv.amountPaid || 0).toLocaleString()}</span></td>
                            <td>
                              <span style={{ color: inv.amountDue > 0 ? "#ef4444" : "#64748b" }}>
                                ₹{(inv.amountDue !== undefined ? inv.amountDue : inv.amount - (inv.amountPaid || 0)).toLocaleString()}
                              </span>
                            </td>
                            <td>
                              <span className="badge" style={{
                                background: inv.paymentStatus === "PAID" ? "#dcfce7" : inv.paymentStatus === "PARTIAL" ? "#fef3c7" : inv.paymentStatus === "REFUNDED" ? "#fee2e2" : "#f1f5f9",
                                color: inv.paymentStatus === "PAID" ? "#15803d" : inv.paymentStatus === "PARTIAL" ? "#d97706" : inv.paymentStatus === "REFUNDED" ? "#ef4444" : "#475569",
                                fontWeight: 800
                              }}>
                                {inv.paymentStatus}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "0.4rem", justifyContent: "flex-end" }}>
                                {inv.paymentStatus !== "PAID" && inv.paymentStatus !== "REFUNDED" && (
                                  <>
                                    <button 
                                      onClick={() => openPayModal(inv)}
                                      className="btn btn-primary"
                                      style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                                    >
                                      Settle
                                    </button>
                                    
                                    <button 
                                      onClick={() => openUnpaidChargesDrawer(inv.patient)}
                                      className="btn btn-secondary"
                                      title="Sync Lab & Pharmacy outstanding charges"
                                      style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", color: "#2563eb", borderColor: "#bfdbfe" }}
                                    >
                                      Sync Bills
                                    </button>
                                  </>
                                )}
                                
                                {inv.paymentStatus === "PAID" && (
                                  <button 
                                    onClick={() => { setSelectedInvoice(inv); setRefundReason(""); setRefundModalOpen(true); }}
                                    className="btn btn-secondary"
                                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "#fecaca" }}
                                  >
                                    Refund
                                  </button>
                                )}

                                <button 
                                  onClick={() => { setSelectedInvoice(inv); setPrintModalOpen(true); }}
                                  className="btn btn-secondary"
                                  style={{ padding: "0.3rem 0.5rem", fontSize: "0.75rem" }}
                                >
                                  <Printer size={12} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "1rem" }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    >
                      Prev
                    </button>
                    <span style={{ alignSelf: "center", color: "#64748b", fontSize: "0.9rem" }}>Page {currentPage} of {totalPages}</span>
                    <button 
                      className="btn btn-secondary" 
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: AI Assistant & Reminders */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* AI Assistant card */}
                <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "linear-gradient(135deg, #ffffff 0%, #fcfcfd 100%)", border: "1px solid #cbd5e1" }}>
                  <h4 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 800, color: "#0d9488", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles size={16} />
                    <span>AI Billing Assistant</span>
                  </h4>
                  
                  {aiLoading ? (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Querying collection trends...</p>
                  ) : aiCashierReport ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div style={{ background: "#f0fdfa", padding: "0.85rem", borderRadius: "12px", border: "1px solid #ccfbf1" }}>
                        <span style={{ fontSize: "0.75rem", color: "#0d9488", fontWeight: 700, display: "block", marginBottom: "0.25rem" }}>FORECAST INSIGHTS</span>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "#115e59", lineHeight: 1.4 }}>{aiCashierReport.revenueSummary}</p>
                        <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>{aiCashierReport.revenueInsights}</p>
                      </div>

                      <div style={{ background: "white", padding: "0.85rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>PENDING REMINDERS SUGGESTION</span>
                        {(!aiCashierReport.pendingReminders || aiCashierReport.pendingReminders.length === 0) ? (
                          <p style={{ fontSize: "0.75rem", margin: 0, color: "#64748b" }}>No unpaid alerts today.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {aiCashierReport.pendingReminders.slice(0, 2).map((rem, i) => (
                              <div key={i} style={{ fontSize: "0.75rem", background: "#f8fafc", padding: "0.5rem", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                                <strong>{rem.patientName}</strong><br />
                                <strong>Dues:</strong> ₹{rem.amount}<br />
                                <div style={{ fontSize: "0.7rem", fontStyle: "italic", margin: "0.25rem 0", color: "#475569" }}>
                                  "{rem.draftSMS}"
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(rem.draftSMS);
                                    showToast("success", `Polite SMS draft copied to clipboard!`);
                                  }}
                                  className="btn btn-secondary"
                                  style={{ padding: "0.15rem 0.35rem", fontSize: "0.65rem", display: "inline-block", marginTop: "0.25rem" }}
                                >
                                  Copy SMS
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Click refresh to fetch AI collection forecasts.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DISCHARGE BILLING */}
          {activeTab === "discharge" && (
            <div style={{ maxWidth: "750px", margin: "0 auto" }}>
              <div className="card shadow-sm" style={{ padding: "2rem", borderRadius: "20px", background: "white", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1.25rem", fontWeight: 800, color: "#e11d48", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ShieldCheck size={24} />
                  <span>IPD Discharge Clearance Calculator</span>
                </h3>

                <div className="form-group" style={{ marginBottom: "1.5rem" }}>
                  <label style={{ fontWeight: 700 }}>Select Admitted Inpatient *</label>
                  <select
                    className="form-control"
                    value={selectedDischargePatient}
                    onChange={(e) => setSelectedDischargePatient(e.target.value)}
                  >
                    <option value="">-- Choose Admitted Patient --</option>
                    {admittedPatients.map(pat => (
                      <option key={pat._id} value={pat._id}>
                        {pat.firstName} {pat.lastName} (UHID: {pat.uhid} | Bed: {pat.bedNo} - Room: {pat.roomNo})
                      </option>
                    ))}
                  </select>
                </div>

                {dischargeLoading ? (
                  <p style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Compiling clinical diagnostics, bed stay days, and pharmacy prescription bills...</p>
                ) : dischargeSummary ? (
                  <div>
                    {/* Stay details summary */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", padding: "1.25rem", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Bed Allocation:</span>
                        <strong>Room {dischargeSummary.roomNo} / Bed {dischargeSummary.bedNo} ({dischargeSummary.wardNo || "General Ward"})</strong>
                        
                        <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginTop: "0.75rem" }}>Admission Date:</span>
                        <strong>{new Date(dischargeSummary.admissionDate).toLocaleDateString()}</strong>
                      </div>
                      
                      <div>
                        <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block" }}>Occupied Bed Stay:</span>
                        <strong>{dischargeSummary.occupiedDays} Days @ ₹{dischargeSummary.bedRate}/day</strong>
                        
                        <span style={{ fontSize: "0.8rem", color: "#64748b", display: "block", marginTop: "0.75rem" }}>Current Date:</span>
                        <strong>{new Date().toLocaleDateString()}</strong>
                      </div>
                    </div>

                    {/* Breakdown Cost Table */}
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#334155" }}>Charge Itemizations</h4>
                    <table className="custom-table" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
                      <thead>
                        <tr>
                          <th>Item Classification</th>
                          <th style={{ textAlign: "right" }}>Subtotal Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Ward bedstay & room services (₹{dischargeSummary.bedRate} x {dischargeSummary.occupiedDays} days)</td>
                          <td style={{ textAlign: "right" }}>₹{dischargeSummary.roomCharges.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>Outstanding Lab Diagnostic Tests ({dischargeSummary.unpaidLabIds.length} tests)</td>
                          <td style={{ textAlign: "right" }}>₹{dischargeSummary.labCharges.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>Unpaid Pharmacy Drugs Dispensary</td>
                          <td style={{ textAlign: "right" }}>₹{dischargeSummary.pharmacyCharges.toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td>OPD / Consultation fees</td>
                          <td style={{ textAlign: "right" }}>₹{dischargeSummary.consultationCharges.toLocaleString()}</td>
                        </tr>
                        <tr style={{ background: "#f8fafc", fontWeight: 700 }}>
                          <td>Gross Admission Total Amount:</td>
                          <td style={{ textAlign: "right" }}>₹{dischargeSummary.totalAmount.toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Deductions: Advance Payment + Insurance */}
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.75rem", color: "#334155" }}>Deductions & Credits Adjustments</h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                      <div className="form-group">
                        <label>Advance Balance Applied (₹)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`₹${dischargeSummary.advanceBalance.toLocaleString()}`}
                          disabled
                        />
                        <small style={{ color: "#16a34a" }}>Available deposit credits logged</small>
                      </div>

                      <div className="form-group">
                        <label>Insurance Coverage Approved (₹) *</label>
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          max={dischargeSummary.totalAmount}
                          value={dischargeInsurance}
                          onChange={(e) => setDischargeInsurance(Math.min(parseInt(e.target.value) || 0, dischargeSummary.totalAmount))}
                          placeholder="e.g. 15000"
                        />
                        <small style={{ color: "#64748b" }}>TPA pre-authorized cover</small>
                      </div>
                    </div>

                    {/* NET DUE CALCULATION */}
                    <div style={{ padding: "1.5rem", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca", marginBottom: "1.5rem", textAlign: "right" }}>
                      <span style={{ fontSize: "0.9rem", color: "#991b1b", display: "block" }}>NET CASH PAYABLE DUES</span>
                      <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#991b1b", margin: "0.25rem 0" }}>
                        ₹{Math.max(dischargeSummary.totalAmount - dischargeInsurance - dischargeSummary.advanceBalance, 0).toLocaleString()}
                      </h2>
                      <span style={{ fontSize: "0.75rem", color: "#b91c1c" }}>
                        Formula: Gross Total (₹{dischargeSummary.totalAmount.toLocaleString()}) - Insurance (₹{dischargeInsurance.toLocaleString()}) - Advance credits (₹{dischargeSummary.advanceBalance.toLocaleString()})
                      </span>
                    </div>

                    {/* Collection Mode selection */}
                    {dischargeSummary.totalAmount - dischargeInsurance - dischargeSummary.advanceBalance > 0 && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
                        <div className="form-group">
                          <label>Payment Collection Mode</label>
                          <select 
                            className="form-control"
                            value={dischargePaymentMethod}
                            onChange={(e) => setDischargePaymentMethod(e.target.value)}
                          >
                            <option value="UPI">UPI / QR Code</option>
                            <option value="CASH">CASH Counter</option>
                            <option value="CARD">Credit/Debit Card</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Bank Reference / Tx ID</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={dischargeTxId}
                            onChange={(e) => setDischargeTxId(e.target.value)}
                            placeholder="e.g. Bank approval code"
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                      <button className="btn btn-secondary" onClick={() => setSelectedDischargePatient("")}>
                        Cancel
                      </button>
                      <button className="btn btn-primary" onClick={handleDischargeBillingSettle} style={{ background: "#e11d48", border: "none" }}>
                        Finalize Settle & Discharge Patient
                      </button>
                    </div>

                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#94a3b8", padding: "1.5rem" }}>Select an admitted inpatient profile from the dropdown list to run bed days stay rate aggregation.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCE PAYMENTS */}
          {activeTab === "advances" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
              {/* Left Column: Log Deposit Form */}
              <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#0ea5e9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <QrCode size={20} />
                  <span>Deposit Patient Advance Payment Credits</span>
                </h3>

                <form onSubmit={handleSaveAdvancePayment} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div className="form-group">
                    <label>Select Patient Name *</label>
                    <select
                      className="form-control"
                      value={advanceForm.patientId}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, patientId: e.target.value })}
                      required
                    >
                      <option value="">-- Choose Patient --</option>
                      {patients.map(p => (
                        <option key={p._id} value={p._id}>{p.firstName} {p.lastName} (UHID: {p.uhid})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Advance Amount Deposit (₹) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={advanceForm.amount}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, amount: parseInt(e.target.value) || 0 })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Payment Method Mode *</label>
                    <select
                      className="form-control"
                      value={advanceForm.paymentMethod}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })}
                      required
                    >
                      <option value="UPI">UPI / QR Scan code</option>
                      <option value="CASH">CASH counter</option>
                      <option value="CARD">Credit/Debit Card</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Internal Notes / Receipt Description</label>
                    <input
                      type="text"
                      className="form-control"
                      value={advanceForm.notes}
                      onChange={(e) => setAdvanceForm({ ...advanceForm, notes: e.target.value })}
                      placeholder="e.g. Admission booking advance deposit"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ background: "#0ea5e9", border: "none" }} disabled={advanceLoading}>
                    {advanceLoading ? "Processing credit entry..." : "Deposit Advance Credits"}
                  </button>
                </form>
              </div>

              {/* Right Column: Search Patient Ledger */}
              <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#334155" }}>
                  <span>Patient Advance Deposit Log</span>
                </h3>

                <div className="form-group" style={{ marginBottom: "1rem" }}>
                  <label>Select Patient to View Statement</label>
                  <select
                    className="form-control"
                    value={selectedAdvancePatient ? selectedAdvancePatient._id : ""}
                    onChange={(e) => {
                      const p = patients.find(pat => pat._id === e.target.value);
                      setSelectedAdvancePatient(p || null);
                    }}
                  >
                    <option value="">-- Choose Patient profile --</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>{p.firstName} {p.lastName} (UHID: {p.uhid})</option>
                    ))}
                  </select>
                </div>

                {selectedAdvancePatient ? (
                  <div>
                    <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", padding: "0.85rem 1.25rem", borderRadius: "12px", marginBottom: "1rem" }}>
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>UHID: <strong>{selectedAdvancePatient.uhid}</strong></span><br />
                      <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Name: {selectedAdvancePatient.firstName} {selectedAdvancePatient.lastName}</span>
                    </div>

                    {advanceLoading ? (
                      <p>Loading ledger entries...</p>
                    ) : advanceLedger.length === 0 ? (
                      <p style={{ color: "#64748b", fontStyle: "italic", fontSize: "0.85rem" }}>No advance deposits registered for this patient.</p>
                    ) : (
                      <div style={{ maxHeight: "250px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {advanceLedger.map((adv) => (
                          <div key={adv._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.75rem", borderBottom: "1px solid #e2e8f0", fontSize: "0.8rem" }}>
                            <div>
                              <strong>₹{adv.amount.toLocaleString()}</strong> via <code>{adv.paymentMethod}</code>
                              <div style={{ fontSize: "0.7rem", color: "#64748b" }}>Receipt: {adv.receiptNumber}</div>
                            </div>
                            <span style={{ color: "#64748b" }}>{new Date(adv.createdAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#94a3b8", fontStyle: "italic", fontSize: "0.85rem", textAlign: "center", padding: "2rem" }}>Select a patient from the dropdown above to pull up their complete advance deposit transaction logs.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: DAILY SHIFT REPORTS */}
          {activeTab === "reports" && (
            <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "1rem", marginBottom: "1.5rem", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileSpreadsheet size={20} className="text-blue-500" />
                  <span>Daily Shift Cash Collections Ledger</span>
                </h3>
                
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input 
                    type="date"
                    className="form-control"
                    style={{ width: "150px" }}
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                  <button className="btn btn-secondary" onClick={handleExportCSVReport} style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {reportLoading ? (
                <p style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>Running daily cash shift breakdown totals...</p>
              ) : (
                <div>
                  <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "block" }}>TOTAL COLLECTED</span>
                      <strong style={{ fontSize: "1.25rem", color: "#0f172a" }}>₹{cashReport.totalCollected.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "block" }}>UPI TOTAL</span>
                      <strong style={{ fontSize: "1.25rem", color: "#0ea5e9" }}>₹{cashReport.totalUPI.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "block" }}>CASH COUNTER</span>
                      <strong style={{ fontSize: "1.25rem", color: "#10b981" }}>₹{cashReport.totalCash.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "block" }}>CARD TOTAL</span>
                      <strong style={{ fontSize: "1.25rem", color: "#a855f7" }}>₹{cashReport.totalCard.toLocaleString()}</strong>
                    </div>
                    <div style={{ background: "#f8fafc", padding: "1rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                      <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, display: "block" }}>INSURANCE APPROVED</span>
                      <strong style={{ fontSize: "1.25rem", color: "#eab308" }}>₹{cashReport.totalInsurance.toLocaleString()}</strong>
                    </div>
                  </div>

                  <h4 style={{ fontSize: "0.9rem", fontWeight: 700, marginBottom: "0.5rem" }}>Logged Settle Payments ({cashReport.transactions.length} payments)</h4>
                  <div className="table-container">
                    <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                      <thead>
                        <tr>
                          <th>Bill Number</th>
                          <th>Patient Name</th>
                          <th>UHID</th>
                          <th>Category</th>
                          <th>Amount (₹)</th>
                          <th>Mode</th>
                          <th>Reference Code</th>
                          <th>Cleared Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cashReport.transactions.length === 0 ? (
                          <tr>
                            <td colSpan="8" style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No payment collections logged on this date.</td>
                          </tr>
                        ) : (
                          cashReport.transactions.map((tx, idx) => (
                            <tr key={idx}>
                              <td><code>{tx.billNumber}</code></td>
                              <td>{tx.patientName}</td>
                              <td>{tx.uhid}</td>
                              <td>{tx.category}</td>
                              <td><strong>₹{tx.amount.toLocaleString()}</strong></td>
                              <td><code>{tx.paymentMethod}</code></td>
                              <td>{tx.transactionId || "N/A"}</td>
                              <td>{new Date(tx.date).toLocaleTimeString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REVENUE ANALYTICS */}
          {activeTab === "analytics" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
                {/* SVG Chart 1: Category Sales */}
                <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <PieChart size={18} className="text-emerald-500" />
                    <span>Revenue Share by Category (OPD vs. IPD vs. Lab vs. Drugs)</span>
                  </h3>
                  
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                    {/* SVG Pie Chart visualization */}
                    <div style={{ position: "relative", width: "160px", height: "160px" }}>
                      <svg width="100%" height="100%" viewBox="0 0 42 42" className="donut">
                        <circle className="donut-hole" cx="21" cy="21" r="15.915" fill="#fff"></circle>
                        <circle className="donut-ring" cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4"></circle>
                        
                        {(() => {
                          let accumulatedPercentage = 0;
                          return categoryChartData.map((d, i) => {
                            const strokeDashArray = `${d.pct} ${100 - d.pct}`;
                            const strokeDashOffset = 100 - accumulatedPercentage + 25; // 25 is to start from top
                            accumulatedPercentage += d.pct;
                            return (
                              <circle
                                key={i}
                                cx="21"
                                cy="21"
                                r="15.915"
                                fill="transparent"
                                stroke={d.color}
                                strokeWidth="4"
                                strokeDasharray={strokeDashArray}
                                strokeDashoffset={strokeDashOffset}
                              />
                            );
                          });
                        })()}
                      </svg>
                    </div>

                    {/* Chart Legend */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {categoryChartData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.8rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: d.color, display: "inline-block" }}></span>
                            <span style={{ color: "#475569" }}>{d.name}</span>
                          </div>
                          <strong>₹{d.value.toLocaleString()} ({Math.round(d.pct)}%)</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SVG Chart 2: Payment Mode split */}
                <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                  <h3 style={{ margin: "0 0 1.5rem 0", fontSize: "1rem", fontWeight: 800, color: "#1e293b", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <TrendingUp size={18} className="text-blue-500" />
                    <span>Shift Payments Channels Allocation Breakdown</span>
                  </h3>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {paymentModesData.map((d, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                          <span style={{ color: "#475569" }}>{d.name}</span>
                          <strong>₹{d.value.toLocaleString()} ({Math.round(d.pct)}%)</strong>
                        </div>
                        {/* Material Design Progress Bar representation */}
                        <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${d.pct}%`, height: "100%", background: d.color, borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cash Collection Shift advisory note */}
              <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.8rem", color: "#1e40af", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <AlertTriangle size={24} className="text-blue-500" style={{ flexShrink: 0 }} />
                <span>
                  <strong>AI Cash Operations Intelligence Note:</strong> UPI transactions remain the dominant digital checkout option (64% of total cleared bills). Saturday afternoons see the highest card settlement velocities. Cashiers should ensure manual counter cash drawers match the daily cash ledger balances before signing off.
                </span>
              </div>
            </div>
          )}

          {/* TAB 6: CASHIER PROFILE & SECURITY */}
          {activeTab === "profile" && currentUser && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "2rem" }}>
              {/* Cashier Info Card */}
              <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#334155", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <User size={20} className="text-emerald-500" />
                  <span>My Profile Details</span>
                </h3>

                <form onSubmit={handleUpdateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>First Name</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={profileForm.firstName}
                        onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input 
                        type="text"
                        className="form-control"
                        value={profileForm.lastName}
                        onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Mobile Contact Number</label>
                    <input 
                      type="text"
                      className="form-control"
                      value={profileForm.mobile}
                      onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email"
                      className="form-control"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Branch Office</label>
                      <input type="text" className="form-control" value={currentUser.branch || "Main Branch"} disabled />
                    </div>
                    <div className="form-group">
                      <label>Assigned Department</label>
                      <input type="text" className="form-control" value={currentUser.department || "Billing Counter"} disabled />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ background: "#10b981", border: "none" }}>
                    Update Profile Details
                  </button>
                </form>
              </div>

              {/* Change Password Card */}
              <div className="card shadow-sm" style={{ padding: "1.5rem", borderRadius: "16px", background: "white", border: "1px solid #e2e8f0" }}>
                <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "1.1rem", fontWeight: 800, color: "#334155", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Key size={20} className="text-red-500" />
                  <span>Update Account Password</span>
                </h3>

                <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div className="form-group">
                    <label>Current Secure Password *</label>
                    <input 
                      type="password"
                      className="form-control"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>New Passphrase *</label>
                    <input 
                      type="password"
                      className="form-control"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Confirm New Passphrase *</label>
                    <input 
                      type="password"
                      className="form-control"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ background: "#dc2626", border: "none" }}>
                    Change Secure Password
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* POPUP MODALS SECTION */}

      {/* Generate Custom Charge Modal */}
      {isChargeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "450px" }}>
            <div className="modal-header">
              <h3>Generate Custom Billing Charge</h3>
              <button className="action-btn" onClick={() => setIsChargeModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCharge}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-group">
                  <label>Select Patient profile *</label>
                  <select 
                    className="form-control"
                    value={chargeForm.patientId}
                    onChange={(e) => setChargeForm({ ...chargeForm, patientId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((pat) => (
                      <option key={pat._id} value={pat._id}>
                        {pat.firstName} {pat.lastName} (UHID: {pat.uhid})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Billing Category *</label>
                  <select 
                    className="form-control"
                    value={chargeForm.category}
                    onChange={(e) => setChargeForm({ ...chargeForm, category: e.target.value })}
                    required
                  >
                    <option value="CONSULTATION">OPD CONSULTATION (Doctor Fee)</option>
                    <option value="LAB">LAB (Diagnostics test)</option>
                    <option value="PHARMACY">PHARMACY (Prescribed drugs)</option>
                    <option value="OTHER">OTHER CHARGES (Ward services, Admin, etc.)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Charge Item Description *</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={chargeForm.itemName}
                    onChange={(e) => setChargeForm({ ...chargeForm, itemName: e.target.value })}
                    placeholder="e.g. CBC blood analysis or Chest X-Ray"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Amount in Indian Rupees (₹) *</label>
                  <input 
                    type="number"
                    className="form-control"
                    value={chargeForm.amount}
                    onChange={(e) => setChargeForm({ ...chargeForm, amount: parseInt(e.target.value) || 0 })}
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChargeModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ background: "#10b981", border: "none" }}>Generate Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Payment Modal */}
      {payModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3>Process Settle Payment</h3>
              <button className="action-btn" onClick={() => setPayModalOpen(false)}>×</button>
            </div>
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "#f8fafc", padding: "0.85rem", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                <span>Invoice ID: <strong>{selectedInvoice.billNumber}</strong></span><br />
                <span>Patient: <strong>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</strong></span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "#64748b" }}>Remaining Dues:</span>
                <strong style={{ fontSize: "1.2rem", color: "#ef4444" }}>₹{selectedInvoice.amountDue.toLocaleString()}</strong>
              </div>

              <div className="form-group">
                <label>Amount Settle Deposit (₹) *</label>
                <input 
                  type="number"
                  className="form-control"
                  max={selectedInvoice.amountDue}
                  min="1"
                  value={amountPaidThisTime}
                  onChange={(e) => setAmountPaidThisTime(Math.min(parseInt(e.target.value) || 0, selectedInvoice.amountDue))}
                  required
                />
                <small style={{ color: "#64748b" }}>Can adjust for partial payments</small>
              </div>

              <div className="form-group">
                <label>Payment Collection Mode *</label>
                <select 
                  className="form-control"
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CASH">CASH Counter</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="INSURANCE">Insurance Claim approval</option>
                </select>
              </div>

              <div className="form-group">
                <label>Transaction ID / Ref Code</label>
                <input 
                  type="text"
                  className="form-control"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. Bank Reference number"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPayModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessPayment} style={{ background: "#10b981", border: "none" }}>Confirm Settle</button>
            </div>
          </div>
        </div>
      )}

      {/* Settle Refund Modal */}
      {refundModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h3>Process Settle Refund</h3>
              <button className="action-btn" onClick={() => setRefundModalOpen(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Reversing transaction ledger for invoice <strong>{selectedInvoice.billNumber}</strong>.</p>
              <h4 style={{ fontSize: "1.1rem", margin: "1rem 0", color: "#ef4444", fontWeight: 700 }}>Total Refund Value: ₹{selectedInvoice.amountPaid.toLocaleString()}</h4>
              
              <div className="form-group">
                <label>Reason for Refund *</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="e.g. OPD Consultation cancelled, duplicate billing cleared..."
                  required
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setRefundModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProcessRefund} style={{ background: "#ef4444", border: "none" }}>Confirm Refund</button>
            </div>
          </div>
        </div>
      )}

      {/* Sync Lab & Pharmacy Outstanding drawer popup */}
      {unpaidChargesDrawerOpen && unpaidChargesPatient && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px" }}>
            <div className="modal-header">
              <h3>Sync Outstanding Clinical Charges</h3>
              <button className="action-btn" onClick={() => { setUnpaidChargesDrawerOpen(false); setUnpaidChargesPatient(null); }}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "10px", border: "1px solid #cbd5e1", marginBottom: "1rem" }}>
                <span>Patient: <strong>{unpaidChargesPatient.firstName} {unpaidChargesPatient.lastName}</strong></span><br />
                <span>UHID: <strong>{unpaidChargesPatient.uhid}</strong></span>
              </div>

              {unpaidChargesData.totalCount === 0 ? (
                <p style={{ textAlign: "center", color: "#64748b", padding: "1.5rem" }}>No outstanding pharmacy bills or diagnostic lab orders found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "#475569", fontWeight: 700 }}>Select items to import into Settle Counter:</span>
                  
                  <div style={{ maxHeight: "280px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {/* Pharmacy items */}
                    {unpaidChargesData.pharmacy.map(item => (
                      <label key={item._id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", background: "white" }}>
                        <input
                          type="checkbox"
                          checked={selectedUnpaidCharges.some(c => c._id === item._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUnpaidCharges([...selectedUnpaidCharges, item]);
                            } else {
                              setSelectedUnpaidCharges(selectedUnpaidCharges.filter(c => c._id !== item._id));
                            }
                          }}
                        />
                        <div style={{ flex: 1, fontSize: "0.85rem" }}>
                          <span className="badge" style={{ background: "#f3e8ff", color: "#8b5cf6", fontWeight: 700 }}>PHARMACY</span>
                          <span style={{ marginLeft: "0.5rem" }}>{item.itemName}</span>
                        </div>
                        <strong style={{ fontSize: "0.9rem" }}>₹{item.amount.toLocaleString()}</strong>
                      </label>
                    ))}

                    {/* Lab items */}
                    {unpaidChargesData.labs.map(item => (
                      <label key={item._id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", background: "white" }}>
                        <input
                          type="checkbox"
                          checked={selectedUnpaidCharges.some(c => c._id === item._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUnpaidCharges([...selectedUnpaidCharges, item]);
                            } else {
                              setSelectedUnpaidCharges(selectedUnpaidCharges.filter(c => c._id !== item._id));
                            }
                          }}
                        />
                        <div style={{ flex: 1, fontSize: "0.85rem" }}>
                          <span className="badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>LAB TEST</span>
                          <span style={{ marginLeft: "0.5rem" }}>{item.itemName}</span>
                        </div>
                        <strong style={{ fontSize: "0.9rem" }}>₹{item.amount.toLocaleString()}</strong>
                      </label>
                    ))}

                    {/* Consultation items */}
                    {unpaidChargesData.consultation.map(item => (
                      <label key={item._id} style={{ display: "flex", gap: "0.75rem", alignItems: "center", padding: "0.5rem", border: "1px solid #cbd5e1", borderRadius: "8px", cursor: "pointer", background: "white" }}>
                        <input
                          type="checkbox"
                          checked={selectedUnpaidCharges.some(c => c._id === item._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUnpaidCharges([...selectedUnpaidCharges, item]);
                            } else {
                              setSelectedUnpaidCharges(selectedUnpaidCharges.filter(c => c._id !== item._id));
                            }
                          }}
                        />
                        <div style={{ flex: 1, fontSize: "0.85rem" }}>
                          <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7", fontWeight: 700 }}>CONSULTATION</span>
                          <span style={{ marginLeft: "0.5rem" }}>{item.itemName}</span>
                        </div>
                        <strong style={{ fontSize: "0.9rem" }}>₹{item.amount.toLocaleString()}</strong>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => { setUnpaidChargesDrawerOpen(false); setUnpaidChargesPatient(null); }}>Cancel</button>
              <button 
                className="btn btn-primary" 
                onClick={handleImportSelectedCharges} 
                disabled={selectedUnpaidCharges.length === 0}
                style={{ background: "#2563eb", border: "none" }}
              >
                Import ({selectedUnpaidCharges.length}) Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print invoice receipt modal (Uses clean browser print layout overrides) */}
      {printModalOpen && selectedInvoice && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "550px", padding: "2rem" }}>
            {/* Printable Area Wrapper */}
            <div id="printable-receipt-area">
              <div style={{ textAlign: "center", borderBottom: "2px dashed #cbd5e1", paddingBottom: "1rem", marginBottom: "1.25rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a", fontWeight: 800 }}>MEDICORE AI HOSPITAL</h3>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.75rem", color: "#64748b" }}>Billing counter digital receipt. Mumbai, India</p>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "0.25rem" }}>IPD / OPD Clearance desk</div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "1rem", color: "#334155" }}>
                <div>
                  <strong>Patient Details:</strong>
                  <div>{selectedInvoice.patient?.firstName} {selectedInvoice.patient?.lastName}</div>
                  <div>UHID: {selectedInvoice.patient?.uhid}</div>
                  <div>Phone: {selectedInvoice.patient?.mobile || "N/A"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <strong>Invoice Info:</strong>
                  <div>Receipt: {selectedInvoice.billNumber}</div>
                  <div>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
                  <div>Status: <strong>{selectedInvoice.paymentStatus}</strong></div>
                </div>
              </div>

              <table className="custom-table" style={{ fontSize: "0.8rem", marginBottom: "1rem" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th>Billing Description</th>
                    <th>Category</th>
                    <th style={{ textAlign: "right" }}>Charged amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedInvoice.itemName}</td>
                    <td>{selectedInvoice.category}</td>
                    <td style={{ textAlign: "right" }}>₹{selectedInvoice.amount.toLocaleString()}.00</td>
                  </tr>
                </tbody>
              </table>

              {selectedInvoice.transactions && selectedInvoice.transactions.length > 0 && (
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ fontSize: "0.75rem", color: "#475569", display: "block", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.25rem", marginBottom: "0.4rem" }}>Payments settled log:</strong>
                  {selectedInvoice.transactions.map((tx, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b" }}>
                      <span>₹{tx.amount.toLocaleString()} settled via {tx.paymentMethod} (Ref: {tx.transactionId || "Counter"})</span>
                      <span>{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ borderTop: "2px dashed #cbd5e1", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  {selectedInvoice.paymentStatus === "REFUNDED" && (
                    <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>
                      Refunded Reason: {selectedInvoice.refundReason}
                    </span>
                  )}
                </div>
                
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "0.8rem", color: "#64748b" }}>Gross Total: ₹{selectedInvoice.amount.toLocaleString()}.00</div>
                  <div style={{ fontSize: "0.8rem", color: "#16a34a", fontWeight: 700 }}>Amount Paid: ₹{selectedInvoice.amountPaid.toLocaleString()}.00</div>
                  <div style={{ fontSize: "1rem", color: "#0f172a", fontWeight: 800, marginTop: "0.25rem" }}>
                    Dues Balance: ₹{selectedInvoice.amountDue.toLocaleString()}.00
                  </div>
                </div>
              </div>

              {/* Receipt Footer Mock QR Code */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "0.25rem", marginTop: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem" }}>
                <svg width="60" height="60" viewBox="0 0 29 29" style={{ shapeRendering: "crispEdges" }}>
                  <path fill="#fff" d="M0 0h29v29H0z"/>
                  <path fill="#000" d="M0 0h7v7H0zm22 0h7v7h-7zM0 22h7v7H0zm9 0h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm2 2h2v2h-2zm3-8h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm3-8h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zm-8-6h2v2H9zm2 2h2v2h-2zm-2 2h2v2H9zm2 2h2v2h-2zm3-8h2v2h-2zm2 2h2v2h-2zm-2 2h2v2h-2zm2 2h2v2h-2zM1 1h5v5H1zm22 0h5v5h-5zM1 23h5v5H1z"/>
                </svg>
                <span style={{ fontSize: "0.6rem", color: "#94a3b8" }}>Scan to verify hospital digital clearance status</span>
              </div>
            </div>

            {/* Print trigger buttons */}
            <div className="modal-footer" style={{ borderTop: "none", marginTop: "1.5rem", padding: 0, display: "flex", gap: "0.5rem" }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setPrintModalOpen(false)}>
                Close Receipt
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, background: "#10b981", border: "none" }} 
                onClick={() => {
                  window.print();
                }}
              >
                Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for printable receipt overrides */}
      <style>{`
        .cashier-counter-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          gap: 1.5rem;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .cashier-counter-grid {
            grid-template-columns: 1fr;
          }
        }
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-area, #printable-receipt-area * {
            visibility: visible;
          }
          #printable-receipt-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1.5in;
          }
        }
      `}</style>

    </div>
  );
};

export default CashierBilling;
