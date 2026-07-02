// src/components/BionicReading.tsx
// Met en gras le début de chaque mot ("bionic reading") pour aider au
// suivi de lecture en mode TDAH. Parcourt récursivement les enfants React
// passés au composant et ne transforme que le texte brut, sans toucher
// aux éléments de formulaire (input/textarea/select/option) où
// l'injection de balises casserait le rendu ou la saisie.

import React from "react";

const SKIP_TAGS = new Set(["input", "textarea", "select", "option", "script", "style"]);

function bionicWord(word: string, key: number): React.ReactNode {
    // Ne pas traiter une chaîne sans lettres (ponctuation, chiffres isolés...)
    if (!/[a-zA-ZÀ-ÿ]/.test(word)) return word;

    const boldLength = Math.max(1, Math.ceil(word.length * 0.45));

    return (
        <React.Fragment key={key}>
            <span className="bionic-bold">{word.slice(0, boldLength)}</span>
            {word.slice(boldLength)}
        </React.Fragment>
    );
}

function bionicText(text: string): React.ReactNode {
    // On garde les espaces dans le split pour ne pas casser la mise en page
    const chunks = text.split(/(\s+)/);
    return chunks.map((chunk, index) => (chunk.trim() ? bionicWord(chunk, index) : chunk));
}

function bionify(node: React.ReactNode): React.ReactNode {
    if (typeof node === "string") {
        return bionicText(node);
    }

    if (Array.isArray(node)) {
        return node.map((child, index) => (
            <React.Fragment key={index}>{bionify(child)}</React.Fragment>
        ));
    }

    if (React.isValidElement(node)) {
        if (typeof node.type === "string" && SKIP_TAGS.has(node.type)) {
            return node;
        }
        const children = (node.props as { children?: React.ReactNode }).children;
        if (children === undefined) return node;
        return React.cloneElement(node, undefined, bionify(children));
    }

    return node;
}

type BionicReadingProps = {
    active: boolean;
    children: React.ReactNode;
};

function BionicReading({ active, children }: BionicReadingProps) {
    if (!active) return <>{children}</>;
    return <>{bionify(children)}</>;
}

export default BionicReading;
