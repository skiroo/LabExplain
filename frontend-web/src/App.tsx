import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FormPage from "./pages/FormPage";
import DashboardPage from "./pages/DashboardPage";
import ResultPage from "./pages/ResultPage";
import AboutPage from "./pages/AboutPage";
import SettingsPage from "./pages/SettingsPage";
import {
  getCurrentUser,
  getStoredFont,
  getStoredLang,
  setStoredFont,
  setStoredLang,
} from "./services/storage";
import type { FontMode, Lang } from "./types/lang";
import type { User } from "./types/user";

function App() {
  const [lang, setLang] = useState<Lang>(getStoredLang());
  const [font, setFont] = useState<FontMode>(getStoredFont());
  const [user, setUser] = useState<User | null>(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.body.style.direction = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(() => {
    document.body.classList.remove("font-malvoyant", "font-dyslexique", "font-tdah");
    if (font !== "standard") {
      document.body.classList.add(`font-${font}`);
    }
  }, [font]);

  function handleLangChange(nextLang: Lang) {
    setLang(nextLang);
    setStoredLang(nextLang);
  }

  function handleFontChange(nextFont: FontMode) {
    setFont(nextFont);
    setStoredFont(nextFont);
  }

  function refreshUser() {
    setUser(getCurrentUser());
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/connexion"
          element={
            <LoginPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/inscription"
          element={
            <RegisterPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/formulaire"
          element={
            <FormPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <DashboardPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/resultat"
          element={
            <ResultPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/about"
          element={
            <AboutPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />

        <Route
          path="/parametres"
          element={
            <SettingsPage
              lang={lang}
              font={font}
              user={user}
              onLangChange={handleLangChange}
              onFontChange={handleFontChange}
              onUserChange={refreshUser}
            />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;