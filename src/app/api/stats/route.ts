// ═══════════════════════════════════════════════════════════════════
//  Stats API Route
//  GET /api/stats  → Aggregate dashboard statistics for admin/doctor
// ═══════════════════════════════════════════════════════════════════

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { serverErrorResponse } from "@/lib/api-validate";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];

    const [
      totalPatients,
      totalDoctors,
      totalAppointments,
      appointmentsToday,
      upcomingAppointments,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      totalRevenueAgg,
      pendingRevenue,
      overdueRevenue,
      totalBeds,
      availableBeds,
      occupiedBeds,
      maintenanceBeds,
      totalDepartments,
      recentPatients,
      recentDoctors,
    ] = await Promise.all([
      prisma.user.count({ where: { role: "PATIENT" } }),
      prisma.doctor.count(),
      prisma.appointment.count(),
      prisma.appointment.count({ where: { date: today } }),
      prisma.appointment.count({ where: { status: { in: ["PENDING", "CONFIRMED"] }, date: { gte: today } } }),
      prisma.appointment.count({ where: { status: "COMPLETED" } }),
      prisma.appointment.count({ where: { status: "PENDING" } }),
      prisma.appointment.count({ where: { status: "CANCELLED" } }),
      prisma.invoice.aggregate({ where: { status: "paid" }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { status: "pending" }, _sum: { amount: true } }),
      prisma.invoice.aggregate({ where: { status: "overdue" }, _sum: { amount: true } }),
      prisma.bed.count(),
      prisma.bed.count({ where: { status: "available" } }),
      prisma.bed.count({ where: { status: "occupied" } }),
      prisma.bed.count({ where: { status: "maintenance" } }),
      prisma.department.count(),
      prisma.user.count({ where: { role: "PATIENT", createdAt: { gte: new Date(today) } } }),
      prisma.doctor.count({ where: { createdAt: { gte: new Date(today) } } }),
    ]);

    // Recent appointments for dashboard activity feed
    const recentAppointments = await prisma.appointment.findMany({
      include: {
        doctor: { include: { user: true } },
        patient: true,
      },
      orderBy: [{ date: "desc" }, { timeSlot: "asc" }],
      take: 6,
    });

    const recentActivity = recentAppointments.map((a) => ({
      id: a.id,
      patient: a.patient.fullName,
      doctor: a.doctor?.user?.fullName || "Unknown",
      date: a.date,
      time: a.timeSlot,
      status: a.status,
    }));

    const revenue = totalRevenueAgg._sum.amount || 0;
    const pending = pendingRevenue._sum.amount || 0;
    const overdue = overdueRevenue._sum.amount || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return NextResponse.json({
      data: {
        total_patients: totalPatients,
        total_doctors: totalDoctors,
        total_appointments: totalAppointments,
        appointments_today: appointmentsToday,
        upcoming_appointments: upcomingAppointments,
        completed_appointments: completedAppointments,
        pending_appointments: pendingAppointments,
        cancelled_appointments: cancelledAppointments,
        revenue,
        pending_revenue: pending,
        overdue_revenue: overdue,
        total_beds: totalBeds,
        available_beds: availableBeds,
        occupied_beds: occupiedBeds,
        maintenance_beds: maintenanceBeds,
        occupancy_rate: occupancyRate,
        total_departments: totalDepartments,
        new_patients_today: recentPatients,
        new_doctors_today: recentDoctors,
        recent_activity: recentActivity,
      },
      error: null,
    });
  } catch (err) {
    return serverErrorResponse(err);
  }
}
