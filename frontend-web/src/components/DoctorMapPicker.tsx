import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { searchCabinetsNear } from "../services/rendezvousApi";
import { t } from "../i18n";
import type { Cabinet } from "../types/chat";
import type { Lang } from "../types/lang";

// Icône par défaut de Leaflet - sans ce correctif, les marqueurs n'affichent
// pas leur image car le bundler (Vite) ne résout pas les chemins relatifs
// utilisés en interne par la librairie.
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Centre par défaut : Paris. Affiché tant que l'utilisateur n'a pas
// recherché ou déplacé la carte vers sa propre zone.
const DEFAULT_CENTER: [number, number] = [48.8566, 2.3522];

type DoctorMapPickerProps = {
  lang: Lang;
  onSelectCabinet: (cabinet: Cabinet) => void;
};

// Recharge les cabinets visibles chaque fois que la carte est déplacée,
// pour ne jamais charger l'ensemble des ~130 000 cabinets en une fois
// (cohérent avec la démarche Green IT du projet).
function MapEventsWatcher({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    function handleMoveEnd() {
      const center = map.getCenter();
      onMove(center.lat, center.lng);
    }
    map.on("moveend", handleMoveEnd);
    return () => {
      map.off("moveend", handleMoveEnd);
    };
  }, [map, onMove]);

  return null;
}

function DoctorMapPicker({ lang, onSelectCabinet }: DoctorMapPickerProps) {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const currentCenterRef = useRef<[number, number]>(DEFAULT_CENTER);

  async function loadCabinets(lat: number, lng: number, query: string) {
    setLoading(true);
    const results = await searchCabinetsNear(lat, lng, query);
    setCabinets(results);
    setLoading(false);
  }

  useEffect(() => {
    loadCabinets(DEFAULT_CENTER[0], DEFAULT_CENTER[1], "");
  }, []);

  function handleMapMove(lat: number, lng: number) {
    currentCenterRef.current = [lat, lng];
    loadCabinets(lat, lng, searchValue);
  }

  function handleSearchSubmit() {
    const [lat, lng] = currentCenterRef.current;
    loadCabinets(lat, lng, searchValue);
  }

  return (
    <div className="doctor-map-picker">
      <div className="doctor-map-search">
        <input
          type="text"
          placeholder={t(lang, "doctorMap.searchPlaceholder")}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearchSubmit();
          }}
        />
        <button type="button" onClick={handleSearchSubmit} disabled={loading}>
          {t(lang, "doctorMap.searchButton")}
        </button>
      </div>

      <p className="doctor-map-hint">
        {t(lang, "doctorMap.hintStart")} {cabinets.length} {t(lang, "doctorMap.displayedCabinets")}
      </p>

      <div className="doctor-map-container">
        <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEventsWatcher onMove={handleMapMove} />

          {cabinets.map((cabinet) => (
            <Marker
              key={cabinet.id_cabinet}
              position={[cabinet.latitude, cabinet.longitude]}
              icon={defaultIcon}
            >
              <Popup>
                <strong>
                  {cabinet.civilite || t(lang, "doctorMap.defaultDoctorTitle")} {cabinet.prenom} {cabinet.nom}
                </strong>
                {cabinet.specialite && <p>{cabinet.specialite}</p>}
                {cabinet.adresse && (
                  <p>
                    {cabinet.adresse}, {cabinet.code_postal} {cabinet.ville}
                  </p>
                )}
                <button type="button" onClick={() => onSelectCabinet(cabinet)}>
                  {t(lang, "doctorMap.chooseDoctor")}
                </button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default DoctorMapPicker;
