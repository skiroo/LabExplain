import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { translate } from "../data/translations";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

type HomePageProps = {
  lang: Lang;
  font: FontMode;
  user: User | null;
  onLangChange: (lang: Lang) => void;
  onFontChange: (font: FontMode) => void;
  onUserChange: () => void;
};

function HomePage({ lang, font, user, onLangChange, onFontChange, onUserChange }: HomePageProps) {
  const navigate = useNavigate();

  function start() {
    navigate(user ? "/formulaire" : "/connexion");
  }

  return (
    <>
      <Header
        lang={lang}
        font={font}
        user={user}
        onLangChange={onLangChange}
        onFontChange={onFontChange}
        onUserChange={onUserChange}
      />

      <main className="home-premium">
        <section className="hero-premium">
          <div className="hero-left">
            <span className="hero-badge">{translate(lang, "tagline")}</span>
            <h1>{translate(lang, "welcome")}</h1>
            <p className="hero-text">{translate(lang, "desc")}</p>
            <p className="hero-subtext">
              LabExplain aide le patient à structurer ses symptômes, ses traitements et ses antécédents
              avant le rendez-vous, sans jamais remplacer un professionnel de santé.
            </p>

            <div className="hero-cta">
              <button className="button primary big-btn" type="button" onClick={start}>
                {translate(lang, "startNow")}
              </button>
              <Link className="button secondary big-btn" to="/connexion">
                {translate(lang, "login")}
              </Link>
            </div>

            <div className="hero-trust-row">
              <div className="trust-pill">Données locales</div>
              <div className="trust-pill">Multilingue</div>
              <div className="trust-pill">Accessibilité cognitive</div>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-card hero-card-main">
              <div className="mock-header">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="mock-content">
                <div className="mock-bot">{translate(lang, "bot_hello")}</div>
                <div className="mock-user">Dr Martin</div>
                <div className="mock-bot">{translate(lang, "question_urgency")}</div>
                <div className="mock-options">
                  <span>{translate(lang, "urgent_bad")}</span>
                  <span>{translate(lang, "urgent_medium")}</span>
                  <span>{translate(lang, "urgent_routine")}</span>
                </div>
              </div>
            </div>

            <div className="floating-card floating-top">
              <strong>+ clair</strong>
              <p>Un résumé structuré avant la consultation</p>
            </div>
            <div className="floating-card floating-bottom">
              <strong>+ accessible</strong>
              <p>Langues et polices adaptées à chaque profil</p>
            </div>
          </div>
        </section>

        <section className="medical-warning">
          <div className="warning-card">
            <strong>{translate(lang, "medicalFrameTitle")}</strong>
            <p>{translate(lang, "medicalFrameText")}</p>
          </div>
        </section>

        <section className="stats-strip">
          <div className="stat-box">
            <h3>4</h3>
            <p>langues disponibles</p>
          </div>
          <div className="stat-box">
            <h3>3</h3>
            <p>modes de lecture adaptés</p>
          </div>
          <div className="stat-box">
            <h3>1</h3>
            <p>objectif : mieux communiquer</p>
          </div>
        </section>

        <section className="section-block">
          <div className="section-head">
            <span className="section-kicker">Pourquoi LabExplain ?</span>
            <h2>Une expérience pensée pour les patients qui ont du mal à exprimer l’essentiel</h2>
            <p>
              Le stress, la langue, la douleur, l’âge ou certains troubles cognitifs peuvent rendre
              une consultation plus difficile. LabExplain prépare l’échange avant le rendez-vous.
            </p>
          </div>

          <div className="feature-grid premium-grid">
            <article className="feature-card gradient-card">
              <h3>{translate(lang, "contextTitle")}</h3>
              <p>{translate(lang, "contextText")}</p>
            </article>
            <article className="feature-card gradient-card">
              <h3>{translate(lang, "solutionTitle")}</h3>
              <p>{translate(lang, "solutionText")}</p>
            </article>
            <article className="feature-card gradient-card">
              <h3>{translate(lang, "positionTitle")}</h3>
              <p>{translate(lang, "positionText")}</p>
            </article>
          </div>
        </section>

        <section className="section-block final-cta">
          <div className="final-cta-card">
            <span className="section-kicker">Prêt à commencer ?</span>
            <h2>Préparez votre consultation autrement</h2>
            <p>
              Une interface simple, moderne et inclusive pour aider le patient à mieux communiquer
              avec le professionnel de santé.
            </p>
            <div className="hero-cta">
              <button className="button primary big-btn" type="button" onClick={start}>
                {translate(lang, "startNow")}
              </button>
              <Link className="button secondary big-btn" to="/connexion">
                {translate(lang, "login")}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <p>© LabExplain 2025-2026</p>
      </footer>
    </>
  );
}

export default HomePage;
