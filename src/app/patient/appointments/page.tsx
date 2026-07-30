"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const appointments = [
  { id: "APT-001", doctor: "Dr. Emily Carter", specialty: "Cardiology", date: "2026-10-28", time: "09:00", reason: "Annual Checkup", status: "confirmed" as const },
  { id: "APT-002", doctor: "Dr. James Wilson", specialty: "General Medicine", date: "2026-11-05", time: "14:00", reason: "Follow-up Consultation", status: "pending" as const },
  { id: "APT-003", doctor: "Dr. Robert Chen", specialty: "Pediatrics", date: "2026-10-15", time: "11:00", reason: "Vaccination", status: "completed" as const },
  { id: "APT-004", doctor: "Dr. Sarah Patel", specialty: "Cardiology", date: "2026-10-08", time: "10:30", reason: "Chest Pain", status: "completed" as const },
  { id: "APT-005", doctor: "Dr. Michael Torres", specialty: "Orthopedics", date: "2026-09-28", time: "15:30", reason: "Knee Pain", status: "cancelled" as const },
];

const statusStyles: Record<string, string> = {
  pending: "bg-warning-50 text-warning-700",
  confirmed: "bg-success-50 text-success-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-secondary-100 text-secondary-600",
};

export default function PatientAppointmentsPage() {
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div>
      <Header title="My Appointments" subtitle="View and manage your appointments" userName="Sarah Johnson" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "pending", "confirmed", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"}`}>
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between rounded-xl border border-secondary-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-lg">👨‍⚕️</div>
                <div>
                  <p className="text-sm font-semibold text-secondary-900">{apt.doctor}</p>
                  <p className="text-xs text-secondary-500">{apt.specialty}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-secondary-400">
                    <span>{apt.date}</span>
                    <span>{apt.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-secondary-500">{apt.reason}</p>
                </div>
              </div>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status]}`}>
                {apt.status}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 text-5xl">📅</div>
              <p className="text-sm font-medium text-secondary-900">No appointments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
