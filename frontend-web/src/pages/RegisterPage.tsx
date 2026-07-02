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
import { t } from "../i18n";
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
// Le libellé passe par une clé de traduction plutôt qu'un texte figé.
const PWD_RULES = [
    { id: "length",    key: "passwordRules.length",  test: (p: string) => p.length >= 8 },
    { id: "upper",     key: "passwordRules.upper",    test: (p: string) => /[A-Z]/.test(p) },
    { id: "lower",     key: "passwordRules.lower",    test: (p: string) => /[a-z]/.test(p) },
    { id: "digit",     key: "passwordRules.digit",    test: (p: string) => /\d/.test(p) },
    { id: "special",   key: "passwordRules.special",  test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-\+=\[\]\\/]/.test(p) },
];

function PasswordRules({ password, lang }: { password: string; lang: Lang }) {
    if (!password) return null;
    return (
        <ul style={{ listStyle: "none", padding: 0, margin: "0.4rem 0 0.8rem", fontSize: "0.82rem" }}>
            {PWD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                    <li key={rule.id} style={{ color: ok ? "#16a34a" : "#dc2626", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: "bold" }}>{ok ? "✓" : "✗"}</span>
                        {t(lang, rule.key)}
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
    // On suivait auparavant si resendMsg contenait le mot "Erreur" pour
    // choisir la couleur du message : ça ne fonctionne plus une fois le
    // texte traduit. On garde donc l'état succès/erreur séparément.
    const [resendIsError, setResendIsError]   = useState(false);

    const formRef = useRef<HTMLFormElement>(null);
    const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // -------------------------------------------------------
    // ÉTAPE 1 - Vérification de l'email
    // -------------------------------------------------------
    async function handleEmailCheck(event: FormEvent) {
        event.preventDefault();
        setEmailError("");

        const email = emailInput.trim().toLowerCase();
        if (!email) { setEmailError(t(lang, "register.emailRequired")); return; }

        setEmailLoading(true);

        try {
            const response = await apiPost<{ email: string }>("/auth/check-email", { email });
            if (response.success) {
                setValidatedEmail(email);
                setStep("form");
            } else {
                setEmailError(response.message || t(lang, "register.emailInvalid"));
            }
        } catch (err) {
            setEmailError(err instanceof Error ? err.message : t(lang, "register.emailInvalid"));
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
            setFormError(t(lang, "register.passwordRulesError"));
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
            setFormError(result.message || t(lang, "register.registerError"));
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
        setResendIsError(false);

        try {
            const response = await apiPost("/auth/resend-confirmation", { email: sentEmail });
            if (response.success) {
                setResendMsg(t(lang, "register.emailResent"));
                setResendIsError(false);
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
                setResendMsg(response.message || t(lang, "register.resendError"));
                setResendIsError(true);
            }
        } catch (err) {
            setResendMsg(err instanceof Error ? err.message : t(lang, "common.networkError"));
            setResendIsError(true);
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
                        <h1 style={{ color: "#16a34a" }}>{t(lang, "register.accountCreated")}</h1>
                        <p>
                            {t(lang, "register.confirmationSent")}{" "}
                            <strong>{sentEmail}</strong>.
                        </p>
                        <p className="muted">
                            {t(lang, "register.activateAccount")}{" "}
                            {t(lang, "register.linkValidFor")} <strong>{t(lang, "register.twentyFourHours")}</strong>.
                        </p>
                        <p className="muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                            {t(lang, "register.emailContainsLegalInfo")}
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
                                    ? t(lang, "register.resendInProgress")
                                    : resendCooldown > 0
                                        ? `${t(lang, "register.resendEmailCountdown")} (${resendCooldown}s)`
                                        : t(lang, "register.resendEmail")}
                            </button>

                            {resendMsg && (
                                <p style={{
                                    marginTop: "0.6rem",
                                    fontSize: "0.88rem",
                                    color: resendIsError ? "#dc2626" : "#16a34a",
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
                            {t(lang, "register.backToLogin")}
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
                        <h1>{t(lang, "auth.signup")}</h1>
                        <p className="muted">
                            {t(lang, "register.checkEmailIntro")}
                        </p>

                        <form onSubmit={handleEmailCheck}>
                            <label htmlFor="email-check">{t(lang, "common.email")}</label>
                            <input
                                id="email-check"
                                type="email"
                                placeholder={t(lang, "register.emailPlaceholder")}
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
                                {emailLoading ? t(lang, "register.checkingEmail") : t(lang, "common.next")}
                            </button>
                        </form>

                        <p className="muted" style={{ marginTop: "1.2rem" }}>
                            {t(lang, "auth.alreadyAccount")}{" "}
                            <Link to="/connexion">{t(lang, "auth.login")}</Link>
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
                    <h1>{t(lang, "auth.signup")}</h1>

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
                            {t(lang, "register.editEmail")}
                        </button>
                    </div>

                    <form ref={formRef} onSubmit={handleSubmit}>
                        {/* Nom / Prénom */}
                        <div className="form-grid two">
                            <div>
                                <label htmlFor="nom">{t(lang, "common.lastName")}</label>
                                <input id="nom" name="nom" placeholder={t(lang, "common.lastName")} required />
                            </div>
                            <div>
                                <label htmlFor="prenom">{t(lang, "common.firstName")}</label>
                                <input id="prenom" name="prenom" placeholder={t(lang, "common.firstName")} required />
                            </div>
                        </div>

                        {/* Mot de passe avec show/hide et validation temps réel */}
                        <label htmlFor="password">{t(lang, "common.password")}</label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t(lang, "common.password")}
                                value={password}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                style={{ paddingRight: "3rem", width: "100%", boxSizing: "border-box" }}
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                title={showPassword ? t(lang, "register.hidePassword") : t(lang, "register.showPassword")}
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
                        <PasswordRules password={password} lang={lang} />

                        {/* Rôle */}
                        <label htmlFor="role">{t(lang, "common.role")}</label>
                        <select id="role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
                            <option value="patient">{t(lang, "common.patient")}</option>
                            <option value="medecin">{t(lang, "common.doctor")}</option>
                        </select>

                        {/* Champs patient */}
                        {role === "patient" && (
                            <div>
                                <div className="form-grid two">
                                    <div>
                                        <label htmlFor="birthdate">{t(lang, "common.birthdate")}</label>
                                        <input type="date" id="birthdate" name="birthdate" />
                                    </div>
                                    <div>
                                        <label htmlFor="gender">{t(lang, "common.gender")}</label>
                                        <select id="gender" name="gender">
                                            <option value="M">{t(lang, "common.genderMale")}</option>
                                            <option value="F">{t(lang, "common.genderFemale")}</option>
                                            <option value="O">{t(lang, "common.genderOther")}</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-grid two">
                                    <div>
                                        <label htmlFor="weight">{t(lang, "common.weight")}</label>
                                        <input type="number" id="weight" name="weight" min="0" placeholder={t(lang, "common.weight")} />
                                    </div>
                                    <div>
                                        <label htmlFor="height">{t(lang, "common.height")}</label>
                                        <input type="number" id="height" name="height" min="0" placeholder={t(lang, "common.height")} />
                                    </div>
                                </div>
                                <label htmlFor="antecedents">{t(lang, "common.antecedents")}</label>
                                <textarea id="antecedents" name="antecedents" rows={3} placeholder={t(lang, "common.antecedents")} />
                                <label htmlFor="traitements">{t(lang, "common.treatments")}</label>
                                <textarea id="traitements" name="traitements" rows={3} placeholder={t(lang, "common.treatments")} />
                                <label htmlFor="allergies">{t(lang, "common.allergies")}</label>
                                <textarea id="allergies" name="allergies" rows={3} placeholder={t(lang, "common.allergies")} />
                            </div>
                        )}

                        {/* Champs médecin */}
                        {role === "medecin" && (
                            <div>
                                <label htmlFor="specialite">{t(lang, "common.specialty")}</label>
                                <input id="specialite" name="specialite" placeholder={t(lang, "common.specialty")} />
                            </div>
                        )}

                        {/* Consentement */}
                        <label className="checkbox-row">
                            <input type="checkbox" name="consent" required />
                            <span>{t(lang, "auth.consentText")}</span>
                        </label>

                        {formError && <p className="error-inline">{formError}</p>}

                        <button type="submit" disabled={loading || !pwdAllValid}>
                            {loading
                                ? t(lang, "auth.signupLoading")
                                : t(lang, "common.submit")}
                        </button>
                    </form>

                    <p className="muted" style={{ marginTop: "1rem" }}>
                        {t(lang, "auth.alreadyAccount")}{" "}
                        <Link to="/connexion">{t(lang, "auth.login")}</Link>
                    </p>
                </section>
            </main>
        </>
    );
}

export default RegisterPage;
