"use client";

import React, { useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import type { AppointmentRow, ProfileRow } from "@/types/supabase";

// ─── Types ────────────────────────────────────────────────────────
export type AppointmentWithPatient = AppointmentRow & { patient: ProfileRow };

interface VitalsData {
  blood_pressure: string;
  temperature: string;
  weight: string;
}

interface PrescriptionItem {
  medication: string;
  dosage: string;
  frequency: string;
  instructions: string;
}

interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  appointment: AppointmentWithPatient;
  doctorId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────
function emptyPrescription(): PrescriptionItem {
  return { medication: "", dosage: "", frequency: "", instructions: "" };
}

// ─── Component ────────────────────────────────────────────────────
export default function ConsultationModal({
  isOpen,
  onClose,
  onComplete,
  appointment,
  doctorId,
}: ConsultationModalProps) {
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState<VitalsData>({
    blood_pressure: "",
    temperature: "",
    weight: "",
  });
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    emptyPrescription(),
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // ─── Vitals helpers ─────────────────────────────────────────────
  const updateVital = (key: keyof VitalsData, value: string) => {
    setVitals((prev) => ({ ...prev, [key]: value }));
  };

  // ─── Prescription helpers ───────────────────────────────────────
  const updatePrescription = (
    index: number,
    key: keyof PrescriptionItem,
    value: string
  ) => {
    setPrescriptions((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    );
  };

  const addPrescription = () => {
    setPrescriptions((prev) => [...prev, emptyPrescription()]);
  };

  const removePrescription = (index: number) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Validation ─────────────────────────────────────────────────
  const validate = (): boolean => {
    if (!diagnosis.trim()) {
      setError("Please enter a diagnosis.");
      return false;
    }
    return true;
  };

  // ─── Submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setError(null);

    try {
      // Build vitals JSON (only include non-empty values)
      const vitalsJson: Record<string, string> = {};
      if (vitals.blood_pressure) vitalsJson.blood_pressure = vitals.blood_pressure;
      if (vitals.temperature) vitalsJson.temperature = vitals.temperature;
      if (vitals.weight) vitalsJson.weight = vitals.weight;

      // Build prescriptions array (only non-empty medication entries)
      const prescriptionData: Record<string, unknown>[] = prescriptions
        .filter((p) => p.medication.trim())
        .map((p) => ({
          medication: p.medication,
          dosage: p.dosage,
          frequency: p.frequency,
          instructions: p.instructions,
        }));

      // Create medical record (API also auto-completes the appointment)
      const medRes = await fetch("/api/medical-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointment_id: appointment.id,
          patient_id: appointment.patient_id,
          doctor_id: doctorId,
          diagnosis: diagnosis.trim(),
          notes: notes.trim() || null,
          vitals_json: vitalsJson,
          prescription: prescriptionData,
        }),
      });
      const medJson = await medRes.json();

      if (!medRes.ok || medJson.error) {
        showError("Failed to save record", medJson.error?.message || "Please try again.");
        setError(medJson.error?.message || "Failed to save medical record.");
        return;
      }

      // Success — notify parent and close
      showSuccess("Consultation saved", `Medical record for ${patientName} has been completed.`);
      onComplete();
      handleClose();
    } catch {
      showError("Save failed", "An unexpected error occurred. Please try again.");
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Close / Reset ──────────────────────────────────────────────
  const handleClose = () => {
    // Reset form state
    setDiagnosis("");
    setNotes("");
    setVitals({ blood_pressure: "", temperature: "", weight: "" });
    setPrescriptions([emptyPrescription()]);
    setError(null);
    setSubmitting(false);
    onClose();
  };

  // ─── Render ────────────────────────────────────────────────────
  const patientName = appointment.patient?.full_name || "Patient";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-secondary-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-secondary-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-secondary-900">
              Complete Consultation
            </h2>
            <p className="mt-0.5 text-sm text-secondary-500">
              {patientName}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-secondary-400 transition-colors hover:bg-secondary-100 hover:text-secondary-600"
            aria-label="Close modal"
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
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5">
          <form id="consultation-form" onSubmit={handleSubmit}>
            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-danger-200 bg-danger-50 p-4">
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
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Diagnosis */}
            <div className="mb-6">
              <label
                htmlFor="diagnosis"
                className="mb-1.5 block text-sm font-medium text-secondary-700"
              >
                Diagnosis <span className="text-danger-500">*</span>
              </label>
              <textarea
                id="diagnosis"
                rows={3}
                placeholder="Enter your diagnosis..."
                value={diagnosis}
                onChange={(e) => {
                  setDiagnosis(e.target.value);
                  setError(null);
                }}
                className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
                required
              />
            </div>

            {/* Vitals */}
            <div className="mb-6">
              <h3 className="mb-3 text-sm font-semibold text-secondary-900">
                Vitals
                <span className="ml-1.5 text-xs font-normal text-secondary-400">
                  (optional)
                </span>
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label
                    htmlFor="blood_pressure"
                    className="mb-1 block text-xs font-medium text-secondary-600"
                  >
                    Blood Pressure
                  </label>
                  <input
                    id="blood_pressure"
                    type="text"
                    placeholder="120/80"
                    value={vitals.blood_pressure}
                    onChange={(e) => updateVital("blood_pressure", e.target.value)}
                    className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="temperature"
                    className="mb-1 block text-xs font-medium text-secondary-600"
                  >
                    Temperature
                  </label>
                  <input
                    id="temperature"
                    type="text"
                    placeholder="98.6 °F"
                    value={vitals.temperature}
                    onChange={(e) => updateVital("temperature", e.target.value)}
                    className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
                <div>
                  <label
                    htmlFor="weight"
                    className="mb-1 block text-xs font-medium text-secondary-600"
                  >
                    Weight
                  </label>
                  <input
                    id="weight"
                    type="text"
                    placeholder="70 kg"
                    value={vitals.weight}
                    onChange={(e) => updateVital("weight", e.target.value)}
                    className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-6">
              <label
                htmlFor="notes"
                className="mb-1.5 block text-sm font-medium text-secondary-700"
              >
                Clinical Notes
                <span className="ml-1.5 text-xs font-normal text-secondary-400">
                  (optional)
                </span>
              </label>
              <textarea
                id="notes"
                rows={2}
                placeholder="Additional notes about the consultation..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="block w-full rounded-lg border border-secondary-300 bg-white px-3 py-2.5 text-sm text-secondary-900 placeholder-secondary-400 shadow-sm transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 resize-none"
              />
            </div>

            {/* Prescriptions */}
            <div className="mb-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-secondary-900">
                  Prescriptions
                  <span className="ml-1.5 text-xs font-normal text-secondary-400">
                    (optional)
                  </span>
                </h3>
                <button
                  type="button"
                  onClick={addPrescription}
                  className="flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-xs font-medium text-primary-700 transition-colors hover:bg-primary-100"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Add Medication
                </button>
              </div>

              {prescriptions.length === 0 && (
                <p className="text-sm text-secondary-400 italic">
                  No medications prescribed
                </p>
              )}

              <div className="space-y-3">
                {prescriptions.map((presc, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-secondary-200 bg-secondary-50/50 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-medium text-secondary-500 uppercase tracking-wider">
                        Medication #{index + 1}
                      </p>
                      {prescriptions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="rounded p-0.5 text-secondary-400 transition-colors hover:text-danger-500"
                          aria-label="Remove medication"
                        >
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
                              d="M6 18 18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <label className="mb-0.5 block text-xs text-secondary-500">
                          Medicine
                        </label>
                        <input
                          type="text"
                          placeholder="Amoxicillin"
                          value={presc.medication}
                          onChange={(e) =>
                            updatePrescription(index, "medication", e.target.value)
                          }
                          className="block w-full rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs text-secondary-500">
                          Dosage
                        </label>
                        <input
                          type="text"
                          placeholder="500mg"
                          value={presc.dosage}
                          onChange={(e) =>
                            updatePrescription(index, "dosage", e.target.value)
                          }
                          className="block w-full rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs text-secondary-500">
                          Frequency
                        </label>
                        <input
                          type="text"
                          placeholder="3x daily"
                          value={presc.frequency}
                          onChange={(e) =>
                            updatePrescription(index, "frequency", e.target.value)
                          }
                          className="block w-full rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-xs text-secondary-500">
                          Instructions
                        </label>
                        <input
                          type="text"
                          placeholder="After meals"
                          value={presc.instructions}
                          onChange={(e) =>
                            updatePrescription(
                              index,
                              "instructions",
                              e.target.value
                            )
                          }
                          className="block w-full rounded-lg border border-secondary-300 bg-white px-2.5 py-1.5 text-sm text-secondary-900 placeholder-secondary-400 transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-secondary-200 px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-sm font-semibold text-secondary-700 shadow-sm transition-all duration-200 hover:bg-secondary-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="consultation-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:from-primary-700 hover:to-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin"
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
                Saving...
              </>
            ) : (
              <>
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
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                Complete & Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
