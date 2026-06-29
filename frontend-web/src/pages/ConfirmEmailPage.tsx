/*
Fichier : ConfirmEmailPage.tsx
Dossier : src/pages/
Description :
  Page appelée depuis le lien de confirmation dans l'email d'inscription.
  Lit le token dans l'URL (?token=...), appelle le backend, affiche le résultat.
*/

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { confirmEmail } from "../services/auth";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import Header from "../components/Header";

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
    const [status, setStatus]   = useState<Status>("loading");
    const [message, setMessage] = useState("");
    const [email, setEmail]     = useState("");

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus("error");
            setMessage("Lien invalide - aucun token trouvé.");
            return;
        }

        confirmEmail(token).then((result) => {
            if (result.success) {
                setStatus("success");
                setEmail(result.email || "");
                setMessage(result.message || "Email confirmé.");
            } else {
                setStatus("error");
                setMessage(result.message || "Lien invalide ou expiré.");
            }
        });
    }, [searchParams]);

    return (
        <>
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
                            <h1>Vérification en cours...</h1>
                            <p className="muted">Validation de votre adresse email.</p>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <h1 style={{ color: "#16a34a" }}>Email confirmé</h1>
                            <p>{message}</p>
                            {email && (
                                <p className="muted">
                                    Vous pouvez maintenant vous connecter avec <strong>{email}</strong>
                                </p>
                            )}
                            <Link to="/connexion" className="button" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                                Se connecter
                            </Link>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <h1 style={{ color: "#dc2626" }}>Lien invalide</h1>
                            <p className="error-inline">{message}</p>
                            <p className="muted">
                                Le lien a peut-être expiré (valable 24h). Réinscrivez-vous pour recevoir un nouveau lien.
                            </p>
                            <Link to="/inscription" className="button secondary" style={{ marginTop: "1.5rem", display: "inline-block" }}>
                                Retour à l'inscription
                            </Link>
                        </>
                    )}

                </section>
            </main>
        </>
    );
}

export default ConfirmEmailPage;
