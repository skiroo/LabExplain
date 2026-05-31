// src/pages/SettingsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { removeCurrentUser } from "../services/storage";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

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
    if (newPwd !== confirmPwd) { setPwdError("Les mots de passe ne correspondent pas."); return; }
    if (newPwd.length < 4) { setPwdError("Mot de passe trop court."); return; }
    try {
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPwd, password: newPwd }),
      });
      const json = await res.json();
      if (!res.ok) { setPwdError(json.message || "Erreur lors du changement."); return; }
      setPwdSuccess("Mot de passe mis à jour.");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch { setPwdError("Erreur réseau."); }
  }

  function handleExportData() {
    if (!user) return;
    const blob = new Blob([JSON.stringify(user, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "mes-donnees-labexplain.json"; a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDeleteAccount() {
    if (!deleteConfirm) { setDeleteConfirm(true); return; }
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (!res.ok) { alert("Erreur lors de la suppression."); return; }
      removeCurrentUser();
      onUserChange();
      navigate("/");
    } catch { alert("Erreur réseau."); }
  }

  if (!user) return null;

  return (
    <>
      <Header lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="settings-layout">
        <h1>Paramètres</h1>

        {/* --- SECTION AFFICHAGE --- */}
        <section className="settings-section">
          <h2>Affichage</h2>
          <label>Langue de l'interface
            <select value={lang} onChange={e => onLangChange(e.target.value as Lang)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </label>
          <label>Mode de lecture
            <select value={font} onChange={e => onFontChange(e.target.value as FontMode)}>
              <option value="standard">Standard</option>
              <option value="malvoyant">Malvoyant</option>
              <option value="dyslexique">Dyslexique</option>
              <option value="tdah">TDAH</option>
            </select>
          </label>
        </section>

        {/* --- SECTION IA --- */}
        <section className="settings-section">
          <h2>IA et résumés</h2>
          <label>Langue du résumé généré
            <select value={aiLang} onChange={e => setAiLang(e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </label>
          <label>Niveau de détail
            <select value={aiDetail} onChange={e => setAiDetail(e.target.value)}>
              <option value="court">Court</option>
              <option value="détaillé">Détaillé</option>
            </select>
          </label>
          <label>Nombre de questions suggérées : {aiQCount}
            <input type="range" min={3} max={7} step={2} value={aiQCount}
              onChange={e => setAiQCount(Number(e.target.value))} />
          </label>
        </section>

        {/* --- SECTION QUESTIONNAIRE --- */}
        <section className="settings-section">
          <h2>Questionnaire</h2>
          <label className="toggle-label">
            <input type="checkbox" checked={showRedflags}
              onChange={e => setShowRedflags(e.target.checked)} />
            Afficher les signaux d'alarme (redflags)
          </label>
          <label className="toggle-label">
            <input type="checkbox" checked={simpleMode}
              onChange={e => setSimpleMode(e.target.checked)} />
            Activer le mode guidé simplifié
          </label>
        </section>

        {/* --- SECTION COMPTE --- */}
        <section className="settings-section">
          <h2>Compte</h2>

          <div className="settings-subsection">
            <h3>Modifier le mot de passe</h3>
            <input type="password" placeholder="Mot de passe actuel" value={currentPwd}
              onChange={e => setCurrentPwd(e.target.value)} />
            <input type="password" placeholder="Nouveau mot de passe" value={newPwd}
              onChange={e => setNewPwd(e.target.value)} />
            <input type="password" placeholder="Confirmer le nouveau" value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)} />
            {pwdError && <p className="error-inline">{pwdError}</p>}
            {pwdSuccess && <p className="success-inline">{pwdSuccess}</p>}
            <button className="button" onClick={handlePasswordChange}>
              Changer le mot de passe
            </button>
          </div>

          <div className="settings-subsection">
            <h3>Mes données (RGPD)</h3>
            <button className="button secondary" onClick={handleExportData}>
              Télécharger mes données
            </button>
          </div>

          <div className="settings-subsection">
            <h3>Supprimer mon compte</h3>
            {deleteConfirm && (
              <p className="error-inline">⚠️ Êtes-vous sûr ? Cette action est irréversible.</p>
            )}
            <button className="button danger" onClick={handleDeleteAccount}>
              {deleteConfirm ? "Confirmer la suppression" : "Supprimer mon compte"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default SettingsPage;