"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import { showSuccess, showError } from "@/lib/toast";

interface Appointment {
  id: string;
  doctor: {
    profiles: { full_name: string };
    specialization: string;
  } | null;
  date: string;
  time_slot: string;
  reason: string;
  status: string;
}

const statusStyles: Record<string, string> = {
  PENDING: "bg-warning-50 text-warning-700",
  CONFIRMED: "bg-success-50 text-success-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-secondary-100 text-secondary-600",
};

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export default function PatientAppointmentsPage() {
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

        const aptRes = await fetch(`/api/appointments?patientId=${meJson.user.id}&pageSize=100`);
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

  const cancelAppointment = async (id: string) => {
    try {
      const res = await fetch("/api/appointments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        showError("Cancel failed", json.error?.message);
        return;
      }
      showSuccess("Appointment cancelled");
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "CANCELLED" } : a))
      );
    } catch {
      showError("Cancel failed", "Please try again");
    }
  };

  const filtered = filter === "ALL" ? appointments : appointments.filter((a) => a.status === filter);

  return (
    <div>
      <Header title="My Appointments" subtitle="View and manage your appointments" userName="Patient" userRole="patient" showSearch={false} />

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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-lg">👨‍⚕️</div>
                  <div>
                    <p className="text-sm font-semibold text-secondary-900">{apt.doctor?.profiles?.full_name || "Doctor"}</p>
                    <p className="text-xs text-secondary-500">{apt.doctor?.specialization || "—"}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400">
                      <span>{apt.date}</span>
                      <span>{apt.time_slot}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-secondary-500">{apt.reason}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status]}`}>
                    {statusLabel[apt.status]}
                  </span>
                  {(apt.status === "PENDING" || apt.status === "CONFIRMED") && (
                    <button
                      onClick={() => cancelAppointment(apt.id)}
                      className="rounded-lg border border-danger-200 px-3 py-1.5 text-xs font-semibold text-danger-600 transition-colors hover:bg-danger-50"
                    >
                      Cancel
                    </button>
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
