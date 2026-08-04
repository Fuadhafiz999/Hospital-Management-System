// ═══════════════════════════════════════════════════════════════════
//  Departments API Route
//  GET    /api/departments           → List all departments with counts
//  POST   /api/departments           → Create a department
//  PATCH  /api/departments           → Update a department
//  DELETE /api/departments/[id]      → Delete a department
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
export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: {
        headDoctor: { include: { user: true } },
        _count: { select: { doctors: true, beds: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Patient count per department = distinct patients with appointments
    // handled by computing from doctors in that department
    const result = await Promise.all(
      departments.map(async (dept) => {
        const doctorIds = dept._count.doctors
          ? (
              await prisma.doctor.findMany({
                where: { departmentId: dept.id },
                select: { id: true },
              })
            ).map((d) => d.id)
          : [];

        const patientCount =
          doctorIds.length > 0
            ? await prisma.appointment.groupBy({
                by: ["patientId"],
                where: { doctorId: { in: doctorIds } },
              })
            : [];

        return {
          id: dept.id,
          name: dept.name,
          description: dept.description,
          head_doctor_id: dept.headDoctorId,
          icon: dept.icon,
          color: dept.color,
          location: dept.location,
          phone: dept.phone,
          created_at: dept.createdAt.toISOString(),
          updated_at: dept.updatedAt.toISOString(),
          head: dept.headDoctor?.user?.fullName || null,
          doctors: dept._count.doctors,
          patients: patientCount.length,
          beds: dept._count.beds,
        };
      })
    );

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── POST (Create) ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "name", label: "Name", type: "string", required: true, minLength: 2 },
      { field: "description", label: "Description", type: "string", required: false },
      { field: "icon", label: "Icon", type: "string", required: false },
      { field: "color", label: "Color", type: "string", required: false },
      { field: "location", label: "Location", type: "string", required: false },
      { field: "phone", label: "Phone", type: "string", required: false },
      { field: "head_doctor_id", label: "Head Doctor", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { name, description, icon, color, location, phone, head_doctor_id } = validation.data;

    const existing = await prisma.department.findUnique({ where: { name: name as string } });
    if (existing) {
      return NextResponse.json(
        { data: null, error: { message: "A department with this name already exists" } },
        { status: 409 }
      );
    }

    const created = await prisma.department.create({
      data: {
        name: name as string,
        description: (description as string) || null,
        icon: (icon as string) || "🏥",
        color: (color as string) || "bg-blue-50 text-blue-600",
        location: (location as string) || null,
        phone: (phone as string) || null,
        headDoctorId: (head_doctor_id as string) || null,
      },
    });

    return NextResponse.json(
      { data: { id: created.id, name: created.name }, error: null },
      { status: 201 }
    );
  } catch (err) {
    return serverErrorResponse(err);
  }
}

// ─── PATCH (Update) ───────────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const validation = validateBody(body, [
      { field: "id", label: "Department ID", type: "string", required: true },
      { field: "name", label: "Name", type: "string", required: false, minLength: 2 },
      { field: "description", label: "Description", type: "string", required: false },
      { field: "icon", label: "Icon", type: "string", required: false },
      { field: "color", label: "Color", type: "string", required: false },
      { field: "location", label: "Location", type: "string", required: false },
      { field: "phone", label: "Phone", type: "string", required: false },
      { field: "head_doctor_id", label: "Head Doctor", type: "string", required: false },
    ]);

    if (!validation.valid) {
      return validationErrorResponse(validation.errors);
    }

    const { id, ...fields } = validation.data;
    const data: Record<string, unknown> = {};
    if (fields.name !== undefined) data.name = fields.name;
    if (fields.description !== undefined) data.description = fields.description;
    if (fields.icon !== undefined) data.icon = fields.icon;
    if (fields.color !== undefined) data.color = fields.color;
    if (fields.location !== undefined) data.location = fields.location;
    if (fields.phone !== undefined) data.phone = fields.phone;
    if (fields.head_doctor_id !== undefined) data.headDoctorId = fields.head_doctor_id;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: "No fields to update" } },
        { status: 400 }
      );
    }

    const updated = await prisma.department.update({
      where: { id: id as string },
      data,
    });

    return NextResponse.json({ data: { id: updated.id, name: updated.name }, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
