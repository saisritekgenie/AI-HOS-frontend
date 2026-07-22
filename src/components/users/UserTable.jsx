import React from "react";
import { Edit2, Trash2, ChevronLeft, ChevronRight, User } from "lucide-react";

const UserTable = ({
  users,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onToggleStatus,
  loading,
}) => {
  if (loading) {
    return (
      <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>Loading users data...</p>
      </div>
    );
  }

  if (!users || users.length === 0) {
    return (
      <div className="table-container" style={{ padding: "3rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-secondary)" }}>No users found matching your query.</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Staff ID</th>
            <th>User</th>
            <th>Mobile</th>
            <th>Assigned Role</th>
            <th>Department</th>
            <th>Branch</th>
            <th>Status</th>
            <th style={{ textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isActive = u.status === "ACTIVE";
            return (
              <tr key={u._id}>
                <td>
                  <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                    {u.employeeId || u.uhid || `EMP-${u._id.slice(-4)}`}
                  </span>
                </td>
                <td>
                  <div className="user-cell">
                    <div
                      className="avatar-img"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <User size={20} className="text-slate-500" />
                    </div>
                    <div className="user-cell-info">
                      <span className="user-cell-name">
                        {u.firstName} {u.lastName}
                      </span>
                      <span className="user-cell-email">{u.email}</span>
                    </div>
                  </div>
                </td>
                <td>{u.mobile}</td>
                <td>
                  <span className={`badge badge-role-${u.role}`}>{u.role}</span>
                </td>
                <td>{u.department || "N/A"}</td>
                <td>{u.branch || "N/A"}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleStatus(u._id, u.status)}
                      />
                      <span className="slider"></span>
                    </label>
                    <span className={`badge badge-status-${u.status}`}>{u.status}</span>
                  </div>
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                    <button
                      className="action-btn edit"
                      title="Edit User"
                      onClick={() => onEdit(u)}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      title="Delete User"
                      onClick={() => onDelete(u)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {pagination && (
        <div className="pagination-container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", borderTop: "1px solid var(--card-border)" }}>
          <div className="pagination-info" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Showing Page <strong>{pagination.currentPage}</strong> of{" "}
            <strong>{pagination.totalPages}</strong> ({pagination.totalRecords} total records)
          </div>

          <div className="pagination-controls" style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasPrevPage}
              onClick={() => onPageChange(pagination.currentPage - 1)}
              style={{ padding: "0.4rem 0.85rem", opacity: pagination.hasPrevPage ? 1 : 0.4 }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <button
              className="btn btn-secondary"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
              style={{ padding: "0.4rem 0.85rem", opacity: pagination.hasNextPage ? 1 : 0.4 }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserTable;
