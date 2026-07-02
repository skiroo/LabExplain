// src/pages/ResultPage.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { t } from "../i18n";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import BionicReading from "../components/BionicReading";

type Props = {
  lang: Lang; font: FontMode; user: User | null;
  onLangChange: (l: Lang) => void;
  onFontChange: (f: FontMode) => void;
  onUserChange: () => void;
};

type ResultData = {
  summary: string;
  questions: string[];
  warning: string;
  redFlags?: string[];
};

const API_URL = "http://127.0.0.1:5000/api";

function ResultPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const data: ResultData | null = location.state?.data ?? null;
  const doctorName: string = location.state?.doctorName ?? "";

  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!data) {
    navigate("/formulaire");
    return null;
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    setDownloadError("");

    try {
      const patientName = user ? `${user.prenom} ${user.nom}`.trim() : "";

      const response = await fetch(`${API_URL}/ai/summary/pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary_data: data,
          patientName,
          doctorName,
        }),
      });

      if (!response.ok) {
        throw new Error(t(lang, "result.serverPdfError"));
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = t(lang, "result.pdfFilename");
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError(t(lang, "result.downloadPdfError"));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <BionicReading active={font === "tdah"}>
      <Header simple lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="result-layout">
        {/* Avertissement médical - TOUJOURS visible en haut */}
        <div className="warning-banner" role="alert">
          ⚠️ {data.warning}
        </div>

        <section className="result-card">
          <h1>{t(lang, "result.title")}</h1>

          {data.redFlags && data.redFlags.length > 0 && (
            <div className="result-redflags">
              <h2>{t(lang, "result.attentionSignals")}</h2>
              <ul>
                {data.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
              </ul>
            </div>
          )}

          <div className="result-summary">
            <h2>{t(lang, "result.medicalSummary")}</h2>
            <p>{data.summary}</p>
          </div>

          <div className="result-questions">
            <h2>{t(lang, "result.questionsForDoctor")}</h2>
            <ol>
              {data.questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>

          {downloadError && <p className="error-inline">{downloadError}</p>}

          <div className="result-actions">
            <button className="button secondary" disabled>
              {t(lang, "result.shareWithDoctor")}
            </button>
            <button className="button secondary" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? t(lang, "result.pdfGenerating") : t(lang, "result.downloadPdf")}
            </button>
            <button className="button" onClick={() => navigate("/dashboard")}>
              {t(lang, "result.backToDashboard")}
            </button>
          </div>
        </section>
      </main>
    </BionicReading>
  );
}

export default ResultPage;
