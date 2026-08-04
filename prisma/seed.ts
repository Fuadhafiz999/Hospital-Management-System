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

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

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

  const doctor2 = await prisma.doctor.upsert({
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

  // ─── Departments ────────────────────────────────────────────────
  const departments = [
    { name: "Cardiology", description: "Heart and cardiovascular care", icon: "❤️", color: "bg-red-50 text-red-600", doctorId: doctor1.id },
    { name: "Neurology", description: "Brain and nervous system care", icon: "🧠", color: "bg-purple-50 text-purple-600", doctorId: doctor2.id },
    { name: "Pediatrics", description: "Medical care for infants and children", icon: "👶", color: "bg-blue-50 text-blue-600", doctorId: doctor3User ? (await prisma.doctor.findUnique({ where: { userId: doctor3User.id } }))?.id : undefined },
    { name: "General Medicine", description: "Primary and preventive care", icon: "🏥", color: "bg-indigo-50 text-indigo-600" },
    { name: "Orthopedics", description: "Bones, joints, and muscles", icon: "🦴", color: "bg-amber-50 text-amber-600" },
    { name: "Dermatology", description: "Skin, hair, and nails", icon: "🔬", color: "bg-green-50 text-green-600" },
  ];

  const departmentByName: Record<string, string> = {};
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { name: dept.name },
      update: { description: dept.description, icon: dept.icon, color: dept.color, headDoctorId: dept.doctorId ?? null },
      create: {
        name: dept.name,
        description: dept.description,
        icon: dept.icon,
        color: dept.color,
        headDoctorId: dept.doctorId ?? null,
      },
    });
    departmentByName[dept.name] = created.id;
  }

  // Link doctors to departments
  await prisma.doctor.update({
    where: { id: doctor1.id },
    data: { departmentId: departmentByName["Cardiology"] },
  });
  await prisma.doctor.update({
    where: { id: doctor2.id },
    data: { departmentId: departmentByName["Neurology"] },
  });
  console.log(`  ✅ ${departments.length} departments created`);

  // ─── Beds ───────────────────────────────────────────────────────
  const wards: { ward: string; departmentName?: string; beds: { number: string; status: string; patientIdx?: number; doctorId?: string; notes?: string; daysAgo?: number }[] }[] = [
    {
      ward: "Ward A",
      departmentName: "General Medicine",
      beds: [
        { number: "A-01", status: "occupied", patientIdx: 1, doctorId: doctor1.id, daysAgo: 3 },
        { number: "A-02", status: "available" },
        { number: "A-03", status: "occupied", patientIdx: 2, doctorId: doctor2.id, daysAgo: 1 },
        { number: "A-04", status: "maintenance", notes: "AC repair needed" },
        { number: "A-05", status: "available" },
        { number: "A-06", status: "occupied", patientIdx: 3, doctorId: doctor2.id, daysAgo: 5 },
        { number: "A-07", status: "available" },
        { number: "A-08", status: "occupied", patientIdx: 0, doctorId: doctor1.id, daysAgo: 2 },
      ],
    },
    {
      ward: "Ward B",
      departmentName: "Orthopedics",
      beds: [
        { number: "B-01", status: "occupied", patientIdx: 0, doctorId: doctor1.id, daysAgo: 4 },
        { number: "B-02", status: "occupied", patientIdx: 1, doctorId: doctor2.id, daysAgo: 6 },
        { number: "B-03", status: "available" },
        { number: "B-04", status: "maintenance", notes: "Bed replacement" },
        { number: "B-05", status: "occupied", patientIdx: 2, doctorId: doctor1.id, daysAgo: 7 },
        { number: "B-06", status: "available" },
      ],
    },
    {
      ward: "Intensive Care Unit",
      departmentName: "Cardiology",
      beds: [
        { number: "ICU-01", status: "occupied", patientIdx: 3, doctorId: doctor2.id, daysAgo: 1 },
        { number: "ICU-02", status: "occupied", patientIdx: 0, doctorId: doctor1.id, daysAgo: 2 },
        { number: "ICU-03", status: "occupied", patientIdx: 1, doctorId: doctor1.id, daysAgo: 3 },
        { number: "ICU-04", status: "available" },
        { number: "ICU-05", status: "maintenance", notes: "Ventilator calibration" },
        { number: "ICU-06", status: "occupied", patientIdx: 2, doctorId: doctor2.id, daysAgo: 4 },
      ],
    },
    {
      ward: "Private Rooms",
      departmentName: "General Medicine",
      beds: [
        { number: "P-01", status: "occupied", patientIdx: 0, doctorId: doctor2.id, daysAgo: 8 },
        { number: "P-02", status: "available" },
        { number: "P-03", status: "available" },
        { number: "P-04", status: "occupied", patientIdx: 3, doctorId: doctor1.id, daysAgo: 2 },
      ],
    },
    {
      ward: "Maternity Ward",
      departmentName: "Pediatrics",
      beds: [
        { number: "M-01", status: "occupied", patientIdx: 1, doctorId: doctor2.id, daysAgo: 1 },
        { number: "M-02", status: "occupied", patientIdx: 2, doctorId: doctor1.id, daysAgo: 2 },
        { number: "M-03", status: "available" },
        { number: "M-04", status: "available" },
        { number: "M-05", status: "maintenance", notes: "Painting in progress" },
        { number: "M-06", status: "available" },
      ],
    },
  ];

  for (const ward of wards) {
    const departmentId = ward.departmentName ? departmentByName[ward.departmentName] : undefined;
    for (const bed of ward.beds) {
      const patientId = bed.patientIdx !== undefined ? patientIds[bed.patientIdx] : undefined;
      const admittedSince = bed.daysAgo !== undefined
        ? new Date(Date.now() - bed.daysAgo * 86400000)
        : null;
      await prisma.bed.upsert({
        where: { number: bed.number },
        update: {
          ward: ward.ward,
          status: bed.status,
          departmentId: departmentId ?? null,
          patientId: patientId ?? null,
          doctorId: bed.doctorId ?? null,
          admittedSince,
          notes: bed.notes ?? null,
        },
        create: {
          number: bed.number,
          ward: ward.ward,
          status: bed.status,
          departmentId: departmentId ?? null,
          patientId: patientId ?? null,
          doctorId: bed.doctorId ?? null,
          admittedSince,
          notes: bed.notes ?? null,
        },
      });
    }
  }
  console.log(`  ✅ ${wards.reduce((sum, w) => sum + w.beds.length, 0)} beds created across ${wards.length} wards`);

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

  // ─── Invoices ───────────────────────────────────────────────────
  const invoices = [
    { number: "INV-001", patientIdx: 0, description: "Cardiology consultation", amount: 250, status: "paid", method: "Card", daysAgo: 7 },
    { number: "INV-002", patientIdx: 1, description: "Neurology consultation", amount: 180, status: "pending", method: null, daysAgo: 5 },
    { number: "INV-003", patientIdx: 2, description: "Pediatric vaccination", amount: 450, status: "paid", method: "Insurance", daysAgo: 3 },
    { number: "INV-004", patientIdx: 0, description: "General physical examination", amount: 120, status: "overdue", method: null, daysAgo: 2 },
    { number: "INV-005", patientIdx: 3, description: "Orthopedic consultation", amount: 320, status: "paid", method: "Card", daysAgo: 2 },
    { number: "INV-006", patientIdx: 1, description: "MRI scan", amount: 600, status: "pending", method: null, daysAgo: 1 },
    { number: "INV-007", patientIdx: 2, description: "General checkup", amount: 200, status: "paid", method: "Cash", daysAgo: 1 },
  ];

  for (const inv of invoices) {
    const due = new Date(Date.now() + 30 * 86400000);
    await prisma.invoice.upsert({
      where: { invoiceNumber: inv.number },
      update: {
        description: inv.description,
        amount: inv.amount,
        status: inv.status,
        method: inv.method,
        dueDate: due,
        paidAt: inv.status === "paid" ? new Date(Date.now() - inv.daysAgo * 86400000) : null,
      },
      create: {
        invoiceNumber: inv.number,
        patientId: patientIds[inv.patientIdx],
        description: inv.description,
        amount: inv.amount,
        status: inv.status,
        method: inv.method,
        dueDate: due,
        paidAt: inv.status === "paid" ? new Date(Date.now() - inv.daysAgo * 86400000) : null,
      },
    });
  }
  console.log(`  ✅ ${invoices.length} invoices created`);

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
