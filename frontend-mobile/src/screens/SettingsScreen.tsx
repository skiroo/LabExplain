// src/screens/SettingsScreen.tsx
import { StyleSheet, Text, View } from "react-native";

type Props = {
    lang: string;
    user: any;
    onLangChange: (lang: string) => void;
    onUserChange: (user: any) => void;
};

export default function SettingsScreen(_props: Props) {
    return (
        <View style={styles.container}>
            <Text>À venir</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
});