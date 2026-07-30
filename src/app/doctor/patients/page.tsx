"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";

const myPatients = [
  { id: "P-001", name: "Sarah Johnson", lastVisit: "2026-10-28", diagnosis: "Hypertension", phone: "+1 (555) 123-4567" },
  { id: "P-002", name: "Michael Brown", lastVisit: "2026-10-25", diagnosis: "Type 2 Diabetes", phone: "+1 (555) 234-5678" },
  { id: "P-003", name: "Emma Davis", lastVisit: "2026-10-22", diagnosis: "Migraine", phone: "+1 (555) 345-6789" },
  { id: "P-004", name: "James Miller", lastVisit: "2026-10-20", diagnosis: "Seasonal Allergies", phone: "+1 (555) 456-7890" },
  { id: "P-005", name: "Lisa Anderson", lastVisit: "2026-10-18", diagnosis: "Asthma", phone: "+1 (555) 567-8901" },
  { id: "P-006", name: "Robert Taylor", lastVisit: "2026-10-15", diagnosis: "Arthritis", phone: "+1 (555) 678-9012" },
];

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = myPatients.filter(p =>
    !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="My Patients" subtitle="View and manage your patients" userName="Dr. Emily Carter" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search patients..." className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((patient) => (
            <div key={patient.id} className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-base font-bold text-primary-700">
                  {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-secondary-900">{patient.name}</p>
                  <p className="text-xs text-secondary-500">Last visit: {patient.lastVisit}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-xs text-secondary-600">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{patient.diagnosis}</span>
                </div>
                <p className="text-xs text-secondary-500">{patient.phone}</p>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-700">View Records</button>
                <button className="flex-1 rounded-lg border border-secondary-300 px-3 py-2 text-xs font-semibold text-secondary-700 transition-colors hover:bg-secondary-50">Contact</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center py-12 text-center">
              <div className="mb-4 text-5xl">🔍</div>
              <p className="text-sm font-medium text-secondary-900">No patients found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
