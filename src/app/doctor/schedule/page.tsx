"use client";

import React, { useState, useEffect, useMemo } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

interface Appointment {
  id: string;
  patient: { full_name: string };
  date: string;
  time_slot: string;
  reason: string;
  status: string;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getWeekday(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

export default function DoctorSchedulePage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (cancelled) return;
        if (!meJson.user) {
          setError("You must be signed in.");
          return;
        }

        const docsRes = await fetch("/api/doctors");
        const docsJson = await docsRes.json();
        if (cancelled) return;
        const myDoctor = (docsJson.data || []).find(
          (d: { profile_id: string }) => d.profile_id === meJson.user.id
        );

        const aptRes = await fetch(`/api/appointments?doctorId=${myDoctor?.id || ""}&pageSize=200`);
        const aptJson = await aptRes.json();
        if (cancelled) return;
        if (aptJson.error) setError(aptJson.error.message);
        else setAppointments(aptJson.data || []);
      } catch {
        if (!cancelled) setError("Failed to load schedule.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const scheduleByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const day of weekDays) map[day] = [];
    for (const apt of appointments) {
      const day = getWeekday(apt.date);
      if (map[day]) map[day].push(apt);
    }
    for (const day of weekDays) {
      map[day].sort((a, b) => a.time_slot.localeCompare(b.time_slot));
    }
    return map;
  }, [appointments]);

  const upcomingCount = weekDays.reduce(
    (sum, day) => sum + scheduleByDay[day].filter((a) => a.status !== "CANCELLED" && a.status !== "COMPLETED").length,
    0
  );

  return (
    <div>
      <Header title="Schedule" subtitle="Weekly appointment schedule" userName="Doctor" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Day selector */}
        <div className="flex flex-wrap gap-2">
          {weekDays.map((day) => {
            const count = scheduleByDay[day]?.length || 0;
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`relative rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedDay === day ? "bg-primary-600 text-white shadow-sm" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"
                }`}
              >
                {day}
                {count > 0 && (
                  <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${selectedDay === day ? "bg-white text-primary-700" : "bg-primary-500 text-white"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm text-danger-700">{error}</div>
        )}

        <Card>
          <CardContent>
            <h3 className="mb-4 text-lg font-semibold text-secondary-900">{selectedDay}'s Schedule</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-secondary-100" />
                ))}
              </div>
            ) : (scheduleByDay[selectedDay]?.length ?? 0) > 0 ? (
              <div className="divide-y divide-secondary-100">
                {scheduleByDay[selectedDay].map((slot) => (
                  <div key={slot.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-20 text-sm font-medium text-primary-600">{slot.time_slot}</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                      {slot.patient?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{slot.patient?.full_name}</p>
                      <p className="text-xs text-secondary-500">{slot.reason}</p>
                    </div>
                    <span className="text-xs text-secondary-400">{slot.status.toLowerCase()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-secondary-500">
                No appointments scheduled for {selectedDay}.
              </p>
            )}
          </CardContent>
        </Card>

        {!isLoading && (
          <p className="text-xs text-secondary-400">
            {appointments.length} appointments total · {upcomingCount} upcoming this week
          </p>
        )}
      </div>
    </div>
  );
}
