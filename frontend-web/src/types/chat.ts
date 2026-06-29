export type StepType = "doctor" | "choice" | "range" | "text" | "final";

export type BotOption = {
  value: string;
  label: string;
  next?: string;
};

export type BotStep = {
  key: string;
  type: StepType;
  next?: string;
  min?: number;
  max?: number;
  options?: BotOption[];
};

export type ChatHistoryItem = {
  role: "bot" | "user";
  text: string;
  translationKey?: string | null;
};

export type ChatData = {
  id: number;
  answers: Record<string, string>;
  history: ChatHistoryItem[];
};

// ── Entretien dynamique piloté par l'IA ─────────────────────────────────────

export type CollectedData = {
  symptoms: string;
  medicalHistory: string;
  currentTreatments: string;
  painLevel: number | null;
  additionalNotes: string;
};

export type InterviewTurnContent =
  | string
  | {
      status: "question" | "done";
      question: string;
      options: string[];
      redFlags: string[];
      collectedData: CollectedData;
    };

export type InterviewHistoryItem = {
  role: "assistant" | "user";
  content: InterviewTurnContent;
};

export type InterviewResponse = {
  status: "question" | "done";
  question: string;
  options: string[];
  redFlags: string[];
  collectedData: CollectedData;
};

export type SummaryResult = {
  language: string;
  summary: string;
  questions: string[];
  warning: string;
  redFlags: string[];
  urgencyLevel: string;
};

// ── Rendez-vous et cabinets médicaux (carte interactive) ────────────────────

export type Cabinet = {
  id_cabinet: number;
  adresse: string | null;
  ville: string | null;
  code_postal: string | null;
  latitude: number;
  longitude: number;
  telephone: string | null;
  rpps: string;
  nom: string;
  prenom: string;
  civilite: string | null;
  specialite: string | null;
};

export type RendezVous = {
  id_rendezvous: number;
  date_heure: string;
  medecin_nom: string;
  medecin_prenom: string;
  medecin_specialite: string | null;
  lieu: string | null;
  statut: "a_venir" | "passe" | "annule";
  rpps_medecin: string | null;
  id_cabinet: number | null;
  id_patient: number;
  created_at: string;
};
