import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import { t } from "../i18n";
import { loginUser } from "../services/auth";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import BionicReading from "../components/BionicReading";

type LoginPageProps = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    onLangChange: (lang: Lang) => void;
    onFontChange: (font: FontMode) => void;
    onUserChange: () => void;
};

function LoginPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: LoginPageProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const { user: loggedUser, message } = await loginUser(email, password);

        setIsLoading(false);

        if (!loggedUser) {
            setErrorMsg(message || t(lang, "auth.badLogin"));
            return;
        }

        onUserChange();
        const from = (location.state as { from?: string })?.from || "/dashboard";
        navigate(from);
    }

    return (
        <BionicReading active={font === "tdah"}>
            <Header
                simple
                showFontSelect={false}
                lang={lang}
                font={font}
                user={user}
                onLangChange={onLangChange}
                onFontChange={onFontChange}
                onUserChange={onUserChange}
            />

            <main className="auth-layout">
                <section className="auth-card">
                    <h1>{t(lang, "auth.login")}</h1>
                    <p className="muted">{t(lang, "auth.intro")}</p>

                    <form onSubmit={handleSubmit}>
                        <label htmlFor="loginEmail">{t(lang, "common.email")}</label>
                        <input
                            id="loginEmail"
                            type="email"
                            autoComplete="email"
                            placeholder={t(lang, "common.email")}
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <label htmlFor="loginPassword">{t(lang, "common.password")}</label>
                        <input
                            id="loginPassword"
                            type="password"
                            autoComplete="current-password"
                            placeholder={t(lang, "common.password")}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />

                        {errorMsg && <p className="error-inline">{errorMsg}</p>}

                        <button type="submit" disabled={isLoading}>
                            {isLoading ? t(lang, "auth.loginLoading") : t(lang, "auth.login")}
                        </button>
                    </form>

                    <p className="muted">{t(lang, "auth.noAccount")}</p>
                    <Link className="button secondary full" to="/inscription">
                        {t(lang, "auth.signup")}
                    </Link>

                    <div className="demo-box">
                        <p>
                            <strong>{t(lang, "auth.demoPatient")}</strong> : patient@test.com / 1235
                        </p>
                        <p>
                            <strong>{t(lang, "auth.demoDoctor")}</strong> : medecin@test.com / 1234
                        </p>
                    </div>
                </section>
            </main>
        </BionicReading>
    );
}

export default LoginPage;
