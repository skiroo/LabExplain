import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import { logoutUser } from "../services/auth";
import { translate } from "../data/translations";
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

    function handleLogout() {
        logoutUser();
        closeDropdown();
        alert(translate(lang, "logoutConfirm"));
        onUserChange();
        navigate("/");
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
                    <Link to="/">{translate(lang, "home")}</Link>
                    <button type="button" className="nav-button" onClick={goToForm}>
                        {translate(lang, "form")}
                    </button>
                    {user && (user.role === "patient" || user.role === "medecin") && (
                        <Link to="/dashboard">Mon espace</Link>
                    )}
                    <Link to="/about">À propos</Link>
                </nav>
            ) : (
                <div aria-hidden="true" />
            )}

            {/* Colonne droite : langue, police, compte */}
            <div className="right">
                <label className="sr-only" htmlFor="lang">Langue</label>
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
                        <label className="sr-only" htmlFor="fontSelect">Police</label>
                        <select
                            id="fontSelect"
                            aria-label="Choix de la police"
                            value={font}
                            onChange={(event) => onFontChange(event.target.value as FontMode)}
                        >
                            <option value="standard">Standard</option>
                            <option value="malvoyant">Malvoyant</option>
                            <option value="dyslexique">Dyslexique</option>
                            <option value="tdah">TDAH</option>
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
                            {translate(lang, "account")} &#9662;
                        </button>
                        <div className="dropdown-content">
                            <div className="dropdown-content-inner">
                                <Link to="/dashboard" onClick={closeDropdown}>
                                    {translate(lang, "myProfile")}
                                </Link>
                                <hr />
                                <Link to="/parametres" onClick={closeDropdown}>Paramètres</Link>
                                <hr />
                                <button type="button" className="logout-btn" onClick={handleLogout}>
                                    {translate(lang, "logout")}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <Link to="/connexion" id="loginLink">
                        {translate(lang, "login")}
                    </Link>
                )}
            </div>
        </header>
    );
}

export default Header;
