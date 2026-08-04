"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

interface Stats {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  appointments_today: number;
  completed_appointments: number;
  pending_appointments: number;
  cancelled_appointments: number;
  revenue: number;
  pending_revenue: number;
  overdue_revenue: number;
  occupancy_rate: number;
  total_beds: number;
  total_departments: number;
}

export default function AdminReportsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((res) => res.json())
      .then((json) => {
        if (cancelled) return;
        if (json.error) setError(json.error.message);
        else setStats(json.data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load reports.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const reports = stats
    ? [
        { title: "Patient Overview", desc: `${stats.total_patients} total patients registered`, icon: "📈", color: "bg-blue-50 text-blue-600" },
        { title: "Revenue Summary", desc: `$${stats.revenue.toLocaleString()} collected · $${stats.pending_revenue.toLocaleString()} pending`, icon: "💰", color: "bg-emerald-50 text-emerald-600" },
        { title: "Appointment Analytics", desc: `${stats.total_appointments} total · ${stats.completed_appointments} completed · ${stats.cancelled_appointments} cancelled`, icon: "📊", color: "bg-purple-50 text-purple-600" },
        { title: "Bed Occupancy Report", desc: `${stats.occupancy_rate}% occupancy across ${stats.total_beds} beds`, icon: "🛏️", color: "bg-amber-50 text-amber-600" },
        { title: "Doctor Performance", desc: `${stats.total_doctors} doctors across ${stats.total_departments} departments`, icon: "👨‍⚕️", color: "bg-rose-50 text-rose-600" },
        { title: "Department Overview", desc: `${stats.total_departments} active departments`, icon: "🏥", color: "bg-cyan-50 text-cyan-600" },
        { title: "Pending Workload", desc: `${stats.pending_appointments} pending appointments need attention`, icon: "⏳", color: "bg-teal-50 text-teal-600" },
        { title: "Financial Status", desc: `$${stats.overdue_revenue.toLocaleString()} overdue · $${stats.pending_revenue.toLocaleString()} pending`, icon: "📋", color: "bg-slate-50 text-slate-600" },
      ]
    : [];

  return (
    <div>
      <Header title="Reports & Analytics" subtitle="Hospital performance metrics and insights" userName="Admin" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading || !stats ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {reports.map((report) => (
                <div key={report.title} className="group rounded-xl border border-secondary-200 bg-white p-6 text-left shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color}`}>
                    <span className="text-xl">{report.icon}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-semibold text-secondary-900">{report.title}</h3>
                  <p className="mt-1 text-xs text-secondary-500">{report.desc}</p>
                </div>
              ))}
            </div>

            {/* Quick Summary */}
            <div className="grid gap-6 sm:grid-cols-3">
              <Card>
                <CardContent>
                  <p className="text-sm font-medium text-secondary-500">Total Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-secondary-900">${stats.revenue.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-success-600">${stats.pending_revenue.toLocaleString()} pending</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm font-medium text-secondary-500">Appointments</p>
                  <p className="mt-2 text-3xl font-bold text-secondary-900">{stats.total_appointments.toLocaleString()}</p>
                  <p className="mt-1 text-sm text-success-600">{stats.completed_appointments.toLocaleString()} completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <p className="text-sm font-medium text-secondary-500">Bed Occupancy</p>
                  <p className="mt-2 text-3xl font-bold text-secondary-900">{stats.occupancy_rate}%</p>
                  <p className="mt-1 text-sm text-secondary-500">across {stats.total_beds} beds</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
