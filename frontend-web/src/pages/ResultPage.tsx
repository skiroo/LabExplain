// src/pages/ResultPage.tsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

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
        throw new Error("Le serveur n'a pas pu générer le PDF.");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "synthese-labexplain.pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setDownloadError("Le téléchargement du PDF a échoué. Veuillez réessayer.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <Header simple lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="result-layout">
        {/* Avertissement médical - TOUJOURS visible en haut */}
        <div className="warning-banner" role="alert">
          ⚠️ {data.warning}
        </div>

        <section className="result-card">
          <h1>Résumé de votre consultation</h1>

          {data.redFlags && data.redFlags.length > 0 && (
            <div className="result-redflags">
              <h2>Signaux d'attention relevés</h2>
              <ul>
                {data.redFlags.map((flag, i) => <li key={i}>{flag}</li>)}
              </ul>
            </div>
          )}

          <div className="result-summary">
            <h2>Résumé médical</h2>
            <p>{data.summary}</p>
          </div>

          <div className="result-questions">
            <h2>Questions à poser à votre médecin</h2>
            <ol>
              {data.questions.map((q, i) => <li key={i}>{q}</li>)}
            </ol>
          </div>

          {downloadError && <p className="error-inline">{downloadError}</p>}

          <div className="result-actions">
            <button className="button secondary" disabled>
              Partager avec mon médecin
            </button>
            <button className="button secondary" onClick={handleDownloadPdf} disabled={downloading}>
              {downloading ? "Génération..." : "Télécharger en PDF"}
            </button>
            <button className="button" onClick={() => navigate("/dashboard")}>
              Retour au dashboard
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default ResultPage;