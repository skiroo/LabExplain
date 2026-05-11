import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/ChatBot";
import Header from "../components/Header";
import { translate } from "../data/translations";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

type FormPageProps = {
  lang: Lang;
  font: FontMode;
  user: User | null;
  onLangChange: (lang: Lang) => void;
  onFontChange: (font: FontMode) => void;
  onUserChange: () => void;
};

type ViewMode = "new" | "drafts" | "sent";

function FormPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: FormPageProps) {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("new");

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  function renderContent() {
    if (user?.role === "medecin") {
      return <div className="card">Aucune consultation reçue pour le moment.</div>;
    }

    if (viewMode === "drafts") {
      return <div className="card">Brouillons à compléter.</div>;
    }

    if (viewMode === "sent") {
      return <div className="card">Aucun envoi pour le moment.</div>;
    }

    return <ChatBot lang={lang} />;
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

      <main className="form-premium-page">
        <section className="form-hero">
          <div className="form-hero-left">
            <span className="section-kicker">LabExplain</span>
            <h1>{translate(lang, "form")}</h1>
            <p className="form-hero-text">
              Préparez votre consultation dans un espace clair, rassurant et adapté à vos besoins.
            </p>
            <div className="form-hero-badges">
              <span className="trust-pill">Guidé pas à pas</span>
              <span className="trust-pill">Multilingue</span>
              <span className="trust-pill">Sans diagnostic</span>
            </div>
          </div>

          <div className="form-hero-right">
            <div className="mini-medical-card">
              <strong>{translate(lang, "medicalFrameTitle")}</strong>
              <p>{translate(lang, "medicalFrameText")}</p>
            </div>
          </div>
        </section>

        <section className="form-layout-premium">
          <aside className="form-sidebar">
            <div className="sidebar-card">
              <h3>Navigation</h3>
              <div className="sidebar-menu">
                {user.role === "medecin" ? (
                  <button type="button" onClick={() => setViewMode("sent")}>
                    {translate(lang, "consultReceived")}
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={() => setViewMode("new")}>
                      {translate(lang, "newForm")}
                    </button>
                    <button type="button" onClick={() => setViewMode("drafts")}>
                      {translate(lang, "myDrafts")}
                    </button>
                    <button type="button" onClick={() => setViewMode("sent")}>
                      {translate(lang, "mySent")}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="sidebar-card soft-card">
              <h3>Pourquoi ce formulaire ?</h3>
              <p>
                Il aide à structurer vos informations avant le rendez-vous pour réduire le stress
                et éviter les oublis.
              </p>
            </div>

            <div className="sidebar-card soft-card">
              <h3>Conseil</h3>
              <p>
                Prenez quelques minutes pour répondre calmement. Plus les informations sont claires,
                plus la consultation sera fluide.
              </p>
            </div>
          </aside>

          <section className="form-main-panel">
            <div className="panel-topbar">
              <div>
                <span className="section-kicker">Espace patient / médecin</span>
                <h2>Préparation de consultation</h2>
              </div>
              <div className="panel-status">
                <span className="status-pill">Sécurisé</span>
                <span className="status-pill">Accessible</span>
              </div>
            </div>

            <div className="form-content-box">{renderContent()}</div>
          </section>
        </section>
      </main>

      <footer>
        <p>© LabExplain 2025-2026</p>
      </footer>
    </>
  );
}

export default FormPage;
