import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Search, 
  Plus, 
  Phone, 
  Droplet, 
  ShieldAlert, 
  CheckCircle, 
  AlertCircle,
  ClipboardList,
  Activity,
  Calendar,
  User,
  Clock,
  Save,
  Building,
  Pill,
  Stethoscope,
  FileText
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const VitalsIcon = Activity;
import { 
  fetchUsers, 
  createUser,
  fetchPatientClinicalSummary,
  addPatientVitals,
  addNursingNote,
  administerMedication,
  completeInstruction,
  collectLabSample,
  updatePatientAssignment,
  addConsultation,
  addPrescription,
  addDoctorInstruction,
  orderLabTest,
  fetchSystemIp,
  updatePatientClinicalTags,
  addPatientDocument,
  fetchAIMedicalScribe,
  fetchAIDoctorDiagnosis,
  fetchAIPrescriptionCheck,
  fetchAIPatientSummary,
  fetchAIMedicalReportSummary,
  fetchAIVitalsEmergencyCheck
} from "../services/api";
import { AIVoiceAssistant } from "../components/common/AIVoiceAssistant";

const PatientManagement = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [systemIp, setSystemIp] = useState("localhost");

  // Clinical Charting Drawer State
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [clinicalData, setClinicalData] = useState(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState("overview");
  const [doctors, setDoctors] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Forms
  const [formData, setFormData] = useState({
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

  const [registrationTypeFilter, setRegistrationTypeFilter] = useState(() => {
    return localStorage.getItem("patient_filter") || "ALL";
  });

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
  const [submittingAction, setSubmittingAction] = useState(false);

  // EMR Tagging & Document Upload states
  const [allergiesInput, setAllergiesInput] = useState("");
  const [chronicDiseasesInput, setChronicDiseasesInput] = useState("");
  const [vaccinationsInput, setVaccinationsInput] = useState("");
  const [documentName, setDocumentName] = useState("");

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const loadPatients = async () => {
    try {
      setLoading(true);
      const params = { role: "PATIENT", search, limit: 150 };
      if (registrationTypeFilter !== "ALL") {
        params.registrationType = registrationTypeFilter;
      }
      const res = await fetchUsers(params);
      setPatients(res.data || []);
    } catch (err) {
      console.error("Failed to fetch patients", err);
      showToast("error", "Failed to load patient records");
    } finally {
      setLoading(false);
    }
  };

  // Doctor EMR form states
  const [diagnosisInput, setDiagnosisInput] = useState("");
  const [clinicalNotesInput, setClinicalNotesInput] = useState("");
  const [followUpDateInput, setFollowUpDateInput] = useState("");

  // AI Feature States
  const [aiPatientSummary, setAiPatientSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [aiScribeShorthand, setAiScribeShorthand] = useState("");
  const [aiScribeLoading, setAiScribeLoading] = useState(false);
  const [aiDiagnosisSuggestions, setAiDiagnosisSuggestions] = useState(null);
  const [aiDiagnosisLoading, setAiDiagnosisLoading] = useState(false);
  const [aiPrescriptionCheckResult, setAiPrescriptionCheckResult] = useState(null);
  const [aiPrescriptionChecking, setAiPrescriptionChecking] = useState(false);
  const [aiReportSummary, setAiReportSummary] = useState(null);
  const [aiReportLoading, setAiReportLoading] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationName: "",
    dosage: "500mg",
    frequency: "TDS (Thrice daily)"
  });

  const [instructionForm, setInstructionForm] = useState({
    instruction: "",
    priority: "MEDIUM"
  });

  const [labForm, setLabForm] = useState({
    testName: ""
  });

  const loadDoctors = async () => {
    try {
      const res = await fetchUsers({ role: "DOCTOR", limit: 100 });
      setDoctors(res.data || []);
    } catch (err) {
      console.error("Failed to load doctors", err);
    }
  };

  const handleExportCSV = () => {
    if (patients.length === 0) return;
    const headers = ["UHID", "Name", "Mobile", "Email", "Gender", "Blood Group", "Registration Type", "Registered By", "Joined Date"];
    const rows = patients.map(p => [
      p.uhid,
      `"${p.firstName} ${p.lastName}"`,
      p.mobile,
      p.email,
      p.gender,
      p.bloodGroup || "N/A",
      p.registrationType || "WALK_IN",
      p.registeredBy || "Receptionist",
      new Date(p.createdAt).toLocaleDateString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `patients_report_${registrationTypeFilter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Patients Registry Report - AI Hospital</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #0284c7; color: white; }
            h2 { margin: 0; color: #0f172a; }
            p { font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <h2>Patients Clinical Registry Report (${registrationTypeFilter})</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Patient ID (UHID)</th>
                <th>Full Name</th>
                <th>Mobile Number</th>
                <th>Gender</th>
                <th>Registration Mode</th>
                <th>Staff Registered By</th>
              </tr>
            </thead>
            <tbody>
              \${patients.map(p => \`
                <tr>
                  <td><strong>\${p.uhid}</strong></td>
                  <td>\${p.firstName} \${p.lastName}</td>
                  <td>\${p.mobile}</td>
                  <td>\${p.gender}</td>
                  <td>\${p.registrationType || "WALK_IN"}</td>
                  <td>\${p.registeredBy || "Receptionist"}</td>
                </tr>
              \`).join("")}
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

  useEffect(() => {
    localStorage.removeItem("patient_filter");

    const handleClear = () => {
      setRegistrationTypeFilter("ALL");
    };

    const handleFilterChange = (e) => {
      if (e.detail) {
        setRegistrationTypeFilter(e.detail);
      }
    };

    window.addEventListener("clear_patient_filter", handleClear);
    window.addEventListener("patient_filter_changed", handleFilterChange);

    return () => {
      window.removeEventListener("clear_patient_filter", handleClear);
      window.removeEventListener("patient_filter_changed", handleFilterChange);
    };
  }, []);

  useEffect(() => {
    loadPatients();
  }, [search, registrationTypeFilter]);

  useEffect(() => {
    loadDoctors();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser({ ...formData, role: "PATIENT" });
      showToast("success", "New patient registered successfully with auto UHID");
      setIsModalOpen(false);
      setFormData({
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
      loadPatients();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to register patient");
    }
  };

  const loadAiPatientSummary = async (patientId) => {
    try {
      setAiSummaryLoading(true);
      const res = await fetchAIPatientSummary(patientId);
      setAiPatientSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const loadAiDiagnosisSuggestions = async (vitals, complaints) => {
    if (user?.role !== "DOCTOR") return;
    try {
      setAiDiagnosisLoading(true);
      const res = await fetchAIDoctorDiagnosis(vitals || {}, complaints || "General Checkup");
      setAiDiagnosisSuggestions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAiDiagnosisLoading(false);
    }
  };

  const handleRunMedicalScribe = async () => {
    if (!aiScribeShorthand.trim()) {
      showToast("error", "Please enter shorthand clinical notes.");
      return;
    }
    try {
      setAiScribeLoading(true);
      const res = await fetchAIMedicalScribe(aiScribeShorthand);
      if (res.data) {
        setDiagnosisInput(res.data.diagnosis || "");
        setClinicalNotesInput(res.data.clinicalNotes || "");
        if (res.data.followUpRecommend) {
          showToast("success", `Follow-up Advice: ${res.data.followUpRecommend}`);
        }
        showToast("success", "AI Consultation note structured!");
      }
    } catch (err) {
      showToast("error", "AI Scribe transcription failed");
    } finally {
      setAiScribeLoading(false);
    }
  };

  const handleCheckPrescription = async () => {
    if (!prescriptionForm.medicationName.trim()) {
      showToast("error", "Select or write medication first.");
      return;
    }
    try {
      setAiPrescriptionChecking(true);
      const res = await fetchAIPrescriptionCheck(
        [{ medicationName: prescriptionForm.medicationName, dosage: prescriptionForm.dosage, frequency: prescriptionForm.frequency }],
        selectedPatient.allergies || []
      );
      setAiPrescriptionCheckResult(res.data);
      showToast("success", "AI safety screen completed!");
    } catch (err) {
      showToast("error", "Prescription safety screen failed.");
    } finally {
      setAiPrescriptionChecking(false);
    }
  };

  const handleSummarizeDocument = async (docName) => {
    try {
      setAiReportLoading(true);
      let mockText = "Document scan summary. Parameter profiles show standard bounds.";
      if (docName.toLowerCase().includes("blood") || docName.toLowerCase().includes("cbc")) {
        mockText = "CBC Report: Hemoglobin is 8.5 g/dL (Low), WBC: 9500 (Normal), Sugar: 120 (Normal).";
      } else if (docName.toLowerCase().includes("x-ray") || docName.toLowerCase().includes("chest")) {
        mockText = "Chest X-Ray: Mild vascular congestion in lower lung base. Heart chambers normal size.";
      }
      const res = await fetchAIMedicalReportSummary(docName, mockText);
      setAiReportSummary(res.data);
      showToast("success", "AI Report summary compiled!");
    } catch (err) {
      showToast("error", "Failed to compile AI summary");
    } finally {
      setAiReportLoading(false);
    }
  };

  // Load Patient Clinical Summary
  const handleOpenChart = async (patient) => {
    setSelectedPatient(patient);
    setActiveDrawerTab(user?.role === "DOCTOR" ? "consultation" : "overview");
    setDiagnosisInput("");
    setClinicalNotesInput("");
    setFollowUpDateInput("");
    setAiScribeShorthand("");
    setAiPatientSummary(null);
    setAiDiagnosisSuggestions(null);
    setAiPrescriptionCheckResult(null);
    setAiReportSummary(null);
    setPrescriptionForm({
      medicationName: "",
      dosage: "500mg",
      frequency: "TDS (Thrice daily)"
    });
    setInstructionForm({
      instruction: "",
      priority: "MEDIUM"
    });
    setLabForm({
      testName: ""
    });
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
        setSelectedPatient(res.data.patient);
        setAllergiesInput(res.data.patient.allergies?.join(", ") || "");
        setChronicDiseasesInput(res.data.patient.chronicDiseases?.join(", ") || "");
        setVaccinationsInput(res.data.patient.vaccinations?.join(", ") || "");
        setAssignmentForm({
          roomNo: res.data.patient.roomNo || "N/A",
          bedNo: res.data.patient.bedNo || "N/A",
          assignedDoctor: res.data.patient.assignedDoctor?._id || res.data.patient.assignedDoctor || "",
        });
      }
      loadAiPatientSummary(patient._id);
      const latestVitals = res.data?.vitalsRecord?.[0] || {};
      const complaints = res.data?.nursingNotes?.[0]?.note || "General checkup";
      loadAiDiagnosisSuggestions(latestVitals, complaints);
    } catch (err) {
      showToast("error", "Failed to load patient clinical history");
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
        setAllergiesInput(res.data.patient.allergies?.join(", ") || "");
        setChronicDiseasesInput(res.data.patient.chronicDiseases?.join(", ") || "");
        setVaccinationsInput(res.data.patient.vaccinations?.join(", ") || "");
      }
      loadAiPatientSummary(selectedPatient._id);
      const latestVitals = res.data?.vitalsRecord?.[0] || {};
      const complaints = res.data?.nursingNotes?.[0]?.note || "General checkup";
      loadAiDiagnosisSuggestions(latestVitals, complaints);
    } catch (err) {
      console.error("Failed to reload chart", err);
    }
  };

  // Vitals Save
  const handleSaveVitals = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const vitalCheck = await fetchAIVitalsEmergencyCheck(vitalsForm);
      if (vitalCheck.data?.isEmergency) {
        showToast("error", `🚨 EMERGENCY RED ALERT: ${vitalCheck.data.alertMessage}`);
        alert(`🚨 AI CLINICAL EMERGENCY DETECTED:\n\n${vitalCheck.data.alertMessage}\n\nPlease take immediate medical action!`);
      }
      await addPatientVitals(selectedPatient._id, vitalsForm);
      showToast("success", "Patient vitals recorded successfully");
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
      showToast("error", err.response?.data?.message || "Failed to save vitals");
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
      showToast("success", "Ward and Doctor allocation updated successfully");
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update allocation");
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
      showToast("success", "Nursing note saved successfully");
      setNoteText("");
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save note");
    } finally {
      setSubmittingAction(false);
    }
  };

  // MAR Administer
  const handleAdministerMed = async (medId) => {
    try {
      await administerMedication(medId, "GIVEN");
      showToast("success", "Prescription marked as GIVEN");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to update medication log");
    }
  };

  // Task Complete
  const handleCompleteInstruction = async (instId) => {
    try {
      await completeInstruction(instId);
      showToast("success", "Doctor instruction completed");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to update instruction status");
    }
  };

  // Lab Sample Collect
  const handleCollectLabSample = async (labId) => {
    try {
      await collectLabSample(labId);
      showToast("success", "Lab request status updated: Sample Collected");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to update lab collection status");
    }
  };

  // Doctor EMR Save Handlers
  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!diagnosisInput.trim()) return;
    try {
      setSubmittingAction(true);
      await addConsultation(selectedPatient._id, {
        diagnosis: diagnosisInput,
        clinicalNotes: clinicalNotesInput,
        followUpDate: followUpDateInput || null
      });
      showToast("success", "EMR Consultation recorded successfully");
      setDiagnosisInput("");
      setClinicalNotesInput("");
      setFollowUpDateInput("");
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to record consultation");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveClinicalTags = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      const allergies = allergiesInput.split(",").map(s => s.trim()).filter(Boolean);
      const chronicDiseases = chronicDiseasesInput.split(",").map(s => s.trim()).filter(Boolean);
      const vaccinations = vaccinationsInput.split(",").map(s => s.trim()).filter(Boolean);
      
      await updatePatientClinicalTags(selectedPatient._id, {
        allergies,
        chronicDiseases,
        vaccinations
      });
      showToast("success", "Clinical warning tags updated successfully");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to update clinical warning tags");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAddDocument = async (e) => {
    e.preventDefault();
    if (!documentName.trim()) return;
    try {
      setSubmittingAction(true);
      await addPatientDocument(selectedPatient._id, {
        name: documentName
      });
      showToast("success", "Patient document registered successfully");
      setDocumentName("");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to register document");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSavePrescription = async (e) => {
    e.preventDefault();
    if (!prescriptionForm.medicationName.trim()) return;
    try {
      setSubmittingAction(true);
      await addPrescription(selectedPatient._id, prescriptionForm);
      showToast("success", "Medication prescribed successfully");
      setPrescriptionForm({
        medicationName: "",
        dosage: "500mg",
        frequency: "TDS (Thrice daily)"
      });
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to prescribe medication");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveInstruction = async (e) => {
    e.preventDefault();
    if (!instructionForm.instruction.trim()) return;
    try {
      setSubmittingAction(true);
      await addDoctorInstruction(selectedPatient._id, instructionForm);
      showToast("success", "Care instruction sent to nursing crew");
      setInstructionForm({
        instruction: "",
        priority: "MEDIUM"
      });
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to log care instruction");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveLabOrder = async (e) => {
    e.preventDefault();
    if (!labForm.testName.trim()) return;
    try {
      setSubmittingAction(true);
      await orderLabTest(selectedPatient._id, labForm);
      showToast("success", "Lab diagnostic test ordered successfully");
      setLabForm({
        testName: ""
      });
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to order lab diagnostic test");
    } finally {
      setSubmittingAction(false);
    }
  };

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

      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Patient Charting & Directory</h1>
          <p>Click on a patient's row to open their clinical charting history, log vitals, track prescriptions, and monitor notes.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search Bar & Export Tools */}
      <div className="filters-card" style={{ display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", padding: "1rem" }}>
        <div className="search-box" style={{ flex: 1, minWidth: "250px" }}>
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by UHID, Name, or Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <label style={{ margin: 0, fontSize: "0.85rem", fontWeight: 600, color: "#475569" }}>Registration:</label>
            <select
              className="form-control"
              style={{ width: "140px", padding: "0.35rem", fontSize: "0.85rem" }}
              value={registrationTypeFilter}
              onChange={(e) => setRegistrationTypeFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="WALK_IN">Walk-In</option>
              <option value="ONLINE">Online Portal</option>
              <option value="EMERGENCY">Emergency STAT</option>
              <option value="REFERRAL">Doc Referral</option>
            </select>
          </div>

          <button className="btn btn-secondary" onClick={handleExportCSV} style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={handleExportPDF} style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Patient Table */}
      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading patient directory...</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <UserCheck size={48} style={{ color: "var(--text-muted)", margin: "0 auto 1rem" }} />
          <p style={{ color: "var(--text-secondary)" }}>No patient records found.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient UHID</th>
                <th>Patient Name</th>
                <th>ID QR Code</th>
                <th>Mobile</th>
                <th>Room / Bed</th>
                <th>Blood Group</th>
                <th>Registration Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr 
                  key={p._id} 
                  id={`patient-row-btn-${p._id}`}
                  onClick={() => handleOpenChart(p)} 
                  style={{ cursor: "pointer", transition: "background 0.2s" }}
                  className="patient-row"
                >
                  <td>
                    <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7", fontWeight: 700 }}>
                      {p.uhid || `UHID-2026-${p._id.slice(-4)}`}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {p.firstName} {p.lastName}
                      </strong>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{p.email}</div>
                    </div>
                  </td>
                  <td>
                    <div 
                      style={{ display: "inline-flex", alignItems: "center", justifyItems: "center", cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`, "_blank");
                      }}
                      title="Click to view large scan QR code"
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=45x45&data=${encodeURIComponent("http://" + systemIp + ":5173/patients?search=" + p.uhid)}`}
                        alt="Patient QR Code"
                        style={{ width: "45px", height: "45px", border: "1px solid #e2e8f0", borderRadius: "6px", background: "#fff", padding: "2px" }}
                      />
                    </div>
                  </td>
                  <td>{p.mobile}</td>
                  <td>
                    <span style={{ fontWeight: 600 }}>
                      {p.roomNo && p.roomNo !== "N/A" ? `Room ${p.roomNo} / Bed ${p.bedNo || "N/A"}` : "Unallocated"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#dc2626", fontWeight: 700 }}>
                      <Droplet size={16} />
                      <span>{p.bloodGroup || "O+"}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="badge" style={{
                        background: p.registrationType === "ONLINE" ? "#ecfdf5" : p.registrationType === "EMERGENCY" ? "#fee2e2" : "#f1f5f9",
                        color: p.registrationType === "ONLINE" ? "#10b981" : p.registrationType === "EMERGENCY" ? "#ef4444" : "#475569",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}>
                        {p.registrationType || "WALK_IN"}
                      </span>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>By: {p.registeredBy || "Self"}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-status-${p.status}`}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Patient Clinical Charting Side Drawer */}
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
              <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                <div>
                  <span className="badge" style={{ background: "#e0f2fe", color: "#0284c7", fontSize: "0.75rem", fontWeight: 700 }}>
                    {selectedPatient.uhid || "PATIENT UHID"}
                  </span>
                  <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 800, color: "#0f172a" }}>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {selectedPatient.allergies?.length > 0 && selectedPatient.allergies.map((allergy, i) => (
                      <span key={i} className="badge" style={{ background: "#fee2e2", color: "#ef4444", fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        ⚠️ Allergy: {allergy}
                      </span>
                    ))}
                    {selectedPatient.chronicDiseases?.length > 0 && selectedPatient.chronicDiseases.map((disease, i) => (
                      <span key={i} className="badge" style={{ background: "#fef3c7", color: "#d97706", fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        ☣️ Chronic: {disease}
                      </span>
                    ))}
                    {selectedPatient.vaccinations?.length > 0 && selectedPatient.vaccinations.map((vac, i) => (
                      <span key={i} className="badge" style={{ background: "#dcfce7", color: "#15803d", fontSize: "0.65rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                        💉 Vac: {vac}
                      </span>
                    ))}
                  </div>
                </div>
                {/* QR Code generator */}
                <div 
                  style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    background: "#ffffff", 
                    padding: "0.6rem", 
                    borderRadius: "10px", 
                    border: "2px solid #0284c7",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    cursor: "pointer"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent("http://" + systemIp + ":5173/login?uhid=" + selectedPatient.uhid)}`, "_blank");
                  }}
                  title="Click to view full screen scan code"
                >
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent("http://" + systemIp + ":5173/login?uhid=" + selectedPatient.uhid)}`} 
                    alt="Patient UHID QR"
                    style={{ width: "120px", height: "120px" }}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#0284c7", fontWeight: 800, marginTop: "0.25rem" }}>CLICK TO ZOOM QR</span>
                </div>
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
              {(user?.role === "DOCTOR" ? [
                { id: "consultation", label: "Consultation Room", icon: Stethoscope },
                { id: "history", label: "Medical History", icon: Clock },
                { id: "prescriptions", label: "Prescribe Meds", icon: Pill },
                { id: "instructions", label: "Nurse Tasks", icon: ClipboardList },
                { id: "labs", label: "Order Labs", icon: Activity },
                { id: "vitals", label: "Vitals & Notes", icon: VitalsIcon },
                { id: "documents", label: "Attachments & Docs", icon: FileText }
              ] : [
                { id: "overview", label: "Overview", icon: User },
                { id: "vitals", label: "Vitals", icon: VitalsIcon },
                { id: "medications", label: "Medications", icon: Calendar },
                { id: "instructions", label: "Instructions", icon: ClipboardList },
                { id: "notes", label: "Notes", icon: Save },
                { id: "labs", label: "Labs", icon: Activity },
                { id: "documents", label: "Documents", icon: FileText }
              ]).map((tab) => {
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
                  {/* DOCTOR EMR TAB 1: CONSULTATION ROOM */}
                  {activeDrawerTab === "consultation" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {/* AI Medical Scribe Assistant */}
                      {user?.role === "DOCTOR" && (
                        <div style={{ background: "#f0fdfa", border: "1px solid #99f6e4", padding: "1.25rem", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          <h5 style={{ margin: 0, fontSize: "0.85rem", color: "#0d9488", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span>✍️ AI Medical Scribe Assistant (Voice Enabled)</span>
                            <span style={{ fontSize: "0.65rem", padding: "0.15rem 0.4rem", background: "#ccfbf1", color: "#0f766e", borderRadius: "4px" }}>Active</span>
                          </h5>
                          <span style={{ fontSize: "0.75rem", color: "#4f5e71" }}>Type/dictate doctor's quick shorthand observations below. Click transcribe to draft notes:</span>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <textarea
                              className="form-control"
                              rows="2"
                              value={aiScribeShorthand}
                              onChange={(e) => setAiScribeShorthand(e.target.value)}
                              placeholder="E.g. patient has fever 3 days, dry cough, bp is 135/85, prescribe paracetamol TDS..."
                              style={{ flex: 1, fontSize: "0.8rem" }}
                            />
                            <AIVoiceAssistant mode="stt" onTranscript={(text) => setAiScribeShorthand(prev => prev + " " + text)} />
                          </div>
                          <button
                            type="button"
                            onClick={handleRunMedicalScribe}
                            disabled={aiScribeLoading}
                            className="btn btn-secondary"
                            style={{ width: "fit-content", fontSize: "0.8rem", color: "#0f766e", borderColor: "#0f766e", background: "#f0fdfa" }}
                          >
                            {aiScribeLoading ? "Transcribing Notes..." : "🔍 Run AI Medical Scribe"}
                          </button>
                        </div>
                      )}

                      {/* AI Diagnosis Suggestions Panel */}
                      {user?.role === "DOCTOR" && aiDiagnosisSuggestions && (
                        <div style={{ background: "#fbf7ff", border: "1px solid #ebd5ff", padding: "1.25rem", borderRadius: "12px", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                          <h5 style={{ margin: 0, fontSize: "0.85rem", color: "#7c3aed", fontWeight: 800 }}>🤖 AI Differential Diagnosis Suggestions</h5>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#4b5563" }}><strong>Differential Suggestions:</strong></p>
                          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                            {aiDiagnosisSuggestions.suggestions?.map((item, idx) => (
                              <span key={idx} className="badge" style={{ background: "#8b5cf6", color: "white", fontSize: "0.7rem", fontWeight: 700 }}>{item}</span>
                            ))}
                          </div>
                          <p style={{ margin: "0.4rem 0 0 0", fontSize: "0.75rem", color: "#4b5563" }}><strong>AI Reasoning:</strong> {aiDiagnosisSuggestions.reasoning}</p>
                          {aiDiagnosisSuggestions.safetyPrecautions?.length > 0 && (
                            <div style={{ marginTop: "0.4rem" }}>
                              <strong style={{ fontSize: "0.75rem", color: "#dc2626" }}>Safety Precautions:</strong>
                              <ul style={{ margin: "0.2rem 0 0 0", paddingLeft: "1rem", fontSize: "0.75rem", color: "#b91c1c" }}>
                                {aiDiagnosisSuggestions.safetyPrecautions.map((p, idx) => <li key={idx}>{p}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Log Clinical Diagnosis & Consultation</h4>
                        <form onSubmit={handleSaveConsultation} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-group">
                            <label>Current Diagnosis / Assessment *</label>
                            <input 
                              type="text"
                              className="form-control"
                              value={diagnosisInput}
                              onChange={(e) => setDiagnosisInput(e.target.value)}
                              placeholder="E.g. Mild Hypertension, Common Cold"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Detailed Clinical Observations & Notes</label>
                            <textarea 
                              className="form-control"
                              rows="4"
                              value={clinicalNotesInput}
                              onChange={(e) => setClinicalNotesInput(e.target.value)}
                              placeholder="Write symptoms, advices, diet plans..."
                            />
                          </div>
                          <div className="form-group">
                            <label>Scheduled Follow-up Date</label>
                            <input 
                              type="date"
                              className="form-control"
                              value={followUpDateInput}
                              onChange={(e) => setFollowUpDateInput(e.target.value)}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Save size={16} />
                            <span>Save Consultation Note</span>
                          </button>
                        </form>
                      </div>

                      {user?.role === "DOCTOR" && (
                        <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Update EMR Warning Tags & Alerts</h4>
                          <form onSubmit={handleSaveClinicalTags} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group">
                              <label>Allergies (comma separated)</label>
                              <input 
                                type="text"
                                className="form-control"
                                value={allergiesInput}
                                onChange={(e) => setAllergiesInput(e.target.value)}
                                placeholder="E.g. Penicillin, Peanuts, Pollen"
                              />
                            </div>
                            <div className="form-group">
                              <label>Chronic Diseases (comma separated)</label>
                              <input 
                                type="text"
                                className="form-control"
                                value={chronicDiseasesInput}
                                onChange={(e) => setChronicDiseasesInput(e.target.value)}
                                placeholder="E.g. Diabetes, Asthma, Hypertension"
                              />
                            </div>
                            <div className="form-group">
                              <label>Vaccinations (comma separated)</label>
                              <input 
                                type="text"
                                className="form-control"
                                value={vaccinationsInput}
                                onChange={(e) => setVaccinationsInput(e.target.value)}
                                placeholder="E.g. Covid-19 Booster, BCG, Hep B"
                              />
                            </div>
                            <button type="submit" className="btn btn-secondary" style={{ width: "fit-content", borderColor: "#0284c7", color: "#0284c7" }} disabled={submittingAction}>
                              <Save size={16} />
                              <span>Update Warning Tags</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 2: MEDICAL HISTORY */}
                  {activeDrawerTab === "history" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#0f172a" }}>Patient Medical History Timeline</h4>
                      {clinicalData?.consultations?.length === 0 ? (
                        <p style={{ color: "#64748b" }}>No previous consultation diagnosis logged.</p>
                      ) : (
                        clinicalData?.consultations?.map((c) => (
                          <div key={c._id} style={{ background: "white", border: "1px solid #e2e8f0", padding: "1.25rem", borderRadius: "10px", borderLeft: "4px solid #0284c7" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>Diagnosis: {c.diagnosis}</strong>
                              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#334155" }}>{c.clinicalNotes || "No notes added."}</p>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#64748b", borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem" }}>
                              <span>Consultant: Dr. {c.doctor?.firstName} {c.doctor?.lastName}</span>
                              {c.followUpDate && (
                                <span>Follow-up: <strong>{new Date(c.followUpDate).toLocaleDateString()}</strong></span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 3: PRESCRIBE MEDS */}
                  {activeDrawerTab === "prescriptions" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Prescribe New Medication</h4>
                        <form onSubmit={handleSavePrescription} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-group">
                            <label>Medication Name (Generic/Brand) *</label>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <input 
                                type="text"
                                className="form-control"
                                value={prescriptionForm.medicationName}
                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, medicationName: e.target.value })}
                                placeholder="E.g. Metformin 500mg"
                                required
                                style={{ flex: 1 }}
                              />
                              <button
                                type="button"
                                onClick={handleCheckPrescription}
                                disabled={aiPrescriptionChecking}
                                className="btn btn-secondary"
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", color: "#0284c7", borderColor: "#0284c7" }}
                              >
                                {aiPrescriptionChecking ? "Screening..." : "🔍 Run AI Safety Screen"}
                              </button>
                            </div>
                          </div>

                          {aiPrescriptionCheckResult && (
                            <div style={{ padding: "0.85rem", background: aiPrescriptionCheckResult.allergenConflict || aiPrescriptionCheckResult.warnings?.length > 0 ? "#fff1f2" : "#f0fdf4", border: aiPrescriptionCheckResult.allergenConflict || aiPrescriptionCheckResult.warnings?.length > 0 ? "1px solid #fecdd3" : "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.8rem", color: aiPrescriptionCheckResult.allergenConflict || aiPrescriptionCheckResult.warnings?.length > 0 ? "#9f1239" : "#166534" }}>
                              <strong>AI Prescription Safety Report:</strong>
                              <div style={{ marginTop: "0.25rem" }}>{aiPrescriptionCheckResult.recommendations}</div>
                              {aiPrescriptionCheckResult.warnings?.length > 0 && (
                                <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {aiPrescriptionCheckResult.warnings.map((w, idx) => <li key={idx} style={{ color: "#ef4444", fontWeight: 700 }}>{w}</li>)}
                                </ul>
                              )}
                              {aiPrescriptionCheckResult.interactions?.length > 0 && (
                                <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {aiPrescriptionCheckResult.interactions.map((i, idx) => <li key={idx}>{i}</li>)}
                                </ul>
                              )}
                            </div>
                          )}
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                            <div className="form-group">
                              <label>Dosage *</label>
                              <input 
                                type="text"
                                className="form-control"
                                value={prescriptionForm.dosage}
                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                                placeholder="E.g. 500mg, 1 tablet"
                                required
                              />
                            </div>
                            <div className="form-group">
                              <label>Frequency *</label>
                              <select 
                                className="form-control"
                                value={prescriptionForm.frequency}
                                onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                                required
                              >
                                <option value="OD (Once daily)">OD (Once daily)</option>
                                <option value="BD (Twice daily)">BD (Twice daily)</option>
                                <option value="TDS (Thrice daily)">TDS (Thrice daily)</option>
                                <option value="QDS (Four times daily)">QDS (Four times daily)</option>
                                <option value="PRN (As needed)">PRN (As needed)</option>
                              </select>
                            </div>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Plus size={16} />
                            <span>Add Prescription</span>
                          </button>
                        </form>
                      </div>

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "#0f172a" }}>Prescription History Log</h4>
                        {clinicalData?.medications?.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No prescriptions registered yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.medications?.map((m) => (
                              <div key={m._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "0.85rem", borderRadius: "8px" }}>
                                <div>
                                  <strong style={{ fontSize: "0.9rem" }}>{m.medicationName}</strong>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{m.dosage} - {m.frequency}</div>
                                  <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Prescribed by: Dr. {m.prescribedBy?.firstName || "Unknown"}</div>
                                </div>
                                <span className="badge" style={{
                                  background: m.status === "GIVEN" ? "#dcfce7" : "#fee2e2",
                                  color: m.status === "GIVEN" ? "#15803d" : "#ef4444",
                                  fontWeight: 700
                                }}>
                                  {m.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 4: NURSE INSTRUCTIONS */}
                  {activeDrawerTab === "instructions" && user?.role === "DOCTOR" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Assign Nurse Instruction Task</h4>
                        <form onSubmit={handleSaveInstruction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-group">
                            <label>Instruction Description *</label>
                            <textarea 
                              className="form-control"
                              rows="3"
                              value={instructionForm.instruction}
                              onChange={(e) => setInstructionForm({ ...instructionForm, instruction: e.target.value })}
                              placeholder="E.g. Check temperature hourly, mobilize patient twice daily..."
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Task Priority *</label>
                            <select 
                              className="form-control"
                              value={instructionForm.priority}
                              onChange={(e) => setInstructionForm({ ...instructionForm, priority: e.target.value })}
                              required
                            >
                              <option value="HIGH">HIGH Priority</option>
                              <option value="MEDIUM">MEDIUM Priority</option>
                              <option value="LOW">LOW Priority</option>
                            </select>
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Plus size={16} />
                            <span>Assign Care Task</span>
                          </button>
                        </form>
                      </div>

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "#0f172a" }}>Care Tasks Log</h4>
                        {clinicalData?.instructions?.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No nurse tasks logged.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.instructions?.map((inst) => (
                              <div key={inst._id} style={{ border: "1px solid #e2e8f0", padding: "0.85rem", borderRadius: "8px" }}>
                                <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>{inst.instruction}</p>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <span className="badge" style={{
                                    background: inst.priority === "HIGH" ? "#fee2e2" : "#f1f5f9",
                                    color: inst.priority === "HIGH" ? "#ef4444" : "#64748b",
                                    fontWeight: 700
                                  }}>
                                    {inst.priority}
                                  </span>
                                  <span className="badge" style={{
                                    background: inst.status === "COMPLETED" ? "#dcfce7" : "#fee2e2",
                                    color: inst.status === "COMPLETED" ? "#15803d" : "#ef4444",
                                    fontWeight: 700
                                  }}>
                                    {inst.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 5: ORDER LABS */}
                  {activeDrawerTab === "labs" && user?.role === "DOCTOR" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Order Lab Diagnostic Test</h4>
                        <form onSubmit={handleSaveLabOrder} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-group">
                            <label>Test Name *</label>
                            <input 
                              type="text"
                              className="form-control"
                              value={labForm.testName}
                              onChange={(e) => setLabForm({ ...labForm, testName: e.target.value })}
                              placeholder="E.g. HbA1c, Kidney Function Test"
                              required
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Plus size={16} />
                            <span>Order Test</span>
                          </button>
                        </form>
                      </div>

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "#0f172a" }}>Laboratory Diagnostic Requests</h4>
                        {clinicalData?.labs?.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No lab tests requested yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.labs?.map((l) => (
                              <div key={l._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "0.85rem", borderRadius: "8px" }}>
                                <div>
                                  <strong style={{ fontSize: "0.9rem" }}>{l.testName}</strong>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Order Date: {new Date(l.createdAt).toLocaleDateString()}</div>
                                </div>
                                <span className="badge" style={{
                                  background: l.status === "SAMPLE_COLLECTED" ? "#dcfce7" : "#fee2e2",
                                  color: l.status === "SAMPLE_COLLECTED" ? "#15803d" : "#ef4444",
                                  fontWeight: 700
                                }}>
                                  {l.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 6: VITALS & NOTES LOGS */}
                  {activeDrawerTab === "vitals" && user?.role === "DOCTOR" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Patient Vitals History Log</h4>
                        {clinicalData?.vitals?.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No vital records registered yet.</p>
                        ) : (
                          <table className="custom-table" style={{ fontSize: "0.85rem" }}>
                            <thead>
                              <tr>
                                <th>Logged Date</th>
                                <th>Temp</th>
                                <th>BP</th>
                                <th>Heart Rate</th>
                                <th>SpO2</th>
                                <th>Sugar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {clinicalData?.vitals?.map((v) => (
                                <tr key={v._id}>
                                  <td>{new Date(v.createdAt).toLocaleDateString()}</td>
                                  <td>{v.temperature || "-"}°F</td>
                                  <td>{v.bp || "-"}</td>
                                  <td>{v.heartRate || "-"} bpm</td>
                                  <td>{v.spo2 || "-"}%</td>
                                  <td>{v.sugar || "-"} mg/dL</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>

                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Nursing Observation logs</h4>
                        {clinicalData?.notes?.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No notes logged by nursing crew.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.notes?.map((n) => (
                              <div key={n._id} style={{ borderLeft: "3px solid #10b981", paddingLeft: "0.75rem" }}>
                                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem" }}>{n.note}</p>
                                <span style={{ fontSize: "0.7rem", color: "#64748b" }}>Logged by: Nurse {n.recordedBy?.firstName || "Unknown"} on {new Date(n.createdAt).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 1: OVERVIEW & BED ALLOCATION */}
                  {activeDrawerTab === "overview" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {/* AI Patient Summary Card */}
                      <div className="modal-card" style={{ background: "#f0f9ff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #bae6fd" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "#0369a1", fontWeight: 800, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <span>📋 AI EMR Patient History Summary</span>
                            <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", background: "#e0f2fe", color: "#0369a1", borderRadius: "4px" }}>Advisory AI</span>
                          </h4>
                          {aiPatientSummary && (
                            <AIVoiceAssistant mode="tts" textToSpeak={`${aiPatientSummary.summary} Active medications review: ${aiPatientSummary.medicationReview} Laboratory interpretations: ${aiPatientSummary.labInterpretation}`} />
                          )}
                        </div>

                        {aiSummaryLoading ? (
                          <p style={{ color: "#0369a1", fontSize: "0.85rem", margin: 0 }}>Generating clinical summary from patient health logs...</p>
                        ) : aiPatientSummary ? (
                          <div style={{ fontSize: "0.85rem", color: "#1e293b", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <p style={{ margin: 0, lineHeight: 1.4 }}><strong>History & Status:</strong> {aiPatientSummary.summary}</p>
                            <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Prescriptions Review:</strong> {aiPatientSummary.medicationReview}</p>
                            <p style={{ margin: 0, lineHeight: 1.4 }}><strong>Lab Interpretations:</strong> {aiPatientSummary.labInterpretation}</p>
                            {aiPatientSummary.healthTips?.length > 0 && (
                              <div style={{ marginTop: "0.25rem" }}>
                                <strong>AI Suggested Health Interventions:</strong>
                                <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {aiPatientSummary.healthTips.map((tip, idx) => <li key={idx}>{tip}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p style={{ color: "#64748b", fontSize: "0.85rem", margin: 0 }}>No AI summary compiled for this profile.</p>
                        )}
                      </div>

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
                                  <th style={{ padding: "0.5rem" }}>Logged By</th>
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
                                    <td style={{ padding: "0.5rem", color: "#64748b" }}>{v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : "Staff"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: MEDICATION MANAGEMENT (MAR) */}
                  {activeDrawerTab === "medications" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Medication Administration Record (MAR)</h4>
                        {!clinicalData?.medications || clinicalData.medications.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No medication prescriptions logged for this patient.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.medications.map((med) => (
                              <div key={med._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", background: med.status === "GIVEN" ? "#f0fdf4" : "white" }}>
                                <div>
                                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{med.medicationName}</strong>
                                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.2rem" }}>
                                    Dosage: <strong>{med.dosage}</strong> | Frequency: <strong>{med.frequency}</strong>
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                                    Prescribed by Dr. {med.prescribedBy ? `${med.prescribedBy.firstName} ${med.prescribedBy.lastName}` : "Doctor"}
                                  </div>
                                </div>
                                <div>
                                  {med.status === "PENDING" ? (
                                    <button 
                                      onClick={() => handleAdministerMed(med._id)} 
                                      className="btn btn-primary" 
                                      style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#10b981", border: "1px solid #10b981" }}
                                    >
                                      Mark Administered (Given)
                                    </button>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <span className="badge" style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                                        <CheckCircle size={14} /> GIVEN
                                      </span>
                                      <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                                        By {med.givenBy ? `${med.givenBy.firstName} ${med.givenBy.lastName}` : "Nurse"} on {new Date(med.givenAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: DOCTOR CLINICAL INSTRUCTIONS */}
                  {activeDrawerTab === "instructions" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Doctor's Care Instructions & Tasks</h4>
                        {!clinicalData?.instructions || clinicalData.instructions.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No doctor instructions found.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.instructions.map((inst) => (
                              <div key={inst._id} style={{ border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", background: inst.status === "COMPLETED" ? "#f8fafc" : "white" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                  <span className={`badge`} style={{ 
                                    background: inst.priority === "HIGH" ? "#fee2e2" : inst.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9", 
                                    color: inst.priority === "HIGH" ? "#ef4444" : inst.priority === "MEDIUM" ? "#f59e0b" : "#64748b", 
                                    fontWeight: 700 
                                  }}>
                                    {inst.priority} PRIORITY
                                  </span>
                                  {inst.status === "PENDING" ? (
                                    <button 
                                      onClick={() => handleCompleteInstruction(inst._id)} 
                                      className="btn btn-secondary" 
                                      style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem" }}
                                    >
                                      Mark Completed
                                    </button>
                                  ) : (
                                    <span className="badge" style={{ background: "#f1f5f9", color: "#64748b", fontWeight: 700 }}>
                                      COMPLETED
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "#0f172a", margin: "0.25rem 0" }}>{inst.instruction}</p>
                                <div style={{ fontSize: "0.75rem", color: "#64748b", borderTop: "1px dashed #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
                                  {inst.status === "PENDING" ? (
                                    <span>Prescribed by Dr. {inst.prescribedBy ? `${inst.prescribedBy.firstName} ${inst.prescribedBy.lastName}` : "Doctor"}</span>
                                  ) : (
                                    <span>Completed by Nurse {inst.completedBy ? `${inst.completedBy.firstName} ${inst.completedBy.lastName}` : "Staff"} on {new Date(inst.completedAt).toLocaleString()}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 5: NURSING NOTES */}
                  {activeDrawerTab === "notes" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Log Nursing Note</h4>
                        <form onSubmit={handleSaveNote}>
                          <div className="form-group" style={{ marginBottom: "1rem" }}>
                            <label>Observation & Care Description</label>
                            <textarea 
                              className="form-control" 
                              rows="4" 
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Write patient status details, vital comments, feeding information..."
                              required
                              style={{ resize: "vertical" }}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Save size={16} />
                            <span>Save Observation Note</span>
                          </button>
                        </form>
                      </div>

                      {/* Notes log */}
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Observations History Log</h4>
                        {!clinicalData?.notes || clinicalData.notes.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No nursing notes logged yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.notes.map((note) => (
                              <div key={note._id} style={{ borderLeft: "3px solid #0284c7", paddingLeft: "1rem", paddingBottom: "0.25rem" }}>
                                <p style={{ fontSize: "0.9rem", color: "#0f172a", margin: "0 0 0.25rem 0" }}>{note.note}</p>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                                  Logged by {note.recordedBy ? `${note.recordedBy.firstName} ${note.recordedBy.lastName}` : "Staff"} on {new Date(note.createdAt).toLocaleString()}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: LAB SUPPORT */}
                  {activeDrawerTab === "labs" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Laboratory Test Request Tracking</h4>
                        {!clinicalData?.labs || clinicalData.labs.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No lab test requests logged for this patient.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.labs.map((lab) => (
                              <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "1rem", borderRadius: "8px", background: lab.status === "SAMPLE_COLLECTED" ? "#f0fdf4" : "white" }}>
                                <div>
                                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{lab.testName}</strong>
                                  <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                                    Ordered by Dr. {lab.prescribedBy ? `${lab.prescribedBy.firstName} ${lab.prescribedBy.lastName}` : "Doctor"}
                                  </div>
                                </div>
                                <div>
                                  {lab.status === "PENDING" ? (
                                    <button 
                                      onClick={() => handleCollectLabSample(lab._id)} 
                                      className="btn btn-primary" 
                                      style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#0284c7" }}
                                    >
                                      Collect Vitals Sample
                                    </button>
                                  ) : (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <span className="badge" style={{ background: "#ecfdf5", color: "#059669", fontWeight: 700 }}>
                                        SAMPLE COLLECTED
                                      </span>
                                      <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                                        By Nurse {lab.sampleCollectedBy ? `${lab.sampleCollectedBy.firstName} ${lab.sampleCollectedBy.lastName}` : "Staff"} on {new Date(lab.sampleCollectedAt).toLocaleTimeString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 7: DOCUMENTS & ATTACHMENTS */}
                  {activeDrawerTab === "documents" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                      {/* Document List */}
                      <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Patient Attachments & Scanned Documents</h4>
                        {!selectedPatient.documents || selectedPatient.documents.length === 0 ? (
                          <p style={{ color: "#64748b", margin: 0 }}>No files or attachments uploaded yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {selectedPatient.documents.map((doc, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e2e8f0", padding: "0.85rem 1.25rem", borderRadius: "8px", background: "#f8fafc" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <FileText size={20} style={{ color: "#64748b" }} />
                                  <div>
                                    <strong style={{ fontSize: "0.9rem", color: "#0f172a" }}>{doc.name}</strong>
                                    <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>
                                      Uploaded on {new Date(doc.uploadedAt).toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                  <a 
                                    href={`#view-doc-${doc.url}`} 
                                    onClick={(e) => {
                                      e.preventDefault();
                                      showToast("success", `Opening mock file: ${doc.url}`);
                                    }}
                                    style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 700, textDecoration: "none" }}
                                  >
                                    View File
                                  </a>
                                  <button
                                    onClick={() => handleSummarizeDocument(doc.name)}
                                    className="btn btn-secondary"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", color: "#0284c7", borderColor: "#bae6fd" }}
                                  >
                                    Summarize
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {aiReportSummary && (
                          <div style={{ marginTop: "1rem", padding: "1rem", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #cbd5e1", paddingBottom: "0.4rem", marginBottom: "0.5rem" }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>📄 AI DOCUMENT REPORT SUMMARY</span>
                              <button onClick={() => setAiReportSummary(null)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.8rem" }}>Clear</button>
                            </div>
                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.75rem", color: "#334155", lineHeight: 1.4 }}>
                              {aiReportSummary.summary}
                            </p>
                            {aiReportSummary.abnormalFindings?.length > 0 && (
                              <div style={{ fontSize: "0.75rem", color: "#b91c1c", marginBottom: "0.4rem" }}>
                                <strong>Detected Abnormal Values:</strong>
                                <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {aiReportSummary.abnormalFindings.map((abn, i) => <li key={i}>{abn}</li>)}
                                </ul>
                              </div>
                            )}
                            {aiReportSummary.recommendedActions?.length > 0 && (
                              <div style={{ fontSize: "0.75rem", color: "#475569" }}>
                                <strong>Recommended Actions:</strong>
                                <ul style={{ margin: "0.15rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {aiReportSummary.recommendedActions.map((act, i) => <li key={i}>{act}</li>)}
                                </ul>
                              </div>
                            )}
                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                              <AIVoiceAssistant mode="tts" textToSpeak={aiReportSummary.summary} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Upload Form (Visible to staff) */}
                      {user?.role !== "PATIENT" && (
                        <div className="modal-card" style={{ background: "white", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#0f172a" }}>Upload Scanned Document / Report</h4>
                          <form onSubmit={handleAddDocument} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group">
                              <label>Document Name *</label>
                              <input 
                                type="text"
                                className="form-control"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="E.g. Chest X-Ray Report, Blood Scan PDF"
                                required
                              />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                              <Save size={16} />
                              <span>Upload Attachment</span>
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Patient Register Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>Register Patient</h3>
              <button className="action-btn" onClick={() => setIsModalOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Blood Group</label>
                    <select
                      className="form-control"
                      value={formData.bloodGroup}
                      onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
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

                  <div className="form-group">
                    <label>Emergency Contact</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Family contact phone"
                    />
                  </div>

                  <div className="form-group">
                    <label>Registration Mode *</label>
                    <select
                      className="form-control"
                      value={formData.registrationType}
                      onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                      required
                    >
                      <option value="WALK_IN">WALK_IN (Walk-in Patient)</option>
                      <option value="ONLINE">ONLINE (Self Registration Portal)</option>
                      <option value="EMERGENCY">EMERGENCY (Critical Alert Admission)</option>
                      <option value="REFERRAL">REFERRAL (External Doctor Referral)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Staff Registered By *</label>
                    <select
                      className="form-control"
                      value={formData.registeredBy}
                      onChange={(e) => setFormData({ ...formData, registeredBy: e.target.value })}
                      required
                    >
                      <option value="Receptionist">Receptionist Counter</option>
                      <option value="Self">Self Patient (Online)</option>
                      <option value="Admin">Admin Console</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Register Patient & Issue UHID
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
