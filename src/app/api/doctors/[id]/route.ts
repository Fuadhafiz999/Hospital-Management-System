// ═══════════════════════════════════════════════════════════════════
//  Doctor ID API Route
//  DELETE /api/doctors/[id]  → Delete a doctor
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
        { error: { message: "Doctor not found" } },
        { status: 404 }
      );
    }

    await prisma.doctor.delete({ where: { id } });

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete doctor";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
