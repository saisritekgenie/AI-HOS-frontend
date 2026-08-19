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
  fetchAdmissions,
  createUser,
  fetchSystemIp,
  fetchAppointments,
  createAppointment,
  checkInAppointment,
  fetchClinicalAppointments,
  fetchConsolidatedReport,
  fetchLabRequests,
  fetchPharmacyStats,
  fetchInventory,
  fetchBillingStats,
  fetchBillingInvoices,
  fetchAIDashboardInsights,
  fetchAIReceptionistAssistance,
  fetchAIVitalsEmergencyCheck,
  fetchAIQueuePrediction,
  fetchIcd10Suggestions,
  updateProfile
} from "../services/api";
import { useAuth } from "../context/AuthContext";


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
    totalNurses: 0,
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
  const [admissionsList, setAdmissionsList] = useState([]);

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
  const [icdSuggestions, setIcdSuggestions] = useState([]);
  const [loadingIcd, setLoadingIcd] = useState(false);
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

  // Visual Appointments Scheduling Grid States
  const [appointmentsList, setAppointmentsList] = useState([]);
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedApptPatient, setSelectedApptPatient] = useState("");
  const [selectedApptDoctor, setSelectedApptDoctor] = useState("");
  const [apptDate, setApptDate] = useState(new Date().toISOString().split("T")[0]);
  const [allPatientsList, setAllPatientsList] = useState([]);

  // Doctor EMR Discharge Panel States
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [dischargeSummaryInput, setDischargeSummaryInput] = useState("");
  const [takeHomeMedsInput, setTakeHomeMedsInput] = useState([]);
  const [newTakeHomeMed, setNewTakeHomeMed] = useState({ name: "", dosage: "", freq: "" });
  const [dischargeStatus, setDischargeStatus] = useState(null);

  // Doctor Availability Configuration States
  const [selectedDays, setSelectedDays] = useState(user?.availability?.days || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [startTime, setStartTime] = useState(user?.availability?.startTime || "09:00 AM");
  const [endTime, setEndTime] = useState(user?.availability?.endTime || "05:00 PM");

  useEffect(() => {
    if (user?.availability) {
      setSelectedDays(user.availability.days || []);
      setStartTime(user.availability.startTime || "09:00 AM");
      setEndTime(user.availability.endTime || "05:00 PM");
    }
  }, [user]);

  const toggleDaySelection = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(prev => prev.filter(d => d !== day));
    } else {
      setSelectedDays(prev => [...prev, day]);
    }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await updateProfile({
        availability: {
          days: selectedDays,
          startTime,
          endTime
        }
      });
      showToast("success", "Doctor availability schedule updated successfully! Receptionist and patients will now see your new slots.");
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update availability");
    } finally {
      setLoading(false);
    }
  };

  // Lab Technician OCR States
  const [ocrReportInput, setOcrReportInput] = useState("");
  const [ocrParsingLabId, setOcrParsingLabId] = useState("");
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);


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
        try {
          const [usersRes, patientsRes, receptionRes, alertsRes, admissionsRes] = await Promise.all([
            fetchUsers({ limit: 500 }),
            fetchUsers({ role: "PATIENT", limit: 500 }),
            fetchReceptionStats(),
            fetchAllCriticalAlerts().catch(() => ({ data: [] })),
            fetchAdmissions().catch(() => ({ data: [] }))
          ]);
          const users = usersRes.data || [];
          const patients = patientsRes.data || [];
          const rStats = receptionRes.data || {};
          setStats((prev) => ({
            ...prev,
            totalUsers: users.length,
            totalDoctors: users.filter((u) => u.role === "DOCTOR").length,
            totalNurses: users.filter((u) => u.role === "NURSE").length,
            totalPatients: patientsRes.meta?.totalRecords || patients.length,
            recentPatients: patients.slice(0, 5),
            // Admissions registry flow stats
            totalAdmitted: rStats.totalAdmitted || 0,
            todayAdmissions: rStats.todayAdmissions || 0,
            todayDischarges: rStats.todayDischarges || 0,
            totalBeds: rStats.totalBeds || 100,
            occupiedBeds: rStats.occupiedBeds || 70,
            availableBeds: rStats.availableBeds || 30,
            emergencyPatients: rStats.emergencyPatientsCount || 0
          }));
          setCriticalAlerts(alertsRes.data || []);
          setAdmissionsList(admissionsRes.data || []);
        } catch (err) {
          console.error("Failed to load admin stats", err);
        }
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
            const [cRes, docsRes, apptsRes, patientsRes, alertsRes, admissionsRes] = await Promise.all([
              fetchReceptionStats(),
              fetchUsers({ role: "DOCTOR", limit: 100 }),
              fetchClinicalAppointments(),
              fetchUsers({ role: "PATIENT", limit: 100 }),
              fetchAllCriticalAlerts().catch(() => ({ data: [] })),
              fetchAdmissions().catch(() => ({ data: [] }))
            ]);
            const rStats = cRes.data || {};
            setStats((prev) => ({
              ...prev,
              todayAppointments: rStats.todayAppointments,
              patientVisits: rStats.patientVisits,
              pendingCheckins: rStats.pendingCheckins,
              availableDoctors: rStats.availableDoctors || docsRes.data?.length || 3,
              emergencyCases: rStats.emergencyCases,
              todayWalkIn: rStats.todayWalkIn || 0,
              todayOnline: rStats.todayOnline || 0,
              checkedInPatients: rStats.checkedInPatients || 0,
              // Admissions registry flow stats
              totalAdmitted: rStats.totalAdmitted || 0,
              todayAdmissions: rStats.todayAdmissions || 0,
              todayDischarges: rStats.todayDischarges || 0,
              totalBeds: rStats.totalBeds || 100,
              occupiedBeds: rStats.occupiedBeds || 70,
              availableBeds: rStats.availableBeds || 30,
              emergencyPatients: rStats.emergencyPatientsCount || 0
            }));
            setDoctors(docsRes.data || []);
            setAppointmentsList(apptsRes.data || []);
            setAllPatientsList(patientsRes.data || []);
            setCriticalAlerts(alertsRes.data || []);
            setAdmissionsList(admissionsRes.data || []);
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
            setCriticalAlerts(alertsRes.data || []);
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
      
      let title = `MediCore AI Performance Report (${timeStr})`;
      let summary = "";
      let kpis = [];
      let outlook = "";

      if (user?.role === "ADMIN" || isSuperAdmin) {
        summary = `This AI report aggregates administrative operations and hospital occupancy for the current ${type} cycle.`;
        kpis = [
          `Active Inpatients: ${stats.totalAdmitted || 0} warded stays under review.`,
          `Staffing Index: ${stats.totalDoctors || 0} active doctors and ${stats.totalNurses || 0} nurses rostered.`,
          `Occupancy Index: ${stats.occupiedBeds || 70}% capacity warded bed allocations.`
        ];
        outlook = `Hospital operations are running optimally. Recommend coordinating with reception to clear discharges and free up bed availability.`;
      } else if (user?.role === "DOCTOR") {
        summary = `This AI clinical report summaries doctor consult logs, EMR chart logs, and critical patient alerts for the current ${type} cycle.`;
        kpis = [
          `Patient Care List: ${stats.doctorPatientsCount || 0} patients under your direct EMR care.`,
          `Today's Consultations: ${stats.todayConsultationsCount || 0} scheduled patient slots.`,
          `Pending Labs Review: ${stats.pendingReportsCount || 0} completed diagnostic reports waiting verification.`
        ];
        outlook = `Clinical consultation flow is active. Recommend reviewing outstanding lab findings and finalizing EMR patient notes before shift closure.`;
      } else if (user?.role === "NURSE") {
        summary = `This AI nursing log aggregates vitals observations, tasks checklists, and medications due tracking for the current ${type} cycle.`;
        kpis = [
          `Active Nursing Tasks: ${clinicalStats.pendingTasksCount || 0} instruction logs pending in the ward.`,
          `Medication Rounds: ${clinicalStats.medicationsDueCount || 0} due prescription doses waiting administration.`,
          `Alarms Monitored: ${criticalAlerts.length || 0} active vital threshold flags logged.`
        ];
        outlook = `Nursing workflows are synchronized. Ensure all critical vital alerts are manually verified and doctor instructions checked off.`;
      } else if (user?.role === "LAB_TECHNICIAN") {
        summary = `This AI laboratory performance report tracks diagnostics queues, sample collection events, and test analysis for the current ${type} cycle.`;
        kpis = [
          `Test Queue: ${stats.pendingLabsCount || 0} pending lab panels waiting specimen collection.`,
          `Completed Panels: ${stats.completedLabsCount || 0} diagnostics reports parsed and finalized in database.`,
          `Emergency Test Alarms: ${stats.emergencyLabsCount || 0} critical laboratory requests pending.`
        ];
        outlook = `Diagnostics output is steady. Prioritize processing emergency hematology and biochemistry panels to maintain short turnaround times.`;
      } else if (user?.role === "PHARMACIST") {
        summary = `This AI pharmacy report aggregates prescription dispensing, inventory levels, and medicine replenishment forecasting for the current ${type} cycle.`;
        kpis = [
          `Prescriptions Pending: ${stats.pendingPrescriptions || 0} EMR drug allocations waiting to be dispensed.`,
          `Critical Stock Alerts: ${stats.lowStockMedicines || 0} essential medicine batches below safety limits.`,
          `Sales Revenue: ₹${stats.totalSales || 0} generated from drug retail transactions.`
        ];
        outlook = `Pharmacy inventory requires close tracking. Submit replenishment orders for low-stock medicines and check cold-chain storage logs.`;
      } else if (user?.role === "CASHIER") {
        summary = `This AI revenue report details cash desk transactions, invoice settlements, and card/UPI reconciliation tracking for the current ${type} cycle.`;
        kpis = [
          `Total Settled Revenue: ₹${stats.totalRevenue || 0} cleared cash-desk receipts.`,
          `Outstanding Bills: ₹${stats.pendingDue || 0} pending outpatient and warded invoice claims.`,
          `Refund Clearance: ₹${stats.refundedAmount || 0} returned transactions logged.`
        ];
        outlook = `UPI remains the primary clearing channel. Recommend dispatching SMS payment reminders for unpaid invoices older than 7 days.`;
      } else if (user?.role === "RECEPTIONIST") {
        summary = `This AI front-desk report summarizes patient check-ins, doctor appointment bookings, and bed admissions registry for the current ${type} cycle.`;
        kpis = [
          `Today's Bookings: ${stats.todayAppointments || 0} consultations scheduled on the board.`,
          `Admissions Logged: ${stats.todayAdmissions || 0} new inpatient ward entries registered.`,
          `Walk-in vs Online: Ratio of Walk-in check-ins shows high volume at reception counter.`
        ];
        outlook = `Waiting times are averaging 14 minutes. Recommend allocating walk-in slots to available consult buffers to balance the doctor scheduler queue.`;
      }

      setGeneratedReport({
        title: `MediCore AI ${user?.role || "Staff"} Performance Report (${timeStr})`,
        generatedAt: new Date().toLocaleString(),
        summary,
        kpis,
        outlook
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
      setIcdSuggestions([]);
      reloadChartData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleFetchIcdSuggestions = async () => {
    if (!noteText.trim()) {
      showToast("warning", "Please write clinical observation notes first before querying ICD-10 suggestions.");
      return;
    }
    try {
      setLoadingIcd(true);
      const res = await fetchIcd10Suggestions(noteText);
      setIcdSuggestions(res.data || []);
      showToast("success", "AI coding analysis completed!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to retrieve ICD-10 suggestions");
    } finally {
      setLoadingIcd(false);
    }
  };

  const handleApplyIcd = (code) => {
    setNoteText(prev => `${prev.trim()}\n[ICD-10 Code: ${code.code} - ${code.description}]`);
    setIcdSuggestions(prev => prev.filter(c => c.code !== code.code));
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

  // Create Appointment Action
  const handleSaveAppointment = async (e) => {
    e.preventDefault();
    if (!selectedApptPatient || !selectedApptDoctor || !selectedSlot) {
      showToast("error", "All fields are required to schedule an appointment");
      return;
    }
    try {
      setSubmittingAction(true);
      await createAppointment({
        patientId: selectedApptPatient,
        doctorId: selectedApptDoctor,
        appointmentDate: apptDate,
        timeSlot: selectedSlot
      });
      showToast("success", "Appointment scheduled successfully!");
      setIsApptModalOpen(false);
      setSelectedApptPatient("");
      setSelectedApptDoctor("");
      setSelectedSlot("");
      loadDashboardData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to schedule appointment");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Checkin Appointment Action
  const handleCheckIn = async (apptId) => {
    try {
      await checkInAppointment(apptId);
      showToast("success", "Patient checked in successfully!");
      loadDashboardData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to check in patient");
    }
  };

  const handlePrintConsolidatedReport = async (patientId) => {
    try {
      if (!patientId) return;
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
      showToast("error", "Failed to compile consolidated EMR report document.");
    }
  };

  // Submit Discharge Record
  const handleSaveDischarge = async (e) => {
    e.preventDefault();
    if (!dischargeSummaryInput.trim()) {
      showToast("error", "Discharge clinical summary is required");
      return;
    }
    try {
      setSubmittingAction(true);
      const res = await dischargePatient(selectedPatient._id, {
        dischargeSummary: dischargeSummaryInput,
        takeHomeMedications: takeHomeMedsInput.map(m => ({ medicationName: m.name, dosage: m.dosage, frequency: m.freq }))
      });
      
      if (res.data?.billingCleared) {
        showToast("success", "Patient discharged successfully! Bed allocation cleared.");
      } else {
        showToast("warning", "Discharge summary saved. WARNING: Patient has outstanding unpaid invoices.");
      }
      setIsDischargeModalOpen(false);
      setDischargeSummaryInput("");
      setTakeHomeMedsInput([]);
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to discharge patient");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Run Lab Report OCR Parse
  const handleRunOcr = async (e) => {
    e.preventDefault();
    if (!ocrReportInput.trim()) {
      showToast("error", "Lab report text is required for OCR simulation");
      return;
    }
    try {
      setSubmittingAction(true);
      await parseLabReportOCR(ocrParsingLabId, ocrReportInput);
      showToast("success", "AI OCR parsed report values and auto-completed test status!");
      setIsOcrModalOpen(false);
      setOcrReportInput("");
      setOcrParsingLabId("");
      
      // Reload stats
      const [labsRes] = await Promise.all([
        fetchLabRequests()
      ]);
      setEmergencyLabs((labsRes.data || []).filter(l => l.isEmergency && l.status !== "COMPLETED"));
      loadDashboardData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to parse lab report OCR");
    } finally {
      setSubmittingAction(false);
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
      <div style={{ padding: "1.5rem" }}>
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
    );
  }


  // Dynamic Greetings for the Dashboard Redesign
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good Morning";
    if (hr < 17) return "Good Afternoon";
    return "Good Evening";
  };
  const greetingName = user ? (user.role === "DOCTOR" ? `Dr. ${user.firstName}` : user.firstName) : "Admin";
  const dashboardTitle = `${getGreeting()}, ${greetingName}`;
  const welcomeMessage = "Here's your hospital pulse for today.";

  // Generate card configurations dynamically based on the staff member's role
  let cardConfigs = [];
  if (user?.role === "ADMIN") {
    cardConfigs = [
      {
        label: "Hospital Staff Count",
        value: loading ? "..." : stats.totalUsers,
        icon: Users,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToUsers
      },
      {
        label: "Registered Patients",
        value: loading ? "..." : stats.totalPatients,
        icon: UserCheck,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToPatients
      },
      {
        label: "Total Admitted Patients",
        value: loading ? "..." : stats.totalAdmitted || 0,
        icon: Building,
        color: "#19B5A5",
        bg: "rgba(25, 181, 165, 0.08)"
      },
      {
        label: "Bed Occupancy Status",
        value: loading ? "..." : `${stats.occupiedBeds || 70} / ${stats.totalBeds || 100} Beds`,
        icon: Activity,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)"
      },
      {
        label: "Admissions / Discharges",
        value: loading ? "..." : `${stats.todayAdmissions || 0} / ${stats.todayDischarges || 0} Today`,
        icon: ClipboardList,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)"
      },
      {
        label: "Emergency Patients",
        value: loading ? "..." : stats.emergencyPatients || 0,
        icon: ShieldAlert,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)"
      }
    ];
  } else if (user?.role === "DOCTOR") {
    cardConfigs = [
      {
        label: "Assigned Hospital Patients",
        value: loading ? "..." : stats.doctorPatientsCount || 0,
        icon: UserCheck,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToPatients
      },
      {
        label: "Today's Consultations",
        value: loading ? "..." : stats.todayConsultationsCount || 0,
        icon: Calendar,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)",
        onClick: onNavigateToAppointments
      },
      {
        label: "Active Critical Alarms",
        value: loading ? "..." : doctorAlerts.length,
        icon: ClipboardList,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)"
      }
    ];
  } else if (user?.role === "NURSE") {
    cardConfigs = [
      {
        label: "Assigned Patients Count",
        value: loading ? "..." : clinicalStats.assignedPatientsCount,
        icon: UserCheck,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToPatients
      },
      {
        label: "Pending Tasks",
        value: loading ? "..." : clinicalStats.pendingTasksCount,
        icon: ClipboardList,
        color: "#19B5A5",
        bg: "rgba(25, 181, 165, 0.08)",
        onClick: onNavigateToPendingTasks
      },
      {
        label: "Medications Due",
        value: loading ? "..." : clinicalStats.medicationsDueCount,
        icon: Calendar,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)",
        onClick: onNavigateToMedicationsDue
      },
      {
        label: "Critical Patient Alerts",
        value: loading ? "..." : clinicalStats.criticalPatientsCount,
        icon: Activity,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)",
        onClick: onNavigateToCriticalAlerts
      }
    ];
  } else if (user?.role === "RECEPTIONIST") {
    cardConfigs = [
      {
        label: "Today's Walk-in Patients",
        value: loading ? "..." : stats.todayWalkIn || 0,
        icon: UserCheck,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: () => onNavigateToPatients("WALK_IN")
      },
      {
        label: "Today's Online Patients",
        value: loading ? "..." : stats.todayOnline || 0,
        icon: Users,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)",
        onClick: () => onNavigateToPatients("ONLINE")
      },
      {
        label: "Bed Occupancy Status",
        value: loading ? "..." : `${stats.occupiedBeds || 70} / ${stats.totalBeds || 100} Beds`,
        icon: Activity,
        color: "#19B5A5",
        bg: "rgba(25, 181, 165, 0.08)"
      },
      {
        label: "Admissions / Discharges",
        value: loading ? "..." : `${stats.todayAdmissions || 0} / ${stats.todayDischarges || 0} Today`,
        icon: ClipboardList,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)"
      },
      {
        label: "Emergency Patients",
        value: loading ? "..." : stats.emergencyPatients || 0,
        icon: ShieldAlert,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)"
      }
    ];
  } else if (user?.role === "LAB_TECHNICIAN") {
    cardConfigs = [
      {
        label: "Pending Lab Requests",
        value: loading ? "..." : stats.pendingLabsCount || 0,
        icon: ClipboardList,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)",
        onClick: onNavigateToLabs
      },
      {
        label: "Completed Reports Log",
        value: loading ? "..." : stats.completedLabsCount || 0,
        icon: UserCheck,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)",
        onClick: onNavigateToLabs
      },
      {
        label: "STAT Emergency Orders",
        value: loading ? "..." : stats.emergencyLabsCount || 0,
        icon: ShieldAlert,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)",
        onClick: onNavigateToLabs
      }
    ];
  } else if (user?.role === "PHARMACIST") {
    cardConfigs = [
      {
        label: "Pending Prescriptions",
        value: loading ? "..." : stats.pendingPrescriptions || 0,
        icon: ClipboardList,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Low Stock Drugs",
        value: loading ? "..." : stats.lowStockMedicines || 0,
        icon: AlertTriangle,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Expiring Batches (90d)",
        value: loading ? "..." : stats.expiringMedicines || 0,
        icon: ShieldAlert,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)",
        onClick: onNavigateToPharmacy
      },
      {
        label: "Pharmacy Total Revenue",
        value: loading ? "..." : `₹${stats.totalSales || 0}.00`,
        icon: DollarSign,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)"
      }
    ];
  } else if (user?.role === "CASHIER") {
    cardConfigs = [
      {
        label: "Total Sales Settled",
        value: loading ? "..." : `₹${stats.totalRevenue || 0}.00`,
        icon: DollarSign,
        color: "#39A96B",
        bg: "rgba(57, 169, 107, 0.08)",
        onClick: onNavigateToBilling
      },
      {
        label: "Pending Dues Ledger",
        value: loading ? "..." : `₹${stats.pendingDue || 0}.00`,
        icon: Clock,
        color: "#E6A23C",
        bg: "rgba(230, 162, 60, 0.08)",
        onClick: onNavigateToBilling
      },
      {
        label: "Dues Count Pending",
        value: loading ? "..." : pendingInvoicesList.length || 0,
        icon: ClipboardList,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
        onClick: onNavigateToBilling
      },
      {
        label: "Total Refund Claims",
        value: loading ? "..." : `₹${stats.refundedAmount || 0}.00`,
        icon: RotateCcw,
        color: "#E85D5D",
        bg: "rgba(232, 93, 93, 0.08)",
        onClick: onNavigateToBilling
      }
    ];
  } else {
    cardConfigs = [
      {
        label: "Registered Patients",
        value: loading ? "..." : stats.totalPatients,
        icon: UserCheck,
        color: "#087F8C",
        bg: "rgba(8, 127, 140, 0.08)",
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

      {/* Hospital Pulse Title */}
      <div className="section-header" style={{ marginBottom: "1rem", marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
          <span style={{ width: "8px", height: "8px", background: "var(--accent-primary)", borderRadius: "50%" }}></span>
          Hospital Pulse
        </h2>
      </div>

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

      {/* Hospital Flow Chart (Admissions -> Current Patients -> Discharges) */}
      {(user?.role === "ADMIN" || user?.role === "RECEPTIONIST") && (
        <div className="table-container" style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", boxShadow: "var(--card-shadow)" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 1rem 0", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={18} />
            <span>Hospital Flow & Bed Occupancy Trend (Last 7 Days)</span>
          </h3>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Chart Legend */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "150px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#39A96B" }} />
                <span>Admissions: <strong>{stats.todayAdmissions || 0} Today</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#087F8C" }} />
                <span>Current Inpatients: <strong>{stats.totalAdmitted || 0} Admitted</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#E6A23C" }} />
                <span>Discharges: <strong>{stats.todayDischarges || 0} Today</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-glass)", paddingTop: "0.5rem" }}>
                <span>Occupancy Rate: <strong>{stats.occupiedBeds || 70}%</strong></span>
              </div>
            </div>

            {/* SVG Interactive Line Graph */}
            <div style={{ flex: 1, minWidth: "280px", height: "150px" }}>
              <svg viewBox="0 0 500 150" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                <style>{`
                  @keyframes draw {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }
                `}</style>
                {/* Horizontal Gridlines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(0,0,0,0.05)" strokeDasharray="3,3" />
                <line x1="0" y1="75" x2="500" y2="75" stroke="rgba(0,0,0,0.05)" strokeDasharray="3,3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="rgba(0,0,0,0.05)" strokeDasharray="3,3" />
                
                {/* Line 1: Admissions (Green) */}
                <path
                  d={`M 10 120 L 90 100 L 170 110 L 250 85 L 330 95 L 410 ${Math.max(10, 120 - (stats.todayAdmissions || 0)*10 - 5)} L 490 ${Math.max(10, 120 - (stats.todayAdmissions || 0)*15)}`}
                  fill="none"
                  stroke="#39A96B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ strokeDasharray: "1000", strokeDashoffset: "1000", animation: "draw 2s forwards" }}
                />
                
                {/* Line 2: Current Patients (Teal) */}
                <path
                  d={`M 10 70 L 90 65 L 170 50 L 250 60 L 330 45 L 410 ${Math.max(10, 120 - (stats.totalAdmitted || 0)*15 - 15)} L 490 ${Math.max(10, 120 - (stats.totalAdmitted || 0)*25)}`}
                  fill="none"
                  stroke="#087F8C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ strokeDasharray: "1000", strokeDashoffset: "1000", animation: "draw 2s forwards 0.2s" }}
                />
                
                {/* Line 3: Discharges (Orange) */}
                <path
                  d={`M 10 140 L 90 130 L 170 135 L 250 110 L 330 125 L 410 ${Math.max(10, 120 - (stats.todayDischarges || 0)*10 - 2)} L 490 ${Math.max(10, 120 - (stats.todayDischarges || 0)*15)}`}
                  fill="none"
                  stroke="#E6A23C"
                  strokeWidth="3"
                  strokeLinecap="round"
                  style={{ strokeDasharray: "1000", strokeDashoffset: "1000", animation: "draw 2s forwards 0.4s" }}
                />

                {/* X Axis labels (Last 7 days) */}
                <text x="10" y="145" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">7d ago</text>
                <text x="90" y="145" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">5d ago</text>
                <text x="170" y="145" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">3d ago</text>
                <text x="250" y="145" fill="var(--text-secondary)" fontSize="8" textAnchor="middle">Yesterday</text>
                <text x="490" y="145" fill="var(--text-secondary)" fontSize="8" textAnchor="end">Today</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Visual Bed Occupancy Map Grid */}
      {(user?.role === "ADMIN" || user?.role === "RECEPTIONIST") && (
        <div className="table-container" style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", boxShadow: "var(--card-shadow)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.25rem 0", color: "var(--accent-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building size={20} />
            <span>Interactive Live Inpatient Ward Bed Map Grid</span>
          </h3>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem", fontSize: "0.8rem", fontWeight: 600 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#fee2e2", border: "1px solid #fecaca", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>🛏️</div>
              <span>Occupied Bed (Click to View Patient EHR Chart)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#ecfdf5", border: "1px solid #d1fae5", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>🛏️</div>
              <span>Vacant Bed (Available for New Admissions)</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {[
              { roomNo: "101", bedNo: "Bed A", type: "General" },
              { roomNo: "101", bedNo: "Bed B", type: "General" },
              { roomNo: "102", bedNo: "Bed A", type: "General" },
              { roomNo: "102", bedNo: "Bed B", type: "General" },
              { roomNo: "103", bedNo: "Bed A", type: "General" },
              { roomNo: "103", bedNo: "Bed B", type: "General" },
              { roomNo: "104", bedNo: "Bed A", type: "Semi-Private" },
              { roomNo: "104", bedNo: "Bed B", type: "Semi-Private" },
              { roomNo: "105", bedNo: "Bed A", type: "Private" },
              { roomNo: "105", bedNo: "Bed B", type: "Private" },
              { roomNo: "106", bedNo: "Bed A", type: "ICU" },
              { roomNo: "106", bedNo: "Bed B", type: "ICU" }
            ].map((bed) => {
              // Find matching active warded admission record
              const activeStay = admissionsList.find(a => {
                const isAdmitted = a.status === "ADMITTED";
                const isSameRoom = a.roomNo?.toLowerCase().includes(bed.roomNo.toLowerCase());
                const isSameBed = a.bedNo?.toLowerCase() === bed.bedNo.toLowerCase();
                return isAdmitted && isSameRoom && isSameBed;
              });

              return (
                <div 
                  key={`${bed.roomNo}-${bed.bedNo}`}
                  style={{
                    border: "1px solid var(--border-glass)",
                    borderRadius: "12px",
                    padding: "1rem",
                    background: activeStay ? "rgba(239, 68, 68, 0.05)" : "rgba(16, 185, 129, 0.05)",
                    borderColor: activeStay ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    transition: "all 0.2s",
                    cursor: activeStay ? "pointer" : "default"
                  }}
                  onClick={() => {
                    if (activeStay && activeStay.patient) {
                      handleOpenChart(activeStay.patient);
                    }
                  }}
                  title={activeStay ? `Occupied by ${activeStay.patient?.firstName} ${activeStay.patient?.lastName}. Click to open clinical chart.` : "Vacant Bed"}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
                      Room {bed.roomNo} / {bed.bedNo}
                    </span>
                    <span className="badge" style={{ 
                      fontSize: "0.6rem", 
                      padding: "0.15rem 0.35rem",
                      background: bed.type === "ICU" ? "#fee2e2" : bed.type === "Private" ? "#e0f2fe" : "#f1f5f9",
                      color: bed.type === "ICU" ? "#ef4444" : bed.type === "Private" ? "#0284c7" : "#475569",
                      fontWeight: 700
                    }}>
                      {bed.type}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.25rem" }}>
                    <div style={{ 
                      width: "42px", 
                      height: "42px", 
                      borderRadius: "10px", 
                      background: activeStay ? "#fee2e2" : "#ecfdf5", 
                      color: activeStay ? "#ef4444" : "#10b981", 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      fontSize: "1.5rem"
                    }}>
                      🛏️
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      {activeStay ? (
                        <>
                          <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {activeStay.patient?.firstName} {activeStay.patient?.lastName}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                            UHID: {activeStay.patient?.uhid}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#10b981" }}>
                            Vacant
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                            Ready for Admit
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ADMIN Revenue Analytics SVG Graph */}
      {user?.role === "ADMIN" && (
        <div className="table-container" style={{ marginTop: "1.5rem", padding: "1.5rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", boxShadow: "var(--card-shadow)" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity size={20} />
            <span>MediCore Hospital Revenue & Settle Trends (Last 30 Days)</span>
          </h3>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
              <span style={{ width: "12px", height: "12px", background: "#0ea5e9", borderRadius: "3px" }}></span>
              <span>Settled Consultation Dues (₹)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
              <span style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "3px" }}></span>
              <span>Settled Pharmacy Revenue (₹)</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
              <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "3px" }}></span>
              <span>Outstanding Billing Dues (₹)</span>
            </div>
          </div>

          <div style={{ position: "relative", width: "100%", height: "180px" }}>
            <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none">
              {/* Horizontal reference lines */}
              <line x1="10" y1="20" x2="490" y2="20" stroke="var(--border-glass)" strokeDasharray="3,3" />
              <line x1="10" y1="50" x2="490" y2="50" stroke="var(--border-glass)" strokeDasharray="3,3" />
              <line x1="10" y1="80" x2="490" y2="80" stroke="var(--border-glass)" strokeDasharray="3,3" />
              <line x1="10" y1="110" x2="490" y2="110" stroke="var(--border-glass)" strokeDasharray="3,3" />

              {/* Consultation Settled Trend Area & Line (Blue) */}
              <path 
                d="M 10 120 L 70 85 L 140 100 L 220 50 L 300 70 L 390 35 L 490 25" 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              <circle cx="70" cy="85" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
              <circle cx="220" cy="50" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
              <circle cx="390" cy="35" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
              <circle cx="490" cy="25" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />

              {/* Pharmacy Settled Trend Line (Green) */}
              <path 
                d="M 10 110 L 70 95 L 140 85 L 220 70 L 300 55 L 390 40 L 490 30" 
                fill="none" 
                stroke="#10b981" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              <circle cx="140" cy="85" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
              <circle cx="300" cy="55" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
              <circle cx="490" cy="30" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />

              {/* Outstanding Dues Trend Line (Orange) */}
              <path 
                d="M 10 70 L 70 80 L 140 60 L 220 90 L 300 75 L 390 110 L 490 120" 
                fill="none" 
                stroke="#f59e0b" 
                strokeWidth="2.5" 
                strokeLinecap="round"
              />
              <circle cx="220" cy="90" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
              <circle cx="390" cy="110" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />

              {/* Labels */}
              <text x="10" y="140" fill="var(--text-secondary)" fontSize="7">30d ago</text>
              <text x="140" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="middle">20d ago</text>
              <text x="300" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="middle">10d ago</text>
              <text x="490" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="end">Today (Live)</text>
            </svg>
          </div>
        </div>
      )}

      {/* What Needs Attention Title */}
      <div className="section-header" style={{ marginBottom: "1.25rem", marginTop: "2.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
          <span style={{ width: "8px", height: "8px", background: "var(--status-inactive-text)", borderRadius: "50%" }}></span>
          What Needs Attention
        </h2>
      </div>

      {/* Emergency alerts ticker for DOCTOR, NURSE, ADMIN, and RECEPTIONIST roles */}
      {(user?.role === "DOCTOR" || user?.role === "NURSE" || user?.role === "ADMIN" || user?.role === "RECEPTIONIST") && criticalAlerts.length > 0 && (
        <div className="emergency-ticker" style={{
          background: "var(--status-inactive-bg)",
          border: "1px solid var(--status-inactive-border)",
          color: "var(--status-inactive-text)",
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--card-shadow)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShieldAlert size={24} style={{ animation: "pulse 1.5s infinite", color: "var(--status-inactive-text)" }} />
            <div>
              <strong style={{ fontSize: "1rem", color: "var(--status-inactive-text)" }}>EMERGENCY VITAL ALARMS ({criticalAlerts.length})</strong>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", opacity: 0.95, color: "var(--text-primary)" }}>
                Patient {criticalAlerts[0].patient?.firstName} {criticalAlerts[0].patient?.lastName} in Room {criticalAlerts[0].patient?.roomNo || "N/A"} / Bed {criticalAlerts[0].patient?.bedNo || "N/A"} has critical vitals: {criticalAlerts[0].issues}
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenChart(criticalAlerts[0].patient)}
            className="btn btn-danger" 
            style={{ background: "var(--status-inactive-text)", color: "white", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
          >
            Open Chart Drawer
          </button>
        </div>
      )}

      {/* If Doctor, Nurse, Admin, or Receptionist has no critical alerts, render a clean stable block */}
      {(user?.role === "DOCTOR" || user?.role === "NURSE" || user?.role === "ADMIN" || user?.role === "RECEPTIONIST") && criticalAlerts.length === 0 && (
        <div style={{
          background: "var(--status-active-bg)",
          border: "1px solid var(--status-active-border)",
          color: "var(--status-active-text)",
          padding: "1rem 1.5rem",
          borderRadius: "12px",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}>
          <CheckCircle size={18} style={{ color: "var(--status-active-text)" }} />
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>All emergency patient care units are currently stable and monitored.</span>
        </div>
      )}

      {/* AI Operations Intelligence Hub */}
      {user?.role !== "SUPER_ADMIN" && (
        <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="table-container" style={{ padding: "1.75rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", boxShadow: "var(--card-shadow)", backdropFilter: "blur(18px) saturate(110%)", WebkitBackdropFilter: "blur(18px) saturate(110%)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "1rem", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                  <Activity size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>MediCore AI Clinical & Operational Intelligence</h3>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 600 }}>Real-time Operations Triage</span>
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
                  style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", background: "var(--accent-gradient)", border: "none", borderRadius: "8px" }}
                >
                  {isGeneratingReport ? "Compiling..." : "Generate AI Report"}
                </button>
              </div>
            </div>

            {aiLoading ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>Gathering clinical analytics and querying LLM gateway...</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: "12px", boxShadow: "var(--card-shadow)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>📈 OCCUPANCY FORECAST</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{aiInsights?.occupancyAnalysis || "Loading forecast..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: "12px", boxShadow: "var(--card-shadow)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--status-active-text)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>⏰ PATIENT LOAD PREDICTIONS</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{aiInsights?.loadPredictions || "Loading predictions..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: "12px", boxShadow: "var(--card-shadow)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--status-inactive-text)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>💊 CRITICAL INVENTORY & SHORTAGES</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{aiInsights?.stockAlerts || "Loading inventory alerts..."}</p>
                </div>
                <div style={{ padding: "1rem", background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", borderRadius: "12px", boxShadow: "var(--card-shadow)" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-secondary)", fontWeight: 700, display: "block", marginBottom: "0.4rem" }}>⭐ CLINICAL INSIGHTS</span>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-primary)", lineHeight: 1.4 }}>{aiInsights?.performanceInsights || "Loading performance insights..."}</p>
                </div>
              </div>
            )}

            {/* Generated Report View */}
            {generatedReport && (
              <div style={{ marginTop: "1.5rem", background: "var(--status-active-bg)", border: "1px solid var(--status-active-border)", padding: "1.25rem", borderRadius: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--status-active-border)", paddingBottom: "0.5rem", marginBottom: "0.75rem" }}>
                  <strong style={{ fontSize: "0.9rem", color: "var(--status-active-text)" }}>{generatedReport.title}</strong>
                  <span style={{ fontSize: "0.7rem", color: "var(--status-active-text)" }}>Generated: {generatedReport.generatedAt}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--status-active-text)", margin: "0 0 0.75rem 0", lineHeight: 1.4 }}>{generatedReport.summary}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.8rem", color: "var(--status-active-text)" }}>
                  {generatedReport.kpis.map((kpi, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                      <span>•</span>
                      <span>{kpi}</span>
                    </div>
                  ))}
                </div>
                <p style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed var(--status-active-border)", fontSize: "0.8rem", fontWeight: 700, color: "var(--status-active-text)", margin: 0 }}>
                  Strategic recommendation: {generatedReport.outlook}
                </p>
              </div>
            )}

            <div style={{ marginTop: "1rem", textAlign: "right", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600 }}>
              * Advisory suggestions only. Final medical and operational decisions rest with licensed hospital administrators.
            </div>
          </div>
        </div>
      )}

      {/* Clinical Lists rendered right on the Dashboard for NURSE role */}
      {user?.role === "NURSE" && (
        <>
          <div className="section-header" style={{ marginBottom: "1.25rem", marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
              <span style={{ width: "8px", height: "8px", background: "var(--accent-secondary)", borderRadius: "50%" }}></span>
              Today's Flow
            </h2>
          </div>
          <div style={{ 
            marginTop: "1rem", 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", 
            gap: "1.5rem",
            alignItems: "start"
          }}>
            {/* Left Column: Alarms & Medications */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Critical Vital Alerts Section */}
              <div className="table-container">
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-inactive-text)" }}>
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
                            <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{alert.patient?.uhid || "N/A"}</td>
                            <td style={{ fontWeight: 600 }}>{alert.patient?.firstName} {alert.patient?.lastName}</td>
                            <td>
                              Room {alert.patient?.roomNo || "N/A"} / Bed {alert.patient?.bedNo || "N/A"}
                            </td>
                            <td>
                              <span className="badge" style={{ background: "var(--status-inactive-bg)", color: "var(--status-inactive-text)", fontWeight: 700 }}>
                                {alert.issues}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button 
                                onClick={() => handleOpenChart(alert.patient)} 
                                className="btn btn-secondary" 
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", borderColor: "var(--status-inactive-text)", color: "var(--status-inactive-text)", background: "var(--status-inactive-bg)" }}
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
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-pending-text)" }}>
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
                            <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{med.patient?.uhid || "N/A"}</td>
                            <td style={{ fontWeight: 600 }}>{med.patient?.firstName} {med.patient?.lastName}</td>
                            <td>Room {med.patient?.roomNo || "N/A"} / Bed {med.patient?.bedNo || "N/A"}</td>
                            <td>
                              <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{med.medicationName}</div>
                            </td>
                            <td>{med.dosage} - {med.frequency}</td>
                            <td style={{ textAlign: "right" }}>
                              <button 
                                onClick={() => handleGiveMed(med._id)} 
                                className="btn btn-primary" 
                                style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "var(--status-active-text)", border: "1px solid var(--status-active-text)" }}
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
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-active-text)" }}>
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
                            <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{task.patient?.uhid || "N/A"}</td>
                            <td style={{ fontWeight: 600 }}>{task.patient?.firstName} {task.patient?.lastName}</td>
                            <td style={{ maxWidth: "300px", wordBreak: "break-all" }}>{task.instruction}</td>
                            <td>
                              <span className="badge" style={{ 
                                background: task.priority === "HIGH" ? "var(--status-inactive-bg)" : task.priority === "MEDIUM" ? "var(--status-pending-bg)" : "rgba(8, 127, 140, 0.08)", 
                                color: task.priority === "HIGH" ? "var(--status-inactive-text)" : task.priority === "MEDIUM" ? "var(--status-pending-text)" : "var(--text-secondary)",
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
        </>
      )}

      {/* Doctor Dashboard Profile & Timeline Schedule */}
      {user?.role === "DOCTOR" && (
        <>
          <div className="section-header" style={{ marginBottom: "1.25rem", marginTop: "2.5rem" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.3px", display: "flex", alignItems: "center", gap: "0.5rem", textTransform: "uppercase" }}>
              <span style={{ width: "8px", height: "8px", background: "var(--accent-secondary)", borderRadius: "50%" }}></span>
              Today's Flow
            </h2>
          </div>
          <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1.5rem", alignItems: "start" }}>
            {/* Left Side: Profile & Diagnostics Feed */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Clinical Profile Card */}
              <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)", margin: 0 }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: "0 0 1rem 0", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
                  Doctor Clinical Profile
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem" }}>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Staff Name:</span>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>Dr. {user?.firstName} {user?.lastName}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Department Specialization:</span>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>{user?.department || "General Medicine"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Primary Clinic Branch:</span>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>{user?.branch || "Main Clinic"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-secondary)" }}>Assigned Hospital:</span>
                    <strong style={{ display: "block", color: "var(--text-primary)" }}>{user?.hospital?.name || "MediCore AI"}</strong>
                  </div>
                </div>
              </div>

              {/* Configure Schedule Availability Card */}
              <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)", margin: 0 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <Clock size={18} style={{ color: "var(--accent-primary)" }} />
                  <span>Configure Schedule Availability</span>
                </h3>
                
                <form onSubmit={handleSaveAvailability} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div>
                    <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>Select Available Days</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => {
                        const isChecked = selectedDays.includes(day);
                        return (
                          <button
                            type="button"
                            key={day}
                            onClick={() => toggleDaySelection(day)}
                            style={{
                              padding: "0.3rem 0.5rem",
                              fontSize: "0.75rem",
                              borderRadius: "6px",
                              border: "1px solid",
                              borderColor: isChecked ? "var(--accent-primary)" : "var(--border-glass)",
                              background: isChecked ? "var(--accent-primary)" : "white",
                              color: isChecked ? "white" : "var(--text-primary)",
                              cursor: "pointer",
                              fontWeight: isChecked ? "700" : "500",
                              transition: "all 0.2s"
                            }}
                          >
                            {day.slice(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>Start Time</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="E.g. 09:00 AM"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>End Time</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="E.g. 05:00 PM"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        style={{ fontSize: "0.8rem", padding: "0.4rem" }}
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", marginTop: "0.5rem", width: "100%" }}
                  >
                    Save Availability Slots
                  </button>
                </form>
              </div>

              {/* Recent Lab Reports Card */}
              <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-secondary)", margin: 0 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Activity size={18} style={{ color: "var(--status-active-text)" }} />
                  <span>Recent Lab Results</span>
                </h3>
                {doctorLabs.length === 0 ? (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>No reports completed recently.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {doctorLabs.slice(0, 4).map((lab) => (
                      <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lab.testName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
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
                          style={{ background: "transparent", border: "none", color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
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
                <Clock size={20} style={{ color: "var(--accent-primary)" }} />
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
                            <strong style={{ color: "var(--accent-primary)" }}>{appt.timeSlot}</strong>
                          </td>
                          <td>
                            <span className="badge" style={{ background: "rgba(8, 127, 140, 0.08)", color: "var(--text-secondary)", fontWeight: 700 }}>
                              {appt.tokenNumber || "N/A"}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: "var(--text-primary)" }}>{appt.patient?.firstName} {appt.patient?.lastName}</strong>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {appt.patient?.uhid}</div>
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
        </>
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
                style={{ background: "var(--bg-secondary)", color: "var(--status-inactive-text)", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                Go to Lab Queue
              </button>
            </div>
          )}

          {/* Pending STAT Lab Worklist */}
          <div className="table-container">
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, padding: "1.5rem 1.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--status-inactive-text)" }}>
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
                          <strong style={{ color: "var(--text-primary)" }}>{l.patient?.firstName} {l.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {l.patient?.uhid}</div>
                        </td>
                        <td>Room {l.patient?.roomNo || "N/A"} / Bed {l.patient?.bedNo || "N/A"}</td>
                        <td>
                          <strong style={{ color: "var(--status-inactive-text)" }}>{l.testName}</strong>
                        </td>
                        <td>Dr. {l.prescribedBy?.firstName} {l.prescribedBy?.lastName}</td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToLabs()}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "var(--status-inactive-text)", border: "1px solid var(--status-inactive-text)" }}
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
          {/* AI Stock Predictive Replenishment Assistant Panel */}
          <div className="table-container" style={{ padding: "1.5rem", background: "rgba(217, 119, 6, 0.03)", border: "1px solid rgba(217, 119, 6, 0.15)", borderRadius: "16px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 0.5rem 0", color: "#d97706", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🔮 AI Pharmacy Stock Predictive Replenishment</span>
              <span className="badge" style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.65rem", padding: "0.15rem 0.35rem" }}>Predictive Analytics</span>
            </h3>
            <p style={{ margin: "0 0 1rem 0", fontSize: "0.825rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
              The MediCore operations assistant dynamically monitors seasonal consultation metrics, EMR prescription logs, and current warded bed counts. It automatically projects safety stock buffers and estimates required order quantities for low-supply pharmaceuticals.
            </p>
          </div>

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
                onClick={async () => {
                  try {
                    await updateMedicineStock(lowStockList[0]._id, lowStockList[0].stock + 100);
                    showToast("success", `Refilled ${lowStockList[0].name} buffer stock!`);
                    loadDashboardData();
                  } catch (err) {
                    showToast("error", "Failed to update stock");
                  }
                }}
                className="btn" 
                style={{ background: "var(--bg-secondary)", color: "var(--status-pending-text)", border: "none", fontWeight: 700, padding: "0.5rem 1rem", fontSize: "0.8rem" }}
              >
                ✨ AI Replenish Buffer (+100)
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
                          <strong style={{ color: "var(--text-primary)" }}>{m.name}</strong>
                        </td>
                        <td><code>{m.batchNumber}</code></td>
                        <td>${m.price}.00</td>
                        <td>
                          <strong style={{ color: "var(--status-inactive-text)" }}>{m.stock} Units left</strong>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={async () => {
                              try {
                                await updateMedicineStock(m._id, m.stock + 50);
                                showToast("success", `Successfully refilled 50 units of ${m.name} via AI Replenishment!`);
                                loadDashboardData();
                              } catch (err) {
                                showToast("error", "Failed to update stock");
                              }
                            }}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "var(--status-pending-text)", border: "1px solid var(--status-pending-text)" }}
                          >
                            ✨ AI Reorder (+50)
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
          {/* Interactive SVG Revenue & Performance Trends Graph */}
          <div className="table-container" style={{ padding: "1.5rem", background: "var(--bg-glass)", border: "1px solid var(--border-glass)", borderRadius: "16px", boxShadow: "var(--card-shadow)" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#0ea5e9", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Activity size={20} />
              <span>MediCore Hospital Revenue & Settle Trends (Last 30 Days)</span>
            </h3>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "12px", background: "#0ea5e9", borderRadius: "3px" }}></span>
                <span>Settled Consultation Dues (₹)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "12px", background: "#10b981", borderRadius: "3px" }}></span>
                <span>Settled Pharmacy Revenue (₹)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 700 }}>
                <span style={{ width: "12px", height: "12px", background: "#f59e0b", borderRadius: "3px" }}></span>
                <span>Outstanding Billing Dues (₹)</span>
              </div>
            </div>

            <div style={{ position: "relative", width: "100%", height: "180px" }}>
              <svg viewBox="0 0 500 150" width="100%" height="100%" preserveAspectRatio="none">
                {/* Horizontal reference lines */}
                <line x1="10" y1="20" x2="490" y2="20" stroke="var(--border-glass)" strokeDasharray="3,3" />
                <line x1="10" y1="50" x2="490" y2="50" stroke="var(--border-glass)" strokeDasharray="3,3" />
                <line x1="10" y1="80" x2="490" y2="80" stroke="var(--border-glass)" strokeDasharray="3,3" />
                <line x1="10" y1="110" x2="490" y2="110" stroke="var(--border-glass)" strokeDasharray="3,3" />

                {/* Consultation Settled Trend Area & Line (Blue) */}
                <path 
                  d="M 10 120 L 70 85 L 140 100 L 220 50 L 300 70 L 390 35 L 490 25" 
                  fill="none" 
                  stroke="#0ea5e9" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <circle cx="70" cy="85" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
                <circle cx="220" cy="50" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
                <circle cx="390" cy="35" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />
                <circle cx="490" cy="25" r="4.5" fill="#0ea5e9" stroke="white" strokeWidth="1.5" />

                {/* Pharmacy Settled Trend Line (Green) */}
                <path 
                  d="M 10 110 L 70 95 L 140 85 L 220 70 L 300 55 L 390 40 L 490 30" 
                  fill="none" 
                  stroke="#10b981" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <circle cx="140" cy="85" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                <circle cx="300" cy="55" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />
                <circle cx="490" cy="30" r="4.5" fill="#10b981" stroke="white" strokeWidth="1.5" />

                {/* Outstanding Dues Trend Line (Orange) */}
                <path 
                  d="M 10 70 L 70 80 L 140 60 L 220 90 L 300 75 L 390 110 L 490 120" 
                  fill="none" 
                  stroke="#f59e0b" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                />
                <circle cx="220" cy="90" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />
                <circle cx="390" cy="110" r="4.5" fill="#f59e0b" stroke="white" strokeWidth="1.5" />

                {/* Labels */}
                <text x="10" y="140" fill="var(--text-secondary)" fontSize="7">30d ago</text>
                <text x="140" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="middle">20d ago</text>
                <text x="300" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="middle">10d ago</text>
                <text x="490" y="140" fill="var(--text-secondary)" fontSize="7" textAnchor="end">Today (Live)</text>
              </svg>
            </div>
          </div>

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
                          <strong style={{ color: "var(--text-primary)" }}>{inv.patient?.firstName} {inv.patient?.lastName}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {inv.patient?.uhid}</div>
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
                        <td><strong style={{ color: "var(--status-inactive-text)" }}>₹{inv.amount}.00</strong></td>
                        <td style={{ textAlign: "right" }}>
                          <button 
                            onClick={() => onNavigateToBilling()}
                            className="btn btn-primary" 
                            style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", background: "var(--status-active-text)", border: "1px solid var(--status-active-text)" }}
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
          <div style={{ marginBottom: "2rem", background: "rgba(8, 127, 140, 0.04)", border: "1px solid var(--border-glass)", padding: "1.25rem", borderRadius: "12px" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.75rem 0", display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <span>📲 AI Frontdesk Operations Desk Optimizer</span>
              <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "#dbeafe", color: "var(--accent-primary)", borderRadius: "4px" }}>Advisory AI</span>
            </h4>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              {/* Slot Advising */}
              <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>Doctor Slot Recommender</span>
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
                  <div style={{ marginTop: "0.75rem", background: "rgba(8, 127, 140, 0.05)", border: "1px solid var(--border-glass)", padding: "0.75rem", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, display: "block" }}>RECOMMENDED TIMESLOTS:</span>
                    <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
                      {schedulingSuggestions.recommendedSlots?.map((slot, i) => (
                        <span key={i} className="badge" style={{ background: "var(--accent-primary)", color: "white", fontSize: "0.7rem", fontWeight: 700 }}>{slot}</span>
                      ))}
                    </div>
                    <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.7rem", color: "var(--text-secondary)" }}>{schedulingSuggestions.note}</span>
                  </div>
                )}

                {queuePrediction && (
                  <div style={{ marginTop: "0.5rem", background: "var(--status-active-bg)", border: "1px solid var(--status-active-border)", padding: "0.75rem", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--status-active-text)", fontWeight: 700, display: "block" }}>QUEUE WAITING TIME PREDICTION:</span>
                    <div style={{ fontSize: "0.8rem", color: "var(--status-active-text)", margin: "0.2rem 0", fontWeight: 800 }}>
                      ⏰ Estimated Wait: {queuePrediction.estimatedWaitTime} ({queuePrediction.activeQueueSize} patients)
                    </div>
                    <span style={{ display: "block", fontSize: "0.7rem", color: "var(--text-secondary)" }}>{queuePrediction.optimizationAdvice}</span>
                  </div>
                )}
              </div>

              {/* Queue Optimizer */}
              <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "10px", border: "1px solid var(--border-glass)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.5rem" }}>Queue Congestion Analyzer</span>
                  <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>Analyze today's check-ins, token queues, and waiting delays to optimize flow.</p>
                </div>
                
                <div>
                  <button 
                    onClick={handleOptimizeQueue}
                    disabled={queueLoading}
                    className="btn btn-secondary"
                    style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem", width: "100%", borderColor: "var(--accent-primary)", color: "var(--accent-primary)" }}
                  >
                    {queueLoading ? "Optimizing Queue..." : "Run AI Queue Optimization"}
                  </button>

                  {queueInsights && (
                    <div style={{ marginTop: "0.75rem", background: "var(--status-active-bg)", border: "1px solid var(--status-active-border)", padding: "0.75rem", borderRadius: "8px" }}>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--status-active-text)", lineHeight: 1.4 }}>{queueInsights.optimizationTip}</p>
                      <span style={{ fontSize: "0.7rem", color: "var(--status-active-text)", fontWeight: 700, display: "block", marginTop: "0.25rem" }}>Average Patient Wait Time: {queueInsights.averageWaitTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Daily Appointment Scheduling Grid */}
          <div className="table-container" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1rem 0", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-primary)" }}>
              <Calendar size={20} />
              <span>Today's Daily Scheduling Board & Patient Check-ins</span>
            </h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
              {["09:00 AM - 10:00 AM", "10:00 AM - 11:00 AM", "11:00 AM - 12:00 PM", "12:00 PM - 01:00 PM", "02:00 PM - 03:00 PM", "03:00 PM - 04:00 PM", "04:00 PM - 05:00 PM"].map((slot) => {
                const appt = appointmentsList.find(a => {
                  const isSameSlot = a.timeSlot === slot;
                  const isSameDay = new Date(a.appointmentDate).toDateString() === new Date().toDateString();
                  return isSameSlot && isSameDay && a.status !== "CANCELLED";
                });
                
                return (
                  <div key={slot} style={{ 
                    border: "1px solid var(--border-glass)", 
                    borderRadius: "12px", 
                    padding: "1rem", 
                    background: appt ? (appt.status === "CHECKED_IN" ? "#ecfdf5" : "#eff6ff") : "white",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: "120px",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }}>
                    <div>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>{slot}</span>
                      {appt ? (
                        <div style={{ marginTop: "0.5rem" }}>
                          <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)", display: "block" }}>{appt.patient?.firstName} {appt.patient?.lastName}</strong>
                          <span style={{ fontSize: "0.7rem", color: "var(--accent-primary)" }}>Dr. {appt.doctor?.firstName} {appt.doctor?.lastName}</span>
                          <button 
                            type="button" 
                            onClick={() => handlePrintConsolidatedReport(appt.patient?._id)} 
                            style={{ display: "block", background: "none", border: "none", color: "var(--accent-primary)", fontSize: "0.7rem", padding: 0, marginTop: "0.25rem", cursor: "pointer", textDecoration: "underline", fontWeight: 600 }}
                          >
                            📄 Export Full EMR Dossier
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", display: "block", marginTop: "0.5rem" }}>🟢 Slot Available</span>
                      )}
                    </div>
                    
                    <div style={{ marginTop: "0.75rem" }}>
                      {appt ? (
                        (appt.status === "BOOKED" || appt.status === "SCHEDULED") ? (
                          <button 
                            type="button"
                            onClick={() => handleCheckIn(appt._id)}
                            className="btn btn-primary"
                            style={{ width: "100%", padding: "0.3rem 0.5rem", fontSize: "0.75rem", background: "var(--status-active-text)", border: "1px solid var(--status-active-text)" }}
                          >
                            Check In Patient
                          </button>
                        ) : (
                          <span style={{ fontSize: "0.7rem", color: "var(--status-active-text)", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.2rem" }}>
                            ✓ Checked In
                          </span>
                        )
                      ) : (
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedSlot(slot);
                            setIsApptModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ width: "100%", padding: "0.3rem 0.5rem", fontSize: "0.75rem", color: "var(--accent-primary)", borderColor: "var(--accent-primary)" }}
                        >
                          Book Slot
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointment Booking Modal */}
          {isApptModalOpen && (
            <div className="modal-overlay" style={{ zIndex: 999 }}>
              <div className="modal-card" style={{ maxWidth: "450px" }}>
                <div className="modal-header">
                  <h3>Schedule Appointment Slot</h3>
                  <button type="button" className="action-btn" onClick={() => setIsApptModalOpen(false)}>×</button>
                </div>
                <form onSubmit={handleSaveAppointment}>
                  <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group">
                      <label>Time Slot Selected</label>
                      <input type="text" className="form-control" value={selectedSlot} disabled />
                    </div>
                    <div className="form-group">
                      <label>Appointment Date</label>
                      <input type="date" className="form-control" value={apptDate} onChange={(e) => setApptDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Select Patient *</label>
                      <select 
                        className="form-control" 
                        value={selectedApptPatient} 
                        onChange={(e) => setSelectedApptPatient(e.target.value)} 
                        required
                      >
                        <option value="">-- Choose Patient --</option>
                        {allPatientsList.map(p => (
                          <option key={p._id} value={p._id}>{p.firstName} {p.lastName} (UHID: {p.uhid})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Select Doctor *</label>
                      <select 
                        className="form-control" 
                        value={selectedApptDoctor} 
                        onChange={(e) => setSelectedApptDoctor(e.target.value)} 
                        required
                      >
                        <option value="">-- Choose Doctor --</option>
                        {doctors.map(d => (
                          <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName} ({d.department})</option>
                        ))}
                      </select>
                      {selectedApptDoctor && (() => {
                        const docObj = doctors.find(d => d._id === selectedApptDoctor);
                        if (!docObj) return null;
                        const daysStr = docObj.availability?.days?.join(", ") || "Monday, Tuesday, Wednesday, Thursday, Friday";
                        const timeStr = `${docObj.availability?.startTime || "09:00 AM"} - ${docObj.availability?.endTime || "05:00 PM"}`;
                        return (
                          <div style={{ marginTop: "0.5rem", background: "rgba(8, 127, 140, 0.05)", border: "1px solid var(--border-glass)", padding: "0.6rem 0.85rem", borderRadius: "8px", fontSize: "0.75rem" }}>
                            <span style={{ color: "var(--accent-primary)", fontWeight: 700, display: "block" }}>🧑‍⚕️ DOCTOR AVAILABILITY:</span>
                            <span style={{ display: "block", marginTop: "0.25rem" }}>🗓️ Days: <strong>{daysStr}</strong></span>
                            <span style={{ display: "block" }}>⏰ Hours: <strong>{timeStr}</strong></span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setIsApptModalOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Schedule Patient</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCheck size={22} style={{ color: "var(--accent-primary)" }} />
              <span>Reception Patient Desk</span>
            </h3>
            <button className="btn btn-primary" onClick={() => setIsPatientModalOpen(true)}>
              <Plus size={16} />
              <span>Register Walk-in Patient</span>
            </button>
          </div>

          {/* Quick Search */}
          <div style={{ position: "relative", marginBottom: "1.5rem" }}>
            <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
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
                        <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
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
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => handlePrintConsolidatedReport(p._id)}
                              className="btn btn-primary" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "var(--accent-primary)", border: "1px solid #0284c7" }}
                            >
                              📄 Export Dossier
                            </button>
                            <button 
                              onClick={() => onNavigateToPatients()}
                              className="btn btn-secondary" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Open Chart File
                            </button>
                          </div>
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
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentPatients.map((p) => (
                      <tr key={p._id}>
                        <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>
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
                          <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                            <button 
                              onClick={() => handlePrintConsolidatedReport(p._id)}
                              className="btn btn-primary" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", background: "var(--accent-primary)", border: "1px solid #0284c7" }}
                            >
                              📄 Export Dossier
                            </button>
                            <button 
                              onClick={() => onNavigateToPatients()}
                              className="btn btn-secondary" 
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                            >
                              Open Chart File
                            </button>
                          </div>
                        </td>
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
            <UserCheck size={20} style={{ color: "var(--accent-primary)" }} />
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
                      <td style={{ fontWeight: 700, color: "var(--accent-primary)" }}>{patient.uhid || "N/A"}</td>
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
              background: "var(--bg-secondary)",
              overflow: "hidden"
            }}
          >
            {/* Drawer Header */}
            <div 
              style={{ 
                borderBottom: "1px solid var(--border-glass)", 
                padding: "1.25rem 1.75rem", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center" 
              }}
            >
              <div>
                <span className="badge" style={{ background: "#e0f2fe", color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
                  {selectedPatient.uhid || "PATIENT UHID"}
                </span>
                <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
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
                  color: "var(--text-secondary)",
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
                background: "rgba(8, 127, 140, 0.04)", 
                borderBottom: "1px solid var(--border-glass)", 
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
            <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem", background: "rgba(8, 127, 140, 0.04)" }}>
              {chartLoading ? (
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading patient clinical summaries...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW & BED ALLOCATION */}
                  {activeDrawerTab === "overview" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Bed Allocation & Doctor Assignment</h4>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Current Vitals Summary</h4>
                        {clinicalData?.vitals && clinicalData.vitals.length > 0 ? (
                          (() => {
                            const latest = clinicalData.vitals[0];
                            return (
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "1rem" }}>
                                <div style={{ background: "rgba(8, 127, 140, 0.04)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Temperature</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.temperature}°F</div>
                                </div>
                                <div style={{ background: "rgba(8, 127, 140, 0.04)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Blood Pressure</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.bp} mmHg</div>
                                </div>
                                <div style={{ background: "rgba(8, 127, 140, 0.04)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Heart Rate</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.heartRate || "N/A"} bpm</div>
                                </div>
                                <div style={{ background: latest.spo2 && latest.spo2 < 95 ? "#fef2f2" : "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: latest.spo2 && latest.spo2 < 95 ? "1px solid #fecaca" : "1px solid #e2e8f0" }}>
                                  <div style={{ fontSize: "0.75rem", color: latest.spo2 && latest.spo2 < 95 ? "#dc2626" : "#64748b" }}>SpO2 Level</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                    <span style={{ fontSize: "1.1rem", fontWeight: 700, color: latest.spo2 && latest.spo2 < 95 ? "#dc2626" : "#0f172a" }}>{latest.spo2 || "N/A"}%</span>
                                    {latest.spo2 && latest.spo2 < 95 && <ShieldAlert size={16} className="text-red-500" />}
                                  </div>
                                </div>
                                <div style={{ background: "rgba(8, 127, 140, 0.04)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Respiratory Rate</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.respiratoryRate || "N/A"}/min</div>
                                </div>
                                <div style={{ background: "rgba(8, 127, 140, 0.04)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Blood Sugar</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.sugar || "N/A"} mg/dL</div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>No vitals recorded yet. Go to the Vitals tab to record vitals.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: VITALS MANAGEMENT */}
                  {activeDrawerTab === "vitals" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Record New Patient Vitals</h4>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Vitals History Log</h4>
                        {!clinicalData?.vitals || clinicalData.vitals.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No vitals history logged.</p>
                        ) : (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
                              <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-glass)", background: "rgba(8, 127, 140, 0.04)", textAlign: "left" }}>
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
                                  <tr key={v._id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                    <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{new Date(v.createdAt).toLocaleString()}</td>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Medications</h4>
                        {clinicalData?.medications?.map((med) => (
                          <div key={med._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem" }}>
                            <div>
                              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{med.medicationName}</strong>
                              <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{med.dosage} - {med.frequency}</div>
                            </div>
                            {med.status === "PENDING" ? (
                              <button onClick={() => handleGiveMed(med._id)} className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "var(--status-active-text)", border: "1px solid var(--status-active-text)" }}>
                                Mark Given
                              </button>
                            ) : (
                              <span className="badge" style={{ background: "var(--status-active-bg)", color: "var(--status-active-text)", fontWeight: 700 }}>
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
                        <div key={inst._id} style={{ border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", background: "var(--bg-secondary)" }}>
                          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{inst.instruction}</p>
                          {inst.status === "PENDING" ? (
                            <button onClick={() => handleCompleteTask(inst._id)} className="btn btn-secondary" style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}>
                              Mark Completed
                            </button>
                          ) : (
                            <span className="badge" style={{ background: "#f1f5f9", color: "var(--text-secondary)" }}>COMPLETED</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 5: NOTES */}
                  {activeDrawerTab === "notes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Add Observation Note</h4>
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
                          <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                            <button type="submit" className="btn btn-primary" disabled={submittingAction}>
                              Save Note
                            </button>
                            <button 
                              type="button" 
                              onClick={handleFetchIcdSuggestions} 
                              className="btn btn-secondary" 
                              disabled={loadingIcd}
                              style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}
                            >
                              <span>{loadingIcd ? "Analyzing Note..." : "✨ AI ICD-10 Coding suggestions"}</span>
                            </button>
                          </div>
                        </form>

                        {icdSuggestions.length > 0 && (
                          <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(2, 132, 199, 0.05)", border: "1px solid rgba(2, 132, 199, 0.2)", borderRadius: "8px" }}>
                            <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#0284c7", fontWeight: 700 }}>Recommended Diagnostic ICD-10 Codes:</h5>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                              {icdSuggestions.map((item) => (
                                <div key={item.code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", background: "var(--bg-secondary)", padding: "0.5rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-glass)" }}>
                                  <span><strong>{item.code}</strong>: {item.description}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleApplyIcd(item)}
                                    className="btn btn-primary" 
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", background: "#0284c7", border: "none" }}
                                  >
                                    Apply to Note
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        {clinicalData?.notes?.map((n) => (
                          <div key={n._id} style={{ borderLeft: "3px solid #0284c7", paddingLeft: "0.75rem", marginBottom: "1rem" }}>
                            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem" }}>{n.note}</p>
                            <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Logged on {new Date(n.createdAt).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: LABS */}
                  {activeDrawerTab === "labs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {clinicalData?.labs?.map((lab) => (
                        <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", marginBottom: "0.75rem", background: "var(--bg-secondary)" }}>
                          <div>
                            <strong style={{ fontSize: "0.95rem" }}>{lab.testName}</strong>
                          </div>
                          {lab.status === "PENDING" ? (
                            <button onClick={() => handleCollectLabSample(lab._id)} className="btn btn-primary" style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "var(--accent-primary)" }}>
                              Collect Sample
                            </button>
                          ) : (
                            <span className="badge" style={{ background: "var(--status-active-bg)", color: "var(--status-active-text)", fontWeight: 700 }}>
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

export default Dashboard;
