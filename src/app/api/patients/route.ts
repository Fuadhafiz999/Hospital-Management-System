// ═══════════════════════════════════════════════════════════════════
//  Patients API Route
//  GET /api/patients?q=x&doctorId=x  → List patients (admin: all, doctor: scoped)
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverErrorResponse } from "@/lib/api-validate";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const doctorId = searchParams.get("doctorId");

    // If a doctor is specified, only return patients with appointments for that doctor
    if (doctorId) {
      const appts = await prisma.appointment.findMany({
        where: { doctorId },
        select: { patientId: true },
        distinct: ["patientId"],
      });
      const patientIds = appts.map((a) => a.patientId);

      const patients = await prisma.user.findMany({
        where: {
          id: { in: patientIds },
          role: "PATIENT",
          ...(q
            ? {
                OR: [
                  { fullName: { contains: q, mode: "insensitive" } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { fullName: "asc" },
      });

      const result = await Promise.all(
        patients.map(async (p) => {
          const lastAppt = await prisma.appointment.findFirst({
            where: { patientId: p.id, doctorId },
            orderBy: { date: "desc" },
          });
          const lastRecord = await prisma.medicalRecord.findFirst({
            where: { patientId: p.id, doctorId },
            orderBy: { createdAt: "desc" },
          });

          return {
            id: p.id,
            name: p.fullName,
            email: p.email,
            phone: p.phone,
            role: p.role,
            created_at: p.createdAt.toISOString(),
            last_visit: lastAppt?.date || null,
            diagnosis: lastRecord?.diagnosis || null,
          };
        })
      );

      return NextResponse.json({ data: result, error: null });
    }

    // Admin: all patients
    const where: Record<string, unknown> = { role: "PATIENT" };
    if (q) {
      where.OR = [
        { fullName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }

    const patients = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const result = await Promise.all(
      patients.map(async (p) => {
        const lastAppt = await prisma.appointment.findFirst({
          where: { patientId: p.id },
          orderBy: { date: "desc" },
        });

        return {
          id: p.id,
          name: p.fullName,
          email: p.email,
          phone: p.phone,
          role: p.role,
          created_at: p.createdAt.toISOString(),
          last_visit: lastAppt?.date || null,
        };
      })
    );

    return NextResponse.json({ data: result, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
