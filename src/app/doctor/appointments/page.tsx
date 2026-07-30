"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";

const appointments = [
  { id: "APT-001", patient: "Sarah Johnson", time: "09:00", reason: "Annual Checkup", status: "confirmed" as const },
  { id: "APT-002", patient: "Michael Brown", time: "10:30", reason: "Follow-up - Blood Test", status: "in-progress" as const },
  { id: "APT-003", patient: "Emma Davis", time: "11:00", reason: "Consultation - Headaches", status: "scheduled" as const },
  { id: "APT-004", patient: "James Miller", time: "14:00", reason: "Vaccination", status: "scheduled" as const },
  { id: "APT-005", patient: "Lisa Anderson", time: "15:30", reason: "Prescription Renewal", status: "scheduled" as const },
  { id: "APT-006", patient: "Robert Taylor", time: "16:00", reason: "Lab Results Review", status: "completed" as const },
];

const statusStyles: Record<string, string> = {
  scheduled: "bg-secondary-100 text-secondary-700",
  confirmed: "bg-success-50 text-success-700",
  "in-progress": "bg-warning-50 text-warning-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-danger-50 text-danger-700",
};

export default function DoctorAppointmentsPage() {
  const [filter, setFilter] = useState("ALL");
  const filtered = filter === "ALL" ? appointments : appointments.filter(a => a.status === filter);

  return (
    <div>
      <Header title="Appointments" subtitle="Manage your patient appointments" userName="Dr. Emily Carter" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "scheduled", "confirmed", "in-progress", "completed", "cancelled"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"}`}>
              {s === "ALL" ? "All" : s.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((apt) => (
            <div key={apt.id} className="flex items-center justify-between rounded-xl border border-secondary-200 bg-white p-4 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-16 text-center">
                  <p className="text-sm font-semibold text-secondary-900">{apt.time}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                  {apt.patient.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-secondary-900">{apt.patient}</p>
                  <p className="text-xs text-secondary-500">{apt.reason}</p>
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
