import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { t } from "../i18n";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import BionicReading from "../components/BionicReading";

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
    <BionicReading active={font === "tdah"}>
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
            <span className="hero-badge">{t(lang, "home.heroBadge")}</span>
            <h1>{t(lang, "home.heroTitle")}</h1>
            <p className="hero-text">{t(lang, "home.heroDesc")}</p>
            <p className="hero-subtext">
              {t(lang, "home.heroSubtext")}
            </p>

            <div className="hero-cta">
              <button className="button primary big-btn" type="button" onClick={start}>
                {t(lang, "home.startNow")}
              </button>
              {!user && (
                <Link className="button secondary big-btn" to="/connexion">
                  {t(lang, "auth.login")}
                </Link>
              )}
            </div>

            <div className="hero-trust-row">
              <div className="trust-pill">{t(lang, "home.trustLocalData")}</div>
              <div className="trust-pill">{t(lang, "home.trustMultilingual")}</div>
              <div className="trust-pill">{t(lang, "home.trustCognitiveAccessibility")}</div>
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
                <div className="mock-bot">{t(lang, "home.demoBotHello")}</div>
                <div className="mock-user">{t(lang, "home.doctorExample")}</div>
                <div className="mock-bot">{t(lang, "home.demoQuestionUrgency")}</div>
                <div className="mock-options">
                  <span>{t(lang, "home.demoUrgentBad")}</span>
                  <span>{t(lang, "home.demoUrgentMedium")}</span>
                  <span>{t(lang, "home.demoUrgentRoutine")}</span>
                </div>
              </div>
            </div>

            <div className="floating-card floating-top">
              <strong>{t(lang, "home.clearerTitle")}</strong>
              <p>{t(lang, "home.clearerText")}</p>
            </div>
            <div className="floating-card floating-bottom">
              <strong>{t(lang, "home.accessibleTitle")}</strong>
              <p>{t(lang, "home.accessibleText")}</p>
            </div>
          </div>
        </section>

        <section className="medical-warning">
          <div className="warning-card">
            <strong>{t(lang, "medical.frameTitle")}</strong>
            <p>{t(lang, "medical.frameText")}</p>
          </div>
        </section>

        <section className="stats-strip">
          <div className="stat-box">
            <h3>4</h3>
            <p>{t(lang, "home.availableLanguagesCount")}</p>
          </div>
          <div className="stat-box">
            <h3>3</h3>
            <p>{t(lang, "home.readingModesCount")}</p>
          </div>
          <div className="stat-box">
            <h3>1</h3>
            <p>{t(lang, "home.communicationGoal")}</p>
          </div>
        </section>

        <section className="section-block">
          <div className="section-head">
            <span className="section-kicker">{t(lang, "home.whyTitle")}</span>
            <h2>{t(lang, "home.whySubtitle")}</h2>
            <p>
              {t(lang, "home.whyText")}
            </p>
          </div>

          <div className="feature-grid premium-grid">
            <article className="feature-card gradient-card">
              <h3>{t(lang, "home.contextTitle")}</h3>
              <p>{t(lang, "home.contextText")}</p>
            </article>
            <article className="feature-card gradient-card">
              <h3>{t(lang, "home.solutionTitle")}</h3>
              <p>{t(lang, "home.solutionText")}</p>
            </article>
            <article className="feature-card gradient-card">
              <h3>{t(lang, "home.positionTitle")}</h3>
              <p>{t(lang, "home.positionText")}</p>
            </article>
          </div>
        </section>

        <section className="section-block final-cta">
          <div className="final-cta-card">
            <span className="section-kicker">{t(lang, "home.finalCtaKicker")}</span>
            <h2>{t(lang, "home.finalCtaTitle")}</h2>
            <p>
              {t(lang, "home.finalCtaText")}
            </p>
            <div className="hero-cta">
              <button className="button primary big-btn" type="button" onClick={start}>
                {t(lang, "home.startNow")}
              </button>
              {!user && (
                <Link className="button secondary big-btn" to="/connexion">
                  {t(lang, "auth.login")}
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>
    </BionicReading>
  );
}

export default HomePage;
