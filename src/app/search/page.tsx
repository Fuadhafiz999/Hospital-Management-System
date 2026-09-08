"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface SearchResult {
  id: string;
  name?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  created_at?: string;
  appointment_count?: number;
  specialization?: string;
  license_number?: string;
  room_number?: string | null;
  fee?: number;
  patient_name?: string;
  doctor_name?: string;
  date?: string;
  time_slot?: string;
  status?: string;
  reason?: string;
  type: string;
}

function TypeIcon({ type }: { type: string }) {
  if (type === "patient") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
        Pt
      </div>
    );
  }
  if (type === "doctor") {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700">
        Dr
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-sm font-semibold text-amber-700">
      📅
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-warning-50 text-warning-700 border-warning-200",
    CONFIRMED: "bg-success-50 text-success-700 border-success-200",
    COMPLETED: "bg-blue-50 text-blue-700 border-blue-200",
    CANCELLED: "bg-secondary-100 text-secondary-600 border-secondary-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${colors[status] || "bg-secondary-100 text-secondary-600"}`}
    >
      {status.toLowerCase()}
    </span>
  );
}

function ResultItem({ result }: { result: SearchResult }) {
  if (result.type === "appointment") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-secondary-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/30">
        <TypeIcon type={result.type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-900">
            {result.patient_name} → {result.doctor_name}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-secondary-500">
            <span>{result.date} at {result.time_slot}</span>
            <span>{result.reason}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={result.status || "PENDING"} />
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.location.href = `/admin/appointments`;
          }}
        >
          View
        </Button>
      </div>
    );
  }

  if (result.type === "doctor") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-secondary-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/30">
        <TypeIcon type={result.type} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-secondary-900">{result.name}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-secondary-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
              {result.specialization}
            </span>
            <span>License: {result.license_number}</span>
            {result.room_number && <span>Room: {result.room_number}</span>}
          </div>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.location.href = `/admin/doctors`;
          }}
        >
          View
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-lg border border-secondary-200 p-4 transition-all hover:border-primary-300 hover:bg-primary-50/30">
      <TypeIcon type={result.type} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900">{result.name}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-secondary-500">
          <span>{result.email}</span>
          {result.phone && <span>{result.phone}</span>}
        </div>
        {result.appointment_count !== undefined && (
          <p className="mt-1 text-xs text-secondary-400">
            {result.appointment_count} appointment{result.appointment_count !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => {
          window.location.href = `/admin/patients`;
        }}
      >
        View
      </Button>
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<Record<string, unknown[]>>({});
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (q: string) => {
    if (!q.trim()) {
      setResults({});
      setTotal(0);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
        setResults({});
        setTotal(0);
      } else {
        setResults(json.data || {});
        setTotal(json.total || 0);
      }
    } catch {
      setError("Search failed. Please try again.");
      setResults({});
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
    if (query) {
      router.replace(`/search?q=${encodeURIComponent(query)}`, { scroll: false });
    }
  };

  const patients = (results.patients || []) as SearchResult[];
  const doctors = (results.doctors || []) as SearchResult[];
  const appointments = (results.appointments || []) as SearchResult[];

  return (
    <div>
      <Header
        title="Search"
        subtitle="Find patients, doctors, and appointments"
        userName=""
        userRole=""
        showSearch={false}
      />

      <div className="page-container space-y-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, specialty, license..."
              className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults({});
                  setTotal(0);
                  router.replace("/search", { scroll: false });
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-secondary-400 transition-colors hover:text-secondary-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <Button type="submit" isLoading={isLoading}>
            Search
          </Button>
        </form>

        {error && (
          <div className="rounded-lg border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
            {error}
          </div>
        )}

        {!isLoading && query && total === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 text-5xl">🔍</div>
            <p className="text-sm font-medium text-secondary-900">No results found</p>
            <p className="mt-1 text-xs text-secondary-500">
              Try a different search term
            </p>
          </div>
        )}

        {total > 0 && (
          <div className="space-y-6">
            <p className="text-sm text-secondary-500">
              {total} result{total !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>

            {patients.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-secondary-700">
                  Patients ({patients.length})
                </h3>
                <Card>
                  <CardContent className="p-0">
                    {patients.map((p) => (
                      <ResultItem key={p.id} result={p} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {doctors.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-secondary-700">
                  Doctors ({doctors.length})
                </h3>
                <Card>
                  <CardContent className="p-0">
                    {doctors.map((d) => (
                      <ResultItem key={d.id} result={d} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}

            {appointments.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-secondary-700">
                  Appointments ({appointments.length})
                </h3>
                <Card>
                  <CardContent className="p-0">
                    {appointments.map((a) => (
                      <ResultItem key={a.id} result={a} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {!query && (
          <div className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 text-5xl">🔍</div>
            <p className="text-sm font-medium text-secondary-900">Search the system</p>
            <p className="mt-1 text-xs text-secondary-500">
              Find patients, doctors, and appointments by name, email, specialty, or license number
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-4 w-48 animate-pulse rounded-lg bg-secondary-200" />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
