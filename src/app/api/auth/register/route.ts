import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, phone, role } = await request.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { data: null, error: { message: "Email, password, full name, and role are required" } },
        { status: 400 }
      );
    }

    // Validate email format server-side
    const normalizedEmail = String(email).toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { data: null, error: { message: "Please enter a valid email address" } },
        { status: 400 }
      );
    }

    // Doctor accounts are provisioned exclusively by the admin
    // (Admin → Create Doctor). Public signup is patients-only.
    if (role !== "PATIENT") {
      return NextResponse.json(
        { data: null, error: { message: "Public registration is for patients only. Doctor accounts are created by the hospital administrator." } },
        { status: 403 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { data: null, error: { message: "Password must be at least 6 characters" } },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return NextResponse.json(
        { data: null, error: { message: "An account with this email already exists" } },
        { status: 409 }
      );
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        fullName,
        role,
        phone: phone || null,
      },
    });

    return NextResponse.json(
      {
        message: "Account created successfully! You can now sign in.",
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { data: null, error: { message: "An unexpected error occurred. Please try again." } },
      { status: 500 }
    );
  }
}
