"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { showSuccess, showError } from "@/lib/toast";

interface Invoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  amount: number;
  status: string;
  method: string | null;
  due_date: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  paid: "bg-success-50 text-success-700",
  pending: "bg-warning-50 text-warning-700",
  overdue: "bg-danger-50 text-danger-700",
};

export default function AdminBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<{ id: string; name: string }[]>([]);

  // ─── Create invoice modal state ─────────────────────────────────
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: "",
    description: "",
    amount: "",
    method: "",
  });
  const [invoiceFormErrors, setInvoiceFormErrors] = useState<{
    patient_id?: string;
    description?: string;
    amount?: string;
  }>({});
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [billRes, patRes] = await Promise.all([
          fetch("/api/billing"),
          fetch("/api/patients"),
        ]);
        const [billJson, patJson] = await Promise.all([
          billRes.json(),
          patRes.json(),
        ]);
        if (cancelled) return;
        if (billJson.error) setError(billJson.error.message);
        else setInvoices(billJson.data || []);
        if (patRes.ok && patJson.data) {
          setPatients(patJson.data.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })));
        }
      } catch {
        if (!cancelled) setError("Failed to load invoices.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Create invoice handlers ───────────────────────────────────
  const openCreateModal = () => {
    setInvoiceForm({ patient_id: "", description: "", amount: "", method: "" });
    setInvoiceFormErrors({});
    setInvoiceError(null);
    setShowCreateModal(true);
  };

  const validateInvoiceForm = (): boolean => {
    const errors: typeof invoiceFormErrors = {};
    if (!invoiceForm.patient_id) errors.patient_id = "Please select a patient";
    if (!invoiceForm.description.trim()) errors.description = "Description is required";
    if (!invoiceForm.amount) {
      errors.amount = "Amount is required";
    } else if (isNaN(parseFloat(invoiceForm.amount)) || parseFloat(invoiceForm.amount) < 0) {
      errors.amount = "Amount must be a valid number";
    }
    setInvoiceFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateInvoice = async () => {
    if (!validateInvoiceForm()) return;

    setIsCreating(true);
    setInvoiceError(null);
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: invoiceForm.patient_id,
          description: invoiceForm.description.trim(),
          amount: parseFloat(invoiceForm.amount),
          method: invoiceForm.method || null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        setInvoiceError(json.error?.message || "Failed to create invoice.");
        return;
      }
      showSuccess("Invoice created", `Invoice ${json.data?.invoice_number || ""} has been generated.`);
      setShowCreateModal(false);

      // Refresh invoices
      const billRes = await fetch("/api/billing");
      const billJson = await billRes.json();
      if (billJson.data) setInvoices(billJson.data);
    } catch {
      setInvoiceError("An unexpected error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const markPaid = async (inv: Invoice, method: string) => {
    try {
      const res = await fetch("/api/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: inv.id, status: "paid", method }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        showError("Update failed", json.error?.message);
        return;
      }
      showSuccess("Invoice marked as paid");
      setInvoices((prev) =>
        prev.map((i) => (i.id === inv.id ? { ...i, status: "paid", method } : i))
      );
    } catch {
      showError("Update failed", "Please try again");
    }
  };

  const filtered = filter === "ALL" ? invoices : invoices.filter((i) => i.status === filter);
  const totalPaid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter((i) => i.status === "pending").reduce((s, i) => s + i.amount, 0);
  const totalOverdue = invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      <Header title="Billing & Invoices" subtitle="Manage patient billing and payments" userName="Admin" userRole="admin" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Total Paid</p>
              <p className="text-2xl font-bold text-success-700">${totalPaid.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Pending</p>
              <p className="text-2xl font-bold text-warning-700">${totalPending.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <p className="text-xs text-secondary-500">Overdue</p>
              <p className="text-2xl font-bold text-danger-700">${totalOverdue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Invoice Action */}
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
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

          <Button
            onClick={openCreateModal}
            leftIcon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            }
          >
            Create Invoice
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary-100" />
            ))}
          </div>
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-100 bg-secondary-50/50">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-secondary-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="transition-colors hover:bg-primary-50/30">
                      <td className="px-6 py-4 text-sm font-mono font-medium text-secondary-900">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-sm text-secondary-700">{inv.patient_name}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-secondary-900">${inv.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{inv.due_date || "—"}</td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{inv.method || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {inv.status !== "paid" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => markPaid(inv, "Card")}
                              className="rounded-md bg-success-500 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-success-700"
                            >
                              Mark Paid
                            </button>
                            <select
                              onChange={(e) => e.target.value && markPaid(inv, e.target.value)}
                              defaultValue=""
                              className="rounded-md border border-secondary-300 px-2 py-1 text-xs text-secondary-700"
                            >
                              <option value="" disabled>Pay via…</option>
                              <option value="Card">Card</option>
                              <option value="Cash">Cash</option>
                              <option value="Insurance">Insurance</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-sm text-secondary-500">
                        No invoices found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════
          Create Invoice Modal
         ══════════════════════════════════════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => !isCreating && setShowCreateModal(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-invoice-title"
            className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-secondary-200 bg-white shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
              <div>
                <h3 id="create-invoice-title" className="text-lg font-semibold text-secondary-900">Create Invoice</h3>
                <p className="mt-0.5 text-sm text-secondary-500">
                  Generate a new bill for a patient
                </p>
              </div>
              <button
                onClick={() => !isCreating && setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="space-y-5 px-6 py-5">
              {invoiceError && (
                <div className="flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                  <svg className="mt-0.5 h-5 w-5 shrink-0 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-sm text-danger-700">{invoiceError}</p>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">Patient</label>
                <select
                  value={invoiceForm.patient_id}
                  onChange={(e) => {
                    setInvoiceForm({ ...invoiceForm, patient_id: e.target.value });
                    setInvoiceFormErrors((prev) => ({ ...prev, patient_id: undefined }));
                  }}
                  className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                    invoiceFormErrors.patient_id
                      ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                      : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                  }`}
                >
                  <option value="">-- Select patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {invoiceFormErrors.patient_id && (
                  <p className="mt-1.5 text-sm text-danger-500">{invoiceFormErrors.patient_id}</p>
                )}
              </div>

              <Input
                label="Description"
                placeholder="e.g. Cardiology consultation"
                value={invoiceForm.description}
                onChange={(e) => {
                  setInvoiceForm({ ...invoiceForm, description: e.target.value });
                  setInvoiceFormErrors((prev) => ({ ...prev, description: undefined }));
                }}
                error={invoiceFormErrors.description}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                }
              />

              <Input
                label="Amount ($)"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={invoiceForm.amount}
                onChange={(e) => {
                  setInvoiceForm({ ...invoiceForm, amount: e.target.value });
                  setInvoiceFormErrors((prev) => ({ ...prev, amount: undefined }));
                }}
                error={invoiceFormErrors.amount}
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                }
              />

              <div>
                <label className="mb-1.5 block text-sm font-medium text-secondary-700">
                  Payment Method <span className="font-normal text-secondary-400">(optional)</span>
                </label>
                <select
                  value={invoiceForm.method}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, method: e.target.value })}
                  className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 shadow-sm transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">-- Method --</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={isCreating}>
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice} isLoading={isCreating}>
                {isCreating ? "Creating..." : "Create Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Escape-to-close for create-invoice modal */}
      {showCreateModal && (
        <EscapeCloseModal
          disabled={isCreating}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}

function EscapeCloseModal({
  disabled,
  onClose,
}: {
  disabled?: boolean;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !disabled) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [disabled, onClose]);
  return null;
}
