// src/pages/AboutPage.tsx
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

type Props = {
  lang: Lang; font: FontMode; user: User | null;
  onLangChange: (l: Lang) => void;
  onFontChange: (f: FontMode) => void;
  onUserChange: () => void;
};

const team = [
  { name: "Inès MEHADHEBI", role: "Chef de projet" },
  { name: "Maël LE BRIS", role: "Data Scientist" },
  { name: "Maxime CERRUTI", role: "Lead IA / Data Expert" },
  { name: "Kiroshan SIVAKUMAR", role: "Développeur Backend" },
  { name: "Camille TURA DURAND", role: "Développeuse Frontend" },
  { name: "Bastien FRANJA", role: "UX/UI Designer / Tests" },
];

function AboutPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
  const navigate = useNavigate();
  return (
    <>
      <Header lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="about-layout">
        <section className="about-card">
          <h1>LabExplain</h1>
          <p className="slogan">Préparez vos questions. Optimisez votre consultation.</p>
          <p>LabExplain est un assistant intelligent basé sur l'IA qui aide les patients à préparer leur consultation médicale...</p>
          <p className="muted">Projet académique ING2 - EFREI Paris Panthéon-Assas Université, 2025-2026. Mentor : Julien SAID</p>
        </section>

        <section className="about-card">
          <h2>L'équipe</h2>
          <ul className="team-list">
            {team.map(m => (
              <li key={m.name}><strong>{m.name}</strong> - {m.role}</li>
            ))}
          </ul>
        </section>

        <section className="about-card">
          <h2>Nos valeurs</h2>
          <ul>
            <li><strong>Inclusivité</strong> : interface pensée pour les profils fragiles</li>
            <li><strong>Green IT</strong> : interface légère, appels serveurs optimisés</li>
            <li><strong>RGPD</strong> : données protégées, consentement obligatoire, suppression à la demande</li>
          </ul>
        </section>

        <button className="button" onClick={() => navigate(-1)}>← Retour</button>
      </main>
    </>
  );
}

export default AboutPage;