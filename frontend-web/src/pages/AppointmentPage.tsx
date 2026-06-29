// src/pages/AppointmentPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import DoctorMapPicker from "../components/DoctorMapPicker";
import { createRendezVous } from "../services/rendezvousApi";
import type { Cabinet } from "../types/chat";
import type { FontMode, Lang } from "../types/lang";
import type { User } from "../types/user";

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
      setErrorMsg("Veuillez sélectionner un médecin sur la carte.");
      return;
    }
    if (!dateHeure) {
      setErrorMsg("Veuillez indiquer la date et l'heure du rendez-vous.");
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
      setErrorMsg("La création du rendez-vous a échoué. Veuillez réessayer.");
      return;
    }

    navigate("/dashboard");
  }

  return (
    <>
      <Header simple lang={lang} font={font} user={user}
        onLangChange={onLangChange} onFontChange={onFontChange} onUserChange={onUserChange} />
      <main className="appointment-layout">
        <section className="appointment-card">
          <h1>Déclarer un rendez-vous</h1>
          <p>
            Indiquez votre prochain rendez-vous médical : choisissez le médecin sur la carte,
            puis renseignez la date et l'heure. Cette information reste privée et n'est jamais
            transmise au médecin sans votre action explicite.
          </p>

          <DoctorMapPicker onSelectCabinet={handleSelectCabinet} />

          {selectedCabinet && (
            <div className="summary-box appointment-selected-doctor">
              <p>
                Médecin sélectionné : <strong>{selectedCabinet.civilite || "Dr"} {selectedCabinet.prenom} {selectedCabinet.nom}</strong>
                {selectedCabinet.specialite ? ` - ${selectedCabinet.specialite}` : ""}
              </p>
            </div>
          )}

          <div className="appointment-form">
            <label htmlFor="date_heure">Date et heure du rendez-vous</label>
            <input
              id="date_heure"
              type="datetime-local"
              value={dateHeure}
              onChange={(event) => setDateHeure(event.target.value)}
            />

            <label htmlFor="lieu">Lieu (modifiable)</label>
            <input
              id="lieu"
              type="text"
              value={lieuOverride}
              onChange={(event) => setLieuOverride(event.target.value)}
              placeholder="Adresse du cabinet"
            />

            {errorMsg && <p className="error-inline">{errorMsg}</p>}

            <button className="button" onClick={handleSubmit} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer le rendez-vous"}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}

export default AppointmentPage;
