// ═══════════════════════════════════════════════════════════════════
//  Appointments API Route
//  GET  /api/appointments?patientId=x&doctorId=x&page=1&pageSize=20
//  POST /api/appointments
//  PATCH /api/appointments
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  validateBody,
  validationErrorResponse,
  serverErrorResponse,
  getPaginationParams,
  paginatedResponse,
} from "@/lib/api-validate";

export const dynamic = "force-dynamic";

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = getPaginationParams(searchParams, 50);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;
    if (date) where.date = date;
    if (status) where.status = status;

    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: {
          doctor: { include: { user: true } },
          patient: true,
        },
        orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
        skip,
        take: pageSize,
      }),
      prisma.appointment.count({ where }),
    ]);

    const result = appointments.map((a) => ({
      id: a.id,
      patient_id: a.patientId,
      doctor_id: a.doctorId,
      date: a.date,
      time_slot: a.timeSlot,
      status: a.status,
      reason: a.reason,
      created_at: a.createdAt.toISOString(),
      updated_at: a.updatedAt.toISOString(),
      doctor: a.doctor
        ? {
            id: a.doctor.id,
            profile_id: a.doctor.userId,
            specialization: a.doctor.specialization,
            license_number: a.doctor.licenseNumber,
            fee: a.doctor.fee,
            room_number: a.doctor.roomNumber,
            created_at: a.doctor.createdAt.toISOString(),
            updated_at: a.doctor.updatedAt.toISOString(),
            profiles: {
              id: a.doctor.user.id,
              user_id: a.doctor.user.id,
              full_name: a.doctor.user.fullName,
              role: a.doctor.user.role,
              phone: a.doctor.user.phone,
              created_at: a.doctor.user.createdAt.toISOString(),
              updated_at: a.doctor.user.updatedAt.toISOString(),
            },
          }
        : null,
      patient: {
        id: a.patient.id,
        user_id: a.patient.id,
        full_name: a.patient.fullName,
        role: a.patient.role,
        phone: a.patient.phone,
        created_at: a.patient.createdAt.toISOString(),
        updated_at: a.patient.updatedAt.toISOString(),
      },
    }));

    return NextResponse.json(paginatedResponse(result, total, { page, pageSize, skip }));
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create appointment) ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "patient_id", label: "Patient", type: "string", required: true },
      { field: "doctor_id", label: "Doctor", type: "string", required: true },
      { field: "date", label: "Date", type: "string", required: true, minLength: 10 },
      { field: "time_slot", label: "Time Slot", type: "string", required: true, pattern: /^\d{2}:\d{2}$/, message: "Time slot must be in HH:MM format" },
      { field: "reason", label: "Reason", type: "string", required: false, minLength: 10 },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { patient_id, doctor_id, date, time_slot, reason } = validation.data;

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date as string)) {
      return NextResponse.json(
        { data: null, error: { message: "Date must be in YYYY-MM-DD format" } },
        { status: 400 }
      );
    }

    // Check for duplicate booking
    const existing = await prisma.appointment.findUnique({
      where: {
        doctorId_date_timeSlot: {
          doctorId: doctor_id as string,
          date: date as string,
          timeSlot: time_slot as string,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { data: null, error: { message: "This time slot is already booked. Please choose another." } },
        { status: 409 }
      );
    }

    const created = await prisma.appointment.create({
      data: {
        patientId: patient_id as string,
        doctorId: doctor_id as string,
        date: date as string,
        timeSlot: time_slot as string,
        reason: (reason as string) || "",
        status: "PENDING",
      },
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          patient_id: created.patientId,
          doctor_id: created.doctorId,
          date: created.date,
          time_slot: created.timeSlot,
          status: created.status,
          reason: created.reason,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── PATCH (Update appointment status) ───────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "id", label: "Appointment ID", type: "string", required: true },
      {
        field: "status",
        label: "Status",
        type: "string",
        required: true,
        pattern: /^(PENDING|CONFIRMED|COMPLETED|CANCELLED)$/,
        message: "Status must be one of: PENDING, CONFIRMED, COMPLETED, CANCELLED",
      },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, status } = validation.data;

    // Verify appointment exists
    const existing = await prisma.appointment.findUnique({ where: { id: id as string } });
    if (!existing) {
      return NextResponse.json(
        { data: null, error: { message: "Appointment not found" } },
        { status: 404 }
      );
    }

    const updated = await prisma.appointment.update({
      where: { id: id as string },
      data: { status: status as string },
      include: { doctor: { include: { user: true } }, patient: true },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        patient_id: updated.patientId,
        doctor_id: updated.doctorId,
        date: updated.date,
        time_slot: updated.timeSlot,
        status: updated.status,
        reason: updated.reason,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
