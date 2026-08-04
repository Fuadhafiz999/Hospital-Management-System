// ═══════════════════════════════════════════════════════════════════
//  Doctors API Route
//  GET  /api/doctors       → List all doctors (with profiles)
//  POST /api/doctors       → Create a new doctor
//  PATCH /api/doctors      → Update a doctor
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
    const specialization = searchParams.get("specialization");

    const where: Record<string, unknown> = {};
    if (specialization) where.specialization = specialization;

    // Admin panel fetches all doctors for client-side filtering — no pagination
    const doctors = await prisma.doctor.findMany({
      where,
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });

    const result = doctors.map((d) => ({
      id: d.id,
      profile_id: d.userId,
      specialization: d.specialization,
      license_number: d.licenseNumber,
      fee: d.fee,
      room_number: d.roomNumber,
      created_at: d.createdAt.toISOString(),
      updated_at: d.updatedAt.toISOString(),
      profiles: {
        id: d.user.id,
        user_id: d.user.id,
        full_name: d.user.fullName,
        role: d.user.role,
        phone: d.user.phone,
        created_at: d.user.createdAt.toISOString(),
        updated_at: d.user.updatedAt.toISOString(),
      },
    }));

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create doctor + profile) ──────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "user_id", label: "User ID", type: "string", required: true },
      { field: "specialization", label: "Specialization", type: "string", required: true, minLength: 2 },
      { field: "license_number", label: "License Number", type: "string", required: true, minLength: 3 },
      { field: "full_name", label: "Full Name", type: "string", required: false },
      { field: "email", label: "Email", type: "email", required: false },
      { field: "phone", label: "Phone", type: "string", required: false },
      { field: "fee", label: "Fee", type: "number", required: false, min: 0 },
      { field: "room_number", label: "Room Number", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { user_id, specialization, license_number, full_name, phone, fee, room_number } = validation.data;

    // Update user profile if full_name provided
    if (full_name) {
      await prisma.user.update({
        where: { id: user_id as string },
        data: {
          fullName: full_name as string,
          phone: phone ? (phone as string) : null,
        },
      });
    }

    // Create or update doctor record (register may have created a shell record)
    const created = await prisma.doctor.upsert({
      where: { userId: user_id as string },
      update: {
        specialization: specialization as string,
        licenseNumber: license_number as string,
        fee: (fee as number) ?? 0,
        roomNumber: (room_number as string) || null,
      },
      create: {
        userId: user_id as string,
        specialization: specialization as string,
        licenseNumber: license_number as string,
        fee: (fee as number) ?? 0,
        roomNumber: (room_number as string) || null,
      },
      include: { user: true },
    });

    return NextResponse.json(
      {
        data: {
          id: created.id,
          profile_id: created.userId,
          specialization: created.specialization,
          license_number: created.licenseNumber,
          fee: created.fee,
          room_number: created.roomNumber,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
          profiles: {
            id: created.user.id,
            user_id: created.user.id,
            full_name: created.user.fullName,
            role: created.user.role,
            phone: created.user.phone,
          },
        },
        error: null,
      },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── PATCH (Update doctor fields) ────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "id", label: "Doctor ID", type: "string", required: true },
      { field: "room_number", label: "Room Number", type: "string", required: false },
      { field: "fee", label: "Fee", type: "number", required: false, min: 0 },
      { field: "specialization", label: "Specialization", type: "string", required: false, minLength: 2 },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, room_number, fee, specialization } = validation.data;

    const data: Record<string, unknown> = {};
    if (room_number !== undefined) data.roomNumber = room_number;
    if (fee !== undefined) data.fee = fee;
    if (specialization !== undefined) data.specialization = specialization;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: "No fields to update" } },
        { status: 400 }
      );
    }

    const updated = await prisma.doctor.update({
      where: { id: id as string },
      data,
      include: { user: true },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        profile_id: updated.userId,
        specialization: updated.specialization,
        license_number: updated.licenseNumber,
        fee: updated.fee,
        room_number: updated.roomNumber,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
