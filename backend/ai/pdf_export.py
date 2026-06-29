"""
Fichier : pdf_export.py
Dossier : backend/ai/
Description :
    Génère le document PDF de synthèse de consultation destiné au médecin,
    à partir du résultat structuré produit par summary_handler.generate_summary().

    Le PDF reste volontairement simple et léger (cohérent avec la démarche
    Green IT du projet) : une page de garde avec l'avertissement médical,
    le résumé, les questions suggérées, et les éventuels signaux d'alarme.

    Fonction exposée :
      - build_summary_pdf(summary_data, patient_name, doctor_name) → bytes
"""

import io
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, ListFlowable, ListItem, HRFlowable
)


def _build_styles():
    """Construit les styles de paragraphe utilisés dans le document."""
    base = getSampleStyleSheet()

    title = ParagraphStyle(
        "LabExplainTitle", parent=base["Title"],
        fontSize=18, spaceAfter=4, textColor=colors.HexColor("#1d3557"),
    )
    subtitle = ParagraphStyle(
        "LabExplainSubtitle", parent=base["Normal"],
        fontSize=10, textColor=colors.HexColor("#555555"), spaceAfter=14,
    )
    section = ParagraphStyle(
        "LabExplainSection", parent=base["Heading2"],
        fontSize=13, spaceBefore=14, spaceAfter=6,
        textColor=colors.HexColor("#1d3557"),
    )
    body = ParagraphStyle(
        "LabExplainBody", parent=base["Normal"],
        fontSize=11, leading=16,
    )
    warning = ParagraphStyle(
        "LabExplainWarning", parent=base["Normal"],
        fontSize=9.5, leading=13, textColor=colors.HexColor("#7a4a00"),
        backColor=colors.HexColor("#fff3cd"), borderPadding=8,
    )
    redflag = ParagraphStyle(
        "LabExplainRedflag", parent=base["Normal"],
        fontSize=10.5, leading=14, textColor=colors.HexColor("#9b1c1c"),
    )

    return {
        "title": title, "subtitle": subtitle, "section": section,
        "body": body, "warning": warning, "redflag": redflag,
    }


def build_summary_pdf(summary_data: dict, patient_name: str = "", doctor_name: str = "") -> bytes:
    """
    Construit le PDF de synthèse de consultation.

    Args:
        summary_data : Résultat de generate_summary() — clés attendues :
                       summary, questions, warning, redFlags, urgencyLevel.
        patient_name : Nom du patient à afficher (optionnel).
        doctor_name  : Nom du médecin destinataire à afficher (optionnel).

    Returns:
        Contenu binaire du PDF (bytes), prêt à être renvoyé en téléchargement.
    """
    styles = _build_styles()
    buffer = io.BytesIO()

    doc = SimpleDocTemplate(
        buffer, pagesize=A4,
        topMargin=2 * cm, bottomMargin=2 * cm,
        leftMargin=2 * cm, rightMargin=2 * cm,
    )

    story = []

    # ── En-tête ──────────────────────────────────────────────────────────
    story.append(Paragraph("LabExplain — Synthèse de consultation", styles["title"]))

    meta_parts = [f"Document généré le {datetime.now().strftime('%d/%m/%Y à %H:%M')}"]
    if patient_name:
        meta_parts.append(f"Patient : {patient_name}")
    if doctor_name:
        meta_parts.append(f"Destinataire : {doctor_name}")
    story.append(Paragraph(" — ".join(meta_parts), styles["subtitle"]))

    story.append(HRFlowable(width="100%", color=colors.HexColor("#dddddd"), thickness=1))

    # ── Avertissement médical ───────────────────────────────────────────
    warning_text = summary_data.get("warning") or (
        "Ce résumé est une aide à la préparation de consultation. "
        "Il ne constitue pas un diagnostic médical et ne remplace pas "
        "l'avis d'un professionnel de santé."
    )
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"Attention — {warning_text}", styles["warning"]))

    # ── Signaux d'alarme éventuels ───────────────────────────────────────
    red_flags = summary_data.get("redFlags") or []
    if red_flags:
        story.append(Paragraph("Signaux d'attention relevés", styles["section"]))
        items = [ListItem(Paragraph(flag, styles["redflag"])) for flag in red_flags]
        story.append(ListFlowable(items, bulletType="bullet"))

    # ── Résumé médical ───────────────────────────────────────────────────
    story.append(Paragraph("Résumé médical", styles["section"]))
    story.append(Paragraph(summary_data.get("summary", "").strip() or "Non renseigné.", styles["body"]))

    # ── Questions suggérées ──────────────────────────────────────────────
    questions = summary_data.get("questions") or []
    if questions:
        story.append(Paragraph("Questions à poser au médecin", styles["section"]))
        items = [ListItem(Paragraph(q, styles["body"])) for q in questions]
        story.append(ListFlowable(items, bulletType="1"))

    doc.build(story)
    return buffer.getvalue()
