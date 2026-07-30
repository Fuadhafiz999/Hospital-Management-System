"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Card, { CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

const stats = [
  {
    label: "Total Patients",
    value: "2,847",
    change: "+12%",
    changeType: "positive" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    label: "Total Doctors",
    value: "84",
    change: "+3",
    changeType: "positive" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    label: "Appointments Today",
    value: "64",
    change: "+8",
    changeType: "positive" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
  {
    label: "Revenue (Monthly)",
    value: "$284K",
    change: "+18%",
    changeType: "positive" as const,
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
];

const recentAppointments = [
  { patient: "Sarah Johnson", doctor: "Dr. Emily Carter", time: "09:00 AM", status: "confirmed" as const },
  { patient: "Michael Brown", doctor: "Dr. James Wilson", time: "10:30 AM", status: "in-progress" as const },
  { patient: "Emma Davis", doctor: "Dr. Robert Chen", time: "11:00 AM", status: "scheduled" as const },
  { patient: "James Miller", doctor: "Dr. Sarah Patel", time: "02:00 PM", status: "scheduled" as const },
  { patient: "Lisa Anderson", doctor: "Dr. Michael Torres", time: "03:30 PM", status: "scheduled" as const },
];

const statusStyles = {
  "confirmed": "badge-success",
  "in-progress": "badge-warning",
  "scheduled": "badge bg-secondary-100 text-secondary-700",
};

export default function AdminDashboard() {
  const router = useRouter();

  const quickActions = [
    { label: "New Patient", icon: "➕", desc: "Register a new patient", href: "/admin/patients" },
    { label: "Add Doctor", icon: "👨‍⚕️", desc: "Onboard a new doctor", href: "/admin/doctors" },
    { label: "Create Bill", icon: "💳", desc: "Generate an invoice", href: "/admin/billing" },
    { label: "Schedule", icon: "📅", desc: "Book appointment", href: "/admin/appointments" },
    { label: "Reports", icon: "📊", desc: "View analytics", href: "/admin/reports" },
    { label: "Settings", icon: "⚙️", desc: "System configuration", href: "/admin/settings" },
  ];

  return (
    <div>
      <Header title="Dashboard" subtitle="Welcome back, Admin" userName="Admin User" userRole="admin" />

      <div className="page-container space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-secondary-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-secondary-900">
                    {stat.value}
                  </p>
                  <span
                    className={`mt-1 inline-flex items-center gap-1 text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-success-700"
                        : "text-danger-700"
                    }`}
                  >
                    {stat.change}
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                  </span>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor} ${stat.color}`}>
                  {stat.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity & Appointments */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Appointments</CardTitle>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
                View all
              </button>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-secondary-100">
                {recentAppointments.map((apt) => (
                  <div
                    key={apt.patient}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                        {apt.patient.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-secondary-900">
                          {apt.patient}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {apt.doctor} · {apt.time}
                        </p>
                      </div>
                    </div>
                    <span className={statusStyles[apt.status]}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="flex flex-col items-center rounded-lg border border-secondary-200 p-4 text-center transition-all duration-150 hover:border-primary-300 hover:bg-primary-50"
                  >
                    <span className="text-2xl">{action.icon}</span>
                    <span className="mt-1.5 text-sm font-medium text-secondary-900">
                      {action.label}
                    </span>
                    <span className="mt-0.5 text-xs text-secondary-500">
                      {action.desc}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
