"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface Stats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  appointments_today: number;
  upcoming_appointments: number;
  revenue: number;
  pending_revenue: number;
  total_beds: number;
  occupied_beds: number;
  occupancy_rate: number;
  total_departments: number;
  new_patients_today: number;
  recent_activity: {
    id: string;
    patient: string;
    doctor: string;
    date: string;
    time: string;
    status: string;
  }[];
}

const statusStyles: Record<string, string> = {
  PENDING: "badge-warning",
  CONFIRMED: "badge-success",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-secondary-100 text-secondary-600",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) {
          setError(json.error.message);
        } else {
          setStats(json.data);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load dashboard data.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div>
        <Header title="Dashboard" subtitle="Loading..." userName="Admin" userRole="admin" showSearch={false} />
        <div className="page-container animate-pulse space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-secondary-200" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 rounded-xl bg-secondary-100" />
            <div className="h-80 rounded-xl bg-secondary-100" />
          </div>
        </div>
      </div>
    );
  }

  const statCards = stats
    ? [
        {
          label: "Total Patients",
          value: stats.total_patients.toLocaleString(),
          change: `+${stats.new_patients_today} today`,
          icon: "👥",
          bg: "bg-blue-50",
        },
        {
          label: "Total Doctors",
          value: stats.total_doctors.toLocaleString(),
          change: `${stats.total_departments} departments`,
          icon: "👨‍⚕️",
          bg: "bg-emerald-50",
        },
        {
          label: "Appointments Today",
          value: stats.appointments_today.toLocaleString(),
          change: `${stats.upcoming_appointments} upcoming`,
          icon: "📅",
          bg: "bg-purple-50",
        },
        {
          label: "Revenue",
          value: `$${stats.revenue.toLocaleString()}`,
          change: `${stats.pending_revenue.toLocaleString()} pending`,
          icon: "💰",
          bg: "bg-amber-50",
        },
      ]
    : [];

  const quickActions = [
    { label: "New Patient", icon: "➕", desc: "Register a new patient", href: "/admin/patients" },
    { label: "Add Doctor", icon: "👨‍⚕️", desc: "Onboard a new doctor", href: "/admin/doctors" },
    { label: "Create Bill", icon: "💳", desc: "Generate an invoice", href: "/admin/billing" },
    { label: "Schedule", icon: "📅", desc: "Book appointment", href: "/admin/appointments" },
    { label: "Bed Management", icon: "🛏️", desc: "Manage beds & wards", href: "/admin/beds" },
    { label: "Departments", icon: "🏥", desc: "View departments", href: "/admin/departments" },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Welcome back" showSearch={true} />

      <div className="page-container space-y-6">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-secondary-900">{stat.value}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-success-700">
                    {stat.change}
                  </span>
                </div>
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <span className="text-2xl">{stat.icon}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Appointments</CardTitle>
              <button
                onClick={() => router.push("/admin/appointments")}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View all
              </button>
            </CardHeader>
            <CardContent>
              {!stats || stats.recent_activity.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="mb-3 text-4xl">📅</div>
                  <p className="text-sm font-medium text-secondary-900">No appointments yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recent_activity.map((apt) => (
                    <div
                      key={apt.id}
                      className="flex items-center justify-between rounded-lg border border-secondary-200 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                          {initials(apt.patient)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{apt.patient}</p>
                          <p className="text-xs text-secondary-500">
                            {apt.doctor} · {apt.date} at {apt.time}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[apt.status] || "bg-secondary-100 text-secondary-600"}`}>
                        {apt.status.toLowerCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="group flex flex-col items-center justify-center rounded-xl border border-secondary-200 p-4 text-center transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <span className="mb-2 text-2xl">{action.icon}</span>
                    <span className="text-sm font-medium text-secondary-900">{action.label}</span>
                    <span className="mt-0.5 text-[11px] text-secondary-500">{action.desc}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bed occupancy strip */}
        {stats && (
          <Card>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500">Bed Occupancy</p>
                  <p className="mt-1 text-2xl font-bold text-secondary-900">
                    {stats.occupied_beds} / {stats.total_beds} beds occupied
                  </p>
                </div>
                <div className="h-3 w-48 overflow-hidden rounded-full bg-secondary-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-success-500 via-warning-500 to-danger-500"
                    style={{ width: `${stats.occupancy_rate}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-secondary-700">{stats.occupancy_rate}%</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
