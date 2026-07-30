"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const bills = [
  { id: "BILL-001", description: "Consultation - Dr. Emily Carter", date: "2026-10-28", amount: 250, status: "pending" as const },
  { id: "BILL-002", description: "Blood Work - Lab Services", date: "2026-10-25", amount: 180, status: "paid" as const },
  { id: "BILL-003", description: "X-Ray - Radiology", date: "2026-10-20", amount: 320, status: "paid" as const },
  { id: "BILL-004", description: "Prescription - Pharmacy", date: "2026-10-15", amount: 45, status: "paid" as const },
  { id: "BILL-005", description: "Physical Therapy Session", date: "2026-10-10", amount: 150, status: "overdue" as const },
];

const statusStyles: Record<string, string> = {
  paid: "bg-success-50 text-success-700",
  pending: "bg-warning-50 text-warning-700",
  overdue: "bg-danger-50 text-danger-700",
};

export default function PatientBillingPage() {
  const [filter, setFilter] = useState("ALL");

  const filtered = filter === "ALL" ? bills : bills.filter(b => b.status === filter);
  const totalPending = bills.filter(b => b.status === "pending" || b.status === "overdue").reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <Header title="Billing & Payments" subtitle="View and pay your bills" userName="Sarah Johnson" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Total Paid</p>
              <p className="text-2xl font-bold text-success-700">${bills.filter(b => b.status === "paid").reduce((s, b) => s + b.amount, 0)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Due Amount</p>
              <p className="text-2xl font-bold text-warning-700">${totalPending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Transactions</p>
              <p className="text-2xl font-bold text-secondary-900">{bills.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          {["ALL", "paid", "pending", "overdue"].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((bill) => (
            <div key={bill.id} className="flex items-center justify-between rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-medium text-secondary-900">{bill.description}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-secondary-500">
                  <span>{bill.date}</span>
                  <span>{bill.id}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-secondary-900">${bill.amount}</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[bill.status]}`}>{bill.status}</span>
                {bill.status !== "paid" && (
                  <button className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700">Pay Now</button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="mb-4 text-5xl">💳</div>
              <p className="text-sm font-medium text-secondary-900">No bills found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
