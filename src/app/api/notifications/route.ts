import { getCurrentUserProfile } from "@/lib/supabase";
import { getAppointmentsByPatient, getMedicalRecordsByPatient } from "@/lib/supabase";
import { getAppointmentsByDoctor } from "@/lib/supabase";
import { getAllDoctors } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, profile } = await getCurrentUserProfile().then(
    (r) => ({ user: r.user, profile: r.profile })
  );

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = profile?.role || user.role;
  const notifications: Array<{
    id: string;
    title: string;
    description: string;
    time: string;
    type: string;
  }> = [];

  if (role === "ADMIN") {
    // Admin sees recent activity across the system
    try {
      const doctorsResult = await getAllDoctors();
      const doctors = doctorsResult.data || [];
      const recentDoctors = doctors.slice(-3).reverse();
      for (const d of recentDoctors) {
        notifications.push({
          id: `admin-doctor-${d.id}`,
          title: "New doctor registered",
          description: `${d.profiles?.full_name || "A doctor"} joined the team`,
          time: new Date(d.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "doctor",
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const apptsResult = await getAppointmentsByDoctor("");
      const appts = apptsResult.data || [];
      const recent = appts.slice(-3).reverse();
      for (const a of recent) {
        notifications.push({
          id: `admin-apt-${a.id}`,
          title: "New appointment booked",
          description: `Appointment with ${a.patient?.full_name || "a patient"} on ${a.date}`,
          time: new Date(a.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "appointment",
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const recordsResult = await getMedicalRecordsByPatient("");
      const records = recordsResult.data || [];
      const recent = records.slice(-3).reverse();
      for (const r of recent) {
        notifications.push({
          id: `admin-record-${r.id}`,
          title: "New medical record",
          description: `Record created for patient`,
          time: new Date(r.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "lab",
        });
      }
    } catch {
      /* ignore */
    }
  } else if (role === "DOCTOR") {
    try {
      const apptsResult = await getAppointmentsByDoctor(user.id);
      const appts = apptsResult.data || [];
      const recent = appts.slice(-5).reverse();
      for (const a of recent) {
        notifications.push({
          id: `doc-apt-${a.id}`,
          title: a.status === "PENDING" ? "New appointment request" : "Appointment update",
          description: `${a.patient?.full_name || "Patient"} — ${a.date} at ${a.time_slot}`,
          time: new Date(a.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: a.status === "PENDING" ? "appointment" : "payment",
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const recordsResult = await getMedicalRecordsByPatient("");
      const records = recordsResult.data || [];
      const recent = records.slice(-3).reverse();
      for (const r of recent) {
        if (r.doctorId === user.id) {
          notifications.push({
            id: `doc-record-${r.id}`,
            title: "New medical record",
            description: `Record for patient — ${r.diagnosis || "Consultation"}`,
            time: new Date(r.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            type: "lab",
          });
        }
      }
    } catch {
      /* ignore */
    }
  } else {
    // Patient
    try {
      const apptsResult = await getAppointmentsByPatient(user.id);
      const appts = apptsResult.data || [];
      const recent = appts.slice(-5).reverse();
      for (const a of recent) {
        notifications.push({
          id: `pat-apt-${a.id}`,
          title:
            a.status === "CONFIRMED"
              ? "Appointment confirmed"
              : a.status === "PENDING"
                ? "Appointment pending"
                : a.status === "COMPLETED"
                  ? "Appointment completed"
                  : "Appointment cancelled",
          description: `${a.doctor?.profiles?.full_name || "Doctor"} — ${a.date} at ${a.time_slot}`,
          time: new Date(a.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "appointment",
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const recordsResult = await getMedicalRecordsByPatient(user.id);
      const records = recordsResult.data || [];
      const recent = records.slice(-3).reverse();
      for (const r of recent) {
        notifications.push({
          id: `pat-record-${r.id}`,
          title: "New medical record",
          description: r.diagnosis || "Consultation notes updated",
          time: new Date(r.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "lab",
        });
      }
    } catch {
      /* ignore */
    }

    try {
      const { prisma } = await import("@/lib/prisma");
      const invoices = await prisma.invoice.findMany({
          where: { patientId: user.id },
          orderBy: { createdAt: "desc" },
          take: 3,
        });
      
      for (const inv of invoices.slice(-3).reverse()) {
        notifications.push({
          id: `pat-inv-${inv.id}`,
          title: inv.status === "paid" ? "Payment received" : "Invoice update",
          description: `$${inv.amount.toFixed(2)} — ${inv.description}`,
          time: inv.createdAt.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          type: "payment",
        });
      }
    } catch {
      /* ignore */
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const deduped = notifications.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  return Response.json({ data: deduped.slice(0, 10) });
}
