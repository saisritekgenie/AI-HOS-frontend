import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card" style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#f87171" }}>
            <AlertTriangle size={22} />
            <span>Confirm Deletion</span>
          </h3>
          <button className="action-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Are you sure you want to permanently delete user{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {user.firstName} {user.lastName} ({user.email})
            </strong>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            <Trash2 size={16} />
            <span>Delete User</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
