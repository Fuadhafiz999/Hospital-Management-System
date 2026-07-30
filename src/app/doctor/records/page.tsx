"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";

const records = [
  { id: "MR-001", patient: "Sarah Johnson", date: "2026-10-28", diagnosis: "Stage 1 Hypertension", notes: "Patient advised to reduce sodium intake. Follow-up in 3 months.", prescriptions: ["Lisinopril 10mg"] },
  { id: "MR-002", patient: "Michael Brown", date: "2026-10-25", diagnosis: "Type 2 Diabetes - Controlled", notes: "HbA1c improved to 6.8%. Continue current medication.", prescriptions: ["Metformin 500mg", "Glipizide 5mg"] },
  { id: "MR-003", patient: "Emma Davis", date: "2026-10-22", diagnosis: "Chronic Migraine", notes: "Prescribed preventive medication. Patient reported reduced frequency.", prescriptions: ["Sumatriptan 50mg", "Propranolol 40mg"] },
  { id: "MR-004", patient: "James Miller", date: "2026-10-20", diagnosis: "Seasonal Allergic Rhinitis", notes: "Allergy test confirmed pollen allergy. Prescribed antihistamines.", prescriptions: ["Cetirizine 10mg", "Fluticasone Nasal Spray"] },
  { id: "MR-005", patient: "Lisa Anderson", date: "2026-10-18", diagnosis: "Mild Persistent Asthma", notes: "Peak flow improved. Continue maintenance therapy.", prescriptions: ["Albuterol Inhaler", "Fluticasone Inhaler"] },
];

export default function DoctorRecordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = records.filter(r =>
    !searchQuery.trim() || r.patient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="Medical Records" subtitle="Patient medical history and diagnoses" userName="Dr. Emily Carter" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by patient name..." className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
        </div>

        <div className="space-y-3">
          {filtered.map((record) => (
            <div key={record.id} className="rounded-xl border border-secondary-200 bg-white shadow-sm transition-all hover:border-primary-200">
              <button onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                    {record.patient.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{record.patient}</p>
                    <p className="text-xs text-secondary-500">{record.date} · {record.id}</p>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-secondary-400 transition-transform ${expandedId === record.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expandedId === record.id && (
                <div className="border-t border-secondary-100 px-4 py-4 space-y-4">
                  <div className="rounded-lg bg-secondary-50 p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Diagnosis</p>
                    <p className="mt-1 text-sm text-secondary-900">{record.diagnosis}</p>
                  </div>
                  <div className="rounded-lg bg-secondary-50 p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Clinical Notes</p>
                    <p className="mt-1 text-sm text-secondary-900">{record.notes}</p>
                  </div>
                  <div className="rounded-lg bg-primary-50 p-3">
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">Prescriptions</p>
                    <ul className="mt-1 space-y-1">
                      {record.prescriptions.map((med, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-primary-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                          {med}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 text-5xl">📋</div>
              <p className="text-sm font-medium text-secondary-900">No records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
