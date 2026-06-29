import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/Chatbot";
import Header from "../components/Header";
import { translate } from "../data/translations";
import type { SummaryResult } from "../types/chat";
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

function FormPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: FormPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
    }
  }, [user, navigate]);

  if (!user) return null;

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
                <span className="section-kicker">Espace patient</span>
                <h2>Préparation de consultation</h2>
              </div>
              <div className="panel-status">
                <span className="status-pill">Sécurisé</span>
                <span className="status-pill">Accessible</span>
              </div>
            </div>

            <div className="form-content-box">
              {user.role === "medecin" ? (
                <div className="card">
                  Les comptes-rendus reçus de vos patients sont disponibles dans votre tableau de bord.
                </div>
              ) : (
                <ChatBot
                  lang={lang}
                  onCompleted={(result: SummaryResult, doctorName: string, rendezvousId: number | null) => {
                    navigate("/resultat", { state: { data: result, doctorName, rendezvousId } });
                  }}
                />
              )}
            </div>
          </section>
        </section>
      </main>
    </>
  );
}

export default FormPage;
