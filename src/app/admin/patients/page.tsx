"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showSuccess, showError } from "@/lib/toast";

interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  created_at: string;
  last_visit: string | null;
}

interface MedicalRecord {
  id: string;
  diagnosis: string | null;
  notes: string | null;
  created_at: string;
  doctor?: {
    profiles?: {
      full_name: string;
    } | null;
  } | null;
  appointment?: {
    date: string | null;
    time_slot: string | null;
    status: string | null;
    reason: string | null;
  } | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Add patient modal state ────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientForm, setPatientForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [patientFormErrors, setPatientFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [patientError, setPatientError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // ─── Patient history modal state ───────────────────────────────
  const [historyPatient, setHistoryPatient] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [historyRecords, setHistoryRecords] = useState<MedicalRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const HISTORY_PAGE_SIZE = 20;

  const openPatientHistory = (patientId: string, patientName: string) => {
    setHistoryPatient({ id: patientId, name: patientName });
    setHistoryPage(1);
    setHistoryRecords([]);
    setHistoryError(null);
    loadHistoryRecords();
  };

  const loadHistoryRecords = () => {
    if (!historyPatient) return;
    let cancelled = false;
    setHistoryLoading(true);
    fetch(
      `/api/medical-records?patientId=${encodeURIComponent(historyPatient.id)}&page=${historyPage}&pageSize=${HISTORY_PAGE_SIZE}`
    )
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setHistoryError(json.error.message || "Failed to load patient history.");
          setHistoryRecords([]);
          setHistoryHasMore(false);
        } else {
          setHistoryRecords(json.data || []);
          setHistoryHasMore(!
            json
              ? false
              : json.data && json.data.length >= (json.pageSize || HISTORY_PAGE_SIZE)
          );
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryError("Failed to load patient history.");
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  const loadPatients = () => {
    let cancelled = false;
    fetch("/api/patients")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error.message);
        else setPatients(json.data || []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load patients.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => loadPatients(), []);

  // ─── Add patient handlers ──────────────────────────────────────
  const openAddModal = () => {
    setPatientForm({ fullName: "", email: "", phone: "", password: "" });
    setPatientFormErrors({});
    setPatientError(null);
    setShowAddModal(true);
  };

  const validatePatientForm = (): boolean => {
    const errors: typeof patientFormErrors = {};
    if (!patientForm.fullName.trim()) errors.fullName = "Full name is required";
    if (!patientForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(patientForm.email)) {
      errors.email = "Invalid email address";
    }
    if (!patientForm.password) {
      errors.password = "Password is required";
    } else if (patientForm.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    setPatientFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPatient = async () => {
    if (!validatePatientForm()) return;

    setIsAdding(true);
    setPatientError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: patientForm.email.trim().toLowerCase(),
          password: patientForm.password,
          fullName: patientForm.fullName.trim(),
          phone: patientForm.phone.trim() || null,
          role: "PATIENT",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPatientError(json.error || "Failed to create patient account.");
        return;
      }
      showSuccess("Patient added", `Account created for ${patientForm.fullName.trim()}`);
      setShowAddModal(false);
      setPatientForm({ fullName: "", email: "", phone: "", password: "" });
      loadPatients();
    } catch {
      setPatientError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const filtered = patients.filter(
    (p) =>
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => loadHistoryRecords(), [historyPatient?.id, historyPage]);

  const activeCount = patients.filter((p) => p.last_visit).length;

  return (
    <div>
      <Header
        title="Patient Management"
        subtitle={`${patients.length} registered patients`}
        userName="Admin"
        userRole="admin"
        showSearch={true}
      />

      <div className="page-container space-y-6">
        {/* Add Patient Action */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">Register and manage patient accounts</p>
          <Button
            onClick={openAddModal}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Add Patient
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Total Patients</p>
              <p className="text-2xl font-bold text-secondary-900">{patients.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">With Visits</p>
              <p className="text-2xl font-bold text-success-700">{activeCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">New This Month</p>
              <p className="text-2xl font-bold text-primary-700">
                {patients.filter((p) => new Date(p.created_at) > new Date(Date.now() - 30 * 86400000)).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, email, or ID..."
            className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-100 bg-secondary-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Last Visit</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">History</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filtered.map((patient) => (
                    <tr key={patient.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                            {initials(patient.name)}
                          </div>
                          <span className="text-sm font-medium text-secondary-900">{patient.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{patient.email}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{patient.phone || "—"}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{formatDate(patient.last_visit)}</td>
                      <td className="px-6 py-4 text-sm text-secondary-400">{formatDate(patient.created_at.split("T")[0])}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openPatientHistory(patient.id, patient.name)}
                        >
                          View History
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-secondary-500">
                        No patients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Add Patient Modal
         ══════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isAdding && setShowAddModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-patient-title"
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="add-patient-title" className="text-lg font-semibold text-secondary-900">Add New Patient</h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Register a patient account so they can sign in
                </p>
              </div>
              <button
                onClick={() => !isAdding && setShowAddModal(false)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {patientError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{patientError}</p>
                </div>
              )}

              <Input
                label="Full Name"
                placeholder="John Doe"
                value={patientForm.fullName}
                onChange={(e) => {
                  setPatientForm({ ...patientForm, fullName: e.target.value });
                  setPatientFormErrors((prev) => ({ ...prev, fullName: undefined }));
                }}
                error={patientFormErrors.fullName}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
              />

              <Input
                label="Email Address"
                type="email"
                placeholder="patient@example.com"
                value={patientForm.email}
                onChange={(e) => {
                  setPatientForm({ ...patientForm, email: e.target.value });
                  setPatientFormErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={patientFormErrors.email}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                }
              />

              <Input
                label="Phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={patientForm.phone}
                onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                  </svg>
                }
              />

              <Input
                label="Temporary Password"
                type="password"
                placeholder="Min. 6 characters"
                value={patientForm.password}
                onChange={(e) => {
                  setPatientForm({ ...patientForm, password: e.target.value });
                  setPatientFormErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={patientFormErrors.password}
                helperText="The patient will use this to sign in initially."
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                }
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isAdding}>
                Cancel
              </Button>
              <Button onClick={handleAddPatient} isLoading={isAdding}>
                {isAdding ? "Creating..." : "Add Patient"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          Patient History Modal
         ═══════════════════════════════════════════════════════════ */}
      {historyPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setHistoryPatient(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-history-title"
            className="relative z-10 mx-4 w-full max-w-2xl rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="patient-history-title" className="text-lg font-semibold text-secondary-900">
                  Medical History — {historyPatient.name}
                </h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Records are listed newest first.
                </p>
              </div>
              <button
                onClick={() => setHistoryPatient(null)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {historyError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{historyError}</p>
                </div>
              )}

              {historyLoading && historyRecords.length === 0 ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary-100" />
                  ))}
                </div>
              ) : historyRecords.length === 0 ? (
                <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-6 text-center text-sm text-secondary-600">
                  No medical records found for this patient.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent>
                        <div className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-semibold text-secondary-900">
                              {formatDate(record.created_at)}
                            </span>
                            {record.appointment?.status && (
                              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                                {record.appointment.status}
                              </span>
                            )}
                            {record.doctor?.profiles?.full_name && (
                              <span className="text-xs text-secondary-500">
                                Attending: {record.doctor.profiles.full_name}
                              </span>
                            )}
                          </div>

                          {record.appointment && (
                            <div className="rounded-lg bg-secondary-50 p-3 text-sm text-secondary-700">
                              <p className="font-medium text-secondary-900">Appointment</p>
                              <p className="mt-1 text-secondary-600">
                                {formatDate(record.appointment.date)} · {record.appointment.time_slot || "—"}
                              </p>
                              {record.appointment.reason && (
                                <p className="mt-1 text-secondary-600">Reason: {record.appointment.reason}</p>
                              )}
                            </div>
                          )}

                          {record.diagnosis && (
                            <p className="text-sm text-secondary-700">
                              <span className="font-medium">Diagnosis</span>

                              <span className="mt-1 block text-secondary-600">{record.diagnosis}</span>
                            </p>
                          )}

                          {record.notes && (
                            <p className="text-sm text-secondary-700">
                              <span className="font-medium">Notes</span>

                              <span className="mt-1 block text-secondary-600">{record.notes}</span>
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {historyHasMore && (
                    <div className="flex justify-center pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setHistoryPage((page) => page + 1)}
                        disabled={historyLoading}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setHistoryPatient(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Escape-to-close for add-patient modal */}
      {showAddModal && (
        <EscapeCloseModal
          disabled={isAdding}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

function EscapeCloseModal({
  disabled,
  onClose,
}: {
  disabled?: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [disabled, onClose]);
  return null;
}

