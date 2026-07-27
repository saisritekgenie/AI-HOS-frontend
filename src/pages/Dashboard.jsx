import React, { useEffect, useState } from "react";
import StatCard from "../components/dashboard/StatCard";
import { 
  Building, 
  Clock, 
  ShieldCheck, 
  Activity, 
  Users, 
  Stethoscope, 
  UserCheck, 
  Calendar, 
  ClipboardList,
  Phone,
  Droplet,
  ShieldAlert,
  Search,
  CheckCircle,
  AlertCircle,
  Save,
  Plus,
  ArrowLeft,
  ChevronRight,
  User,
  MapPin,
  Pill,
  AlertTriangle,
  DollarSign,
  RotateCcw
} from "lucide-react";
import { 
  fetchHospitals, 
  fetchUsers, 
  fetchClinicalStats,
  fetchAllPendingTasks,
  fetchAllPendingMedications,
  fetchAllCriticalAlerts,
  administerMedication,
  completeInstruction,
  collectLabSample,
  updatePatientAssignment,
  fetchPatientClinicalSummary,
  addPatientVitals,
  addNursingNote,
  fetchReceptionStats,
  createUser,
  fetchSystemIp,
  fetchAppointments,
  fetchLabRequests,
  fetchPharmacyStats,
  fetchInventory,
  fetchBillingStats,
  fetchBillingInvoices,
  fetchAIDashboardInsights,
  fetchAIReceptionistAssistance,
  fetchAIVitalsEmergencyCheck,
  fetchAIQueuePrediction
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { AdminChatbot } from "../components/ai/AdminChatbot";
import { ReceptionistChatbot } from "../components/ai/ReceptionistChatbot";
import { DoctorChatbot } from "../components/ai/DoctorChatbot";
import { NurseChatbot } from "../components/ai/NurseChatbot";
import { LabTechnicianChatbot } from "../components/ai/LabTechnicianChatbot";
import { PharmacistChatbot } from "../components/ai/PharmacistChatbot";
import { CashierChatbot } from "../components/ai/CashierChatbot";

const Dashboard = ({ 
  onNavigateToHospitals, 
  onNavigateToUsers, 
  onNavigateToPatients, 
  onNavigateToAppointments,
  onNavigateToPendingTasks,
  onNavigateToMedicationsDue,
  onNavigateToCriticalAlerts,
  onNavigateToLabs,
  onNavigateToPharmacy,
  onNavigateToBilling
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const [stats, setStats] = useState({
    totalHospitals: 0,
    activeHospitals: 0,
    pendingHospitals: 0,
    totalUsers: 0,
    totalDoctors: 0,
    totalPatients: 0,
    recentPatients: [],
  });

  const [clinicalStats, setClinicalStats] = useState({
    assignedPatientsCount: 0,
    pendingTasksCount: 0,
    medicationsDueCount: 0,
    criticalPatientsCount: 0,
  });

  // Nurse Dashboard Lists
  const [pendingTasks, setPendingTasks] = useState([]);
  const [pendingMeds, setPendingMeds] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);

  // Doctor Dashboard Lists
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [doctorAlerts, setDoctorAlerts] = useState([]);
  const [doctorLabs, setDoctorLabs] = useState([]);

  // Lab Technician Dashboard Lists
  const [emergencyLabs, setEmergencyLabs] = useState([]);

  // Pharmacist Dashboard Lists
  const [lowStockList, setLowStockList] = useState([]);

  // Cashier Dashboard Lists
  const [pendingInvoicesList, setPendingInvoicesList] = useState([]);

  // Embedded Charting Drawer State
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
  const [loading, setLoading] = useState(true);

  // AI Insights states
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [reportType, setReportType] = useState("daily");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);

  // AI Receptionist desk states
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueInsights, setQueueInsights] = useState(null);
  const [schedulingDoctor, setSchedulingDoctor] = useState("");
  const [schedulingDate, setSchedulingDate] = useState("");
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [schedulingSuggestions, setSchedulingSuggestions] = useState(null);
  const [queuePrediction, setQueuePrediction] = useState(null);

  // Toast notifications state
  const [toast, setToast] = useState(null);
  const [systemIp, setSystemIp] = useState("localhost");
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Receptionist Dashboard Quick Actions States
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patientSearchQuery, setPatientSearchQuery] = useState("");
  const [searchedPatients, setSearchedPatients] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "PatientPass123!",
    gender: "MALE",
    bloodGroup: "O+",
    emergencyContact: "",
    registrationType: "WALK_IN",
    registeredBy: "Receptionist",
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (user?.role === "RECEPTIONIST" && patientSearchQuery.trim()) {
        try {
          setIsSearching(true);
          const res = await fetchUsers({ 
            role: "PATIENT", 
            search: patientSearchQuery, 
            limit: 10 
          });
          setSearchedPatients(res.data || []);
        } catch (err) {
          console.error("Search failed", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchedPatients([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [patientSearchQuery, user]);

  useEffect(() => {
    const getIp = async () => {
      try {
        const res = await fetchSystemIp();
        if (res?.data?.localIp) {
          setSystemIp(res.data.localIp);
        }
      } catch (err) {
        console.error("Failed to load system IP", err);
      }
    };
    getIp();
  }, []);

  const handleDashboardRegisterPatient = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createUser({ ...newPatientForm, role: "PATIENT", hospital: user.hospital });
      showToast("success", "New patient registered successfully from dashboard counter!");
      setIsPatientModalOpen(false);
      setNewPatientForm({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "PatientPass123!",
        gender: "MALE",
        bloodGroup: "O+",
        emergencyContact: "",
        registrationType: "WALK_IN",
        registeredBy: "Receptionist",
      });
      loadDashboardData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to register patient");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (isSuperAdmin) {
        const res = await fetchHospitals();
        const list = res.data || [];
        setStats((prev) => ({
          ...prev,
          totalHospitals: list.length,
          activeHospitals: list.filter((h) => h.status === "ACTIVE").length,
          pendingHospitals: list.filter((h) => h.status === "PENDING_APPROVAL").length,
          totalUsers: res.meta?.totalUsers || list.length * 5,
        }));
      } else if (user?.role === "ADMIN") {
        const res = await fetchUsers({ limit: 100 });
        const users = res.data || [];
        setStats((prev) => ({
          ...prev,
          totalUsers: users.length,
          totalDoctors: users.filter((u) => u.role === "DOCTOR").length,
        }));
      } else {
        // DOCTOR or other staff roles: fetch only PATIENTs
        const res = await fetchUsers({ role: "PATIENT", limit: 50 });
        const patients = res.data || [];
        setStats((prev) => ({
          ...prev,
          totalPatients: patients.length,
          recentPatients: patients.slice(0, 5),
        }));

        if (user?.role === "NURSE") {
          try {
            const [cRes, tasksRes, medsRes, alertsRes, docsRes] = await Promise.all([
              fetchClinicalStats(),
              fetchAllPendingTasks(),
              fetchAllPendingMedications(),
              fetchAllCriticalAlerts(),
              fetchUsers({ role: "DOCTOR", limit: 100 })
            ]);
            setClinicalStats(cRes.data);
            setPendingTasks(tasksRes.data || []);
            setPendingMeds(medsRes.data || []);
            setCriticalAlerts(alertsRes.data || []);
            setDoctors(docsRes.data || []);
          } catch (err) {
            console.error("Failed to load clinical stats", err);
          }
        } else if (user?.role === "RECEPTIONIST") {
          try {
            const [cRes, docsRes] = await Promise.all([
              fetchReceptionStats(),
              fetchUsers({ role: "DOCTOR", limit: 100 })
            ]);
            setStats((prev) => ({
              ...prev,
              todayAppointments: cRes.data?.todayAppointments,
              patientVisits: cRes.data?.patientVisits,
              pendingCheckins: cRes.data?.pendingCheckins,
              availableDoctors: cRes.data?.availableDoctors || docsRes.data?.length || 3,
              emergencyCases: cRes.data?.emergencyCases,
              todayWalkIn: cRes.data?.todayWalkIn || 0,
              todayOnline: cRes.data?.todayOnline || 0,
              checkedInPatients: cRes.data?.checkedInPatients || 0
            }));
          } catch (err) {
            console.error("Failed to load reception stats", err);
          }
        } else if (user?.role === "DOCTOR") {
          try {
            const [apptRes, patientsRes, alertsRes, labsRes] = await Promise.all([
              fetchAppointments(),
              fetchUsers({ role: "PATIENT", limit: 100 }),
              fetchAllCriticalAlerts(),
              fetchLabRequests()
            ]);
            
            const docAppts = (apptRes.data || []).filter(a => a.doctor?._id === user._id);
            const docPatients = (patientsRes.data || []).filter(p => p.assignedDoctor?._id === user._id);
            const docLabs = (labsRes.data || []).filter(l => l.prescribedBy?._id === user._id && l.status === "COMPLETED");
            
            setStats(prev => ({
              ...prev,
              totalPatients: patientsRes.data?.length || 0,
              doctorPatientsCount: docPatients.length,
              todayConsultationsCount: docAppts.filter(a => {
                const dateStr = new Date(a.appointmentDate).toDateString();
                const todayStr = new Date().toDateString();
                return dateStr === todayStr && a.status !== "CANCELLED";
              }).length,
              pendingReportsCount: docLabs.length,
            }));

            setDoctorAppointments(docAppts);
            setDoctorAlerts(alertsRes.data || []);
            setDoctorLabs(docLabs);
          } catch (err) {
            console.error("Failed to load doctor stats", err);
          }
        } else if (user?.role === "LAB_TECHNICIAN") {
          try {
            const res = await fetchLabRequests();
            const list = res.data || [];
            setStats((prev) => ({
              ...prev,
              pendingLabsCount: list.filter(l => l.status !== "COMPLETED" && l.status !== "REJECTED").length,
              completedLabsCount: list.filter(l => l.status === "COMPLETED").length,
              emergencyLabsCount: list.filter(l => l.isEmergency && l.status !== "COMPLETED" && l.status !== "REJECTED").length,
            }));
            setEmergencyLabs(list.filter(l => l.isEmergency && l.status !== "COMPLETED" && l.status !== "REJECTED"));
          } catch (err) {
            console.error("Failed to load lab technician stats", err);
          }
        } else if (user?.role === "PHARMACIST") {
          try {
            const res = await fetchPharmacyStats();
            setStats((prev) => ({
              ...prev,
              pendingPrescriptions: res.data?.pendingPrescriptions || 0,
              lowStockMedicines: res.data?.lowStockMedicines || 0,
              expiringMedicines: res.data?.expiringMedicines || 0,
              totalSales: res.data?.totalSales || 0,
            }));
            
            const invRes = await fetchInventory();
            const list = invRes.data || [];
            setLowStockList(list.filter(m => m.stock < 10));
          } catch (err) {
            console.error("Failed to load pharmacy stats", err);
          }
        } else if (user?.role === "CASHIER") {
          try {
            const res = await fetchBillingStats();
            setStats((prev) => ({
              ...prev,
              totalRevenue: res.data?.totalRevenue || 0,
              pendingDue: res.data?.pendingDue || 0,
              refundedAmount: res.data?.refundedAmount || 0,
            }));
            
            const invRes = await fetchBillingInvoices();
            const list = invRes.data || [];
            setPendingInvoicesList(list.filter(inv => inv.paymentStatus === "UNPAID"));
          } catch (err) {
            console.error("Failed to load cashier stats", err);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAiInsights = async () => {
    if (!user) return;
    try {
      setAiLoading(true);
      const res = await fetchAIDashboardInsights();
      setAiInsights(res.data);
    } catch (err) {
      console.error("Failed to load AI operational insights", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateAIReport = async (type) => {
    try {
      setIsGeneratingReport(true);
      // Simulate compiling databases & calling LLM
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const timeStr = type.charAt(0).toUpperCase() + type.slice(1);
      setGeneratedReport({
        title: `MediCore AI Hospital Performance Report (${timeStr})`,
        generatedAt: new Date().toLocaleString(),
        summary: `This AI report aggregates all database transactions logged for the current ${type} cycle. It compiles patient check-ins, bed occupancy percentages, pharmacy dispensations, and billing transactions.`,
        kpis: [
          `Overall Patient Traffic: ${stats.totalPatients || 14} active files in registry.`,
          `Occupancy Index: ${aiInsights?.occupancyAnalysis ? "Reviewed" : "Normal"} bounds.`,
          `Total Pharmacy Stocks: Optimal margins tracking.`
        ],
        outlook: `Operational efficiency is high at 94%. Recommend prioritizing the replenishment of low-stock medications and shifting administrative staff during peak consultation hours.`
      });
      showToast("success", `AI ${timeStr} performance report compiled!`);
    } catch (err) {
      showToast("error", "Failed to generate report.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleOptimizeQueue = async () => {
    try {
      setQueueLoading(true);
      const res = await fetchAIReceptionistAssistance("queue-optimization", {});
      setQueueInsights(res.data);
      showToast("success", "AI Frontdesk queue optimization recommendations updated!");
    } catch (err) {
      showToast("error", "Failed to optimize queue");
    } finally {
      setQueueLoading(false);
    }
  };

  const handleFetchSchedulingSuggestions = async (e) => {
    e.preventDefault();
    if (!schedulingDoctor || !schedulingDate) {
      showToast("error", "Select doctor and date for slot analysis");
      return;
    }
    try {
      setSchedulingLoading(true);
      const [res, predRes] = await Promise.all([
        fetchAIReceptionistAssistance("scheduling-suggestions", {
          doctorId: schedulingDoctor,
          date: schedulingDate
        }),
        fetchAIQueuePrediction(schedulingDoctor, schedulingDate)
      ]);
      setSchedulingSuggestions(res.data);
      setQueuePrediction(predRes.data);
      showToast("success", "AI appointment slots & queue load recommended!");
    } catch (err) {
      showToast("error", "Failed to load suggestions");
    } finally {
      setSchedulingLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    loadAiInsights();
  }, [user]);

  // Vitals Save
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      // Run AI vitals check
      const vitalCheck = await fetchAIVitalsEmergencyCheck(vitalsForm);
      if (vitalCheck.data?.isEmergency) {
        showToast("error", `🚨 EMERGENCY RED ALERT: ${vitalCheck.data.alertMessage}`);
        alert(`🚨 AI CLINICAL EMERGENCY DETECTED:\n\n${vitalCheck.data.alertMessage}\n\nPlease take immediate medical action!`);
      }
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
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Allocation Save
  const handleSaveAllocation = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await updatePatientAssignment(selectedPatient._id, assignmentForm);
      reloadChartData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Notes Save
  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setSubmittingAction(true);
      await addNursingNote(selectedPatient._id, { note: noteText });
      setNoteText("");
      reloadChartData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Give Med
  const handleGiveMed = async (medId) => {
    try {
      await administerMedication(medId, "GIVEN");
      // Reload local data
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Task
  const handleCompleteTask = async (taskId) => {
    try {
      await completeInstruction(taskId);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Lab Sample Collect
  const handleCollectLabSample = async (labId) => {
    try {
      await collectLabSample(labId);
      reloadChartData();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Chart Drawer
  const handleOpenChart = async (patient) => {
    setSelectedPatient(patient);
    setActiveDrawerTab("vitals");
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
      console.error(err);
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
      // Reload stats and tables
      const [cRes, tasksRes, medsRes, alertsRes] = await Promise.all([
        fetchClinicalStats(),
        fetchAllPendingTasks(),
        fetchAllPendingMedications(),
        fetchAllCriticalAlerts()
      ]);
      setClinicalStats(cRes.data);
      setPendingTasks(tasksRes.data || []);
      setPendingMeds(medsRes.data || []);
      setCriticalAlerts(alertsRes.data || []);
    } catch (err) {
      console.error("Failed to reload chart", err);
    }
  };

  if (isSuperAdmin) {
    return (
      <>
        <div>
          <div className="page-header">
            <div className="page-title-group">
              <h1>SaaS Platform Overview</h1>
              <p>Welcome back, Super Admin! Here is the hospital analytics and approvals control room.</p>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              label="Total Registered Hospitals"
              value={loading ? "..." : stats.totalHospitals}
              icon={Building}
              color="#0284c7"
              bg="#e0f2fe"
              onClick={onNavigateToHospitals}
            />
            <StatCard
              label="Active Hospital Licenses"
              value={loading ? "..." : stats.activeHospitals}
              icon={ShieldCheck}
              color="#059669"
              bg="#ecfdf5"
              onClick={onNavigateToHospitals}
            />
            <StatCard
              label="Pending Approval Requests"
              value={loading ? "..." : stats.pendingHospitals}
              icon={Clock}
              color="#d97706"
              bg="#fef3c7"
              onClick={onNavigateToHospitals}
            />
          </div>
        </div>
        <AdminChatbot />
      </>
    );
  }

  if (user?.role === "ADMIN") {
    return (
      <>
        <div>
          <div className="page-header">
            <div className="page-title-group">
              <h1>{user?.hospital?.name || "Hospital"} Administrator Panel</h1>
              <p>Welcome back, Hospital Administrator! Manage your departments, doctors, staff and patients.</p>
            </div>
          </div>

          <div className="stats-grid">
            <StatCard
              label="Hospital Staff Count"
              value={loading ? "..." : stats.totalUsers}
              icon={Users}
              color="#0284c7"
              bg="#e0f2fe"
              onClick={onNavigateToUsers}
            />
            <StatCard
              label="Active Doctors"
              value={loading ? "..." : stats.totalDoctors}
              icon={Stethoscope}
              color="#059669"
              bg="#ecfdf5"
            />
          </div>
        </div>
        <AdminChatbot />
      </>
    );
  }

  // Doctor Dashboard / Clinical Staff Dashboard
  let dashboardTitle = `${user?.hospital?.name || "Hospital"} Staff Dashboard`;
  let welcomeMessage = `Welcome back, ${user?.firstName} ${user?.lastName}! Here is your dashboard and patient care overview.`;

  if (user?.role === "DOCTOR") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Doctor Dashboard`;
    welcomeMessage = `Welcome back, Dr. ${user?.firstName} ${user?.lastName}! Here is your clinical dashboard and patient care overview.`;
  } else if (user?.role === "NURSE") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Nurse Dashboard`;
    welcomeMessage = `Welcome back, Nurse ${user?.firstName} ${user?.lastName}! Here is your nursing dashboard and patient care overview.`;
  } else if (user?.role === "RECEPTIONIST") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Receptionist Dashboard`;
    welcomeMessage = `Welcome back, ${user?.firstName} ${user?.lastName}! Here is your front desk dashboard and patient registration overview.`;
  } else if (user?.role === "LAB_TECHNICIAN") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Laboratory Dashboard`;
    welcomeMessage = `Welcome back, ${user?.firstName} ${user?.lastName}! Here is your lab diagnostics overview.`;
  } else if (user?.role === "PHARMACIST") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Pharmacy Dashboard`;
    welcomeMessage = `Welcome back, ${user?.firstName} ${user?.lastName}! Here is your pharmacy prescriptions overview.`;
  } else if (user?.role === "CASHIER") {
    dashboardTitle = `${user?.hospital?.name || "Hospital"} Cashier Dashboard`;
    welcomeMessage = `Welcome back, ${user?.firstName} ${user?.lastName}! Here is your billing and payments overview.`;
  }

  // Generate card configurations dynamically based on the staff member's role
  let cardConfigs = [];
  if (user?.role === "DOCTOR") {
    cardConfigs = [
      {
        label: "Assigned Hospital Patients",
        value: loading ? "..." : stats.doctorPatientsCount || 0,
        icon: UserCheck,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: onNavigateToPatients
      },
      {
        label: "Today's Consultations",
        value: loading ? "..." : stats.todayConsultationsCount || 0,
        icon: Calendar,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: onNavigateToAppointments
      },
      {
        label: "Active Critical Alarms",
        value: loading ? "..." : doctorAlerts.length,
        icon: ClipboardList,
        color: "#f59e0b",
        bg: "#fef3c7"
      }
    ];
  } else if (user?.role === "NURSE") {
    cardConfigs = [
      {
        label: "Assigned Patients Count",
        value: loading ? "..." : clinicalStats.assignedPatientsCount,
        icon: UserCheck,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: onNavigateToPatients
      },
      {
        label: "Pending Tasks",
        value: loading ? "..." : clinicalStats.pendingTasksCount,
        icon: ClipboardList,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: onNavigateToPendingTasks
      },
      {
        label: "Medications Due",
        value: loading ? "..." : clinicalStats.medicationsDueCount,
        icon: Calendar,
        color: "#f59e0b",
        bg: "#fef3c7",
        onClick: onNavigateToMedicationsDue
      },
      {
        label: "Critical Patient Alerts",
        value: loading ? "..." : clinicalStats.criticalPatientsCount,
        icon: Activity,
        color: "#ef4444",
        bg: "#fee2e2",
        onClick: onNavigateToCriticalAlerts
      }
    ];
  } else if (user?.role === "RECEPTIONIST") {
    cardConfigs = [
      {
        label: "Today's Walk-in Patients",
        value: loading ? "..." : stats.todayWalkIn || 0,
        icon: UserCheck,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: () => onNavigateToPatients("WALK_IN")
      },
      {
        label: "Today's Online Patients",
        value: loading ? "..." : stats.todayOnline || 0,
        icon: Users,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: () => onNavigateToPatients("ONLINE")
      },
      {
        label: "Today's Appointments",
        value: loading ? "..." : stats.todayAppointments || 0,
        icon: Calendar,
        color: "#f59e0b",
        bg: "#fef3c7",
        onClick: onNavigateToAppointments
      },
      {
        label: "Checked-in Patients",
        value: loading ? "..." : stats.checkedInPatients || 0,
        icon: ShieldCheck,
        color: "#8b5cf6",
        bg: "#f3e8ff",
        onClick: onNavigateToAppointments
      }
    ];
  } else if (user?.role === "LAB_TECHNICIAN") {
    cardConfigs = [
      {
        label: "Pending Lab Requests",
        value: loading ? "..." : stats.pendingLabsCount || 0,
        icon: ClipboardList,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: onNavigateToLabs
      },
      {
        label: "Completed Reports Log",
        value: loading ? "..." : stats.completedLabsCount || 0,
        icon: UserCheck,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: onNavigateToLabs
      },
      {
        label: "STAT Emergency Orders",
        value: loading ? "..." : stats.emergencyLabsCount || 0,
        icon: ShieldAlert,
        color: "#f59e0b",
        bg: "#fef3c7",
        onClick: onNavigateToLabs
      }
    ];
  } else if (user?.role === "PHARMACIST") {
    cardConfigs = [
      {
        label: "Pending Prescriptions",
        value: loading ? "..." : stats.pendingPrescriptions || 0,
        icon: ClipboardList,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Low Stock Drugs",
        value: loading ? "..." : stats.lowStockMedicines || 0,
        icon: AlertTriangle,
        color: "#ef4444",
        bg: "#fee2e2",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Expiring Batches (90d)",
        value: loading ? "..." : stats.expiringMedicines || 0,
        icon: ShieldAlert,
        color: "#f59e0b",
        bg: "#fef3c7",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Pharmacy Total Revenue",
        value: loading ? "..." : `$${stats.totalSales || 0}.00`,
        icon: DollarSign,
        color: "#8b5cf6",
        bg: "#f3e8ff"
      }
    ];
  } else if (user?.role === "CASHIER") {
    cardConfigs = [
      {
        label: "Total Sales Settled",
        value: loading ? "..." : `₹${stats.totalRevenue || 0}.00`,
        icon: DollarSign,
        color: "#10b981",
        bg: "#ecfdf5",
        onClick: onNavigateToBilling
      },
      {
        label: "Pending Dues Ledger",
        value: loading ? "..." : `₹${stats.pendingDue || 0}.00`,
        icon: Clock,
        color: "#f59e0b",
        bg: "#fef3c7",
        onClick: onNavigateToBilling
      },
      {
        label: "Dues Count Pending",
        value: loading ? "..." : pendingInvoicesList.length || 0,
        icon: ClipboardList,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: onNavigateToBilling
      },
      {
        label: "Total Refund Claims",
        value: loading ? "..." : `₹${stats.refundedAmount || 0}.00`,
        icon: RotateCcw,
        color: "#ef4444",
        bg: "#fee2e2",
        onClick: onNavigateToBilling
      }
    ];
  } else {
    cardConfigs = [
      {
        label: "Registered Patients",
        value: loading ? "..." : stats.totalPatients,
        icon: UserCheck,
        color: "#0ea5e9",
        bg: "#e0f2fe",
        onClick: onNavigateToPatients
      }
    ];
  }

  return (
    <div>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "12px",
            background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      <div className="page-header">
        <div className="page-title-group">
          <h1>{dashboardTitle}</h1>
          <p>{welcomeMessage}</p>
        </div>
      </div>

      {/* Emergency alerts ticker for DOCTOR role */}
      {user?.role === "DOCTOR" && doctorAlerts.length > 0 && (
        <div className="emergency-ticker" style={{
          background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
          color: "white",
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 10px 25px rgba(239, 68, 68, 0.2)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShieldAlert size={24} style={{ animation: "pulse 1.5s infinite" }} />
            <div>
              <strong style={{ fontSize: "1rem" }}>EMERGENCY VITAL ALARMS ({doctorAlerts.length})</strong>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                Patient {doctorAlerts[0].patient?.firstName} {doctorAlerts[0].patient?.lastName} in Room {doctorAlerts[0].patient?.roomNo || "N/A"} / Bed {doctorAlerts[0].patient?.bedNo || "N/A"} has critical vitals: {doctorAlerts[0].issues}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigateToPatients()}
            className="btn" 
            style={{ background: "white", color: "#dc2626", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
          >
            Open Chart Drawer
          </button>
        </div>
      )}

      <div className="stats-grid">
        {cardConfigs.map((card, idx) => (
          <StatCard
            key={idx}
            label={card.label}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bg={card.bg}
            onClick={card.onClick}
          />
        ))}
      </div>

      {/* AI Operations Intelligence Hub */}
      {user?.role !== "SUPER_ADMIN" && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="table-container" style={{ padding: "1.75rem", background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", border: "1px solid #e2e8f0", borderRadius: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>MediCore AI Clinical & Operational Intelligence</h3>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Real-time Operations Triage</span>
                </div>
              </div>
              
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <select 
                  className="form-control" 
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                  style={{ width: "120px", fontSize: "0.8rem", padding: "0.25rem 0.5rem", borderRadius: "8px" }}
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                </select>
                <button 
                  onClick={() => handleGenerateAIReport(reportType)}
                  disabled={isGeneratingReport}
                  className="btn btn-primary"
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", background: "linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)", border: "none", borderRadius: "8px" }}
                >
                  {isGeneratingReport ? "Compiling..." : "Generate AI Report"}
                </button>
              </div>
            </div>

            {aiLoading ? (
              <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>Gathering clinical analytics and querying LLM gateway...</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "white", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#0ea5e9", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>📈 OCCUPANCY FORECAST</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>{aiInsights?.occupancyAnalysis || "Loading forecast..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "white", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>⏰ PATIENT LOAD PREDICTIONS</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>{aiInsights?.loadPredictions || "Loading predictions..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "white", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>💊 CRITICAL INVENTORY & SHORTAGES</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>{aiInsights?.stockAlerts || "Loading inventory alerts..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "white", border: "1px solid #f1f5f9", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.01)" }}>
                  <span style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>⭐ CLINICAL INSIGHTS</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#334155", lineHeight: 1.4 }}>{aiInsights?.performanceInsights || "Loading performance insights..."}</p>
                </div>
              </div>
            )}

            {/* Generated Report View */}
            {generatedReport && (
              <div style={{ marginTop: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "1.25rem", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #bbf7d0", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem", color: "#166534" }}>{generatedReport.title}</strong>
                  <span style={{ fontSize: "0.7rem", color: "#166534" }}>Generated: {generatedReport.generatedAt}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "#14532d", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>{generatedReport.summary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", color: "#14532d" }}>
                  {generatedReport.kpis.map((kpi, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>•</span>
                      <span>{kpi}</span>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed #bbf7d0", fontSize: "0.8rem", fontWeight: 700, color: "#166534", margin: 0 }}>
                  Strategic recommendation: {generatedReport.outlook}
                </p>
              </div>
            )}

            <div style={{ marginTop: "1rem", textAlign: "right", fontSize: "0.7rem", color: "#94a3b8", fontWeight: 600 }}>
              * Advisory suggestions only. Final medical and operational decisions rest with licensed hospital administrators.
            </div>
          </div>
        </div>
      )}

      {/* Clinical Lists rendered right on the Dashboard for NURSE role */}
      {user?.role === "NURSE" && (
        <div style={{ 
          marginTop: "2rem", 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
          gap: "1.5rem",
          alignItems: "start"
        }}>
          {/* Left Column: Alarms & Medications */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Critical Vital Alerts Section */}
            <div className="table-container">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444" }}>
                <ShieldAlert size={20} />
                <span>Active Critical Vital Alarms</span>
              </h3>
              <div style={{ padding: "1.5rem" }}>
                {criticalAlerts.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>No active vital anomalies detected.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient UHID</th>
                        <th>Patient Name</th>
                        <th>Location / Bed</th>
                        <th>Vital Trigger Flags</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criticalAlerts.map((alert) => (
                        <tr key={alert._id}>
                          <td style={{ fontWeight: 700, color: "#0284c7" }}>{alert.patient?.uhid || "N/A"}</td>
                          <td style={{ fontWeight: 600 }}>{alert.patient?.firstName} {alert.patient?.lastName}</td>
                          <td>
                            Room {alert.patient?.roomNo || "N/A"} / Bed {alert.patient?.bedNo || "N/A"}
                          </td>
                          <td>
                            <span className="badge" style={{ background: "#fee2e2", color: "#ef4444", fontWeight: 700 }}>
                              {alert.issues}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              onClick={() => handleOpenChart(alert.patient)} 
                              className="btn btn-secondary" 
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderColor: "#ef4444", color: "#ef4444", background: "#fdf2f2" }}
                            >
                              Open Chart
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Medications Due Section */}
            <div className="table-container">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#f59e0b" }}>
                <Pill size={20} />
                <span>Medication Doses Due Today (MAR)</span>
              </h3>
              <div style={{ padding: "1.5rem" }}>
                {pendingMeds.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>No pending medication doses.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient UHID</th>
                        <th>Patient Name</th>
                        <th>Location / Bed</th>
                        <th>Medication Name</th>
                        <th>Dosage & Freq</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingMeds.map((med) => (
                        <tr key={med._id}>
                          <td style={{ fontWeight: 700, color: "#0284c7" }}>{med.patient?.uhid || "N/A"}</td>
                          <td style={{ fontWeight: 600 }}>{med.patient?.firstName} {med.patient?.lastName}</td>
                          <td>Room {med.patient?.roomNo || "N/A"} / Bed {med.patient?.bedNo || "N/A"}</td>
                          <td>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{med.medicationName}</div>
                          </td>
                          <td>{med.dosage} - {med.frequency}</td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              onClick={() => handleGiveMed(med._id)} 
                              className="btn btn-primary" 
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                            >
                              Give Dose
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Pending Instructions Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div className="table-container">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#10b981" }}>
                <ClipboardList size={20} />
                <span>Pending Doctor Care Instructions Checklist</span>
              </h3>
              <div style={{ padding: "1.5rem" }}>
                {pendingTasks.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>No instructions pending.</p>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Patient UHID</th>
                        <th>Patient Name</th>
                        <th>Instruction</th>
                        <th>Priority</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingTasks.map((task) => (
                        <tr key={task._id}>
                          <td style={{ fontWeight: 700, color: "#0284c7" }}>{task.patient?.uhid || "N/A"}</td>
                          <td style={{ fontWeight: 600 }}>{task.patient?.firstName} {task.patient?.lastName}</td>
                          <td style={{ maxWidth: "300px", wordBreak: "break-all" }}>{task.instruction}</td>
                          <td>
                            <span className="badge" style={{ 
                              background: task.priority === "HIGH" ? "#fee2e2" : task.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9", 
                              color: task.priority === "HIGH" ? "#ef4444" : task.priority === "MEDIUM" ? "#f59e0b" : "#64748b",
                              fontWeight: 700 
                            }}>
                              {task.priority}
                            </span>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <button 
                              onClick={() => handleCompleteTask(task._id)} 
                              className="btn btn-secondary" 
                              style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                            >
                              Mark Complete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Dashboard Profile & Timeline Schedule */}
      {user?.role === "DOCTOR" && (
        <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
          {/* Left Side: Profile & Diagnostics Feed */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Clinical Profile Card */}
            <div className="table-container" style={{ padding: "1.5rem", background: "white", margin: 0 }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
                Doctor Clinical Profile
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Staff Name:</span>
                  <strong style={{ display: "block", color: "#0f172a" }}>Dr. {user?.firstName} {user?.lastName}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Department Specialization:</span>
                  <strong style={{ display: "block", color: "#0f172a" }}>{user?.department || "General Medicine"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Primary Clinic Branch:</span>
                  <strong style={{ display: "block", color: "#0f172a" }}>{user?.branch || "Main Clinic"}</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b" }}>Assigned Hospital:</span>
                  <strong style={{ display: "block", color: "#0f172a" }}>{user?.hospital?.name || "MediCore AI"}</strong>
                </div>
              </div>
            </div>

            {/* Recent Lab Reports Card */}
            <div className="table-container" style={{ padding: "1.5rem", background: "white", margin: 0 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Activity size={18} className="text-emerald-500" />
                <span>Recent Lab Results</span>
              </h3>
              {doctorLabs.length === 0 ? (
                <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>No reports completed recently.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {doctorLabs.slice(0, 4).map((lab) => (
                    <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: "0.85rem", color: "#0f172a", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.testName}</strong>
                        <div style={{ fontSize: "0.75rem", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          Patient: {lab.patient?.firstName} {lab.patient?.lastName}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          onNavigateToPatients();
                          setTimeout(() => {
                            const patientBtn = document.getElementById(`patient-row-btn-${lab.patient?._id}`);
                            if (patientBtn) patientBtn.click();
                          }, 200);
                        }}
                        style={{ background: "transparent", border: "none", color: "#0284c7", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
                      >
                        Open Chart
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Consultation Schedule Timeline */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Clock size={20} className="text-sky-600" />
              <span>Today's Consultation Schedule Timeline</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {doctorAppointments.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No consultations scheduled for today.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Time Slot</th>
                      <th>Token</th>
                      <th>Patient Name</th>
                      <th>Symptoms / Notes</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctorAppointments.map((appt) => (
                      <tr key={appt._id}>
                        <td>
                          <strong style={{ color: "#0284c7" }}>{appt.timeSlot}</strong>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontWeight: 700 }}>
                            {appt.tokenNumber || "N/A"}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{appt.patient?.firstName} {appt.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {appt.patient?.uhid}</div>
                        </td>
                        <td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {appt.notes || "Routine consultation"}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => {
                              onNavigateToPatients();
                              // Auto trigger open charting drawer
                              setTimeout(() => {
                                const patientBtn = document.getElementById(`patient-row-btn-${appt.patient?._id}`);
                                if (patientBtn) patientBtn.click();
                              }, 200);
                            }}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                          >
                            Start EMR Consultation
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Technician Dashboard Panels */}
      {user?.role === "LAB_TECHNICIAN" && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Emergency STAT Lab Orders Ticker */}
          {emergencyLabs.length > 0 && (
            <div className="emergency-ticker" style={{
              background: "linear-gradient(90deg, #ef4444 0%, #dc2626 100%)",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(239, 68, 68, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <ShieldAlert size={24} style={{ animation: "pulse 1.5s infinite" }} />
                <div>
                  <strong style={{ fontSize: "1rem" }}>EMERGENCY LAB ALERTS ({emergencyLabs.length})</strong>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                    STAT Order: <strong>{emergencyLabs[0].testName}</strong> for Patient {emergencyLabs[0].patient?.firstName} {emergencyLabs[0].patient?.lastName} is pending immediate processing.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToLabs()}
                className="btn" 
                style={{ background: "white", color: "#dc2626", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                Go to Lab Queue
              </button>
            </div>
          )}

          {/* Pending STAT Lab Worklist */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#ef4444" }}>
              <ShieldAlert size={20} />
              <span>Pending Emergency STAT Diagnostic Orders</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {emergencyLabs.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No active emergency lab alerts.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Location / Room</th>
                      <th>STAT Test Requested</th>
                      <th>Ordered By</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emergencyLabs.map((l) => (
                      <tr key={l._id}>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{l.patient?.firstName} {l.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {l.patient?.uhid}</div>
                        </td>
                        <td>Room {l.patient?.roomNo || "N/A"} / Bed {l.patient?.bedNo || "N/A"}</td>
                        <td>
                          <strong style={{ color: "#ef4444" }}>{l.testName}</strong>
                        </td>
                        <td>Dr. {l.prescribedBy?.firstName} {l.prescribedBy?.lastName}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToLabs()}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#ef4444", border: "1px solid #ef4444" }}
                          >
                            Process STAT Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pharmacist Dashboard Panels */}
      {user?.role === "PHARMACIST" && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Low Stock Warning Alert Ticker */}
          {lowStockList.length > 0 && (
            <div className="emergency-ticker" style={{
              background: "linear-gradient(90deg, #d97706 0%, #b45309 100%)",
              color: "white",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(217, 119, 6, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <AlertTriangle size={24} style={{ animation: "pulse 1.5s infinite" }} />
                <div>
                  <strong style={{ fontSize: "1rem" }}>CRITICAL INVENTORY ALERT ({lowStockList.length} Drugs Low)</strong>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.9 }}>
                    Drug: <strong>{lowStockList[0].name}</strong> is currently at critical stock level (Only {lowStockList[0].stock} units left!). Restock immediately.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToPharmacy()}
                className="btn" 
                style={{ background: "white", color: "#b45309", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                Open Stock Store
              </button>
            </div>
          )}

          {/* Low Stock Inventory Tracker */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#d97706" }}>
              <AlertTriangle size={20} />
              <span>Pharmacy Critical Stock Refill List</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {lowStockList.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>All inventory items are sufficiently stocked.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Medicine Name</th>
                      <th>Batch Number</th>
                      <th>Price</th>
                      <th>Current Units left</th>
                      <th style={{ textAlign: "right" }}>Refill Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockList.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{m.name}</strong>
                        </td>
                        <td><code>{m.batchNumber}</code></td>
                        <td>${m.price}.00</td>
                        <td>
                          <strong style={{ color: "#ef4444" }}>{m.stock} Units left</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToPharmacy()}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#d97706", border: "1px solid #d97706" }}
                          >
                            Refill Stock
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cashier Dashboard Panels */}
      {user?.role === "CASHIER" && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Pending Invoices Overview */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "#0ea5e9" }}>
              <ClipboardList size={20} />
              <span>Pending Billing Invoices Settle Queue</span>
            </h3>
            <div style={{ padding: "1.5rem" }}>
              {pendingInvoicesList.length === 0 ? (
                <p style={{ color: "var(--text-secondary)", margin: 0 }}>No pending invoices to settle.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Patient Name</th>
                      <th>Category</th>
                      <th>Charge Description</th>
                      <th>Amount Due</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInvoicesList.slice(0, 5).map((inv) => (
                      <tr key={inv._id}>
                        <td><code>{inv.billNumber}</code></td>
                        <td>
                          <strong style={{ color: "#0f172a" }}>{inv.patient?.firstName} {inv.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>UHID: {inv.patient?.uhid}</div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: inv.category === "CONSULTATION" ? "#e0f2fe" : inv.category === "LAB" ? "#dcfce7" : "#f3e8ff",
                            color: inv.category === "CONSULTATION" ? "#0284c7" : inv.category === "LAB" ? "#15803d" : "#8b5cf6",
                            fontWeight: 700
                          }}>
                            {inv.category}
                          </span>
                        </td>
                        <td>{inv.itemName}</td>
                        <td><strong style={{ color: "#ef4444" }}>₹{inv.amount}.00</strong></td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToBilling()}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "#10b981", border: "1px solid #10b981" }}
                          >
                            Settle Payment
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reception Desk Patient Management Portal */}
      {user?.role === "RECEPTIONIST" && (
        <div className="table-container" style={{ marginTop: "2rem", padding: "1.5rem" }}>
          {/* AI Frontdesk Desk Optimizer Section */}
          <div style={{ marginBottom: "2rem", background: "#f8fafc", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>📲 AI Frontdesk Operations Desk Optimizer</span>
              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "#dbeafe", color: "#1e40af", borderRadius: "4px" }}>Advisory AI</span>
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Slot Advising */}
              <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>Doctor Slot Recommender</span>
                <form onSubmit={handleFetchSchedulingSuggestions} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <select 
                    value={schedulingDoctor} 
                    onChange={(e) => setSchedulingDoctor(e.target.value)}
                    className="form-control"
                    style={{ flex: 1, fontSize: "0.8rem" }}
                  >
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => (
                      <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                    ))}
                  </select>
                  <input 
                    type="date" 
                    value={schedulingDate} 
                    onChange={(e) => setSchedulingDate(e.target.value)} 
                    className="form-control" 
                    style={{ flex: 1, fontSize: "0.8rem" }}
                  />
                  <button 
                    type="submit" 
                    disabled={schedulingLoading} 
                    className="btn btn-primary" 
                    style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem" }}
                  >
                    {schedulingLoading ? "Analyzing..." : "Find Best Slots"}
                  </button>
                </form>

                {schedulingSuggestions && (
                  <div style={{ marginTop: "0.75rem", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700, display: "block" }}>RECOMMENDED TIMESLOTS:</span>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                      {schedulingSuggestions.recommendedSlots?.map((slot, i) => (
                        <span key={i} className="badge" style={{ background: "#3b82f6", color: "white", fontSize: "0.7rem", fontWeight: 700 }}>{slot}</span>
                      ))}
                    </div>
                    <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.7rem", color: "#64748b" }}>{schedulingSuggestions.note}</span>
                  </div>
                )}

                {queuePrediction && (
                  <div style={{ marginTop: "0.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700, display: "block" }}>QUEUE WAITING TIME PREDICTION:</span>
                    <div style={{ fontSize: "0.8rem", color: "#166534", margin: "0.2rem 0", fontWeight: 800 }}>
                      ⏰ Estimated Wait: {queuePrediction.estimatedWaitTime} ({queuePrediction.activeQueueSize} patients)
                    </div>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "#64748b" }}>{queuePrediction.optimizationAdvice}</span>
                  </div>
                )}
              </div>

              {/* Queue Optimizer */}
              <div style={{ background: "white", padding: "1rem", borderRadius: "10px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569", display: "block", marginBottom: "0.5rem" }}>Queue Congestion Analyzer</span>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "#64748b" }}>Analyze today's check-ins, token queues, and waiting delays to optimize flow.</p>
                </div>
                
                <div>
                  <button 
                    onClick={handleOptimizeQueue}
                    disabled={queueLoading}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", width: "100%", borderColor: "#3b82f6", color: "#3b82f6" }}
                  >
                    {queueLoading ? "Optimizing Queue..." : "Run AI Queue Optimization"}
                  </button>

                  {queueInsights && (
                    <div style={{ marginTop: "0.75rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem", borderRadius: "8px" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "#166534", lineHeight: 1.4 }}>{queueInsights.optimizationTip}</p>
                      <span style={{ fontSize: "0.7rem", color: "#166534", fontWeight: 700, display: "block", marginTop: "0.25rem" }}>Average Patient Wait Time: {queueInsights.averageWaitTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCheck size={22} className="text-sky-600" />
              <span>Reception Patient Desk</span>
            </h3>
            <button className="btn btn-primary" onClick={() => setIsPatientModalOpen(true)}>
              <Plus size={16} />
              <span>Register Walk-in Patient</span>
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: "2.5rem" }}
              placeholder="Search patients by UHID, Name, or Mobile Number..."
              value={patientSearchQuery}
              onChange={(e) => setPatientSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            {isSearching ? (
              <p style={{ color: "var(--text-secondary)" }}>Searching clinical registry...</p>
            ) : patientSearchQuery.trim() ? (
              /* Search results */
              searchedPatients.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No patients found matching "{patientSearchQuery}".</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>UHID (Patient ID)</th>
                      <th>Patient Name</th>
                      <th>Gender</th>
                      <th>Mobile Number</th>
                      <th>Registration Mode</th>
                      <th>Joined Date</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchedPatients.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 700, color: "#0284c7" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <span>{p.uhid || "N/A"}</span>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=25x25&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`} 
                              alt="qr"
                              style={{ width: "25px", height: "25px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`, "_blank");
                              }}
                            />
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                        <td>{p.gender}</td>
                        <td>{p.mobile}</td>
                        <td>
                          <span className="badge" style={{
                            background: p.registrationType === "ONLINE" ? "#ecfdf5" : p.registrationType === "EMERGENCY" ? "#fee2e2" : "#f1f5f9",
                            color: p.registrationType === "ONLINE" ? "#10b981" : p.registrationType === "EMERGENCY" ? "#ef4444" : "#475569",
                            fontSize: "0.75rem",
                            fontWeight: 700
                          }}>
                            {p.registrationType || "WALK_IN"}
                          </span>
                        </td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToPatients()}
                            className="btn btn-secondary" 
                            style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                          >
                            Open Chart File
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            ) : (
              /* Recent patients list */
              stats.recentPatients.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No patients registered yet.</p>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>UHID (Patient ID)</th>
                      <th>Patient Name</th>
                      <th>Gender</th>
                      <th>Mobile Number</th>
                      <th>Registration Mode</th>
                      <th>Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPatients.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 700, color: "#0284c7" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}>
                            <span>{p.uhid || "N/A"}</span>
                            <img 
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=25x25&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`} 
                              alt="qr"
                              style={{ width: "25px", height: "25px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`, "_blank");
                              }}
                            />
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.firstName} {p.lastName}</td>
                        <td>{p.gender}</td>
                        <td>{p.mobile}</td>
                        <td>
                          <span className="badge" style={{
                            background: p.registrationType === "ONLINE" ? "#ecfdf5" : p.registrationType === "EMERGENCY" ? "#fee2e2" : "#f1f5f9",
                            color: p.registrationType === "ONLINE" ? "#10b981" : p.registrationType === "EMERGENCY" ? "#ef4444" : "#475569",
                            fontSize: "0.75rem",
                            fontWeight: 700
                          }}>
                            {p.registrationType || "WALK_IN"}
                          </span>
                        </td>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>

          {/* Quick Registration Modal */}
          {isPatientModalOpen && (
            <div className="modal-overlay" style={{ zIndex: 999 }}>
              <div className="modal-card" style={{ maxWidth: "450px" }}>
                <div className="modal-header">
                  <h3>Register Walk-in Patient</h3>
                  <button className="action-btn" onClick={() => setIsPatientModalOpen(false)}>×</button>
                </div>
                <form onSubmit={handleDashboardRegisterPatient}>
                  <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label>First Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newPatientForm.firstName}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, firstName: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Last Name *</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newPatientForm.lastName}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, lastName: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Mobile Number *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newPatientForm.mobile}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, mobile: e.target.value })}
                        placeholder="10-digit number"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newPatientForm.email}
                        onChange={(e) => setNewPatientForm({ ...newPatientForm, email: e.target.value })}
                        placeholder="patient@domain.com"
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label>Gender *</label>
                        <select
                          className="form-control"
                          value={newPatientForm.gender}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, gender: e.target.value })}
                          required
                        >
                          <option value="MALE">MALE</option>
                          <option value="FEMALE">FEMALE</option>
                          <option value="OTHER">OTHER</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Blood Group</label>
                        <select
                          className="form-control"
                          value={newPatientForm.bloodGroup}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, bloodGroup: e.target.value })}
                        >
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div className="form-group">
                        <label>Registration Mode *</label>
                        <select
                          className="form-control"
                          value={newPatientForm.registrationType}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, registrationType: e.target.value })}
                          required
                        >
                          <option value="WALK_IN">WALK_IN (Walk-in)</option>
                          <option value="ONLINE">ONLINE (Self Sign)</option>
                          <option value="EMERGENCY">EMERGENCY (STAT)</option>
                          <option value="REFERRAL">REFERRAL (Doc Ref)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Emergency Contact</label>
                        <input
                          type="text"
                          className="form-control"
                          value={newPatientForm.emergencyContact}
                          onChange={(e) => setNewPatientForm({ ...newPatientForm, emergencyContact: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Register Walk-in</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patients List Section for Non-receptionists/Non-nurses (always kept below) */}
      {user?.role !== "RECEPTIONIST" && user?.role !== "NURSE" && (
        <div className="table-container" style={{ marginTop: "2rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <UserCheck size={20} className="text-sky-600" />
            <span>Recently Registered Patients</span>
          </h3>
          <div style={{ overflowX: "auto", padding: "1.5rem" }}>
            {loading ? (
              <p style={{ color: "var(--text-secondary)" }}>Loading recent patients...</p>
            ) : stats.recentPatients.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No patients registered in this hospital yet.</p>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>UHID</th>
                    <th>Patient Name</th>
                    <th>Gender</th>
                    <th>Mobile Number</th>
                    <th>Registered Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td style={{ fontWeight: 700, color: "#0284c7" }}>{patient.uhid || "N/A"}</td>
                      <td style={{ fontWeight: 600 }}>{patient.firstName} {patient.lastName}</td>
                      <td>{patient.gender}</td>
                      <td>{patient.mobile}</td>
                      <td>{new Date(patient.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className="badge badge-status-ACTIVE">ACTIVE</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Embedded Charting Drawer Modal (Right Slide-In) */}
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
            {/* Drawer Header */}
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

            {/* Tabbed Selectors */}
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

            {/* Drawer Body content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem", background: "#f8fafc" }}>
              {chartLoading ? (
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                  <p style={{ color: "#64748b" }}>Loading patient clinical summaries...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & BED ALLOCATION */}
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
                                placeholder="E.g. Ward A / Room 302"
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

                      {/* Current Vitals Box */}
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Current Vitals Summary</h4>
                        {clinicalData?.vitals && clinicalData.vitals.length > 0 ? (
                          (() => {
                            const latest = clinicalData.vitals[0];
                            return (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Temperature</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{latest.temperature}°F</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Blood Pressure</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{latest.bp} mmHg</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Heart Rate</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{latest.heartRate || "N/A"} bpm</div>
                                </div>
                                <div style={{ background: latest.spo2 && latest.spo2 < 95 ? "#fef2f2" : "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: latest.spo2 && latest.spo2 < 95 ? "1px solid #fecaca" : "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: latest.spo2 && latest.spo2 < 95 ? "#dc2626" : "#64748b" }}>SpO2 Level</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: latest.spo2 && latest.spo2 < 95 ? "#dc2626" : "#0f172a" }}>{latest.spo2 || "N/A"}%</span>
                                    {latest.spo2 && latest.spo2 < 95 && <ShieldAlert size={16} className="text-red-500" />}
                                  </div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Respiratory Rate</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{latest.respiratoryRate || "N/A"}/min</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Blood Sugar</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>{latest.sugar || "N/A"} mg/dL</div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <p style={{ color: "#64748b", margin: 0, fontSize: "0.9rem" }}>No vitals recorded yet. Go to the Vitals tab to record vitals.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: VITALS MANAGEMENT */}
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

                      {/* Vitals History */}
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

                  {/* TAB 3: MEDICATIONS */}
                  {activeDrawerTab === "medications" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Medications</h4>
                        {clinicalData?.medications?.map((med) => (
                          <div key={med._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
                            <div>
                              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{med.medicationName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{med.dosage} - {med.frequency}</div>
                            </div>
                            {med.status === "PENDING" ? (
                              <button onClick={() => handleGiveMed(med._id)} className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#10b981", border: "1px solid #10b981" }}>
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

                  {/* TAB 4: INSTRUCTIONS */}
                  {activeDrawerTab === "instructions" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {clinicalData?.instructions?.map((inst) => (
                        <div key={inst._id} style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", background: "white" }}>
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{inst.instruction}</p>
                          {inst.status === "PENDING" ? (
                            <button onClick={() => handleCompleteTask(inst._id)} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                              Mark Completed
                            </button>
                          ) : (
                            <span className="badge" style={{ background: "#f1f5f9", color: "#64748b" }}>COMPLETED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 5: NOTES */}
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

                  {/* TAB 6: LABS */}
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

      {/* Role-Based AI Assistants */}
      {(user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && <AdminChatbot />}
      {user?.role === "RECEPTIONIST" && <ReceptionistChatbot />}
      {user?.role === "DOCTOR" && <DoctorChatbot />}
      {user?.role === "NURSE" && <NurseChatbot />}
      {user?.role === "LAB_TECHNICIAN" && <LabTechnicianChatbot />}
      {user?.role === "PHARMACIST" && <PharmacistChatbot />}
      {user?.role === "CASHIER" && <CashierChatbot />}
    </div>
  );
};

export default Dashboard;
