import { useEffect, useRef, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmEmail } from "../services/auth";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import Header from "../components/Header";
import { t } from "../i18n";
import BionicReading from "../components/BionicReading";

type Props = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    onLangChange: (l: Lang) => void;
    onFontChange: (f: FontMode) => void;
    onUserChange: () => void;
};

type Status = "loading" | "success" | "error";

function ConfirmEmailPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<Status>("loading");
    const [message, setMessage] = useState("");
    const [email, setEmail] = useState("");
    const hasRun = useRef(false);

    useEffect(() => {
        // Garde contre le double appel en React.StrictMode (dev)
        // et contre un éventuel re-render qui relancerait l'effet
        if (hasRun.current) return;
        hasRun.current = true;

        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage(t(lang, "confirmEmail.invalidNoToken"));
            return;
        }

        confirmEmail(token).then((result) => {
            if (result.success) {
                setStatus("success");
                setEmail(result.email || "");
                setMessage(result.message || t(lang, "confirmEmail.successMessage"));
            } else {
                setStatus("error");
                setMessage(result.message || t(lang, "confirmEmail.invalidOrExpired"));
            }
        });
    }, [searchParams, lang]);

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
                <section className="auth-card" style={{ textAlign: "center" }}>

                    {status === "loading" && (
                        <>
                            <h1>{t(lang, "confirmEmail.loadingTitle")}</h1>
                            <p className="muted">{t(lang, "confirmEmail.loadingText")}</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h1 style={{ color: "#16a34a" }}>{t(lang, "confirmEmail.successTitle")}</h1>
                            <p>{message}</p>
                            {email && (
                                <p className="muted">
                                    {t(lang, "confirmEmail.successLoginText")} <strong>{email}</strong>
                                </p>
                            )}
                            <Link to="/connexion" className="button" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                                {t(lang, "confirmEmail.loginButton")}
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h1 style={{ color: "#dc2626" }}>{t(lang, "confirmEmail.errorTitle")}</h1>
                            <p className="error-inline">{message}</p>
                            <p className="muted">
                                {t(lang, "confirmEmail.expiredHelp")}
                            </p>
                            <Link to="/inscription" className="button secondary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                                {t(lang, "confirmEmail.backToSignup")}
                            </Link>
                        </>
                    )}

                </section>
            </main>
        </BionicReading>
    );
}

export default ConfirmEmailPage;
