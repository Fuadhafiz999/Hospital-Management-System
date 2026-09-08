import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth-utils";
import { serverErrorResponse } from "@/lib/api-validate";

export const dynamic = "force-dynamic";

// ─── GET (current user) ───────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Get user error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}

// ─── PATCH (update profile) ───────────────────────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json(
        { data: null, error: { message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { data: null, error: { message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { full_name, phone } = body;

    if (full_name !== undefined && (typeof full_name !== "string" || full_name.trim().length < 2)) {
      return NextResponse.json(
        { data: null, error: { message: "Full name must be at least 2 characters" } },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};
    if (full_name !== undefined) data.fullName = full_name.trim();
    if (phone !== undefined) data.phone = phone || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { data: null, error: { message: "No fields to update" } },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
