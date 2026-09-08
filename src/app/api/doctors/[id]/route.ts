// ═══════════════════════════════════════════════════════════════════
//  Doctor ID API Route
//  DELETE /api/doctors/[id]  → Delete a doctor
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverErrorResponse } from "@/lib/api-validate";

// ─── DELETE ───────────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return NextResponse.json(
        { data: null, error: { message: "Doctor not found" } },
        { status: 404 }
      );
    }

    await prisma.doctor.delete({ where: { id } });

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
