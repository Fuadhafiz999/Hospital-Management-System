"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";

interface MedicalRecord {
  id: string;
  patient: { full_name: string };
  diagnosis: string;
  notes: string | null;
  prescription: unknown;
  created_at: string;
}

export default function DoctorRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
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
        if (recJson.error) setError(recJson.error.message);
        else setRecords(recJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load records.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = records.filter(
    (r) =>
      !searchQuery.trim() ||
      r.patient?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPrescriptions = (record: MedicalRecord): string[] => {
    const presc = record.prescription;
    if (Array.isArray(presc)) {
      return presc.map((p) => {
        const med = String((p as { medication?: string }).medication || "");
        const dosage = String((p as { dosage?: string }).dosage || "");
        return [med, dosage].filter(Boolean).join(" ");
      });
    }
    return [];
  };

  return (
    <div>
      <Header title="Medical Records" subtitle="Patient medical history and diagnoses" userName="Doctor" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by patient name..."
            className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record) => {
              const prescriptions = getPrescriptions(record);
              return (
                <div key={record.id} className="rounded-xl border border-secondary-200 bg-white shadow-sm transition-all hover:border-primary-200">
                  <button
                    onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                        {record.patient?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">{record.patient?.full_name}</p>
                        <p className="text-xs text-secondary-500">
                          {new Date(record.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {record.id}
                        </p>
                      </div>
                    </div>
                    <svg className={`h-5 w-5 text-secondary-400 transition-transform ${expandedId === record.id ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {expandedId === record.id && (
                    <div className="space-y-4 border-t border-secondary-100 px-4 py-4">
                      <div className="rounded-lg bg-secondary-50 p-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-secondary-500">Diagnosis</p>
                        <p className="mt-1 text-sm text-secondary-900">{record.diagnosis}</p>
                      </div>
                      {record.notes && (
                        <div className="rounded-lg bg-secondary-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-secondary-500">Clinical Notes</p>
                          <p className="mt-1 text-sm text-secondary-900">{record.notes}</p>
                        </div>
                      )}
                      {prescriptions.length > 0 && (
                        <div className="rounded-lg bg-primary-50 p-3">
                          <p className="text-xs font-medium uppercase tracking-wider text-primary-600">Prescriptions</p>
                          <ul className="mt-1 space-y-1">
                            {prescriptions.map((med, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm text-primary-900">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-400" />
                                {med}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-4 text-5xl">📋</div>
                <p className="text-sm font-medium text-secondary-900">No records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
