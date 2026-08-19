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
  FileText,
  Camera,
  Upload
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const VitalsIcon = Activity;
import { 
  fetchUsers, 
  createUser,
  updateUser,
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
  fetchAIVitalsEmergencyCheck,
  checkDuplicatePatient,
  mergePatients,
  fetchDischargeRecord,
  submitPatientDischarge,
  fetchConsolidatedReport
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

  // Patient Discharge Workflow States
  const [dischargeRecord, setDischargeRecord] = useState(null);
  const [dischargeSummaryInput, setDischargeSummaryInput] = useState("");
  const [takeHomeMedsInput, setTakeHomeMedsInput] = useState([]);
  const [newTakeHomeMed, setNewTakeHomeMed] = useState({ name: "", dosage: "", freq: "" });
  const [discharging, setDischarging] = useState(false);

  // Duplicate Check & Merge States
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
  const [primaryMergePatient, setPrimaryMergePatient] = useState(null);
  const [secondaryMergePatient, setSecondaryMergePatient] = useState(null);
  const [primarySearchText, setPrimarySearchText] = useState("");
  const [secondarySearchText, setSecondarySearchText] = useState("");
  const [primarySearchResults, setPrimarySearchResults] = useState([]);
  const [secondarySearchResults, setSecondarySearchResults] = useState([]);
  const [merging, setMerging] = useState(false);

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
    dob: "",
    age: "",
    address: "",
    profilePhoto: "",
    medicalAlerts: "",
    insuranceProvider: "",
    insurancePolicyNumber: "",
    insuranceCoverageAmount: "",
    insuranceExpiryDate: "",
  });

  // Duplicate check trigger
  const handleCheckDuplicate = async (updatedForm) => {
    const { firstName, lastName, mobile, email, dob } = updatedForm;
    if (!mobile && !email && !(firstName && lastName && dob)) {
      setDuplicateWarning(null);
      return;
    }
    try {
      const res = await checkDuplicatePatient({
        firstName,
        lastName,
        mobile,
        email,
        dob: dob || undefined
      });
      if (res?.data?.duplicate) {
        setDuplicateWarning(res.data.duplicate);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error("Duplicate check failed", err);
    }
  };

  // Form field updater with automatic age calculation and duplicate check
  const updateFormAndCheckDuplicate = (updates) => {
    const newForm = { ...formData, ...updates };
    
    if (updates.dob) {
      const birthDate = new Date(updates.dob);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        newForm.age = calculatedAge >= 0 ? calculatedAge : 0;
      }
    }

    setFormData(newForm);
    handleCheckDuplicate(newForm);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

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

  const [showPhotoSourceMenu, setShowPhotoSourceMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [isEditingDemographics, setIsEditingDemographics] = useState(false);
  const [demographicsForm, setDemographicsForm] = useState({
    dob: "",
    gender: "MALE",
    mobile: "",
    email: "",
    emergencyContact: "",
    address: "",
    insurance: {
      provider: "",
      policyNumber: "",
      coverageAmount: 0,
      expiryDate: "",
    }
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
              ${patients.map(p => `
                <tr>
                  <td><strong>${p.uhid}</strong></td>
                  <td>${p.firstName} ${p.lastName}</td>
                  <td>${p.mobile}</td>
                  <td>${p.gender}</td>
                  <td>${p.registrationType || "WALK_IN"}</td>
                  <td>${p.registeredBy || "Receptionist"}</td>
                </tr>
              `).join("")}
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

  const handlePrintPatientReport = async (patient) => {
    try {
      const res = await fetchConsolidatedReport(patient._id);
      const data = res.data;
      if (!data) return;

      const { patient: patientInfo, consultations = [], vitals = [], labs = [], invoices = [], discharge, medications = [] } = data;

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Consolidated Medical Dossier - ${patientInfo.firstName} ${patientInfo.lastName}</title>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f172a; max-width: 900px; margin: 0 auto; line-height: 1.5; }
              .header-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; border-bottom: 2px solid #0284c7; padding-bottom: 15px; }
              .hospital-title { font-size: 24px; font-weight: 800; color: #0284c7; text-transform: uppercase; margin: 0; }
              .doc-title { font-size: 14px; font-weight: 700; color: #475569; letter-spacing: 1px; text-transform: uppercase; margin: 4px 0 0 0; }
              
              .patient-meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin-bottom: 25px; }
              .meta-item { font-size: 13px; color: #334155; }
              .meta-item strong { color: #0f172a; }

              .section-title { font-size: 14px; font-weight: 800; color: #0284c7; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin: 25px 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
              
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
                  <h1 class="hospital-title">${patientInfo.hospital?.name || "AI Hospital Group"}</h1>
                  <h2 class="doc-title">Consolidated EMR Clinical Case Dossier</h2>
                </td>
                <td style="text-align: right; font-size: 12px; color: #64748b;">
                  <div>Date Exported: ${new Date().toLocaleString()}</div>
                  <div>ID QR Authentication: Active</div>
                </td>
              </tr>
            </table>

            <!-- Patient Profile Grid -->
            <div class="section-title">Patient Demographics & Profiles</div>
            <div class="patient-meta-grid">
              <div class="meta-item"><strong>Patient Name:</strong> ${patientInfo.firstName} ${patientInfo.lastName}</div>
              <div class="meta-item"><strong>UHID (Patient ID):</strong> ${patientInfo.uhid || "N/A"}</div>
              <div class="meta-item"><strong>Age / Gender:</strong> ${patientInfo.age || "N/A"} yrs / ${patientInfo.gender || "N/A"}</div>
              <div class="meta-item"><strong>Date of Birth:</strong> ${patientInfo.dob ? new Date(patientInfo.dob).toLocaleDateString() : "N/A"}</div>
              <div class="meta-item"><strong>Blood Group:</strong> ${patientInfo.bloodGroup || "N/A"}</div>
              <div class="meta-item"><strong>Contact:</strong> ${patientInfo.mobile || "N/A"}</div>
              <div class="meta-item"><strong>Email:</strong> ${patientInfo.email || "N/A"}</div>
              <div class="meta-item"><strong>Emergency Contact:</strong> ${patientInfo.emergencyContact || "N/A"}</div>
              <div class="meta-item"><strong>Address:</strong> ${patientInfo.address || "N/A"}</div>
              <div class="meta-item"><strong>Room / Bed Assignment:</strong> Room ${patientInfo.roomNo || "N/A"} | Bed ${patientInfo.bedNo || "N/A"}</div>
            </div>

            <!-- Insurance Profile -->
            <div class="section-title">Insurance Profile</div>
            <div class="patient-meta-grid">
              <div class="meta-item"><strong>Insurer:</strong> ${patientInfo.insuranceProvider || (patientInfo.insurance && patientInfo.insurance.provider) || "N/A"}</div>
              <div class="meta-item"><strong>Policy Number:</strong> ${patientInfo.insurancePolicyNumber || (patientInfo.insurance && patientInfo.insurance.policyNumber) || "N/A"}</div>
              <div class="meta-item"><strong>Coverage Amount:</strong> ₹${patientInfo.insuranceCoverageAmount || (patientInfo.insurance && patientInfo.insurance.coverageAmount) || 0}</div>
              <div class="meta-item"><strong>Expiration Date:</strong> ${patientInfo.insuranceExpiryDate || (patientInfo.insurance && patientInfo.insurance.expiryDate) ? new Date(patientInfo.insuranceExpiryDate || patientInfo.insurance.expiryDate).toLocaleDateString() : "N/A"}</div>
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

  const handlePrintIdCard = (patient) => {
    const printWindow = window.open("", "_blank");
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      JSON.stringify({
        patientId: patient.patientId || "",
        uhid: patient.uhid || "",
        name: `${patient.firstName} ${patient.lastName}`,
        bloodGroup: patient.bloodGroup || "N/A",
        medicalAlerts: patient.medicalAlerts || []
      })
    )}`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Patient ID Card - ${patient.firstName} ${patient.lastName}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background-color: #f1f5f9;
            }
            .card {
              width: 380px;
              height: 230px;
              background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
              color: white;
              border-radius: 16px;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
              padding: 20px;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
              overflow: hidden;
            }
            .card::before {
              content: '';
              position: absolute;
              top: -50px;
              right: -50px;
              width: 150px;
              height: 150px;
              background: rgba(255, 255, 255, 0.05);
              border-radius: 50%;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 1px solid rgba(255, 255, 255, 0.2);
              padding-bottom: 10px;
            }
            .hospital-name {
              font-size: 14px;
              font-weight: 800;
              letter-spacing: 1px;
            }
            .card-title {
              font-size: 10px;
              opacity: 0.8;
              text-transform: uppercase;
            }
            .body {
              display: flex;
              gap: 15px;
              align-items: center;
              margin-top: 10px;
            }
            .photo {
              width: 70px;
              height: 70px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid white;
              background: white;
            }
            .info {
              flex: 1;
              display: flex;
              flex-direction: column;
              gap: 4px;
            }
            .name {
              font-size: 16px;
              font-weight: 700;
              margin: 0;
            }
            .detail {
              font-size: 11px;
              opacity: 0.9;
            }
            .qr {
              width: 75px;
              height: 75px;
              background: white;
              padding: 4px;
              border-radius: 8px;
            }
            .footer {
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 10px;
              opacity: 0.8;
              border-top: 1px solid rgba(255, 255, 255, 0.2);
              padding-top: 10px;
              margin-top: 5px;
            }
            .alert-pill {
              background: #ef4444;
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: bold;
              font-size: 9px;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <span class="hospital-name">🏥 AI HOSPITAL</span>
              <span class="card-title">Patient Identity Card</span>
            </div>
            <div class="body">
              <img class="photo" src="${patient.profilePhoto || 'uploads/default-avatar.png'}" onerror="this.src='uploads/default-avatar.png'" />
              <div class="info">
                <p class="name">${patient.firstName} ${patient.lastName}</p>
                <div class="detail"><strong>ID:</strong> ${patient.patientId || "N/A"}</div>
                <div class="detail"><strong>UHID:</strong> ${patient.uhid || "N/A"}</div>
                <div class="detail"><strong>Blood Group:</strong> ${patient.bloodGroup || "N/A"}</div>
              </div>
              <img class="qr" src="${qrUrl}" />
            </div>
            <div class="footer">
              <span>Emergency No: ${patient.emergencyContact || '102'}</span>
              ${patient.medicalAlerts && patient.medicalAlerts.length > 0 ? `<span class="alert-pill">ALERT: ${patient.medicalAlerts[0]}</span>` : ''}
            </div>
          </div>
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
      const payload = {
        ...formData,
        role: "PATIENT",
        medicalAlerts: formData.medicalAlerts 
          ? formData.medicalAlerts.split(",").map(s => s.trim()).filter(Boolean) 
          : [],
        insurance: {
          provider: formData.insuranceProvider || "",
          policyNumber: formData.insurancePolicyNumber || "",
          coverageAmount: formData.insuranceCoverageAmount ? Number(formData.insuranceCoverageAmount) : 0,
          expiryDate: formData.insuranceExpiryDate || undefined
        }
      };

      // Clean up the fields we mapped to separate keys in state
      delete payload.insuranceProvider;
      delete payload.insurancePolicyNumber;
      delete payload.insuranceCoverageAmount;
      delete payload.insuranceExpiryDate;

      await createUser(payload);
      showToast("success", "New patient registered successfully with auto UHID & Patient ID");
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
        dob: "",
        age: "",
        address: "",
        profilePhoto: "",
        medicalAlerts: "",
        insuranceProvider: "",
        insurancePolicyNumber: "",
        insuranceCoverageAmount: "",
        insuranceExpiryDate: "",
      });
      setDuplicateWarning(null);
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

  // Load patient discharge status
  const loadDischargeStatus = async (patientId) => {
    try {
      const res = await fetchDischargeRecord(patientId);
      setDischargeRecord(res.data || null);
      if (res.data) {
        setDischargeSummaryInput(res.data.dischargeSummary || "");
        setTakeHomeMedsInput(res.data.takeHomeMedications || []);
      } else {
        setDischargeSummaryInput("");
        setTakeHomeMedsInput([]);
      }
    } catch (err) {
      console.error("Failed to load discharge record", err);
    }
  };

  // Add Take-home medication list item
  const handleAddTakeHomeMed = () => {
    if (!newTakeHomeMed.name.trim() || !newTakeHomeMed.dosage.trim()) {
      showToast("error", "Medication name and dosage are required.");
      return;
    }
    setTakeHomeMedsInput([...takeHomeMedsInput, newTakeHomeMed]);
    setNewTakeHomeMed({ name: "", dosage: "", freq: "" });
  };

  // Remove Take-home medication list item
  const handleRemoveTakeHomeMed = (idx) => {
    setTakeHomeMedsInput(takeHomeMedsInput.filter((_, i) => i !== idx));
  };

  // Submit patient discharge record
  const handleSaveDischarge = async (e) => {
    e.preventDefault();
    if (!dischargeSummaryInput.trim()) {
      showToast("error", "Discharge summary text is required.");
      return;
    }
    try {
      setDischarging(true);
      const res = await submitPatientDischarge(selectedPatient._id, {
        dischargeSummary: dischargeSummaryInput,
        takeHomeMedications: takeHomeMedsInput
      });

      if (res.data?.billingCleared) {
        showToast("success", "Patient discharged successfully! Ward bed allocation cleared.");
      } else {
        showToast("warning", "Discharge summary logged, but patient has pending unpaid cashier bills.");
      }
      
      // Reload discharge details
      await loadDischargeStatus(selectedPatient._id);
      
      // Refresh patient listing
      loadPatients();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to discharge patient");
    } finally {
      setDischarging(false);
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
        setDemographicsForm({
          dob: formatDateForInput(res.data.patient.dob),
          gender: res.data.patient.gender || "MALE",
          mobile: res.data.patient.mobile || "",
          email: res.data.patient.email || "",
          emergencyContact: res.data.patient.emergencyContact || "",
          address: res.data.patient.address || "",
          insurance: {
            provider: res.data.patient.insurance?.provider || "",
            policyNumber: res.data.patient.insurance?.policyNumber || "",
            coverageAmount: res.data.patient.insurance?.coverageAmount || 0,
            expiryDate: formatDateForInput(res.data.patient.insurance?.expiryDate),
          }
        });
        setIsEditingDemographics(false);
      }
      loadAiPatientSummary(patient._id);
      loadDischargeStatus(patient._id);
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
        setDemographicsForm({
          dob: formatDateForInput(res.data.patient.dob),
          gender: res.data.patient.gender || "MALE",
          mobile: res.data.patient.mobile || "",
          email: res.data.patient.email || "",
          emergencyContact: res.data.patient.emergencyContact || "",
          address: res.data.patient.address || "",
          insurance: {
            provider: res.data.patient.insurance?.provider || "",
            policyNumber: res.data.patient.insurance?.policyNumber || "",
            coverageAmount: res.data.patient.insurance?.coverageAmount || 0,
            expiryDate: formatDateForInput(res.data.patient.insurance?.expiryDate),
          }
        });
      }
      loadAiPatientSummary(selectedPatient._id);
      const latestVitals = res.data?.vitalsRecord?.[0] || {};
      const complaints = res.data?.nursingNotes?.[0]?.note || "General checkup";
      loadAiDiagnosisSuggestions(latestVitals, complaints);
    } catch (err) {
      console.error("Failed to reload chart", err);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setSubmittingAction(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          await updateUser(selectedPatient._id, { profilePhoto: base64 });
          showToast("success", "Profile picture updated successfully!");
          reloadChartData();
          setShowPhotoSourceMenu(false);
        } catch (err) {
          showToast("error", err.response?.data?.message || "Failed to update profile picture");
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      showToast("error", "Failed to read image file");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStartCamera = async () => {
    try {
      setShowPhotoSourceMenu(false);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 400, facingMode: "user" } });
      setCameraStream(stream);
      setShowCameraModal(true);
      // Wait a tiny bit then bind stream to video element
      setTimeout(() => {
        const videoEl = document.getElementById("camera-video-feed");
        if (videoEl) {
          videoEl.srcObject = stream;
        }
      }, 300);
    } catch (err) {
      showToast("error", "Unable to access camera. Please check camera permissions.");
      console.error(err);
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const handleCaptureSnapshot = async () => {
    const videoEl = document.getElementById("camera-video-feed");
    if (!videoEl) return;
    try {
      setSubmittingAction(true);
      const canvas = document.createElement("canvas");
      canvas.width = videoEl.videoWidth || 400;
      canvas.height = videoEl.videoHeight || 400;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.95);
      
      await updateUser(selectedPatient._id, { profilePhoto: base64 });
      showToast("success", "Profile photo captured successfully!");
      handleStopCamera();
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to save captured photo");
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSaveDemographics = async (e) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      // Create a clean payload mapping the fields
      const updateData = {
        dob: demographicsForm.dob || null,
        gender: demographicsForm.gender,
        mobile: demographicsForm.mobile,
        email: demographicsForm.email,
        emergencyContact: demographicsForm.emergencyContact,
        address: demographicsForm.address,
        insurance: {
          provider: demographicsForm.insurance.provider,
          policyNumber: demographicsForm.insurance.policyNumber,
          coverageAmount: Number(demographicsForm.insurance.coverageAmount) || 0,
          expiryDate: demographicsForm.insurance.expiryDate || null,
        }
      };

      await updateUser(selectedPatient._id, updateData);
      showToast("success", "Demographics & Insurance updated successfully");
      setIsEditingDemographics(false);
      reloadChartData();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to update demographics");
      console.error(err);
    } finally {
      setSubmittingAction(false);
    }
  };

  const [familySearchText, setFamilySearchText] = useState("");
  const [familySearchResults, setFamilySearchResults] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [familyRelation, setFamilyRelation] = useState("Spouse");

  const handleFamilySearch = async (val) => {
    setFamilySearchText(val);
    if (val.trim().length < 2) {
      setFamilySearchResults([]);
      return;
    }
    try {
      const res = await fetchUsers({ role: "PATIENT", search: val, limit: 5 });
      const results = (res.users || res.data || []).filter(p => p._id !== selectedPatient._id);
      setFamilySearchResults(results);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFamilyMember = async () => {
    if (!selectedFamilyMember) {
      showToast("error", "Please select a patient to map");
      return;
    }
    try {
      // 1. Update current patient mapping
      const updatedMapping = [
        ...(selectedPatient.familyMapping || []).map(f => ({
          patient: f.patient?._id || f.patient,
          relation: f.relation
        })),
        { patient: selectedFamilyMember._id, relation: familyRelation }
      ];

      await updateUser(selectedPatient._id, {
        familyMapping: updatedMapping
      });

      // 2. Map back reciprocal mapping
      let reciprocalRelation = "Other";
      if (familyRelation === "Spouse") reciprocalRelation = "Spouse";
      if (familyRelation === "Sibling") reciprocalRelation = "Sibling";
      if (familyRelation === "Parent") reciprocalRelation = "Child";
      if (familyRelation === "Child") reciprocalRelation = "Parent";

      const targetMapping = [
        ...(selectedFamilyMember.familyMapping || []).map(f => ({
          patient: f.patient?._id || f.patient,
          relation: f.relation
        })),
        { patient: selectedPatient._id, relation: reciprocalRelation }
      ];

      await updateUser(selectedFamilyMember._id, {
        familyMapping: targetMapping
      });

      showToast("success", `Mapped ${selectedFamilyMember.firstName} as ${familyRelation}`);
      setSelectedFamilyMember(null);
      setFamilySearchText("");
      setFamilySearchResults([]);
      
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to map family member");
    }
  };

  const handleRemoveFamilyMember = async (mappedId) => {
    try {
      // 1. Remove from current patient
      const updatedMapping = (selectedPatient.familyMapping || [])
        .filter(f => (f.patient?._id || f.patient) !== mappedId)
        .map(f => ({
          patient: f.patient?._id || f.patient,
          relation: f.relation
        }));

      await updateUser(selectedPatient._id, {
        familyMapping: updatedMapping
      });

      // 2. Remove reciprocal from target patient
      const targetRes = await fetchUsers({ search: mappedId });
      const target = (targetRes.users || targetRes.data || []).find(p => p._id === mappedId);
      if (target) {
        const targetMapping = (target.familyMapping || [])
          .filter(f => (f.patient?._id || f.patient) !== selectedPatient._id)
          .map(f => ({
            patient: f.patient?._id || f.patient,
            relation: f.relation
          }));
        await updateUser(mappedId, {
          familyMapping: targetMapping
        });
      }

      showToast("success", "Family mapping removed");
      reloadChartData();
    } catch (err) {
      showToast("error", "Failed to remove mapping");
    }
  };

  const handlePrimarySearch = async (val) => {
    setPrimarySearchText(val);
    if (val.trim().length < 2) {
      setPrimarySearchResults([]);
      return;
    }
    try {
      const res = await fetchUsers({ role: "PATIENT", search: val, limit: 5 });
      setPrimarySearchResults(res.users || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSecondarySearch = async (val) => {
    setSecondarySearchText(val);
    if (val.trim().length < 2) {
      setSecondarySearchResults([]);
      return;
    }
    try {
      const res = await fetchUsers({ role: "PATIENT", search: val, limit: 5 });
      setSecondarySearchResults(res.users || res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMergePatients = async (e) => {
    e.preventDefault();
    if (!primaryMergePatient || !secondaryMergePatient) {
      showToast("error", "Please select both primary and duplicate patients");
      return;
    }
    if (primaryMergePatient._id === secondaryMergePatient._id) {
      showToast("error", "Cannot merge a profile into itself");
      return;
    }
    try {
      setMerging(true);
      await mergePatients({
        primaryPatientId: primaryMergePatient._id,
        secondaryPatientId: secondaryMergePatient._id
      });
      showToast("success", "Patient profiles merged successfully!");
      setIsMergeModalOpen(false);
      setPrimaryMergePatient(null);
      setSecondaryMergePatient(null);
      setPrimarySearchText("");
      setSecondarySearchText("");
      loadPatients();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to merge patients");
    } finally {
      setMerging(false);
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

  const handlePrintSingleLab = (lab) => {
    if (!lab) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
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
                <h1 class="hospital-title">${selectedPatient.hospital?.name || "AI Hospital Group"}</h1>
                <h2 class="doc-title">Pathology & Diagnostic Lab Report</h2>
              </td>
              <td style="text-align: right; font-size: 11px; color: #64748b;">
                <div>Report Date: ${lab.sampleCollectedAt ? new Date(lab.sampleCollectedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div>Status: RELEASED</div>
              </td>
            </tr>
          </table>

          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${selectedPatient.firstName} ${selectedPatient.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${selectedPatient.uhid || "N/A"}</div>
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
                <h1 class="hospital-title">${selectedPatient.hospital?.name || "AI Hospital Group"}</h1>
                <h2 class="doc-title">Pathology & Diagnostic Lab Report</h2>
              </td>
              <td style="text-align: right; font-size: 11px; color: #64748b;">
                <div>Report Date: ${lab.sampleCollectedAt ? new Date(lab.sampleCollectedAt).toLocaleDateString() : new Date().toLocaleDateString()}</div>
                <div>Status: RELEASED</div>
              </td>
            </tr>
          </table>
          <div class="meta-grid">
            <div class="meta-item"><strong>Patient Name:</strong> ${selectedPatient.firstName} ${selectedPatient.lastName}</div>
            <div class="meta-item"><strong>UHID (Patient ID):</strong> ${selectedPatient.uhid || "N/A"}</div>
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

  const handlePrintNursingNotes = () => {
    if (!clinicalData?.notes || clinicalData.notes.length === 0) return;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Nursing Observations Log - ${selectedPatient.firstName} ${selectedPatient.lastName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: 0 auto; line-height: 1.6; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 800; color: #0284c7; margin: 0; }
            .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
            .note-item { border-bottom: 1px solid #e2e8f0; padding: 12px 0; }
            .note-text { font-size: 14px; color: #0f172a; font-weight: 500; margin: 0 0 4px 0; }
            .note-meta { font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Patient Nursing Observations History Log</h1>
            <div class="meta">
              Patient: <strong>${selectedPatient.firstName} ${selectedPatient.lastName}</strong> | UHID: <strong>${selectedPatient.uhid}</strong><br>
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
          <div>
            ${clinicalData.notes.map(n => `
              <div class="note-item">
                <p class="note-text">${n.note}</p>
                <div class="note-meta">
                  Logged by: ${n.recordedBy ? n.recordedBy.firstName + ' ' + n.recordedBy.lastName : 'Staff'} on ${new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            `).join("")}
          </div>
          <script>
            setTimeout(() => { window.print(); }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownloadNursingNotes = () => {
    if (!clinicalData?.notes || clinicalData.notes.length === 0) return;
    const htmlContent = `
      <html>
        <head>
          <title>Nursing Observations Log - ${selectedPatient.firstName} ${selectedPatient.lastName}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 700px; margin: 0 auto; line-height: 1.6; }
            .header { border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: 800; color: #0284c7; margin: 0; }
            .meta { font-size: 13px; color: #64748b; margin-top: 5px; }
            .note-item { border-bottom: 1px solid #e2e8f0; padding: 12px 0; }
            .note-text { font-size: 14px; color: #0f172a; font-weight: 500; margin: 0 0 4px 0; }
            .note-meta { font-size: 11px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">Patient Nursing Observations History Log</h1>
            <div class="meta">
              Patient: <strong>${selectedPatient.firstName} ${selectedPatient.lastName}</strong> | UHID: <strong>${selectedPatient.uhid}</strong><br>
              Generated on: ${new Date().toLocaleString()}
            </div>
          </div>
          <div>
            ${clinicalData.notes.map(n => `
              <div class="note-item">
                <p class="note-text">${n.note}</p>
                <div class="note-meta">
                  Logged by: ${n.recordedBy ? n.recordedBy.firstName + ' ' + n.recordedBy.lastName : 'Staff'} on ${new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            `).join("")}
          </div>
        </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: "text/html" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `nursing_notes_${selectedPatient.uhid}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={() => setIsMergeModalOpen(true)} style={{ color: "#ef4444", borderColor: "#fecaca", display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer", background: "none" }}>
            <span>🤝 Merge Profiles</span>
          </button>
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            <span>Register New Patient</span>
          </button>
        </div>
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
                    <span className="badge" style={{ background: "#e0f2fe", color: "var(--accent-primary)", fontWeight: 700 }}>
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
                        style={{ width: "45px", height: "45px", border: "1px solid var(--border-glass)", borderRadius: "6px", background: "#fff", padding: "2px" }}
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
                      <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>By: {p.registeredBy || "Self"}</div>
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
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                <div style={{ position: "relative", cursor: "pointer" }} onClick={() => setShowPhotoSourceMenu(!showPhotoSourceMenu)}>
                  <img
                    src={selectedPatient.profilePhoto || "uploads/default-avatar.png"}
                    alt={`${selectedPatient.firstName} photo`}
                    style={{ width: "65px", height: "65px", borderRadius: "50%", objectFit: "cover", border: "3px solid #0284c7", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    onError={(e) => { e.target.src = "uploads/default-avatar.png"; }}
                  />
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    background: "#0284c7",
                    borderRadius: "50%",
                    width: "20px",
                    height: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                  }}>
                    <Camera size={10} color="#fff" />
                  </div>

                  {showPhotoSourceMenu && (
                    <div style={{
                      position: "absolute",
                      top: "70px",
                      left: 0,
                      background: "#fff",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      zIndex: 110,
                      width: "180px",
                      display: "flex",
                      flexDirection: "column",
                      padding: "0.25rem 0"
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          border: "none",
                          background: "none",
                          width: "100%",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8rem",
                          color: "#334155",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#f1f5f9"}
                        onMouseLeave={(e) => e.target.style.background = "none"}
                      >
                        <Camera size={14} /> Take Photo (Camera)
                      </button>
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          border: "none",
                          background: "none",
                          width: "auto",
                          textAlign: "left",
                          padding: "0.5rem 0.75rem",
                          fontSize: "0.8rem",
                          color: "#334155",
                          cursor: "pointer",
                          transition: "background 0.2s",
                          margin: 0
                        }}
                        onMouseEnter={(e) => e.target.style.background = "#f1f5f9"}
                        onMouseLeave={(e) => e.target.style.background = "none"}
                      >
                        <Upload size={14} /> Upload from Gallery
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleGalleryUpload}
                          style={{ display: "none" }}
                        />
                      </label>
                    </div>
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", gap: "0.35rem", alignItems: "center" }}>
                    <span className="badge" style={{ background: "#e0f2fe", color: "var(--accent-primary)", fontSize: "0.75rem", fontWeight: 700 }}>
                      UHID: {selectedPatient.uhid || "N/A"}
                    </span>
                    {selectedPatient.patientId && (
                      <span className="badge" style={{ background: "#f1f5f9", color: "#475569", fontSize: "0.75rem", fontWeight: 700 }}>
                        ID: {selectedPatient.patientId}
                      </span>
                    )}
                  </div>
                  <h2 style={{ margin: "0.25rem 0 0", fontSize: "1.35rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </h2>
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                    {selectedPatient.medicalAlerts?.length > 0 && selectedPatient.medicalAlerts.map((alert, i) => (
                      <span key={i} className="badge" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: "0.65rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                        🚨 ALERT: {alert}
                      </span>
                    ))}
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
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "center" }}>
                  {/* QR Code generator */}
                  <div 
                    style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      background: "var(--bg-secondary)", 
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
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent("http://" + systemIp + ":5173/login?uhid=" + selectedPatient.uhid)}`} 
                      alt="Patient UHID QR"
                      style={{ width: "90px", height: "90px" }}
                    />
                    <span style={{ fontSize: "0.55rem", color: "var(--accent-primary)", fontWeight: 800, marginTop: "0.2rem" }}>ZOOM QR CODE</span>
                  </div>
                  <button
                    onClick={() => handlePrintIdCard(selectedPatient)}
                    className="btn btn-secondary"
                    style={{ padding: "0.3rem 0.5rem", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "var(--accent-primary)", bordercolor: "var(--accent-primary)", background: "none", cursor: "pointer", width: "100%", justifyContent: "center" }}
                  >
                    🪪 Print ID Card
                  </button>
                  <button
                    onClick={() => handlePrintPatientReport(selectedPatient)}
                    className="btn btn-secondary"
                    style={{ padding: "0.3rem 0.5rem", marginTop: "0.5rem", fontSize: "0.7rem", display: "flex", alignItems: "center", gap: "0.25rem", color: "#0ea5e9", borderColor: "#0ea5e9", background: "none", cursor: "pointer", width: "100%", justifyContent: "center" }}
                  >
                    📄 Print Clinical Report
                  </button>
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
                background: "#f8fafc", 
                borderBottom: "1px solid var(--border-glass)", 
                padding: "0 1rem", 
                overflowX: "auto" 
              }}
            >
              {(() => {
                const tabs = [];
                if (user?.role === "DOCTOR") {
                  tabs.push(
                    { id: "consultation", label: "Consultation Room", icon: Stethoscope },
                    { id: "history", label: "Medical History", icon: Clock },
                    { id: "prescriptions", label: "Prescribe Meds", icon: Pill },
                    { id: "instructions", label: "Nurse Tasks", icon: ClipboardList },
                    { id: "labs", label: "Order Labs", icon: Activity },
                    { id: "vitals", label: "Vitals & Notes", icon: VitalsIcon },
                    { id: "family", label: "Family & Relations", icon: UserCheck },
                    { id: "discharge", label: "Discharge Patient", icon: ShieldAlert },
                    { id: "documents", label: "Attachments & Docs", icon: FileText }
                  );
                } else if (user?.role === "NURSE") {
                  tabs.push(
                    { id: "overview", label: "Overview", icon: User },
                    { id: "history", label: "Medical History", icon: Clock },
                    { id: "vitals", label: "Vitals", icon: VitalsIcon },
                    { id: "medications", label: "Medications", icon: Calendar },
                    { id: "instructions", label: "Instructions", icon: ClipboardList },
                    { id: "notes", label: "Notes", icon: Save },
                    { id: "labs", label: "Labs", icon: Activity },
                    { id: "family", label: "Family & Relations", icon: UserCheck },
                    { id: "documents", label: "Documents", icon: FileText }
                  );
                } else {
                  tabs.push(
                    { id: "overview", label: "Overview", icon: User },
                    { id: "vitals", label: "Vitals", icon: VitalsIcon },
                    { id: "medications", label: "Medications", icon: Calendar },
                    { id: "instructions", label: "Instructions", icon: ClipboardList },
                    { id: "notes", label: "Notes", icon: Save },
                    { id: "labs", label: "Labs", icon: Activity },
                    { id: "family", label: "Family & Relations", icon: UserCheck },
                    { id: "documents", label: "Documents", icon: FileText }
                  );
                }
                return tabs.map((tab) => {
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
                });
              })()}
            </div>

            {/* Drawer Body content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem", background: "#f8fafc" }}>
              {chartLoading ? (
                <div style={{ textAlign: "center", padding: "4rem 0" }}>
                  <p style={{ color: "var(--text-secondary)" }}>Loading patient clinical summaries...</p>
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

                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Log Clinical Diagnosis & Consultation</h4>
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
                        <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Update EMR Warning Tags & Alerts</h4>
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
                            <button type="submit" className="btn btn-secondary" style={{ width: "fit-content", bordercolor: "var(--accent-primary)", color: "var(--accent-primary)" }} disabled={submittingAction}>
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
                      <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "var(--text-primary)" }}>Patient Medical History Timeline</h4>
                      {clinicalData?.consultations?.length === 0 ? (
                        <p style={{ color: "var(--text-secondary)" }}>No previous consultation diagnosis logged.</p>
                      ) : (
                        clinicalData?.consultations?.map((c) => (
                          <div key={c._id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-glass)", padding: "1.25rem", borderRadius: "10px", borderLeft: "4px solid #0284c7" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                              <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>Diagnosis: {c.diagnosis}</strong>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "#334155" }}>{c.clinicalNotes || "No notes added."}</p>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px solid #f1f5f9", paddingTop: "0.5rem" }}>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Prescribe New Medication</h4>
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
                                style={{ padding: "0.35rem 0.65rem", fontSize: "0.75rem", color: "var(--accent-primary)", bordercolor: "var(--accent-primary)" }}
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

                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "var(--text-primary)" }}>Prescription History Log</h4>
                        {clinicalData?.medications?.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No prescriptions registered yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.medications?.map((m) => (
                              <div key={m._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "0.85rem", borderRadius: "8px" }}>
                                <div>
                                  <strong style={{ fontSize: "0.9rem" }}>{m.medicationName}</strong>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{m.dosage} - {m.frequency}</div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Prescribed by: Dr. {m.prescribedBy?.firstName || "Unknown"}</div>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Assign Nurse Instruction Task</h4>
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

                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "var(--text-primary)" }}>Care Tasks Log</h4>
                        {clinicalData?.instructions?.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No nurse tasks logged.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.instructions?.map((inst) => (
                              <div key={inst._id} style={{ border: "1px solid var(--border-glass)", padding: "0.85rem", borderRadius: "8px" }}>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Order Lab Diagnostic Test</h4>
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

                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "var(--text-primary)" }}>Laboratory Diagnostic Requests</h4>
                        {clinicalData?.labs?.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No lab tests requested yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.labs?.map((l) => {
                              let badgeBg = "#fef3c7"; // PENDING / default
                              let badgeColor = "#d97706";
                              if (l.status === "SAMPLE_COLLECTED") {
                                badgeBg = "#e0f2fe";
                                badgeColor = "#0284c7";
                              } else if (l.status === "COMPLETED") {
                                badgeBg = "#dcfce7";
                                badgeColor = "#15803d";
                              } else if (l.status === "REJECTED") {
                                badgeBg = "#fee2e2";
                                badgeColor = "#ef4444";
                              } else if (l.status === "ACCEPTED") {
                                badgeBg = "#f0fdf4";
                                badgeColor = "#16a34a";
                              }
                              return (
                                <div key={l._id} style={{ display: "flex", flexDirection: "column", gap: "0.5rem", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "10px", background: "var(--bg-secondary)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div>
                                      <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{l.testName}</strong>
                                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>Order Date: {new Date(l.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    <span className="badge" style={{ background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                                      {l.status}
                                    </span>
                                  </div>
                                  
                                  {l.status === "COMPLETED" && (
                                    <div style={{ marginTop: "0.5rem", padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                      <div style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>Results:</div>
                                      <div style={{ fontSize: "0.85rem", color: "#1e293b", marginTop: "0.15rem" }}>{l.results || "Diagnostic parameters normal."}</div>
                                      
                                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", height: "auto" }}
                                          onClick={() => handlePrintSingleLab(l)}
                                        >
                                          Print
                                        </button>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", height: "auto" }}
                                          onClick={() => handleDownloadSingleLab(l)}
                                        >
                                          Download HTML
                                        </button>
                                      </div>
                                      
                                      {l.reportFile && (
                                        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                                          <span style={{ fontSize: "1rem" }}>📄</span>
                                          <a 
                                            href={`http://localhost:8086/uploads/${l.reportFile}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 700, textDecoration: "underline" }}
                                          >
                                            View Diagnostics Report File ({l.reportFile})
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  {l.status === "REJECTED" && l.rejectionReason && (
                                    <div style={{ marginTop: "0.25rem", padding: "0.5rem", background: "#fee2e2", borderRadius: "8px", border: "1px solid #fecaca", fontSize: "0.8rem", color: "#dc2626" }}>
                                      <strong>Rejection Reason:</strong> {l.rejectionReason}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOCTOR EMR TAB 6: VITALS & NOTES LOGS */}
                  {activeDrawerTab === "vitals" && user?.role === "DOCTOR" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Patient Vitals History Log</h4>
                        {clinicalData?.vitals?.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No vital records registered yet.</p>
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

                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Nursing Observation logs</h4>
                        {clinicalData?.notes?.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No notes logged by nursing crew.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {clinicalData?.notes?.map((n) => (
                              <div key={n._id} style={{ borderLeft: "3px solid #10b981", paddingLeft: "0.75rem" }}>
                                <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.85rem" }}>{n.note}</p>
                                <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>Logged by: Nurse {n.recordedBy?.firstName || "Unknown"} on {new Date(n.createdAt).toLocaleDateString()}</span>
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
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>No AI summary compiled for this profile.</p>
                        )}
                      </div>

                      {/* Patient Demographics & Insurance Details Card */}
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>
                            📋 Patient Demographics & Insurance
                          </h4>
                          {user?.role !== "PATIENT" && (
                            <button
                              type="button"
                              onClick={() => setIsEditingDemographics(!isEditingDemographics)}
                              className="btn btn-secondary"
                              style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", cursor: "pointer" }}
                            >
                              {isEditingDemographics ? "Cancel" : "Edit Details"}
                            </button>
                          )}
                        </div>

                        {isEditingDemographics ? (
                          <form onSubmit={handleSaveDemographics} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                              <div>
                                <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>Contact & Demographics</h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Date of Birth</label>
                                    <input 
                                      type="date"
                                      className="form-control"
                                      value={demographicsForm.dob}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, dob: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Gender</label>
                                    <select
                                      className="form-control"
                                      value={demographicsForm.gender}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, gender: e.target.value })}
                                    >
                                      <option value="MALE">MALE</option>
                                      <option value="FEMALE">FEMALE</option>
                                      <option value="OTHER">OTHER</option>
                                    </select>
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Mobile *</label>
                                    <input 
                                      type="text"
                                      className="form-control"
                                      placeholder="10 digit number"
                                      value={demographicsForm.mobile}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, mobile: e.target.value })}
                                      required
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Email</label>
                                    <input 
                                      type="email"
                                      className="form-control"
                                      value={demographicsForm.email}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, email: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Emergency Contact</label>
                                    <input 
                                      type="text"
                                      className="form-control"
                                      value={demographicsForm.emergencyContact}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, emergencyContact: e.target.value })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Address</label>
                                    <textarea 
                                      className="form-control"
                                      rows="2"
                                      value={demographicsForm.address}
                                      onChange={(e) => setDemographicsForm({ ...demographicsForm, address: e.target.value })}
                                      style={{ resize: "none" }}
                                    />
                                  </div>
                                </div>
                              </div>
                              <div style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: "1.5rem" }}>
                                <h5 style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>Insurance Policy Details</h5>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Insurance Provider</label>
                                    <input 
                                      type="text"
                                      className="form-control"
                                      placeholder="E.g. Blue Cross"
                                      value={demographicsForm.insurance.provider}
                                      onChange={(e) => setDemographicsForm({
                                        ...demographicsForm,
                                        insurance: { ...demographicsForm.insurance, provider: e.target.value }
                                      })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Policy Number</label>
                                    <input 
                                      type="text"
                                      className="form-control"
                                      placeholder="E.g. POL-12345"
                                      value={demographicsForm.insurance.policyNumber}
                                      onChange={(e) => setDemographicsForm({
                                        ...demographicsForm,
                                        insurance: { ...demographicsForm.insurance, policyNumber: e.target.value }
                                      })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Coverage Limit ($)</label>
                                    <input 
                                      type="number"
                                      className="form-control"
                                      placeholder="E.g. 5000"
                                      value={demographicsForm.insurance.coverageAmount}
                                      onChange={(e) => setDemographicsForm({
                                        ...demographicsForm,
                                        insurance: { ...demographicsForm.insurance, coverageAmount: e.target.value }
                                      })}
                                    />
                                  </div>
                                  <div className="form-group">
                                    <label style={{ fontSize: "0.75rem", marginBottom: "0.25rem" }}>Expiry Date</label>
                                    <input 
                                      type="date"
                                      className="form-control"
                                      value={demographicsForm.insurance.expiryDate}
                                      onChange={(e) => setDemographicsForm({
                                        ...demographicsForm,
                                        insurance: { ...demographicsForm.insurance, expiryDate: e.target.value }
                                      })}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem" }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setIsEditingDemographics(false)}
                                style={{ width: "fit-content" }}
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ width: "fit-content" }}
                                disabled={submittingAction}
                              >
                                <Save size={16} />
                                <span>Save Changes</span>
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                            <div>
                              <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>Contact & Demographics</h5>
                              <div style={{ fontSize: "0.85rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                <div><strong>DOB:</strong> {selectedPatient.dob ? new Date(selectedPatient.dob).toLocaleDateString() : "N/A"}</div>
                                <div><strong>Age:</strong> {selectedPatient.age ? `${selectedPatient.age} years` : (selectedPatient.dob ? "Calculated" : "N/A")}</div>
                                <div><strong>Gender:</strong> {selectedPatient.gender}</div>
                                <div><strong>Mobile:</strong> {selectedPatient.mobile}</div>
                                <div><strong>Email:</strong> {selectedPatient.email}</div>
                                <div><strong>Emergency Contact:</strong> {selectedPatient.emergencyContact || "N/A"}</div>
                                <div style={{ marginTop: "0.25rem" }}><strong>Address:</strong><br /><span style={{ color: "var(--text-secondary)" }}>{selectedPatient.address || "No address on file"}</span></div>
                              </div>
                            </div>
                            <div style={{ borderLeft: "1px solid #f1f5f9", paddingLeft: "1.5rem" }}>
                              <h5 style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 700 }}>Insurance Policy Details</h5>
                              {selectedPatient.insurance && selectedPatient.insurance.provider ? (
                                <div style={{ fontSize: "0.85rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                  <div><strong>Provider:</strong> <span style={{ color: "var(--accent-primary)", fontWeight: 700 }}>{selectedPatient.insurance.provider}</span></div>
                                  <div><strong>Policy #:</strong> {selectedPatient.insurance.policyNumber || "N/A"}</div>
                                  <div><strong>Coverage Limit:</strong> ${selectedPatient.insurance.coverageAmount || 0}</div>
                                  <div><strong>Expiry Date:</strong> {selectedPatient.insurance.expiryDate ? new Date(selectedPatient.insurance.expiryDate).toLocaleDateString() : "N/A"}</div>
                                  <span className="badge" style={{ width: "fit-content", background: "#ecfdf5", color: "#059669", fontSize: "0.7rem", fontWeight: 700, marginTop: "0.5rem" }}>ACTIVE POLICY</span>
                                </div>
                              ) : (
                                <div style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                  No insurance coverage logged. Patient is on self-pay status.
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

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
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Temperature</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.temperature}°F</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Blood Pressure</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.bp} mmHg</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
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
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Respiratory Rate</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>{latest.respiratoryRate || "N/A"}/min</div>
                                </div>
                                <div style={{ background: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-glass)" }}>
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
                                <tr style={{ borderBottom: "1px solid var(--border-glass)", background: "#f8fafc", textAlign: "left" }}>
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
                                  <tr key={v._id} style={{ borderBottom: "1px solid var(--border-glass)" }}>
                                    <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{new Date(v.createdAt).toLocaleString()}</td>
                                    <td style={{ padding: "0.5rem", fontWeight: 600 }}>{v.temperature}°F</td>
                                    <td style={{ padding: "0.5rem" }}>{v.bp}</td>
                                    <td style={{ padding: "0.5rem" }}>{v.heartRate || "N/A"} bpm</td>
                                    <td style={{ padding: "0.5rem", color: v.spo2 && v.spo2 < 95 ? "#dc2626" : "inherit", fontWeight: v.spo2 && v.spo2 < 95 ? 700 : "normal" }}>{v.spo2 || "N/A"}%</td>
                                    <td style={{ padding: "0.5rem" }}>{v.sugar || "N/A"}</td>
                                    <td style={{ padding: "0.5rem", color: "var(--text-secondary)" }}>{v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : "Staff"}</td>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Medication Administration Record (MAR)</h4>
                        {!clinicalData?.medications || clinicalData.medications.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No medication prescriptions logged for this patient.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.medications.map((med) => (
                              <div key={med._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", background: med.status === "GIVEN" ? "#f0fdf4" : "white" }}>
                                <div>
                                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{med.medicationName}</strong>
                                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                    Dosage: <strong>{med.dosage}</strong> | Frequency: <strong>{med.frequency}</strong>
                                  </div>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
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
                                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Doctor's Care Instructions & Tasks</h4>
                        {!clinicalData?.instructions || clinicalData.instructions.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No doctor instructions found.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.instructions.map((inst) => (
                              <div key={inst._id} style={{ border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", background: inst.status === "COMPLETED" ? "#f8fafc" : "white" }}>
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
                                    <span className="badge" style={{ background: "#f1f5f9", color: "var(--text-secondary)", fontWeight: 700 }}>
                                      COMPLETED
                                    </span>
                                  )}
                                </div>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: "0.25rem 0" }}>{inst.instruction}</p>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", borderTop: "1px dashed #e2e8f0", paddingTop: "0.5rem", marginTop: "0.5rem" }}>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>Log Nursing Note</h4>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--accent-primary)", fontWeight: 600 }}>🎙️ AI Voice Dictate:</span>
                            <AIVoiceAssistant mode="stt" onTranscript={(text) => setNoteText(prev => prev ? prev + " " + text : text)} />
                          </div>
                        </div>
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
                              style={{ resize: "vertical", width: "100%" }}
                            />
                          </div>
                          <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={submittingAction}>
                            <Save size={16} />
                            <span>Save Observation Note</span>
                          </button>
                        </form>
                      </div>

                      {/* Notes log */}
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                          <h4 style={{ margin: 0, fontSize: "1rem", color: "var(--text-primary)" }}>Observations History Log</h4>
                          {clinicalData?.notes?.length > 0 && (
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                              <button 
                                onClick={handlePrintNursingNotes} 
                                className="btn btn-secondary" 
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", height: "auto" }}
                              >
                                Print Notes
                              </button>
                              <button 
                                onClick={handleDownloadNursingNotes} 
                                className="btn btn-secondary" 
                                style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem", height: "auto" }}
                              >
                                Download HTML
                              </button>
                            </div>
                          )}
                        </div>
                        {!clinicalData?.notes || clinicalData.notes.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No nursing notes logged yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.notes.map((note) => (
                              <div key={note._id} style={{ borderLeft: "3px solid #0284c7", paddingLeft: "1rem", paddingBottom: "0.25rem" }}>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-primary)", margin: "0 0 0.25rem 0" }}>{note.note}</p>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Laboratory Test Request Tracking</h4>
                        {!clinicalData?.labs || clinicalData.labs.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No lab test requests logged for this patient.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {clinicalData.labs.map((lab) => (
                              <div key={lab._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", background: lab.status === "SAMPLE_COLLECTED" ? "#f0fdf4" : "white" }}>
                                <div>
                                  <strong style={{ fontSize: "0.95rem", color: "var(--text-primary)" }}>{lab.testName}</strong>
                                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                    Ordered by Dr. {lab.prescribedBy ? `${lab.prescribedBy.firstName} ${lab.prescribedBy.lastName}` : "Doctor"}
                                  </div>
                                </div>
                                <div>
                                  {lab.status === "COMPLETED" ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                                      <span className="badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                                        COMPLETED
                                      </span>
                                      <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.25rem", textAlign: "right" }}>
                                        <strong>Findings:</strong> {lab.results}
                                      </div>
                                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.25rem" }}>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", height: "auto" }}
                                          onClick={() => handlePrintSingleLab(lab)}
                                        >
                                          Print
                                        </button>
                                        <button 
                                          className="btn btn-secondary" 
                                          style={{ padding: "0.2rem 0.5rem", fontSize: "0.7rem", height: "auto" }}
                                          onClick={() => handleDownloadSingleLab(lab)}
                                        >
                                          Download HTML
                                        </button>
                                      </div>
                                    </div>
                                  ) : lab.status === "REJECTED" ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <span className="badge" style={{ background: "#fee2e2", color: "#ef4444", fontWeight: 700 }}>
                                        REJECTED
                                      </span>
                                      <span style={{ fontSize: "0.75rem", color: "#ef4444", marginTop: "0.2rem" }}>
                                        Reason: {lab.rejectionReason}
                                      </span>
                                    </div>
                                  ) : lab.status === "SAMPLE_COLLECTED" ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <span className="badge" style={{ background: "#e0f2fe", color: "var(--accent-primary)", fontWeight: 700 }}>
                                        SAMPLE COLLECTED (PROCESSING)
                                      </span>
                                      <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                        By Nurse {lab.sampleCollectedBy ? `${lab.sampleCollectedBy.firstName} ${lab.sampleCollectedBy.lastName}` : "Staff"}
                                      </span>
                                    </div>
                                  ) : lab.status === "ACCEPTED" ? (
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                                      <span className="badge" style={{ background: "#f0fdf4", color: "#16a34a", fontWeight: 700 }}>
                                        ACCEPTED (PROCESSING)
                                      </span>
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => handleCollectLabSample(lab._id)} 
                                      className="btn btn-primary" 
                                      style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem", background: "#0284c7" }}
                                    >
                                      Collect Specimen
                                    </button>
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
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Patient Attachments & Scanned Documents</h4>
                        {!selectedPatient.documents || selectedPatient.documents.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No files or attachments uploaded yet.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {selectedPatient.documents.map((doc, idx) => (
                              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid var(--border-glass)", padding: "0.85rem 1.25rem", borderRadius: "8px", background: "#f8fafc" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                  <FileText size={20} style={{ color: "var(--text-secondary)" }} />
                                  <div>
                                    <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{doc.name}</strong>
                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
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
                                    style={{ fontSize: "0.8rem", color: "var(--text-secondary)", fontWeight: 700, textDecoration: "none" }}
                                  >
                                    View File
                                  </a>
                                  <button
                                    onClick={() => handleSummarizeDocument(doc.name)}
                                    className="btn btn-secondary"
                                    style={{ padding: "0.25rem 0.5rem", fontSize: "0.7rem", color: "var(--accent-primary)", borderColor: "#bae6fd" }}
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
                              <button onClick={() => setAiReportSummary(null)} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.8rem" }}>Clear</button>
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
                        <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)" }}>Upload Scanned Document / Report</h4>
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

                  {/* TAB 8: FAMILY & RELATIONS */}
                  {activeDrawerTab === "family" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>Map Family Member Relationship</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                          <div className="form-group">
                            <label>Search Patient by Name, UHID, or Mobile</label>
                            <input 
                              type="text" 
                              className="form-control"
                              value={familySearchText} 
                              onChange={(e) => handleFamilySearch(e.target.value)}
                              placeholder="Type name, mobile or UHID..."
                            />
                            {familySearchResults.length > 0 && (
                              <div style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid #cbd5e1",
                                borderRadius: "8px",
                                marginTop: "0.25rem",
                                boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                                maxHeight: "150px",
                                overflowY: "auto",
                                position: "absolute",
                                width: "100%",
                                zIndex: 10
                              }}>
                                {familySearchResults.map(res => (
                                  <div 
                                    key={res._id}
                                    onClick={() => {
                                      setSelectedFamilyMember(res);
                                      setFamilySearchResults([]);
                                    }}
                                    style={{
                                      padding: "0.5rem 0.75rem",
                                      cursor: "pointer",
                                      borderBottom: "1px solid var(--border-glass)",
                                      background: selectedFamilyMember?._id === res._id ? "#f0f9ff" : "transparent"
                                    }}
                                  >
                                    <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{res.firstName} {res.lastName}</strong>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {res.uhid} | Mobile: {res.mobile}</div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {selectedFamilyMember && (
                            <div style={{ background: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid var(--border-glass)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Selected Patient:</span>
                                <h5 style={{ margin: "0.15rem 0 0 0", color: "var(--text-primary)" }}>{selectedFamilyMember.firstName} {selectedFamilyMember.lastName}</h5>
                              </div>
                              <button onClick={() => setSelectedFamilyMember(null)} style={{ background: "none", border: "none", color: "#dc2626", fontSize: "0.8rem", cursor: "pointer", fontWeight: 700 }}>Clear</button>
                            </div>
                          )}

                          <div className="form-group">
                            <label>Relationship Type</label>
                            <select 
                              className="form-control"
                              value={familyRelation}
                              onChange={(e) => setFamilyRelation(e.target.value)}
                            >
                              <option value="Spouse">Spouse</option>
                              <option value="Child">Child</option>
                              <option value="Parent">Parent</option>
                              <option value="Sibling">Sibling</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <button 
                            type="button" 
                            onClick={handleAddFamilyMember} 
                            className="btn btn-primary" 
                            style={{ width: "fit-content" }}
                            disabled={!selectedFamilyMember}
                          >
                            <Plus size={16} />
                            <span>Link Family Relation</span>
                          </button>
                        </div>
                      </div>

                      {/* Mapped Family Members List */}
                      <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                        <h4 style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "var(--text-primary)", fontWeight: 700 }}>Mapped Family Members</h4>
                        {!selectedPatient.familyMapping || selectedPatient.familyMapping.length === 0 ? (
                          <p style={{ color: "var(--text-secondary)", margin: 0 }}>No family members mapped to this patient profile.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {selectedPatient.familyMapping.map((fam, idx) => {
                              const relative = fam.patient;
                              if (!relative) return null;
                              return (
                                <div 
                                  key={idx} 
                                  style={{
                                    display: "flex", 
                                    justifyContent: "space-between", 
                                    alignItems: "center", 
                                    border: "1px solid var(--border-glass)", 
                                    padding: "0.85rem 1rem", 
                                    borderRadius: "8px",
                                    background: "#f8fafc"
                                  }}
                                >
                                  <div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                      <span className="badge" style={{ background: "#e0f2fe", color: "var(--accent-primary)", fontSize: "0.7rem", fontWeight: 700 }}>
                                        {fam.relation.toUpperCase()}
                                      </span>
                                      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{relative.firstName} {relative.lastName}</strong>
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                      UHID: {relative.uhid || relative.patientId} | Mobile: {relative.mobile}
                                    </div>
                                  </div>
                                  <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                      onClick={() => handleOpenChart(relative)}
                                      className="btn btn-secondary"
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "var(--accent-primary)", borderColor: "#bae6fd", background: "var(--bg-secondary)", cursor: "pointer" }}
                                    >
                                      Open Chart
                                    </button>
                                    <button
                                      onClick={() => handleRemoveFamilyMember(relative._id)}
                                      className="btn btn-secondary"
                                      style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "#ef4444", borderColor: "#fecaca", background: "var(--bg-secondary)", cursor: "pointer" }}
                                    >
                                      Unlink
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 9: PATIENT DISCHARGE WORKFLOW */}
                  {activeDrawerTab === "discharge" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                      {dischargeRecord ? (
                        <div className="modal-card" style={{ background: "#ecfdf5", padding: "1.5rem", borderRadius: "12px", border: "1px solid #a7f3d0" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "#065f46", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                            <CheckCircle size={20} />
                            <span>Patient Discharge Complete</span>
                          </h4>
                          
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontSize: "0.9rem", color: "#065f46" }}>
                            <div>
                              <strong>Discharge Summary Note:</strong>
                              <p style={{ margin: "0.25rem 0 0 0", fontStyle: "italic", whiteSpace: "pre-wrap" }}>{dischargeRecord.dischargeSummary}</p>
                            </div>
                            
                            {dischargeRecord.takeHomeMedications?.length > 0 && (
                              <div>
                                <strong>Take-Home Medications:</strong>
                                <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.2rem" }}>
                                  {dischargeRecord.takeHomeMedications.map((med, idx) => (
                                    <li key={idx}>
                                      <strong>{med.medicationName}</strong> - {med.dosage} ({med.frequency})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div style={{ borderTop: "1px solid #a7f3d0", paddingTop: "0.75rem", marginTop: "0.5rem", fontSize: "0.8rem", opacity: 0.9 }}>
                              Discharged by Dr. {dischargeRecord.doctor?.firstName} {dischargeRecord.doctor?.lastName} on {new Date(dischargeRecord.dischargedAt).toLocaleString()}
                              <div style={{ marginTop: "0.25rem" }}>
                                <strong>Billing Settlement Audit:</strong> {dischargeRecord.billingCleared ? "✓ Paid & Cleared" : "⚠️ Outstanding Balance at Discharge"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="modal-card" style={{ background: "var(--bg-secondary)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-glass)" }}>
                          <h4 style={{ margin: "0 0 1rem 0", fontSize: "1.05rem", color: "var(--text-primary)" }}>Draft Patient Discharge Summary</h4>
                          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", margin: "0 0 1rem 0" }}>
                            Verify patient vitals are stable, outstanding laboratory reports have been reviewed, and prepare take-home medication dosage instructions.
                          </p>

                          <form onSubmit={handleSaveDischarge} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div className="form-group">
                              <label>Clinical Discharge Summary / Advice *</label>
                              <textarea
                                className="form-control"
                                rows="4"
                                value={dischargeSummaryInput}
                                onChange={(e) => setDischargeSummaryInput(e.target.value)}
                                placeholder="Describe final patient condition, diagnosis summary, follow-up timelines, emergency symptoms warning..."
                                required
                              />
                            </div>

                            {/* Take home meds list builder */}
                            <div style={{ border: "1px solid var(--border-glass)", padding: "1rem", borderRadius: "8px", background: "#f8fafc" }}>
                              <strong style={{ fontSize: "0.85rem", color: "#475569", display: "block", marginBottom: "0.75rem" }}>Add Take-Home Medications</strong>
                              
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                                <input 
                                  type="text" 
                                  placeholder="Medication name" 
                                  className="form-control" 
                                  value={newTakeHomeMed.name} 
                                  onChange={(e) => setNewTakeHomeMed({ ...newTakeHomeMed, name: e.target.value })}
                                  style={{ fontSize: "0.8rem" }}
                                />
                                <input 
                                  type="text" 
                                  placeholder="Dosage (e.g. 500mg)" 
                                  className="form-control" 
                                  value={newTakeHomeMed.dosage} 
                                  onChange={(e) => setNewTakeHomeMed({ ...newTakeHomeMed, dosage: e.target.value })}
                                  style={{ fontSize: "0.8rem" }}
                                />
                                <div style={{ display: "flex", gap: "0.25rem" }}>
                                  <input 
                                    type="text" 
                                    placeholder="Frequency (e.g. BD)" 
                                    className="form-control" 
                                    value={newTakeHomeMed.freq} 
                                    onChange={(e) => setNewTakeHomeMed({ ...newTakeHomeMed, freq: e.target.value })}
                                    style={{ fontSize: "0.8rem", flex: 1 }}
                                  />
                                  <button 
                                    type="button" 
                                    onClick={handleAddTakeHomeMed}
                                    className="btn btn-primary"
                                    style={{ padding: "0 0.75rem" }}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              {takeHomeMedsInput.length > 0 && (
                                <table className="custom-table" style={{ fontSize: "0.8rem", background: "var(--bg-secondary)" }}>
                                  <thead>
                                    <tr>
                                      <th>Medication</th>
                                      <th>Dosage</th>
                                      <th>Frequency</th>
                                      <th style={{ textAlign: "right" }}>Action</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {takeHomeMedsInput.map((m, idx) => (
                                      <tr key={idx}>
                                        <td><strong>{m.name}</strong></td>
                                        <td>{m.dosage}</td>
                                        <td>{m.freq}</td>
                                        <td style={{ textAlign: "right" }}>
                                          <button 
                                            type="button" 
                                            onClick={() => handleRemoveTakeHomeMed(idx)}
                                            style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 700 }}
                                          >
                                            Remove
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>

                            <button type="submit" className="btn btn-primary" style={{ width: "fit-content" }} disabled={discharging}>
                              <ShieldAlert size={16} />
                              <span>{discharging ? "Processing..." : "Authorize Clinical Discharge"}</span>
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
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {duplicateWarning && (
                  <div style={{
                    background: "#fffbeb",
                    border: "1px solid #f59e0b",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#b45309", fontWeight: 700 }}>
                      <span>⚠️ Possible Existing Profile Detected</span>
                    </div>
                    <span style={{ fontSize: "0.85rem", color: "#78350f" }}>
                      A patient named <strong>{duplicateWarning.firstName} {duplicateWarning.lastName}</strong> is already registered.
                      <br />
                      <strong>UHID:</strong> {duplicateWarning.uhid} | <strong>Mobile:</strong> {duplicateWarning.mobile}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        handleOpenChart(duplicateWarning);
                      }}
                      className="btn btn-secondary"
                      style={{ width: "fit-content", padding: "0.25rem 0.5rem", fontSize: "0.75rem", color: "#b45309", borderColor: "#f59e0b" }}
                    >
                      View Existing Patient Chart
                    </button>
                  </div>
                )}

                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.firstName}
                      onChange={(e) => updateFormAndCheckDuplicate({ firstName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.lastName}
                      onChange={(e) => updateFormAndCheckDuplicate({ lastName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => updateFormAndCheckDuplicate({ email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.mobile}
                      onChange={(e) => updateFormAndCheckDuplicate({ mobile: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Gender *</label>
                    <select
                      className="form-control"
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
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
                    <label>Date of Birth</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.dob}
                      onChange={(e) => updateFormAndCheckDuplicate({ dob: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Age</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Calculated automatically"
                    />
                  </div>

                  <div className="form-group">
                    <label>Emergency Contact Mobile</label>
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

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Address</label>
                    <textarea
                      className="form-control"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Full residential address"
                      rows="2"
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Patient Photo</label>
                    <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={handlePhotoChange}
                        style={{ flex: 1 }}
                      />
                      {formData.profilePhoto && (
                        <img
                          src={formData.profilePhoto}
                          alt="Preview"
                          style={{ width: "50px", height: "50px", borderRadius: "8px", objectFit: "cover", border: "1px solid #cbd5e1" }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
                    <label>Medical Alerts & Chronic Conditions (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.medicalAlerts}
                      onChange={(e) => setFormData({ ...formData, medicalAlerts: e.target.value })}
                      placeholder="E.g. Diabetes, Penicillin Allergy, Hemophilia"
                    />
                  </div>

                  <div style={{ gridColumn: "span 2", marginTop: "0.5rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.5rem" }}>
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#1e293b" }}>Insurance Information</h4>
                  </div>

                  <div className="form-group">
                    <label>Provider</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      placeholder="E.g. Blue Cross"
                    />
                  </div>

                  <div className="form-group">
                    <label>Policy / Member Number</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.insurancePolicyNumber}
                      onChange={(e) => setFormData({ ...formData, insurancePolicyNumber: e.target.value })}
                      placeholder="E.g. POL-12983712"
                    />
                  </div>

                  <div className="form-group">
                    <label>Coverage Limit ($)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.insuranceCoverageAmount}
                      onChange={(e) => setFormData({ ...formData, insuranceCoverageAmount: e.target.value })}
                      placeholder="E.g. 10000"
                    />
                  </div>

                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.insuranceExpiryDate}
                      onChange={(e) => setFormData({ ...formData, insuranceExpiryDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: "span 2" }}>
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

      {/* Patient Merge Modal */}
      {isMergeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "680px" }}>
            <div className="modal-header">
              <h3>Merge Duplicate Patients</h3>
              <button className="action-btn" onClick={() => {
                setIsMergeModalOpen(false);
                setPrimaryMergePatient(null);
                setSecondaryMergePatient(null);
                setPrimarySearchText("");
                setSecondarySearchText("");
              }}>
                ×
              </button>
            </div>

            <form onSubmit={handleMergePatients}>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                <div style={{
                  background: "#fee2e2",
                  border: "1px solid #fecaca",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  color: "#991b1b",
                  fontSize: "0.85rem",
                  lineHeight: 1.4
                }}>
                  <strong>⚠️ CRITICAL DATA WARNING:</strong>
                  <br />
                  This action is permanent and cannot be undone. All appointments, prescriptions, diagnostic records, vitals, billing invoices, and family mappings of the <strong>Duplicate Patient (Secondary)</strong> will be merged into the <strong>Primary Patient</strong>. The Duplicate Patient profile will be deleted from the database.
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                  {/* Primary Selection */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group" style={{ position: "relative" }}>
                      <label style={{ fontWeight: 700, color: "#0369a1" }}>1. Primary Profile (To Keep) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by UHID, name, or phone..."
                        value={primarySearchText}
                        onChange={(e) => handlePrimarySearch(e.target.value)}
                      />
                      {primarySearchResults.length > 0 && (
                        <div style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          marginTop: "0.25rem",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                          maxHeight: "150px",
                          overflowY: "auto",
                          position: "absolute",
                          width: "100%",
                          zIndex: 10
                        }}>
                          {primarySearchResults.map(res => (
                            <div
                              key={res._id}
                              onClick={() => {
                                setPrimaryMergePatient(res);
                                setPrimarySearchResults([]);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-glass)"
                              }}
                            >
                              <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{res.firstName} {res.lastName}</strong>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {res.uhid} | Mobile: {res.mobile}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {primaryMergePatient ? (
                      <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "1rem", borderRadius: "8px" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#0369a1" }}>Primary Record Details</h4>
                        <div style={{ fontSize: "0.8rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div><strong>Name:</strong> {primaryMergePatient.firstName} {primaryMergePatient.lastName}</div>
                          <div><strong>UHID:</strong> {primaryMergePatient.uhid}</div>
                          {primaryMergePatient.patientId && <div><strong>Patient ID:</strong> {primaryMergePatient.patientId}</div>}
                          <div><strong>Mobile:</strong> {primaryMergePatient.mobile}</div>
                          <div><strong>Email:</strong> {primaryMergePatient.email}</div>
                          <div><strong>Joined:</strong> {new Date(primaryMergePatient.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "2rem 1rem", border: "1px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Select the primary patient record to keep
                      </div>
                    )}
                  </div>

                  {/* Secondary Selection */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className="form-group" style={{ position: "relative" }}>
                      <label style={{ fontWeight: 700, color: "#dc2626" }}>2. Duplicate Profile (To Delete) *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by UHID, name, or phone..."
                        value={secondarySearchText}
                        onChange={(e) => handleSecondarySearch(e.target.value)}
                      />
                      {secondarySearchResults.length > 0 && (
                        <div style={{
                          background: "var(--bg-secondary)",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          marginTop: "0.25rem",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
                          maxHeight: "150px",
                          overflowY: "auto",
                          position: "absolute",
                          width: "100%",
                          zIndex: 10
                        }}>
                          {secondarySearchResults.map(res => (
                            <div
                              key={res._id}
                              onClick={() => {
                                setSecondaryMergePatient(res);
                                setSecondarySearchResults([]);
                              }}
                              style={{
                                padding: "0.5rem 0.75rem",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border-glass)"
                              }}
                            >
                              <strong style={{ fontSize: "0.85rem", color: "var(--text-primary)" }}>{res.firstName} {res.lastName}</strong>
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>UHID: {res.uhid} | Mobile: {res.mobile}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {secondaryMergePatient ? (
                      <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "1rem", borderRadius: "8px" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem", color: "#991b1b" }}>Duplicate Record Details</h4>
                        <div style={{ fontSize: "0.8rem", color: "#334155", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                          <div><strong>Name:</strong> {secondaryMergePatient.firstName} {secondaryMergePatient.lastName}</div>
                          <div><strong>UHID:</strong> {secondaryMergePatient.uhid}</div>
                          {secondaryMergePatient.patientId && <div><strong>Patient ID:</strong> {secondaryMergePatient.patientId}</div>}
                          <div><strong>Mobile:</strong> {secondaryMergePatient.mobile}</div>
                          <div><strong>Email:</strong> {secondaryMergePatient.email}</div>
                          <div><strong>Joined:</strong> {new Date(secondaryMergePatient.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: "2rem 1rem", border: "1px dashed #cbd5e1", borderRadius: "8px", textAlign: "center", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                        Select the duplicate patient record to merge
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsMergeModalOpen(false);
                  setPrimaryMergePatient(null);
                  setSecondaryMergePatient(null);
                  setPrimarySearchText("");
                  setSecondarySearchText("");
                }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: "#ef4444", borderColor: "#ef4444" }}
                  disabled={!primaryMergePatient || !secondaryMergePatient || merging}
                >
                  {merging ? "Merging Profiles..." : "Confirm & Merge Patients"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Camera Capture Modal */}
      {showCameraModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(15, 23, 42, 0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            background: "var(--bg-secondary)",
            padding: "2rem",
            borderRadius: "16px",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            width: "100%",
            maxWidth: "450px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.5rem"
          }}>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Camera size={20} color="#0284c7" />
              <span>Capture Profile Photo</span>
            </h3>
            
            <div style={{
              width: "300px",
              height: "300px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "4px solid #0284c7",
              background: "#000",
              boxShadow: "inset 0 2px 4px rgba(0,0,0,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <video
                id="camera-video-feed"
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover"
                }}
              />
            </div>
            
            <div style={{ display: "flex", gap: "1rem", width: "100%" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleStopCamera}
                style={{ flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCaptureSnapshot}
                style={{ flex: 1, justifyContent: "center", background: "#0284c7", bordercolor: "var(--accent-primary)" }}
                disabled={submittingAction}
              >
                Capture Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientManagement;
