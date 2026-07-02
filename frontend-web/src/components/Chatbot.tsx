import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../services/api";
import { getUpcomingRendezVous } from "../services/rendezvousApi";
import { t } from "../i18n";
import BionicReading from "./BionicReading";
import type {
  InterviewHistoryItem,
  InterviewResponse,
  RendezVous,
  SummaryResult,
} from "../types/chat";
import type { FontMode, Lang } from "../types/lang";

type ChatBotProps = {
  lang: Lang;
  font: FontMode;
  onCompleted: (result: SummaryResult, doctorName: string, rendezvousId: number | null) => void;
};

type DisplayMessage = {
  role: "bot" | "user";
  text: string;
};

// Nombre maximum de questions - doit rester cohérent avec MAX_INTERVIEW_TURNS
// côté backend (backend/ai/interview_handler.py). Sert ici uniquement à
// afficher une barre de progression indicative.
const MAX_TURNS = 15;

function ChatBot({ lang, font, onCompleted }: ChatBotProps) {
  const [rendezvousList, setRendezvousList] = useState<RendezVous[]>([]);
  const [rendezvousLoaded, setRendezvousLoaded] = useState(false);
  const [selectedRendezvousId, setSelectedRendezvousId] = useState<string>("");
  const [doctorChosen, setDoctorChosen] = useState(false);

  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [currentOptions, setCurrentOptions] = useState<string[]>([]);
  const [textValue, setTextValue] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [finished, setFinished] = useState(false);

  const turnsAsked = useMemo(
    () => history.filter((h) => h.role === "assistant").length,
    [history]
  );

  const selectedRendezvous = useMemo(
    () => rendezvousList.find((r) => String(r.id_rendezvous) === selectedRendezvousId) || null,
    [rendezvousList, selectedRendezvousId]
  );

  const doctorName = selectedRendezvous
    ? `${selectedRendezvous.medecin_prenom} ${selectedRendezvous.medecin_nom}`
    : "";

  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getUpcomingRendezVous().then((list) => {
      setRendezvousList(list);
      setRendezvousLoaded(true);
    });
  }, []);

  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, currentOptions]);

  // ── Appel d'un tour de l'entretien dynamique ────────────────────────────
  async function requestNextTurn(nextHistory: InterviewHistoryItem[]) {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await apiPost<InterviewResponse>("/ai/interview", {
        history: nextHistory,
        doctorName,
        language: lang,
      });

      if (!response.success || !response.data) {
        setErrorMsg(response.message || t(lang, "chatbot.questionGenerationError"));
        setLoading(false);
        return;
      }

      const turn = response.data;
      const updatedHistory: InterviewHistoryItem[] = [
        ...nextHistory,
        { role: "assistant", content: turn },
      ];
      setHistory(updatedHistory);

      if (turn.status === "done") {
        setFinished(true);
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: t(lang, "chatbot.enoughInfo") },
        ]);
        await requestSummary(turn);
        return;
      }

      setMessages((prev) => [...prev, { role: "bot", text: turn.question }]);
      setCurrentOptions(turn.options || []);
    } catch {
      setErrorMsg(t(lang, "chatbot.assistantConnectionError"));
    } finally {
      setLoading(false);
    }
  }

  // ── Génération du résumé final une fois l'entretien terminé ─────────────
  async function requestSummary(lastTurn: InterviewResponse) {
    setLoading(true);
    setErrorMsg("");

    try {
      const response = await apiPost<SummaryResult>("/ai/summary", {
        symptoms: lastTurn.collectedData.symptoms,
        medicalHistory: lastTurn.collectedData.medicalHistory,
        currentTreatments: lastTurn.collectedData.currentTreatments,
        painLevel: lastTurn.collectedData.painLevel,
        additionalNotes: lastTurn.collectedData.additionalNotes,
        language: lang,
      });

      if (!response.success || !response.data) {
        setErrorMsg(response.message || t(lang, "chatbot.summaryGenerationError"));
        setLoading(false);
        return;
      }

      // On fusionne les éventuels signaux d'alarme repérés pendant l'entretien
      // avec ceux détectés par le résumé final, sans doublon.
      const mergedRedFlags = Array.from(
        new Set([...(lastTurn.redFlags || []), ...(response.data.redFlags || [])])
      );

      onCompleted(
        { ...response.data, redFlags: mergedRedFlags },
        doctorName,
        selectedRendezvous?.id_rendezvous ?? null
      );
    } catch {
      setErrorMsg(t(lang, "chatbot.summaryConnectionError"));
    } finally {
      setLoading(false);
    }
  }

  function startInterview() {
    setDoctorChosen(true);
    setMessages([]);
    requestNextTurn([]);
  }

  function answer(value: string) {
    const cleanValue = value.trim();
    if (!cleanValue || loading || finished) return;

    setMessages((prev) => [...prev, { role: "user", text: cleanValue }]);
    setCurrentOptions([]);
    setTextValue("");

    const nextHistory: InterviewHistoryItem[] = [
      ...history,
      { role: "user", content: cleanValue },
    ];
    requestNextTurn(nextHistory);
  }

  function restart() {
    setHistory([]);
    setMessages([]);
    setCurrentOptions([]);
    setTextValue("");
    setFinished(false);
    setErrorMsg("");
    setDoctorChosen(false);
    setSelectedRendezvousId("");
  }

  function formatRendezvousDate(dateHeure: string): string {
    const date = new Date(dateHeure);
    if (Number.isNaN(date.getTime())) return dateHeure;
    return date.toLocaleString(lang === "en" ? "en-GB" : "fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // ── Étape 0 : choix du rendez-vous à préparer ────────────────────────────
  if (!doctorChosen) {
    return (
      <BionicReading active={font === "tdah"}>
        <div className="chat-shell">
          <div className="summary-box">
            <p>{t(lang, "chatbot.chooseAppointment")}</p>

            {!rendezvousLoaded ? (
              <p>{t(lang, "chatbot.loadingAppointments")}</p>
            ) : rendezvousList.length === 0 ? (
              <>
                <p>{t(lang, "chatbot.noUpcomingAppointment")}</p>
                <Link to="/rendez-vous" className="button secondary">
                  {t(lang, "chatbot.declareAppointment")}
                </Link>
              </>
            ) : (
              <select
                value={selectedRendezvousId}
                onChange={(event) => setSelectedRendezvousId(event.target.value)}
              >
                <option value="">{t(lang, "chatbot.selectPlaceholder")}</option>
                {rendezvousList.map((rdv) => (
                  <option key={rdv.id_rendezvous} value={String(rdv.id_rendezvous)}>
                    {formatRendezvousDate(rdv.date_heure)} - {rdv.medecin_prenom} {rdv.medecin_nom}
                    {rdv.medecin_specialite ? ` (${rdv.medecin_specialite})` : ""}
                  </option>
                ))}
              </select>
            )}

            <button type="button" onClick={startInterview} disabled={!selectedRendezvous}>
              {t(lang, "common.next")}
            </button>
          </div>
        </div>
      </BionicReading>
    );
  }

  return (
    <BionicReading active={font === "tdah"}>
      <div className="chat-shell">
        <div className="progress-bar">
          <span style={{ width: `${Math.min((turnsAsked / MAX_TURNS) * 100, 100)}%` }} />
        </div>

        <div id="chat-box" ref={chatBoxRef}>
          {messages.map((item, index) => (
            <div key={`${item.role}-${index}`} className={`${item.role}-msg`}>
              {item.text}
            </div>
          ))}
          {loading && <div className="bot-msg">…</div>}
        </div>

        <div id="input-area">
          {errorMsg && <p className="error-inline">{errorMsg}</p>}

          {finished ? (
            <div className="summary-box">
              <p>{t(lang, "chatbot.summaryPreparing")}</p>
              <button type="button" onClick={restart}>
                {t(lang, "chatbot.newForm")}
              </button>
            </div>
          ) : currentOptions.length > 0 ? (
            <div className="choice-grid">
              {currentOptions.map((option) => (
                <button key={option} type="button" disabled={loading} onClick={() => answer(option)}>
                  {option}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder={t(lang, "chatbot.inputPlaceholder")}
                value={textValue}
                disabled={loading}
                onChange={(event) => setTextValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") answer(textValue);
                }}
              />
              <button type="button" disabled={loading} onClick={() => answer(textValue)}>
                {t(lang, "common.next")}
              </button>
            </div>
          )}
        </div>
      </div>
    </BionicReading>
  );
}

export default ChatBot;
