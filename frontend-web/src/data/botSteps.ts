import type { BotStep } from "../types/chat";

export const botSteps: Record<string, BotStep> = {
  start: { key: "bot_hello", type: "doctor", next: "urgency" },
  urgency: {
    key: "question_urgency",
    type: "choice",
    next: "redflags",
    options: [
      { value: "urgent_bad", label: "urgent_bad" },
      { value: "urgent_medium", label: "urgent_medium" },
      { value: "urgent_routine", label: "urgent_routine" },
    ],
  },
  redflags: {
    key: "question_redflags",
    type: "choice",
    options: [
      { value: "yes", label: "yes", next: "emergency_stop" },
      { value: "no", label: "no", next: "symptoms" },
    ],
  },
  emergency_stop: { key: "emergency", type: "final" },
  symptoms: {
    key: "question_symptom",
    type: "choice",
    options: [
      { value: "symptom_pain", label: "symptom_pain", next: "pain_location" },
      { value: "symptom_fever", label: "symptom_fever", next: "duration" },
      { value: "symptom_breath", label: "symptom_breath", next: "breath_type" },
      { value: "symptom_digestion", label: "symptom_digestion", next: "duration" },
    ],
  },
  pain_location: {
    key: "question_pain_location",
    type: "choice",
    next: "intensity",
    options: [
      { value: "head", label: "head" },
      { value: "chest", label: "chest" },
      { value: "belly", label: "belly" },
      { value: "limbs", label: "limbs" },
    ],
  },
  intensity: { key: "question_intensity", type: "range", min: 1, max: 10, next: "duration" },
  breath_type: {
    key: "question_breath_type",
    type: "choice",
    options: [
      { value: "breath_short", label: "breath_short", next: "duration" },
      { value: "breath_cough", label: "breath_cough", next: "cough_type" },
    ],
  },
  cough_type: {
    key: "question_cough_type",
    type: "choice",
    next: "duration",
    options: [
      { value: "cough_dry", label: "cough_dry" },
      { value: "cough_wet", label: "cough_wet" },
    ],
  },
  duration: { key: "question_duration", type: "text", next: "meds" },
  meds: { key: "question_meds", type: "text", next: "notes" },
  notes: { key: "question_notes", type: "text", next: "end" },
  end: { key: "completed", type: "final" },
};
