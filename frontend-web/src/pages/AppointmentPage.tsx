// src/pages/AppointmentPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import DoctorMapPicker from "../components/DoctorMapPicker";
import { t } from "../i18n";
import { createRendezVous } from "../services/rendezvousApi";
import type { Cabinet } from "../types/chat";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";
import BionicReading from "../components/BionicReading";

type Props = {
  lang: Lang; font: FontMode; user: User | null;
  onLangChange: (l: Lang) => void;
  onFontChange: (f: FontMode) => void;
  onUserChange: () => void;
};

function AppointmentPage({ lang, font, user, onLangChange, onFontChange, onUserChange }: Props) {
  const navigate = useNavigate();

  const [selectedCabinet, setSelectedCabinet] = useState<Cabinet | null>(null);
  const [dateHeure, setDateHeure] = useState("");
  const [lieuOverride, setLieuOverride] = useState("");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  function buildLieu(cabinet: Cabinet): string {
    const parts = [cabinet.adresse, cabinet.code_postal, cabinet.ville].filter(Boolean);
    return parts.join(", ");
  }

  function handleSelectCabinet(cabinet: Cabinet) {
    setSelectedCabinet(cabinet);
    setLieuOverride(buildLieu(cabinet));
    setErrorMsg("");
  }

  async function handleSubmit() {
    if (!selectedCabinet) {
      setErrorMsg(t(lang, "appointment.selectDoctorError"));
      return;
    }
    if (!dateHeure) {
      setErrorMsg(t(lang, "appointment.dateTimeError"));
      return;
    }

    setSaving(true);
    setErrorMsg("");

    const result = await createRendezVous({
      date_heure: dateHeure,
      medecin_nom: selectedCabinet.nom,
      medecin_prenom: selectedCabinet.prenom,
      medecin_specialite: selectedCabinet.specialite || undefined,
      lieu: lieuOverride || undefined,
      rpps_medecin: selectedCabinet.rpps,
      id_cabinet: selectedCabinet.id_cabinet,
    });

    setSaving(false);

    if (!result) {
      setErrorMsg(t(lang, "appointment.creationError"));
      return;
    }

    navigate("/dashboard");
  }

  return (
    <BionicReading active={font === "tdah"}>
      <Header simple lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="appointment-layout">
        <section className="appointment-card">
          <h1>{t(lang, "appointment.title")}</h1>
          <p>{t(lang, "appointment.description")}</p>

          <DoctorMapPicker lang={lang} onSelectCabinet={handleSelectCabinet} />

          {selectedCabinet && (
            <div className="summary-box appointment-selected-doctor">
              <p>
                {t(lang, "appointment.selectedDoctor")}{" "}
                <strong>{selectedCabinet.civilite || t(lang, "doctorMap.defaultDoctorTitle")} {selectedCabinet.prenom} {selectedCabinet.nom}</strong>
                {selectedCabinet.specialite ? ` - ${selectedCabinet.specialite}` : ""}
              </p>
            </div>
          )}

          <div className="appointment-form">
            <label htmlFor="date_heure">{t(lang, "appointment.dateTimeLabel")}</label>
            <input
              id="date_heure"
              type="datetime-local"
              value={dateHeure}
              onChange={(event) => setDateHeure(event.target.value)}
            />

            <label htmlFor="lieu">{t(lang, "appointment.locationLabel")}</label>
            <input
              id="lieu"
              type="text"
              value={lieuOverride}
              onChange={(event) => setLieuOverride(event.target.value)}
              placeholder={t(lang, "appointment.locationPlaceholder")}
            />

            {errorMsg && <p className="error-inline">{errorMsg}</p>}

            <button className="button" onClick={handleSubmit} disabled={saving}>
              {saving ? t(lang, "appointment.savingAppointment") : t(lang, "appointment.saveAppointment")}
            </button>
          </div>
        </section>
      </main>
    </BionicReading>
  );
}

export default AppointmentPage;
