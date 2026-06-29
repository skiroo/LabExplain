/*
Fichier : RegisterPage.tsx
Dossier : src/pages/
Description :
  Page d'inscription en deux étapes :
  Étape 1 - Vérification de l'email (format + domaine MX + unicité)
  Étape 2 - Reste du formulaire avec validation mot de passe en temps réel
*/

import { useState, useRef } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import { translate } from "../data/translations";
import { registerUser } from "../services/auth";
import { apiPost } from "../services/api";
import type { FontMode, Lang } from "../types/lang";
import type { User, UserRole } from "../types/user";

type Props = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    onLangChange: (lang: Lang) => void;
    onFontChange: (font: FontMode) => void;
    onUserChange: () => void;
};

// Règles de validation du mot de passe - miroir exact de validators.py
const PWD_RULES = [
    { id: "length",    label: "8 caractères minimum",          test: (p: string) => p.length >= 8 },
    { id: "upper",     label: "Une majuscule",                 test: (p: string) => /[A-Z]/.test(p) },
    { id: "lower",     label: "Une minuscule",                 test: (p: string) => /[a-z]/.test(p) },
    { id: "digit",     label: "Un chiffre",                   test: (p: string) => /\d/.test(p) },
    { id: "special",   label: "Un caractère spécial (!@#...)", test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-\+=\[\]\\/]/.test(p) },
];

function PasswordRules({ password }: { password: string }) {
    if (!password) return null;
    return (
        <ul style={{ listStyle: "none", padding: 0, margin: "0.4rem 0 0.8rem", fontSize: "0.82rem" }}>
            {PWD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                    <li key={rule.id} style={{ color: ok ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: "bold" }}>{ok ? "✓" : "✗"}</span>
                        {rule.label}
                    </li>
                );
            })}
        </ul>
    );
}

function RegisterPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
    // Étapes : "email" | "form" | "success"
    const [step, setStep]           = useState<"email" | "form" | "success">("email");
    const [validatedEmail, setValidatedEmail] = useState("");

    // Étape 1 - email
    const [emailInput, setEmailInput] = useState("");
    const [emailError, setEmailError] = useState("");
    const [emailLoading, setEmailLoading] = useState(false);

    // Étape 2 - formulaire
    const [role, setRole]           = useState<UserRole>("patient");
    const [password, setPassword]   = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [formError, setFormError] = useState("");
    const [loading, setLoading]     = useState(false);
    const [sentEmail, setSentEmail] = useState("");

    // Écran succès - renvoi email
    const RESEND_DELAY = 60; // secondes avant que le bouton soit actif
    const [resendCooldown, setResendCooldown] = useState(RESEND_DELAY);
    const [resendLoading, setResendLoading]   = useState(false);
    const [resendMsg, setResendMsg]           = useState("");

    const formRef = useRef<HTMLFormElement>(null);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // -------------------------------------------------------
    // ÉTAPE 1 - Vérification de l'email
    // -------------------------------------------------------
    async function handleEmailCheck(event: FormEvent) {
        event.preventDefault();
        setEmailError("");

        const email = emailInput.trim().toLowerCase();
        if (!email) { setEmailError("Veuillez saisir une adresse email."); return; }

        setEmailLoading(true);

        try {
            const response = await apiPost<{ email: string }>("/auth/check-email", { email });
            if (response.success) {
                setValidatedEmail(email);
                setStep("form");
            } else {
                setEmailError(response.message || "Email invalide.");
            }
        } catch (err) {
            setEmailError(err instanceof Error ? err.message : "Email invalide.");
        }

        setEmailLoading(false);
    }

    // -------------------------------------------------------
    // ÉTAPE 2 - Soumission du formulaire complet
    // -------------------------------------------------------
    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setFormError("");

        // Validation mot de passe côté client avant envoi
        const allRulesOk = PWD_RULES.every((r) => r.test(password));
        if (!allRulesOk) {
            setFormError("Le mot de passe ne respecte pas toutes les règles.");
            return;
        }

        const formData  = new FormData(event.currentTarget);
        const weightRaw = Number(formData.get("weight") || 0);
        const heightRaw = Number(formData.get("height") || 0);

        const newUser: User & { specialite?: string } = {
            nom:      String(formData.get("nom")    || "").trim(),
            prenom:   String(formData.get("prenom") || "").trim(),
            email:    validatedEmail,
            password,
            role,
            consent:  formData.get("consent") === "on",
        };

        if (role === "patient") {
            newUser.birthdate   = String(formData.get("birthdate") || "") || undefined;
            newUser.gender      = String(formData.get("gender") || "");
            newUser.weight      = weightRaw > 0 ? weightRaw : undefined;
            newUser.height      = heightRaw > 0 ? heightRaw : undefined;
            newUser.antecedents = String(formData.get("antecedents") || "");
            newUser.traitements = String(formData.get("traitements") || "");
            newUser.allergies   = String(formData.get("allergies")   || "");
        }

        if (role === "medecin") {
            newUser.specialite = String(formData.get("specialite") || "");
        }

        setLoading(true);
        const result = await registerUser(newUser);
        setLoading(false);

        if (!result.success) {
            setFormError(result.message || "Erreur lors de l'inscription.");
            return;
        }

        setSentEmail(validatedEmail);
        setStep("success");
        onUserChange();

        // Démarre le compte à rebours du bouton "Renvoyer"
        setResendCooldown(RESEND_DELAY);
        cooldownRef.current = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    clearInterval(cooldownRef.current!);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }

    // -------------------------------------------------------
    // ÉCRAN SUCCÈS
    // -------------------------------------------------------

    async function handleResend() {
        setResendLoading(true);
        setResendMsg("");

        try {
            const response = await apiPost("/auth/resend-confirmation", { email: sentEmail });
            if (response.success) {
                setResendMsg("Email renvoyé.");
                // Repart le countdown
                setResendCooldown(RESEND_DELAY);
                cooldownRef.current = setInterval(() => {
                    setResendCooldown((prev) => {
                        if (prev <= 1) {
                            clearInterval(cooldownRef.current!);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            } else {
                setResendMsg(response.message || "Erreur lors du renvoi.");
            }
        } catch (err) {
            setResendMsg(err instanceof Error ? err.message : "Erreur réseau.");
        }

        setResendLoading(false);
    }

    if (step === "success") {
        return (
            <>
                <Header simple showFontSelect={false} lang={lang} font={font} user={user}
                    onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
                <main className="auth-layout">
                    <section className="auth-card" style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>✉️</div>
                        <h1 style={{ color: "#16a34a" }}>Compte créé</h1>
                        <p>
                            Un email de confirmation a été envoyé à{" "}
                            <strong>{sentEmail}</strong>.
                        </p>
                        <p className="muted">
                            Cliquez sur le lien dans l'email pour activer votre compte.
                            Le lien est valable <strong>24 heures</strong>.
                        </p>
                        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                            L'email contient les Conditions Générales d'Utilisation
                            et la Charte de traitement des données médicales.
                        </p>

                        {/* Bouton renvoyer avec countdown */}
                        <div style={{ marginTop: "1.5rem" }}>
                            <button
                                onClick={handleResend}
                                disabled={resendCooldown > 0 || resendLoading}
                                className="button secondary"
                                style={{ width: "100%" }}
                            >
                                {resendLoading
                                    ? "Envoi en cours..."
                                    : resendCooldown > 0
                                        ? `Renvoyer l'email (${resendCooldown}s)`
                                        : "Renvoyer l'email de confirmation"}
                            </button>

                            {resendMsg && (
                                <p style={{
                                    marginTop: "0.6rem",
                                    fontSize: "0.88rem",
                                    color: resendMsg.includes("Erreur") ? "#dc2626" : "#16a34a",
                                }}>
                                    {resendMsg}
                                </p>
                            )}
                        </div>

                        <Link
                            to="/connexion"
                            className="button"
                            style={{ marginTop: "1rem", display: "block" }}
                        >
                            Retour à la connexion
                        </Link>
                    </section>
                </main>
            </>
        );
    }

    // -------------------------------------------------------
    // ÉTAPE 1 - Saisie et vérification de l'email
    // -------------------------------------------------------
    if (step === "email") {
        return (
            <>
                <Header simple showFontSelect={false} lang={lang} font={font} user={user}
                    onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
                <main className="auth-layout">
                    <section className="auth-card">
                        <h1>{translate(lang, "signup")}</h1>
                        <p className="muted">
                            Commençons par vérifier votre adresse email.
                        </p>

                        <form onSubmit={handleEmailCheck}>
                            <label htmlFor="email-check">{translate(lang, "email")}</label>
                            <input
                                id="email-check"
                                type="email"
                                placeholder="votre@email.com"
                                value={emailInput}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setEmailInput(e.target.value);
                                    setEmailError("");
                                }}
                                autoFocus
                                required
                            />

                            {emailError && <p className="error-inline">{emailError}</p>}

                            <button type="submit" disabled={emailLoading}>
                                {emailLoading ? "Vérification..." : "Continuer"}
                            </button>
                        </form>

                        <p className="muted" style={{ marginTop: "1.2rem" }}>
                            {translate(lang, "alreadyAccount") || "Déjà un compte ?"}{" "}
                            <Link to="/connexion">{translate(lang, "login")}</Link>
                        </p>
                    </section>
                </main>
            </>
        );
    }

    // -------------------------------------------------------
    // ÉTAPE 2 - Formulaire complet
    // -------------------------------------------------------
    const pwdAllValid = PWD_RULES.every((r) => r.test(password));

    return (
        <>
            <Header simple showFontSelect={false} lang={lang} font={font} user={user}
                onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />

            <main className="auth-layout">
                <section className="auth-card large">
                    <h1>{translate(lang, "signup")}</h1>

                    {/* Email validé affiché en lecture seule */}
                    <div style={{
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        marginBottom: "1.2rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "0.9rem",
                    }}>
                        <span>
                            <span style={{ color: "#16a34a", fontWeight: "bold" }}>✓</span>{" "}
                            {validatedEmail}
                        </span>
                        <button
                            type="button"
                            onClick={() => { setStep("email"); setPassword(""); setFormError(""); }}
                            style={{ background: "none", border: "none", color: "#6b7a90", cursor: "pointer", fontSize: "0.8rem", padding: 0 }}
                        >
                            Modifier
                        </button>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        {/* Nom / Prénom */}
                        <div className="form-grid two">
                            <div>
                                <label htmlFor="nom">{translate(lang, "lastName")}</label>
                                <input id="nom" name="nom" placeholder={translate(lang, "lastName")} required />
                            </div>
                            <div>
                                <label htmlFor="prenom">{translate(lang, "firstName")}</label>
                                <input id="prenom" name="prenom" placeholder={translate(lang, "firstName")} required />
                            </div>
                        </div>

                        {/* Mot de passe avec show/hide et validation temps réel */}
                        <label htmlFor="password">{translate(lang, "password")}</label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={translate(lang, "password")}
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                style={{ paddingRight: "3rem", width: "100%", boxSizing: "border-box" }}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                style={{
                                    position: "absolute",
                                    right: "0.6rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontSize: "1.1rem",
                                    padding: "0.2rem",
                                    color: "#6b7a90",
                                    lineHeight: 1,
                                }}
                            >
                                {showPassword ? "🙈" : "👁️"}
                            </button>
                        </div>

                        {/* Indicateur de règles en temps réel */}
                        <PasswordRules password={password} />

                        {/* Rôle */}
                        <label htmlFor="role">{translate(lang, "role")}</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                            <option value="patient">{translate(lang, "patient")}</option>
                            <option value="medecin">{translate(lang, "medecin")}</option>
                        </select>

                        {/* Champs patient */}
                        {role === "patient" && (
                            <div>
                                <div className="form-grid two">
                                    <div>
                                        <label htmlFor="birthdate">{translate(lang, "birthdate")}</label>
                                        <input type="date" id="birthdate" name="birthdate" />
                                    </div>
                                    <div>
                                        <label htmlFor="gender">{translate(lang, "gender")}</label>
                                        <select id="gender" name="gender">
                                            <option value="M">{translate(lang, "gender_m")}</option>
                                            <option value="F">{translate(lang, "gender_f")}</option>
                                            <option value="O">{translate(lang, "gender_o")}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid two">
                                    <div>
                                        <label htmlFor="weight">{translate(lang, "weight")}</label>
                                        <input type="number" id="weight" name="weight" min="0" placeholder={translate(lang, "weight")} />
                                    </div>
                                    <div>
                                        <label htmlFor="height">{translate(lang, "height")}</label>
                                        <input type="number" id="height" name="height" min="0" placeholder={translate(lang, "height")} />
                                    </div>
                                </div>
                                <label htmlFor="antecedents">{translate(lang, "antecedents")}</label>
                                <textarea id="antecedents" name="antecedents" rows={3} placeholder={translate(lang, "antecedents")} />
                                <label htmlFor="traitements">{translate(lang, "treatments")}</label>
                                <textarea id="traitements" name="traitements" rows={3} placeholder={translate(lang, "treatments")} />
                                <label htmlFor="allergies">{translate(lang, "allergies")}</label>
                                <textarea id="allergies" name="allergies" rows={3} placeholder={translate(lang, "allergies")} />
                            </div>
                        )}

                        {/* Champs médecin */}
                        {role === "medecin" && (
                            <div>
                                <label htmlFor="specialite">{translate(lang, "specialite") || "Spécialité"}</label>
                                <input id="specialite" name="specialite" placeholder={translate(lang, "specialite") || "Spécialité"} />
                            </div>
                        )}

                        {/* Consentement */}
                        <label className="checkbox-row">
                            <input type="checkbox" name="consent" required />
                            <span>{translate(lang, "consentText")}</span>
                        </label>

                        {formError && <p className="error-inline">{formError}</p>}

                        <button type="submit" disabled={loading || !pwdAllValid}>
                            {loading
                                ? translate(lang, "loading") || "Création..."
                                : translate(lang, "valider")}
                        </button>
                    </form>

                    <p className="muted" style={{ marginTop: "1rem" }}>
                        {translate(lang, "alreadyAccount") || "Déjà un compte ?"}{" "}
                        <Link to="/connexion">{translate(lang, "login")}</Link>
                    </p>
                </section>
            </main>
        </>
    );
}

export default RegisterPage;
