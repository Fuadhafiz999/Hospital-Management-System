// ═══════════════════════════════════════════════════════════════════
//  Beds API Route
//  GET   /api/beds?ward=x&status=x  → List all beds (grouped by ward)
//  POST  /api/beds                  → Create a bed
//  PATCH /api/beds                  → Update bed status / assignment
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validateBody,
  validationErrorResponse,
  serverErrorResponse,
} from "@/lib/api-validate";

export const dynamic = "force-dynamic";

const WARD_ICONS: Record<string, string> = {
  "Ward A": "🏥",
  "Ward B": "🩺",
  "Intensive Care Unit": "🆘",
  ICU: "🆘",
  "Private Rooms": "⭐",
  "Maternity Ward": "👶",
};

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ward = searchParams.get("ward");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (ward) where.ward = ward;
    if (status) where.status = status;

    const beds = await prisma.bed.findMany({
      where,
      include: {
        patient: true,
        doctor: { include: { user: true } },
        department: true,
      },
      orderBy: [{ ward: "asc" }, { number: "asc" }],
    });

    // Group by ward
    const wardMap = new Map<
      string,
      { id: string; name: string; description: string; icon: string; beds: unknown[] }
    >();

    for (const bed of beds) {
      if (!wardMap.has(bed.ward)) {
        wardMap.set(bed.ward, {
          id: `ward-${bed.ward.toLowerCase().replace(/\s+/g, "-")}`,
          name: bed.ward,
          description: bed.department?.description || "",
          icon: WARD_ICONS[bed.ward] || "🏥",
          beds: [],
        });
      }

      const patientName = bed.patient?.fullName;
      const doctorName = bed.doctor?.user?.fullName;

      wardMap.get(bed.ward)!.beds.push({
        id: bed.id,
        number: bed.number,
        status: bed.status,
        ward: bed.ward,
        patientName: patientName || undefined,
        doctorName: doctorName || undefined,
        admittedSince: bed.admittedSince?.toISOString() || undefined,
        notes: bed.notes || undefined,
        patient_id: bed.patientId || undefined,
        doctor_id: bed.doctorId || undefined,
      });
    }

    const wards = Array.from(wardMap.values());
    const allBeds = beds.map((b) => ({
      id: b.id,
      number: b.number,
      ward: b.ward,
      status: b.status,
      patientName: b.patient?.fullName || null,
      doctorName: b.doctor?.user?.fullName || null,
      admittedSince: b.admittedSince?.toISOString() || null,
      notes: b.notes || null,
    }));

    return NextResponse.json({ data: wards, beds: allBeds, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create bed) ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "number", label: "Bed Number", type: "string", required: true, minLength: 1 },
      { field: "ward", label: "Ward", type: "string", required: true, minLength: 2 },
      { field: "status", label: "Status", type: "string", required: false },
      { field: "notes", label: "Notes", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { number, ward, status, notes } = validation.data;

    const existing = await prisma.bed.findUnique({ where: { number: number as string } });
    if (existing) {
      return NextResponse.json(
        { data: null, error: { message: "A bed with this number already exists" } },
        { status: 409 }
      );
    }

    const created = await prisma.bed.create({
      data: {
        number: number as string,
        ward: ward as string,
        status: (status as string) || "available",
        notes: (notes as string) || null,
      },
    });

    return NextResponse.json(
      { data: { id: created.id, number: created.number }, error: null },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── PATCH (Update status / assignment) ───────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "id", label: "Bed ID", type: "string", required: true },
      { field: "status", label: "Status", type: "string", required: false, pattern: /^(available|occupied|maintenance)$/, message: "Status must be available, occupied, or maintenance" },
      { field: "notes", label: "Notes", type: "string", required: false },
      { field: "patient_id", label: "Patient", type: "string", required: false },
      { field: "doctor_id", label: "Doctor", type: "string", required: false },
      { field: "ward", label: "Ward", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, status, notes, patient_id, doctor_id, ward } = validation.data;

    const existing = await prisma.bed.findUnique({ where: { id: id as string } });
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { message: "Bed not found" } },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) {
      data.status = status;
      // When leaving occupied, clear assignment
      if (status !== "occupied") {
        data.patientId = null;
        data.doctorId = null;
        data.admittedSince = null;
      }
    }
    if (notes !== undefined) data.notes = notes;
    if (patient_id !== undefined) data.patientId = patient_id;
    if (doctor_id !== undefined) data.doctorId = doctor_id;
    if (ward !== undefined) data.ward = ward;

    // If marking occupied and no admittedSince yet
    if ((status === "occupied" || patient_id !== undefined) && !existing.admittedSince && data.patientId !== null) {
      data.admittedSince = new Date();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: "No fields to update" } },
        { status: 400 }
      );
    }

    const updated = await prisma.bed.update({
      where: { id: id as string },
      data,
      include: { patient: true, doctor: { include: { user: true } } },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        number: updated.number,
        status: updated.status,
        notes: updated.notes,
        patientName: updated.patient?.fullName || null,
        doctorName: updated.doctor?.user?.fullName || null,
      },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
