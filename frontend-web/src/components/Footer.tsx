import { Link } from "react-router-dom";
import type { Lang } from "../types/lang";

type FooterProps = {
    lang: Lang;
};

function Footer({ lang }: FooterProps) {
    const year = new Date().getFullYear();

    const labels: Record<Lang, {
        tagline: string;
        nav: string;
        home: string;
        form: string;
        about: string;
        legal: string;
        privacy: string;
        terms: string;
        contact: string;
        accessibility: string;
        support: string;
        faq: string;
        copyright: string;
        nodiag: string;
    }> = {
        fr: {
            tagline: "Préparez vos questions. Optimisez votre consultation.",
            nav: "Navigation",
            home: "Accueil",
            form: "Formulaire",
            about: "À propos",
            legal: "Légal",
            privacy: "Politique de confidentialité",
            terms: "Conditions d'utilisation",
            contact: "Contact",
            accessibility: "Aide & accessibilité",
            support: "Support",
            faq: "FAQ",
            copyright: `© ${year} LabExplain — Projet académique ING2`,
            nodiag: "LabExplain ne fournit aucun diagnostic médical.",
        },
        en: {
            tagline: "Prepare your questions. Optimise your appointment.",
            nav: "Navigation",
            home: "Home",
            form: "Form",
            about: "About",
            legal: "Legal",
            privacy: "Privacy policy",
            terms: "Terms of use",
            contact: "Contact",
            accessibility: "Help & accessibility",
            support: "Support",
            faq: "FAQ",
            copyright: `© ${year} LabExplain — Academic project ING2`,
            nodiag: "LabExplain does not provide any medical diagnosis.",
        },
        es: {
            tagline: "Prepare sus preguntas. Optimice su consulta.",
            nav: "Navegación",
            home: "Inicio",
            form: "Formulario",
            about: "Acerca de",
            legal: "Legal",
            privacy: "Política de privacidad",
            terms: "Condiciones de uso",
            contact: "Contacto",
            accessibility: "Ayuda y accesibilidad",
            support: "Soporte",
            faq: "FAQ",
            copyright: `© ${year} LabExplain — Proyecto académico ING2`,
            nodiag: "LabExplain no proporciona ningún diagnóstico médico.",
        },
        ar: {
            tagline: "جهّز أسئلتك. حسّن استشارتك الطبية.",
            nav: "التنقل",
            home: "الرئيسية",
            form: "النموذج",
            about: "حول",
            legal: "قانوني",
            privacy: "سياسة الخصوصية",
            terms: "شروط الاستخدام",
            contact: "اتصل بنا",
            accessibility: "المساعدة وإمكانية الوصول",
            support: "الدعم",
            faq: "الأسئلة الشائعة",
            copyright: `© ${year} LabExplain — مشروع أكاديمي ING2`,
            nodiag: "لا يقدم LabExplain أي تشخيص طبي.",
        },
    };

    const t = labels[lang];

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                {/* Colonne marque */}
                <div className="footer-brand">
                    <span className="footer-brand-name">LabExplain</span>
                    <p className="footer-tagline">{t.tagline}</p>
                </div>

                {/* Navigation */}
                <div className="footer-col">
                    <h4>{t.nav}</h4>
                    <ul>
                        <li><Link to="/">{t.home}</Link></li>
                        <li><Link to="/formulaire">{t.form}</Link></li>
                        <li><Link to="/about">{t.about}</Link></li>
                    </ul>
                </div>

                {/* Légal */}
                <div className="footer-col">
                    <h4>{t.legal}</h4>
                    <ul>
                        <li><Link to="/confidentialite">{t.privacy}</Link></li>
                        <li><Link to="/conditions">{t.terms}</Link></li>
                        <li><Link to="/contact">{t.contact}</Link></li>
                    </ul>
                </div>

                {/* Support */}
                <div className="footer-col">
                    <h4>{t.support}</h4>
                    <ul>
                        <li><Link to="/faq">{t.faq}</Link></li>
                        <li><Link to="/accessibilite">{t.accessibility}</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>{t.copyright}</p>
                <div className="footer-bottom-links">
                    <span>{t.nodiag}</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
