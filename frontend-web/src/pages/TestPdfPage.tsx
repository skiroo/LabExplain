// src/pages/TestPdfPage.tsx
// Page de test rapide pour valider la chaîne complète :
// données patient → Ollama (génère le résumé) → PDF téléchargé.
// Accessible à /test-pdf — à retirer avant la mise en production.

import { useState } from "react";

const API_URL = "http://127.0.0.1:5000/api";

// Données patient fictives représentant la simulation qu'on a faite
// (cas utilisé pour la vidéo de démo : douleurs abdominales)
const FAKE_PATIENT_DATA = {
    symptoms:
        "Douleurs abdominales crampiformes, par vagues, en haut à droite du ventre, sous les côtes. " +
        "Apparaissent surtout environ une heure après les repas et s'atténuent en position allongée. " +
        "Intensité estimée entre 6 et 7 sur 10 lors des pics. " +
        "Nausées à plusieurs reprises après les repas, sans vomissements. " +
        "Fatigue plus marquée que d'habitude depuis quelques jours.",
    medicalHistory:
        "Gastrite diagnostiquée il y a environ deux ans, aucun épisode depuis. " +
        "Aucune maladie chronique connue.",
    currentTreatments:
        "Aucun traitement de fond. " +
        "Paracétamol en automédication ponctuelle, non régulière.",
    painLevel: 7,
    additionalNotes: "Aucune allergie connue, ni médicamenteuse ni alimentaire.",
    language: "fr",
};

type Step = "idle" | "generating_summary" | "generating_pdf" | "done" | "error";

function TestPdfPage() {
    const [step, setStep] = useState<Step>("idle");
    const [summaryData, setSummaryData] = useState<Record<string, unknown> | null>(null);
    const [error, setError] = useState("");

    async function handleRun() {
        setStep("generating_summary");
        setError("");
        setSummaryData(null);

        // ── Étape 1 : appel à Ollama via /api/ai/summary ─────────────────
        let summary: Record<string, unknown>;
        try {
            const res = await fetch(`${API_URL}/ai/summary`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(FAKE_PATIENT_DATA),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                throw new Error(json.message || `HTTP ${res.status}`);
            }

            summary = json.data;
            setSummaryData(summary);
        } catch (err) {
            setError(
                "Étape 1 (résumé IA) — " +
                (err instanceof Error ? err.message : "Erreur inconnue")
            );
            setStep("error");
            return;
        }

        // ── Étape 2 : génération du PDF via /api/ai/summary/pdf ──────────
        setStep("generating_pdf");
        try {
            const res = await fetch(`${API_URL}/ai/summary/pdf`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    summary_data: summary,
                    patientName: "Jean Dupont",
                    doctorName: "Dr Salim Abdoul-Carime",
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "test-synthese-labexplain.pdf";
            link.click();
            URL.revokeObjectURL(url);
            setStep("done");
        } catch (err) {
            setError(
                "Étape 2 (génération PDF) — " +
                (err instanceof Error ? err.message : "Erreur inconnue")
            );
            setStep("error");
        }
    }

    const buttonLabel = {
        idle: "Lancer le test complet (IA → PDF)",
        generating_summary: "Étape 1/2 — Ollama génère le résumé...",
        generating_pdf: "Étape 2/2 — Génération du PDF...",
        done: "Relancer le test",
        error: "Réessayer",
    }[step];

    const isLoading = step === "generating_summary" || step === "generating_pdf";

    return (
        <main style={{ maxWidth: 640, margin: "4rem auto", padding: "1rem", fontFamily: "sans-serif" }}>
            <h1 style={{ marginBottom: "0.4rem" }}>Test — Chaîne complète IA → PDF</h1>
            <p style={{ color: "#555", marginBottom: "2rem" }}>
                Envoie des données patient fictives à Ollama (<code>/api/ai/summary</code>),
                puis génère le PDF depuis le résumé retourné (<code>/api/ai/summary/pdf</code>).
                Le backend Flask et Ollama doivent être lancés.
            </p>

            {/* Données envoyées */}
            <div style={{ background: "#f8fafc", border: "1px solid #dde6f2", borderRadius: 12, padding: "1.2rem", marginBottom: "1.5rem" }}>
                <strong>Données patient envoyées à l'IA :</strong>
                <ul style={{ margin: "0.8rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.9, color: "#333", fontSize: "0.92rem" }}>
                    <li><strong>Symptômes :</strong> Douleurs abdominales crampiformes en haut à droite, postprandiales, nausées, fatigue</li>
                    <li><strong>Antécédents :</strong> Gastrite il y a 2 ans, aucune maladie chronique</li>
                    <li><strong>Traitements :</strong> Aucun traitement de fond, paracétamol occasionnel</li>
                    <li><strong>Intensité de la douleur :</strong> 7/10</li>
                    <li><strong>Allergie :</strong> Aucune connue</li>
                    <li><strong>Médecin :</strong> Dr Salim Abdoul-Carime</li>
                </ul>
            </div>

            {/* Bouton */}
            <button
                type="button"
                onClick={handleRun}
                disabled={isLoading}
                style={{
                    background: isLoading ? "#93c5fd" : "#2b6cb0",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px 28px",
                    fontSize: "1rem",
                    cursor: isLoading ? "not-allowed" : "pointer",
                    width: "100%",
                    transition: "background 0.2s",
                }}
            >
                {buttonLabel}
            </button>

            {/* Résumé retourné par l'IA */}
            {summaryData && (
                <div style={{ marginTop: "1.5rem", background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 12, padding: "1.2rem" }}>
                    <strong style={{ color: "#16a34a" }}>Résumé généré par Ollama :</strong>
                    <p style={{ margin: "0.6rem 0 0", fontSize: "0.92rem", lineHeight: 1.7, color: "#333" }}>
                        {String(summaryData.summary)}
                    </p>
                    {Array.isArray(summaryData.questions) && summaryData.questions.length > 0 && (
                        <>
                            <strong style={{ display: "block", marginTop: "0.8rem", color: "#16a34a" }}>Questions suggérées :</strong>
                            <ol style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.92rem", lineHeight: 1.8, color: "#333" }}>
                                {(summaryData.questions as string[]).map((q, i) => (
                                    <li key={i}>{q}</li>
                                ))}
                            </ol>
                        </>
                    )}
                    {Array.isArray(summaryData.redFlags) && summaryData.redFlags.length > 0 && (
                        <>
                            <strong style={{ display: "block", marginTop: "0.8rem", color: "#dc2626" }}>Signaux d'alarme :</strong>
                            <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.92rem", lineHeight: 1.8, color: "#dc2626" }}>
                                {(summaryData.redFlags as string[]).map((f, i) => (
                                    <li key={i}>{f}</li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            )}

            {/* Succès */}
            {step === "done" && (
                <p style={{ marginTop: "1rem", color: "#16a34a", fontWeight: 600 }}>
                    PDF téléchargé avec succès. Les deux étapes ont fonctionné.
                </p>
            )}

            {/* Erreur */}
            {step === "error" && error && (
                <div style={{ marginTop: "1rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "0.8rem", color: "#dc2626" }}>
                    <strong>Erreur :</strong> {error}
                </div>
            )}
        </main>
    );
}

export default TestPdfPage;