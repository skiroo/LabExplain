import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { translate } from "../data/translations";
import { loginUser } from "../services/auth";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const loggedUser = loginUser(email, password);
    if (!loggedUser) {
      alert(translate(lang, "badLogin"));
      return;
    }

    onUserChange();
    navigate("/");
  }

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
        <section className="auth-card">
          <h1>{translate(lang, "login")}</h1>
          <p className="muted">{translate(lang, "authIntro")}</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="loginEmail">{translate(lang, "email")}</label>
            <input
              id="loginEmail"
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <label htmlFor="loginPassword">{translate(lang, "password")}</label>
            <input
              id="loginPassword"
              type="password"
              autoComplete="current-password"
              placeholder={translate(lang, "password")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            <button type="submit">{translate(lang, "login")}</button>
          </form>

          <p className="muted">{translate(lang, "noaccount")}</p>
          <Link className="button secondary full" to="/inscription">
            {translate(lang, "signup")}
          </Link>

          <div className="demo-box">
            <p>
              <strong>Demo patient</strong> : patient@test.com / 1235
            </p>
            <p>
              <strong>Demo médecin</strong> : medecin@test.com / 1234
            </p>
          </div>
        </section>
      </main>
    </>
  );
}

export default LoginPage;
