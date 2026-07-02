import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import { logoutUser } from "../services/auth";
import { notifyAfterReload } from "../services/notifications";
import { t } from "../i18n";
import logoPng from "../assets/logo.png";

type HeaderProps = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    simple?: boolean;
    showFontSelect?: boolean;
    onLangChange: (lang: Lang) => void;
    onFontChange: (font: FontMode) => void;
    onUserChange: () => void;
};

function Header({
    lang,
    font,
    user,
    simple = false,
    showFontSelect = true,
    onLangChange,
    onFontChange,
    onUserChange,
}: HeaderProps) {
    const navigate = useNavigate();
    // true = ouvert par hover, false = fermé, "locked" = ouvert par clic (reste ouvert même sans hover)
    const [dropdownState, setDropdownState] = useState<"closed" | "hover" | "locked">("closed");
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isOpen = dropdownState !== "closed";

    function handleMouseEnter() {
        // Annuler un éventuel timer de fermeture
        if (closeTimer.current) clearTimeout(closeTimer.current);
        // Ouvrir en hover seulement si pas déjà locké
        if (dropdownState === "closed") setDropdownState("hover");
    }

    function handleMouseLeave() {
        // Fermer après un petit délai pour laisser le temps de descendre vers le panel
        if (dropdownState === "hover") {
            closeTimer.current = setTimeout(() => setDropdownState("closed"), 100);
        }
    }

    function handleButtonClick() {
        if (dropdownState === "locked") {
            // Deuxième clic : fermer
            setDropdownState("closed");
        } else {
            // Premier clic (hover ou closed) : locker l'ouverture
            setDropdownState("locked");
        }
    }

    function closeDropdown() {
        setDropdownState("closed");
    }

    function goToForm() {
        navigate(user ? "/formulaire" : "/connexion");
    }

    async function handleLogout() {
        await logoutUser();
        closeDropdown();
        notifyAfterReload(t(lang, "auth.logoutConfirm"), "success");
        onUserChange();
        // Rechargement complet de la page après déconnexion
        window.location.href = "/";
    }

    return (
        <header className={`site-header ${simple ? "simple" : "glass-header"}`}>
            {/* Colonne gauche : logo image + nom */}
            <div className="logo">
                <Link to="/">
                    <img src={logoPng} alt="LabExplain" className="logo-img" />
                    LabExplain
                </Link>
            </div>

            {/* Colonne centrale : navigation (div vide en mode simple pour tenir la grille) */}
            {!simple ? (
                <nav>
                    <Link to="/">{t(lang, "nav.home")}</Link>
                    <button type="button" className="nav-button" onClick={goToForm}>
                        {t(lang, "nav.form")}
                    </button>
                    {user && (user.role === "patient" || user.role === "medecin") && (
                        <Link to="/dashboard">{t(lang, "nav.dashboard")}</Link>
                    )}
                    <Link to="/about">{t(lang, "nav.about")}</Link>
                </nav>
            ) : (
                <div aria-hidden="true" />
            )}

            {/* Colonne droite : langue, police, compte */}
            <div className="right">
                <label className="sr-only" htmlFor="lang">
                    {t(lang, "language.label")}
                </label>
                <select
                    id="lang"
                    aria-label="Choix de la langue"
                    value={lang}
                    onChange={(event) => onLangChange(event.target.value as Lang)}
                >
                    <option value="fr">FR</option>
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                    <option value="ar">AR</option>
                </select>

                {showFontSelect && (
                    <>
                        <label className="sr-only" htmlFor="fontSelect">
                            {t(lang, "font.label")}
                        </label>
                        <select
                            id="fontSelect"
                            aria-label={t(lang, "font.chooseFont")}
                            value={font}
                            onChange={(event) => onFontChange(event.target.value as FontMode)}
                        >
                            <option value="standard">{t(lang, "font.standard")}</option>
                            <option value="malvoyant">{t(lang, "font.visuallyImpaired")}</option>
                            <option value="dyslexique">{t(lang, "font.dyslexic")}</option>
                            <option value="tdah">{t(lang, "font.adhd")}</option>
                        </select>
                    </>
                )}

                {user ? (
                    <div
                        className={`dropdown${isOpen ? " open" : ""}`}
                        id="accountMenu"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <button
                            id="btn-account"
                            type="button"
                            aria-expanded={isOpen}
                            onClick={handleButtonClick}
                        >
                            {t(lang, "nav.account")} &#9662;
                        </button>
                        <div className="dropdown-content">
                            <div className="dropdown-content-inner">
                                <Link to="/dashboard" onClick={closeDropdown}>
                                    {t(lang, "nav.myProfile")}
                                </Link>
                                <hr />
                                <Link to="/parametres" onClick={closeDropdown}>{t(lang, "nav.settings")}</Link>
                                <hr />
                                <button type="button" className="logout-btn" onClick={handleLogout}>
                                    {t(lang, "nav.logout")}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link to="/connexion" id="loginLink">
                        {t(lang, "nav.login")}
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Header;
