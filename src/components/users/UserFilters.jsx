import React from "react";
import { Search, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const UserFilters = ({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  deptFilter,
  setDeptFilter,
  statusFilter,
  setStatusFilter,
  resetFilters,
}) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="filters-card">
      <div className="search-box">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search by staff ID, name, email, or mobile..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="filter-selects">
        <select
          className="select-control"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All Staff Roles</option>
          {isSuperAdmin && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
          {isSuperAdmin && <option value="ADMIN">ADMIN</option>}
          <option value="DOCTOR">DOCTOR</option>
          <option value="RECEPTIONIST">RECEPTIONIST</option>
          <option value="NURSE">NURSE</option>
          <option value="LAB_TECHNICIAN">LAB_TECHNICIAN</option>
          <option value="PHARMACIST">PHARMACIST</option>
          <option value="CASHIER">CASHIER</option>
        </select>

        <select
          className="select-control"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Neurology">Neurology</option>
          <option value="Pediatrics">Pediatrics</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="OPD & Front Desk">OPD & Front Desk (Reception)</option>
          <option value="ICU & Nursing">ICU & Nursing</option>
          <option value="Pathology & Lab">Pathology & Lab</option>
          <option value="Pharmacy">Pharmacy</option>
          <option value="Billing & Accounts">Billing & Accounts</option>
          <option value="Executive Management">Executive Management</option>
          <option value="General">General</option>
        </select>

        <select
          className="select-control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
        </select>

        <button
          className="btn btn-secondary"
          onClick={resetFilters}
          title="Reset Filters"
          style={{ padding: "0.6rem 0.85rem" }}
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};

export default UserFilters;
