// src/pages/ResultPage.tsx
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
};

function ResultPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const data: ResultData | null = location.state?.data ?? null;

  if (!data) {
    navigate("/formulaire");
    return null;
  }

  return (
    <>
      <Header simple lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="result-layout">
        {/* Avertissement médical — TOUJOURS visible en haut */}
        <div className="warning-banner" role="alert">
          ⚠️ {data.warning}
        </div>

        <section className="result-card">
          <h1>Résumé de votre consultation</h1>

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

          <div className="result-actions">
            <button className="button secondary" disabled>
              Partager avec mon médecin
            </button>
            <button className="button secondary" disabled>
              Télécharger en PDF
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