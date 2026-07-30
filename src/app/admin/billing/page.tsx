"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const invoices = [
  { id: "INV-001", patient: "Sarah Johnson", amount: 250, date: "2026-10-28", status: "paid" as const, method: "Card" },
  { id: "INV-002", patient: "Michael Brown", amount: 180, date: "2026-10-28", status: "pending" as const, method: "—" },
  { id: "INV-003", patient: "Emma Davis", amount: 450, date: "2026-10-27", status: "paid" as const, method: "Insurance" },
  { id: "INV-004", patient: "James Miller", amount: 120, date: "2026-10-27", status: "overdue" as const, method: "—" },
  { id: "INV-005", patient: "Lisa Anderson", amount: 320, date: "2026-10-26", status: "paid" as const, method: "Card" },
  { id: "INV-006", patient: "Robert Taylor", amount: 600, date: "2026-10-26", status: "pending" as const, method: "—" },
  { id: "INV-007", patient: "Jennifer White", amount: 200, date: "2026-10-25", status: "paid" as const, method: "Cash" },
];

const statusStyles: Record<string, string> = {
  paid: "bg-success-50 text-success-700",
  pending: "bg-warning-50 text-warning-700",
  overdue: "bg-danger-50 text-danger-700",
};

export default function AdminBillingPage() {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered = filter === "ALL" ? invoices : invoices.filter(i => i.status === filter);
  const totalRevenue = filtered.reduce((sum, i) => sum + (i.status === "paid" ? i.amount : 0), 0);

  return (
    <div>
      <Header title="Billing & Invoices" subtitle="Manage patient billing and payments" userName="Admin User" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Total Paid</p>
              <p className="text-2xl font-bold text-success-700">${invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Pending</p>
              <p className="text-2xl font-bold text-warning-700">${invoices.filter(i => i.status === "pending").reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Overdue</p>
              <p className="text-2xl font-bold text-danger-700">${invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "paid", "pending", "overdue"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"}`}>
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-100 bg-secondary-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Invoice</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Patient</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-100">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="transition-colors hover:bg-primary-50/30">
                    <td className="px-6 py-4 text-sm font-mono font-medium text-secondary-900">{inv.id}</td>
                    <td className="px-6 py-4 text-sm text-secondary-700">{inv.patient}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-secondary-900">${inv.amount}</td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{inv.date}</td>
                    <td className="px-6 py-4 text-sm text-secondary-600">{inv.method}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>{inv.status}</span>
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
