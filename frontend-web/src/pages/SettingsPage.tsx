// src/pages/SettingsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { apiDelete } from "../services/api";
import { logoutUser } from "../services/auth";
import { notify } from "../services/notifications";
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

function SettingsPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
    const navigate = useNavigate();
    
    // Redirection si non connecté
    useEffect(() => {
        if (!user) navigate("/connexion");
    }, [user, navigate]);
    
    // --- États section IA ---
    const [aiLang, setAiLang] = useState(localStorage.getItem("labexplain_ai_lang") || "fr");
    const [aiDetail, setAiDetail] = useState(localStorage.getItem("labexplain_ai_detail") || "court");
    const [aiQCount, setAiQCount] = useState(Number(localStorage.getItem("labexplain_ai_questions_count")) || 5);
    
    // --- États section questionnaire ---
    const [showRedflags, setShowRedflags] = useState(localStorage.getItem("labexplain_show_redflags") !== "false");
    const [simpleMode, setSimpleMode] = useState(localStorage.getItem("labexplain_simple_mode") === "true");
    
    // --- États section compte ---
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [pwdError, setPwdError] = useState("");
    const [pwdSuccess, setPwdSuccess] = useState("");
    const [deleteConfirm, setDeleteConfirm] = useState(false);
    
    // Sauvegarde automatique des prefs IA/questionnaire
    useEffect(() => { localStorage.setItem("labexplain_ai_lang", aiLang); }, [aiLang]);
    useEffect(() => { localStorage.setItem("labexplain_ai_detail", aiDetail); }, [aiDetail]);
    useEffect(() => { localStorage.setItem("labexplain_ai_questions_count", String(aiQCount)); }, [aiQCount]);
    useEffect(() => { localStorage.setItem("labexplain_show_redflags", String(showRedflags)); }, [showRedflags]);
    useEffect(() => { localStorage.setItem("labexplain_simple_mode", String(simpleMode)); }, [simpleMode]);
    
    async function handlePasswordChange() {
        setPwdError(""); setPwdSuccess("");
        if (newPwd !== confirmPwd) { setPwdError(t(lang, "settings.passwordsDoNotMatch")); return; }
        if (newPwd.length < 4) { setPwdError(t(lang, "settings.passwordTooShort")); return; }
        try {
            const res = await fetch("/api/users/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ current_password: currentPwd, password: newPwd }),
            });
            const json = await res.json();
            if (!res.ok) { setPwdError(json.message || t(lang, "settings.passwordChangeError")); return; }
            setPwdSuccess(t(lang, "settings.passwordUpdated"));
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
        } catch { setPwdError(t(lang, "common.networkError")); }
    }
    
    function handleExportData() {
        if (!user) return;
        const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = t(lang, "settings.exportFilename"); a.click();
        URL.revokeObjectURL(url);
    }
    
    async function handleDeleteAccount() {
        if (!deleteConfirm) { setDeleteConfirm(true); return; }
        try {
            // Appelle DELETE /api/users/me avec X-User-Id dans le header (géré par apiDelete)
            await apiDelete("/users/me");
            // Supprime le token et l'utilisateur du localStorage
            logoutUser();
            onUserChange();
            navigate("/");
        } catch {
            setDeleteConfirm(false);
            notify(t(lang, "settings.deleteAccountError"), "error");
        }
    }
    
    if (!user) return null;
    
    return (
        <BionicReading active={font === "tdah"}>
        <Header lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
        <main className="settings-layout">
        <h1>{t(lang, "settings.title")}</h1>
        
        {/* --- SECTION AFFICHAGE --- */}
        <section className="settings-section">
        <h2>{t(lang, "settings.display")}</h2>
        <label>{t(lang, "language.interfaceLanguage")}
        <select value={lang} onChange={e => onLangChange(e.target.value as Lang)}>
        <option value="fr">{t(lang, "language.fr")}</option>
        <option value="en">{t(lang, "language.en")}</option>
        <option value="es">{t(lang, "language.es")}</option>
        <option value="ar">{t(lang, "language.ar")}</option>
        </select>
        </label>
        <label>{t(lang, "font.readingMode")}
        <select value={font} onChange={e => onFontChange(e.target.value as FontMode)}>
        <option value="standard">{t(lang, "font.standard")}</option>
        <option value="malvoyant">{t(lang, "font.visuallyImpaired")}</option>
        <option value="dyslexique">{t(lang, "font.dyslexic")}</option>
        <option value="tdah">{t(lang, "font.adhd")}</option>
        </select>
        </label>
        </section>
        
        {/* --- SECTION IA --- */}
        <section className="settings-section">
        <h2>{t(lang, "settings.aiAndSummaries")}</h2>
        <label>{t(lang, "language.summaryLanguage")}
        <select value={aiLang} onChange={e => setAiLang(e.target.value)}>
        <option value="fr">{t(lang, "language.fr")}</option>
        <option value="en">{t(lang, "language.en")}</option>
        <option value="es">{t(lang, "language.es")}</option>
        <option value="ar">{t(lang, "language.ar")}</option>
        </select>
        </label>
        <label>{t(lang, "settings.detailLevel")}
        <select value={aiDetail} onChange={e => setAiDetail(e.target.value)}>
        <option value="court">{t(lang, "settings.short")}</option>
        <option value="détaillé">{t(lang, "settings.detailed")}</option>
        </select>
        </label>
        <label>{t(lang, "settings.suggestedQuestionsCount")} {aiQCount}
        <input type="range" min={3} max={7} step={2} value={aiQCount}
        onChange={e => setAiQCount(Number(e.target.value))} />
        </label>
        </section>
        
        {/* --- SECTION QUESTIONNAIRE --- */}
        <section className="settings-section">
        <h2>{t(lang, "settings.questionnaire")}</h2>
        <label className="toggle-label">
        <input type="checkbox" checked={showRedflags}
        onChange={e => setShowRedflags(e.target.checked)} />
        {t(lang, "settings.showRedFlags")}
        </label>
        <label className="toggle-label">
        <input type="checkbox" checked={simpleMode}
        onChange={e => setSimpleMode(e.target.checked)} />
        {t(lang, "settings.simpleGuidedMode")}
        </label>
        </section>
        
        {/* --- SECTION COMPTE --- */}
        <section className="settings-section">
        <h2>{t(lang, "settings.account")}</h2>
        
        <div className="settings-subsection">
        <h3>{t(lang, "settings.changePassword")}</h3>
        <input type="password" placeholder={t(lang, "settings.currentPassword")} value={currentPwd}
        onChange={e => setCurrentPwd(e.target.value)} />
        <input type="password" placeholder={t(lang, "settings.newPassword")} value={newPwd}
        onChange={e => setNewPwd(e.target.value)} />
        <input type="password" placeholder={t(lang, "settings.confirmNewPassword")} value={confirmPwd}
        onChange={e => setConfirmPwd(e.target.value)} />
        {pwdError && <p className="error-inline">{pwdError}</p>}
        {pwdSuccess && <p className="success-inline">{pwdSuccess}</p>}
        <button className="button" onClick={handlePasswordChange}>
        {t(lang, "settings.updatePassword")}
        </button>
        </div>
        
        <div className="settings-subsection">
        <h3>{t(lang, "settings.myDataRgpd")}</h3>
        <button className="button secondary" onClick={handleExportData}>
        {t(lang, "settings.downloadMyData")}
        </button>
        </div>
        
        <div className="settings-subsection">
        <h3>{t(lang, "settings.deleteAccount")}</h3>
        {deleteConfirm && (
            <p className="error-inline">⚠️ {t(lang, "settings.deleteConfirmText")}</p>
        )}
        <button className="button danger" onClick={handleDeleteAccount}>
        {deleteConfirm ? t(lang, "settings.confirmDeletion") : t(lang, "settings.deleteAccount")}
        </button>
        </div>
        </section>
        </main>
        </BionicReading>
    );
}

export default SettingsPage;
