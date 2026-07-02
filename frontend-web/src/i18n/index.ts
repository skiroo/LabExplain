import type { Lang } from "./languages";
import fr from "./locales/fr";
import en from "./locales/en";
import es from "./locales/es";
import ar from "./locales/ar";

const dictionaries = {
    fr,
    en,
    es,
    ar,
};

function getNestedValue(obj: unknown, path: string): string | undefined {
    return path.split(".").reduce<unknown>((current, key) => {
        if (typeof current !== "object" || current === null) return undefined;
        return (current as Record<string, unknown>)[key];
    }, obj) as string | undefined;
}

export function t(lang: Lang, key: string): string {
    const value = getNestedValue(dictionaries[lang], key);
    const fallback = getNestedValue(dictionaries.fr, key);

    if (value) return value;
    if (fallback) return fallback;

    if (import.meta.env.DEV) {
        console.warn(`Missing translation: ${key}`);
    }

    return key;
}