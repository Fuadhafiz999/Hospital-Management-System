"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const prescriptions = [
  { id: "PR-001", patient: "Sarah Johnson", date: "2026-10-28", medication: "Lisinopril", dosage: "10mg", frequency: "Once daily", notes: "Take in the morning" },
  { id: "PR-002", patient: "Michael Brown", date: "2026-10-25", medication: "Metformin", dosage: "500mg", frequency: "Twice daily", notes: "With meals" },
  { id: "PR-003", patient: "Michael Brown", date: "2026-10-25", medication: "Glipizide", dosage: "5mg", frequency: "Once daily", notes: "Before breakfast" },
  { id: "PR-004", patient: "Emma Davis", date: "2026-10-22", medication: "Sumatriptan", dosage: "50mg", frequency: "As needed", notes: "At onset of migraine" },
  { id: "PR-005", patient: "Emma Davis", date: "2026-10-22", medication: "Propranolol", dosage: "40mg", frequency: "Twice daily", notes: "Preventive" },
  { id: "PR-006", patient: "James Miller", date: "2026-10-20", medication: "Cetirizine", dosage: "10mg", frequency: "Once daily", notes: "For allergies" },
  { id: "PR-007", patient: "Lisa Anderson", date: "2026-10-18", medication: "Albuterol Inhaler", dosage: "90mcg", frequency: "As needed", notes: "2 puffs" },
];

export default function DoctorPrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = prescriptions.filter(p =>
    !searchQuery.trim() || p.patient.toLowerCase().includes(searchQuery.toLowerCase()) || p.medication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="Prescriptions" subtitle="Manage patient prescriptions" userName="Dr. Emily Carter" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by patient or medication..." className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
          </div>
          <button className="ml-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-700">
            + New Prescription
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-4 text-5xl">💊</div>
            <p className="text-sm font-medium text-secondary-900">No prescriptions found</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-secondary-400">{p.id}</span>
                  <span className="text-xs text-secondary-500">{p.date}</span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-secondary-900">{p.medication}</p>
                  <p className="text-xs text-secondary-500">for {p.patient}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{p.dosage}</span>
                  <span className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">{p.frequency}</span>
                </div>
                {p.notes && <p className="mt-2 text-xs text-secondary-500 italic">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
