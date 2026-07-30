"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import ConsultationModal from "@/components/ConsultationModal";
import type {
  AppointmentRow,
  ProfileRow,
  DoctorRow,
  AppointmentStatus,
} from "@/types/supabase";
import type { AppointmentWithPatient } from "@/components/ConsultationModal";

// ─── Types ────────────────────────────────────────────────────────
type StatusFilter = "ALL" | "PENDING" | "CONFIRMED";

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(time24: string): string {
  return new Date(`2000-01-01T${time24}:00`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function getTodayDisplay(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ─── Status Badge ─────────────────────────────────────────────────
const statusConfig: Record<AppointmentStatus, { label: string; classes: string }> = {
  PENDING: {
    label: "Pending",
    classes: "bg-warning-50 text-warning-700 border-warning-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    classes: "bg-success-50 text-success-700 border-success-200",
  },
  COMPLETED: {
    label: "Completed",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  CANCELLED: {
    label: "Cancelled",
    classes: "bg-secondary-100 text-secondary-600 border-secondary-200",
  },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.classes}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── Available Transitions ────────────────────────────────────────
const STATUS_TRANSITIONS: Record<
  AppointmentStatus,
  { label: string; nextStatus: AppointmentStatus; color: string }[]
> = {
  PENDING: [
    { label: "Confirm", nextStatus: "CONFIRMED", color: "green" },
    { label: "Cancel", nextStatus: "CANCELLED", color: "red" },
  ],
  CONFIRMED: [
    { label: "Complete", nextStatus: "COMPLETED", color: "green" },
    { label: "Cancel", nextStatus: "CANCELLED", color: "red" },
  ],
  COMPLETED: [],
  CANCELLED: [],
};

// ─── Component ────────────────────────────────────────────────────
export default function DoctorDashboardPage() {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [consultingAppointment, setConsultingAppointment] = useState<AppointmentWithPatient | null>(null);

  // ─── Fetch on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setIsLoading(true);
        setError(null);

        // 1. Get current user
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (cancelled) return;
        if (!meJson.user) {
          setError("You must be signed in.");
          return;
        }

        const userId = meJson.user.id;
        const doctorNameVal = meJson.user.fullName || "Doctor";
        setDoctorName(doctorNameVal);

        // 2. Get doctor record from API
        const docsRes = await fetch("/api/doctors");
        const docsJson = await docsRes.json();
        if (cancelled) return;

        let foundDoctorId: string | null = null;
        if (docsRes.ok && docsJson.data) {
          // Find the doctor record that matches this user
          const doctorRecord = docsJson.data.find(
            (d: any) => d.profile_id === userId
          );
          if (doctorRecord) {
            foundDoctorId = doctorRecord.id;
            setDoctorId(doctorRecord.id);
            setSpecialization(doctorRecord.specialization);
          } else {
            setError("Doctor profile not found.");
            return;
          }
        }

        // 3. Fetch appointments
        const today = getTodayString();
        const aptRes = await fetch(`/api/appointments?doctorId=${foundDoctorId || ""}`);
        const aptJson = await aptRes.json();

        if (cancelled) return;
        if (!aptRes.ok || aptJson.error) {
          setError(aptJson.error?.message || "Failed to load appointments.");
          return;
        }

        // Filter to today only and sort by time
        const todaysAppts = (aptJson.data || [])
          .filter((a: any) => a.date === today)
          .sort((a: any, b: any) => a.time_slot.localeCompare(b.time_slot));
        setAppointments(todaysAppts);
      } catch {
        if (!cancelled) setError("Failed to load dashboard.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Filtered appointments ─────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    if (statusFilter === "ALL") return appointments;
    return appointments.filter((a) => a.status === statusFilter);
  }, [appointments, statusFilter]);

  // ─── Status counts ─────────────────────────────────────────────
  const counts = useMemo(() => {
    return {
      ALL: appointments.length,
      PENDING: appointments.filter((a) => a.status === "PENDING").length,
      CONFIRMED: appointments.filter((a) => a.status === "CONFIRMED").length,
    };
  }, [appointments]);

  // ─── Status update action ──────────────────────────────────────
  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: AppointmentStatus
  ) => {
    setActionLoading(appointmentId);
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: appointmentId, status: newStatus }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        console.error("Failed to update status:", json.error?.message);
        return;
      }

      // Update local state
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === appointmentId ? { ...a, status: newStatus } : a
        )
      );
    } catch {
      console.error("Failed to update appointment status.");
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Consultation complete callback ─────────────────────────────
  const handleConsultationComplete = () => {
    // Optimistically update appointment status to COMPLETED
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === consultingAppointment?.id
          ? { ...a, status: "COMPLETED" as const }
          : a
      )
    );
    setConsultingAppointment(null);
  };

  // ─── Filter buttons ────────────────────────────────────────────
  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: "ALL", label: "All", count: counts.ALL },
    { key: "PENDING", label: "Pending", count: counts.PENDING },
    { key: "CONFIRMED", label: "Confirmed", count: counts.CONFIRMED },
  ];

  // ─── Render ────────────────────────────────────────────────────
  const todayStr = getTodayDisplay();

  return (
    <div>
      <Header
        title="Doctor Dashboard"
        subtitle={`${doctorName || "Loading..."}${specialization ? ` — ${specialization}` : ""}`}
        userName={doctorName || "Doctor"}
        userRole="doctor"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* ── Stats Summary Row ──────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-3">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`rounded-xl border p-4 text-left shadow-sm transition-all duration-200 ${
                statusFilter === tab.key
                  ? "border-primary-400 bg-primary-50 ring-1 ring-primary-500/20"
                  : "border-secondary-200 bg-white hover:border-secondary-300 hover:bg-secondary-50"
              }`}
            >
              <p className="text-sm font-medium text-secondary-500">
                {tab.label}
              </p>
              {isLoading ? (
                <div className="mt-1 h-7 w-12 animate-pulse rounded bg-secondary-200" />
              ) : (
                <p className="mt-1 text-2xl font-bold text-secondary-900">
                  {tab.count}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* ── Today's Appointments Card ──────────────────────────── */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Today&apos;s Appointments</CardTitle>
              <p className="mt-0.5 text-sm text-secondary-500">{todayStr}</p>
            </div>

            {/* Desktop filter pills */}
            <div className="hidden items-center gap-1.5 rounded-lg bg-secondary-100 p-1 sm:flex">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    statusFilter === tab.key
                      ? "bg-white text-secondary-900 shadow-sm"
                      : "text-secondary-500 hover:text-secondary-700"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className="ml-1.5 text-xs opacity-60">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-4 rounded-lg p-3"
                  >
                    <div className="h-10 w-16 rounded bg-secondary-200" />
                    <div className="h-10 w-10 rounded-full bg-secondary-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 rounded bg-secondary-200" />
                      <div className="h-2.5 w-24 rounded bg-secondary-100" />
                    </div>
                    <div className="h-6 w-20 rounded bg-secondary-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="flex flex-col items-center py-8 text-center">
                <svg
                  className="mb-3 h-10 w-10 text-danger-400"
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
                <p className="text-sm font-medium text-danger-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty */}
            {!isLoading && !error && filteredAppointments.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 text-5xl">
                  {statusFilter === "ALL" ? "📅" : "✅"}
                </div>
                <p className="text-sm font-medium text-secondary-900">
                  {statusFilter === "ALL"
                    ? "No appointments scheduled for today"
                    : `No ${statusFilter.toLowerCase()} appointments`}
                </p>
                <p className="mt-1 text-xs text-secondary-500">
                  {statusFilter === "ALL"
                    ? "Enjoy your day off!"
                    : `Try viewing all appointments`}
                </p>
                {statusFilter !== "ALL" && (
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
                  >
                    View all appointments
                  </button>
                )}
              </div>
            )}

            {/* Appointment List */}
            {!isLoading && !error && filteredAppointments.length > 0 && (
              <div className="divide-y divide-secondary-100">
                {filteredAppointments.map((apt) => {
                  const transitions = STATUS_TRANSITIONS[apt.status];
                  const isPast =
                    apt.date < getTodayString() ||
                    apt.status === "COMPLETED" ||
                    apt.status === "CANCELLED";

                  return (
                    <div
                      key={apt.id}
                      className={`flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between ${
                        isPast ? "opacity-60" : ""
                      }`}
                    >
                      {/* Left: Time + Patient Info */}
                      <div className="flex items-center gap-4">
                        {/* Time */}
                        <div className="w-16 text-center">
                          <p className="text-sm font-semibold text-secondary-900">
                            {formatTime(apt.time_slot)}
                          </p>
                        </div>

                        {/* Patient Avatar + Name */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                            {apt.patient?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "PT"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-secondary-900">
                              {apt.patient?.full_name || "Patient"}
                            </p>
                            <p className="mt-0.5 max-w-[200px] truncate text-xs text-secondary-500">
                              {apt.reason}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status + Actions */}
                      <div className="flex flex-wrap items-center gap-2 pl-[4.5rem] sm:pl-0">
                        <StatusBadge status={apt.status} />

                        {/* Action buttons */}
                        {transitions.map((action) => {
                          // "Complete" opens the consultation modal
                          if (action.nextStatus === "COMPLETED") {
                            return (
                              <button
                                key={action.nextStatus}
                                onClick={() =>
                                  setConsultingAppointment(apt)
                                }
                                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                                  action.color === "green"
                                    ? "bg-success-50 text-success-700 hover:bg-success-100 hover:text-success-800"
                                    : "bg-danger-50 text-danger-600 hover:bg-danger-100 hover:text-danger-700"
                                }`}
                              >
                                {action.label}
                              </button>
                            );
                          }

                          return (
                            <button
                              key={action.nextStatus}
                              onClick={() =>
                                handleStatusUpdate(apt.id, action.nextStatus)
                              }
                              disabled={actionLoading === apt.id}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 ${
                                action.color === "green"
                                  ? "bg-success-50 text-success-700 hover:bg-success-100 hover:text-success-800"
                                  : "bg-danger-50 text-danger-600 hover:bg-danger-100 hover:text-danger-700"
                              }`}
                            >
                              {actionLoading === apt.id ? (
                                <span className="flex items-center gap-1">
                                  <svg
                                    className="h-3 w-3 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                  </svg>
                                  Updating...
                                </span>
                              ) : (
                                action.label
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Summary ──────────────────────────────────────────────── */}
        {!isLoading && !error && appointments.length > 0 && (
          <div className="rounded-lg border border-secondary-200 bg-white p-4 text-sm text-secondary-500">
            <p>
              Showing{" "}
              <span className="font-medium text-secondary-700">
                {filteredAppointments.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-secondary-700">
                {appointments.length}
              </span>{" "}
              appointment{appointments.length !== 1 ? "s" : ""} for today
            </p>
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {consultingAppointment && doctorId && (
        <ConsultationModal
          isOpen={!!consultingAppointment}
          onClose={() => setConsultingAppointment(null)}
          onComplete={handleConsultationComplete}
          appointment={consultingAppointment}
          doctorId={doctorId}
        />
      )}
    </div>
  );
}
