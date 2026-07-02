import { Link } from "react-router-dom";
import type { Lang } from "../types/lang";
import { t } from "../i18n";

type FooterProps = {
    lang: Lang;
};

function Footer({ lang }: FooterProps) {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer-inner">
                {/* Colonne marque */}
                <div className="footer-brand">
                    <span className="footer-brand-name">LabExplain</span>
                    <p className="footer-tagline">{t(lang, "footer.tagline")}</p>
                </div>

                {/* Navigation */}
                <div className="footer-col">
                    <h4>{t(lang, "footer.navigation")}</h4>
                    <ul>
                        <li><Link to="/">{t(lang, "nav.home")}</Link></li>
                        <li><Link to="/formulaire">{t(lang, "nav.form")}</Link></li>
                        <li><Link to="/about">{t(lang, "nav.about")}</Link></li>
                    </ul>
                </div>

                {/* Légal */}
                <div className="footer-col">
                    <h4>{t(lang, "footer.legal")}</h4>
                    <ul>
                        <li><Link to="/confidentialite">{t(lang, "footer.privacy")}</Link></li>
                        <li><Link to="/conditions">{t(lang, "footer.terms")}</Link></li>
                        <li><Link to="/contact">{t(lang, "footer.contact")}</Link></li>
                    </ul>
                </div>

                {/* Support */}
                <div className="footer-col">
                    <h4>{t(lang, "footer.support")}</h4>
                    <ul>
                        <li><Link to="/faq">{t(lang, "footer.faq")}</Link></li>
                        <li><Link to="/accessibilite">{t(lang, "footer.accessibility")}</Link></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                <p>© {year} {t(lang, "footer.copyright")}</p>
                <div className="footer-bottom-links">
                    <span>{t(lang, "footer.noDiagnosis")}</span>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
