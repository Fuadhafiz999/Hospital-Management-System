"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showSuccess, showError } from "@/lib/toast";

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time_slot: string;
  status: string;
  reason: string;
  doctor: {
    profiles: { full_name: string };
  } | null;
  patient: { full_name: string };
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-700",
  CONFIRMED: "bg-success-50 text-success-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-secondary-100 text-secondary-600",
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Data for booking modal ────────────────────────────────────
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; name: string; spec: string }[]>([]);

  // ─── Book appointment modal state ──────────────────────────────
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState({
    patient_id: "",
    doctor_id: "",
    date: "",
    time_slot: "",
    reason: "",
  });
  const [bookFormErrors, setBookFormErrors] = useState<{
    patient_id?: string;
    doctor_id?: string;
    date?: string;
    time_slot?: string;
    reason?: string;
  }>({});
  const [bookError, setBookError] = useState<string | null>(null);
  const [isBooking, setIsBooking] = useState(false);

  const TIME_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
    "15:00", "15:30", "16:00", "16:30", "17:00",
  ];

  const todayStr = new Date().toISOString().split("T")[0];

  const loadAppointments = () => {
    let cancelled = false;
    fetch("/api/appointments?pageSize=100")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error.message);
        else setAppointments(json.data || []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load appointments.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  // Load patients & doctors for booking modal
  useEffect(() => {
    let cancelled = false;
    async function loadOptions() {
      try {
        const [patRes, docRes] = await Promise.all([
          fetch("/api/patients"),
          fetch("/api/doctors"),
        ]);
        const [patJson, docJson] = await Promise.all([patRes.json(), docRes.json()]);
        if (cancelled) return;
        if (patRes.ok && patJson.data) {
          setPatients(patJson.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
        if (docRes.ok && docJson.data) {
          setDoctors(docJson.data.map((d: { id: string; profiles: { full_name: string }; specialization: string }) => ({
            id: d.id,
            name: d.profiles?.full_name || "Unknown",
            spec: d.specialization,
          })));
        }
      } catch {
        /* non-fatal */
      }
    }
    loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        showError("Update failed", json.error?.message);
        return;
      }
      showSuccess("Appointment updated");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } catch {
      showError("Update failed", "Please try again");
    }
  };

  // ─── Book appointment handlers ─────────────────────────────────
  const openBookModal = () => {
    setBookForm({ patient_id: "", doctor_id: "", date: "", time_slot: "", reason: "" });
    setBookFormErrors({});
    setBookError(null);
    setShowBookModal(true);
  };

  const validateBookForm = (): boolean => {
    const errors: typeof bookFormErrors = {};
    if (!bookForm.patient_id) errors.patient_id = "Please select a patient";
    if (!bookForm.doctor_id) errors.doctor_id = "Please select a doctor";
    if (!bookForm.date) errors.date = "Please select a date";
    if (!bookForm.time_slot) errors.time_slot = "Please select a time slot";
    if (bookForm.reason.trim().length < 10) errors.reason = "Please provide at least 10 characters";
    setBookFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBookAppointment = async () => {
    if (!validateBookForm()) return;

    setIsBooking(true);
    setBookError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: bookForm.patient_id,
          doctor_id: bookForm.doctor_id,
          date: bookForm.date,
          time_slot: bookForm.time_slot,
          reason: bookForm.reason.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setBookError(json.error?.message || "Failed to book appointment.");
        return;
      }
      showSuccess("Appointment booked", "The appointment has been scheduled successfully.");
      setShowBookModal(false);
      loadAppointments();
    } catch {
      setBookError("An unexpected error occurred. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const filtered = statusFilter === "ALL"
    ? appointments
    : appointments.filter((a) => a.status === statusFilter);

  const countByStatus = (status: string) =>
    appointments.filter((a) => a.status === status).length;

  return (
    <div>
      <Header title="Appointments" subtitle="Manage all hospital appointments" userName="Admin" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Book Appointment Action */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">Confirm, complete, and manage all appointments</p>
          <Button
            onClick={openBookModal}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Book Appointment
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card><CardContent><p className="text-xs text-secondary-500">Total</p><p className="text-xl font-bold text-secondary-900">{appointments.length}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs text-success-600">Confirmed</p><p className="text-xl font-bold text-secondary-900">{countByStatus("CONFIRMED")}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs text-warning-600">Pending</p><p className="text-xl font-bold text-secondary-900">{countByStatus("PENDING")}</p></CardContent></Card>
          <Card><CardContent><p className="text-xs text-blue-600">Completed</p><p className="text-xl font-bold text-secondary-900">{countByStatus("COMPLETED")}</p></CardContent></Card>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
            </button>
          ))}
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
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Doctor</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Reason</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filtered.map((apt) => (
                    <tr key={apt.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-6 py-4 text-sm font-medium text-secondary-900">{apt.patient?.full_name}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{apt.doctor?.profiles?.full_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{apt.date}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{apt.time_slot}</td>
                      <td className="px-6 py-4 text-sm text-secondary-500">{apt.reason || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status]}`}>
                          {apt.status.toLowerCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {apt.status === "PENDING" && (
                          <button
                            onClick={() => updateStatus(apt.id, "CONFIRMED")}
                            className="rounded-md bg-success-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-success-700"
                          >
                            Confirm
                          </button>
                        )}
                        {apt.status === "CONFIRMED" && (
                          <button
                            onClick={() => updateStatus(apt.id, "COMPLETED")}
                            className="rounded-md bg-blue-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            Complete
                          </button>
                        )}
                        {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                          <button
                            onClick={() => updateStatus(apt.id, "CANCELLED")}
                            className="ml-2 rounded-md bg-secondary-200 px-2.5 py-1 text-xs font-semibold text-secondary-700 transition-colors hover:bg-secondary-300"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-secondary-500">
                        No appointments found
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
          Book Appointment Modal
         ══════════════════════════════════════════════════════════ */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isBooking && setShowBookModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="book-appt-title"
            className="relative z-10 mx-4 w-full max-w-lg rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="book-appt-title" className="text-lg font-semibold text-secondary-900">Book Appointment</h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Schedule an appointment on behalf of a patient
                </p>
              </div>
              <button
                onClick={() => !isBooking && setShowBookModal(false)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
              {bookError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{bookError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Patient</label>
                  <select
                    value={bookForm.patient_id}
                    onChange={(e) => {
                      setBookForm({ ...bookForm, patient_id: e.target.value });
                      setBookFormErrors((prev) => ({ ...prev, patient_id: undefined }));
                    }}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      bookFormErrors.patient_id
                        ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                        : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  >
                    <option value="">-- Select patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  {bookFormErrors.patient_id && (
                    <p className="mt-1.5 text-sm text-danger-500">{bookFormErrors.patient_id}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Doctor</label>
                  <select
                    value={bookForm.doctor_id}
                    onChange={(e) => {
                      setBookForm({ ...bookForm, doctor_id: e.target.value });
                      setBookFormErrors((prev) => ({ ...prev, doctor_id: undefined }));
                    }}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      bookFormErrors.doctor_id
                        ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                        : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  >
                    <option value="">-- Select doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} — {d.spec}</option>
                    ))}
                  </select>
                  {bookFormErrors.doctor_id && (
                    <p className="mt-1.5 text-sm text-danger-500">{bookFormErrors.doctor_id}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Date</label>
                  <input
                    type="date"
                    min={todayStr}
                    value={bookForm.date}
                    onChange={(e) => {
                      setBookForm({ ...bookForm, date: e.target.value });
                      setBookFormErrors((prev) => ({ ...prev, date: undefined }));
                    }}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      bookFormErrors.date
                        ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                        : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  />
                  {bookFormErrors.date && (
                    <p className="mt-1.5 text-sm text-danger-500">{bookFormErrors.date}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-secondary-700">Time Slot</label>
                  <select
                    value={bookForm.time_slot}
                    onChange={(e) => {
                      setBookForm({ ...bookForm, time_slot: e.target.value });
                      setBookFormErrors((prev) => ({ ...prev, time_slot: undefined }));
                    }}
                    className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      bookFormErrors.time_slot
                        ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                        : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                    }`}
                  >
                    <option value="">-- Select time --</option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {bookFormErrors.time_slot && (
                    <p className="mt-1.5 text-sm text-danger-500">{bookFormErrors.time_slot}</p>
                  )}
                </div>
              </div>

              <Input
                label="Reason for Visit"
                placeholder="Describe the reason (min. 10 characters)"
                value={bookForm.reason}
                onChange={(e) => {
                  setBookForm({ ...bookForm, reason: e.target.value });
                  setBookFormErrors((prev) => ({ ...prev, reason: undefined }));
                }}
                error={bookFormErrors.reason}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                }
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowBookModal(false)} disabled={isBooking}>
                Cancel
              </Button>
              <Button onClick={handleBookAppointment} isLoading={isBooking}>
                {isBooking ? "Booking..." : "Book Appointment"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Escape-to-close for book-appointment modal */}
      {showBookModal && (
        <EscapeCloseModal
          disabled={isBooking}
          onClose={() => setShowBookModal(false)}
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
