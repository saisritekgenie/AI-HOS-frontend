import React, { useState, useEffect } from "react";
import { fetchAllPendingMedications, administerMedication } from "../services/api";
import { Calendar, CheckCircle, ArrowLeft, User, MapPin, Pill } from "lucide-react";

const MedicationsDue = ({ onBackToDashboard }) => {
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOverdue = (createdAt) => {
    if (!createdAt) return false;
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return elapsed > 2 * 60 * 60 * 1000; // Overdue if older than 2 hours
  };

  const loadMeds = async () => {
    try {
      setLoading(true);
      const res = await fetchAllPendingMedications();
      setMeds(res.data || []);
    } catch (err) {
      console.error("Failed to load medications", err);
      setError("Failed to load pending medications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMeds();
  }, []);

  const handleAdminister = async (medId) => {
    try {
      await administerMedication(medId, "GIVEN");
      // Refresh list
      loadMeds();
    } catch (err) {
      console.error("Failed to administer medication", err);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes blinker {
          50% { opacity: 0; }
        }
        .blink {
          animation: blinker 1.2s linear infinite;
        }
      `}</style>
      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <button 
              onClick={onBackToDashboard}
              style={{
                background: "#f1f5f9",
                border: "none",
                borderRadius: "6px",
                padding: "0.35rem 0.65rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.85rem",
                color: "#475569"
              }}
            >
              <ArrowLeft size={14} />
              <span>Dashboard</span>
            </button>
          </div>
          <h1>Medications Administration List (MAR)</h1>
          <p>Real-time checklist of medication doses due for administration across all hospital departments.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading medications due list...</p>
        </div>
      ) : error ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
          <p>{error}</p>
        </div>
      ) : meds.length === 0 ? (
        <div className="table-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "0.5rem" }}>All Doses Administered</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>There are no pending medication administration requirements at this time.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Location / Bed</th>
                <th>Medication Name</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Prescribed By</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((med) => (
                <tr key={med._id} style={{ background: isOverdue(med.createdAt) ? "#fff1f2" : "inherit" }}>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {med.patient?.firstName} {med.patient?.lastName}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.1rem" }}>
                        UHID: {med.patient?.uhid || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600 }}>
                      <MapPin size={14} style={{ color: "var(--text-secondary)" }} />
                      <span>
                        {med.patient?.roomNo && med.patient?.roomNo !== "N/A" 
                          ? `Room ${med.patient?.roomNo} / Bed ${med.patient?.bedNo || "N/A"}` 
                          : "Unallocated"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      <Pill size={16} style={{ color: isOverdue(med.createdAt) ? "#ef4444" : "#f59e0b" }} />
                      <span>{med.medicationName}</span>
                    </div>
                    {isOverdue(med.createdAt) && (
                      <div style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 800, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span className="blink" style={{ width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>
                        <span>OVERDUE BY {Math.round((Date.now() - new Date(med.createdAt).getTime()) / (60 * 60 * 1000))}h+</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{med.dosage}</span>
                  </td>
                  <td>
                    <span style={{ color: "#475569" }}>{med.frequency}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#475569" }}>
                      <User size={14} />
                      <span>Dr. {med.prescribedBy ? `${med.prescribedBy.firstName} ${med.prescribedBy.lastName}` : "Doctor"}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleAdminister(med._id)}
                      className="btn btn-primary"
                      style={{ 
                        padding: "0.4rem 0.85rem", 
                        fontSize: "0.8rem", 
                        background: "#10b981", 
                        border: "1px solid #10b981" 
                      }}
                    >
                      Give Dose
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MedicationsDue;
