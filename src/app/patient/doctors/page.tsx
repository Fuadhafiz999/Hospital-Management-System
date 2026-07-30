"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import type { DoctorRow, ProfileRow } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────
export type DoctorWithProfile = DoctorRow & { profiles: ProfileRow };

// ─── Helpers ──────────────────────────────────────────────────────
function formatFee(fee: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(fee);
}

// ─── Component ────────────────────────────────────────────────────
export default function PatientDoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>("all");

  // Fetch doctors on mount
  useEffect(() => {
    let cancelled = false;

    async function fetchDoctors() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch("/api/doctors");
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || json.error) {
          setError(json.error?.message || "Failed to load doctors.");
          return;
        }

        setDoctors(json.data || []);
      } catch {
        if (!cancelled) setError("Failed to load doctors. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  // Derive unique specialties for the filter dropdown
  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set).sort();
  }, [doctors]);

  // Filtered + searched doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      // Specialty filter
      if (specialtyFilter !== "all" && doc.specialization !== specialtyFilter) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const name = doc.profiles.full_name.toLowerCase();
      const spec = doc.specialization.toLowerCase();
      const room = doc.room_number?.toLowerCase() || "";

      return name.includes(q) || spec.includes(q) || room.includes(q);
    });
  }, [doctors, searchQuery, specialtyFilter]);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Find a Doctor"
        subtitle="Browse our medical specialists and book an appointment"
        userName="Sarah Johnson"
        userRole="patient"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* Search & Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, specialization, or room..."
              className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-secondary-400 transition-colors hover:text-secondary-600"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18 18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Specialty Filter */}
          <div className="flex items-center gap-3">
            <label htmlFor="specialty" className="text-sm text-secondary-500">
              Specialty:
            </label>
            <select
              id="specialty"
              value={specialtyFilter}
              onChange={(e) => setSpecialtyFilter(e.target.value)}
              className="rounded-lg border border-secondary-200 bg-white px-3 py-2.5 text-sm text-secondary-700 shadow-sm transition-all duration-200 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="all">All Specialties</option>
              {specialties.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">
            {isLoading
              ? "Loading doctors..."
              : `${filteredDoctors.length} doctor${filteredDoctors.length !== 1 ? "s" : ""} available`}
          </p>
          {!isLoading && filteredDoctors.length === 0 && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSpecialtyFilter("all");
              }}
              className="text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl border border-secondary-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-secondary-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-secondary-200" />
                    <div className="h-3 w-24 rounded bg-secondary-100" />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="h-3 w-full rounded bg-secondary-100" />
                  <div className="h-3 w-3/4 rounded bg-secondary-100" />
                  <div className="h-3 w-1/2 rounded bg-secondary-100" />
                </div>
                <div className="mt-4 h-10 w-full rounded-lg bg-secondary-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50 p-12 text-center">
            <svg
              className="mb-4 h-12 w-12 text-danger-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-danger-700">
              Failed to load doctors
            </h3>
            <p className="mb-6 text-sm text-danger-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-danger-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-danger-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredDoctors.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-300 bg-white p-12 text-center">
            <div className="mb-4 text-5xl">🔍</div>
            <h3 className="mb-2 text-lg font-semibold text-secondary-900">
              No doctors found
            </h3>
            <p className="mb-1 text-sm text-secondary-500">
              {searchQuery || specialtyFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "There are no doctors registered yet."}
            </p>
            {(searchQuery || specialtyFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSpecialtyFilter("all");
                }}
                className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Doctor Grid */}
        {!isLoading && !error && filteredDoctors.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="group relative overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm transition-all duration-200 hover:border-primary-200 hover:shadow-md"
              >
                {/* Top gradient accent */}
                <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-400" />

                {/* Card Body */}
                <div className="p-6">
                  {/* Doctor Info */}
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-50 text-lg font-bold text-primary-700 shadow-sm">
                      {doctor.profiles.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    {/* Name & Specialization */}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-secondary-900">
                        {doctor.profiles.full_name}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
                            />
                          </svg>
                          {doctor.specialization}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-5 space-y-3">
                    {/* Room */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-100 text-secondary-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-secondary-500">Room</p>
                        <p className="font-medium text-secondary-900">
                          {doctor.room_number || "Not assigned"}
                        </p>
                      </div>
                    </div>

                    {/* License */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary-100 text-secondary-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-secondary-500">License</p>
                        <p className="font-mono text-xs font-medium text-secondary-900">
                          {doctor.license_number}
                        </p>
                      </div>
                    </div>

                    {/* Fee */}
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success-50 text-success-600">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="text-secondary-500">Consultation Fee</p>
                        <p className="font-semibold text-secondary-900">
                          {doctor.fee > 0 ? (
                            formatFee(doctor.fee)
                          ) : (
                            <span className="text-success-600">Free</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="my-4 border-t border-secondary-100" />

                  {/* Book Appointment Button */}
                  <button
                    onClick={() => {
                      // Navigate to booking page with doctor pre-selected
                      window.location.href = `/patient/book?doctorId=${doctor.id}`;
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-primary-700 hover:to-primary-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    Book Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
