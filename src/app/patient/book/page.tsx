"use client";

import React, { Suspense, useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import { showSuccess, showError } from "@/lib/toast";
import type { DoctorRow, ProfileRow } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────
type DoctorWithProfile = DoctorRow & { profiles: ProfileRow };

interface FormData {
  doctorId: string;
  date: string;
  timeSlot: string;
  reason: string;
}

interface FormErrors {
  doctorId?: string;
  date?: string;
  timeSlot?: string;
  reason?: string;
}

// ─── Constants ────────────────────────────────────────────────────
const TIME_SLOTS = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00", "14:30",
  "15:00", "15:30",
  "16:00", "16:30",
  "17:00",
] as const;

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

// ─── Inner Component (uses useSearchParams) ───────────────────────
function BookAppointmentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDoctorId = searchParams.get("doctorId");

  // Data state
  const [doctors, setDoctors] = useState<DoctorWithProfile[]>([]);
  const [patientProfileId, setPatientProfileId] = useState<string | null>(null);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Success state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createdAppointment, setCreatedAppointment] = useState<{
    doctorName: string;
    date: string;
    time: string;
  } | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>({
    doctorId: preselectedDoctorId || "",
    date: "",
    timeSlot: "",
    reason: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Calendar state
  const today = useMemo(() => new Date(), []);
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  // ─── Fetch doctors & patient profile on mount ──────────────────
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        setLoadingDoctors(true);
        setFetchError(null);

        // Fetch doctors
        const docRes = await fetch("/api/doctors");
        const docJson = await docRes.json();
        if (cancelled) return;
        if (!docRes.ok || docJson.error) {
          setFetchError(docJson.error?.message || "Failed to load doctors.");
          return;
        }
        setDoctors(docJson.data || []);

        // Fetch current user
        const meRes = await fetch("/api/auth/me");
        const meJson = await meRes.json();
        if (cancelled) return;

        if (meJson.user) {
          setPatientProfileId(meJson.user.id);
        }
      } catch {
        if (!cancelled) setFetchError("Failed to load data. Please refresh.");
      } finally {
        if (!cancelled) setLoadingDoctors(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── Calendar helpers ──────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calendarMonth, calendarYear]);

  const goToPrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const isDateSelectable = (day: number): boolean => {
    const date = new Date(calendarYear, calendarMonth, day);
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    // Can't pick past dates, and at most 3 months in future
    const maxDate = new Date(todayDate);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return date >= todayDate && date <= maxDate;
  };

  const isSelectedDate = (day: number): boolean => {
    if (!formData.date) return false;
    const [y, m, d] = formData.date.split("-").map(Number);
    return y === calendarYear && m === calendarMonth + 1 && d === day;
  };

  const handleDayClick = (day: number) => {
    if (!isDateSelectable(day)) return;
    const monthStr = String(calendarMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
    setFormData((prev) => ({ ...prev, date: dateStr }));
    setErrors((prev) => ({ ...prev, date: undefined }));
  };

  // ─── Get available time slots (exclude past times for today) ────
  const availableTimeSlots = useMemo(() => {
    const isToday =
      formData.date === getTodayString();

    return TIME_SLOTS.filter((slot) => {
      if (!isToday) return true;

      // For today, exclude past time slots
      const now = new Date();
      const [hours, minutes] = slot.split(":").map(Number);
      const slotDate = new Date();
      slotDate.setHours(hours, minutes, 0, 0);
      // Allow slots at least 1 hour in the future
      return slotDate.getTime() > now.getTime() + 60 * 60 * 1000;
    });
  }, [formData.date]);

  // ─── Form validation ───────────────────────────────────────────
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.doctorId) {
      newErrors.doctorId = "Please select a doctor";
    }
    if (!formData.date) {
      newErrors.date = "Please select a date";
    }
    if (!formData.timeSlot) {
      newErrors.timeSlot = "Please select a time slot";
    }
    if (!formData.reason.trim()) {
      newErrors.reason = "Please provide a reason for the visit";
    } else if (formData.reason.trim().length < 10) {
      newErrors.reason = "Please provide more detail (at least 10 characters)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Submission ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!patientProfileId) {
      setFetchError("Could not identify your account. Please sign in again.");
      return;
    }

    setSubmitting(true);
    setFetchError(null);

    try {
      const aptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientProfileId,
          doctor_id: formData.doctorId,
          date: formData.date,
          time_slot: formData.timeSlot,
          reason: formData.reason.trim(),
        }),
      });
      const aptJson = await aptRes.json();

      if (!aptRes.ok || aptJson.error) {
        const msg = aptJson.error?.message || "Failed to book appointment.";
        if (msg.toLowerCase().includes("duplicate") || msg.toLowerCase().includes("unique")) {
          showError("Time slot taken", "This time slot is already booked. Please choose another.");
          setFetchError("This time slot is already booked. Please choose another.");
        } else {
          showError("Booking failed", msg);
          setFetchError(msg);
        }
        return;
      }

      // Success
      const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);
      showSuccess(
        "Appointment booked!",
        `Your visit with ${selectedDoctor?.profiles.full_name || "Doctor"} has been scheduled.`
      );
      setCreatedAppointment({
        doctorName: selectedDoctor?.profiles.full_name || "Doctor",
        date: formData.date,
        time: formData.timeSlot,
      });
      setSuccessMessage("Appointment booked successfully!");
    } catch {
      showError("Booking failed", "An unexpected error occurred. Please try again.");
      setFetchError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Reset form ────────────────────────────────────────────────
  const handleBookAnother = () => {
    setFormData({ doctorId: "", date: "", timeSlot: "", reason: "" });
    setErrors({});
    setSuccessMessage(null);
    setCreatedAppointment(null);
  };

  // ─── Selected doctor display ───────────────────────────────────
  const selectedDoctor = doctors.find((d) => d.id === formData.doctorId);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="Book Appointment"
        subtitle="Schedule a visit with one of our specialists"
        userName="Sarah Johnson"
        userRole="patient"
        showSearch={false}
      />

      <div className="page-container">
        {/* Success State */}
        {successMessage && createdAppointment ? (
          <div className="mx-auto max-w-lg">
            <div className="rounded-xl border border-success-200 bg-success-50 p-8 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                <svg
                  className="h-8 w-8 text-success-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-bold text-success-800">
                {successMessage}
              </h2>
              <p className="mb-6 text-sm text-success-700">
                Your appointment has been booked and is pending confirmation.
              </p>

              <div className="mb-6 rounded-lg border border-success-200 bg-white p-4 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Doctor</span>
                    <span className="font-medium text-secondary-900">
                      {createdAppointment.doctorName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Date</span>
                    <span className="font-medium text-secondary-900">
                      {new Date(
                        createdAppointment.date + "T12:00:00"
                      ).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Time</span>
                    <span className="font-medium text-secondary-900">
                      {new Date(
                        `2000-01-01T${createdAppointment.time}:00`
                      ).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">Status</span>
                    <span className="inline-flex items-center rounded-full bg-warning-50 px-2 py-0.5 text-xs font-medium text-warning-700">
                      Pending
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleBookAnother}
                  className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  Book Another
                </button>
                <button
                  onClick={() => router.push("/patient/appointments")}
                  className="flex-1 rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-sm font-semibold text-secondary-700 transition-colors hover:bg-secondary-50"
                >
                  View Appointments
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-5xl">
            {/* Error Banner */}
            {fetchError && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
                <svg
                  className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
                <p className="text-sm text-danger-700">{fetchError}</p>
              </div>
            )}

            {/* Loading State */}
            {loadingDoctors ? (
              <div className="rounded-xl border border-secondary-200 bg-white p-8 shadow-sm">
                <div className="animate-pulse space-y-6">
                  <div className="h-10 w-full rounded-lg bg-secondary-200" />
                  <div className="h-64 w-full rounded-lg bg-secondary-100" />
                  <div className="h-10 w-full rounded-lg bg-secondary-200" />
                  <div className="h-24 w-full rounded-lg bg-secondary-100" />
                  <div className="h-12 w-40 rounded-lg bg-secondary-200" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="grid gap-8 lg:grid-cols-5">
                  {/* Left Column: Doctor + Reason */}
                  <div className="space-y-6 lg:col-span-2">
                    <div className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                        Appointment Details
                      </h2>

                      {/* Doctor Dropdown */}
                      <div className="mb-5">
                        <label
                          htmlFor="doctorId"
                          className="mb-1.5 block text-sm font-medium text-secondary-700"
                        >
                          Select Doctor
                        </label>
                        <div className="relative">
                          <select
                            id="doctorId"
                            value={formData.doctorId}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                doctorId: e.target.value,
                              }));
                              setErrors((prev) => ({
                                ...prev,
                                doctorId: undefined,
                              }));
                            }}
                            className={`block w-full appearance-none rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-secondary-900 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                              errors.doctorId
                                ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                                : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                            }`}
                          >
                            <option value="">-- Choose a doctor --</option>
                            {doctors.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.profiles.full_name} — {doc.specialization}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-secondary-400">
                            <svg
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={2}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m19.5 8.25-7.5 7.5-7.5-7.5"
                              />
                            </svg>
                          </div>
                        </div>
                        {errors.doctorId && (
                          <p className="mt-1.5 text-sm text-danger-500">
                            {errors.doctorId}
                          </p>
                        )}

                        {/* Selected doctor info */}
                        {selectedDoctor && (
                          <div className="mt-3 flex items-center gap-3 rounded-lg bg-primary-50 p-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                              {selectedDoctor.profiles.full_name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                            </div>
                            <div className="text-sm">
                              <p className="font-medium text-primary-900">
                                {selectedDoctor.profiles.full_name}
                              </p>
                              <p className="text-primary-600">
                                {selectedDoctor.specialization}
                                {selectedDoctor.room_number &&
                                  ` · Room ${selectedDoctor.room_number}`}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      <div>
                        <label
                          htmlFor="reason"
                          className="mb-1.5 block text-sm font-medium text-secondary-700"
                        >
                          Reason for Visit
                        </label>
                        <textarea
                          id="reason"
                          rows={4}
                          placeholder="Describe your symptoms or reason for the appointment..."
                          value={formData.reason}
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              reason: e.target.value,
                            }));
                            setErrors((prev) => ({
                              ...prev,
                              reason: undefined,
                            }));
                          }}
                          className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 resize-none ${
                            errors.reason
                              ? "border-danger-500 focus:border-danger-500 focus:ring-danger-500/20"
                              : "border-secondary-300 focus:border-primary-500 focus:ring-primary-500/20"
                          }`}
                        />
                        {errors.reason && (
                          <p className="mt-1.5 text-sm text-danger-500">
                            {errors.reason}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-secondary-400">
                          {formData.reason.trim().length} characters (min 10)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Date + Time */}
                  <div className="space-y-6 lg:col-span-3">
                    {/* Date Picker - Calendar */}
                    <div className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                        Select Date
                      </h2>

                      {/* Calendar Navigation */}
                      <div className="mb-4 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={goToPrevMonth}
                          disabled={
                            calendarMonth === today.getMonth() &&
                            calendarYear === today.getFullYear()
                          }
                          className="rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700 disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Previous month"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 19.5 8.25 12l7.5-7.5"
                            />
                          </svg>
                        </button>
                        <h3 className="text-base font-semibold text-secondary-900">
                          {MONTHS[calendarMonth]} {calendarYear}
                        </h3>
                        <button
                          type="button"
                          onClick={goToNextMonth}
                          className="rounded-lg p-2 text-secondary-500 transition-colors hover:bg-secondary-100 hover:text-secondary-700"
                          aria-label="Next month"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m8.25 4.5 7.5 7.5-7.5 7.5"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {/* Day headers */}
                        {DAYS_OF_WEEK.map((day) => (
                          <div
                            key={day}
                            className="py-2 text-center text-xs font-semibold text-secondary-400"
                          >
                            {day}
                          </div>
                        ))}

                        {/* Day cells */}
                        {calendarDays.map((day, index) => {
                          if (day === null) {
                            return <div key={`empty-${index}`} />;
                          }

                          const selectable = isDateSelectable(day);
                          const selected = isSelectedDate(day);
                          const isTodayDate =
                            day === today.getDate() &&
                            calendarMonth === today.getMonth() &&
                            calendarYear === today.getFullYear();

                          return (
                            <button
                              key={`day-${day}`}
                              type="button"
                              disabled={!selectable}
                              onClick={() => handleDayClick(day)}
                              className={`relative flex items-center justify-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150 ${
                                selected
                                  ? "bg-primary-600 text-white shadow-sm hover:bg-primary-700"
                                  : selectable
                                    ? "text-secondary-700 hover:bg-primary-50 hover:text-primary-700"
                                    : "cursor-not-allowed text-secondary-300"
                              }`}
                            >
                              {day}
                              {isTodayDate && !selected && (
                                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-primary-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected date display */}
                      {formData.date && (
                        <div className="mt-4 rounded-lg bg-primary-50 p-3 text-sm">
                          <span className="font-medium text-primary-700">
                            Selected:{" "}
                          </span>
                          <span className="text-primary-600">
                            {new Date(
                              formData.date + "T12:00:00"
                            ).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                      {errors.date && (
                        <p className="mt-1.5 text-sm text-danger-500">
                          {errors.date}
                        </p>
                      )}

                      <p className="mt-3 text-xs text-secondary-400">
                        Showing appointments available up to 3 months in advance
                      </p>
                    </div>

                    {/* Time Slot Selector */}
                    <div className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm">
                      <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                        Select Time
                      </h2>

                      {!formData.date ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-secondary-300 bg-secondary-50 p-8 text-center">
                          <svg
                            className="mb-2 h-8 w-8 text-secondary-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                            />
                          </svg>
                          <p className="text-sm text-secondary-500">
                            Please select a date first
                          </p>
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-warning-200 bg-warning-50 p-8 text-center">
                          <p className="text-sm font-medium text-warning-700">
                            No available time slots for today
                          </p>
                          <p className="mt-1 text-xs text-warning-600">
                            Please select a different date
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                          {availableTimeSlots.map((slot) => {
                            const isSelected = formData.timeSlot === slot;
                            const timeFormatted = new Date(
                              `2000-01-01T${slot}:00`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            });

                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    timeSlot: slot,
                                  }));
                                  setErrors((prev) => ({
                                    ...prev,
                                    timeSlot: undefined,
                                  }));
                                }}
                                className={`rounded-lg border px-3 py-2.5 text-center text-sm font-medium transition-all duration-150 ${
                                  isSelected
                                    ? "border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                                    : "border-secondary-200 bg-white text-secondary-600 hover:border-primary-300 hover:bg-primary-50/50 hover:text-primary-600"
                                }`}
                              >
                                {timeFormatted}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {errors.timeSlot && (
                        <p className="mt-1.5 text-sm text-danger-500">
                          {errors.timeSlot}
                        </p>
                      )}

                      {formData.timeSlot && formData.date && (
                        <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm">
                          <span className="font-medium text-primary-700">
                            Selected time:{" "}
                          </span>
                          <span className="text-primary-600">
                            {new Date(
                              `2000-01-01T${formData.timeSlot}:00`
                            ).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:from-primary-700 hover:to-primary-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Booking...
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                          Confirm Booking
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Outer Component (wraps useSearchParams in Suspense) ──────────
export default function BookAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div>
          <Header
            title="Book Appointment"
            subtitle="Loading..."
            userName="Sarah Johnson"
            userRole="patient"
            showSearch={false}
          />
          <div className="page-container">
            <div className="animate-pulse space-y-6 rounded-xl border border-secondary-200 bg-white p-8 shadow-sm">
              <div className="h-10 w-full rounded-lg bg-secondary-200" />
              <div className="h-64 w-full rounded-lg bg-secondary-100" />
              <div className="h-10 w-full rounded-lg bg-secondary-200" />
              <div className="h-24 w-full rounded-lg bg-secondary-100" />
              <div className="h-12 w-40 rounded-lg bg-secondary-200" />
            </div>
          </div>
        </div>
      }
    >
      <BookAppointmentForm />
    </Suspense>
  );
}
