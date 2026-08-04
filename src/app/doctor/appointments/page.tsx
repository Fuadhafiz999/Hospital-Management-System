"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import { showSuccess, showError } from "@/lib/toast";

interface Appointment {
  id: string;
  patient: { full_name: string };
  date: string;
  time_slot: string;
  reason: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-700",
  CONFIRMED: "bg-success-50 text-success-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-danger-50 text-danger-700",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (cancelled) return;
        if (!meJson.user) {
          setError("You must be signed in.");
          return;
        }

        const docsRes = await fetch("/api/doctors");
        const docsJson = await docsRes.json();
        if (cancelled) return;
        const myDoctor = (docsJson.data || []).find(
          (d: { profile_id: string }) => d.profile_id === meJson.user.id
        );

        const aptRes = await fetch(
          `/api/appointments?doctorId=${myDoctor?.id || ""}&pageSize=100`
        );
        const aptJson = await aptRes.json();
        if (cancelled) return;
        if (aptJson.error) setError(aptJson.error.message);
        else setAppointments(aptJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load appointments.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
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

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div>
      <Header title="Appointments" subtitle="Manage your patient appointments" userName="Doctor" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
              }`}
            >
              {s === "ALL" ? "All" : statusLabel[s]}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt) => (
              <div key={apt.id} className="flex items-center justify-between rounded-xl border border-secondary-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                <div className="flex items-center gap-4">
                  <div className="w-20 text-center">
                    <p className="text-sm font-semibold text-secondary-900">{apt.date}</p>
                    <p className="text-xs text-primary-600">{apt.time_slot}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                    {apt.patient?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{apt.patient?.full_name}</p>
                    <p className="text-xs text-secondary-500">{apt.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status]}`}>
                    {statusLabel[apt.status]}
                  </span>
                  {apt.status === "CONFIRMED" && (
                    <button
                      onClick={() => updateStatus(apt.id, "COMPLETED")}
                      className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      Complete
                    </button>
                  )}
                  {apt.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => updateStatus(apt.id, "CONFIRMED")}
                        className="rounded-lg bg-success-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(apt.id, "CANCELLED")}
                        className="rounded-lg bg-secondary-200 px-3 py-1.5 text-xs font-semibold text-secondary-700 transition-colors hover:bg-secondary-300"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 text-5xl">📅</div>
                <p className="text-sm font-medium text-secondary-900">No appointments found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
