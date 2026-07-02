export type Lang = "fr" | "en" | "es" | "ar";

export type LanguageConfig = {
    code: Lang;
    label: string;
    dir: "ltr" | "rtl";
};

export const languages: Record<Lang, LanguageConfig> = {
    fr: {
        code: "fr",
        label: "FR",
        dir: "ltr",
    },
    en: {
        code: "en",
        label: "EN",
        dir: "ltr",
    },
    es: {
        code: "es",
        label: "ES",
        dir: "ltr",
    },
    ar: {
        code: "ar",
        label: "AR",
        dir: "rtl",
    },
};