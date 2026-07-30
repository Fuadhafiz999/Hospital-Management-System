// ═══════════════════════════════════════════════════════════════════
//  Medical Records API Route
//  GET  /api/medical-records?patientId=x&doctorId=x&page=1&pageSize=20
//  POST /api/medical-records
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

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const { page, pageSize, skip } = getPaginationParams(searchParams, 20);
    const patientId = searchParams.get("patientId");
    const doctorId = searchParams.get("doctorId");

    const where: Record<string, unknown> = {};
    if (patientId) where.patientId = patientId;
    if (doctorId) where.doctorId = doctorId;

    const [records, total] = await Promise.all([
      prisma.medicalRecord.findMany({
        where,
        include: {
          doctor: { include: { user: true } },
          patient: true,
          appointment: true,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.medicalRecord.count({ where }),
    ]);

    const result = records.map((r) => {
      let prescription: unknown = r.prescription;
      if (typeof prescription === "string") {
        try { prescription = JSON.parse(prescription); } catch { /* keep as string */ }
      }
      let vitalsJson: unknown = r.vitalsJson;
      if (typeof vitalsJson === "string") {
        try { vitalsJson = JSON.parse(vitalsJson); } catch { /* keep as string */ }
      }

      return {
        id: r.id,
        appointment_id: r.appointmentId,
        patient_id: r.patientId,
        doctor_id: r.doctorId,
        diagnosis: r.diagnosis,
        prescription,
        vitals_json: vitalsJson,
        notes: r.notes,
        created_at: r.createdAt.toISOString(),
        updated_at: r.updatedAt.toISOString(),
        doctor: r.doctor
          ? {
              id: r.doctor.id,
              profile_id: r.doctor.userId,
              specialization: r.doctor.specialization,
              license_number: r.doctor.licenseNumber,
              fee: r.doctor.fee,
              room_number: r.doctor.roomNumber,
              created_at: r.doctor.createdAt.toISOString(),
              updated_at: r.doctor.updatedAt.toISOString(),
              profiles: {
                id: r.doctor.user.id,
                user_id: r.doctor.user.id,
                full_name: r.doctor.user.fullName,
                role: r.doctor.user.role,
                phone: r.doctor.user.phone,
                created_at: r.doctor.user.createdAt.toISOString(),
                updated_at: r.doctor.user.updatedAt.toISOString(),
              },
            }
          : null,
        patient: {
          id: r.patient.id,
          user_id: r.patient.id,
          full_name: r.patient.fullName,
          role: r.patient.role,
          phone: r.patient.phone,
          created_at: r.patient.createdAt.toISOString(),
          updated_at: r.patient.updatedAt.toISOString(),
        },
        appointment: {
          id: r.appointment.id,
          patient_id: r.appointment.patientId,
          doctor_id: r.appointment.doctorId,
          date: r.appointment.date,
          time_slot: r.appointment.timeSlot,
          status: r.appointment.status,
          reason: r.appointment.reason,
          created_at: r.appointment.createdAt.toISOString(),
          updated_at: r.appointment.updatedAt.toISOString(),
        },
      };
    });

    return NextResponse.json(paginatedResponse(result, total, { page, pageSize, skip }));
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create medical record) ────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "appointment_id", label: "Appointment", type: "string", required: true },
      { field: "patient_id", label: "Patient", type: "string", required: true },
      { field: "diagnosis", label: "Diagnosis", type: "string", required: true, minLength: 2 },
      { field: "doctor_id", label: "Doctor", type: "string", required: false },
      { field: "notes", label: "Notes", type: "string", required: false },
      { field: "vitals_json", label: "Vitals", type: "string", required: false },
      { field: "prescription", label: "Prescription", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { appointment_id, patient_id, doctor_id, diagnosis, notes, vitals_json, prescription } = validation.data;

    // Check if a medical record already exists for this appointment
    const existing = await prisma.medicalRecord.findUnique({
      where: { appointmentId: appointment_id as string },
    });

    if (existing) {
      return NextResponse.json(
        { data: null, error: { message: "A medical record already exists for this appointment" } },
        { status: 409 }
      );
    }

    const created = await prisma.medicalRecord.create({
      data: {
        appointmentId: appointment_id as string,
        patientId: patient_id as string,
        doctorId: doctor_id ? (doctor_id as string) : undefined,
        diagnosis: diagnosis as string,
        notes: (notes as string) || null,
        vitalsJson: typeof vitals_json === "string" ? vitals_json : JSON.stringify(vitals_json || {}),
        prescription: typeof prescription === "string" ? prescription : JSON.stringify(prescription || []),
      },
      include: {
        doctor: { include: { user: true } },
        patient: true,
        appointment: true,
      },
    });

    // Auto-update appointment status to COMPLETED
    try {
      await prisma.appointment.update({
        where: { id: appointment_id as string },
        data: { status: "COMPLETED" },
      });
    } catch (statusErr) {
      console.error("Medical record created but failed to update appointment status:", statusErr);
    }

    return NextResponse.json(
      {
        data: {
          id: created.id,
          appointment_id: created.appointmentId,
          patient_id: created.patientId,
          doctor_id: created.doctorId,
          diagnosis: created.diagnosis,
          notes: created.notes,
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
