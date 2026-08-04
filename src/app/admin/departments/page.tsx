"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showSuccess, showError } from "@/lib/toast";

interface Department {
  id: string;
  name: string;
  description: string | null;
  head: string | null;
  head_doctor_id: string | null;
  icon: string;
  color: string;
  location: string | null;
  phone: string | null;
  doctors: number;
  patients: number;
  beds: number;
}

interface DoctorOption {
  id: string;
  full_name: string;
  specialization: string;
}

type DepartmentFormData = {
  name: string;
  description: string;
  icon: string;
  color: string;
  location: string;
  phone: string;
  head_doctor_id: string;
};

const emptyForm: DepartmentFormData = {
  name: "",
  description: "",
  icon: "🏥",
  color: "bg-blue-50 text-blue-600",
  location: "",
  phone: "",
  head_doctor_id: "",
};

const ICON_OPTIONS = [
  { icon: "🏥", label: "Hospital" },
  { icon: "❤️", label: "Heart" },
  { icon: "🧠", label: "Brain" },
  { icon: "🦴", label: "Bone" },
  { icon: "👶", label: "Baby" },
  { icon: "🔬", label: "Lab" },
  { icon: "🩺", label: "Stethoscope" },
  { icon: "💊", label: "Medicine" },
  { icon: "👁️", label: "Eye" },
  { icon: "🦷", label: "Teeth" },
  { icon: "🧬", label: "DNA" },
  { icon: "⚕️", label: "Medical" },
];

const COLOR_OPTIONS = [
  { value: "bg-red-50 text-red-600", label: "Red" },
  { value: "bg-blue-50 text-blue-600", label: "Blue" },
  { value: "bg-green-50 text-green-600", label: "Green" },
  { value: "bg-purple-50 text-purple-600", label: "Purple" },
  { value: "bg-amber-50 text-amber-600", label: "Amber" },
  { value: "bg-indigo-50 text-indigo-600", label: "Indigo" },
  { value: "bg-cyan-50 text-cyan-600", label: "Cyan" },
  { value: "bg-rose-50 text-rose-600", label: "Rose" },
  { value: "bg-teal-50 text-teal-600", label: "Teal" },
  { value: "bg-slate-50 text-slate-600", label: "Slate" },
];

type ModalMode = "create" | "edit";

// ─── State update helpers (avoid full-grid reload flash) ──────────
function applySavedDepartment(
  prev: Department[],
  saved: { id: string; name: string },
  mode: ModalMode,
  form: DepartmentFormData
): Department[] {
  const base: Department = {
    id: saved.id,
    name: saved.name,
    description: form.description.trim() || null,
    head: null,
    head_doctor_id: form.head_doctor_id || null,
    icon: form.icon,
    color: form.color,
    location: form.location.trim() || null,
    phone: form.phone.trim() || null,
    doctors: 0,
    patients: 0,
    beds: 0,
  };
  if (mode === "create") {
    return [base, ...prev];
  }
  return prev.map((d) => (d.id === saved.id ? { ...d, ...base } : d));
}


export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Modal state ───────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<DepartmentFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // ─── Delete confirmation ───────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [deptRes, docRes] = await Promise.all([
        fetch("/api/departments"),
        fetch("/api/doctors"),
      ]);
      const [deptJson, docJson] = await Promise.all([
        deptRes.json(),
        docRes.json(),
      ]);

      if (deptJson.error) setError(deptJson.error.message);
      else setDepartments(deptJson.data || []);

      if (docRes.ok && docJson.data) {
        setDoctors(
          docJson.data.map((d: { id: string; profiles: { full_name: string }; specialization: string }) => ({
            id: d.id,
            full_name: d.profiles?.full_name || "Unknown",
            specialization: d.specialization,
          }))
        );
      }
    } catch {
      setError("Failed to load departments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Modal helpers ─────────────────────────────────────────────
  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setFormData(emptyForm);
    setFormErrors({});
    setModalError(null);
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setModalMode("edit");
    setEditingId(dept.id);
    setFormData({
      name: dept.name,
      description: dept.description || "",
      icon: dept.icon || "🏥",
      color: dept.color || "bg-blue-50 text-blue-600",
      location: dept.location || "",
      phone: dept.phone || "",
      head_doctor_id: dept.head_doctor_id || "",
    });
    setFormErrors({});
    setModalError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setModalOpen(false);
  };

  const validateForm = (): boolean => {
    const errors: Partial<DepartmentFormData> = {};
    if (!formData.name.trim()) errors.name = "Department name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setModalError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      icon: formData.icon,
      color: formData.color,
      location: formData.location.trim() || null,
      phone: formData.phone.trim() || null,
      head_doctor_id: formData.head_doctor_id || null,
    };

    try {
      const res = await fetch("/api/departments", {
        method: modalMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          modalMode === "create" ? payload : { id: editingId, ...payload }
        ),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        setModalError(json.error?.message || "Failed to save department.");
        return;
      }

      showSuccess(
        modalMode === "create" ? "Department created" : "Department updated"
      );
      setDepartments((prev) =>
        applySavedDepartment(
          prev,
          { id: json.data?.id || editingId || "", name: payload.name },
          modalMode,
          formData
        )
      );
      setModalOpen(false);
    } catch {
      setModalError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Delete handler ────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/departments/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const json = await res.json();
        showError("Delete failed", json.error?.message);
        setDeletingId(null);
        return;
      }

      showSuccess("Department deleted");
      setDepartments((prev) => prev.filter((d) => d.id !== deletingId));
      setDeletingId(null);
    } catch {
      showError("Delete failed", "Please try again");
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Escape-to-close for modals ─────────────────────────────────
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (modalOpen) closeModal();
        if (deletingId && !isDeleting) setDeletingId(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, deletingId, isDeleting]);

  const totalBeds = departments.reduce((s, d) => s + d.beds, 0);
  const totalDoctors = departments.reduce((s, d) => s + d.doctors, 0);
  const totalPatients = departments.reduce((s, d) => s + d.patients, 0);

  return (
    <div>
      <Header
        title="Departments"
        subtitle="Hospital department overview"
        userName="Admin"
        userRole="admin"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* Stats + Create */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent>
                <p className="text-xs text-secondary-500">Departments</p>
                <p className="text-2xl font-bold text-secondary-900">{departments.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-secondary-500">Doctors</p>
                <p className="text-2xl font-bold text-secondary-900">{totalDoctors}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <p className="text-xs text-secondary-500">Patients Served</p>
                <p className="text-2xl font-bold text-secondary-900">{totalPatients.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <Button
            onClick={openCreate}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Add Department
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dept) => (
              <div key={dept.id} className="group relative rounded-xl border border-secondary-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${dept.color || "bg-blue-50 text-blue-600"}`}>
                    <span className="text-2xl">{dept.icon || "🏥"}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(dept)}
                      className="rounded-md p-1.5 text-secondary-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                      title="Edit department"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeletingId(dept.id)}
                      className="rounded-md p-1.5 text-secondary-400 transition-colors hover:bg-danger-50 hover:text-danger-500"
                      title="Delete department"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-secondary-900">{dept.name}</h3>
                <p className="text-sm text-secondary-500">Head: {dept.head || "—"}</p>
                {dept.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-secondary-400">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                    {dept.location}
                  </p>
                )}
                {dept.description && <p className="mt-1 text-xs text-secondary-400">{dept.description}</p>}
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-secondary-100 pt-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary-900">{dept.doctors}</p>
                    <p className="text-xs text-secondary-500">Doctors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary-900">{dept.patients.toLocaleString()}</p>
                    <p className="text-xs text-secondary-500">Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-secondary-900">{dept.beds}</p>
                    <p className="text-xs text-secondary-500">Beds</p>
                  </div>
                </div>
              </div>
            ))}
            {departments.length === 0 && (
              <div className="col-span-full flex flex-col items-center rounded-xl border border-dashed border-secondary-300 bg-white p-12 text-center">
                <div className="mb-4 text-5xl">🏥</div>
                <h3 className="mb-1 text-lg font-semibold text-secondary-900">No departments yet</h3>
                <p className="mb-4 text-sm text-secondary-500">Create your first department to organize doctors and beds.</p>
                <Button onClick={openCreate} leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }>
                  Create First Department
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Create / Edit Department Modal
         ══════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="department-modal-title"
            className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="department-modal-title" className="text-lg font-semibold text-secondary-900">
                  {modalMode === "create" ? "Create New Department" : "Edit Department"}
                </h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  {modalMode === "create" ? "Add a new department to the hospital" : "Update department details"}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
              {modalError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{modalError}</p>
                </div>
              )}

              <Input
                label="Department Name"
                placeholder="e.g. Cardiology"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={formErrors.name}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                }
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="What does this department do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. 2nd Floor, East Wing"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Phone</label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Icon picker */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Icon</label>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: opt.icon })}
                      title={opt.label}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all duration-150 ${
                        formData.icon === opt.icon
                          ? "bg-primary-50 ring-2 ring-primary-500"
                          : "bg-secondary-50 hover:bg-secondary-100"
                      }`}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: opt.value })}
                      title={opt.label}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${opt.value} transition-all duration-150 ${
                        formData.color === opt.value ? "ring-2 ring-secondary-800 ring-offset-2" : "hover:scale-110"
                      }`}
                    >
                      {formData.color === opt.value && (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Head doctor */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">
                  Head Doctor <span className="font-normal text-secondary-400">(optional)</span>
                </label>
                <select
                  value={formData.head_doctor_id}
                  onChange={(e) => setFormData({ ...formData, head_doctor_id: e.target.value })}
                  className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- None --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.full_name} — {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={closeModal} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {modalMode === "create" ? "Create Department" : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Delete Confirmation
         ══════════════════════════════════════════════════════════ */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !isDeleting && setDeletingId(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dept-title"
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-secondary-200 bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50">
                <svg className="h-7 w-7 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
            </div>
            <h3 id="delete-dept-title" className="mb-2 text-center text-lg font-semibold text-secondary-900">
              Delete department?
            </h3>
            <p className="mb-6 text-center text-sm text-secondary-500">
              This will permanently remove the department. Doctors and beds linked to it will be unlinked.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="secondary" onClick={() => setDeletingId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
