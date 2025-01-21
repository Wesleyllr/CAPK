import { useRouter, usePathname } from "expo-router"; // Import usePathname to get the current pathname
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "@/global.css";
import "react-native-reanimated";
import FlashMessage from "react-native-flash-message";
import { View, Platform } from "react-native";
import WebNavBar from "@/components/WebNavBar";
import { useColorScheme } from "@/hooks/useColorScheme";
import { alertaPersonalizado } from "@/utils/alertaPersonalizado"; // Importing the custom alert function

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isNavBarExpanded, setIsNavBarExpanded] = useState(true);
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const isWeb = Platform.OS === "web";
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  // Define the screens that should not show the WebNavBar
  const excludedScreens = [
    "/app/auth",
    "/app/auth/_layout",
    "/app/auth/cadastrarUsuario",
    "/app/auth/login",
    "/app/index", // Don't show on index
    "/app/tabs",
    "/auth",
    "/auth/_layout",
    "/cadastrarUsuario",
    "/login",
    "/index", // Don't show on index
    "/tabs", // Don't show on tabs layout screen
  ];

  // Check if the current pathname is in the excluded list
  const shouldRenderNavBar = !excludedScreens.some((excludedPath) =>
    pathname.startsWith(excludedPath)
  );

  const isTabScreen =
    pathname === "/login" ||
    pathname === "/index" ||
    pathname === "/cadastrarUsuario";

  return (
    <ThemeProvider value={colorScheme === "light" ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {isWeb && shouldRenderNavBar && (
          <WebNavBar
            isExpanded={isNavBarExpanded}
            onToggle={(expanded) => setIsNavBarExpanded(expanded)}
          />
        )}
        <View
          className="flex-1 transition-all duration-300"
          style={{
            marginLeft:
              isWeb && isTabScreen
                ? 0
                : isWeb
                ? isNavBarExpanded
                  ? 240
                  : 80
                : 0,
          }}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: { backgroundColor: "white" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen
              name="screens"
              options={{
                headerShown: false,
                presentation: "modal",
              }}
            />
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </View>
      </View>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
      <FlashMessage position={Platform.OS === 'web' ? 'top' : 'bottom'} />
    </ThemeProvider>
  );
}
