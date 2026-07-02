import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import "./App.css";
import HomePage        from "./pages/HomePage";
import LoginPage       from "./pages/LoginPage";
import RegisterPage    from "./pages/RegisterPage";
import ConfirmEmailPage from "./pages/ConfirmEmailPage";
import FormPage        from "./pages/FormPage";
import DashboardPage   from "./pages/DashboardPage";
import ResultPage      from "./pages/ResultPage";
import AppointmentPage from "./pages/AppointmentPage";
import AboutPage       from "./pages/AboutPage";
import SettingsPage    from "./pages/SettingsPage";
import {
    getCurrentUser,
    getStoredFont,
    getStoredLang,
    setStoredFont,
    setStoredLang,
} from "./services/storage";
import type { FontMode, Lang } from "./types/lang";
import type { User } from "./types/user";
import Footer from "./components/Footer";
import TestPdfPage from "./pages/TestPdfPage";
import ToastContainer from "./components/ToastContainer";
import { t } from "./i18n";
import { languages } from "./i18n/languages";

type PageProps = {
    lang: Lang;
    font: FontMode;
    user: User | null;
    onLangChange: (lang: Lang) => void;
    onFontChange: (font: FontMode) => void;
    onUserChange: () => void;
};

function RequireAuth({ user, children }: { user: User | null; children: React.ReactNode }) {
    const location = useLocation();
    if (!user) {
        return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
    }
    return <>{children}</>;
}

function NotFoundPage({ lang }: PageProps) {
    return (
        <main className="auth-layout">
            <section className="auth-card" style={{ textAlign: "center" }}>
                <h1 style={{ fontSize: "4rem", margin: 0 }}>
                    {t(lang, "app.notFoundCode")}
                </h1>
                <p style={{ fontSize: "1.2rem", margin: "1rem 0" }}>
                    {t(lang, "app.pageNotFound")}
                </p>
                <a href="/" className="button">
                    {t(lang, "app.backHome")}
                </a>
            </section>
        </main>
    );
}

function App() {
    const [lang, setLang] = useState<Lang>(getStoredLang());
    const [font, setFont] = useState<FontMode>(getStoredFont());
    const [user, setUser] = useState<User | null>(getCurrentUser());

    useEffect(() => { setUser(getCurrentUser()); }, []);

    useEffect(() => {
        document.documentElement.lang = lang;
        document.documentElement.dir = languages[lang].dir;
    }, [lang]);

    useEffect(() => {
        document.body.classList.remove("font-malvoyant", "font-dyslexique", "font-tdah");
        if (font !== "standard") document.body.classList.add(`font-${font}`);
    }, [font]);

    function handleLangChange(nextLang: Lang) { setLang(nextLang); setStoredLang(nextLang); }
    function handleFontChange(nextFont: FontMode) { setFont(nextFont); setStoredFont(nextFont); }
    function refreshUser() { setUser(getCurrentUser()); }

    const pageProps: PageProps = {
        lang, font, user,
        onLangChange: handleLangChange,
        onFontChange: handleFontChange,
        onUserChange: refreshUser,
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Pages publiques */}
                <Route path="/"                 element={<HomePage          {...pageProps} />} />
                <Route path="/about"            element={<AboutPage         {...pageProps} />} />
                <Route path="/connexion"        element={<LoginPage         {...pageProps} />} />
                <Route path="/inscription"      element={<RegisterPage      {...pageProps} />} />
                <Route path="/confirmer-email"  element={<ConfirmEmailPage  {...pageProps} />} />
                <Route path="/test-pdf" element={<TestPdfPage />} />

                {/* Pages protégées */}
                <Route path="/dashboard"   element={<RequireAuth user={user}><DashboardPage   {...pageProps} /></RequireAuth>} />
                <Route path="/formulaire"  element={<RequireAuth user={user}><FormPage         {...pageProps} /></RequireAuth>} />
                <Route path="/resultat"    element={<RequireAuth user={user}><ResultPage       {...pageProps} /></RequireAuth>} />
                <Route path="/rendez-vous" element={<RequireAuth user={user}><AppointmentPage  {...pageProps} /></RequireAuth>} />
                <Route path="/parametres"  element={<RequireAuth user={user}><SettingsPage     {...pageProps} /></RequireAuth>} />

                {/* 404 */}
                <Route path="*" element={<NotFoundPage {...pageProps} />} />
            </Routes>
            <Footer lang={lang} />
            <ToastContainer />
        </BrowserRouter>
    );
}

export default App;
