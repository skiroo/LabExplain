// frontend-mobile/App.tsx

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useState } from "react";
import type { RootStackParamList } from "./src/types/navigation";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import DashboardScreen from "./src/screens/DashboardScreen";
import FormScreen from "./src/screens/FormScreen";
import ResultScreen from "./src/screens/ResultScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
    // État global partagé entre les screens (équivalent du App.tsx web)
    const [lang, setLang] = useState<string>("fr");
    const [user, setUser] = useState<any>(null);

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName="Home"
                screenOptions={{
                    headerShown: false, // On gère nos propres headers dans chaque screen
                }}
            >
                {/* Screens publics */}
                <Stack.Screen name="Home">
                    {(props) => (
                        <HomeScreen
                            {...props}
                            lang={lang}
                            user={user}
                            onLangChange={setLang}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen name="Login">
                    {(props) => (
                        <LoginScreen
                            {...props}
                            lang={lang}
                            onUserChange={setUser}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen name="Register">
                    {(props) => (
                        <RegisterScreen
                            {...props}
                            lang={lang}
                            onUserChange={setUser}
                        />
                    )}
                </Stack.Screen>

                {/* Screens protégés */}
                <Stack.Screen name="Dashboard">
                    {(props) => (
                        <DashboardScreen
                            {...props}
                            lang={lang}
                            user={user}
                            onUserChange={setUser}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen name="Form">
                    {(props) => (
                        <FormScreen
                            {...props}
                            lang={lang}
                            user={user}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen name="Result">
                    {(props) => (
                        <ResultScreen
                            {...props}
                            lang={lang}
                            user={user}
                        />
                    )}
                </Stack.Screen>

                <Stack.Screen name="Settings">
                    {(props) => (
                        <SettingsScreen
                            {...props}
                            lang={lang}
                            user={user}
                            onLangChange={setLang}
                            onUserChange={setUser}
                        />
                    )}
                </Stack.Screen>
            </Stack.Navigator>
        </NavigationContainer>
    );
}