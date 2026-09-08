import { getAllDoctors } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const role = searchParams.get("role") || "";

  if (!q) {
    return Response.json({ data: [], total: 0 });
  }

  const lower = q.toLowerCase();
  const results: Record<string, unknown[]> = {};
  let total = 0;

  // Search patients
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
        OR: [
          { fullName: { contains: q } },
          { email: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        _count: { select: { patientAppts: true } },
      },
      take: 20,
    });
    if (patients.length) {
      results.patients = patients.map((p) => ({
        id: p.id,
        name: p.fullName,
        email: p.email,
        phone: p.phone,
        role: p.role,
        created_at: p.createdAt.toISOString(),
        appointment_count: p._count.patientAppts,
        type: "patient",
      }));
      total += patients.length;
    }
  } catch {
    /* ignore */
  }

  // Search doctors
  if (!role || role === "ADMIN") {
    try {
      const doctorsResult = await getAllDoctors();
      const doctors = doctorsResult.data || [];
      const filtered = doctors.filter(
        (d) =>
          d.profiles?.full_name?.toLowerCase().includes(lower) ||
          d.specialization.toLowerCase().includes(lower) ||
          d.license_number.toLowerCase().includes(lower) ||
          d.room_number?.toLowerCase().includes(lower)
      );
      if (filtered.length) {
        results.doctors = filtered.map((d) => ({
          id: d.id,
          name: d.profiles?.full_name || "Doctor",
          specialization: d.specialization,
          license_number: d.license_number,
          room_number: d.room_number,
          fee: d.fee,
          type: "doctor",
        }));
        total += filtered.length;
      }
    } catch {
      /* ignore */
    }
  }

  // Search appointments
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        OR: [
          { reason: { contains: q } },
          { patient: { fullName: { contains: q } } },
          { doctor: { userId: { equals: q } } },
        ],
      },
      include: {
        patient: { select: { fullName: true, email: true } },
        doctor: {
          include: { user: { select: { fullName: true } } },
        },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    if (appointments.length) {
      results.appointments = appointments.map((a) => ({
        id: a.id,
        patient_name: a.patient.fullName,
        doctor_name: a.doctor.user.fullName,
        date: a.date,
        time_slot: a.timeSlot,
        status: a.status,
        reason: a.reason,
        type: "appointment",
      }));
      total += appointments.length;
    }
  } catch {
    /* ignore */
  }

  return Response.json({ data: results, total });
}
