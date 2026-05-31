/*
Fichier : DashboardPage.tsx
Dossier : src/pages/
Description :
  Dashboard de LabExplain.
  - Patient : profil, consultations, rendez-vous, questionnaires
  - Médecin : profil, rendez-vous patients, comptes-rendus reçus
*/

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import "./DashboardPage.css";

type DashboardPageProps = {
  lang: Lang;
  font: FontMode;
  user: User | null;
  onLangChange: (lang: Lang) => void;
  onFontChange: (font: FontMode) => void;
  onUserChange: () => void;
};

type TabId = "profil" | "consultations" | "rendezvous" | "questionnaires";
type DoctorTabId = "profil" | "rendezvous" | "compteRendus";

type Consultation = {
  id: number;
  date: string;
  medecin: string;
  specialite: string;
  resume: string;
  statut: "envoyé" | "brouillon";
};

type RendezVous = {
  id: number;
  date: string;
  heure: string;
  medecin: string;
  specialite: string;
  lieu: string;
  statut: "passé" | "à venir" | "annulé";
};

type CompteRendu = {
  id: number;
  dateEnvoi: string;
  patient: string;
  resume: string;
  annotation: string;
};

type DoctorRendezVous = {
  id: number;
  date: string;
  heure: string;
  patient: string;
  motif: string;
  statut: "à venir" | "passé" | "annulé";
};

// ── Données mockées patient ──────────────────────────────────────────────────

const mockConsultations: Consultation[] = [
  {
    id: 1,
    date: "2025-11-14",
    medecin: "Dr. Sarah Moreau",
    specialite: "Médecin généraliste",
    resume: "Consultation pour douleurs thoraciques légères. Antécédents d'asthme mentionnés. Prescription de Ventoline renouvelée. Bilan sanguin recommandé dans 3 mois.",
    statut: "envoyé",
  },
  {
    id: 2,
    date: "2025-09-03",
    medecin: "Dr. Ahmed Benali",
    specialite: "Pneumologue",
    resume: "Suivi asthme annuel. Spirométrie dans les normes. Aucun changement de traitement.",
    statut: "envoyé",
  },
  {
    id: 3,
    date: "2026-01-20",
    medecin: "Dr. Sarah Moreau",
    specialite: "Médecin généraliste",
    resume: "",
    statut: "brouillon",
  },
];

const mockRendezVous: RendezVous[] = [
  {
    id: 1,
    date: "2026-05-28",
    heure: "10h30",
    medecin: "Dr. Sarah Moreau",
    specialite: "Médecin généraliste",
    lieu: "Cabinet médical du Parc, Paris 15e",
    statut: "à venir",
  },
  {
    id: 2,
    date: "2026-06-12",
    heure: "14h00",
    medecin: "Dr. Ahmed Benali",
    specialite: "Pneumologue",
    lieu: "Hôpital Lariboisière, Paris 10e",
    statut: "à venir",
  },
  {
    id: 3,
    date: "2025-11-14",
    heure: "09h00",
    medecin: "Dr. Sarah Moreau",
    specialite: "Médecin généraliste",
    lieu: "Cabinet médical du Parc, Paris 15e",
    statut: "passé",
  },
  {
    id: 4,
    date: "2025-09-03",
    heure: "11h15",
    medecin: "Dr. Ahmed Benali",
    specialite: "Pneumologue",
    lieu: "Hôpital Lariboisière, Paris 10e",
    statut: "passé",
  },
];

// ── Données mockées médecin ──────────────────────────────────────────────────

const mockDoctorRendezVous: DoctorRendezVous[] = [
  {
    id: 1,
    date: "2026-06-02",
    heure: "09h00",
    patient: "Jean Dupont",
    motif: "Douleurs thoraciques",
    statut: "à venir",
  },
  {
    id: 2,
    date: "2026-06-02",
    heure: "10h30",
    patient: "Marie Lefebvre",
    motif: "Suivi tension artérielle",
    statut: "à venir",
  },
  {
    id: 3,
    date: "2026-06-03",
    heure: "14h00",
    patient: "Ahmed Kader",
    motif: "Renouvellement ordonnance",
    statut: "à venir",
  },
  {
    id: 4,
    date: "2026-05-28",
    heure: "11h00",
    patient: "Sophie Martin",
    motif: "Bilan annuel",
    statut: "passé",
  },
];

const mockCompteRendus: CompteRendu[] = [
  {
    id: 1,
    dateEnvoi: "2026-05-27",
    patient: "Jean Dupont",
    resume: "Le patient décrit des douleurs thoraciques légères apparues il y a 3 jours, sans irradiation. Pas de fièvre. Antécédents d'asthme. Traitement actuel : Ventoline en cas de crise.",
    annotation: "",
  },
  {
    id: 2,
    dateEnvoi: "2026-05-26",
    patient: "Marie Lefebvre",
    resume: "Patiente suivie pour hypertension. Signale des maux de tête fréquents en fin de journée. Tension mesurée à 14/9 ce matin. Traitement : Amlodipine 5mg.",
    annotation: "",
  },
  {
    id: 3,
    dateEnvoi: "2026-05-24",
    patient: "Ahmed Kader",
    resume: "Renouvellement de traitement pour diabète de type 2. Glycémie à jeun : 1,32 g/L. Pas de nouveau symptôme signalé.",
    annotation: "",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getAge(birthdate?: string): string {
  if (!birthdate) return "—";
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} ans`;
}

function handleDownloadPDF(patientName: string, resume: string) {
  const content = `COMPTE-RENDU PATIENT\n\nPatient : ${patientName}\n\n${resume}`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `compte-rendu-${patientName.replace(" ", "-").toLowerCase()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Composant principal ──────────────────────────────────────────────────────

function DashboardPage({
  lang,
  font,
  user,
  onLangChange,
  onFontChange,
  onUserChange,
}: DashboardPageProps) {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  // États patient
  const [activeTab, setActiveTab] = useState<TabId>("profil");
  const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);
  const [editBio, setEditBio] = useState(false);
  const [bioValues, setBioValues] = useState({
    weight: user?.weight ?? "",
    height: user?.height ?? "",
  });
  const [editMedical, setEditMedical] = useState(false);
  const [medicalValues, setMedicalValues] = useState({
    antecedents: user?.antecedents ?? "",
    traitements: user?.traitements ?? "",
    allergies: user?.allergies ?? "",
  });

  // États médecin
  const [doctorTab, setDoctorTab] = useState<DoctorTabId>("profil");
  const [expandedCR, setExpandedCR] = useState<number | null>(null);
  const [annotations, setAnnotations] = useState<Record<number, string>>(
    Object.fromEntries(mockCompteRendus.map((cr) => [cr.id, cr.annotation]))
  );
  const [editingAnnotation, setEditingAnnotation] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/connexion");
      return;
    }
    setMounted(true);
  }, [user, navigate]);

  if (!user) return null;

  // ── DASHBOARD MÉDECIN ────────────────────────────────────────────────────

  if (user.role === "medecin") {
    const doctorTabs: { id: DoctorTabId; label: string; icon: string }[] = [
      { id: "profil", label: "Mon profil", icon: "👤" },
      { id: "rendezvous", label: "Rendez-vous", icon: "📅" },
      { id: "compteRendus", label: "Comptes-rendus", icon: "📋" },
    ];

    const rdvAvenir = mockDoctorRendezVous.filter((r) => r.statut === "à venir");
    const rdvPasses = mockDoctorRendezVous.filter((r) => r.statut === "passé");

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

        <main className={`dashboard-root ${mounted ? "dashboard-mounted" : ""}`}>
          {/* Sidebar médecin */}
          <aside className="dashboard-sidebar">
            <div className="dashboard-identity">
              <div className="dashboard-avatar">
                {user.prenom[0]}{user.nom[0]}
              </div>
              <div className="dashboard-identity-info">
                <p className="dashboard-identity-name">{user.prenom} {user.nom}</p>
                <p className="dashboard-identity-role">Médecin</p>
              </div>
            </div>

            <nav className="dashboard-nav">
              {doctorTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`dashboard-nav-item ${doctorTab === tab.id ? "active" : ""}`}
                  onClick={() => setDoctorTab(tab.id)}
                >
                  <span className="nav-icon">{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.id === "rendezvous" && rdvAvenir.length > 0 && (
                    <span className="nav-badge">{rdvAvenir.length}</span>
                  )}
                  {tab.id === "compteRendus" && mockCompteRendus.length > 0 && (
                    <span className="nav-badge">{mockCompteRendus.length}</span>
                  )}
                </button>
              ))}
            </nav>
          </aside>

          {/* Contenu médecin */}
          <section className="dashboard-content">

            {/* ===== PROFIL MÉDECIN ===== */}
            {doctorTab === "profil" && (
              <div className="tab-panel">
                <div className="tab-header">
                  <h1>Mon profil</h1>
                  <p className="tab-subtitle">Vos informations professionnelles</p>
                </div>
                <div className="profile-grid">
                  <div className="profile-card">
                    <h2 className="card-title">Informations personnelles</h2>
                    <div className="profile-fields">
                      <div className="profile-field">
                        <span className="field-label">Prénom</span>
                        <span className="field-value">{user.prenom}</span>
                      </div>
                      <div className="profile-field">
                        <span className="field-label">Nom</span>
                        <span className="field-value">{user.nom}</span>
                      </div>
                      <div className="profile-field">
                        <span className="field-label">Email</span>
                        <span className="field-value">{user.email}</span>
                      </div>
                      <div className="profile-field">
                        <span className="field-label">Rôle</span>
                        <span className="field-value">Médecin</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== RENDEZ-VOUS MÉDECIN ===== */}
            {doctorTab === "rendezvous" && (
              <div className="tab-panel">
                <div className="tab-header">
                  <h1>Rendez-vous</h1>
                  <p className="tab-subtitle">
                    {rdvAvenir.length} à venir · {rdvPasses.length} passé{rdvPasses.length > 1 ? "s" : ""}
                  </p>
                </div>

                {rdvAvenir.length > 0 && (
                  <div className="rdv-section">
                    <h2 className="rdv-section-title">À venir</h2>
                    <div className="rdv-list">
                      {rdvAvenir.map((rdv) => (
                        <div key={rdv.id} className="rdv-card rdv-upcoming">
                          <div className="rdv-date-block">
                            <span className="rdv-day">
                              {new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric" })}
                            </span>
                            <span className="rdv-month">
                              {new Date(rdv.date).toLocaleDateString("fr-FR", { month: "short" })}
                            </span>
                            <span className="rdv-heure">{rdv.heure}</span>
                          </div>
                          <div className="rdv-info">
                            <p className="rdv-doctor">👤 {rdv.patient}</p>
                            <p className="rdv-specialite">Motif : {rdv.motif}</p>
                          </div>
                          <div className="rdv-cta-col">
                            <span className="status-badge status-upcoming">À venir</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {rdvPasses.length > 0 && (
                  <div className="rdv-section">
                    <h2 className="rdv-section-title">Historique</h2>
                    <div className="rdv-list">
                      {rdvPasses.map((rdv) => (
                        <div key={rdv.id} className="rdv-card rdv-past">
                          <div className="rdv-date-block rdv-date-past">
                            <span className="rdv-day">
                              {new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric" })}
                            </span>
                            <span className="rdv-month">
                              {new Date(rdv.date).toLocaleDateString("fr-FR", { month: "short" })}
                            </span>
                            <span className="rdv-heure">{rdv.heure}</span>
                          </div>
                          <div className="rdv-info">
                            <p className="rdv-doctor">👤 {rdv.patient}</p>
                            <p className="rdv-specialite">Motif : {rdv.motif}</p>
                          </div>
                          <div className="rdv-cta-col">
                            <span className="status-badge status-past">Passé</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== COMPTES-RENDUS REÇUS ===== */}
            {doctorTab === "compteRendus" && (
              <div className="tab-panel">
                <div className="tab-header">
                  <h1>Comptes-rendus reçus</h1>
                  <p className="tab-subtitle">
                    {mockCompteRendus.length} résumé{mockCompteRendus.length > 1 ? "s" : ""} envoyé{mockCompteRendus.length > 1 ? "s" : ""} par vos patients
                  </p>
                </div>

                <div className="consultations-list">
                  {mockCompteRendus.map((cr) => (
                    <div key={cr.id} className="consultation-card">
                      <div className="consultation-header">
                        <div className="consultation-meta">
                          <span className="consultation-date">{formatDate(cr.dateEnvoi)}</span>
                          <span className="consultation-doctor">👤 {cr.patient}</span>
                        </div>
                        <div className="consultation-actions">
                          <button
                            type="button"
                            className="rdv-prepare-btn"
                            onClick={() => handleDownloadPDF(cr.patient, cr.resume)}
                          >
                            ⬇ PDF
                          </button>
                          <button
                            type="button"
                            className="btn-expand"
                            onClick={() => setExpandedCR(expandedCR === cr.id ? null : cr.id)}
                          >
                            {expandedCR === cr.id ? "Masquer" : "Voir le résumé"}
                          </button>
                        </div>
                      </div>

                      {expandedCR === cr.id && (
                        <div className="consultation-resume">
                          <h3>Résumé IA</h3>
                          <p>{cr.resume}</p>

                          <div style={{ marginTop: "1rem" }}>
                            <h3>Annotation</h3>
                            {editingAnnotation === cr.id ? (
                              <>
                                <textarea
                                  value={annotations[cr.id] || ""}
                                  onChange={(e) =>
                                    setAnnotations((prev) => ({ ...prev, [cr.id]: e.target.value }))
                                  }
                                  rows={3}
                                  placeholder="Ajouter une note..."
                                  style={{
                                    width: "100%",
                                    fontSize: "0.92rem",
                                    border: "1px solid var(--primary, #2563eb)",
                                    borderRadius: 8,
                                    padding: "8px 10px",
                                    background: "var(--bg, #f8fafc)",
                                    resize: "vertical",
                                    fontFamily: "inherit",
                                  }}
                                />
                                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                                  <button
                                    type="button"
                                    className="sidebar-cta"
                                    style={{ padding: "5px 14px", fontSize: "0.82rem" }}
                                    onClick={() => setEditingAnnotation(null)}
                                  >
                                    Enregistrer
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-expand"
                                    onClick={() => setEditingAnnotation(null)}
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p style={{ color: annotations[cr.id] ? "inherit" : "#94a3b8", fontStyle: annotations[cr.id] ? "normal" : "italic" }}>
                                  {annotations[cr.id] || "Aucune annotation pour le moment."}
                                </p>
                                <button
                                  type="button"
                                  className="btn-expand"
                                  style={{ marginTop: "0.5rem" }}
                                  onClick={() => setEditingAnnotation(cr.id)}
                                >
                                  ✏️ {annotations[cr.id] ? "Modifier" : "Annoter"}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {mockCompteRendus.length === 0 && (
                    <div className="empty-state">
                      <p>Aucun compte-rendu reçu pour le moment.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </>
    );
  }

  // ── DASHBOARD PATIENT ────────────────────────────────────────────────────

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "profil", label: "Mon profil", icon: "👤" },
    { id: "consultations", label: "Consultations", icon: "📋" },
    { id: "rendezvous", label: "Rendez-vous", icon: "📅" },
    { id: "questionnaires", label: "Questionnaires", icon: "📝" },
  ];

  const rdvAvenir = mockRendezVous.filter((r) => r.statut === "à venir");
  const rdvPasses = mockRendezVous.filter((r) => r.statut === "passé");
  const consultationsEnvoyees = mockConsultations.filter((c) => c.statut === "envoyé");
  const consultationsBrouillons = mockConsultations.filter((c) => c.statut === "brouillon");

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

      <main className={`dashboard-root ${mounted ? "dashboard-mounted" : ""}`}>
        {/* Sidebar patient */}
        <aside className="dashboard-sidebar">
          <div className="dashboard-identity">
            <div className="dashboard-avatar">
              {user.prenom[0]}{user.nom[0]}
            </div>
            <div className="dashboard-identity-info">
              <p className="dashboard-identity-name">{user.prenom} {user.nom}</p>
              <p className="dashboard-identity-role">Patient</p>
            </div>
          </div>

          <nav className="dashboard-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`dashboard-nav-item ${activeTab === tab.id ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="nav-icon">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.id === "rendezvous" && rdvAvenir.length > 0 && (
                  <span className="nav-badge">{rdvAvenir.length}</span>
                )}
                {tab.id === "questionnaires" && consultationsBrouillons.length > 0 && (
                  <span className="nav-badge">{consultationsBrouillons.length}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="sidebar-action">
            <Link to="/formulaire" className="sidebar-cta">
              + Nouvelle consultation
            </Link>
          </div>
        </aside>

        {/* Contenu patient */}
        <section className="dashboard-content">

          {/* ===== PROFIL PATIENT ===== */}
          {activeTab === "profil" && (
            <div className="tab-panel">
              <div className="tab-header">
                <h1>Mon profil</h1>
                <p className="tab-subtitle">Vos informations personnelles et médicales</p>
              </div>

              <div className="profile-grid">
                <div className="profile-card">
                  <h2 className="card-title">Informations personnelles</h2>
                  <div className="profile-fields">
                    <div className="profile-field">
                      <span className="field-label">Prénom</span>
                      <span className="field-value">{user.prenom}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Nom</span>
                      <span className="field-value">{user.nom}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Email</span>
                      <span className="field-value">{user.email}</span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Date de naissance</span>
                      <span className="field-value">
                        {user.birthdate ? formatDate(user.birthdate) : "—"}
                        {user.birthdate && (
                          <span className="field-age"> · {getAge(user.birthdate)}</span>
                        )}
                      </span>
                    </div>
                    <div className="profile-field">
                      <span className="field-label">Genre</span>
                      <span className="field-value">
                        {user.gender === "M" ? "Homme" : user.gender === "F" ? "Femme" : user.gender || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="profile-card">
                  <h2 className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Données biométriques
                    {!editBio ? (
                      <button type="button" className="btn-expand" onClick={() => setEditBio(true)}>✏️ Modifier</button>
                    ) : (
                      <span style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="sidebar-cta" style={{ padding: "5px 14px", fontSize: "0.82rem" }} onClick={() => setEditBio(false)}>Enregistrer</button>
                        <button type="button" className="btn-expand" onClick={() => { setEditBio(false); setBioValues({ weight: user.weight ?? "", height: user.height ?? "" }); }}>Annuler</button>
                      </span>
                    )}
                  </h2>
                  <div className="biometric-grid">
                    <div className="biometric-box">
                      {editBio ? (
                        <input
                          type="number"
                          value={bioValues.weight}
                          onChange={(e) => setBioValues((v) => ({ ...v, weight: e.target.value }))}
                          style={{ width: 64, fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", textAlign: "center", border: "1px solid var(--primary)", borderRadius: 8, padding: "2px 4px", background: "var(--bg)" }}
                        />
                      ) : (
                        <span className="biometric-value">{bioValues.weight || user.weight || "—"}</span>
                      )}
                      <span className="biometric-unit">kg</span>
                      <span className="biometric-label">Poids</span>
                    </div>
                    <div className="biometric-box">
                      {editBio ? (
                        <input
                          type="number"
                          value={bioValues.height}
                          onChange={(e) => setBioValues((v) => ({ ...v, height: e.target.value }))}
                          style={{ width: 64, fontSize: "1.4rem", fontWeight: 800, color: "var(--primary)", textAlign: "center", border: "1px solid var(--primary)", borderRadius: 8, padding: "2px 4px", background: "var(--bg)" }}
                        />
                      ) : (
                        <span className="biometric-value">{bioValues.height || user.height || "—"}</span>
                      )}
                      <span className="biometric-unit">cm</span>
                      <span className="biometric-label">Taille</span>
                    </div>
                    {(() => {
                      const w = Number(editBio ? bioValues.weight : user.weight);
                      const h = Number(editBio ? bioValues.height : user.height);
                      if (!w || !h) return null;
                      return (
                        <div className="biometric-box">
                          <span className="biometric-value">{(w / Math.pow(h / 100, 2)).toFixed(1)}</span>
                          <span className="biometric-unit">IMC</span>
                          <span className="biometric-label">Indice de masse</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="profile-card profile-card-full">
                  <h2 className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    Dossier médical
                    {!editMedical ? (
                      <button type="button" className="btn-expand" onClick={() => setEditMedical(true)}>✏️ Modifier</button>
                    ) : (
                      <span style={{ display: "flex", gap: 8 }}>
                        <button type="button" className="sidebar-cta" style={{ padding: "5px 14px", fontSize: "0.82rem" }} onClick={() => setEditMedical(false)}>Enregistrer</button>
                        <button type="button" className="btn-expand" onClick={() => { setEditMedical(false); setMedicalValues({ antecedents: user.antecedents ?? "", traitements: user.traitements ?? "", allergies: user.allergies ?? "" }); }}>Annuler</button>
                      </span>
                    )}
                  </h2>
                  <div className="medical-fields">
                    <div className="medical-field">
                      <span className="medical-field-label">🩺 Antécédents</span>
                      {editMedical ? (
                        <textarea value={medicalValues.antecedents} onChange={(e) => setMedicalValues((v) => ({ ...v, antecedents: e.target.value }))} rows={3} style={{ width: "100%", fontSize: "0.92rem", color: "var(--text)", border: "1px solid var(--primary)", borderRadius: 8, padding: "8px 10px", background: "var(--bg)", resize: "vertical", fontFamily: "inherit" }} />
                      ) : (
                        <p className="medical-field-value">{medicalValues.antecedents || user.antecedents || "Aucun renseigné"}</p>
                      )}
                    </div>
                    <div className="medical-field">
                      <span className="medical-field-label">💊 Traitements en cours</span>
                      {editMedical ? (
                        <textarea value={medicalValues.traitements} onChange={(e) => setMedicalValues((v) => ({ ...v, traitements: e.target.value }))} rows={3} style={{ width: "100%", fontSize: "0.92rem", color: "var(--text)", border: "1px solid var(--primary)", borderRadius: 8, padding: "8px 10px", background: "var(--bg)", resize: "vertical", fontFamily: "inherit" }} />
                      ) : (
                        <p className="medical-field-value">{medicalValues.traitements || user.traitements || "Aucun renseigné"}</p>
                      )}
                    </div>
                    <div className="medical-field">
                      <span className="medical-field-label">⚠️ Allergies</span>
                      {editMedical ? (
                        <textarea value={medicalValues.allergies} onChange={(e) => setMedicalValues((v) => ({ ...v, allergies: e.target.value }))} rows={3} style={{ width: "100%", fontSize: "0.92rem", color: "var(--text)", border: "1px solid var(--primary)", borderRadius: 8, padding: "8px 10px", background: "var(--bg)", resize: "vertical", fontFamily: "inherit" }} />
                      ) : (
                        <p className="medical-field-value">{medicalValues.allergies || user.allergies || "Aucune renseignée"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== CONSULTATIONS PATIENT ===== */}
          {activeTab === "consultations" && (
            <div className="tab-panel">
              <div className="tab-header">
                <h1>Mes consultations</h1>
                <p className="tab-subtitle">{consultationsEnvoyees.length} résumé{consultationsEnvoyees.length > 1 ? "s" : ""} envoyé{consultationsEnvoyees.length > 1 ? "s" : ""}</p>
              </div>

              <div className="consultations-list">
                {consultationsEnvoyees.map((c) => (
                  <div key={c.id} className="consultation-card">
                    <div className="consultation-header">
                      <div className="consultation-meta">
                        <span className="consultation-date">{formatDate(c.date)}</span>
                        <span className="consultation-doctor">{c.medecin}</span>
                        <span className="consultation-specialite">{c.specialite}</span>
                      </div>
                      <div className="consultation-actions">
                        <span className="status-badge status-sent">Envoyé</span>
                        <button
                          type="button"
                          className="btn-expand"
                          onClick={() => setExpandedConsultation(expandedConsultation === c.id ? null : c.id)}
                        >
                          {expandedConsultation === c.id ? "Masquer" : "Voir le résumé"}
                        </button>
                      </div>
                    </div>
                    {expandedConsultation === c.id && (
                      <div className="consultation-resume">
                        <h3>Résumé médical</h3>
                        <p>{c.resume}</p>
                      </div>
                    )}
                  </div>
                ))}
                {consultationsEnvoyees.length === 0 && (
                  <div className="empty-state">
                    <p>Aucune consultation envoyée pour le moment.</p>
                    <Link to="/formulaire" className="sidebar-cta">Préparer une consultation</Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== RENDEZ-VOUS PATIENT ===== */}
          {activeTab === "rendezvous" && (
            <div className="tab-panel">
              <div className="tab-header">
                <h1>Rendez-vous</h1>
                <p className="tab-subtitle">
                  {rdvAvenir.length} à venir · {rdvPasses.length} passé{rdvPasses.length > 1 ? "s" : ""}
                </p>
              </div>

              {rdvAvenir.length > 0 && (
                <div className="rdv-section">
                  <h2 className="rdv-section-title">À venir</h2>
                  <div className="rdv-list">
                    {rdvAvenir.map((rdv) => (
                      <div key={rdv.id} className="rdv-card rdv-upcoming">
                        <div className="rdv-date-block">
                          <span className="rdv-day">{new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric" })}</span>
                          <span className="rdv-month">{new Date(rdv.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                          <span className="rdv-heure">{rdv.heure}</span>
                        </div>
                        <div className="rdv-info">
                          <p className="rdv-doctor">{rdv.medecin}</p>
                          <p className="rdv-specialite">{rdv.specialite}</p>
                          <p className="rdv-lieu">📍 {rdv.lieu}</p>
                        </div>
                        <div className="rdv-cta-col">
                          <Link to="/formulaire" className="rdv-prepare-btn">Préparer</Link>
                          <span className="status-badge status-upcoming">À venir</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {rdvPasses.length > 0 && (
                <div className="rdv-section">
                  <h2 className="rdv-section-title">Historique</h2>
                  <div className="rdv-list">
                    {rdvPasses.map((rdv) => (
                      <div key={rdv.id} className="rdv-card rdv-past">
                        <div className="rdv-date-block rdv-date-past">
                          <span className="rdv-day">{new Date(rdv.date).toLocaleDateString("fr-FR", { day: "numeric" })}</span>
                          <span className="rdv-month">{new Date(rdv.date).toLocaleDateString("fr-FR", { month: "short" })}</span>
                          <span className="rdv-heure">{rdv.heure}</span>
                        </div>
                        <div className="rdv-info">
                          <p className="rdv-doctor">{rdv.medecin}</p>
                          <p className="rdv-specialite">{rdv.specialite}</p>
                          <p className="rdv-lieu">📍 {rdv.lieu}</p>
                        </div>
                        <div className="rdv-cta-col">
                          <span className="status-badge status-past">Passé</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== QUESTIONNAIRES PATIENT ===== */}
          {activeTab === "questionnaires" && (
            <div className="tab-panel">
              <div className="tab-header">
                <h1>Questionnaires</h1>
                <p className="tab-subtitle">Brouillons et formulaires soumis</p>
              </div>

              {consultationsBrouillons.length > 0 && (
                <div className="questionnaires-section">
                  <h2 className="rdv-section-title">Brouillons</h2>
                  <div className="questionnaires-list">
                    {consultationsBrouillons.map((c) => (
                      <div key={c.id} className="questionnaire-card questionnaire-draft">
                        <div className="questionnaire-info">
                          <p className="questionnaire-date">Commencé le {formatDate(c.date)}</p>
                          <p className="questionnaire-doctor">Pour {c.medecin} · {c.specialite}</p>
                        </div>
                        <div className="questionnaire-actions">
                          <span className="status-badge status-draft">Brouillon</span>
                          <Link to="/formulaire" className="rdv-prepare-btn">Continuer</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="questionnaires-section">
                <h2 className="rdv-section-title">Envoyés</h2>
                <div className="questionnaires-list">
                  {consultationsEnvoyees.map((c) => (
                    <div key={c.id} className="questionnaire-card">
                      <div className="questionnaire-info">
                        <p className="questionnaire-date">Soumis le {formatDate(c.date)}</p>
                        <p className="questionnaire-doctor">{c.medecin} · {c.specialite}</p>
                      </div>
                      <div className="questionnaire-actions">
                        <span className="status-badge status-sent">Envoyé</span>
                        <button
                          type="button"
                          className="rdv-prepare-btn"
                          onClick={() => { setExpandedConsultation(c.id); setActiveTab("consultations"); }}
                        >
                          Voir résumé
                        </button>
                      </div>
                    </div>
                  ))}
                  {consultationsEnvoyees.length === 0 && (
                    <div className="empty-state"><p>Aucun questionnaire envoyé.</p></div>
                  )}
                </div>
              </div>

              <div className="questionnaire-new">
                <Link to="/formulaire" className="sidebar-cta">+ Nouveau questionnaire</Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

export default DashboardPage;