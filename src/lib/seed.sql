-- ═══════════════════════════════════════════════════════════════════
--  Hospital Management System — Seed Data
-- ═══════════════════════════════════════════════════════════════════
--  Run this in the Supabase SQL Editor (requires service_role to
--  insert into auth.users). If you don't have service_role access:
--    1. Create auth users manually via Supabase Dashboard > Authentication
--    2. Replace the auth.user UUIDs below with the real IDs
--    3. Remove the auth.users INSERT section
--    4. Run the rest of the script
--
--  Usage:       Paste into Supabase SQL Editor and click "Run"
--  Reset:       DELETE FROM medical_records; DELETE FROM appointments;
--               DELETE FROM doctors; DELETE FROM profiles;
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
--  Disable RLS & triggers temporarily for faster seeding
--  (Comment these out if you want RLS enforced during seeding)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE profiles      DISABLE ROW LEVEL SECURITY;
ALTER TABLE doctors       DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  DISABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records DISABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
--  SECTION 1 — Auth Users (requires service_role)
--  Create placeholder auth.users so profiles FK constraint is satisfied.
--  Omit this section if your auth.users already exist, and replace
--  the user_id values below with your real auth.user UUIDs.
-- ═══════════════════════════════════════════════════════════════════
--  NOTE: auth.users columns vary by Supabase version. The minimal
--  insert below covers the most common schema. If it fails, create
--  users via Dashboard > Authentication and use those UUIDs instead.
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_sent_at)
VALUES
  -- ── Doctors ──────────────────────────────────────────────────
  ('a0000000-0000-0000-0000-000000000001', 'emily.carter@hospital.com',  crypt('Doctor123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Dr. Emily Carter","role":"DOCTOR"}',  NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'james.wilson@hospital.com',   crypt('Doctor123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Dr. James Wilson","role":"DOCTOR"}',   NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'robert.chen@hospital.com',   crypt('Doctor123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Dr. Robert Chen","role":"DOCTOR"}',   NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000004', 'sarah.patel@hospital.com',   crypt('Doctor123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Dr. Sarah Patel","role":"DOCTOR"}',   NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000005', 'michael.torres@hospital.com',crypt('Doctor123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Dr. Michael Torres","role":"DOCTOR"}', NOW(), NOW(), NOW()),
  -- ── Patients ────────────────────────────────────────────────
  ('a0000000-0000-0000-0000-000000000010', 'sarah.johnson@example.com',  crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Sarah Johnson","role":"PATIENT"}',       NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000011', 'michael.brown@example.com',  crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Michael Brown","role":"PATIENT"}',       NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000012', 'emma.davis@example.com',     crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Emma Davis","role":"PATIENT"}',         NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000013', 'james.miller@example.com',   crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"James Miller","role":"PATIENT"}',       NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000014', 'lisa.anderson@example.com',  crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Lisa Anderson","role":"PATIENT"}',      NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000015', 'robert.taylor@example.com',  crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Robert Taylor","role":"PATIENT"}',      NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000016', 'jennifer.white@example.com', crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Jennifer White","role":"PATIENT"}',     NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000017', 'william.garcia@example.com', crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"William Garcia","role":"PATIENT"}',     NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000018', 'amanda.clark@example.com',   crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Amanda Clark","role":"PATIENT"}',       NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000019', 'daniel.lee@example.com',     crypt('Patient123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}',  '{"full_name":"Daniel Lee","role":"PATIENT"}',         NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Admin (create separately so the section above stays clean)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_sent_at)
VALUES
  ('a0000000-0000-0000-0000-000000000099', 'admin@hospital.com', crypt('Admin123!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin","role":"ADMIN"}', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
--  SECTION 2 — Profiles
--  5 doctors + 10 patients + 1 admin
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO profiles (id, user_id, full_name, role, phone, created_at, updated_at)
VALUES
  -- ── Doctors ──────────────────────────────────────────────────
  ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Dr. Emily Carter',    'DOCTOR', '+1-555-0101', '2025-01-15 08:00:00+00', '2025-01-15 08:00:00+00'),
  ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Dr. James Wilson',    'DOCTOR', '+1-555-0102', '2025-02-01 08:00:00+00', '2025-02-01 08:00:00+00'),
  ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Dr. Robert Chen',     'DOCTOR', '+1-555-0103', '2024-11-20 08:00:00+00', '2024-11-20 08:00:00+00'),
  ('p0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'Dr. Sarah Patel',     'DOCTOR', '+1-555-0104', '2025-03-10 08:00:00+00', '2025-03-10 08:00:00+00'),
  ('p0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000005', 'Dr. Michael Torres',  'DOCTOR', '+1-555-0105', '2024-09-05 08:00:00+00', '2024-09-05 08:00:00+00'),

  -- ── Patients ────────────────────────────────────────────────
  ('p0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000010', 'Sarah Johnson',   'PATIENT', '+1-555-0110', '2025-06-01 10:00:00+00', '2025-06-01 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000011', 'Michael Brown',   'PATIENT', '+1-555-0111', '2025-06-02 10:00:00+00', '2025-06-02 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000012', 'Emma Davis',      'PATIENT', '+1-555-0112', '2025-06-03 10:00:00+00', '2025-06-03 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000013', 'James Miller',    'PATIENT', '+1-555-0113', '2025-06-05 10:00:00+00', '2025-06-05 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000014', 'Lisa Anderson',   'PATIENT', '+1-555-0114', '2025-06-07 09:00:00+00', '2025-06-07 09:00:00+00'),
  ('p0000000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000015', 'Robert Taylor',   'PATIENT', '+1-555-0115', '2025-06-10 10:00:00+00', '2025-06-10 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000016', 'Jennifer White',  'PATIENT', '+1-555-0116', '2025-06-12 10:00:00+00', '2025-06-12 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000017', 'William Garcia',  'PATIENT', '+1-555-0117', '2025-06-15 11:00:00+00', '2025-06-15 11:00:00+00'),
  ('p0000000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000018', 'Amanda Clark',    'PATIENT', '+1-555-0118', '2025-06-18 10:00:00+00', '2025-06-18 10:00:00+00'),
  ('p0000000-0000-0000-0000-000000000019', 'a0000000-0000-0000-0000-000000000019', 'Daniel Lee',      'PATIENT', '+1-555-0119', '2025-06-20 10:00:00+00', '2025-06-20 10:00:00+00'),

  -- ── Admin ────────────────────────────────────────────────────
  ('p0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000099', 'System Admin',    'ADMIN',  '+1-555-0199', '2024-01-01 00:00:00+00', '2024-01-01 00:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
--  SECTION 3 — Doctors
--  5 doctors across different specialties
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO doctors (id, profile_id, specialization, license_number, fee, room_number, created_at, updated_at)
VALUES
  ('d0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Cardiology',       'LIC-MD-1001', 250.00, '301A', '2025-01-15 08:00:00+00', '2025-01-15 08:00:00+00'),
  ('d0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Neurology',        'LIC-MD-1002', 300.00, '205B', '2025-02-01 08:00:00+00', '2025-02-01 08:00:00+00'),
  ('d0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'Pediatrics',       'LIC-MD-1003', 200.00, '102C', '2024-11-20 08:00:00+00', '2024-11-20 08:00:00+00'),
  ('d0000000-0000-0000-0000-000000000004', 'p0000000-0000-0000-0000-000000000004', 'General Medicine', 'LIC-MD-1004', 150.00, '110A', '2025-03-10 08:00:00+00', '2025-03-10 08:00:00+00'),
  ('d0000000-0000-0000-0000-000000000005', 'p0000000-0000-0000-0000-000000000005', 'Orthopedics',      'LIC-MD-1005', 275.00, '402D', '2024-09-05 08:00:00+00', '2024-09-05 08:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
--  SECTION 4 — Appointments
--  8 past appointments (COMPLETED or CANCELLED)
--  5 upcoming appointments (PENDING or CONFIRMED)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO appointments (id, patient_id, doctor_id, date, time_slot, status, reason, created_at, updated_at)
VALUES

  -- ── 8 Past Appointments ──────────────────────────────────────
  -- Past: Sarah Johnson × Dr. Emily Carter (Cardiology) — routine checkup
  ('ap-000001-0000-0000-0000-000000000001',
   'p0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001',
   '2026-07-10', '09:00:00', 'COMPLETED', 'Annual cardiac checkup and stress test',
   '2026-06-20 08:00:00+00', '2026-07-10 10:00:00+00'),

  -- Past: Michael Brown × Dr. James Wilson (Neurology) — migraine follow-up
  ('ap-000002-0000-0000-0000-000000000002',
   'p0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002',
   '2026-07-12', '10:30:00', 'COMPLETED', 'Follow-up on chronic migraine treatment',
   '2026-06-25 09:00:00+00', '2026-07-12 11:30:00+00'),

  -- Past: Emma Davis × Dr. Robert Chen (Pediatrics) — child vaccination
  ('ap-000003-0000-0000-0000-000000000003',
   'p0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000003',
   '2026-07-14', '11:00:00', 'COMPLETED', 'Routine pediatric vaccination',
   '2026-07-01 10:00:00+00', '2026-07-14 11:45:00+00'),

  -- Past: James Miller × Dr. Sarah Patel (General Medicine) — annual physical
  ('ap-000004-0000-0000-0000-000000000004',
   'p0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000004',
   '2026-07-15', '14:00:00', 'COMPLETED', 'Annual physical examination',
   '2026-07-02 11:00:00+00', '2026-07-15 15:00:00+00'),

  -- Past: Lisa Anderson × Dr. Michael Torres (Orthopedics) — knee pain
  ('ap-000005-0000-0000-0000-000000000005',
   'p0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005',
   '2026-07-18', '09:00:00', 'COMPLETED', 'Persistent right knee pain after running',
   '2026-07-05 09:00:00+00', '2026-07-18 10:15:00+00'),

  -- Past: Robert Taylor × Dr. Emily Carter (Cardiology) — cancelled
  ('ap-000006-0000-0000-0000-000000000006',
   'p0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000001',
   '2026-07-20', '15:00:00', 'CANCELLED', 'Chest pain evaluation',
   '2026-07-08 14:00:00+00', '2026-07-19 16:00:00+00'),

  -- Past: Jennifer White × Dr. Michael Torres (Orthopedics) — post-surgery
  ('ap-000007-0000-0000-0000-000000000007',
   'p0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000005',
   '2026-07-22', '11:00:00', 'COMPLETED', 'Post-operative follow-up after ACL reconstruction',
   '2026-07-10 10:00:00+00', '2026-07-22 12:00:00+00'),

  -- Past: Amanda Clark × Dr. Robert Chen (Pediatrics) — completed checkup
  ('ap-000008-0000-0000-0000-000000000008',
   'p0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000003',
   '2026-07-23', '09:30:00', 'COMPLETED', 'Child wellness check and growth assessment',
   '2026-07-12 08:00:00+00', '2026-07-23 10:00:00+00'),

  -- ── 5 Upcoming Appointments ──────────────────────────────────
  -- Upcoming: Sarah Johnson × Dr. James Wilson (Neurology) — MRI review
  ('ap-000009-0000-0000-0000-000000000009',
   'p0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000002',
   CURRENT_DATE + INTERVAL '3 days', '09:00:00', 'CONFIRMED',
   'MRI results review and follow-up consultation',
   NOW(), NOW()),

  -- Upcoming: Michael Brown × Dr. Sarah Patel (General Medicine) — checkup
  ('ap-000010-0000-0000-0000-000000000010',
   'p0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000004',
   CURRENT_DATE + INTERVAL '5 days', '10:30:00', 'CONFIRMED',
   'General health checkup and blood work review',
   NOW(), NOW()),

  -- Upcoming: Emma Davis × Dr. Emily Carter (Cardiology) — heart murmur
  ('ap-000011-0000-0000-0000-000000000011',
   'p0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000001',
   CURRENT_DATE + INTERVAL '7 days', '14:00:00', 'CONFIRMED',
   'Heart murmur evaluation and echocardiogram',
   NOW(), NOW()),

  -- Upcoming: James Miller × Dr. Michael Torres (Orthopedics) — shoulder pain
  ('ap-000012-0000-0000-0000-000000000012',
   'p0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000005',
   CURRENT_DATE + INTERVAL '10 days', '11:00:00', 'PENDING',
   'Left shoulder pain and mobility assessment',
   NOW(), NOW()),

  -- Upcoming: Daniel Lee × Dr. Sarah Patel (General Medicine) — diabetes follow-up
  ('ap-000013-0000-0000-0000-000000000013',
   'p0000000-0000-0000-0000-000000000019', 'd0000000-0000-0000-0000-000000000004',
   CURRENT_DATE + INTERVAL '14 days', '15:30:00', 'PENDING',
   'Type 2 diabetes management follow-up',
   NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
--  SECTION 5 — Medical Records (for the 8 past appointments)
--  Each completed appointment gets a record with diagnosis,
--  prescription, vitals, and clinical notes.
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO medical_records (id, appointment_id, patient_id, doctor_id, diagnosis, prescription, vitals_json, notes, created_at, updated_at)
VALUES

  -- 1. Sarah Johnson × Dr. Emily Carter — Cardiology checkup
  ('mr-000001-0000-0000-0000-000000000001',
   'ap-000001-0000-0000-0000-000000000001',
   'p0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000001',
   'Mild hypertension (Stage 1). Normal stress test results. No arrhythmias detected.',
   '[{"medication":"Lisinopril","dosage":"10 mg","frequency":"Once daily","duration":"30 days","instructions":"Take in the morning with food"},{"medication":"Aspirin","dosage":"81 mg","frequency":"Once daily","duration":"90 days","instructions":"Low-dose, take after breakfast"}]',
   '{"blood_pressure":"138/88","heart_rate":"72 bpm","temperature":"98.6°F","weight":"165 lbs","height":"5 ft 6 in","oxygen_saturation":"98%"}',
   'Patient reports occasional headaches and mild dizziness. Advised lifestyle modifications including reduced sodium intake and 30 minutes of moderate exercise daily. Follow-up scheduled in 3 months.',
   '2026-07-10 10:00:00+00', '2026-07-10 10:00:00+00'),

  -- 2. Michael Brown × Dr. James Wilson — Migraine follow-up
  ('mr-000002-0000-0000-0000-000000000002',
   'ap-000002-0000-0000-0000-000000000002',
   'p0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000002',
   'Chronic migraine without aura. Improvement since last visit. Frequency reduced from 4x/week to 2x/week.',
   '[{"medication":"Sumatriptan","dosage":"50 mg","frequency":"As needed","duration":"30 days","instructions":"Take at first sign of migraine, max 2 per day"},{"medication":"Topiramate","dosage":"25 mg","frequency":"Once daily at bedtime","duration":"90 days","instructions":"Increase to 50 mg after 2 weeks if tolerated"}]',
   '{"blood_pressure":"122/78","heart_rate":"68 bpm","temperature":"98.4°F","weight":"178 lbs","oxygen_saturation":"99%"}',
   'Patient reports significant improvement with current regimen. Recommended continued hydration and regular sleep schedule. Ordered MRI to rule out other causes. Return in 2 months.',
   '2026-07-12 11:30:00+00', '2026-07-12 11:30:00+00'),

  -- 3. Emma Davis × Dr. Robert Chen — Pediatric vaccination
  ('mr-000003-0000-0000-0000-000000000003',
   'ap-000003-0000-0000-0000-000000000003',
   'p0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000003',
   'Routine pediatric visit. Patient is healthy and meeting all developmental milestones for age 4.',
   '[]',
   '{"blood_pressure":"100/62","heart_rate":"95 bpm","temperature":"98.2°F","weight":"36 lbs","height":"3 ft 2 in","oxygen_saturation":"100%"}',
   'Administered DTaP and IPV boosters. Parent counseled on age-appropriate nutrition and safety. Next well-child visit scheduled in 6 months.',
   '2026-07-14 11:45:00+00', '2026-07-14 11:45:00+00'),

  -- 4. James Miller × Dr. Sarah Patel — Annual physical
  ('mr-000004-0000-0000-0000-000000000004',
   'ap-000004-0000-0000-0000-000000000004',
   'p0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000004',
   'Overall healthy adult male. Elevated LDL cholesterol detected. Pre-diabetic glucose levels noted.',
   '[{"medication":"Atorvastatin","dosage":"20 mg","frequency":"Once daily at bedtime","duration":"90 days","instructions":"Take at same time each night. Avoid grapefruit juice."}]',
   '{"blood_pressure":"128/84","heart_rate":"74 bpm","temperature":"98.6°F","weight":"192 lbs","height":"5 ft 11 in","oxygen_saturation":"97%","glucose_fasting":"112 mg/dL","total_cholesterol":"245 mg/dL","ldl":"160 mg/dL","hdl":"38 mg/dL"}',
   'Patient informed about pre-diabetes risk. Dietary counseling provided — recommended Mediterranean diet. Lab orders placed for HbA1c and comprehensive metabolic panel. Follow-up in 1 month for lab review.',
   '2026-07-15 15:00:00+00', '2026-07-15 15:00:00+00'),

  -- 5. Lisa Anderson × Dr. Michael Torres — Knee pain
  ('mr-000005-0000-0000-0000-000000000005',
   'ap-000005-0000-0000-0000-000000000005',
   'p0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000005',
   'Patellofemoral pain syndrome (runner''s knee) in right knee. Mild joint effusion noted. No ligamentous instability.',
   '[{"medication":"Ibuprofen","dosage":"600 mg","frequency":"Three times daily with food","duration":"14 days","instructions":"Take with food. Discontinue if GI upset occurs."},{"medication":"Acetaminophen","dosage":"500 mg","frequency":"As needed for pain","duration":"14 days","instructions":"Max 3000 mg per day. Do not combine with other acetaminophen products."}]',
   '{"blood_pressure":"118/76","heart_rate":"70 bpm","temperature":"98.4°F","weight":"145 lbs","oxygen_saturation":"99%"}',
   'Recommended 4 weeks of physical therapy focusing on quadriceps and hip strengthening. Activity modification — switch to low-impact exercises (swimming, cycling). Prescribed knee brace for running. Follow-up in 6 weeks with MRI if no improvement.',
   '2026-07-18 10:15:00+00', '2026-07-18 10:15:00+00'),

  -- 6. Jennifer White × Dr. Michael Torres — Post-surgery follow-up
  ('mr-000007-0000-0000-0000-000000000007',
   'ap-000007-0000-0000-0000-000000000007',
   'p0000000-0000-0000-0000-000000000016', 'd0000000-0000-0000-0000-000000000005',
   'Post-operative status 6 weeks after ACL reconstruction (right knee). Incision healing well. Range of motion improving gradually.',
   '[{"medication":"Celecoxib","dosage":"200 mg","frequency":"Once daily","duration":"30 days","instructions":"Take with food. Report any signs of swelling or rash."},{"medication":"Oxycodone","dosage":"5 mg","frequency":"Every 6 hours as needed","duration":"7 days","instructions":"Only for breakthrough pain. May cause drowsiness."}]',
   '{"blood_pressure":"120/80","heart_rate":"72 bpm","temperature":"98.2°F","weight":"160 lbs","oxygen_saturation":"99%"}',
   'Incision site clean and dry, sutures removed. Range of motion: 0-110 degrees flexion. Mild swelling controlled with ice. Continue physical therapy 3x/week. Progress to phase 2 of rehab protocol. No running or jumping for 4 more weeks.',
   '2026-07-22 12:00:00+00', '2026-07-22 12:00:00+00'),

  -- 7. Amanda Clark × Dr. Robert Chen — Child wellness check
  ('mr-000008-0000-0000-0000-000000000008',
   'ap-000008-0000-0000-0000-000000000008',
   'p0000000-0000-0000-0000-000000000018', 'd0000000-0000-0000-0000-000000000003',
   'Well-child check at 18 months. Normal growth and development. All milestones achieved for age.',
   '[]',
   '{"blood_pressure":"98/58","heart_rate":"110 bpm","temperature":"98.0°F","weight":"24 lbs","height":"2 ft 9 in","oxygen_saturation":"100%"}',
   'Growth parameters tracking at 50th percentile. Immunizations up to date. Parent education provided on toddler nutrition, sleep safety, and language development. Next visit at 24 months.',
   '2026-07-23 10:00:00+00', '2026-07-23 10:00:00+00'),

  -- 8. Robert Taylor × Dr. Emily Carter — Cancelled (no record, so we skip this one)
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
--  Re-enable RLS
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
--  Verify seed data
-- ═══════════════════════════════════════════════════════════════════
SELECT 'profiles' AS table_name, COUNT(*) AS row_count FROM profiles
UNION ALL
SELECT 'doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'medical_records', COUNT(*) FROM medical_records
ORDER BY table_name;
