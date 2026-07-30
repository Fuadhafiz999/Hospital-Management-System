"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const departments = [
  { name: "Cardiology", head: "Dr. Emily Carter", doctors: 8, patients: 1240, beds: 20, icon: "❤️", color: "bg-red-50 text-red-600" },
  { name: "Neurology", head: "Dr. James Wilson", doctors: 6, patients: 890, beds: 15, icon: "🧠", color: "bg-purple-50 text-purple-600" },
  { name: "Pediatrics", head: "Dr. Robert Chen", doctors: 10, patients: 2100, beds: 25, icon: "👶", color: "bg-blue-50 text-blue-600" },
  { name: "Orthopedics", head: "Dr. Michael Torres", doctors: 5, patients: 760, beds: 18, icon: "🦴", color: "bg-amber-50 text-amber-600" },
  { name: "General Surgery", head: "Dr. David Kim", doctors: 7, patients: 950, beds: 22, icon: "🔪", color: "bg-slate-50 text-slate-600" },
  { name: "Cardiology", head: "Dr. Sarah Patel", doctors: 9, patients: 1180, beds: 20, icon: "❤️", color: "bg-red-50 text-red-600" },
  { name: "Dermatology", head: "Dr. Olivia Martinez", doctors: 4, patients: 520, beds: 10, icon: "🔬", color: "bg-green-50 text-green-600" },
  { name: "Pathology", head: "Dr. John Smith", doctors: 3, patients: 0, beds: 0, icon: "🔬", color: "bg-teal-50 text-teal-600" },
  { name: "General Medicine", head: "Dr. Lisa Wang", doctors: 12, patients: 3200, beds: 30, icon: "🏥", color: "bg-indigo-50 text-indigo-600" },
];

export default function AdminDepartmentsPage() {
  return (
    <div>
      <Header title="Departments" subtitle="Hospital department overview" userName="Admin User" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => (
            <div key={dept.name + dept.head} className="group rounded-xl border border-secondary-200 bg-white p-6 shadow-sm transition-all hover:border-primary-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${dept.color}`}>
                  <span className="text-2xl">{dept.icon}</span>
                </div>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-secondary-900">{dept.name}</h3>
              <p className="text-sm text-secondary-500">Head: {dept.head}</p>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-secondary-100 pt-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary-900">{dept.doctors}</p>
                  <p className="text-xs text-secondary-500">Doctors</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary-900">{dept.patients.toLocaleString()}</p>
                  <p className="text-xs text-secondary-500">Patients</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-secondary-900">{dept.beds}</p>
                  <p className="text-xs text-secondary-500">Beds</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
