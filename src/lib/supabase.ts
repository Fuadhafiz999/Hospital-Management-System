// ═══════════════════════════════════════════════════════════════════
//  Database Client — Prisma (replaces Supabase for local dev)
// ═══════════════════════════════════════════════════════════════════
//  Provides a typed database interface that mirrors the previous
//  Supabase helper functions, but backed by Prisma + SQLite.
//
//  The `createClient()` function returns a lightweight compat object
//  for pages that haven't been migrated to Prisma helpers yet.
// ═══════════════════════════════════════════════════════════════════

import prisma from "@/lib/prisma";
import type {
  ProfileRow,
  ProfileInsert,
  DoctorRow,
  DoctorInsert,
  DoctorUpdate,
  AppointmentRow,
  AppointmentInsert,
  MedicalRecordRow,
  MedicalRecordInsert,
  UserRole,
  AppointmentStatus,
} from "@/types/supabase";

// ─── Helper: convert Date → ISO string for Supabase type compatibility ─
const iso = (d: Date | undefined): string => (d ? d.toISOString() : new Date().toISOString());

// ─── Helper: safely parse JSON string field ───────────────────────
function parseJsonField(val: unknown): any {
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

// ─── Lightweight Supabase-compat query builder ────────────────────
//  Supports the chain pattern: .from("table").select(...).eq(...).single()
//  used by pages that haven't been fully migrated yet.

type WhereClause = Record<string, unknown>;
type OrderClause = { column: string; ascending: boolean };

class PrismaQueryBuilder<T> {
  private table: string;
  private wheres: WhereClause[] = [];
  private orders: OrderClause[] = [];
  private deleteMode = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns: string): this {
    return this;
  }

  eq(column: string, value: unknown): this {
    this.wheres.push({ [this._mapFieldName(column)]: value });
    return this;
  }

  order(column: string, opts: { ascending: boolean }): this {
    this.orders.push({ column: this._mapFieldName(column), ascending: opts.ascending });
    return this;
  }

  delete(): this {
    this.deleteMode = true;
    return this;
  }

  single<TResult = T>(): Promise<{ data: TResult | null; error: Error | null }> {
    return this._execute<TResult>(true);
  }

  returns<TResult = T>(): this {
    return this;
  }

  private _mapFieldName(column: string): string {
    const fieldMap: Record<string, string> = {
      'user_id': 'id',
      'profile_id': 'userId',
      'doctor_id': 'doctorId',
      'patient_id': 'patientId',
      'time_slot': 'timeSlot',
      'license_number': 'licenseNumber',
      'room_number': 'roomNumber',
      'full_name': 'fullName',
      'password_hash': 'passwordHash',
      'appointment_id': 'appointmentId',
      'vitals_json': 'vitalsJson',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt',
    };
    return fieldMap[column] || column.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  }

  // Make the builder directly awaitable (returns query results)
  then<TResult = any>(
    onfulfilled?: ((value: any) => TResult | PromiseLike<TResult>) | null,
    onrejected?: ((reason: any) => PromiseLike<TResult>) | null
  ): PromiseLike<TResult> {
    return Promise.resolve(this._execute(false)).then(onfulfilled as any, onrejected);
  }

  private async _execute<TResult = T>(single: boolean): Promise<{ data: TResult | null; error: Error | null }> {
    try {
      const prismaModel = this._getPrismaModel();
      if (!prismaModel) {
        return { data: null, error: new Error(`Unknown table: ${this.table}`) };
      }

      const where = this._buildWhere();

      if (this.deleteMode) {
        await (prismaModel as any).deleteMany({ where });
        return { data: null as any, error: null };
      }

      const orderBy = this.orders.length > 0
        ? this.orders.map(o => ({ [o.column]: o.ascending ? "asc" as const : "desc" as const }))
        : undefined;

      const result = await (prismaModel as any).findMany({ where, orderBy, take: single ? 1 : undefined });

      if (single) {
        return { data: (result[0] || null) as any, error: null };
      }
      return { data: result as any, error: null };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  }

  private _getPrismaModel(): any {
    const modelMap: Record<string, any> = {
      profiles: prisma.user,
      doctors: prisma.doctor,
      appointments: prisma.appointment,
      medical_records: prisma.medicalRecord,
    };
    return modelMap[this.table];
  }

  private _buildWhere(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const w of this.wheres) {
      for (const [key, val] of Object.entries(w)) {
        result[key] = val;
      }
    }
    return result;
  }
}

// ─── Auth helpers ─────────────────────────────────────────────────
async function authGetUser(): Promise<{ data: { user: any }; error: null } | { data: { user: null }; error: Error }> {
  try {
    const res = await fetch("/api/auth/me");
    if (!res.ok) return { data: { user: null }, error: new Error("Not authenticated") };
    const json = await res.json();
    return { data: { user: json.user }, error: null };
  } catch (err) {
    return { data: { user: null }, error: err as Error };
  }
}

export function createClient() {
  return {
    auth: {
      getUser: authGetUser,
      signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const json = await res.json();
          if (!res.ok) return { data: { user: null }, error: new Error(json.error || "Invalid login credentials") };
          return { data: { user: json.user }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err as Error };
        }
      },
      signUp: async ({ email, password, options }: { email: string; password: string; options?: { data?: Record<string, any> } }) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email, password,
              fullName: options?.data?.full_name || email,
              role: options?.data?.role || "PATIENT",
            }),
          });
          const json = await res.json();
          if (!res.ok) return { data: { user: null }, error: new Error(json.error || "Registration failed") };
          return { data: { user: { id: json.user?.id, email: json.user?.email } }, error: null };
        } catch (err) {
          return { data: { user: null }, error: err as Error };
        }
      },
      signOut: async () => {
        try { await fetch("/api/auth/logout", { method: "POST" }); return { error: null }; }
        catch (err) { return { error: err as Error }; }
      },
    },
    from: (table: string) => new PrismaQueryBuilder(table),
  };
}

// ═══════════════════════════════════════════════════════════════════
//  Typed Query Helpers
// ═══════════════════════════════════════════════════════════════════

// ─── Profiles ─────────────────────────────────────────────────────

export async function getProfileById(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, role: true, phone: true, createdAt: true, updatedAt: true },
    });
    if (!user) return { data: null, error: new Error("Profile not found") };
    return {
      data: {
        id: user.id, user_id: user.id, full_name: user.fullName,
        role: user.role, phone: user.phone,
        created_at: iso(user.createdAt), updated_at: iso(user.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function getProfilesByRole(role: UserRole) {
  try {
    const users = await prisma.user.findMany({ where: { role }, select: { id: true, fullName: true, role: true, phone: true } });
    const profiles = users.map((u) => ({
      id: u.id, user_id: u.id, full_name: u.fullName, role: u.role as UserRole, phone: u.phone,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }));
    return { data: profiles, error: null };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function createProfile(profile: ProfileInsert) {
  try {
    const user = await prisma.user.update({
      where: { id: profile.user_id },
      data: { fullName: profile.full_name, role: profile.role, phone: profile.phone || null },
    });
    return {
      data: {
        id: user.id, user_id: user.id, full_name: user.fullName, role: user.role as UserRole, phone: user.phone,
        created_at: iso(user.createdAt), updated_at: iso(user.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function updateProfile(userId: string, updates: Partial<Pick<ProfileRow, "full_name" | "phone">>) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { ...(updates.full_name ? { fullName: updates.full_name } : {}), ...(updates.phone !== undefined ? { phone: updates.phone } : {}) },
    });
    return {
      data: {
        id: user.id, user_id: user.id, full_name: user.fullName, role: user.role as UserRole, phone: user.phone,
        created_at: iso(user.createdAt), updated_at: iso(user.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

// ─── Doctors ──────────────────────────────────────────────────────

export async function getDoctorById(id: string) {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { id }, include: { user: true } });
    if (!doctor) return { data: null, error: new Error("Doctor not found") };
    return {
      data: {
        id: doctor.id, profile_id: doctor.userId, specialization: doctor.specialization,
        license_number: doctor.licenseNumber, fee: doctor.fee, room_number: doctor.roomNumber,
        created_at: iso(doctor.createdAt), updated_at: iso(doctor.updatedAt),
        profiles: {
          id: doctor.user.id, user_id: doctor.user.id, full_name: doctor.user.fullName,
          role: doctor.user.role as UserRole, phone: doctor.user.phone,
          created_at: iso(doctor.user.createdAt), updated_at: iso(doctor.user.updatedAt),
        },
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function getDoctorsBySpecialization(specialization: string) {
  try {
    const doctors = await prisma.doctor.findMany({ where: { specialization }, include: { user: true } });
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
  } catch (err) { return { data: null, error: err as Error }; }
}

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
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function createDoctor(doctor: DoctorInsert) {
  try {
    const created = await prisma.doctor.create({
      data: {
        userId: doctor.profile_id, specialization: doctor.specialization,
        licenseNumber: doctor.license_number, fee: doctor.fee ?? 0, roomNumber: doctor.room_number || null,
      },
    });
    return {
      data: {
        id: created.id, profile_id: created.userId, specialization: created.specialization,
        license_number: created.licenseNumber, fee: created.fee, room_number: created.roomNumber,
        created_at: iso(created.createdAt), updated_at: iso(created.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function updateDoctor(id: string, updates: DoctorUpdate) {
  try {
    const data: any = {};
    if (updates.room_number !== undefined) data.roomNumber = updates.room_number;
    if (updates.fee !== undefined) data.fee = updates.fee;
    if (updates.specialization !== undefined) data.specialization = updates.specialization;
    const updated = await prisma.doctor.update({ where: { id }, data });
    return {
      data: {
        id: updated.id, profile_id: updated.userId, specialization: updated.specialization,
        license_number: updated.licenseNumber, fee: updated.fee, room_number: updated.roomNumber,
        created_at: iso(updated.createdAt), updated_at: iso(updated.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

// ─── Appointments ─────────────────────────────────────────────────

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
  } catch (err) { return { data: null, error: err as Error }; }
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
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function getAppointmentsByDate(date: string) {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { date }, include: { doctor: { include: { user: true } }, patient: true }, orderBy: { timeSlot: "asc" },
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
      patient: {
        id: a.patient.id, user_id: a.patient.id, full_name: a.patient.fullName,
        role: a.patient.role as UserRole, phone: a.patient.phone,
        created_at: iso(a.patient.createdAt), updated_at: iso(a.patient.updatedAt),
      },
    }));
    return { data: result, error: null };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function createAppointment(appointment: AppointmentInsert) {
  try {
    const created = await prisma.appointment.create({
      data: {
        patientId: appointment.patient_id, doctorId: appointment.doctor_id,
        date: appointment.date, timeSlot: appointment.time_slot,
        reason: appointment.reason || "", status: "PENDING",
      },
    });
    return {
      data: {
        id: created.id, patient_id: created.patientId, doctor_id: created.doctorId, date: created.date,
        time_slot: created.timeSlot, status: created.status as AppointmentStatus, reason: created.reason,
        created_at: iso(created.createdAt), updated_at: iso(created.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function updateAppointmentStatus(id: string, status: AppointmentStatus) {
  try {
    const updated = await prisma.appointment.update({ where: { id }, data: { status } });
    return {
      data: {
        id: updated.id, patient_id: updated.patientId, doctor_id: updated.doctorId, date: updated.date,
        time_slot: updated.timeSlot, status: updated.status as AppointmentStatus, reason: updated.reason,
        created_at: iso(updated.createdAt), updated_at: iso(updated.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

// ─── Medical Records ──────────────────────────────────────────────

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
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function getMedicalRecordsByDoctor(doctorId: string) {
  try {
    const records = await prisma.medicalRecord.findMany({
      where: { doctorId }, include: { patient: true, appointment: true }, orderBy: { createdAt: "desc" },
    });
    const result = records.map((r: any) => ({
      id: r.id, appointment_id: r.appointmentId, patient_id: r.patientId, doctor_id: r.doctorId,
      diagnosis: r.diagnosis,
      prescription: parseJsonField(r.prescription),
      vitals_json: parseJsonField(r.vitalsJson),
      notes: r.notes,
      created_at: iso(r.createdAt), updated_at: iso(r.updatedAt),
      patient: {
        id: r.patient.id, user_id: r.patient.id, full_name: r.patient.fullName,
        role: r.patient.role as UserRole, phone: r.patient.phone,
        created_at: iso(r.patient.createdAt), updated_at: iso(r.patient.updatedAt),
      },
      appointment: {
        id: r.appointment.id, patient_id: r.appointment.patientId, doctor_id: r.appointment.doctorId,
        date: r.appointment.date, time_slot: r.appointment.timeSlot,
        status: r.appointment.status as AppointmentStatus, reason: r.appointment.reason,
        created_at: iso(r.appointment.createdAt), updated_at: iso(r.appointment.updatedAt),
      },
    }));
    return { data: result as any, error: null };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function getMedicalRecordByAppointment(appointmentId: string) {
  try {
    const record = await prisma.medicalRecord.findUnique({
      where: { appointmentId }, include: { doctor: { include: { user: true } }, patient: true },
    });
    if (!record) return { data: null, error: new Error("Medical record not found") };
    return {
      data: {
        id: record.id, appointment_id: record.appointmentId, patient_id: record.patientId, doctor_id: record.doctorId,
        diagnosis: record.diagnosis,
        prescription: parseJsonField(record.prescription),
        vitals_json: parseJsonField(record.vitalsJson),
        notes: record.notes,
        created_at: iso(record.createdAt), updated_at: iso(record.updatedAt),
        doctor: record.doctor ? {
          id: record.doctor.id, profile_id: record.doctor.userId, specialization: record.doctor.specialization,
          license_number: record.doctor.licenseNumber, fee: record.doctor.fee, room_number: record.doctor.roomNumber,
          created_at: iso(record.doctor.createdAt), updated_at: iso(record.doctor.updatedAt),
          profiles: {
            id: record.doctor.user.id, user_id: record.doctor.user.id, full_name: record.doctor.user.fullName,
            role: record.doctor.user.role as UserRole, phone: record.doctor.user.phone,
            created_at: iso(record.doctor.user.createdAt), updated_at: iso(record.doctor.user.updatedAt),
          },
        } : null,
        patient: {
          id: record.patient.id, user_id: record.patient.id, full_name: record.patient.fullName,
          role: record.patient.role as UserRole, phone: record.patient.phone,
          created_at: iso(record.patient.createdAt), updated_at: iso(record.patient.updatedAt),
        },
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
}

export async function createMedicalRecord(record: MedicalRecordInsert) {
  try {
    const created = await prisma.medicalRecord.create({
      data: {
        appointmentId: record.appointment_id, patientId: record.patient_id, doctorId: record.doctor_id || undefined,
        diagnosis: record.diagnosis,
        prescription: typeof record.prescription === 'string' ? record.prescription : JSON.stringify(record.prescription || []),
        vitalsJson: typeof record.vitals_json === 'string' ? record.vitals_json : JSON.stringify(record.vitals_json || {}),
        notes: record.notes || null,
      },
    });
    return {
      data: {
        id: created.id, appointment_id: created.appointmentId, patient_id: created.patientId, doctor_id: created.doctorId,
        diagnosis: created.diagnosis,
        prescription: parseJsonField(created.prescription),
        vitals_json: parseJsonField(created.vitalsJson),
        notes: created.notes,
        created_at: iso(created.createdAt), updated_at: iso(created.updatedAt),
      } as any,
      error: null,
    };
  } catch (err) { return { data: null, error: err as Error }; }
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

export async function signOut() {
  try { await fetch("/api/auth/logout", { method: "POST" }); } catch { /* ignore */ }
}
