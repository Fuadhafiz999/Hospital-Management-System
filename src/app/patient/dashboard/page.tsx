"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type {
  AppointmentRow,
  DoctorRow,
  MedicalRecordRow,
  ProfileRow,
  AppointmentStatus,
} from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────
type AppointmentWithDoctor = AppointmentRow & {
  doctor: DoctorRow & { profiles: ProfileRow };
};
type MedicalRecordFull = MedicalRecordRow & {
  doctor: (DoctorRow & { profiles: ProfileRow }) | null;
  appointment: AppointmentRow;
};

type TabKey = "records" | "prescriptions";

// ─── Helpers ──────────────────────────────────────────────────────
function formatTime(time24: string): string {
  return new Date(`2000-01-01T${time24}:00`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getDoctorName(record: MedicalRecordFull): string {
  if (record.doctor?.profiles?.full_name) {
    return record.doctor.profiles.full_name;
  }
  return "Unknown Doctor";
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

// ─── Component ────────────────────────────────────────────────────
export default function PatientDashboardPage() {
  const router = useRouter();

  // Data
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordFull[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>("records");

  // Expanded records (track which record IDs have their details open)
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());

  const toggleRecord = (id: string) => {
    setExpandedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
          setError("You must be signed in to view your dashboard.");
          return;
        }

        const patientId = meJson.user.id;

        // 2. Fetch appointments
        const aptRes = await fetch(`/api/appointments?patientId=${patientId}`);
        const aptJson = await aptRes.json();
        if (cancelled) return;
        if (!aptRes.ok || aptJson.error) {
          setError(aptJson.error?.message || "Failed to load appointments.");
          return;
        }
        setAppointments(aptJson.data || []);

        // 3. Fetch medical records
        const recRes = await fetch(`/api/medical-records?patientId=${patientId}`);
        const recJson = await recRes.json();
        if (cancelled) return;
        setMedicalRecords(recJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Derived data ──────────────────────────────────────────────
  const upcomingAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments
      .filter(
        (a) =>
          (a.status === "PENDING" || a.status === "CONFIRMED") &&
          a.date >= today
      )
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return a.time_slot.localeCompare(b.time_slot);
      });
  }, [appointments]);

  const pastAppointments = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return appointments
      .filter((a) => a.date < today || a.status === "COMPLETED" || a.status === "CANCELLED")
      .sort((a, b) => b.date.localeCompare(a.date) || b.time_slot.localeCompare(a.time_slot));
  }, [appointments]);

  // ─── Derived medical tabs ──────────────────────────────────────
  const allPrescriptions = useMemo(() => {
    const items: {
      recordId: string;
      date: string;
      doctorName: string;
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      instructions?: string;
    }[] = [];

    for (const record of medicalRecords) {
      const presc = record.prescription;
      if (Array.isArray(presc)) {
        for (const p of presc) {
          items.push({
            recordId: record.id,
            date: record.created_at,
            doctorName: getDoctorName(record),
            medication: String(p.medication || ""),
            dosage: String(p.dosage || ""),
            frequency: String(p.frequency || ""),
            duration: String(p.duration || ""),
            instructions: p.instructions ? String(p.instructions) : undefined,
          });
        }
      }
    }

    // Newest first
    items.sort((a, b) => b.date.localeCompare(a.date));
    return items;
  }, [medicalRecords]);

  // ─── Loading state ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <Header
          title="Dashboard"
          subtitle="Loading your health information..."
          userName="Patient"
          userRole="patient"
          showSearch={false}
        />
        <div className="page-container animate-pulse space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-secondary-200" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-xl bg-secondary-100" />
            <div className="h-80 rounded-xl bg-secondary-100" />
          </div>
        </div>
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────
  if (error) {
    return (
      <div>
        <Header
          title="Dashboard"
          subtitle="Something went wrong"
          userName="Patient"
          userRole="patient"
          showSearch={false}
        />
        <div className="page-container">
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
              Failed to load dashboard
            </h3>
            <p className="mb-6 text-sm text-danger-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  const appointmentCount = upcomingAppointments.length;

  return (
    <div>
      <Header
        title="Patient Dashboard"
        subtitle="Your health at a glance"
        userName="Patient"
        userRole="patient"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* ── Stats Summary ────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Upcoming</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {appointmentCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-50 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Completed</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {appointments.filter((a) => a.status === "COMPLETED").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Records</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {medicalRecords.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Prescriptions</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {allPrescriptions.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Grid ────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* ── Upcoming Appointments ──────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <button
                onClick={() => router.push("/patient/book")}
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Book New
              </button>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 text-4xl">📅</div>
                  <p className="text-sm font-medium text-secondary-900">
                    No upcoming appointments
                  </p>
                  <p className="mt-1 text-xs text-secondary-500">
                    Book a visit with one of our specialists
                  </p>
                  <button
                    onClick={() => router.push("/patient/book")}
                    className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                  >
                    Book Appointment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="group flex items-center justify-between rounded-lg border border-secondary-200 p-3 transition-all duration-150 hover:border-primary-200 hover:bg-primary-50/50 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                          {apt.doctor?.profiles?.full_name
                            ?.split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase() || "DR"}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-secondary-900">
                            {apt.doctor?.profiles?.full_name || "Doctor"}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-secondary-500">
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                              </svg>
                              {formatDate(apt.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                              </svg>
                              {formatTime(apt.time_slot)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={apt.status} />
                        <svg
                          className="h-4 w-4 text-secondary-300 opacity-0 transition-opacity group-hover:opacity-100"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>

            {/* Past Appointments */}
            {pastAppointments.length > 0 && (
              <div className="border-t border-secondary-100 px-6 py-3">
                <details className="group">
                  <summary className="flex cursor-pointer items-center gap-2 text-sm font-medium text-secondary-500 transition-colors hover:text-secondary-700">
                    <svg
                      className="h-3.5 w-3.5 transition-transform group-open:rotate-90"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                    Past Appointments ({pastAppointments.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {pastAppointments.slice(0, 5).map((apt) => (
                      <div
                        key={apt.id}
                        className="flex items-center justify-between rounded-lg bg-secondary-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-secondary-700">
                            {apt.doctor?.profiles?.full_name || "Doctor"}
                          </span>
                          <span className="text-secondary-400">·</span>
                          <span className="text-secondary-500">
                            {formatDateShort(apt.date)}
                          </span>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>
                    ))}
                    {pastAppointments.length > 5 && (
                      <p className="text-center text-xs text-secondary-400">
                        +{pastAppointments.length - 5} more
                      </p>
                    )}
                  </div>
                </details>
              </div>
            )}
          </Card>

          {/* ── Medical Records & Prescriptions Tab ──────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-1 rounded-lg bg-secondary-100 p-1">
                <button
                  onClick={() => setActiveTab("records")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    activeTab === "records"
                      ? "bg-white text-secondary-900 shadow-sm"
                      : "text-secondary-500 hover:text-secondary-700"
                  }`}
                >
                  Medical Records
                </button>
                <button
                  onClick={() => setActiveTab("prescriptions")}
                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                    activeTab === "prescriptions"
                      ? "bg-white text-secondary-900 shadow-sm"
                      : "text-secondary-500 hover:text-secondary-700"
                  }`}
                >
                  Prescriptions
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === "records" && (
                <>
                  {medicalRecords.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-3 text-4xl">📋</div>
                      <p className="text-sm font-medium text-secondary-900">
                        No medical records yet
                      </p>
                      <p className="mt-1 text-xs text-secondary-500">
                        Your diagnoses and visit notes will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {medicalRecords.map((record) => (
                        <div
                          key={record.id}
                          className="rounded-lg border border-secondary-200 p-3 transition-colors hover:border-primary-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-secondary-900">
                                {getDoctorName(record)}
                              </p>
                              <p className="mt-0.5 text-xs text-secondary-500">
                                {formatDateShort(record.created_at)}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleRecord(record.id)}
                              className={`shrink-0 rounded p-1 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600 ${
                                expandedRecords.has(record.id) ? "rotate-180" : ""
                              }`}
                            >
                              <svg
                                className="h-4 w-4 transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                              </svg>
                            </button>
                          </div>

                          {/* Expandable diagnosis */}
                          {expandedRecords.has(record.id) && (
                            <div className="mt-3 space-y-2">
                            <div className="rounded-lg bg-secondary-50 p-3">
                              <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider mb-1">
                                Diagnosis
                              </p>
                              <p className="text-sm text-secondary-900">
                                {record.diagnosis}
                              </p>
                            </div>
                            {record.notes && (
                              <div className="rounded-lg bg-secondary-50 p-3">
                                <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider mb-1">
                                  Notes
                                </p>
                                <p className="text-sm text-secondary-900">
                                  {record.notes}
                                </p>
                              </div>
                            )}
                            {record.vitals_json && Object.keys(record.vitals_json).length > 0 && (
                              <div className="rounded-lg bg-secondary-50 p-3">
                                <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider mb-1">
                                  Vitals
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  {Object.entries(record.vitals_json).map(([key, val]) => (
                                    <div key={key} className="flex items-center gap-1.5">
                                      <span className="text-secondary-500 capitalize">
                                        {key.replace(/_/g, " ")}:
                                      </span>
                                      <span className="font-medium text-secondary-900">
                                        {String(val)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {Array.isArray(record.prescription) && record.prescription.length > 0 && (
                              <div className="rounded-lg bg-primary-50 p-3">
                                <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-2">
                                  Prescriptions ({record.prescription.length})
                                </p>
                                <div className="space-y-1.5 text-sm">
                                  {record.prescription.map((med, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-primary-900">
                                      <span className="h-1.5 w-1.5 rounded-full bg-primary-400 shrink-0" />
                                      <span className="font-medium">{String(med.medication || "")}</span>
                                      <span className="text-primary-600">
                                        {String(med.dosage || "")} — {String(med.frequency || "")}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "prescriptions" && (
                <>
                  {allPrescriptions.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                      <div className="mb-3 text-4xl">💊</div>
                      <p className="text-sm font-medium text-secondary-900">
                        No prescriptions yet
                      </p>
                      <p className="mt-1 text-xs text-secondary-500">
                        Your prescribed medications will appear here
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {allPrescriptions.map((item, idx) => (
                        <div
                          key={`${item.recordId}-${idx}`}
                          className="rounded-lg border border-secondary-200 p-3 transition-colors hover:border-primary-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-secondary-900">
                                {item.medication}
                              </p>
                              <p className="mt-0.5 text-xs text-secondary-500">
                                Prescribed by {item.doctorName}
                              </p>
                            </div>
                            <span className="shrink-0 text-xs text-secondary-400">
                              {formatDateShort(item.date)}
                            </span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center rounded-md bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                              {item.dosage}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">
                              {item.frequency}
                            </span>
                            <span className="inline-flex items-center rounded-md bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">
                              {item.duration}
                            </span>
                          </div>
                          {item.instructions && (
                            <p className="mt-1.5 text-xs text-secondary-500 italic">
                              {item.instructions}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
