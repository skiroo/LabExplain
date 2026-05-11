import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { translate } from "../data/translations";
import { registerUser } from "../services/auth";
import type { FontMode, Lang } from "../types/lang";
import type { User, UserRole } from "../types/user";

type RegisterPageProps = {
  lang: Lang;
  font: FontMode;
  user: User | null;
  onLangChange: (lang: Lang) => void;
  onFontChange: (font: FontMode) => void;
  onUserChange: () => void;
};

function RegisterPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: RegisterPageProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<UserRole>("patient");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newUser: User = {
      nom: String(formData.get("nom") || "").trim(),
      prenom: String(formData.get("prenom") || "").trim(),
      email: String(formData.get("email") || "").trim().toLowerCase(),
      password: String(formData.get("password") || ""),
      role,
      consent: formData.get("consent") === "on",
    };

    if (role === "patient") {
      newUser.birthdate = String(formData.get("birthdate") || "");
      newUser.gender = String(formData.get("gender") || "");
      newUser.weight = Number(formData.get("weight") || 0);
      newUser.height = Number(formData.get("height") || 0);
      newUser.antecedents = String(formData.get("antecedents") || "");
      newUser.traitements = String(formData.get("traitements") || "");
      newUser.allergies = String(formData.get("allergies") || "");
    }

    const result = registerUser(newUser);
    if (!result.success) {
      alert(result.message);
      return;
    }

    navigate("/connexion");
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
        <section className="auth-card large">
          <h1>{translate(lang, "signup")}</h1>

          <form onSubmit={handleSubmit}>
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

            <label htmlFor="email">{translate(lang, "email")}</label>
            <input id="email" name="email" type="email" placeholder="Email" required />

            <label htmlFor="password">{translate(lang, "password")}</label>
            <input id="password" name="password" type="password" placeholder={translate(lang, "password")} required />

            <label htmlFor="role">{translate(lang, "role")}</label>
            <select id="role" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
              <option value="patient">{translate(lang, "patient")}</option>
              <option value="medecin">{translate(lang, "medecin")}</option>
            </select>

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

            <label className="checkbox-row">
              <input type="checkbox" name="consent" />
              <span>{translate(lang, "consentText")}</span>
            </label>

            <button type="submit">{translate(lang, "valider")}</button>
          </form>
        </section>
      </main>
    </>
  );
}

export default RegisterPage;
