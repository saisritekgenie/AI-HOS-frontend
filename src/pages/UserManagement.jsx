import React, { useState, useEffect, useCallback } from "react";
import UserFilters from "../components/users/UserFilters";
import UserTable from "../components/users/UserTable";
import UserModal from "../components/users/UserModal";
import ConfirmDeleteModal from "../components/users/ConfirmDeleteModal";
import { UserPlus, RefreshCw, CheckCircle, AlertCircle, Building } from "lucide-react";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  enableUser,
  disableUser,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const UserManagement = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const hospitalName = user?.hospital?.name || "Hospital";

  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(() => localStorage.getItem("staff_role_filter") || "");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const [roleCounts, setRoleCounts] = useState({
    ALL: 0,
    ADMIN: 0,
    DOCTOR: 0,
    NURSE: 0,
    RECEPTIONIST: 0,
    LAB_TECHNICIAN: 0,
    PHARMACIST: 0,
    CASHIER: 0
  });

  const loadRoleCounts = useCallback(async () => {
    try {
      const res = await fetchUsers({ limit: 500 });
      const allUsers = res.data || [];
      const counts = {
        ALL: allUsers.length,
        ADMIN: allUsers.filter(u => u.role === "ADMIN").length,
        DOCTOR: allUsers.filter(u => u.role === "DOCTOR").length,
        NURSE: allUsers.filter(u => u.role === "NURSE").length,
        RECEPTIONIST: allUsers.filter(u => u.role === "RECEPTIONIST").length,
        LAB_TECHNICIAN: allUsers.filter(u => u.role === "LAB_TECHNICIAN").length,
        PHARMACIST: allUsers.filter(u => u.role === "PHARMACIST").length,
        CASHIER: allUsers.filter(u => u.role === "CASHIER").length
      };
      setRoleCounts(counts);
    } catch (err) {
      console.error("Failed to load role counts", err);
    }
  }, []);

  const handleRoleFilterChange = (val) => {
    setRoleFilter(val);
    if (val) {
      localStorage.setItem("staff_role_filter", val);
      localStorage.setItem("sidebar_active_sub", `role-${val.toLowerCase()}`);
    } else {
      localStorage.removeItem("staff_role_filter");
      localStorage.removeItem("sidebar_active_sub");
    }
  };

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter,
        department: deptFilter,
        status: statusFilter,
      };

      const res = await fetchUsers(queryParams);
      setUsers(res.data || []);
      setPagination(res.meta || null);
      
      // Refresh count details on main navigation sidebar
      window.dispatchEvent(new CustomEvent("staff_list_updated"));
    } catch (err) {
      console.error("Failed to load users", err);
      showToast("error", err.response?.data?.message || "Failed to load users from backend");
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter, deptFilter, statusFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, deptFilter, statusFilter]);

  useEffect(() => {
    const handleFilterChange = (e) => {
      if (e.detail !== undefined) {
        setRoleFilter(e.detail);
      }
    };
    window.addEventListener("staff_role_filter_changed", handleFilterChange);
    return () => {
      window.removeEventListener("staff_role_filter_changed", handleFilterChange);
    };
  }, []);

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("");
    setDeptFilter("");
    setStatusFilter("");
    setCurrentPage(1);
    localStorage.removeItem("staff_role_filter");
    localStorage.removeItem("sidebar_active_sub");
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditModal = (userData) => {
    setEditingUser(userData);
    setIsUserModalOpen(true);
  };

  const handleOpenDeleteModal = (userData) => {
    setDeletingUser(userData);
    setIsDeleteModalOpen(true);
  };

  const handleSaveUser = async (formData) => {
    if (editingUser) {
      await updateUser(editingUser._id, formData);
      showToast("success", "Staff member details updated successfully");
    } else {
      await createUser(formData);
      showToast("success", "New staff member added and access granted!");
    }
    loadUsers();
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUser(deletingUser._id);
      showToast("success", `Staff member ${deletingUser.firstName} deleted successfully`);
      setIsDeleteModalOpen(false);
      setDeletingUser(null);
      loadUsers();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      if (currentStatus === "ACTIVE") {
        await disableUser(userId);
        showToast("success", "Staff member access revoked (INACTIVE)");
      } else {
        await enableUser(userId);
        showToast("success", "Staff member access granted (ACTIVE)");
      }
      loadUsers();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Failed to change user status");
    }
  };

  return (
    <div>
      {/* Toast Notification Banner */}
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
            background: toast.type === "success" ? "#059669" : "#dc2626",
            color: "white",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
          }}
        >
          {toast.type === "success" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{toast.message}</span>
        </div>
      )}

      {/* Header with Dynamic Hospital Name */}
      <div className="page-header">
        <div className="page-title-group">
          <h1 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Building size={24} className="text-sky-600" />
            {isSuperAdmin ? "SaaS Master User Management" : `${hospitalName} Staff Management`}
          </h1>
          <p>
            {isSuperAdmin
              ? "Master control panel to view and manage users across all hospital branches."
              : `Create, assign roles, grant login access, and manage all staff working in ${hospitalName}.`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button className="btn btn-secondary" onClick={loadUsers} title="Refresh Staff List">
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <UserPlus size={18} />
            <span>Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <UserFilters
        search={search}
        setSearch={setSearch}
        roleFilter={roleFilter}
        setRoleFilter={handleRoleFilterChange}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        resetFilters={resetFilters}
      />

      {/* Staff Table */}
      <UserTable
        users={users}
        pagination={pagination}
        onPageChange={(page) => setCurrentPage(page)}
        onEdit={handleOpenEditModal}
        onDelete={handleOpenDeleteModal}
        onToggleStatus={handleToggleStatus}
        loading={loading}
      />

      {/* Modals */}
      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSave={handleSaveUser}
        editingUser={editingUser}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        user={deletingUser}
      />
    </div>
  );
};

export default UserManagement;
