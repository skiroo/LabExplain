import { useMemo, useState } from "react";
import { botSteps } from "../data/botSteps";
import { translate } from "../data/translations";
import { getDoctors } from "../services/storage";
import type { ChatData } from "../types/chat";
import type { Lang } from "../types/lang";

type ChatBotProps = {
  lang: Lang;
};

function ChatBot({ lang }: ChatBotProps) {
  const doctors = useMemo(() => getDoctors(), []);
  const [currentStep, setCurrentStep] = useState("start");
  const [textValue, setTextValue] = useState("");
  const [rangeValue, setRangeValue] = useState(5);
  const [doctorValue, setDoctorValue] = useState(() => {
    const firstDoctor = doctors[0];
    return firstDoctor ? `${firstDoctor.nom} ${firstDoctor.prenom}` : "";
  });
  const [chatData, setChatData] = useState<ChatData>({
    id: Date.now(),
    answers: {},
    history: [{ role: "bot", text: translate(lang, "bot_hello"), translationKey: "bot_hello" }],
  });

  const step = botSteps[currentStep];

  function restartChat() {
    setCurrentStep("start");
    setTextValue("");
    setRangeValue(5);
    setChatData({
      id: Date.now(),
      answers: {},
      history: [{ role: "bot", text: translate(lang, "bot_hello"), translationKey: "bot_hello" }],
    });
  }

  function processStep(value: string, label: string, next?: string) {
    const cleanValue = value.trim();

    if (!cleanValue || !step) {
      return;
    }

    const nextStep = next || step.next;

    setChatData((previous) => {
      const answers = { ...previous.answers };
      if (currentStep === "start") {
        answers.doctor = cleanValue;
      } else {
        answers[currentStep] = cleanValue;
      }

      const history = [...previous.history, { role: "user" as const, text: label }];

      if (nextStep && botSteps[nextStep]) {
        history.push({
          role: "bot" as const,
          text: translate(lang, botSteps[nextStep].key),
          translationKey: botSteps[nextStep].key,
        });
      }

      return { ...previous, answers, history };
    });

    if (nextStep) {
      setCurrentStep(nextStep);
    }

    setTextValue("");
  }

  function renderInputArea() {
    if (!step) {
      return null;
    }

    if (step.type === "doctor") {
      if (doctors.length === 0) {
        return <p>Aucun médecin disponible.</p>;
      }

      return (
        <div>
          <label htmlFor="doctorSelect">{translate(lang, "selectDoctor")}</label>
          <select
            id="doctorSelect"
            value={doctorValue}
            onChange={(event) => setDoctorValue(event.target.value)}
          >
            {doctors.map((doctor) => {
              const name = `${doctor.nom} ${doctor.prenom}`;
              return (
                <option key={doctor.email} value={name}>
                  {name}
                </option>
              );
            })}
          </select>
          <button type="button" onClick={() => processStep(doctorValue, doctorValue)}>
            {translate(lang, "next")}
          </button>
        </div>
      );
    }

    if (step.type === "choice") {
      return (
        <div className="choice-grid">
          {step.options?.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => processStep(option.value, translate(lang, option.label), option.next)}
            >
              {translate(lang, option.label)}
            </button>
          ))}
        </div>
      );
    }

    if (step.type === "text") {
      return (
        <div>
          <input
            type="text"
            placeholder="..."
            value={textValue}
            onChange={(event) => setTextValue(event.target.value)}
          />
          <button type="button" onClick={() => processStep(textValue, textValue)}>
            {translate(lang, "next")}
          </button>
        </div>
      );
    }

    if (step.type === "range") {
      return (
        <div>
          <input
            type="range"
            min={step.min}
            max={step.max}
            value={rangeValue}
            onChange={(event) => setRangeValue(Number(event.target.value))}
          />
          <div>
            <strong>{rangeValue}</strong>
          </div>
          <button
            type="button"
            onClick={() => processStep(String(rangeValue), String(rangeValue))}
          >
            {translate(lang, "next")}
          </button>
        </div>
      );
    }

    return (
      <div className="summary-box">
        <p>{translate(lang, step.key)}</p>
        <button type="button" onClick={restartChat}>
          {translate(lang, "newForm")}
        </button>
      </div>
    );
  }

  return (
    <div className="chat-shell">
      <div id="chat-box">
        {chatData.history.map((item, index) => (
          <div key={`${item.role}-${index}`} className={`${item.role}-msg`}>
            {item.role === "bot" && item.translationKey
              ? translate(lang, item.translationKey)
              : item.text}
          </div>
        ))}
      </div>
      <div id="input-area">{renderInputArea()}</div>
    </div>
  );
}

export default ChatBot;
