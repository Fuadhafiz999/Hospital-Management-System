// ═══════════════════════════════════════════════════════════════════
//  Doctors API Route
//  GET  /api/doctors       → List all doctors (with profiles)
//  POST /api/doctors       → Create a new doctor
//  PATCH /api/doctors      → Update a doctor
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";
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
      include: { user: true, department: true },
      orderBy: { createdAt: "desc" },
    });

    const result = doctors.map((d) => ({
      id: d.id,
      profile_id: d.userId,
      specialization: d.specialization,
      license_number: d.licenseNumber,
      fee: d.fee,
      room_number: d.roomNumber,
      department_id: d.departmentId,
      department_name: d.department?.name || null,
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

    // Creating a doctor provisions the login account too — doctor
    // accounts cannot self-register.
    const validation = validateBody(body, [
      { field: "email", label: "Email", type: "email", required: true },
      { field: "full_name", label: "Full Name", type: "string", required: true, minLength: 2 },
      { field: "specialization", label: "Specialization", type: "string", required: true, minLength: 2 },
      { field: "license_number", label: "License Number", type: "string", required: true, minLength: 3 },
      { field: "password", label: "Password", type: "string", required: false, minLength: 6 },
      { field: "phone", label: "Phone", type: "string", required: false },
      { field: "fee", label: "Fee", type: "number", required: false, min: 0 },
      { field: "room_number", label: "Room Number", type: "string", required: false },
      { field: "department_id", label: "Department", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { email, full_name, specialization, license_number, password, phone, fee, room_number, department_id } = validation.data;

    // If a department is specified, verify it exists
    if (department_id) {
      const dept = await prisma.department.findUnique({ where: { id: department_id as string } });
      if (!dept) {
        return NextResponse.json(
          { data: null, error: { message: "Department not found" } },
          { status: 404 }
        );
      }
    }

    // The email must not already be registered
    const existingUser = await prisma.user.findUnique({ where: { email: email as string } });
    if (existingUser) {
      return NextResponse.json(
        { data: null, error: { message: "An account with this email already exists" } },
        { status: 409 }
      );
    }

    // Admin may supply a temp password; otherwise generate one that
    // satisfies the complexity rules.
    const tempPassword =
      (password as string) || `Doc-${randomUUID().slice(0, 8)}Aa1!`;
    const passwordHash = await hashPassword(tempPassword);

    // Create the login account and the doctor record atomically
    const created = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email as string,
          passwordHash,
          fullName: full_name as string,
          role: "DOCTOR",
          phone: (phone as string) || null,
        },
      });

      return tx.doctor.create({
        data: {
          userId: user.id,
          specialization: specialization as string,
          licenseNumber: license_number as string,
          fee: (fee as number) ?? 0,
          roomNumber: (room_number as string) || null,
          departmentId: department_id ? (department_id as string) : undefined,
        },
        include: { user: true, department: true },
      });
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
          department_id: created.departmentId,
          department_name: created.department?.name || null,
          created_at: created.createdAt.toISOString(),
          updated_at: created.updatedAt.toISOString(),
          profiles: {
            id: created.user.id,
            user_id: created.user.id,
            full_name: created.user.fullName,
            role: created.user.role,
            phone: created.user.phone,
          },
          // Returned once so the admin can hand it to the doctor
          temp_password: tempPassword,
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
      { field: "department_id", label: "Department", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, room_number, fee, specialization, department_id } = validation.data;

    // If a department is specified, verify it exists
    if (department_id) {
      const dept = await prisma.department.findUnique({ where: { id: department_id as string } });
      if (!dept) {
        return NextResponse.json(
          { data: null, error: { message: "Department not found" } },
          { status: 404 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (room_number !== undefined) data.roomNumber = room_number;
    if (fee !== undefined) data.fee = fee;
    if (specialization !== undefined) data.specialization = specialization;
    if (department_id !== undefined) data.departmentId = department_id || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: "No fields to update" } },
        { status: 400 }
      );
    }

    const updated = await prisma.doctor.update({
      where: { id: id as string },
      data,
      include: { user: true, department: true },
    });

    return NextResponse.json({
      data: {
        id: updated.id,
        profile_id: updated.userId,
        specialization: updated.specialization,
        license_number: updated.licenseNumber,
        fee: updated.fee,
        room_number: updated.roomNumber,
        department_id: updated.departmentId,
        department_name: updated.department?.name || null,
        created_at: updated.createdAt.toISOString(),
        updated_at: updated.updatedAt.toISOString(),
      },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
