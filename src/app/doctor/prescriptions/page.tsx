"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";

interface Prescription {
  id: string;
  patient: string;
  date: string;
  medication: string;
  dosage: string;
  frequency: string;
  notes?: string;
}

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
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

        const recRes = await fetch(`/api/medical-records?doctorId=${myDoctor?.id || ""}&pageSize=100`);
        const recJson = await recRes.json();
        if (cancelled) return;

        const items: Prescription[] = [];
        for (const record of recJson.data || []) {
          const presc = record.prescription;
          if (Array.isArray(presc)) {
            for (const p of presc) {
              items.push({
                id: `${record.id}-${items.length}`,
                patient: record.patient?.full_name || "Unknown",
                date: record.created_at,
                medication: String(p.medication || ""),
                dosage: String(p.dosage || ""),
                frequency: String(p.frequency || ""),
                notes: p.instructions ? String(p.instructions) : undefined,
              });
            }
          }
        }
        if (!cancelled) setPrescriptions(items);
      } catch {
        if (!cancelled) setError("Failed to load prescriptions.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = prescriptions.filter(
    (p) =>
      !searchQuery.trim() ||
      p.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.medication.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="Prescriptions" subtitle="Patient prescriptions from completed consultations" userName="Doctor" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient or medication..."
            className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-medium text-secondary-400">{p.id}</span>
                  <span className="text-xs text-secondary-500">
                    {new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-secondary-900">{p.medication}</p>
                  <p className="text-xs text-secondary-500">for {p.patient}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.dosage && (
                    <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">{p.dosage}</span>
                  )}
                  {p.frequency && (
                    <span className="inline-flex items-center rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-medium text-secondary-600">{p.frequency}</span>
                  )}
                </div>
                {p.notes && <p className="mt-2 text-xs italic text-secondary-500">{p.notes}</p>}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center py-12 text-center">
                <div className="mb-4 text-5xl">💊</div>
                <p className="text-sm font-medium text-secondary-900">No prescriptions found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
