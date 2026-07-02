/*
Fichier : ToastContainer.tsx
Dossier : src/components/
Description :
  Affiche les notifications internes au site (voir services/notifications.ts).
  À monter une seule fois, au niveau de App.tsx, en dehors des routes.
  Un clic sur une notification la ferme immédiatement.
*/

import { useEffect, useState } from "react";
import { subscribe, dismiss, flushPendingToast } from "../services/notifications";
import type { Toast } from "../services/notifications";

function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [topOffset, setTopOffset] = useState(16);

    useEffect(() => {
        flushPendingToast();
        return subscribe(setToasts);
    }, []);

    useEffect(() => {
        // Calcule la position juste en dessous du header, quelle que soit sa hauteur
        function updateOffset() {
            const header = document.querySelector(".site-header");
            const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
            setTopOffset(Math.max(headerBottom, 0) + 16);
        }
        updateOffset();
        window.addEventListener("resize", updateOffset);
        return () => window.removeEventListener("resize", updateOffset);
    }, [toasts]);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" style={{ top: topOffset }}>
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => dismiss(toast.id)}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
}

export default ToastContainer;
