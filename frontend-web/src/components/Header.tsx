import { Link, useNavigate } from "react-router-dom";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import { logoutUser } from "../services/auth";
import { translate } from "../data/translations";

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

  function goToForm() {
    navigate(user ? "/formulaire" : "/connexion");
  }

  function handleLogout() {
    logoutUser();
    alert(translate(lang, "logoutConfirm"));
    onUserChange();
    navigate("/");
  }

  return (
    <header className={`site-header ${simple ? "simple" : "glass-header"}`}>
      <div className="logo">
        <Link to="/">LabExplain</Link>
      </div>

      {!simple && (
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
      )}

      <div className="right">
        <label className="sr-only" htmlFor="lang">
          Langue
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
              Police
            </label>
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
          <div className="dropdown" id="accountMenu">
            <button id="btn-account" type="button">
              {translate(lang, "account")}
            </button>
            <div className="dropdown-content">
              <Link to="/dashboard">
                {translate(lang, "myProfile")}
              </Link>
              <hr />
              <Link to="/parametres">Paramètres</Link>
              <hr />
              <button type="button" className="logout-btn" onClick={handleLogout}>
                {translate(lang, "logout")}
              </button>
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