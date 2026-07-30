"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const reports = [
  { title: "Monthly Patient Admissions", desc: "Patient admission trends for the current month", icon: "📈", color: "bg-blue-50 text-blue-600" },
  { title: "Revenue Summary", desc: "Monthly revenue breakdown by department", icon: "💰", color: "bg-emerald-50 text-emerald-600" },
  { title: "Appointment Analytics", desc: "Appointment volume, no-shows, and completion rates", icon: "📊", color: "bg-purple-50 text-purple-600" },
  { title: "Bed Occupancy Report", desc: "Daily bed occupancy rates across all wards", icon: "🛏️", color: "bg-amber-50 text-amber-600" },
  { title: "Doctor Performance", desc: "Consultation counts, patient ratings, and efficiency", icon: "👨‍⚕️", color: "bg-rose-50 text-rose-600" },
  { title: "Department Overview", desc: "Key metrics for each hospital department", icon: "🏥", color: "bg-cyan-50 text-cyan-600" },
  { title: "Lab & Diagnostics", desc: "Lab test volumes, turnaround times, and results", icon: "🔬", color: "bg-teal-50 text-teal-600" },
  { title: "Financial Audit Log", desc: "All financial transactions with audit trail", icon: "📋", color: "bg-slate-50 text-slate-600" },
];

export default function AdminReportsPage() {
  return (
    <div>
      <Header title="Reports & Analytics" subtitle="Hospital performance metrics and insights" userName="Admin User" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {reports.map((report) => (
            <button key={report.title} className="group rounded-xl border border-secondary-200 bg-white p-6 text-left shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${report.color}`}>
                <span className="text-xl">{report.icon}</span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-secondary-900">{report.title}</h3>
              <p className="mt-1 text-xs text-secondary-500">{report.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary-600 opacity-0 transition-opacity group-hover:opacity-100">
                View Report
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Summary */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-secondary-500">This Month</p>
              <p className="mt-2 text-3xl font-bold text-secondary-900">$284K</p>
              <p className="mt-1 text-sm text-success-600">↑ 18% vs last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-secondary-500">Appointments</p>
              <p className="mt-2 text-3xl font-bold text-secondary-900">1,428</p>
              <p className="mt-1 text-sm text-success-600">↑ 12% vs last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-sm font-medium text-secondary-500">Patient Satisfaction</p>
              <p className="mt-2 text-3xl font-bold text-secondary-900">94.2%</p>
              <p className="mt-1 text-sm text-success-600">↑ 2.1% vs last month</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
