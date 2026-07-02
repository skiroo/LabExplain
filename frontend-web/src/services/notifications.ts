/*
Fichier : notifications.ts
Dossier : src/services/
Description :
  Système de notifications internes au site, à la place des alert() du navigateur.
  Fonctionnement en pub/sub : n'importe quelle page appelle notify() pour afficher
  une notification, et le ToastContainer (monté une seule fois dans App.tsx)
  s'abonne pour afficher la liste des notifications actives.
*/

export type ToastType = "success" | "error" | "info";

export type Toast = {
    id: number;
    type: ToastType;
    message: string;
};

type Listener = (toasts: Toast[]) => void;

let toasts: Toast[] = [];
let listeners: Listener[] = [];
let nextId = 1;

function emit() {
    listeners.forEach((listener) => listener(toasts));
}

// Utilisé par ToastContainer pour s'abonner aux changements
export function subscribe(listener: Listener): () => void {
    listeners.push(listener);
    listener(toasts);
    return () => {
        listeners = listeners.filter((l) => l !== listener);
    };
}

// Affiche une notification pendant `duration` millisecondes (4s par défaut)
export function notify(message: string, type: ToastType = "info", duration = 4000): void {
    const id = nextId++;
    toasts = [...toasts, { id, type, message }];
    emit();
    setTimeout(() => dismiss(id), duration);
}

export function dismiss(id: number): void {
    toasts = toasts.filter((toast) => toast.id !== id);
    emit();
}

const PENDING_KEY = "labexplain_pending_toast";

// À utiliser juste avant un window.location.href / reload complet de la page,
// pour que la notification s'affiche quand même une fois la page rechargée.
export function notifyAfterReload(message: string, type: ToastType = "info"): void {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ message, type }));
}

// Affiche la notification laissée en attente par notifyAfterReload(), s'il y en a une.
// Appelé une seule fois au montage de ToastContainer.
export function flushPendingToast(): void {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_KEY);
    try {
        const { message, type } = JSON.parse(raw);
        notify(message, type);
    } catch {
        // Contenu invalide, on ignore simplement
    }
}
