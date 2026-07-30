// ═══════════════════════════════════════════════════════════════════
//  Seed Script — Prisma
// ═══════════════════════════════════════════════════════════════════
//  Run with:  npx prisma db seed
//
//  Creates demo accounts & data for local development:
//    Admin:   admin@hospital.com / admin123
//    Doctor:  doctor@hospital.com / doctor123
//    Patient: patient@hospital.com / patient123
// ═══════════════════════════════════════════════════════════════════

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const salt = await bcrypt.genSalt(10);

  // ─── Helper: hash password ──────────────────────────────────────
  const hash = (pwd: string) => bcrypt.hash(pwd, salt);

  // ─── Demo Users ─────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@hospital.com" },
    update: {},
    create: {
      email: "admin@hospital.com",
      passwordHash: await hash("admin123"),
      fullName: "System Admin",
      role: "ADMIN",
      phone: "+1-555-0199",
    },
  });
  console.log(`  ✅ Admin: admin@hospital.com / admin123`);

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@hospital.com" },
    update: {},
    create: {
      email: "doctor@hospital.com",
      passwordHash: await hash("doctor123"),
      fullName: "Dr. Sarah Wilson",
      role: "DOCTOR",
      phone: "+1-555-0101",
    },
  });
  console.log(`  ✅ Doctor: doctor@hospital.com / doctor123`);

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@hospital.com" },
    update: {},
    create: {
      email: "patient@hospital.com",
      passwordHash: await hash("patient123"),
      fullName: "John Patient",
      role: "PATIENT",
      phone: "+1-555-0110",
    },
  });
  console.log(`  ✅ Patient: patient@hospital.com / patient123`);

  // ─── Extra Doctors ──────────────────────────────────────────────
  const doctor2User = await prisma.user.upsert({
    where: { email: "emily.carter@hospital.com" },
    update: {},
    create: {
      email: "emily.carter@hospital.com",
      passwordHash: await hash("Doctor123!"),
      fullName: "Dr. Emily Carter",
      role: "DOCTOR",
      phone: "+1-555-0102",
    },
  });

  const doctor3User = await prisma.user.upsert({
    where: { email: "james.wilson@hospital.com" },
    update: {},
    create: {
      email: "james.wilson@hospital.com",
      passwordHash: await hash("Doctor123!"),
      fullName: "Dr. James Wilson",
      role: "DOCTOR",
      phone: "+1-555-0103",
    },
  });

  // ─── Doctors Table ──────────────────────────────────────────────
  const doctor1 = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      userId: doctorUser.id,
      specialization: "Cardiology",
      licenseNumber: "LIC-MD-1001",
      fee: 250,
      roomNumber: "301A",
    },
  });

  await prisma.doctor.upsert({
    where: { userId: doctor2User.id },
    update: {},
    create: {
      userId: doctor2User.id,
      specialization: "Neurology",
      licenseNumber: "LIC-MD-1002",
      fee: 300,
      roomNumber: "205B",
    },
  });

  await prisma.doctor.upsert({
    where: { userId: doctor3User.id },
    update: {},
    create: {
      userId: doctor3User.id,
      specialization: "Pediatrics",
      licenseNumber: "LIC-MD-1003",
      fee: 200,
      roomNumber: "102C",
    },
  });

  // ─── Extra Patients ─────────────────────────────────────────────
  const patientNames = [
    { name: "Sarah Johnson", email: "sarah.j@example.com", phone: "+1-555-0201" },
    { name: "Michael Brown", email: "michael.b@example.com", phone: "+1-555-0202" },
    { name: "Emma Davis", email: "emma.d@example.com", phone: "+1-555-0203" },
    { name: "Lisa Anderson", email: "lisa.a@example.com", phone: "+1-555-0204" },
  ];

  const patientIds: string[] = [];
  for (const p of patientNames) {
    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {},
      create: {
        email: p.email,
        passwordHash: await hash("Patient123!"),
        fullName: p.name,
        role: "PATIENT",
        phone: p.phone,
      },
    });
    patientIds.push(user.id);
  }

  // ─── Appointments ───────────────────────────────────────────────
  const today = new Date();
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // Past appointments
  const pastAppts = [
    { patientIdx: 0, date: new Date(today.getTime() - 7 * 86400000), time: "09:00", status: "COMPLETED", reason: "Annual cardiac checkup" },
    { patientIdx: 1, date: new Date(today.getTime() - 5 * 86400000), time: "10:30", status: "COMPLETED", reason: "Migraine follow-up consultation" },
    { patientIdx: 2, date: new Date(today.getTime() - 3 * 86400000), time: "11:00", status: "COMPLETED", reason: "Pediatric vaccination" },
    { patientIdx: 3, date: new Date(today.getTime() - 2 * 86400000), time: "14:00", status: "COMPLETED", reason: "Annual physical examination" },
    { patientIdx: 0, date: new Date(today.getTime() - 1 * 86400000), time: "15:00", status: "CANCELLED", reason: "Chest pain evaluation" },
  ];

  for (const apt of pastAppts) {
    await prisma.appointment.upsert({
      where: {
        doctorId_date_timeSlot: {
          doctorId: doctor1.id,
          date: formatDate(apt.date),
          timeSlot: apt.time,
        },
      },
      update: {},
      create: {
        patientId: patientIds[apt.patientIdx],
        doctorId: doctor1.id,
        date: formatDate(apt.date),
        timeSlot: apt.time,
        status: apt.status,
        reason: apt.reason,
      },
    });
  }

  // Upcoming appointments
  const upcomingAppts = [
    { patientIdx: 1, date: new Date(today.getTime() + 3 * 86400000), time: "09:00", status: "CONFIRMED", reason: "MRI results review" },
    { patientIdx: 2, date: new Date(today.getTime() + 5 * 86400000), time: "10:30", status: "CONFIRMED", reason: "General health checkup" },
    { patientIdx: 3, date: new Date(today.getTime() + 7 * 86400000), time: "14:00", status: "PENDING", reason: "Heart murmur evaluation" },
    { patientIdx: 0, date: new Date(today.getTime() + 10 * 86400000), time: "11:00", status: "PENDING", reason: "Knee pain assessment" },
  ];

  for (const apt of upcomingAppts) {
    await prisma.appointment.upsert({
      where: {
        doctorId_date_timeSlot: {
          doctorId: doctor1.id,
          date: formatDate(apt.date),
          timeSlot: apt.time,
        },
      },
      update: {},
      create: {
        patientId: patientIds[apt.patientIdx],
        doctorId: doctor1.id,
        date: formatDate(apt.date),
        timeSlot: apt.time,
        status: apt.status,
        reason: apt.reason,
      },
    });
  }

  console.log(`  ✅ 5 past appointments + 4 upcoming appointments created`);
  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
