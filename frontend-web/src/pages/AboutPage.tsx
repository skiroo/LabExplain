// src/pages/AboutPage.tsx
import { useNavigate } from "react-router-dom";
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

type TeamMember = {
  name: string;
  roleKey: string;
};

const team: TeamMember[] = [
  { name: "Inès MEHADHEBI", roleKey: "about.roles.projectManager" },
  { name: "Maël LE BRIS", roleKey: "about.roles.dataScientist" },
  { name: "Maxime CERRUTI", roleKey: "about.roles.aiLead" },
  { name: "Kiroshan SIVAKUMAR", roleKey: "about.roles.backendDeveloper" },
  { name: "Camille TURA DURAND", roleKey: "about.roles.frontendDeveloper" },
  { name: "Bastien FRANJA", roleKey: "about.roles.uxUiTester" },
];

function AboutPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
  const navigate = useNavigate();
  return (
    <BionicReading active={font === "tdah"}>
      <Header lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="about-layout">
        <section className="about-card">
          <h1>LabExplain</h1>
          <p className="slogan">{t(lang, "about.slogan")}</p>
          <p>{t(lang, "about.description")}</p>
          <p className="muted">{t(lang, "about.academicProject")}</p>
        </section>

        <section className="about-card">
          <h2>{t(lang, "about.teamTitle")}</h2>
          <ul className="team-list">
            {team.map(m => (
              <li key={m.name}><strong>{m.name}</strong> - {t(lang, m.roleKey)}</li>
            ))}
          </ul>
        </section>

        <section className="about-card">
          <h2>{t(lang, "about.valuesTitle")}</h2>
          <ul>
            <li><strong>{t(lang, "about.inclusivityTitle")}</strong> : {t(lang, "about.inclusivityText")}</li>
            <li><strong>{t(lang, "about.greenItTitle")}</strong> : {t(lang, "about.greenItText")}</li>
            <li><strong>{t(lang, "about.rgpdTitle")}</strong> : {t(lang, "about.rgpdText")}</li>
          </ul>
        </section>

        <button className="button" onClick={() => navigate(-1)}>← {t(lang, "about.back")}</button>
      </main>
    </BionicReading>
  );
}

export default AboutPage;
