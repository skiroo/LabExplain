// src/screens/DashboardScreen.tsx
import { StyleSheet, Text, View } from "react-native";

type Props = { lang: string; user: any; onUserChange: (user: any) => void };

export default function DashboardScreen(_props: Props) {
    return (
        <View style={styles.container}>
            <Text>À venir</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
});