// ═══════════════════════════════════════════════════════════════════
//  Supabase Type Definitions
//  Generated from src/lib/schema.sql — keep in sync manually.
// ═══════════════════════════════════════════════════════════════════
//  These types mirror the PostgreSQL tables defined in schema.sql.
//  They are used by src/lib/supabase.ts to provide end-to-end type
//  safety when querying Supabase.
//
//  For full auto-generated types run:
//    npx supabase gen types typescript --linked > src/types/supabase.ts
// ═══════════════════════════════════════════════════════════════════

// ─── Enum Types ───────────────────────────────────────────────────
export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";
export type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

// ─── Row Types (maps 1:1 with PostgreSQL tables) ──────────────────

export interface ProfileRow {
  id: string;
  user_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface DoctorRow {
  id: string;
  profile_id: string;
  specialization: string;
  license_number: string;
  fee: number;
  room_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppointmentRow {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time_slot: string;
  status: AppointmentStatus;
  reason: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalRecordRow {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string | null;
  diagnosis: string;
  prescription: Record<string, unknown>[];
  vitals_json: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Insert Types (omit auto-generated fields) ─────────────────────

export interface ProfileInsert
  extends Omit<ProfileRow, "id" | "created_at" | "updated_at"> {}

export interface DoctorInsert
  extends Omit<DoctorRow, "id" | "created_at" | "updated_at"> {}

export interface AppointmentInsert
  extends Omit<AppointmentRow, "id" | "created_at" | "updated_at"> {}

export interface MedicalRecordInsert
  extends Omit<MedicalRecordRow, "id" | "created_at" | "updated_at"> {}

// ─── Update Types (all fields optional) ────────────────────────────

export interface ProfileUpdate
  extends Partial<Omit<ProfileRow, "id" | "created_at" | "updated_at">> {}

export interface DoctorUpdate
  extends Partial<Omit<DoctorRow, "id" | "created_at" | "updated_at">> {}

export interface AppointmentUpdate
  extends Partial<Omit<AppointmentRow, "id" | "created_at" | "updated_at">> {}

export interface MedicalRecordUpdate
  extends Partial<Omit<MedicalRecordRow, "id" | "created_at" | "updated_at">> {}


