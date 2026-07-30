"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const mockPatients = [
  { id: "P-001", name: "Sarah Johnson", email: "sarah.j@email.com", phone: "+1 (555) 123-4567", dob: "1990-05-15", gender: "Female", bloodType: "A+", lastVisit: "2026-10-15", status: "active" as const },
  { id: "P-002", name: "Michael Brown", email: "michael.b@email.com", phone: "+1 (555) 234-5678", dob: "1985-08-22", gender: "Male", bloodType: "O-", lastVisit: "2026-10-14", status: "active" as const },
  { id: "P-003", name: "Emma Davis", email: "emma.d@email.com", phone: "+1 (555) 345-6789", dob: "1978-12-03", gender: "Female", bloodType: "B+", lastVisit: "2026-10-12", status: "active" as const },
  { id: "P-004", name: "James Miller", email: "james.m@email.com", phone: "+1 (555) 456-7890", dob: "1995-03-18", gender: "Male", bloodType: "AB+", lastVisit: "2026-10-10", status: "inactive" as const },
  { id: "P-005", name: "Lisa Anderson", email: "lisa.a@email.com", phone: "+1 (555) 567-8901", dob: "2000-07-09", gender: "Female", bloodType: "A-", lastVisit: "2026-10-08", status: "active" as const },
];

export default function AdminPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockPatients.filter((p) =>
    !searchQuery.trim() ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <Header
        title="Patient Management"
        subtitle={`${mockPatients.length} registered patients`}
        userName="Admin User"
        userRole="admin"
        showSearch={false}
      />

      <div className="page-container space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Total Patients</p>
                  <p className="text-xl font-bold text-secondary-900">{mockPatients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-success-50 text-success-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">Active</p>
                  <p className="text-xl font-bold text-secondary-900">{mockPatients.filter(p => p.status === "active").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary-100 text-secondary-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-secondary-500">New This Month</p>
                  <p className="text-xl font-bold text-secondary-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients by name, email, or ID..."
            className="w-full rounded-lg border border-secondary-200 bg-white py-2.5 pl-10 pr-3 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Blood Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Last Visit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-secondary-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map((patient) => (
                  <tr key={patient.id} className="group transition-colors hover:bg-primary-50/30">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-sm font-bold text-blue-700">
                          {patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-secondary-900">{patient.name}</p>
                          <p className="text-xs text-secondary-400">{patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-secondary-700">{patient.email}</p>
                      <p className="text-xs text-secondary-400">{patient.phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-danger-50 px-2.5 py-0.5 text-xs font-medium text-danger-700">{patient.bloodType}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{patient.lastVisit}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${patient.status === "active" ? "bg-success-50 text-success-700" : "bg-secondary-100 text-secondary-600"}`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="rounded-lg px-3 py-1.5 text-xs font-medium text-primary-600 opacity-0 transition-all hover:bg-primary-50 group-hover:opacity-100">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
