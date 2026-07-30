"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";

const records = [
  { id: "MR-001", doctor: "Dr. Emily Carter", date: "2026-10-28", diagnosis: "Annual physical. All vitals normal.", notes: "Patient in good health. Recommended continued exercise.", prescriptions: [{ name: "Multivitamin", dosage: "Once daily" }] },
  { id: "MR-002", doctor: "Dr. Michael Torres", date: "2026-09-28", diagnosis: "Blood work results: Normal range", notes: "Complete blood count and metabolic panel within normal limits.", prescriptions: [] },
  { id: "MR-003", doctor: "Dr. Robert Chen", date: "2026-08-12", diagnosis: "Mild allergic reaction to pollen", notes: "Prescribed antihistamines. Patient to follow up if symptoms worsen.", prescriptions: [{ name: "Cetirizine 10mg", dosage: "Once daily" }] },
  { id: "MR-004", doctor: "Dr. Sarah Patel", date: "2026-07-05", diagnosis: "Upper respiratory tract infection", notes: "Prescribed antibiotics. Symptoms resolved after 7 days.", prescriptions: [{ name: "Amoxicillin 500mg", dosage: "3x daily for 10 days" }] },
];

export default function PatientRecordsPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div>
      <Header title="My Medical Records" subtitle="Your health history and diagnoses" userName="Sarah Johnson" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-xl border border-secondary-200 bg-white shadow-sm transition-all hover:border-primary-200">
              <button onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                className="flex w-full items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                    {record.doctor.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">{record.doctor}</p>
                    <p className="text-xs text-secondary-500">{record.date}</p>
                  </div>
                </div>
                <svg className={`h-5 w-5 text-secondary-400 transition-transform ${expandedId === record.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {expandedId === record.id && (
                <div className="border-t border-secondary-100 px-4 py-4 space-y-3">
                  <div className="rounded-lg bg-secondary-50 p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Diagnosis</p>
                    <p className="mt-1 text-sm text-secondary-900">{record.diagnosis}</p>
                  </div>
                  <div className="rounded-lg bg-secondary-50 p-3">
                    <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">Notes</p>
                    <p className="mt-1 text-sm text-secondary-900">{record.notes}</p>
                  </div>
                  {record.prescriptions.length > 0 && (
                    <div className="rounded-lg bg-primary-50 p-3">
                      <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">Prescriptions</p>
                      <ul className="mt-1 space-y-1">
                        {record.prescriptions.map((med, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-primary-900">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                            {med.name} — {med.dosage}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {records.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 text-5xl">📋</div>
              <p className="text-sm font-medium text-secondary-900">No medical records yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
