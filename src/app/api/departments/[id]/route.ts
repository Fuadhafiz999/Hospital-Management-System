// ═══════════════════════════════════════════════════════════════════
//  Department ID API Route
//  DELETE /api/departments/[id]  → Delete a department
// ═══════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverErrorResponse } from "@/lib/api-validate";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) {
      return NextResponse.json(
        { data: null, error: { message: "Department not found" } },
        { status: 404 }
      );
    }

    await prisma.department.delete({ where: { id } });

    return NextResponse.json({ data: { id }, error: null });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
