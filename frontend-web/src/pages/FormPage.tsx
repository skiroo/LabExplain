import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/Chatbot";
import Header from "../components/Header";
import { t } from "../i18n";
import type { SummaryResult } from "../types/chat";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import BionicReading from "../components/BionicReading";

type FormPageProps = {
  lang: Lang;
  font: FontMode;
  user: User | null;
  onLangChange: (lang: Lang) => void;
  onFontChange: (font: FontMode) => void;
  onUserChange: () => void;
};

function FormPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: FormPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
    }
  }, [user, navigate]);

  if (!user) return null;

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

      <main className="form-premium-page">
        <section className="form-hero">
          <div className="form-hero-left">
            <span className="section-kicker">LabExplain</span>
            <h1>{t(lang, "formPage.title")}</h1>
            <p className="form-hero-text">
              {t(lang, "formPage.heroText")}
            </p>
            <div className="form-hero-badges">
              <span className="trust-pill">{t(lang, "common.guidedStepByStep")}</span>
              <span className="trust-pill">{t(lang, "common.multilingual")}</span>
              <span className="trust-pill">{t(lang, "common.noDiagnosis")}</span>
            </div>
          </div>

          <div className="form-hero-right">
            <div className="mini-medical-card">
              <strong>{t(lang, "medical.frameTitle")}</strong>
              <p>{t(lang, "medical.frameText")}</p>
            </div>
          </div>
        </section>

        <section className="form-layout-premium">
          <aside className="form-sidebar">
            <div className="sidebar-card soft-card">
              <h3>{t(lang, "formPage.whyFormTitle")}</h3>
              <p>
                {t(lang, "formPage.whyFormText")}
              </p>
            </div>

            <div className="sidebar-card soft-card">
              <h3>{t(lang, "formPage.adviceTitle")}</h3>
              <p>
                {t(lang, "formPage.adviceText")}
              </p>
            </div>
          </aside>

          <section className="form-main-panel">
            <div className="panel-topbar">
              <div>
                <span className="section-kicker">{t(lang, "formPage.patientSpace")}</span>
                <h2>{t(lang, "formPage.consultationPreparation")}</h2>
              </div>
              <div className="panel-status">
                <span className="status-pill">{t(lang, "common.secure")}</span>
                <span className="status-pill">{t(lang, "common.accessible")}</span>
              </div>
            </div>

            <div className="form-content-box">
              {user.role === "medecin" ? (
                <div className="card">
                  {t(lang, "formPage.doctorViewText")}
                </div>
              ) : (
                <ChatBot
                  lang={lang}
                  font={font}
                  onCompleted={(result: SummaryResult, doctorName: string, rendezvousId: number | null) => {
                    navigate("/resultat", { state: { data: result, doctorName, rendezvousId } });
                  }}
                />
              )}
            </div>
          </section>
        </section>
      </main>
    </BionicReading>
  );
}

export default FormPage;
