import React, { useState, useEffect } from "react";
import { fetchAllPendingTasks, completeInstruction } from "../services/api";
import { ClipboardList, CheckCircle, Clock, ArrowLeft, User, MapPin } from "lucide-react";

const PendingTasks = ({ onBackToDashboard }) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isOverdue = (createdAt) => {
    if (!createdAt) return false;
    const elapsed = Date.now() - new Date(createdAt).getTime();
    return elapsed > 2 * 60 * 60 * 1000; // Overdue if older than 2 hours
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await fetchAllPendingTasks();
      setTasks(res.data || []);
    } catch (err) {
      console.error("Failed to load tasks", err);
      setError("Failed to load pending clinical tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId) => {
    try {
      await completeInstruction(taskId);
      // Refresh list
      loadTasks();
    } catch (err) {
      console.error("Failed to complete task", err);
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
          <h1>Pending Clinical Tasks</h1>
          <p>Global checklist of doctor care instructions and tasks pending across all admitted hospital patients.</p>
        </div>
      </div>

      {loading ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
          <p style={{ color: "var(--text-secondary)" }}>Loading pending tasks...</p>
        </div>
      ) : error ? (
        <div className="table-container" style={{ padding: "3rem", textAlign: "center", color: "#ef4444" }}>
          <p>{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="table-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
          <CheckCircle size={48} style={{ color: "#10b981", margin: "0 auto 1rem" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>All Tasks Completed!</h3>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>There are no pending doctor instructions in the hospital at the moment.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Patient Details</th>
                <th>Location / Bed</th>
                <th>Care Instruction</th>
                <th>Priority</th>
                <th>Prescribed By</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} style={{ background: isOverdue(task.createdAt) ? "#fff1f2" : "inherit" }}>
                  <td>
                    <div>
                      <strong style={{ color: "var(--text-primary)" }}>
                        {task.patient?.firstName} {task.patient?.lastName}
                      </strong>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.1rem" }}>
                        UHID: {task.patient?.uhid || "N/A"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600 }}>
                      <MapPin size={14} style={{ color: "#64748b" }} />
                      <span>
                        {task.patient?.roomNo && task.patient?.roomNo !== "N/A" 
                          ? `Room ${task.patient?.roomNo} / Bed ${task.patient?.bedNo || "N/A"}` 
                          : "Unallocated"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.9rem", color: task.priority === "HIGH" ? "#ef4444" : "#0f172a", fontWeight: task.priority === "HIGH" ? 700 : 500, maxWidth: "300px", wordBreak: "break-word" }}>
                      {task.instruction}
                    </div>
                    {isOverdue(task.createdAt) && (
                      <div style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 800, marginTop: "0.25rem", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                        <span className="blink" style={{ width: "6px", height: "6px", background: "#ef4444", borderRadius: "50%", display: "inline-block" }}></span>
                        <span>OVERDUE BY {Math.round((Date.now() - new Date(task.createdAt).getTime()) / (60 * 60 * 1000))}h+</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="badge" style={{ 
                      background: task.priority === "HIGH" ? "#fee2e2" : task.priority === "MEDIUM" ? "#fef3c7" : "#f1f5f9", 
                      color: task.priority === "HIGH" ? "#ef4444" : task.priority === "MEDIUM" ? "#f59e0b" : "#64748b", 
                      fontWeight: 700 
                    }}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", color: "#475569" }}>
                      <User size={14} />
                      <span>Dr. {task.prescribedBy ? `${task.prescribedBy.firstName} ${task.prescribedBy.lastName}` : "Doctor"}</span>
                    </div>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      onClick={() => handleComplete(task._id)}
                      className="btn btn-primary"
                      style={{ 
                        padding: "0.4rem 0.85rem", 
                        fontSize: "0.8rem", 
                        background: "#10b981", 
                        border: "1px solid #10b981" 
                      }}
                    >
                      Complete Task
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

export default PendingTasks;
