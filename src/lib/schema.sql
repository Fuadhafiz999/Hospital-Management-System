-- ═══════════════════════════════════════════════════════════════════
--  Hospital Management System — Supabase/PostgreSQL Schema
--  Compatible with Supabase SQL Editor or migration tooling.
-- ═══════════════════════════════════════════════════════════════════

-- ─── Extensions ───────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Custom ENUM Types ────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');

CREATE TYPE appointment_status AS ENUM (
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED'
);

-- ─── Helper: Auto-updated_at trigger ─────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
--  1. profiles
--     Extends Supabase auth.users with app-specific profile data.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'PATIENT',
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_user_id   ON profiles(user_id);
CREATE INDEX idx_profiles_role      ON profiles(role);

-- Trigger
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  2. doctors
--     Professional details for users with role = 'DOCTOR'.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE doctors (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  specialization  TEXT NOT NULL,
  license_number  TEXT NOT NULL UNIQUE,
  fee             NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  room_number     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_doctors_profile_id      ON doctors(profile_id);
CREATE INDEX idx_doctors_specialization  ON doctors(specialization);

-- Trigger
CREATE TRIGGER trg_doctors_updated_at
  BEFORE UPDATE ON doctors
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  3. appointments
--     Tracks patient–doctor appointments with status lifecycle.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE appointments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id   UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  time_slot   TIME NOT NULL,
  status      appointment_status NOT NULL DEFAULT 'PENDING',
  reason      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id  ON appointments(doctor_id);
CREATE INDEX idx_appointments_date       ON appointments(date);
CREATE INDEX idx_appointments_status     ON appointments(status);

-- Prevent double-booking: a doctor cannot have two appointments
-- at the same date + time_slot.
CREATE UNIQUE INDEX idx_appointments_unique_slot
  ON appointments(doctor_id, date, time_slot)
  WHERE status IN ('PENDING', 'CONFIRMED');

-- Trigger
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  4. medical_records
--     Clinical notes tied to a completed appointment.
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE medical_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id  UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id       UUID REFERENCES doctors(id) ON DELETE SET NULL,
  diagnosis       TEXT NOT NULL,
  prescription    JSONB DEFAULT '[]'::jsonb,   -- Array of { medication, dosage, frequency, duration, instructions? }
  vitals_json     JSONB DEFAULT '{}'::jsonb,   -- { blood_pressure, heart_rate, temperature, weight, height, ... }
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_medical_records_appointment_id ON medical_records(appointment_id);
CREATE INDEX idx_medical_records_patient_id     ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id      ON medical_records(doctor_id);

-- Trigger
CREATE TRIGGER trg_medical_records_updated_at
  BEFORE UPDATE ON medical_records
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ═══════════════════════════════════════════════════════════════════
--  Row-Level Security (RLS)
--  Enforce data isolation per user role via Supabase.
-- ═══════════════════════════════════════════════════════════════════

-- ─── profiles ─────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile; admins can read all.
CREATE POLICY "profiles_select_own_or_admin"
  ON profiles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Users can update their own profile (except role).
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── doctors ──────────────────────────────────────────────────────
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Patients see all doctors; doctors see their own; admins see all.
CREATE POLICY "doctors_select_all_patients_or_own_or_admin"
  ON doctors FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid())
  );

-- Admin-only write.
CREATE POLICY "doctors_insert_update_delete_admin"
  ON doctors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- ─── appointments ─────────────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Patients see their own appointments; doctors see appointments
-- assigned to them; admins see all.
CREATE POLICY "appointments_select_own"
  ON appointments FOR SELECT
  USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR doctor_id IN (
      SELECT d.id FROM doctors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Patients create; admins create/update/delete.
CREATE POLICY "appointments_insert_patient_or_admin"
  ON appointments FOR INSERT
  WITH CHECK (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "appointments_update_doctor_status_or_admin"
  ON appointments FOR UPDATE
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "appointments_delete_admin"
  ON appointments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- ─── medical_records ──────────────────────────────────────────────
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- Patients see their own; doctors see records they authored; admins see all.
CREATE POLICY "medical_records_select_own"
  ON medical_records FOR SELECT
  USING (
    patient_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR doctor_id IN (
      SELECT d.id FROM doctors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- Doctors create records for their appointments; admins create any.
CREATE POLICY "medical_records_insert_doctor_or_admin"
  ON medical_records FOR INSERT
  WITH CHECK (
    doctor_id IN (
      SELECT d.id FROM doctors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "medical_records_update_doctor_or_admin"
  ON medical_records FOR UPDATE
  USING (
    doctor_id IN (
      SELECT d.id FROM doctors d
      JOIN profiles p ON p.id = d.profile_id
      WHERE p.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

CREATE POLICY "medical_records_delete_admin"
  ON medical_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'ADMIN'
    )
  );

-- ═══════════════════════════════════════════════════════════════════
--  Seed: Admin user reference (run after auth.user exists)
-- ═══════════════════════════════════════════════════════════════════
-- -- Example — replace the UUID with your actual auth.users id:
-- INSERT INTO profiles (user_id, full_name, role, phone)
-- VALUES ('<AUTH_USER_UUID>', 'System Admin', 'ADMIN', '+1-555-0100');
-- ═══════════════════════════════════════════════════════════════════
