// ─── Database Client Setup ─────────────────────────────────────────
// This module provides database access using Prisma ORM.
// To activate:
//   1. Install Prisma: npm install @prisma/client
//   2. Initialize: npx prisma init
//   3. Configure your DATABASE_URL in .env
//   4. Run: npx prisma db push
//   5. Generate client: npx prisma generate

// Uncomment the lines below once Prisma is set up:
// import { PrismaClient } from "@prisma/client";
//
// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };
//
// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({
//     log: process.env.NODE_ENV === "development" ? ["query"] : [],
//   });
//
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// ─── Placeholder DB Functions ─────────────────────────────────────
// These mock functions allow the app to run without a database.
// Replace them with real Prisma queries when ready.

import type {
  User,
  Patient,
  Doctor,
  Appointment,
  Department,
  Invoice,
  DashboardStats,
  RecentActivity,
  ApiResponse,
  AuthResponse,
  AuthCredentials,
  RegisterFormData,
} from "@/types";

// In-memory store (for development placeholder only)
const store = {
  users: [] as User[],
  patients: [] as Patient[],
  doctors: [] as Doctor[],
  appointments: [] as Appointment[],
  departments: [] as Department[],
  invoices: [] as Invoice[],
};

// ─── Auth Functions ───────────────────────────────────────────────
export async function authenticateUser(
  credentials: AuthCredentials
): Promise<ApiResponse<AuthResponse>> {
  const user = store.users.find((u) => u.email === credentials.email);
  if (!user) {
    return { success: false, error: "Invalid email or password" };
  }
  return {
    success: true,
    data: {
      user,
      token: `mock-jwt-${user.id}-${Date.now()}`,
    },
  };
}

export async function registerUser(
  data: RegisterFormData
): Promise<ApiResponse<User>> {
  const existingUser = store.users.find((u) => u.email === data.email);
  if (existingUser) {
    return { success: false, error: "Email already registered" };
  }
  const newUser: User = {
    id: `usr_${store.users.length + 1}`,
    email: data.email,
    name: data.name,
    role: data.role,
    phone: data.phone,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  return { success: true, data: newUser, message: "Registration successful" };
}

// ─── Patient Functions ────────────────────────────────────────────
export async function getPatients(): Promise<ApiResponse<Patient[]>> {
  return { success: true, data: store.patients };
}

export async function getPatientById(
  id: string
): Promise<ApiResponse<Patient | undefined>> {
  const patient = store.patients.find((p) => p.id === id);
  return patient
    ? { success: true, data: patient }
    : { success: false, error: "Patient not found" };
}

// ─── Doctor Functions ─────────────────────────────────────────────
export async function getDoctors(): Promise<ApiResponse<Doctor[]>> {
  return { success: true, data: store.doctors };
}

export async function getDoctorById(
  id: string
): Promise<ApiResponse<Doctor | undefined>> {
  const doctor = store.doctors.find((d) => d.id === id);
  return doctor
    ? { success: true, data: doctor }
    : { success: false, error: "Doctor not found" };
}

// ─── Appointment Functions ────────────────────────────────────────
export async function getAppointments(): Promise<ApiResponse<Appointment[]>> {
  return { success: true, data: store.appointments };
}

export async function createAppointment(
  appointment: Omit<Appointment, "id" | "createdAt" | "updatedAt">
): Promise<ApiResponse<Appointment>> {
  const newAppointment: Appointment = {
    ...appointment,
    id: `apt_${store.appointments.length + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.appointments.push(newAppointment);
  return { success: true, data: newAppointment };
}

// ─── Department Functions ─────────────────────────────────────────
export async function getDepartments(): Promise<ApiResponse<Department[]>> {
  return { success: true, data: store.departments };
}

// ─── Dashboard Functions ──────────────────────────────────────────
export async function getDashboardStats(): Promise<
  ApiResponse<DashboardStats>
> {
  return {
    success: true,
    data: {
      totalPatients: store.patients.length,
      totalDoctors: store.doctors.length,
      totalAppointments: store.appointments.length,
      totalRevenue: 0,
      upcomingAppointments: store.appointments.filter(
        (a) => a.status === "scheduled"
      ).length,
      pendingPayments: 0,
    },
  };
}

export async function getRecentActivity(): Promise<
  ApiResponse<RecentActivity[]>
> {
  return {
    success: true,
    data: [],
  };
}
