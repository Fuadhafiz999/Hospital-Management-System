"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const mockAppointments = [
  { id: "APT-001", patient: "Sarah Johnson", doctor: "Dr. Emily Carter", date: "2026-10-28", time: "09:00", type: "Follow-up", status: "confirmed" as const },
  { id: "APT-002", patient: "Michael Brown", doctor: "Dr. James Wilson", date: "2026-10-28", time: "10:30", type: "Consultation", status: "pending" as const },
  { id: "APT-003", patient: "Emma Davis", doctor: "Dr. Robert Chen", date: "2026-10-28", time: "11:00", type: "Checkup", status: "completed" as const },
  { id: "APT-004", patient: "James Miller", doctor: "Dr. Sarah Patel", date: "2026-10-29", time: "14:00", type: "Vaccination", status: "confirmed" as const },
  { id: "APT-005", patient: "Lisa Anderson", doctor: "Dr. Michael Torres", date: "2026-10-29", time: "15:30", type: "Surgery Prep", status: "cancelled" as const },
];

const statusStyles = {
  pending: "bg-warning-50 text-warning-700",
  confirmed: "bg-success-50 text-success-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-secondary-100 text-secondary-600",
};

export default function AdminAppointmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filtered = statusFilter === "ALL"
    ? mockAppointments
    : mockAppointments.filter(a => a.status === statusFilter);

  return (
    <div>
      <Header title="Appointments" subtitle="Manage all hospital appointments" userName="Admin User" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "pending", "confirmed", "completed", "cancelled"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map((apt) => (
                  <tr key={apt.id} className="group transition-colors hover:bg-primary-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                          {apt.patient.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-secondary-900">{apt.patient}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{apt.doctor}</td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{apt.date}</td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{apt.time}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-600">{apt.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status]}`}>
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
