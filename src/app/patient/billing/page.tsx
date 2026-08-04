"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import { showSuccess, showError } from "@/lib/toast";

interface Bill {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  paid: "bg-success-50 text-success-700",
  pending: "bg-warning-50 text-warning-700",
  overdue: "bg-danger-50 text-danger-700",
};

export default function PatientBillingPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (cancelled) return;
        if (!meJson.user) {
          setError("You must be signed in.");
          return;
        }

        const billRes = await fetch(`/api/billing?patientId=${meJson.user.id}`);
        const billJson = await billRes.json();
        if (cancelled) return;
        if (billJson.error) setError(billJson.error.message);
        else setBills(billJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load bills.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const payBill = async (bill: Bill, method: string) => {
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: bill.id, status: "paid", method }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        showError("Payment failed", json.error?.message);
        return;
      }
      showSuccess("Payment successful");
      setBills((prev) =>
        prev.map((b) => (b.id === bill.id ? { ...b, status: "paid" } : b))
      );
    } catch {
      showError("Payment failed", "Please try again");
    }
  };

  const filtered = filter === "ALL" ? bills : bills.filter((b) => b.status === filter);
  const totalPaid = bills.filter((b) => b.status === "paid").reduce((s, b) => s + b.amount, 0);
  const totalDue = bills.filter((b) => b.status === "pending" || b.status === "overdue").reduce((s, b) => s + b.amount, 0);

  return (
    <div>
      <Header title="Billing & Payments" subtitle="View and pay your bills" userName="Patient" userRole="patient" showSearch={false} />

      <div className="page-container space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Total Paid</p>
              <p className="text-2xl font-bold text-success-700">${totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Due Amount</p>
              <p className="text-2xl font-bold text-warning-700">${totalDue.toLocaleString()}</p>
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
          {["ALL", "paid", "pending", "overdue"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                filter === s ? "bg-secondary-800 text-white" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
              }`}
            >
              {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between rounded-xl border border-secondary-200 bg-white p-4 shadow-sm">
                <div>
                  <p className="text-sm font-medium text-secondary-900">{bill.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-secondary-500">
                    <span>{bill.created_at.split("T")[0]}</span>
                    <span>{bill.invoice_number}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-secondary-900">${bill.amount.toLocaleString()}</span>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[bill.status]}`}>
                    {bill.status}
                  </span>
                  {bill.status !== "paid" && (
                    <select
                      onChange={(e) => e.target.value && payBill(bill, e.target.value)}
                      defaultValue=""
                      className="rounded-lg border border-secondary-300 bg-white px-3 py-1.5 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-50"
                    >
                      <option value="" disabled>Pay Now…</option>
                      <option value="Card">💳 Card</option>
                      <option value="Cash">💵 Cash</option>
                      <option value="Insurance">🏥 Insurance</option>
                    </select>
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
        )}
      </div>
    </div>
  );
}
