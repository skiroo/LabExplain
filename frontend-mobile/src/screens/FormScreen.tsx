// src/screens/FormScreen.tsx
import { StyleSheet, Text, View } from "react-native";

type Props = { lang: string; user: any };

export default function FormScreen(_props: Props) {
    return (
        <View style={styles.container}>
            <Text>À venir</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
});