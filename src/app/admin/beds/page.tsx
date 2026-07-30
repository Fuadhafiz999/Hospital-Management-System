"use client";

import React, { useState, useMemo, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

// ─── Types ────────────────────────────────────────────────────────

type BedStatus = "available" | "occupied" | "maintenance";

interface Bed {
  id: string;
  number: string;
  status: BedStatus;
  patientName?: string;
  doctorName?: string;
  admittedSince?: string;
  notes?: string;
}

interface Ward {
  id: string;
  name: string;
  description: string;
  icon: string;
  beds: Bed[];
}

// ─── Status Config ────────────────────────────────────────────────

const statusConfig = {
  available: {
    label: "Available",
    dotColor: "bg-success-500",
    dotRing: "ring-success-200",
    bgColor: "bg-success-50",
    borderColor: "border-success-300",
    hoverBorder: "hover:border-success-400",
    textColor: "text-success-700",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
  occupied: {
    label: "Occupied",
    dotColor: "bg-danger-500",
    dotRing: "ring-danger-200",
    bgColor: "bg-danger-50",
    borderColor: "border-danger-300",
    hoverBorder: "hover:border-danger-400",
    textColor: "text-danger-700",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
  maintenance: {
    label: "Maintenance",
    dotColor: "bg-warning-500",
    dotRing: "ring-warning-200",
    bgColor: "bg-warning-50",
    borderColor: "border-warning-300",
    hoverBorder: "hover:border-warning-400",
    textColor: "text-warning-700",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14.408.033.804.148 1.163.35.448.254.815.631 1.064 1.076 0 0 .248-.015.574-.076.683-.128 1.351-.469 1.757-1.072a3.423 3.423 0 0 0-.195-3.195c-.454-.769-1.227-1.205-2.054-1.323-.391-.056-.786-.022-1.14.098-.49.167-.902.455-1.198.848-.471.622-.679 1.411-.54 2.164.084.456.274.876.53 1.221Z" />
      </svg>
    ),
  },
} as const;

// ─── Mock Data ────────────────────────────────────────────────────

const initialWards: Ward[] = [
  {
    id: "ward-a",
    name: "Ward A",
    description: "General Medicine",
    icon: "🏥",
    beds: [
      { id: "A-01", number: "A-01", status: "occupied", patientName: "James Miller", doctorName: "Dr. Sarah Patel", admittedSince: "Oct 12, 2026" },
      { id: "A-02", number: "A-02", status: "available" },
      { id: "A-03", number: "A-03", status: "occupied", patientName: "Robert Taylor", doctorName: "Dr. Emily Carter", admittedSince: "Oct 14, 2026" },
      { id: "A-04", number: "A-04", status: "maintenance", notes: "AC repair needed" },
      { id: "A-05", number: "A-05", status: "available" },
      { id: "A-06", number: "A-06", status: "occupied", patientName: "Emma Davis", doctorName: "Dr. James Wilson", admittedSince: "Oct 10, 2026" },
      { id: "A-07", number: "A-07", status: "available" },
      { id: "A-08", number: "A-08", status: "occupied", patientName: "Sophia Lee", doctorName: "Dr. Robert Chen", admittedSince: "Oct 15, 2026" },
    ],
  },
  {
    id: "ward-b",
    name: "Ward B",
    description: "Surgery Recovery",
    icon: "🩺",
    beds: [
      { id: "B-01", number: "B-01", status: "occupied", patientName: "William Garcia", doctorName: "Dr. Michael Torres", admittedSince: "Oct 08, 2026" },
      { id: "B-02", number: "B-02", status: "occupied", patientName: "Amanda Clark", doctorName: "Dr. David Kim", admittedSince: "Oct 09, 2026" },
      { id: "B-03", number: "B-03", status: "available" },
      { id: "B-04", number: "B-04", status: "maintenance", notes: "Bed replacement" },
      { id: "B-05", number: "B-05", status: "occupied", patientName: "Daniel Lee", doctorName: "Dr. Olivia Martinez", admittedSince: "Oct 11, 2026" },
      { id: "B-06", number: "B-06", status: "available" },
    ],
  },
  {
    id: "icu",
    name: "Intensive Care Unit",
    description: "Critical Care",
    icon: "🆘",
    beds: [
      { id: "ICU-01", number: "ICU-01", status: "occupied", patientName: "Jennifer White", doctorName: "Dr. David Kim", admittedSince: "Oct 07, 2026" },
      { id: "ICU-02", number: "ICU-02", status: "occupied", patientName: "Thomas Moore", doctorName: "Dr. Sarah Patel", admittedSince: "Oct 06, 2026" },
      { id: "ICU-03", number: "ICU-03", status: "occupied", patientName: "Lisa Anderson", doctorName: "Dr. Michael Torres", admittedSince: "Oct 13, 2026" },
      { id: "ICU-04", number: "ICU-04", status: "available" },
      { id: "ICU-05", number: "ICU-05", status: "maintenance", notes: "Ventilator calibration" },
      { id: "ICU-06", number: "ICU-06", status: "occupied", patientName: "Michael Brown", doctorName: "Dr. Emily Carter", admittedSince: "Oct 05, 2026" },
    ],
  },
  {
    id: "private",
    name: "Private Rooms",
    description: "VIP & Premium Care",
    icon: "⭐",
    beds: [
      { id: "P-01", number: "P-01", status: "occupied", patientName: "Sarah Johnson", doctorName: "Dr. Emily Carter", admittedSince: "Oct 01, 2026" },
      { id: "P-02", number: "P-02", status: "available" },
      { id: "P-03", number: "P-03", status: "available" },
      { id: "P-04", number: "P-04", status: "occupied", patientName: "John Smith", doctorName: "Dr. Robert Chen", admittedSince: "Oct 12, 2026" },
    ],
  },
  {
    id: "maternity",
    name: "Maternity Ward",
    description: "Obstetrics & Pediatrics",
    icon: "👶",
    beds: [
      { id: "M-01", number: "M-01", status: "occupied", patientName: "Rachel Green", doctorName: "Dr. Sarah Patel", admittedSince: "Oct 15, 2026" },
      { id: "M-02", number: "M-02", status: "occupied", patientName: "Monica Geller", doctorName: "Dr. Olivia Martinez", admittedSince: "Oct 14, 2026" },
      { id: "M-03", number: "M-03", status: "available" },
      { id: "M-04", number: "M-04", status: "available" },
      { id: "M-05", number: "M-05", status: "maintenance", notes: "Painting in progress" },
      { id: "M-06", number: "M-06", status: "available" },
    ],
  },
];

// ─── Status cycle ─────────────────────────────────────────────────

const statusCycle: BedStatus[] = ["available", "occupied", "maintenance"];

// ─── Helpers ──────────────────────────────────────────────────────

function getPatientInitials(name?: string): string {
  if (!name) return "—";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr + (dateStr.includes(",") ? "" : "T12:00:00"));
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// ─── Sub-Components ───────────────────────────────────────────────

function StatusDot({ status }: { status: BedStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`relative flex h-3 w-3`}>
      <span
        className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dotColor} opacity-30`}
      />
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${cfg.dotColor} ring-2 ${cfg.dotRing}`}
      />
    </span>
  );
}

function StatusBadge({ status }: { status: BedStatus }) {
  const cfg = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────

export default function AdminBedsPage() {
  const [wards, setWards] = useState<Ward[]>(initialWards);
  const [expandedWard, setExpandedWard] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BedStatus | "ALL">("ALL");

  // ─── Toggle ward expansion ──────────────────────────────────────
  const toggleWard = useCallback((wardId: string) => {
    setExpandedWard((prev) => (prev === wardId ? null : wardId));
  }, []);

  // ─── Toggle bed status ──────────────────────────────────────────
  const cycleBedStatus = useCallback((wardId: string, bedId: string) => {
    setWards((prev) =>
      prev.map((ward) => {
        if (ward.id !== wardId) return ward;
        return {
          ...ward,
          beds: ward.beds.map((bed) => {
            if (bed.id !== bedId) return bed;
            const currentIdx = statusCycle.indexOf(bed.status);
            const nextStatus = statusCycle[(currentIdx + 1) % statusCycle.length];
            // When toggling away from occupied, clear patient info
            if (nextStatus !== "occupied") {
              return { ...bed, status: nextStatus, patientName: undefined, doctorName: undefined, admittedSince: undefined, notes: nextStatus === "maintenance" ? bed.notes || "Scheduled maintenance" : undefined };
            }
            // When toggling to occupied from another state, keep notes but mark as occupied
            return { ...bed, status: nextStatus, notes: undefined };
          }),
        };
      })
    );
  }, []);

  // ─── Set specific status for a bed ──────────────────────────────
  const setBedStatus = useCallback(
    (wardId: string, bedId: string, newStatus: BedStatus) => {
      setWards((prev) =>
        prev.map((ward) => {
          if (ward.id !== wardId) return ward;
          return {
            ...ward,
            beds: ward.beds.map((bed) => {
              if (bed.id !== bedId) return bed;
              if (newStatus !== "occupied") {
                return { ...bed, status: newStatus, patientName: undefined, doctorName: undefined, admittedSince: undefined, notes: newStatus === "maintenance" ? "Scheduled maintenance" : undefined };
              }
              return { ...bed, status: newStatus, notes: undefined };
            }),
          };
        })
      );
    },
    []
  );

  // ─── Derived stats ──────────────────────────────────────────────
  const stats = useMemo(() => {
    let totalBeds = 0;
    let available = 0;
    let occupied = 0;
    let maintenance = 0;

    for (const ward of wards) {
      for (const bed of ward.beds) {
        totalBeds++;
        if (bed.status === "available") available++;
        else if (bed.status === "occupied") occupied++;
        else if (bed.status === "maintenance") maintenance++;
      }
    }

    const occupancyRate = totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0;

    return { totalBeds, available, occupied, maintenance, occupancyRate };
  }, [wards]);

  // ─── Filtered wards based on status filter ──────────────────────
  const filteredWards = useMemo(() => {
    if (statusFilter === "ALL") return wards;
    return wards
      .map((ward) => ({
        ...ward,
        beds: ward.beds.filter((bed) => bed.status === statusFilter),
      }))
      .filter((ward) => ward.beds.length > 0);
  }, [wards, statusFilter]);

  // ─── Determine which ward is expanded ───────────────────────────
  const activeExpandedWard = useMemo(() => {
    if (expandedWard && filteredWards.find((w) => w.id === expandedWard)) {
      return expandedWard;
    }
    return filteredWards[0]?.id ?? null;
  }, [expandedWard, filteredWards]);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Bed Management"
        subtitle={`${stats.totalBeds} beds · ${stats.occupied} occupied · ${stats.occupancyRate}% occupancy`}
        userName="Admin User"
        userRole="admin"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* ── Stats Cards ────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Beds */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Total Beds</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stats.totalBeds}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Available */}
          <Card
            hover
            onClick={() => setStatusFilter(statusFilter === "available" ? "ALL" : "available")}
            className={statusFilter === "available" ? "ring-2 ring-success-400" : ""}
          >
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-50 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-success-600 font-medium">Available</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stats.available}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupied */}
          <Card
            hover
            onClick={() => setStatusFilter(statusFilter === "occupied" ? "ALL" : "occupied")}
            className={statusFilter === "occupied" ? "ring-2 ring-danger-400" : ""}
          >
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-danger-600 font-medium">Occupied</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stats.occupied}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card
            hover
            onClick={() => setStatusFilter(statusFilter === "maintenance" ? "ALL" : "maintenance")}
            className={statusFilter === "maintenance" ? "ring-2 ring-warning-400" : ""}
          >
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14.408.033.804.148 1.163.35.448.254.815.631 1.064 1.076 0 0 .248-.015.574-.076.683-.128 1.351-.469 1.757-1.072a3.423 3.423 0 0 0-.195-3.195c-.454-.769-1.227-1.205-2.054-1.323-.391-.056-.786-.022-1.14.098-.49.167-.902.455-1.198.848-.471.622-.679 1.411-.54 2.164.084.456.274.876.53 1.221Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-warning-600 font-medium">
                    Maintenance
                  </p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stats.maintenance}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Occupancy Rate */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Occupancy</p>
                  <p className="text-xl font-bold text-secondary-900">
                    {stats.occupancyRate}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Legend & Occupancy Bar ─────────────────────────────── */}
        <div className="flex flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Legend */}
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-secondary-700">
              Legend:
            </span>
            {(
              [
                { status: "available" as BedStatus, label: "Available" },
                { status: "occupied" as BedStatus, label: "Occupied" },
                { status: "maintenance" as BedStatus, label: "Maintenance" },
              ] as const
            ).map(({ status, label }) => (
              <div key={status} className="flex items-center gap-2">
                <StatusDot status={status} />
                <span className="text-sm text-secondary-600">{label}</span>
              </div>
            ))}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs text-secondary-400">Filter:</span>
            {(
              [
                { key: "ALL" as const, label: "All Wards" },
                { key: "available" as BedStatus, label: "Available" },
                { key: "occupied" as BedStatus, label: "Occupied" },
                { key: "maintenance" as BedStatus, label: "Maintenance" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  statusFilter === key
                    ? "bg-secondary-800 text-white shadow-sm"
                    : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Occupancy bar (desktop) */}
          <div className="hidden items-center gap-3 lg:flex">
            <span className="text-xs text-secondary-400">Occupancy</span>
            <div className="h-2.5 w-32 overflow-hidden rounded-full bg-secondary-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-success-500 via-warning-500 to-danger-500 transition-all duration-500"
                style={{ width: `${stats.occupancyRate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-secondary-600">
              {stats.occupancyRate}%
            </span>
          </div>
        </div>

        {/* ── Ward Sections ──────────────────────────────────────── */}
        <div className="space-y-4">
          {filteredWards.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-300 bg-white p-12 text-center">
              <div className="mb-4 text-5xl">🔍</div>
              <h3 className="mb-2 text-lg font-semibold text-secondary-900">
                No beds found
              </h3>
              <p className="mb-1 text-sm text-secondary-500">
                No beds match the selected filter.
              </p>
              <button
                onClick={() => setStatusFilter("ALL")}
                className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700"
              >
                Show all wards
              </button>
            </div>
          ) : (
            filteredWards.map((ward) => {
              const availableCount = ward.beds.filter(
                (b) => b.status === "available"
              ).length;
              const occupiedCount = ward.beds.filter(
                (b) => b.status === "occupied"
              ).length;
              const maintenanceCount = ward.beds.filter(
                (b) => b.status === "maintenance"
              ).length;
              const isExpanded =
                expandedWard === ward.id ||
                (activeExpandedWard === ward.id && filteredWards.length === 1);

              return (
                <div
                  key={ward.id}
                  className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm transition-all duration-200"
                >
                  {/* Ward Header (clickable to expand/collapse) */}
                  <button
                    onClick={() => toggleWard(ward.id)}
                    className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-150 hover:bg-secondary-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">{ward.icon}</span>
                      <div>
                        <h3 className="text-base font-semibold text-secondary-900">
                          {ward.name}
                        </h3>
                        <p className="text-sm text-secondary-500">
                          {ward.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Mini stat chips */}
                      <div className="hidden items-center gap-2 sm:flex">
                        {availableCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
                            {availableCount} free
                          </span>
                        )}
                        {occupiedCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-danger-50 px-2 py-0.5 text-xs font-medium text-danger-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-danger-500" />
                            {occupiedCount} occ
                          </span>
                        )}
                        {maintenanceCount > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
                            {maintenanceCount} maint
                          </span>
                        )}
                        <span className="text-xs text-secondary-400">
                          {ward.beds.length} beds
                        </span>
                      </div>

                      {/* Expand/collapse chevron */}
                      <svg
                        className={`h-5 w-5 text-secondary-400 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m19.5 8.25-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </div>
                  </button>

                  {/* Ward Bed Grid (collapsible) */}
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isExpanded
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-secondary-100 px-6 py-5">
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                          {ward.beds.map((bed) => {
                            const cfg = statusConfig[bed.status];
                            return (
                              <div
                                key={bed.id}
                                className="group relative"
                              >
                                {/* Bed Card */}
                                <div
                                  className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${cfg.borderColor} ${cfg.hoverBorder} hover:shadow-md`}
                                  onClick={() =>
                                    cycleBedStatus(ward.id, bed.id)
                                  }
                                >
                                  {/* Top color bar */}
                                  <div
                                    className={`h-2 transition-colors duration-300 ${cfg.bgColor}`}
                                  />

                                  <div className="p-4">
                                    {/* Bed number & status */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-secondary-900">
                                          {bed.number}
                                        </span>
                                      </div>
                                      <StatusDot status={bed.status} />
                                    </div>

                                    {/* Status badge */}
                                    <div className="mt-3">
                                      <StatusBadge status={bed.status} />
                                    </div>

                                    {/* Patient info (if occupied) */}
                                    {bed.status === "occupied" &&
                                      bed.patientName && (
                                        <div className="mt-3 space-y-2 border-t border-secondary-100 pt-3">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-100 text-[10px] font-bold text-danger-700">
                                              {getPatientInitials(
                                                bed.patientName
                                              )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm font-medium text-secondary-900">
                                                {bed.patientName}
                                              </p>
                                              {bed.doctorName && (
                                                <p className="truncate text-xs text-secondary-500">
                                                  {bed.doctorName}
                                                </p>
                                              )}
                                            </div>
                                          </div>
                                          {bed.admittedSince && (
                                            <p className="flex items-center gap-1 text-[11px] text-secondary-400">
                                              <svg
                                                className="h-3 w-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                                                />
                                              </svg>
                                              Admitted{" "}
                                              {formatTimeAgo(
                                                bed.admittedSince
                                              )}
                                            </p>
                                          )}
                                        </div>
                                      )}

                                    {/* Maintenance notes */}
                                    {bed.status === "maintenance" &&
                                      bed.notes && (
                                        <div className="mt-3 rounded-lg bg-warning-50 px-2.5 py-1.5">
                                          <p className="text-xs text-warning-700">
                                            {bed.notes}
                                          </p>
                                        </div>
                                      )}

                                    {/* Available indicator */}
                                    {bed.status === "available" && (
                                      <div className="mt-3 flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                                        <span className="text-xs text-success-600">
                                          Ready for admission
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Click hint overlay */}
                                  <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-secondary-900/80 py-1.5 text-xs font-medium text-white transition-transform duration-200 group-hover:translate-y-0">
                                    <svg
                                      className="mr-1 h-3.5 w-3.5"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      strokeWidth={2}
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
                                      />
                                    </svg>
                                    Click to toggle status
                                  </div>
                                </div>

                                {/* Quick action buttons (visible on hover) */}
                                <div className="absolute -top-2 right-2 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                  {bed.status !== "occupied" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBedStatus(
                                          ward.id,
                                          bed.id,
                                          "occupied"
                                        );
                                      }}
                                      className="rounded-md bg-danger-500 px-1.5 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-danger-700"
                                      title="Mark as Occupied"
                                    >
                                      Occupy
                                    </button>
                                  )}
                                  {bed.status !== "available" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setBedStatus(
                                          ward.id,
                                          bed.id,
                                          "available"
                                        );
                                      }}
                                      className="rounded-md bg-success-500 px-1.5 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-success-700"
                                      title="Mark as Available"
                                    >
                                      Vacate
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>


      </div>
    </div>
  );
}
