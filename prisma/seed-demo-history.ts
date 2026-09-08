// ═══════════════════════════════════════════════════════════════════
//  Demo History Backfill — Medical Records
//  Run with:  npx tsx prisma/seed-demo-history.ts
// ═══════════════════════════════════════════════════════════════════
//  Creates sample medical records for existing demo patients so the
//  admin patient-history UI has data to show.
// ═══════════════════════════════════════════════════════════════════

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type Patient = {
  id: string;
  email: string;
  fullName: string;
};

type Doctor = {
  id: string;
  specialization: string;
  userId: string;
};

type Appointment = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  timeSlot: string;
  status: string;
  reason: string;
};

const diagnosesBySpecialization: Record<string, string[]> = {
  Cardiology: [
    "Mild hypertension, controlled",
    "Abnormal stress test, follow-up recommended",
    "Atrial fibrillation, stable",
    "Chest pain evaluation, no acute findings",
  ],
  Neurology: [
    "Recurrent migraine with aura",
    "Tension headache, routine follow-up",
    "Peripheral neuropathy symptoms",
    "Memory assessment, within normal limits",
  ],
  Pediatrics: [
    "Routine vaccination consultation",
    "Mild upper respiratory infection",
    "Growth and development review",
    "Allergic rhinitis management",
  ],
  GeneralMedicine: [
    "Annual physical examination",
    "Seasonal allergies",
    "Gastrointestinal discomfort",
    "Fatigue workup, benign findings",
  ],
  Orthopedics: [
    "Knee pain, likely mechanical",
    "Lower back strain",
    "Shoulder impingement symptoms",
    "Fracture follow-up, healing well",
  ],
  Dermatology: [
    "Eczema flare-up",
    "Suspicious mole assessment",
    "Acne management review",
    "Skin rash, allergic etiology suspected",
  ],
};

const notesByDiagnosis: Record<string, string[]> = {
  "Mild hypertension, controlled": [
    "Blood pressure within controlled range on current medication.",
    "Advised continued monitoring and low-sodium diet.",
  ],
  "Abnormal stress test, follow-up recommended": [
    "Stress test showed mild abnormalities.",
    "Cardiology follow-up scheduled for further evaluation.",
  ],
  "Atrial fibrillation, stable": [
    "Heart rhythm stable at the time of visit.",
    "Continued anticoagulation therapy reviewed.",
  ],
  "Chest pain evaluation, no acute findings": [
    "No acute cardiac findings on initial evaluation.",
    "Patient advised to return if symptoms worsen.",
  ],
  "Recurrent migraine with aura": [
    "Patient reports frequent migraine episodes.",
    "Preventive treatment options discussed.",
  ],
  "Tension headache, routine follow-up": [
    "Symptoms improved since last visit.",
    "Lifestyle modifications continued.",
  ],
  "Peripheral neuropathy symptoms": [
    "Numbness reported in lower extremities.",
    "Further nerve testing considered if symptoms persist.",
  ],
  "Memory assessment, within normal limits": [
    "Cognitive screening results within normal limits.",
    "No immediate concerns noted.",
  ],
  "Routine vaccination consultation": [
    "Vaccination history reviewed.",
    "Recommended vaccines administered.",
  ],
  "Mild upper respiratory infection": [
    "Mild symptoms noted.",
    "Supportive care advised.",
  ],
  "Growth and development review": [
    "Growth parameters within expected range.",
    "Routine follow-up recommended.",
  ],
  "Allergic rhinitis management": [
    "Seasonal allergies affecting quality of life.",
    "Antihistamine regimen reviewed.",
  ],
  "Annual physical examination": [
    "General health examination completed.",
    "No significant findings.",
  ],
  "Seasonal allergies": [
    "Allergy symptoms consistent with seasonal pattern.",
    "Symptom management plan updated.",
  ],
  "Gastrointestinal discomfort": [
    "Mild gastrointestinal symptoms reported.",
    "Dietary triggers reviewed.",
  ],
  "Fatigue workup, benign findings": [
    "Initial workup unremarkable.",
    "Follow-up if symptoms persist.",
  ],
  "Knee pain, likely mechanical": [
    "Mechanical knee pain suspected.",
    "Physiotherapy recommended.",
  ],
  "Lower back strain": [
    "Back strain likely related to physical activity.",
    "Rest and analgesics advised.",
  ],
  "Shoulder impingement symptoms": [
    "Shoulder impingement signs noted.",
    "Stretching and strengthening plan discussed.",
  ],
  "Fracture follow-up, healing well": [
    "Fracture healing appropriately.",
    "Follow-up imaging not required at this time.",
  ],
  "Eczema flare-up": [
    "Eczema flare observed.",
    "Topical treatment adjusted.",
  ],
  "Suspicious mole assessment": [
    "Mole assessed and monitored.",
    "Patient advised on warning signs.",
  ],
  "Acne management review": [
    "Acne management plan reviewed.",
    "Skin care regimen updated.",
  ],
  "Skin rash, allergic etiology suspected": [
    "Rash consistent with allergic reaction.",
    "Possible triggers discussed.",
  ],
};

async function main() {
  console.log("🏥 Backfilling demo medical history...");

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" },
    orderBy: { fullName: "asc" },
    select: { id: true, email: true, fullName: true },
  });

  if (patients.length === 0) {
    console.log("⚠️ No PATIENT users found. Nothing to backfill.");
    return;
  }

  const doctors = await prisma.doctor.findMany({
    select: { id: true, specialization: true, userId: true },
  });

  if (doctors.length === 0) {
    console.log("⚠️ No doctors found. Creating demo records without attending doctor.");
  }

  const specialityMap = new Map(doctors.map((d) => [d.specialization, d]));
  const patientAppointments = await prisma.appointment.findMany({
    where: { patientId: { in: patients.map((p) => p.id) } },
    orderBy: { date: "desc" },
    select: { id: true, patientId: true, doctorId: true, date: true, timeSlot: true, status: true, reason: true },
  });

  const apptsByPatient = new Map<string, Appointment[]>();
  for (const appt of patientAppointments) {
    apptsByPatient.set(appt.patientId, apptsByPatient.get(appt.patientId) || []);
    apptsByPatient.get(appt.patientId)!.push(appt);
  }

  let created = 0;

  for (const patient of patients) {
    const appts = apptsByPatient.get(patient.id) || [];
    const completedAppts = appts
      .filter((a) => a.status === "COMPLETED")
      .sort((a, b) => a.date.localeCompare(b.date));

    const diagnoses: string[] = [];

    // Prefer diagnoses tied to completed appointments
    for (const appt of completedAppts.slice(0, 4)) {
      const doctor = specialityMap.get(
        doctors.find((d) => d.id === appt.doctorId)?.specialization || ""
      );
      const specialization =
        doctor?.specialization || Object.keys(diagnosesBySpecialization)[0];
      const pool = diagnosesBySpecialization[specialization] || diagnosesBySpecialization["GeneralMedicine"];
      const diagnosis = pool[Math.floor(Math.random() * pool.length)];
      diagnoses.push(diagnosis);
    }

    // Fallback diagnoses if patient has no completed appointments
    if (diagnoses.length === 0) {
      const pool = diagnosesBySpecialization["GeneralMedicine"];
      for (let i = 0; i < 2; i += 1) {
        diagnoses.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    let usedAppointmentIds = new Set(appts.map((a) => a.id));

    for (let i = 0; i < diagnoses.length; i += 1) {
      const diagnosis = diagnoses[i];
      const notePool = notesByDiagnosis[diagnosis] || ["Routine follow-up.", "No acute concerns."];
      const notes = notePool.slice(0, 2).join(" ");

      let appointment: Appointment | null = null;

      // Use an existing completed appointment if available.
      // Do not create new appointments automatically because this can
      // violate the unique constraint on (doctor_id, date, time_slot).
      if (completedAppts[i]) {
        appointment = completedAppts[i];
      } else {
        const existingSlot = appts.find((a) => !usedAppointmentIds.has(a.id));
        if (existingSlot) {
          appointment = existingSlot;
          usedAppointmentIds.add(existingSlot.id);
        }
      }

      if (!appointment) {
        continue;
      }

      await prisma.medicalRecord.upsert({
        where: { appointmentId: appointment.id },
        update: {},
        create: {
          appointmentId: appointment.id,
          patientId: patient.id,
          doctorId: appointment.doctorId || (doctors[0]?.id ?? undefined),
          diagnosis,
          notes,
          prescription: JSON.stringify([
            {
              medication: "Sample Medication",
              dosage: "As directed",
              frequency: "Once daily",
              duration: "7 days",
              instructions: "Take with food.",
            },
          ]),
          vitalsJson: JSON.stringify({
            bloodPressure: "120/80",
            heartRate: "72",
            temperature: "98.6°F",
            weight: "70 kg",
          }),
        },
      });
      created += 1;
    }
  }

  console.log(`✅ Created ${created} demo medical records across ${patients.length} patients.`);
}

main()
  .catch((e) => {
    console.error("❌ Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
