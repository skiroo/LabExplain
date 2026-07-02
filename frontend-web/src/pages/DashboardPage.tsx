/*
Fichier : DashboardPage.tsx
Dossier : src/pages/
Description :
Dashboard de LabExplain.
- Patient : profil, consultations (API), rendez-vous (API)
- Médecin : profil
Toutes les données viennent du backend Flask — plus aucune donnée mockée.
*/

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "../components/Header";
import BionicReading from "../components/BionicReading";
import { apiGet, apiDelete } from "../services/api";
import { t } from "../i18n";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

// ── Icônes SVG ───────────────────────────────────────────────────────────────

function IconUser() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}
function IconClipboard() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M9 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-3"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>;
}
function IconCalendar() {
    return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
}
function IconMapPin() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
}
function IconTrash() {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}

// ── Types API ────────────────────────────────────────────────────────────────

type ApiConsultation = {
    id_consultation: number;
    date_heure: string;
    statut: "draft" | "sent" | "reviewed" | "archived";
    langue: string;
    symptomes: string | null;
    medecin_nom: string | null;
    medecin_prenom: string | null;
    medecin_specialite: string | null;
};

type ApiRendezVous = {
    id_rendezvous: number;
    date_heure: string;
    medecin_nom: string;
    medecin_prenom: string;
    medecin_specialite: string | null;
    lieu: string | null;
    statut: "a_venir" | "passe" | "annule";
};

// ── Props ────────────────────────────────────────────────────────────────────

type DashboardPageProps = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    onLangChange: (lang: Lang) => void;
    onFontChange: (font: FontMode) => void;
    onUserChange: () => void;
};

type TabId = "profil" | "consultations" | "rendezvous";

// ── Helpers ──────────────────────────────────────────────────────────────────

// Les dates affichées suivaient toujours le format français, quelle que soit
// la langue choisie dans l'interface. On mappe chaque langue vers une locale
// reconnue par l'API Intl utilisée par toLocaleDateString / toLocaleString.
const DATE_LOCALES: Record<Lang, string> = {
    fr: "fr-FR",
    en: "en-GB",
    es: "es-ES",
    ar: "ar-EG",
};

function formatDate(dateStr: string, lang: Lang): string {
    return new Date(dateStr).toLocaleDateString(DATE_LOCALES[lang], {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function formatDateTime(dateStr: string, lang: Lang): string {
    return new Date(dateStr).toLocaleString(DATE_LOCALES[lang], {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

// Traduit le statut d'une consultation vers la langue courante
function consultationStatusLabel(lang: Lang, statut: ApiConsultation["statut"]): string {
    if (statut === "draft") return t(lang, "dashboard.draft");
    if (statut === "sent") return t(lang, "dashboard.sent");
    if (statut === "reviewed") return t(lang, "dashboard.reviewed");
    if (statut === "archived") return t(lang, "dashboard.archived");
    return statut;
}

// ── Composant principal ──────────────────────────────────────────────────────

function DashboardPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: DashboardPageProps) {
    const navigate = useNavigate();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("profil");
    
    // Données API patient
    const [consultations, setConsultations] = useState<ApiConsultation[]>([]);
    const [rendezvousList, setRendezvousList] = useState<ApiRendezVous[]>([]);
    const [loadingConsultations, setLoadingConsultations] = useState(false);
    const [loadingRdv, setLoadingRdv] = useState(false);
    const [expandedConsultation, setExpandedConsultation] = useState<number | null>(null);
    
    useEffect(() => {
        if (!user) {
            navigate("/connexion");
            return;
        }
        setMounted(true);
    }, [user, navigate]);
    
    useEffect(() => {
        if (!user || user.role !== "patient") return;
        
        if (activeTab === "consultations" && consultations.length === 0) {
            setLoadingConsultations(true);
            apiGet<ApiConsultation[]>("/consultations/")
            .then((res) => setConsultations(res.data || []))
            .catch(() => setConsultations([]))
            .finally(() => setLoadingConsultations(false));
        }
        
        if (activeTab === "rendezvous" && rendezvousList.length === 0) {
            setLoadingRdv(true);
            apiGet<ApiRendezVous[]>("/rendezvous/")
            .then((res) => setRendezvousList(res.data || []))
            .catch(() => setRendezvousList([]))
            .finally(() => setLoadingRdv(false));
        }
    }, [activeTab, user]);
    
    async function handleDeleteRdv(id: number) {
        if (!confirm(t(lang, "dashboard.deleteAppointmentConfirm"))) return;
        try {
            await apiDelete(`/rendezvous/${id}`);
            setRendezvousList((prev) => prev.filter((r) => r.id_rendezvous !== id));
        } catch {
            // Silencieux — l'utilisateur peut réessayer
        }
    }
    
    if (!user) return null;
    
    // ── DASHBOARD MÉDECIN ────────────────────────────────────────────────────
    
    if (user.role === "medecin") {
        return (
            <BionicReading active={font === "tdah"}>
            <Header lang={lang} font={font} user={user} onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
            <main className={`dashboard-root ${mounted ? "dashboard-mounted" : ""}`}>
            <aside className="dashboard-sidebar">
            <div className="dashboard-identity">
            <div className="dashboard-avatar">{user.prenom[0]}{user.nom[0]}</div>
            <div className="dashboard-identity-info">
            <p className="dashboard-identity-name">{user.prenom} {user.nom}</p>
            <p className="dashboard-identity-role">{t(lang, "dashboard.doctorRole")}</p>
            </div>
            </div>
            <nav className="dashboard-nav">
            <button type="button" className="dashboard-nav-item active">
            <span className="nav-icon"><IconUser /></span>
            <span>{t(lang, "dashboard.profile")}</span>
            </button>
            </nav>
            </aside>
            
            <section className="dashboard-content">
            <div className="tab-panel">
            <div className="tab-header">
            <h1>{t(lang, "dashboard.profile")}</h1>
            <p className="tab-subtitle">{t(lang, "dashboard.professionalInfo")}</p>
            </div>
            <div className="profile-grid">
            <div className="profile-card">
            <h2 className="card-title">{t(lang, "dashboard.personalInformation")}</h2>
            <div className="profile-fields">
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.firstName")}</span>
            <span className="field-value">{user.prenom}</span>
            </div>
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.lastName")}</span>
            <span className="field-value">{user.nom}</span>
            </div>
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.email")}</span>
            <span className="field-value">{user.email}</span>
            </div>
            {user.specialite && (
                <div className="profile-field">
                <span className="field-label">{t(lang, "dashboard.specialty")}</span>
                <span className="field-value">{user.specialite}</span>
                </div>
            )}
            </div>
            </div>
            </div>
            </div>
            </section>
            </main>
            </BionicReading>
        );
    }
    
    // ── DASHBOARD PATIENT ────────────────────────────────────────────────────
    
    const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
        { id: "profil", label: t(lang, "dashboard.profile"), icon: <IconUser /> },
        { id: "consultations", label: t(lang, "dashboard.consultations"), icon: <IconClipboard /> },
        { id: "rendezvous", label: t(lang, "dashboard.appointments"), icon: <IconCalendar /> },
    ];
    
    const rdvAvenir = rendezvousList.filter((r) => r.statut === "a_venir");
    const rdvPasses = rendezvousList.filter((r) => r.statut === "passe");
    
    return (
        <BionicReading active={font === "tdah"}>
        <Header lang={lang} font={font} user={user} onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
        
        <main className={`dashboard-root ${mounted ? "dashboard-mounted" : ""}`}>
        {/* Sidebar patient */}
        <aside className="dashboard-sidebar">
        <div className="dashboard-identity">
        <div className="dashboard-avatar">{user.prenom[0]}{user.nom[0]}</div>
        <div className="dashboard-identity-info">
        <p className="dashboard-identity-name">{user.prenom} {user.nom}</p>
        <p className="dashboard-identity-role">{t(lang, "dashboard.patientRole")}</p>
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
            </button>
        ))}
        </nav>
        
        <div className="sidebar-action">
        <Link to="/formulaire" className="sidebar-cta">{t(lang, "dashboard.newConsultation")}</Link>
        </div>
        <div className="sidebar-action" style={{ marginTop: "8px" }}>
        <Link to="/rendez-vous" className="sidebar-cta" style={{ background: "var(--primary-dark, #1f4f82)" }}>
        {t(lang, "dashboard.declareAppointment")}
        </Link>
        </div>
        </aside>
        
        {/* Contenu patient */}
        <section className="dashboard-content">
        
        {/* ===== PROFIL ===== */}
        {activeTab === "profil" && (
            <div className="tab-panel">
            <div className="tab-header">
            <h1>{t(lang, "dashboard.profile")}</h1>
            <p className="tab-subtitle">{t(lang, "dashboard.personalInfo")}</p>
            </div>
            <div className="profile-grid">
            <div className="profile-card">
            <h2 className="card-title">{t(lang, "dashboard.personalInformation")}</h2>
            <div className="profile-fields">
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.firstName")}</span>
            <span className="field-value">{user.prenom}</span>
            </div>
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.lastName")}</span>
            <span className="field-value">{user.nom}</span>
            </div>
            <div className="profile-field">
            <span className="field-label">{t(lang, "dashboard.email")}</span>
            <span className="field-value">{user.email}</span>
            </div>
            {user.date_naissance && (
                <div className="profile-field">
                <span className="field-label">{t(lang, "dashboard.birthdate")}</span>
                <span className="field-value">{formatDate(user.date_naissance, lang)}</span>
                </div>
            )}
            {user.gender && (
                <div className="profile-field">
                <span className="field-label">{t(lang, "common.gender")}</span>
                <span className="field-value">
                {user.gender === "M" ? t(lang, "common.man") : user.gender === "F" ? t(lang, "common.woman") : user.gender}
                </span>
                </div>
            )}
            </div>
            </div>
            </div>
            </div>
        )}
        
        {/* ===== CONSULTATIONS ===== */}
        {activeTab === "consultations" && (
            <div className="tab-panel">
            <div className="tab-header">
            <h1>{t(lang, "dashboard.consultations")}</h1>
            <p className="tab-subtitle">
            {loadingConsultations ? t(lang, "common.loading") : `${consultations.length} ${t(lang, "dashboard.consultationCount")}`}
            </p>
            </div>
            
            {loadingConsultations ? (
                <div className="empty-state"><p>{t(lang, "dashboard.loadingConsultations")}</p></div>
            ) : consultations.length === 0 ? (
                <div className="empty-state">
                <p>{t(lang, "dashboard.noConsultation")}</p>
                <Link to="/formulaire" className="sidebar-cta">{t(lang, "dashboard.prepareConsultation")}</Link>
                </div>
            ) : (
                <div className="consultations-list">
                {consultations.map((c) => (
                    <div key={c.id_consultation} className="consultation-card">
                    <div className="consultation-header">
                    <div className="consultation-meta">
                    <span className="consultation-date">{formatDateTime(c.date_heure, lang)}</span>
                    {(c.medecin_nom || c.medecin_prenom) && (
                        <span className="consultation-doctor">
                        {c.medecin_prenom} {c.medecin_nom}
                        </span>
                    )}
                    {c.medecin_specialite && (
                        <span className="consultation-specialite">{c.medecin_specialite}</span>
                    )}
                    </div>
                    <div className="consultation-actions">
                    <span className={`status-badge ${c.statut === "draft" ? "status-draft" : "status-sent"}`}>
                    {consultationStatusLabel(lang, c.statut)}
                    </span>
                    {c.symptomes && (
                        <button
                        type="button"
                        className="btn-expand"
                        onClick={() => setExpandedConsultation(expandedConsultation === c.id_consultation ? null : c.id_consultation)}
                        >
                        {expandedConsultation === c.id_consultation ? t(lang, "dashboard.hide") : t(lang, "dashboard.show")}
                        </button>
                    )}
                    </div>
                    </div>
                    {expandedConsultation === c.id_consultation && c.symptomes && (
                        <div className="consultation-resume">
                        <h3>{t(lang, "common.symptoms")}</h3>
                        <p>{c.symptomes}</p>
                        </div>
                    )}
                    </div>
                ))}
                </div>
            )}
            </div>
        )}
        
        {/* ===== RENDEZ-VOUS ===== */}
        {activeTab === "rendezvous" && (
            <div className="tab-panel">
            <div className="tab-header">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
            <div>
            <h1>{t(lang, "dashboard.appointments")}</h1>
            <p className="tab-subtitle">
            {loadingRdv
                ? t(lang, "common.loading")
                : `${rdvAvenir.length} ${t(lang, "dashboard.upcomingCountLabel")} · ${rdvPasses.length} ${t(lang, "dashboard.pastCountLabel")}`}
            </p>
            </div>
            <Link to="/rendez-vous" className="sidebar-cta" style={{ marginTop: 0 }}>
            {t(lang, "dashboard.declareAppointment")}
            </Link>
            </div>
            </div>
            
            {loadingRdv ? (
                <div className="empty-state"><p>{t(lang, "dashboard.loadingAppointments")}</p></div>
            ) : rendezvousList.length === 0 ? (
                <div className="empty-state">
                <p>{t(lang, "dashboard.noAppointment")}</p>
                <Link to="/rendez-vous" className="sidebar-cta">{t(lang, "dashboard.declareAppointment")}</Link>
                </div>
            ) : (
                <>
                {rdvAvenir.length > 0 && (
                    <div className="rdv-section">
                    <h2 className="rdv-section-title">{t(lang, "dashboard.upcoming")}</h2>
                    <div className="rdv-list">
                    {rdvAvenir.map((rdv) => (
                        <div key={rdv.id_rendezvous} className="rdv-card rdv-upcoming">
                        <div className="rdv-date-block">
                        <span className="rdv-day">
                        {new Date(rdv.date_heure).toLocaleDateString(DATE_LOCALES[lang], { day: "numeric" })}
                        </span>
                        <span className="rdv-month">
                        {new Date(rdv.date_heure).toLocaleDateString(DATE_LOCALES[lang], { month: "short" })}
                        </span>
                        <span className="rdv-heure">
                        {new Date(rdv.date_heure).toLocaleTimeString(DATE_LOCALES[lang], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        </div>
                        <div className="rdv-info">
                        <p className="rdv-doctor">{rdv.medecin_prenom} {rdv.medecin_nom}</p>
                        {rdv.medecin_specialite && <p className="rdv-specialite">{rdv.medecin_specialite}</p>}
                        {rdv.lieu && (
                            <p className="rdv-lieu" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <IconMapPin />{rdv.lieu}
                            </p>
                        )}
                        </div>
                        <div className="rdv-cta-col">
                        <Link to="/formulaire" className="rdv-prepare-btn">{t(lang, "dashboard.prepare")}</Link>
                        <button
                        type="button"
                        className="btn-expand"
                        style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#dc2626" }}
                        onClick={() => handleDeleteRdv(rdv.id_rendezvous)}
                        >
                        <IconTrash />{t(lang, "dashboard.deleteAppointment")}
                        </button>
                        </div>
                        </div>
                    ))}
                    </div>
                    </div>
                )}
                
                {rdvPasses.length > 0 && (
                    <div className="rdv-section">
                    <h2 className="rdv-section-title">{t(lang, "dashboard.history")}</h2>
                    <div className="rdv-list">
                    {rdvPasses.map((rdv) => (
                        <div key={rdv.id_rendezvous} className="rdv-card rdv-past">
                        <div className="rdv-date-block rdv-date-past">
                        <span className="rdv-day">
                        {new Date(rdv.date_heure).toLocaleDateString(DATE_LOCALES[lang], { day: "numeric" })}
                        </span>
                        <span className="rdv-month">
                        {new Date(rdv.date_heure).toLocaleDateString(DATE_LOCALES[lang], { month: "short" })}
                        </span>
                        <span className="rdv-heure">
                        {new Date(rdv.date_heure).toLocaleTimeString(DATE_LOCALES[lang], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        </div>
                        <div className="rdv-info">
                        <p className="rdv-doctor">{rdv.medecin_prenom} {rdv.medecin_nom}</p>
                        {rdv.medecin_specialite && <p className="rdv-specialite">{rdv.medecin_specialite}</p>}
                        {rdv.lieu && (
                            <p className="rdv-lieu" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <IconMapPin />{rdv.lieu}
                            </p>
                        )}
                        </div>
                        <div className="rdv-cta-col">
                        <span className="status-badge status-past">{t(lang, "dashboard.past")}</span>
                        </div>
                        </div>
                    ))}
                    </div>
                    </div>
                )}
                </>
            )}
            </div>
        )}
        </section>
        </main>
        </BionicReading>
    );
}

export default DashboardPage;
