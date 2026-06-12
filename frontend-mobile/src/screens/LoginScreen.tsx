// src/screens/LoginScreen.tsx
import { StyleSheet, Text, View } from "react-native";

type Props = { lang: string; onUserChange: (user: any) => void };

export default function LoginScreen(_props: Props) {
    return (
        <View style={styles.container}>
            <Text>À venir</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
});