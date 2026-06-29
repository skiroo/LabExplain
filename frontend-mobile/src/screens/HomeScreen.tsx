// src/screens/HomeScreen.tsx

import { useNavigation } from "@react-navigation/native";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Couleurs tirées du App.css web
const C = {
    bg: "#eef4ff",
    primary: "#2b6cb0",
    primaryDark: "#1f4f82",
    text: "#223046",
    muted: "#6b7a90",
    line: "#dde6f2",
    soft: "#eef4fb",
    white: "#ffffff",
    heroBg: "#f7faff",
};

type Props = {
    lang: string;
    user: any;
    onLangChange: (lang: string) => void;
};

export default function HomeScreen(_props: Props) {
    const navigation = useNavigation<any>();

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* ===== HEADER ===== */}
            <View style={styles.header}>
                <View style={styles.headerInner}>
                    <Image
                        source={require("../../assets/logo.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.headerTitle}>LabExplain</Text>
                </View>
                <Text style={styles.headerTagline}>Préparez vos questions. Optimisez votre consultation.</Text>
            </View>

            {/* ===== HERO ===== */}
            <View style={styles.heroSection}>
                <View style={styles.heroBadge}>
                    <Text style={styles.heroBadgeText}>Assistant médical intelligent</Text>
                </View>

                <Text style={styles.heroTitle}>Préparez votre consultation médicale</Text>

                <Text style={styles.heroText}>
                    Structurez vos symptômes, vos traitements et vos antécédents avant le rendez-vous.
                </Text>

                <Text style={styles.heroSubtext}>
                    LabExplain aide le patient à structurer ses informations avant le rendez-vous, sans jamais
                    remplacer un professionnel de santé.
                </Text>

                {/* CTA buttons */}
                <View style={styles.ctaRow}>
                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={() => navigation.navigate("Form")}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnPrimaryText}>Commencer</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={() => navigation.navigate("Login")}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnSecondaryText}>Connexion</Text>
                    </TouchableOpacity>
                </View>

                {/* Trust pills */}
                <View style={styles.trustRow}>
                    {["Données locales", "Multilingue", "Accessibilité cognitive"].map((label) => (
                        <View key={label} style={styles.trustPill}>
                            <Text style={styles.trustPillText}>{label}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ===== MOCK CHATBOT ===== */}
            <View style={styles.mockCard}>
                {/* Dots décoratifs */}
                <View style={styles.mockDots}>
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>

                <View style={styles.mockContent}>
                    <View style={styles.mockBot}>
                        <Text style={styles.mockBotText}>Bonjour ! Quel est le nom de votre médecin ?</Text>
                    </View>
                    <View style={styles.mockUser}>
                        <Text style={styles.mockUserText}>Dr Martin</Text>
                    </View>
                    <View style={styles.mockBot}>
                        <Text style={styles.mockBotText}>Comment évaluez-vous l'urgence de votre consultation ?</Text>
                    </View>
                    <View style={styles.mockOptionsRow}>
                        {["Urgent", "Modéré", "Routine"].map((opt) => (
                            <View key={opt} style={styles.mockOption}>
                                <Text style={styles.mockOptionText}>{opt}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            {/* ===== AVERTISSEMENT MÉDICAL ===== */}
            <View style={styles.warningCard}>
                <Text style={styles.warningTitle}>Cadre médical</Text>
                <Text style={styles.warningText}>
                    LabExplain ne pose aucun diagnostic et ne remplace pas un professionnel de santé. Il aide
                    uniquement à mieux préparer la consultation.
                </Text>
            </View>

            {/* ===== STATS ===== */}
            <View style={styles.statsRow}>
                {[
                    { value: "4", label: "langues disponibles" },
                    { value: "3", label: "modes de lecture" },
                    { value: "1", label: "objectif : mieux communiquer" },
                ].map((stat) => (
                    <View key={stat.label} style={styles.statBox}>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                    </View>
                ))}
            </View>

            {/* ===== SECTION POURQUOI ===== */}
            <View style={styles.sectionBlock}>
                <Text style={styles.sectionKicker}>Pourquoi LabExplain ?</Text>
                <Text style={styles.sectionTitle}>
                    Une expérience pensée pour les patients qui ont du mal à exprimer l'essentiel
                </Text>
                <Text style={styles.sectionText}>
                    Le stress, la langue, la douleur ou certains troubles cognitifs peuvent rendre une
                    consultation plus difficile. LabExplain prépare l'échange avant le rendez-vous.
                </Text>

                <View style={styles.featureGrid}>
                    {[
                        {
                            title: "Le problème",
                            text: "De nombreux patients sortent d'une consultation sans avoir dit l'essentiel.",
                        },
                        {
                            title: "La solution",
                            text: "Un assistant qui structure vos informations médicales en quelques minutes.",
                        },
                        {
                            title: "Notre approche",
                            text: "Une interface simple, inclusive et multilingue pour tous les profils.",
                        },
                    ].map((card) => (
                        <View key={card.title} style={styles.featureCard}>
                            <Text style={styles.featureCardTitle}>{card.title}</Text>
                            <Text style={styles.featureCardText}>{card.text}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* ===== CTA FINAL ===== */}
            <View style={styles.finalCta}>
                <Text style={styles.sectionKicker}>Prêt à commencer ?</Text>
                <Text style={styles.finalCtaTitle}>Préparez votre consultation autrement</Text>
                <Text style={styles.sectionText}>
                    Une interface simple, moderne et inclusive pour mieux communiquer avec votre professionnel
                    de santé.
                </Text>
                <TouchableOpacity
                    style={[styles.btnPrimary, { marginTop: 18 }]}
                    onPress={() => navigation.navigate("Form")}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>Commencer maintenant</Text>
                </TouchableOpacity>
            </View>

            {/* ===== FOOTER ===== */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>LabExplain - Projet académique EFREI 2026</Text>
                <Text style={styles.footerMuted}>Ne constitue pas un avis médical</Text>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: C.bg,
    },
    content: {
        paddingBottom: 40,
    },

    // Header
    header: {
        backgroundColor: C.primary,
        paddingTop: 56,
        paddingBottom: 28,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    headerInner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 6,
    },
    logo: {
        width: 36,
        height: 36,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: C.white,
    },
    headerTagline: {
        fontSize: 13,
        color: "rgba(255,255,255,0.75)",
        textAlign: "center",
    },

    // Hero
    heroSection: {
        backgroundColor: C.heroBg,
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    heroBadge: {
        alignSelf: "flex-start",
        backgroundColor: C.primary,
        borderRadius: 999,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 16,
    },
    heroBadgeText: {
        color: C.white,
        fontWeight: "700",
        fontSize: 13,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: "800",
        color: "#10213a",
        lineHeight: 36,
        marginBottom: 12,
    },
    heroText: {
        fontSize: 16,
        color: "#334155",
        marginBottom: 8,
        lineHeight: 24,
    },
    heroSubtext: {
        fontSize: 14,
        color: "#4b5563",
        lineHeight: 22,
        marginBottom: 4,
    },
    ctaRow: {
        flexDirection: "row",
        gap: 12,
        marginTop: 24,
        marginBottom: 20,
        flexWrap: "wrap",
    },
    btnPrimary: {
        backgroundColor: C.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    btnPrimaryText: {
        color: C.white,
        fontWeight: "700",
        fontSize: 15,
    },
    btnSecondary: {
        backgroundColor: C.soft,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: "center",
    },
    btnSecondaryText: {
        color: C.primaryDark,
        fontWeight: "700",
        fontSize: 15,
    },
    trustRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 4,
    },
    trustPill: {
        backgroundColor: C.white,
        borderWidth: 1,
        borderColor: "#dbe7ff",
        borderRadius: 999,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    trustPillText: {
        fontSize: 12,
        fontWeight: "600",
        color: "#28405f",
    },

    // Mock chatbot card
    mockCard: {
        backgroundColor: C.white,
        marginHorizontal: 24,
        marginTop: 28,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: "#e5edff",
        shadowColor: "#1a365d",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 4,
    },
    mockDots: {
        flexDirection: "row",
        gap: 7,
        marginBottom: 16,
    },
    dot: {
        width: 11,
        height: 11,
        borderRadius: 999,
        backgroundColor: "#d6e4ff",
    },
    mockContent: {
        gap: 12,
    },
    mockBot: {
        backgroundColor: "#edf4ff",
        borderRadius: 14,
        padding: 12,
        alignSelf: "flex-start",
        maxWidth: "85%",
    },
    mockBotText: {
        color: "#1f4f82",
        fontSize: 13,
        lineHeight: 20,
    },
    mockUser: {
        backgroundColor: C.primary,
        borderRadius: 14,
        padding: 12,
        alignSelf: "flex-end",
        maxWidth: "60%",
    },
    mockUserText: {
        color: C.white,
        fontSize: 13,
    },
    mockOptionsRow: {
        flexDirection: "row",
        gap: 8,
        flexWrap: "wrap",
        marginTop: 4,
    },
    mockOption: {
        backgroundColor: C.soft,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#dbe7ff",
    },
    mockOptionText: {
        fontSize: 12,
        color: C.primaryDark,
        fontWeight: "600",
    },

    // Warning
    warningCard: {
        backgroundColor: "#fff7e8",
        borderWidth: 1,
        borderColor: "#f0ddae",
        borderRadius: 16,
        marginHorizontal: 24,
        marginTop: 24,
        padding: 18,
    },
    warningTitle: {
        fontWeight: "700",
        fontSize: 14,
        color: "#6a4d14",
        marginBottom: 6,
    },
    warningText: {
        fontSize: 13,
        color: "#6b5527",
        lineHeight: 20,
    },

    // Stats
    statsRow: {
        flexDirection: "row",
        marginHorizontal: 24,
        marginTop: 24,
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: C.white,
        borderRadius: 16,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: C.line,
    },
    statValue: {
        fontSize: 26,
        fontWeight: "800",
        color: C.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 11,
        color: C.muted,
        textAlign: "center",
        lineHeight: 15,
    },

    // Section pourquoi
    sectionBlock: {
        marginHorizontal: 24,
        marginTop: 36,
    },
    sectionKicker: {
        fontSize: 12,
        fontWeight: "700",
        color: C.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#10213a",
        lineHeight: 28,
        marginBottom: 10,
    },
    sectionText: {
        fontSize: 14,
        color: C.muted,
        lineHeight: 22,
        marginBottom: 20,
    },
    featureGrid: {
        gap: 14,
    },
    featureCard: {
        backgroundColor: C.white,
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: C.line,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    featureCardTitle: {
        fontWeight: "700",
        fontSize: 15,
        color: "#173154",
        marginBottom: 8,
    },
    featureCardText: {
        fontSize: 13,
        color: "#556274",
        lineHeight: 20,
    },

    // CTA final
    finalCta: {
        backgroundColor: C.white,
        marginHorizontal: 24,
        marginTop: 36,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: C.line,
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 3,
    },
    finalCtaTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: "#10213a",
        marginBottom: 10,
        lineHeight: 28,
    },

    // Footer
    footer: {
        marginTop: 40,
        paddingHorizontal: 24,
        paddingBottom: 20,
        alignItems: "center",
    },
    footerText: {
        fontSize: 13,
        color: C.muted,
        marginBottom: 4,
    },
    footerMuted: {
        fontSize: 11,
        color: "#aab4c4",
    },
});