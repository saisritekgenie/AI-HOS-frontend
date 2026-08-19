import axios from "axios";

// Dynamically target the host network IP address of the backend
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://${hostname}:8086/api`;
  }
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return "http://localhost:8086/api";
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Axios Request Interceptor: Automatically attach Bearer JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("hospital_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Axios Response Interceptor: Handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("hospital_token");
      localStorage.removeItem("hospital_user");
    }
    return Promise.reject(error);
  }
);

/**
 * Authentication APIs
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  return response.data;
};

export const patientLogin = async (credentials) => {
  const response = await api.post("/auth/patient-login", credentials);
  return response.data;
};

export const fetchMe = async () => {
  const response = await api.get("/auth/me");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const fetchSystemIp = async () => {
  const response = await api.get("/auth/system-ip");
  return response.data;
};

/**
 * Hospital SaaS Tenant & Approval APIs (Super Admin)
 */
export const registerHospital = async (data) => {
  const response = await api.post("/super-admin/hospitals/register", data);
  return response.data;
};

export const fetchHospitals = async (params = {}) => {
  const response = await api.get("/super-admin/hospitals", { params });
  return response.data;
};

export const approveHospital = async (id) => {
  const response = await api.put(`/super-admin/hospitals/${id}/approve`);
  return response.data;
};

export const rejectHospital = async (id) => {
  const response = await api.put(`/super-admin/hospitals/${id}/reject`);
  return response.data;
};

/**
 * User Management APIs
 */
export const fetchUsers = async (params = {}) => {
  const response = await api.get("/super-admin/users", { params });
  return response.data;
};

export const fetchUserById = async (id) => {
  const response = await api.get(`/super-admin/users/${id}`);
  return response.data;
};

export const createUser = async (userData) => {
  const response = await api.post("/super-admin/users", userData);
  return response.data;
};

export const updateUser = async (id, userData) => {
  const response = await api.put(`/super-admin/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/super-admin/users/${id}`);
  return response.data;
};

export const enableUser = async (id) => {
  const response = await api.put(`/super-admin/users/${id}/enable`);
  return response.data;
};

export const disableUser = async (id) => {
  const response = await api.put(`/super-admin/users/${id}/disable`);
  return response.data;
};

export const checkDuplicatePatient = async (data) => {
  const response = await api.post("/super-admin/users/check-duplicate", data);
  return response.data;
};

export const mergePatients = async (data) => {
  const response = await api.post("/super-admin/users/merge", data);
  return response.data;
};

/**
 * Clinical Charting & Nursing API
 */
export const fetchClinicalStats = async () => {
  const response = await api.get("/clinical/dashboard-stats");
  return response.data;
};

export const fetchPatientClinicalSummary = async (patientId) => {
  const response = await api.get(`/clinical/patient/${patientId}`);
  return response.data;
};

export const addPatientVitals = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/vitals`, data);
  return response.data;
};

export const addNursingNote = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/notes`, data);
  return response.data;
};

export const administerMedication = async (medId, status = "GIVEN") => {
  const response = await api.put(`/clinical/medications/${medId}/administer`, { status });
  return response.data;
};

export const completeInstruction = async (instructionId) => {
  const response = await api.put(`/clinical/instructions/${instructionId}/complete`);
  return response.data;
};

export const collectLabSample = async (labId) => {
  const response = await api.put(`/clinical/labs/${labId}/collect`);
  return response.data;
};

export const updatePatientAssignment = async (patientId, data) => {
  const response = await api.put(`/clinical/patient/${patientId}`, data);
  return response.data;
};

/**
 * Receptionist API client methods
 */
export const fetchReceptionStats = async () => {
  const response = await api.get("/reception/dashboard-stats");
  return response.data;
};

export const fetchAppointments = async () => {
  const response = await api.get("/reception/appointments");
  return response.data;
};

export const bookAppointment = async (data) => {
  const response = await api.post("/reception/appointments", data);
  return response.data;
};

export const updateAppointmentStatus = async (id, data) => {
  const response = await api.put(`/reception/appointments/${id}`, data);
  return response.data;
};

export const fetchInvoices = async () => {
  const response = await api.get("/reception/invoices");
  return response.data;
};

export const createInvoice = async (data) => {
  const response = await api.post("/reception/invoices", data);
  return response.data;
};

export const payInvoice = async (id, paymentMethod) => {
  const response = await api.put(`/reception/invoices/${id}/pay`, { paymentMethod });
  return response.data;
};

export const fetchAdmissions = async () => {
  const response = await api.get("/reception/admissions");
  return response.data;
};

export const createAdmission = async (data) => {
  const response = await api.post("/reception/admissions", data);
  return response.data;
};

export const dischargePatient = async (id) => {
  const response = await api.put(`/reception/admissions/${id}/discharge`);
  return response.data;
};

export const fetchAllPendingTasks = async () => {
  const response = await api.get("/clinical/all-pending-tasks");
  return response.data;
};

export const fetchAllPendingMedications = async () => {
  const response = await api.get("/clinical/all-pending-medications");
  return response.data;
};

export const fetchAllCriticalAlerts = async () => {
  const response = await api.get("/clinical/all-critical-alerts");
  return response.data;
};

export const addConsultation = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/consultation`, data);
  return response.data;
};

export const addPrescription = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/prescription`, data);
  return response.data;
};

export const addDoctorInstruction = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/instruction`, data);
  return response.data;
};

export const orderLabTest = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/lab-order`, data);
  return response.data;
};

export const fetchLabRequests = async () => {
  const response = await api.get("/clinical/labs");
  return response.data;
};

export const updateLabStatus = async (id, data) => {
  const response = await api.put(`/clinical/labs/${id}/status`, data);
  return response.data;
};

export const completeLabTest = async (id, data) => {
  const response = await api.put(`/clinical/labs/${id}/complete`, data);
  return response.data;
};

export const fetchPharmacyStats = async () => {
  const response = await api.get("/pharmacy/stats");
  return response.data;
};

export const fetchInventory = async () => {
  const response = await api.get("/pharmacy/inventory");
  return response.data;
};

export const addMedicine = async (data) => {
  const response = await api.post("/pharmacy/inventory", data);
  return response.data;
};

export const updateMedicineStock = async (id, stock) => {
  const response = await api.put(`/pharmacy/inventory/${id}`, { stock });
  return response.data;
};

export const dispensePrescription = async (id) => {
  const response = await api.put(`/pharmacy/prescriptions/${id}/dispense`);
  return response.data;
};

export const fetchPharmacyBills = async () => {
  const response = await api.get("/pharmacy/bills");
  return response.data;
};

export const createPharmacyBill = async (data) => {
  const response = await api.post("/pharmacy/bills", data);
  return response.data;
};

export const payPharmacyBill = async (id, paymentMethod) => {
  const response = await api.put(`/pharmacy/bills/${id}/pay`, { paymentMethod });
  return response.data;
};

export const fetchBillingStats = async () => {
  const response = await api.get("/billing/stats");
  return response.data;
};

export const fetchBillingInvoices = async (params = {}) => {
  const response = await api.get("/billing/invoices", { params });
  return response.data;
};

export const createBillingInvoice = async (data) => {
  const response = await api.post("/billing/invoices", data);
  return response.data;
};

export const payBillingInvoice = async (id, paymentData) => {
  // paymentData is an object: { paymentMethod, amountPaidThisTime, transactionId }
  const response = await api.put(`/billing/invoices/${id}/pay`, paymentData);
  return response.data;
};

export const refundBillingInvoice = async (id, refundReason) => {
  const response = await api.put(`/billing/invoices/${id}/refund`, { refundReason });
  return response.data;
};

export const fetchPatientUnpaidCharges = async (patientId) => {
  const response = await api.get(`/billing/integrations/patient/${patientId}`);
  return response.data;
};

export const createAdvancePayment = async (data) => {
  const response = await api.post("/billing/advances", data);
  return response.data;
};

export const fetchPatientAdvanceBalance = async (patientId) => {
  const response = await api.get(`/billing/advances/patient/${patientId}`);
  return response.data;
};

export const fetchDischargeSummary = async (patientId) => {
  const response = await api.get(`/billing/discharge/summary/${patientId}`);
  return response.data;
};

export const generateDischargeBill = async (data) => {
  const response = await api.post("/billing/discharge/bill", data);
  return response.data;
};

export const fetchDailyCashReport = async (params = {}) => {
  const response = await api.get("/billing/reports/daily-cash", { params });
  return response.data;
};

export const updateUserProfile = async (data) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const changeUserPassword = async (data) => {
  const response = await api.put("/auth/change-password", data);
  return response.data;
};

export const fetchAuditLogs = async (params = {}) => {
  const response = await api.get("/audit-logs", { params });
  return response.data;
};



export const updatePatientClinicalTags = async (patientId, data) => {
  const response = await api.put(`/clinical/patient/${patientId}/clinical-tags`, data);
  return response.data;
};

export const addPatientDocument = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/documents`, data);
  return response.data;
};

/**
 * AI Service Client APIs
 */
export const fetchAIDashboardInsights = async () => {
  const response = await api.get("/ai/dashboard-insights");
  return response.data;
};

export const fetchAIReceptionistAssistance = async (feature, payload) => {
  if (feature === "queue-optimization") {
    const response = await api.get("/ai/receptionist/queue-optimization");
    return response.data;
  }
  const response = await api.post("/ai/receptionist/scheduling-suggestions", payload || {});
  return response.data;
};

export const fetchAILabAnalysis = async (testName, resultsText) => {
  const response = await api.post("/ai/lab-technician/lab-analysis", { testName, resultsText });
  return response.data;
};

export const fetchAIPharmacyCompanion = async (activeMeds) => {
  const response = await api.post("/ai/pharmacist/pharmacy-companion", { activeMeds });
  return response.data;
};

export const fetchAICashierInsights = async () => {
  const response = await api.get("/ai/cashier/cashier-insights");
  return response.data;
};

export const fetchAIPatientBuddy = async (queryType, content) => {
  // Kept for backward compatibility but mapped to patient chat
  const response = await api.post("/ai/patient/chat", { queryType, content });
  return response.data;
};

// Enterprise AI Additions
export const fetchAIMedicalScribe = async (shorthandText) => {
  const response = await api.post("/ai/doctor/medical-scribe", { shorthandText });
  return response.data;
};

export const fetchAIDoctorDiagnosis = async (vitals, complaints) => {
  const response = await api.post("/ai/doctor/diagnosis-suggestions", { vitals, complaints });
  return response.data;
};

export const fetchAIPrescriptionCheck = async (medications, patientAllergies) => {
  const response = await api.post("/ai/doctor/prescription-check", { medications, patientAllergies });
  return response.data;
};

export const fetchAIPatientSummary = async (patientId) => {
  const response = await api.get(`/ai/doctor/patient-summary/${patientId}`);
  return response.data;
};

export const fetchAIMedicalReportSummary = async (fileName, textContent) => {
  const response = await api.post("/ai/lab-technician/summarize-report", { fileName, textContent });
  return response.data;
};

export const fetchAIPharmacyForecast = async () => {
  const response = await api.get("/ai/pharmacist/pharmacy-forecast");
  return response.data;
};

export const fetchAIQueuePrediction = async (doctorId, date) => {
  const response = await api.post("/ai/receptionist/queue-prediction", { doctorId, date });
  return response.data;
};

export const fetchAIFollowUpRecommendations = async (diagnosis, lastVitals) => {
  const response = await api.post("/ai/doctor/followup-recommendations", { diagnosis, lastVitals });
  return response.data;
};

export const fetchAIVitalsEmergencyCheck = async (vitals) => {
  const response = await api.post("/ai/nurse/vitals-emergency-check", { vitals });
  return response.data;
};

// Role-Based AI Chat APIs
export const fetchAdminAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/admin/chat", { content, activeTab });
  return response.data;
};

export const fetchReceptionistAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/receptionist/chat", { content, activeTab });
  return response.data;
};

export const fetchDoctorAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/doctor/chat", { content, activeTab });
  return response.data;
};

export const fetchNurseAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/nurse/chat", { content, activeTab });
  return response.data;
};

export const fetchLabTechnicianAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/lab-technician/chat", { content, activeTab });
  return response.data;
};

export const fetchPharmacistAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/pharmacist/chat", { content, activeTab });
  return response.data;
};

export const fetchCashierAIChat = async (content, activeTab) => {
  const response = await api.post("/ai/cashier/chat", { content, activeTab });
  return response.data;
};

export const fetchPatientAIChat = async (queryType, content) => {
  const response = await api.post("/ai/patient/chat", { queryType, content });
  return response.data;
};

export const translateText = async (text, targetLanguage, takeaways, recommendations) => {
  const response = await api.post("/ai/translate", { text, targetLanguage, takeaways, recommendations });
  return response.data;
};

export const fetchIcd10Suggestions = async (diagnosisText) => {
  const response = await api.post("/ai/icd10-suggestions", { diagnosisText });
  return response.data;
};

export const fetchAISchedulingSuggestions = async (doctorId, date) => {
  const response = await api.post("/ai/receptionist/scheduling-suggestions", { doctorId, date });
  return response.data;
};

export const createAppointment = async (data) => {
  const response = await api.post("/clinical/appointments", data);
  return response.data;
};

export const fetchClinicalAppointments = async (params = {}) => {
  const response = await api.get("/clinical/appointments", { params });
  return response.data;
};

export const checkInAppointment = async (id) => {
  const response = await api.put(`/clinical/appointments/${id}/checkin`);
  return response.data;
};

export const submitPatientDischarge = async (patientId, data) => {
  const response = await api.post(`/clinical/patient/${patientId}/discharge`, data);
  return response.data;
};

export const fetchDischargeRecord = async (patientId) => {
  const response = await api.get(`/clinical/patient/${patientId}/discharge`);
  return response.data;
};

export const parseLabReportOCR = async (id, reportText) => {
  const response = await api.post(`/clinical/labs/${id}/ocr`, { reportText });
  return response.data;
};

export const fetchConsolidatedReport = async (patientId) => {
  const response = await api.get(`/clinical/patient/${patientId}/consolidated-report`);
  return response.data;
};

export default api;
