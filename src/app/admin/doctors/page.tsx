"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import type { DoctorRow, ProfileRow } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────

export type DoctorWithProfile = DoctorRow & { profiles: ProfileRow };

type EditField = {
  doctorId: string;
  field: "room_number" | "fee";
};

type DoctorFormData = {
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  licenseNumber: string;
  roomNumber: string;
  fee: string;
};

const emptyForm: DoctorFormData = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "",
  licenseNumber: "",
  roomNumber: "",
  fee: "",
};

// ─── Helpers ──────────────────────────────────────────────────────

function formatFee(fee: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fee);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Component ────────────────────────────────────────────────────

export default function AdminDoctorsPage() {
  // ─── Data state ─────────────────────────────────────────────────
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Search & filter ────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // ─── Inline editing ─────────────────────────────────────────────
  const [editing, setEditing] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // ─── Create doctor modal ────────────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<DoctorFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<DoctorFormData>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // ─── Delete confirmation ────────────────────────────────────────
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ─── Fetch doctors ──────────────────────────────────────────────
  const fetchDoctors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch("/api/doctors");
      const json = await res.json();
      if (!res.ok || json.error) {
        setError(json.error?.message || "Failed to load doctors.");
        return;
      }
      setDoctors(json.data || []);
    } catch {
      setError("Failed to load doctors. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // ─── Derived data ───────────────────────────────────────────────
  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set).sort();
  }, [doctors]);

  const totalFee = useMemo(() => {
    return doctors.reduce((sum, d) => sum + d.fee, 0);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      if (specialtyFilter !== "all" && doc.specialization !== specialtyFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = doc.profiles.full_name.toLowerCase();
      const spec = doc.specialization.toLowerCase();
      const room = doc.room_number?.toLowerCase() || "";
      const lic = doc.license_number.toLowerCase();
      return (
        name.includes(q) ||
        spec.includes(q) ||
        room.includes(q) ||
        lic.includes(q)
      );
    });
  }, [doctors, searchQuery, specialtyFilter]);

  // ─── Inline edit handlers ───────────────────────────────────────

  const startEditing = (doctorId: string, field: "room_number" | "fee") => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (!doctor) return;
    setEditing({ doctorId, field });
    setEditValue(field === "fee" ? String(doctor.fee) : (doctor.room_number ?? ""));
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editing) return;

    const trimmed = editValue.trim();
    const updates: Partial<Pick<DoctorRow, "room_number" | "fee">> = {};

    if (editing.field === "room_number") {
      updates.room_number = trimmed || null;
    } else {
      const parsed = parseFloat(trimmed);
      if (isNaN(parsed) || parsed < 0) return;
      updates.fee = parsed;
    }

    setSavingId(editing.doctorId);
    try {
      const res = await fetch("/api/doctors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.doctorId, ...updates }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        return;
      }

      // Update local state
      setDoctors((prev) =>
        prev.map((d) =>
          d.id === editing.doctorId ? { ...d, ...updates } : d
        )
      );
      cancelEditing();
    } catch {
      console.error("Failed to save edit.");
    } finally {
      setSavingId(null);
    }
  };

  // ─── Create doctor handlers ─────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: Partial<DoctorFormData> = {};
    if (!formData.fullName.trim()) errors.fullName = "Full name is required";
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email address";
    }
    if (!formData.specialization.trim())
      errors.specialization = "Specialization is required";
    if (!formData.licenseNumber.trim())
      errors.licenseNumber = "License number is required";
    if (formData.fee && isNaN(parseFloat(formData.fee)))
      errors.fee = "Fee must be a number";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateDoctor = async () => {
    if (!validateForm()) return;

    setIsCreating(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      // 1. Create auth user with a temporary password
      const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
      const authRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: tempPassword,
          fullName: formData.fullName,
          role: "DOCTOR",
        }),
      });
      const authJson = await authRes.json();

      if (!authRes.ok) {
        setCreateError(authJson.error || "Failed to create user account.");
        return;
      }

      if (!authJson.user) {
        setCreateError("Failed to create user account. Please try again.");
        return;
      }

      // 2. Create doctor record (includes profile update)
      const docRes = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: authJson.user.id,
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          specialization: formData.specialization,
          license_number: formData.licenseNumber,
          fee: formData.fee ? parseFloat(formData.fee) : 0,
          room_number: formData.roomNumber || null,
        }),
      });
      const docJson = await docRes.json();

      if (!docRes.ok || docJson.error) {
        setCreateError(
          "Failed to create doctor record: " + (docJson.error?.message || "Unknown error")
        );
        return;
      }

      // Success
      setCreateSuccess(
        `Doctor "${formData.fullName}" created successfully! They will receive an email to activate their account.`
      );
      setFormData(emptyForm);

      // Refresh the doctor list
      await fetchDoctors();

      // Close modal after a short delay
      setTimeout(() => {
        setShowCreateModal(false);
        setCreateSuccess(null);
      }, 2500);

    } catch {
      setCreateError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Delete handler ─────────────────────────────────────────────

  const handleDeleteDoctor = async () => {
    if (!deletingId) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/doctors/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        return;
      }

      setDoctors((prev) => prev.filter((d) => d.id !== deletingId));
      setDeletingId(null);
    } catch {
      console.error("Failed to delete doctor.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Key handler for inline edit ────────────────────────────────

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") cancelEditing();
  };

  // ─── Specialties for filter ────────────────────────────────────

  const filterOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    doctors.forEach((d) => {
      counts[d.specialization] = (counts[d.specialization] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [doctors]);

  // ─── Render ────────────────────────────────────────────────────

  return (
    <div>
      <Header
        title="Doctor Management"
        subtitle={`${doctors.length} registered doctor${doctors.length !== 1 ? "s" : ""} · ${specialties.length} specialties`}
        userName="Admin User"
        userRole="admin"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* ── Stats Row ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Total Doctors</p>
                  {isLoading ? (
                    <div className="mt-1 h-6 w-10 animate-pulse rounded bg-secondary-200" />
                  ) : (
                    <p className="text-xl font-bold text-secondary-900">
                      {doctors.length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Specialties</p>
                  {isLoading ? (
                    <div className="mt-1 h-6 w-10 animate-pulse rounded bg-secondary-200" />
                  ) : (
                    <p className="text-xl font-bold text-secondary-900">
                      {specialties.length}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Total Fees (sum)</p>
                  {isLoading ? (
                    <div className="mt-1 h-6 w-20 animate-pulse rounded bg-secondary-200" />
                  ) : (
                    <p className="text-xl font-bold text-secondary-900">
                      {formatFee(totalFee)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Toolbar ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-3">
            {/* Search */}
            <div className="relative max-w-xs flex-1">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, specialty, room..."
                className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-secondary-400 transition-colors hover:text-secondary-600"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Specialty filter */}
            <select
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2.5 text-sm text-secondary-700 shadow-sm transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Specialties</option>
              {filterOptions.map(([spec, count]) => (
                <option key={spec} value={spec}>
                  {spec} ({count})
                </option>
              ))}
            </select>
          </div>

          {/* Create button */}
          <Button
            onClick={() => {
              setShowCreateModal(true);
              setCreateError(null);
              setCreateSuccess(null);
              setFormData(emptyForm);
              setFormErrors({});
            }}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Create Doctor
          </Button>
        </div>

        {/* ── Results count ──────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">
            {isLoading
              ? "Loading doctors..."
              : `Showing ${filteredDoctors.length} of ${doctors.length} doctor${doctors.length !== 1 ? "s" : ""}`}
          </p>
          {!isLoading && filteredDoctors.length === 0 && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSpecialtyFilter("all");
              }}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* ── Loading State ──────────────────────────────────────── */}
        {isLoading && (
          <Card>
            <div className="animate-pulse space-y-4 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-40 rounded bg-secondary-200" />
                    <div className="h-2.5 w-24 rounded bg-secondary-100" />
                  </div>
                  <div className="h-8 w-20 rounded bg-secondary-200" />
                  <div className="h-8 w-20 rounded bg-secondary-200" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Error State ────────────────────────────────────────── */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50 p-12 text-center">
            <svg
              className="mb-4 h-12 w-12 text-danger-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-danger-700">
              Failed to load doctors
            </h3>
            <p className="mb-6 text-sm text-danger-600">{error}</p>
            <Button variant="danger" onClick={() => fetchDoctors()}>
              Retry
            </Button>
          </div>
        )}

        {/* ── Empty State ────────────────────────────────────────── */}
        {!isLoading && !error && filteredDoctors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-300 bg-white p-12 text-center">
            <div className="mb-4 text-5xl">👨‍⚕️</div>
            <h3 className="mb-2 text-lg font-semibold text-secondary-900">
              {doctors.length === 0
                ? "No doctors registered yet"
                : "No matching doctors"}
            </h3>
            <p className="mb-1 text-sm text-secondary-500">
              {doctors.length === 0
                ? "Create your first doctor profile to get started."
                : "Try adjusting your search or filter criteria."}
            </p>
            {doctors.length === 0 ? (
              <Button
                onClick={() => setShowCreateModal(true)}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
                className="mt-4"
              >
                Create First Doctor
              </Button>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSpecialtyFilter("all");
                }}
                className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* ── Doctors Table ──────────────────────────────────────── */}
        {!isLoading && !error && filteredDoctors.length > 0 && (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-100 bg-secondary-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      Specialization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      License
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      Room Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      Consultation Fee
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-secondary-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filteredDoctors.map((doctor) => {
                    const isEditingRoom =
                      editing?.doctorId === doctor.id &&
                      editing?.field === "room_number";
                    const isEditingFee =
                      editing?.doctorId === doctor.id &&
                      editing?.field === "fee";

                    return (
                      <tr
                        key={doctor.id}
                        className="group transition-colors duration-150 hover:bg-primary-50/30"
                      >
                        {/* Doctor Info */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-sm font-bold text-primary-700 shadow-sm">
                              {getInitials(doctor.profiles.full_name)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-secondary-900">
                                {doctor.profiles.full_name}
                              </p>
                              <p className="text-xs text-secondary-400">
                                {doctor.profiles.phone || "No phone"}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Specialization */}
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700">
                            {doctor.specialization}
                          </span>
                        </td>

                        {/* License */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs font-medium text-secondary-600">
                            {doctor.license_number}
                          </span>
                        </td>

                        {/* Room Number (inline editable) */}
                        <td className="px-6 py-4">
                          {isEditingRoom ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleEditKeyDown}
                                placeholder="e.g. 301A"
                                className="w-24 rounded-md border border-primary-400 bg-white px-2 py-1.5 text-sm text-secondary-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                autoFocus
                              />
                              <button
                                onClick={saveEdit}
                                disabled={savingId === doctor.id}
                                className="rounded-md p-1 text-success-600 transition-colors hover:bg-success-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="rounded-md p-1 text-secondary-400 transition-colors hover:bg-secondary-100"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                startEditing(doctor.id, "room_number")
                              }
                              className="group/edit flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-secondary-700 transition-all duration-150 hover:bg-secondary-100"
                            >
                              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary-100 text-xs text-secondary-500">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                                </svg>
                              </span>
                              {doctor.room_number || (
                                <span className="text-secondary-400 italic">
                                  Not set
                                </span>
                              )}
                              <svg
                                className="h-3.5 w-3.5 text-secondary-300 opacity-0 transition-opacity group-hover/edit:opacity-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                          )}
                        </td>

                        {/* Fee (inline editable) */}
                        <td className="px-6 py-4">
                          {isEditingFee ? (
                            <div className="flex items-center gap-1">
                              <div className="relative">
                                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-sm text-secondary-400">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={handleEditKeyDown}
                                  placeholder="0.00"
                                  className="w-24 rounded-md border border-primary-400 bg-white py-1.5 pl-6 pr-2 text-sm text-secondary-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                                  autoFocus
                                />
                              </div>
                              <button
                                onClick={saveEdit}
                                disabled={savingId === doctor.id}
                                className="rounded-md p-1 text-success-600 transition-colors hover:bg-success-50"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="rounded-md p-1 text-secondary-400 transition-colors hover:bg-secondary-100"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEditing(doctor.id, "fee")}
                              className="group/edit flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-secondary-900 transition-all duration-150 hover:bg-secondary-100"
                            >
                              {doctor.fee > 0 ? (
                                formatFee(doctor.fee)
                              ) : (
                                <span className="text-success-600">Free</span>
                              )}
                              <svg
                                className="h-3.5 w-3.5 text-secondary-300 opacity-0 transition-opacity group-hover/edit:opacity-100"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                              </svg>
                            </button>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Conditional delete button — only shown when confirming */}
                            {deletingId === doctor.id ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-danger-600">
                                  Delete?
                                </span>
                                <button
                                  onClick={handleDeleteDoctor}
                                  disabled={isDeleting}
                                  className="rounded-md bg-danger-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-danger-700 disabled:opacity-50"
                                >
                                  {isDeleting ? "..." : "Yes"}
                                </button>
                                <button
                                  onClick={() => setDeletingId(null)}
                                  className="rounded-md bg-secondary-100 px-2.5 py-1.5 text-xs font-semibold text-secondary-600 transition-colors hover:bg-secondary-200"
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeletingId(doctor.id)}
                                className="rounded-md p-1.5 text-secondary-400 opacity-0 transition-all duration-150 hover:bg-danger-50 hover:text-danger-500 group-hover:opacity-100"
                                title="Delete doctor"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Create Doctor Modal
         ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isCreating && setShowCreateModal(false)}
          />

          {/* Modal */}
          <div className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-secondary-200 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-secondary-900">
                  Create New Doctor
                </h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Register a new doctor in the system
                </p>
              </div>
              <button
                onClick={() => !isCreating && setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {/* Success message */}
              {createSuccess && (
                <div className="flex items-start gap-3 rounded-lg border border-success-200 bg-success-50 p-4">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-success-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="text-sm font-medium text-success-700">
                    {createSuccess}
                  </p>
                </div>
              )}

              {/* Error message */}
              {createError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg
                    className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{createError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Full Name"
                    placeholder="Dr. John Smith"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    error={formErrors.fullName}
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    }
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    error={formErrors.email}
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                      </svg>
                    }
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                      </svg>
                    }
                  />
                </div>

                <div className="col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">
                    Specialization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cardiology, Neurology..."
                    value={formData.specialization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        specialization: e.target.value,
                      })
                    }
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      formErrors.specialization
                        ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                        : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                  {formErrors.specialization && (
                    <p className="mt-1.5 text-sm text-danger-500">
                      {formErrors.specialization}
                    </p>
                  )}
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="License Number"
                    placeholder="MED-12345"
                    value={formData.licenseNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        licenseNumber: e.target.value,
                      })
                    }
                    error={formErrors.licenseNumber}
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <Input
                    label="Room Number"
                    placeholder="e.g. 301A"
                    value={formData.roomNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, roomNumber: e.target.value })
                    }
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                      </svg>
                    }
                  />
                </div>

                <div className="col-span-2">
                  <Input
                    label="Consultation Fee ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.fee}
                    onChange={(e) =>
                      setFormData({ ...formData, fee: e.target.value })
                    }
                    error={formErrors.fee}
                    helperText="Leave as 0 for free consultations"
                    leftIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Note about account creation */}
              <div className="rounded-lg bg-secondary-50 p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-secondary-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <p className="text-xs text-secondary-500">
                    A user account will be created for the doctor so they can
                    sign in. They will receive an email to set their password.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button
                variant="secondary"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDoctor}
                isLoading={isCreating}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
              >
                {isCreating ? "Creating..." : "Create Doctor"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
