"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showSuccess, showError } from "@/lib/toast";

type BedStatus = "available" | "occupied" | "maintenance";

const WARD_OPTIONS = [
  "Ward A",
  "Ward B",
  "Intensive Care Unit",
  "Private Rooms",
  "Maternity Ward",
];

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

function getPatientInitials(name?: string): string {
  if (!name) return "—";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

function StatusDot({ status }: { status: BedStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`relative flex h-3 w-3`}>
      <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${cfg.dotColor} opacity-30`} />
      <span className={`relative inline-flex h-3 w-3 rounded-full ${cfg.dotColor} ring-2 ${cfg.dotRing}`} />
    </span>
  );
}

function StatusBadge({ status }: { status: BedStatus }) {
  const cfg = statusConfig[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.bgColor} ${cfg.textColor}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

export default function AdminBedsPage() {
  const [wards, setWards] = useState<Ward[]>([]);
  const [expandedWard, setExpandedWard] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BedStatus | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Add-bed modal state ────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [bedForm, setBedForm] = useState({
    number: "",
    ward: "Ward A",
    status: "available" as BedStatus,
    notes: "",
  });
  const [bedFormError, setBedFormError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const openAddModal = () => {
    setBedForm({ number: "", ward: "Ward A", status: "available", notes: "" });
    setBedFormError(null);
    setShowAddModal(true);
  };

  const handleAddBed = async () => {
    if (!bedForm.number.trim()) {
      setBedFormError("Bed number is required");
      return;
    }
    setIsAdding(true);
    setBedFormError(null);
    try {
      const res = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: bedForm.number.trim(),
          ward: bedForm.ward,
          status: bedForm.status,
          notes: bedForm.notes.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setBedFormError(json.error?.message || "Failed to add bed");
        return;
      }
      showSuccess("Bed added", `Bed ${bedForm.number} added to ${bedForm.ward}`);
      setShowAddModal(false);
      loadBeds();
    } catch {
      setBedFormError("An unexpected error occurred. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const loadBeds = () => {
    let cancelled = false;
    fetch("/api/beds")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error.message);
        else setWards(json.data || []);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load beds.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(loadBeds, []);

  const toggleWard = useCallback((wardId: string) => {
    setExpandedWard((prev) => (prev === wardId ? null : wardId));
  }, []);

  // ─── Update bed status via API ──────────────────────────────────
  const setBedStatus = useCallback(
    async (wardId: string, bedId: string, newStatus: BedStatus) => {
      try {
        const res = await fetch("/api/beds", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: bedId,
            status: newStatus,
            notes: newStatus === "maintenance" ? "Scheduled maintenance" : undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          showError("Update failed", json.error?.message);
          return;
        }
        showSuccess(`Bed marked as ${newStatus}`);

        // Optimistically update local state
        setWards((prev) =>
          prev.map((ward) => {
            if (ward.id !== wardId) return ward;
            return {
              ...ward,
              beds: ward.beds.map((bed) => {
                if (bed.id !== bedId) return bed;
                if (newStatus !== "occupied") {
                  return {
                    ...bed,
                    status: newStatus,
                    patientName: undefined,
                    doctorName: undefined,
                    admittedSince: undefined,
                    notes: newStatus === "maintenance" ? "Scheduled maintenance" : undefined,
                  };
                }
                return { ...bed, status: newStatus, notes: undefined };
              }),
            };
          })
        );
      } catch {
        showError("Update failed", "Please try again");
      }
    },
    []
  );

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

  const filteredWards = useMemo(() => {
    if (statusFilter === "ALL") return wards;
    return wards
      .map((ward) => ({
        ...ward,
        beds: ward.beds.filter((bed) => bed.status === statusFilter),
      }))
      .filter((ward) => ward.beds.length > 0);
  }, [wards, statusFilter]);

  const activeExpandedWard = useMemo(() => {
    if (expandedWard && filteredWards.find((w) => w.id === expandedWard)) {
      return expandedWard;
    }
    return filteredWards[0]?.id ?? null;
  }, [expandedWard, filteredWards]);

  return (
    <div>
      <Header
        title="Bed Management"
        subtitle={`${stats.totalBeds} beds · ${stats.occupied} occupied · ${stats.occupancyRate}% occupancy`}
        userName="Admin"
        userRole="admin"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {/* Add Bed Action */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-secondary-500">
            Manage bed availability across hospital wards
          </p>
          <Button
            onClick={openAddModal}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Add Bed
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
                  <p className="text-xl font-bold text-secondary-900">{stats.totalBeds}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover onClick={() => setStatusFilter(statusFilter === "available" ? "ALL" : "available")} className={statusFilter === "available" ? "ring-2 ring-success-400" : ""}>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-50 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-success-600 font-medium">Available</p>
                  <p className="text-xl font-bold text-secondary-900">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover onClick={() => setStatusFilter(statusFilter === "occupied" ? "ALL" : "occupied")} className={statusFilter === "occupied" ? "ring-2 ring-danger-400" : ""}>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-danger-50 text-danger-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-danger-600 font-medium">Occupied</p>
                  <p className="text-xl font-bold text-secondary-900">{stats.occupied}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card hover onClick={() => setStatusFilter(statusFilter === "maintenance" ? "ALL" : "maintenance")} className={statusFilter === "maintenance" ? "ring-2 ring-warning-400" : ""}>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14.408.033.804.148 1.163.35.448.254.815.631 1.064 1.076 0 0 .248-.015.574-.076.683-.128 1.351-.469 1.757-1.072a3.423 3.423 0 0 0-.195-3.195c-.454-.769-1.227-1.205-2.054-1.323-.391-.056-.786-.022-1.14.098-.49.167-.902.455-1.198.848-.471.622-.679 1.411-.54 2.164.084.456.274.876.53 1.221Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-warning-600 font-medium">Maintenance</p>
                  <p className="text-xl font-bold text-secondary-900">{stats.maintenance}</p>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-xl font-bold text-secondary-900">{stats.occupancyRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend & Filters */}
        <div className="flex flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <span className="text-sm font-medium text-secondary-700">Legend:</span>
            {(["available", "occupied", "maintenance"] as const).map((status) => (
              <div key={status} className="flex items-center gap-2">
                <StatusDot status={status} />
                <span className="text-sm text-secondary-600">{statusConfig[status].label}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs text-secondary-400">Filter:</span>
            {(["ALL", "available", "occupied", "maintenance"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  statusFilter === key ? "bg-secondary-800 text-white shadow-sm" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
                }`}
              >
                {key === "ALL" ? "All Wards" : key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Ward Sections */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredWards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-secondary-300 bg-white p-12 text-center">
                <div className="mb-4 text-5xl">🔍</div>
                <h3 className="mb-2 text-lg font-semibold text-secondary-900">No beds found</h3>
                <p className="mb-1 text-sm text-secondary-500">No beds match the selected filter.</p>
                <button onClick={() => setStatusFilter("ALL")} className="mt-4 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700">
                  Show all wards
                </button>
              </div>
            ) : (
              filteredWards.map((ward) => {
                const availableCount = ward.beds.filter((b) => b.status === "available").length;
                const occupiedCount = ward.beds.filter((b) => b.status === "occupied").length;
                const maintenanceCount = ward.beds.filter((b) => b.status === "maintenance").length;
                const isExpanded = expandedWard === ward.id || (activeExpandedWard === ward.id && filteredWards.length === 1);

                return (
                  <div key={ward.id} className="overflow-hidden rounded-xl border border-secondary-200 bg-white shadow-sm transition-all duration-200">
                    <button onClick={() => toggleWard(ward.id)} className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors duration-150 hover:bg-secondary-50">
                      <div className="flex items-center gap-4">
                        <span className="text-2xl">{ward.icon}</span>
                        <div>
                          <h3 className="text-base font-semibold text-secondary-900">{ward.name}</h3>
                          <p className="text-sm text-secondary-500">{ward.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
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
                          <span className="text-xs text-secondary-400">{ward.beds.length} beds</span>
                        </div>
                        <svg className={`h-5 w-5 text-secondary-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                    </button>

                    <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                      <div className="overflow-hidden">
                        <div className="border-t border-secondary-100 px-6 py-5">
                          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {ward.beds.map((bed) => {
                              const cfg = statusConfig[bed.status];
                              return (
                                <div key={bed.id} className="group relative">
                                  <div className={`relative cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-200 ${cfg.borderColor} ${cfg.hoverBorder} hover:shadow-md`}>
                                    <div className={`h-2 transition-colors duration-300 ${cfg.bgColor}`} />
                                    <div className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold text-secondary-900">{bed.number}</span>
                                        </div>
                                        <StatusDot status={bed.status} />
                                      </div>
                                      <div className="mt-3">
                                        <StatusBadge status={bed.status} />
                                      </div>

                                      {bed.status === "occupied" && bed.patientName && (
                                        <div className="mt-3 space-y-2 border-t border-secondary-100 pt-3">
                                          <div className="flex items-center gap-2.5">
                                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-danger-100 text-[10px] font-bold text-danger-700">
                                              {getPatientInitials(bed.patientName)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-sm font-medium text-secondary-900">{bed.patientName}</p>
                                              {bed.doctorName && <p className="truncate text-xs text-secondary-500">{bed.doctorName}</p>}
                                            </div>
                                          </div>
                                          {bed.admittedSince && (
                                            <p className="flex items-center gap-1 text-[11px] text-secondary-400">
                                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                              </svg>
                                              Admitted {formatTimeAgo(bed.admittedSince)}
                                            </p>
                                          )}
                                        </div>
                                      )}

                                      {bed.status === "maintenance" && bed.notes && (
                                        <div className="mt-3 rounded-lg bg-warning-50 px-2.5 py-1.5">
                                          <p className="text-xs text-warning-700">{bed.notes}</p>
                                        </div>
                                      )}

                                      {bed.status === "available" && (
                                        <div className="mt-3 flex items-center gap-1.5">
                                          <span className="h-1.5 w-1.5 rounded-full bg-success-400" />
                                          <span className="text-xs text-success-600">Ready for admission</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-center bg-secondary-900/80 py-1.5 text-xs font-medium text-white transition-transform duration-200 group-hover:translate-y-0">
                                      <svg className="mr-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                                      </svg>
                                      Click to toggle status
                                    </div>
                                  </div>

                                  <div className="absolute -top-2 right-2 flex gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                    {bed.status !== "occupied" && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBedStatus(ward.id, bed.id, "occupied");
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
                                          setBedStatus(ward.id, bed.id, "available");
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
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Add Bed Modal
         ══════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isAdding && setShowAddModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-bed-title"
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="add-bed-title" className="text-lg font-semibold text-secondary-900">Add New Bed</h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Register a bed in a hospital ward
                </p>
              </div>
              <button
                onClick={() => !isAdding && setShowAddModal(false)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {bedFormError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{bedFormError}</p>
                </div>
              )}

              <Input
                label="Bed Number"
                placeholder="e.g. A-09"
                value={bedForm.number}
                onChange={(e) => setBedForm({ ...bedForm, number: e.target.value })}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75" />
                  </svg>
                }
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Ward</label>
                <select
                  value={bedForm.ward}
                  onChange={(e) => setBedForm({ ...bedForm, ward: e.target.value })}
                  className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  {WARD_OPTIONS.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Initial Status</label>
                <div className="flex gap-2">
                  {(["available", "occupied", "maintenance"] as BedStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBedForm({ ...bedForm, status: s })}
                      className={`rounded-lg px-3 py-2 text-xs font-medium capitalize transition-all duration-150 ${
                        bedForm.status === s
                          ? statusConfig[s].bgColor + " " + statusConfig[s].textColor + " ring-2 " + statusConfig[s].borderColor
                          : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
                      }`}
                    >
                      {statusConfig[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">
                  Notes <span className="font-normal text-secondary-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Near window, heart-monitor equipped"
                  value={bedForm.notes}
                  onChange={(e) => setBedForm({ ...bedForm, notes: e.target.value })}
                  className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={isAdding}>
                Cancel
              </Button>
              <Button onClick={handleAddBed} isLoading={isAdding}>
                {isAdding ? "Adding..." : "Add Bed"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Escape-to-close for add-bed modal */}
      <EscapeCloseModal
        open={showAddModal}
        disabled={isAdding}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  );
}

function EscapeCloseModal({
  open,
  disabled,
  onClose,
}: {
  open: boolean;
  disabled?: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, disabled, onClose]);
  return null;
}
