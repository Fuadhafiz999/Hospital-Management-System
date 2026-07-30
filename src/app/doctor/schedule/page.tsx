"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import Card, { CardContent } from "@/components/ui/Card";

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const scheduleData: Record<string, { time: string; patient: string; type: string }[]> = {
  Monday: [
    { time: "09:00", patient: "Sarah Johnson", type: "Checkup" },
    { time: "10:00", patient: "Michael Brown", type: "Follow-up" },
    { time: "11:00", patient: "Emma Davis", type: "Consultation" },
    { time: "14:00", patient: "James Miller", type: "Vaccination" },
    { time: "15:30", patient: "Lisa Anderson", type: "Prescription" },
  ],
  Tuesday: [
    { time: "09:30", patient: "Robert Taylor", type: "Lab Review" },
    { time: "10:30", patient: "Jennifer White", type: "Checkup" },
    { time: "13:00", patient: "Daniel Lee", type: "Follow-up" },
    { time: "15:00", patient: "Amanda Clark", type: "Therapy" },
  ],
  Wednesday: [
    { time: "08:00", patient: "Thomas Moore", type: "Surgery Prep" },
    { time: "10:00", patient: "Rachel Green", type: "Consultation" },
    { time: "11:30", patient: "Monica Geller", type: "Checkup" },
    { time: "14:00", patient: "William Garcia", type: "Follow-up" },
  ],
  Thursday: [
    { time: "09:00", patient: "Sarah Johnson", type: "Follow-up" },
    { time: "11:00", patient: "Emma Davis", type: "Results" },
    { time: "14:30", patient: "Michael Brown", type: "Consultation" },
  ],
  Friday: [
    { time: "09:00", patient: "Lisa Anderson", type: "Checkup" },
    { time: "10:00", patient: "James Miller", type: "Therapy" },
    { time: "11:00", patient: "Robert Taylor", type: "Consultation" },
    { time: "15:00", patient: "Jennifer White", type: "Follow-up" },
  ],
  Saturday: [
    { time: "10:00", patient: "Daniel Lee", type: "Emergency Follow-up" },
  ],
};

export default function DoctorSchedulePage() {
  const [selectedDay, setSelectedDay] = useState("Monday");

  return (
    <div>
      <Header title="Schedule" subtitle="Weekly appointment schedule" userName="Dr. Emily Carter" userRole="doctor" showSearch={false} />

      <div className="page-container space-y-6">
        {/* Day selector */}
        <div className="flex flex-wrap gap-2">
          {weekDays.map((day) => (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${selectedDay === day ? "bg-primary-600 text-white shadow-sm" : "bg-secondary-100 text-secondary-600 hover:bg-secondary-200"}`}>
              {day}
            </button>
          ))}
        </div>

        <Card>
          <CardContent>
            <h3 className="mb-4 text-lg font-semibold text-secondary-900">{selectedDay}'s Schedule</h3>
            {scheduleData[selectedDay]?.length > 0 ? (
              <div className="divide-y divide-secondary-100">
                {scheduleData[selectedDay].map((slot, idx) => (
                  <div key={idx} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="w-20 text-sm font-medium text-primary-600">{slot.time}</div>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700">
                      {slot.patient.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-secondary-900">{slot.patient}</p>
                      <p className="text-xs text-secondary-500">{slot.type}</p>
                    </div>
                    <button className="rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100">Start</button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-secondary-500">No appointments scheduled for this day.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
