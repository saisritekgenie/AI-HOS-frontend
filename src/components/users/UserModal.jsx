import React, { useState, useEffect } from "react";
import { X, Save, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const UserModal = ({ isOpen, onClose, onSave, editingUser }) => {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === "SUPER_ADMIN";

  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    gender: "MALE",
    role: "DOCTOR",
    department: "Cardiology",
    branch: "Main Branch",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        employeeId: editingUser.employeeId || "",
        firstName: editingUser.firstName || "",
        lastName: editingUser.lastName || "",
        email: editingUser.email || "",
        mobile: editingUser.mobile || "",
        password: "",
        gender: editingUser.gender || "MALE",
        role: editingUser.role || "DOCTOR",
        department: editingUser.department || "General",
        branch: editingUser.branch || "Main Branch",
      });
    } else {
      setFormData({
        employeeId: "",
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        password: "",
        gender: "MALE",
        role: "DOCTOR",
        department: "Cardiology",
        branch: "Main Branch",
      });
    }
    setErrorMsg("");
    setShowPassword(false);
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    if (!editingUser && !formData.password) {
      setErrorMsg("Password is required when creating a new user.");
      return;
    }

    try {
      setSubmitting(true);
      await onSave(formData);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to save user.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{editingUser ? "Edit Staff Details" : "Create New Staff Member"}</h3>
          <button className="action-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMsg && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  marginBottom: "1rem",
                  fontSize: "0.85rem",
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID / Staff ID</label>
                <input
                  type="text"
                  name="employeeId"
                  className="form-control"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="Auto-generated if empty (EMP-1001)"
                />
              </div>

              <div className="form-group">
                <label>Assign Staff Role *</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="DOCTOR">DOCTOR (Medical Practitioner)</option>
                  <option value="RECEPTIONIST">RECEPTIONIST (Front Desk & Tokens)</option>
                  <option value="NURSE">NURSE (ICU & Ward Nursing)</option>
                  <option value="LAB_TECHNICIAN">LAB_TECHNICIAN (Pathology & Blood Tests)</option>
                  <option value="PHARMACIST">PHARMACIST (Pharmacy & Prescriptions)</option>
                  <option value="CASHIER">CASHIER (Billing & Accounts)</option>
                  {isSuperAdmin && <option value="ADMIN">ADMIN (Hospital Admin)</option>}
                  {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN (Platform Owner)</option>}
                </select>
              </div>

              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  className="form-control"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Mobile Number (10 digits) *</label>
                <input
                  type="text"
                  name="mobile"
                  className="form-control"
                  value={formData.mobile}
                  onChange={handleChange}
                  placeholder="9876543210"
                  required
                />
              </div>

              {!editingUser && (
                <div className="form-group full-width">
                  <label>Initial Login Password *</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-control"
                      value={formData.password}
                      onChange={handleChange}
                      style={{ width: "100%", paddingRight: "2.5rem" }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: "absolute",
                        right: "0.75rem",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  className="form-control"
                  value={formData.gender}
                  onChange={handleChange}
                >
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                  <option value="OTHER">OTHER</option>
                </select>
              </div>

              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  name="department"
                  className="form-control"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Cardiology / OPD / Pharmacy / Accounts"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Hospital Branch</label>
                <input
                  type="text"
                  name="branch"
                  className="form-control"
                  value={formData.branch}
                  onChange={handleChange}
                  placeholder="Main Branch"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Save size={16} />
              <span>{submitting ? "Saving..." : editingUser ? "Update Staff" : "Create Staff Member"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
