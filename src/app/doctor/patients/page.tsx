"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";

interface Patient {
  id: string;
  name: string;
  phone: string | null;
  last_visit: string | null;
  diagnosis: string | null;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
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

        const patRes = await fetch(`/api/patients?doctorId=${myDoctor?.id || ""}`);
        const patJson = await patRes.json();
        if (cancelled) return;
        if (patJson.error) setError(patJson.error.message);
        else setPatients(patJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load patients.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = patients.filter(
    (p) =>
      !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header title="My Patients" subtitle="View and manage your patients" userName="Doctor" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients..."
            className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((patient) => (
              <div key={patient.id} className="rounded-xl border border-secondary-200 bg-white p-5 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-base font-bold text-primary-700">
                    {patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-secondary-900">{patient.name}</p>
                    <p className="text-xs text-secondary-500">
                      Last visit: {patient.last_visit || "—"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {patient.diagnosis && (
                    <div className="flex items-center gap-2 text-xs text-secondary-600">
                      <span className="inline-flex items-center rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                        {patient.diagnosis}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-secondary-500">{patient.phone || "No phone"}</p>
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
        )}
      </div>
    </div>
  );
}
