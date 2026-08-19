import React, { useState, useEffect } from "react";
import { 
  Search, 
  FileSpreadsheet, 
  Filter, 
  Calendar, 
  Activity, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Info, 
  X, 
  Database,
  ArrowLeftRight
} from "lucide-react";
import { fetchAuditLogs } from "../services/api";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // UI States
  const [selectedLog, setSelectedLog] = useState(null);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  // Stats summaries
  const [stats, setStats] = useState({
    totalCount: 0,
    authCount: 0,
    failedCount: 0,
    billingCount: 0
  });

  const loadLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit,
        search: searchQuery,
        module: moduleFilter,
        action: actionFilter,
        status: statusFilter,
        startDate,
        endDate
      };
      
      const response = await fetchAuditLogs(params);
      if (response && response.success) {
        setLogs(response.data || []);
        setTotal(response.pagination?.total || 0);
        setPages(response.pagination?.pages || 1);

        // Derive statistics metrics from data for visual cards
        const allLogs = response.data || [];
        setStats({
          totalCount: response.pagination?.total || allLogs.length,
          authCount: allLogs.filter(l => l.module === "AUTH").length,
          failedCount: allLogs.filter(l => l.status === "FAILED").length,
          billingCount: allLogs.filter(l => l.module === "BILLING").length
        });
      } else {
        setError("Failed to query audit logs payload");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Access denied: Unauthorized log query session.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, moduleFilter, actionFilter, statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setModuleFilter("");
    setActionFilter("");
    setStatusFilter("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const exportLogsToCSV = () => {
    if (logs.length === 0) return;
    
    // Prepare headers
    const headers = ["Timestamp", "User", "Role", "Module", "Action", "Status", "IP Address", "Device", "Target ID", "Details"];
    const rows = logs.map(log => [
      new Date(log.createdAt).toLocaleString(),
      log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : "System",
      log.userRole || "SYSTEM",
      log.module,
      log.action,
      log.status,
      log.ipAddress,
      log.device,
      log.targetId || "",
      log.details.replace(/,/g, ";") // replace commas to prevent csv splitting issues
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EMR_Audit_Logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleInspectRow = (log) => {
    setSelectedLog(log);
    setIsInspectorOpen(true);
  };

  return (
    <div className="container-fluid" style={{ padding: "1rem" }}>
      {/* Dynamic Grid Styles & Responsiveness */}
      <style>{`
        .audit-logs-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) ${isInspectorOpen ? "380px" : "0px"};
          gap: ${isInspectorOpen ? "1.5rem" : "0px"};
          transition: all 0.3s ease;
          align-items: start;
        }
        .log-inspector-drawer {
          display: ${isInspectorOpen ? "block" : "none"};
          background: var(--bg-glass);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 16px;
          border: 1px solid var(--card-border);
          box-shadow: var(--card-shadow);
          padding: 1.5rem;
          position: sticky;
          top: calc(72px + 1.25rem);
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .status-badge.success {
          background-color: #d1fae5;
          color: #065f46;
        }
        .status-badge.failed {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .log-row:hover {
          background-color: #f8fafc !important;
          cursor: pointer;
        }
      `}</style>

      {/* Header section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldAlert size={28} style={{ color: "#2563eb" }} />
            <span>EMR Activity Audit Logs</span>
          </h2>
          <p style={{ margin: "0.25rem 0 0 0", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
            Real-time tracking of all security events, modifications, and clinical charting activities.
          </p>
        </div>
        <button 
          onClick={exportLogsToCSV} 
          disabled={logs.length === 0}
          className="btn btn-secondary"
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", fontSize: "0.85rem" }}
        >
          <FileSpreadsheet size={16} />
          <span>Export Logs (CSV)</span>
        </button>
      </div>

      {error ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fee2e2", padding: "1.5rem", borderRadius: "12px", textAlign: "center", color: "#991b1b" }}>
          <ShieldAlert size={40} style={{ margin: "0 auto 1rem", display: "block" }} />
          <h4 style={{ fontWeight: 800 }}>Access Authorization Required</h4>
          <p style={{ fontSize: "0.9rem", margin: "0.5rem 0 0 0" }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Stats overview cards grid */}
          <div className="grid-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            {/* Card 1: Total Activities */}
            <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)", border: "1px solid #bfdbfe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#1e40af", fontWeight: 700 }}>Total Tracked Actions</span>
                <Activity size={20} style={{ color: "#3b82f6" }} />
              </div>
              <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#1e3a8a", margin: 0 }}>{total}</h3>
              <span style={{ fontSize: "0.75rem", color: "#60a5fa" }}>Across hospital EMR</span>
            </div>

            {/* Card 2: Security Logs */}
            <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "linear-gradient(135deg, #f5f3ff 0%, #edd9ff 100%)", border: "1px solid #ddd6fe" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#5b21b6", fontWeight: 700 }}>Auth & Security Logs</span>
                <ShieldAlert size={20} style={{ color: "#8b5cf6" }} />
              </div>
              <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#4c1d95", margin: 0 }}>{stats.authCount}</h3>
              <span style={{ fontSize: "0.75rem", color: "#a78bfa" }}>Logins & pass updates</span>
            </div>

            {/* Card 3: Failed Access Attempts */}
            <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", border: "1px solid #fecdd3" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#9f1239", fontWeight: 700 }}>Failed Actions</span>
                <XCircle size={20} style={{ color: "#f43f5e" }} />
              </div>
              <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#881337", margin: 0 }}>{stats.failedCount}</h3>
              <span style={{ fontSize: "0.75rem", color: "#fda4af" }}>System validation flags</span>
            </div>

            {/* Card 4: Billing Events */}
            <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>Billing Actions Audited</span>
                <ArrowLeftRight size={20} style={{ color: "#22c55e" }} />
              </div>
              <h3 style={{ fontSize: "1.8rem", fontWeight: 800, color: "#064e3b", margin: 0 }}>{stats.billingCount}</h3>
              <span style={{ fontSize: "0.75rem", color: "#86efac" }}>Payments & invoices</span>
            </div>
          </div>

          {/* Audit Logs Layout Grid */}
          <div className="audit-logs-grid">
            {/* Left Column: Filters & Table Queue */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", minWidth: 0 }}>
              
              {/* Search & Filter Drawer */}
              <div className="card shadow-sm" style={{ padding: "1.25rem", borderRadius: "16px", background: "var(--bg-secondary)", border: "1px solid var(--border-glass)" }}>
                <form onSubmit={handleSearchSubmit}>
                  <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                    <div style={{ position: "relative", flex: 1, minWidth: "240px" }}>
                      <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                      <input 
                        type="text"
                        className="form-control"
                        style={{ paddingLeft: "2.5rem" }}
                        placeholder="Search logs by staff name, target name, or description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: "0.5rem 1.25rem" }}>
                      Search
                    </button>
                  </div>
                </form>

                {/* Filter Rows */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Module:</label>
                    <select className="form-control" value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1); }}>
                      <option value="">All Modules</option>
                      <option value="AUTH">Authentication</option>
                      <option value="USER">User / Staff</option>
                      <option value="PATIENT">Patient Desk</option>
                      <option value="APPOINTMENT">Appointments</option>
                      <option value="CLINICAL">Clinical Charts</option>
                      <option value="PHARMACY">Pharmacy Stock</option>
                      <option value="BILLING">Billing & Accounts</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Status:</label>
                    <select className="form-control" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                      <option value="">All Statuses</option>
                      <option value="SUCCESS">Success</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Start Date:</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={startDate} 
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }} 
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>End Date:</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={endDate} 
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }} 
                    />
                  </div>
                </div>

                {(searchQuery || moduleFilter || statusFilter || startDate || endDate) && (
                  <div style={{ marginTop: "1rem", textAlign: "right" }}>
                    <button 
                      onClick={handleResetFilters}
                      style={{ border: "none", background: "none", color: "#ef4444", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600 }}
                    >
                      Reset all filters
                    </button>
                  </div>
                )}
              </div>

              {/* Logs Table Container */}
              <div className="table-container">
                {loading ? (
                  <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    <p>Refreshing audit log entries...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-secondary)" }}>
                    <Database size={36} style={{ margin: "0 auto 1rem", display: "block", color: "#cbd5e1" }} />
                    <span>No audit log records found matching the active query.</span>
                  </div>
                ) : (
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Performed By</th>
                        <th>Role</th>
                        <th>Module</th>
                        <th>Action</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th style={{ width: "60px", textAlign: "center" }}>Inspect</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id} className="log-row" onClick={() => handleInspectRow(log)}>
                          <td style={{ fontSize: "0.8rem", color: "#334155" }}>
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                            {log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : "System"}
                          </td>
                          <td style={{ fontSize: "0.8rem" }}>
                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.4rem", background: "#f1f5f9", borderRadius: "4px", fontWeight: 700 }}>
                              {log.userRole || "SYSTEM"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>
                            {log.module}
                          </td>
                          <td style={{ fontSize: "0.8rem" }}>
                            <code>{log.action}</code>
                          </td>
                          <td>
                            <span className={`status-badge ${log.status.toLowerCase()}`}>
                              {log.status === "SUCCESS" ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <XCircle size={12} />
                              )}
                              <span>{log.status}</span>
                            </span>
                          </td>
                          <td style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {log.ipAddress}
                          </td>
                          <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleInspectRow(log)}
                              style={{ border: "none", background: "none", color: "#2563eb", cursor: "pointer" }}
                            >
                              <Info size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination Controls */}
              {pages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Showing {(page - 1) * limit + 1} - {Math.min(page * limit, total)} of {total} logs
                  </span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button 
                      className="btn btn-secondary" 
                      disabled={page === 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                    >
                      Previous
                    </button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                      <button 
                        key={p} 
                        onClick={() => setPage(p)}
                        className={`btn ${page === p ? "btn-primary" : "btn-secondary"}`}
                        style={{ padding: "0.35rem 0.6rem", fontSize: "0.8rem" }}
                      >
                        {p}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary" 
                      disabled={page === pages}
                      onClick={() => setPage(p => Math.min(pages, p + 1))}
                      style={{ padding: "0.35rem 0.8rem", fontSize: "0.8rem" }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sliding Detail Inspector Drawer */}
            {isInspectorOpen && selectedLog && (
              <div className="log-inspector-drawer">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-glass)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Audit Log Inspector</h4>
                  <button 
                    onClick={() => setIsInspectorOpen(false)}
                    style={{ border: "none", background: "none", color: "var(--text-secondary)", cursor: "pointer" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.85rem" }}>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>Timestamp:</span>
                    <span>{new Date(selectedLog.createdAt).toLocaleString()}</span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>User & Role:</span>
                    <span>
                      {selectedLog.performedBy ? `${selectedLog.performedBy.firstName} ${selectedLog.performedBy.lastName}` : "System"}
                      <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", padding: "0.1rem 0.3rem", background: "#eff6ff", color: "#1e40af", borderRadius: "4px", fontWeight: 700 }}>
                        {selectedLog.userRole}
                      </span>
                    </span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>Module & Action:</span>
                    <span>
                      {selectedLog.module} - <code>{selectedLog.action}</code>
                    </span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>Log Status:</span>
                    <span className={`status-badge ${selectedLog.status.toLowerCase()}`} style={{ marginTop: "0.25rem" }}>
                      {selectedLog.status === "SUCCESS" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      <span>{selectedLog.status}</span>
                    </span>
                  </div>

                  <div>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>IP Address & Client Device:</span>
                    <span style={{ display: "block", color: "#334155" }}>IP: {selectedLog.ipAddress}</span>
                    <span style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                      Device: {selectedLog.device}
                    </span>
                  </div>

                  {selectedLog.targetId && (
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>Target ID / Key:</span>
                      <code>{selectedLog.targetId}</code>
                    </div>
                  )}

                  {selectedLog.targetName && (
                    <div>
                      <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block" }}>Target Entity Name:</span>
                      <span style={{ fontWeight: 600 }}>{selectedLog.targetName}</span>
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
                    <span style={{ fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>Log Description Details:</span>
                    <div style={{ background: "#f8fafc", border: "1px solid var(--border-glass)", padding: "0.75rem", borderRadius: "8px", color: "#334155", lineHeight: 1.4, fontFamily: "monospace", fontSize: "0.8rem", wordBreak: "break-all" }}>
                      {selectedLog.details}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AuditLogs;
