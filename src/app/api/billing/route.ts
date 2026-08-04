// ═══════════════════════════════════════════════════════════════════
//  Billing API Route
//  GET   /api/billing?patientId=x&status=x  → List invoices
//  POST  /api/billing                       → Create an invoice
//  PATCH /api/billing                       → Update status (mark paid)
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validateBody,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-validate";

export const dynamic = "force-dynamic";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where,
      include: { patient: true },
      orderBy: { createdAt: "desc" },
    });

    const result = invoices.map((inv) => ({
      id: inv.id,
      invoice_number: inv.invoiceNumber,
      patient_id: inv.patientId,
      description: inv.description,
      amount: inv.amount,
      status: inv.status,
      method: inv.method,
      due_date: inv.dueDate?.toISOString().split("T")[0] || null,
      paid_at: inv.paidAt?.toISOString() || null,
      created_at: inv.createdAt.toISOString(),
      patient_name: inv.patient.fullName,
    }));

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create invoice) ────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "patient_id", label: "Patient", type: "string", required: true },
      { field: "description", label: "Description", type: "string", required: true, minLength: 2 },
      { field: "amount", label: "Amount", type: "number", required: true, min: 0 },
      { field: "appointment_id", label: "Appointment", type: "string", required: false },
      { field: "status", label: "Status", type: "string", required: false },
      { field: "method", label: "Method", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { patient_id, description, amount, appointment_id, status, method } = validation.data;

    // Generate next invoice number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(3, "0")}`;

    const created = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: patient_id as string,
        description: description as string,
        amount: amount as number,
        appointmentId: (appointment_id as string) || null,
        status: (status as string) || "pending",
        method: (method as string) || null,
        dueDate: new Date(Date.now() + 30 * 86400000),
      },
    });

    return NextResponse.json(
      { data: { id: created.id, invoice_number: created.invoiceNumber }, error: null },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── PATCH (Update status / mark paid) ────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "id", label: "Invoice ID", type: "string", required: true },
      { field: "status", label: "Status", type: "string", required: false, pattern: /^(pending|paid|overdue)$/, message: "Status must be pending, paid, or overdue" },
      { field: "method", label: "Method", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, status, method } = validation.data;

    const existing = await prisma.invoice.findUnique({ where: { id: id as string } });
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { message: "Invoice not found" } },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      data.status = status;
      data.paidAt = status === "paid" ? new Date() : null;
    }
    if (method !== undefined) data.method = method;

    const updated = await prisma.invoice.update({
      where: { id: id as string },
      data,
    });

    return NextResponse.json({
      data: { id: updated.id, status: updated.status, method: updated.method },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
