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
