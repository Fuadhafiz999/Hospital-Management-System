// ═══════════════════════════════════════════════════════════════════
//  Database Helpers — Prisma-backed query functions
//  Used by notifications and search API routes.
// ═══════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import type {
  UserRole,
  AppointmentStatus,
} from "@/types/supabase";

// ─── Helper: convert Date → ISO string ────────────────────────────
const iso = (d: Date | undefined): string => (d ? d.toISOString() : new Date().toISOString());

// ─── Helper: safely parse JSON string field ────────────────────────
function parseJsonField(val: unknown): any {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// ═══════════════════════════════════════════════════════════════════
//  Auth Helpers
// ═══════════════════════════════════════════════════════════════════

export async function getCurrentUserProfile() {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return { user: null, profile: null };
    const json = await res.json();
    if (!json.user) return { user: null, profile: null };
    return {
      user: json.user,
      profile: {
        id: json.user.id, user_id: json.user.id, full_name: json.user.fullName,
        role: json.user.role as UserRole, phone: json.user.phone,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      } as any,
    };
  } catch {
    return { user: null, profile: null };
  }
}

// ═══════════════════════════════════════════════════════════════════
//  Doctors
// ═══════════════════════════════════════════════════════════════════

export async function getAllDoctors() {
  try {
    const doctors = await prisma.doctor.findMany({ include: { user: true } });
    const result = doctors.map((d) => ({
      id: d.id, profile_id: d.userId, specialization: d.specialization,
      license_number: d.licenseNumber, fee: d.fee, room_number: d.roomNumber,
      created_at: iso(d.createdAt), updated_at: iso(d.updatedAt),
      profiles: {
        id: d.user.id, user_id: d.user.id, full_name: d.user.fullName,
        role: d.user.role as UserRole, phone: d.user.phone,
        created_at: iso(d.user.createdAt), updated_at: iso(d.user.updatedAt),
      },
    }));
    return { data: result, error: null };
  } catch (err) { return { data: [], error: err as Error }; }
}

// ═══════════════════════════════════════════════════════════════════
//  Appointments
// ═══════════════════════════════════════════════════════════════════

export async function getAppointmentsByPatient(patientId: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { patientId }, include: { doctor: { include: { user: true } } }, orderBy: { date: "desc" },
    });
    const result = appointments.map((a: any) => ({
      id: a.id, patient_id: a.patientId, doctor_id: a.doctorId, date: a.date,
      time_slot: a.timeSlot, status: a.status as AppointmentStatus, reason: a.reason,
      created_at: iso(a.createdAt), updated_at: iso(a.updatedAt),
      doctor: {
        id: a.doctor.id, profile_id: a.doctor.userId, specialization: a.doctor.specialization,
        license_number: a.doctor.licenseNumber, fee: a.doctor.fee, room_number: a.doctor.roomNumber,
        created_at: iso(a.doctor.createdAt), updated_at: iso(a.doctor.updatedAt),
        profiles: {
          id: a.doctor.user.id, user_id: a.doctor.user.id, full_name: a.doctor.user.fullName,
          role: a.doctor.user.role as UserRole, phone: a.doctor.user.phone,
          created_at: iso(a.doctor.user.createdAt), updated_at: iso(a.doctor.user.updatedAt),
        },
      },
    }));
    return { data: result, error: null };
  } catch (err) { return { data: [], error: err as Error }; }
}

export async function getAppointmentsByDoctor(doctorId: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId }, include: { patient: true }, orderBy: { date: "desc" },
    });
    const result = appointments.map((a: any) => ({
      id: a.id, patient_id: a.patientId, doctor_id: a.doctorId, date: a.date,
      time_slot: a.timeSlot, status: a.status as AppointmentStatus, reason: a.reason,
      created_at: iso(a.createdAt), updated_at: iso(a.updatedAt),
      patient: {
        id: a.patient.id, user_id: a.patient.id, full_name: a.patient.fullName,
        role: a.patient.role as UserRole, phone: a.patient.phone,
        created_at: iso(a.patient.createdAt), updated_at: iso(a.patient.updatedAt),
      },
    }));
    return { data: result, error: null };
  } catch (err) { return { data: [], error: err as Error }; }
}

// ═══════════════════════════════════════════════════════════════════
//  Medical Records
// ═══════════════════════════════════════════════════════════════════

export async function getMedicalRecordsByPatient(patientId: string) {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } }, appointment: true },
      orderBy: { createdAt: "desc" },
    });
    const result = records.map((r: any) => ({
      id: r.id, appointment_id: r.appointmentId, patient_id: r.patientId, doctor_id: r.doctorId,
      diagnosis: r.diagnosis,
      prescription: parseJsonField(r.prescription),
      vitals_json: parseJsonField(r.vitalsJson),
      notes: r.notes,
      created_at: iso(r.createdAt), updated_at: iso(r.updatedAt),
      doctor: r.doctor ? {
        id: r.doctor.id, profile_id: r.doctor.userId, specialization: r.doctor.specialization,
        license_number: r.doctor.licenseNumber, fee: r.doctor.fee, room_number: r.doctor.roomNumber,
        created_at: iso(r.doctor.createdAt), updated_at: iso(r.doctor.updatedAt),
        profiles: {
          id: r.doctor.user.id, user_id: r.doctor.user.id, full_name: r.doctor.user.fullName,
          role: r.doctor.user.role as UserRole, phone: r.doctor.user.phone,
          created_at: iso(r.doctor.user.createdAt), updated_at: iso(r.doctor.user.updatedAt),
        },
      } : null,
      appointment: {
        id: r.appointment.id, patient_id: r.appointment.patientId, doctor_id: r.appointment.doctorId,
        date: r.appointment.date, time_slot: r.appointment.timeSlot,
        status: r.appointment.status as AppointmentStatus, reason: r.appointment.reason,
        created_at: iso(r.appointment.createdAt), updated_at: iso(r.appointment.updatedAt),
      },
    }));
    return { data: result as any, error: null };
  } catch (err) { return { data: [], error: err as Error }; }
}
