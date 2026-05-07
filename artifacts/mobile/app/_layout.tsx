import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";
import { setBaseUrl } from "@workspace/api-client-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { BodyProfileProvider } from "@/context/BodyProfileContext";
import { PortraitHistoryProvider } from "@/context/PortraitHistoryContext";
import { CountryProvider } from "@/context/CountryContext";
import { SeasonProvider } from "@/context/SeasonContext";
import { StylePrefsProvider } from "@/context/StylePrefsContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { UnitsProvider } from "@/context/UnitsContext";
import { TodayOutfitProvider } from "@/context/TodayOutfitContext";
import { WardrobeProvider } from "@/context/WardrobeContext";
import { WishlistProductProvider } from "@/context/WishlistProductContext";

const domain = process.env["EXPO_PUBLIC_DOMAIN"];
if (domain) {
  setBaseUrl(`https://${domain}`);
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="upload"
        options={{ presentation: "modal", headerShown: false }}
      />
      <Stack.Screen
        name="analyzing"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="profile"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="chat"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="add-item"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="article"
        options={{ headerShown: false, presentation: "modal" }}
      />
      <Stack.Screen
        name="skin-analysis"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="hairstyle-analysis"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    ...Ionicons.font,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <ThemeProvider>
                <SeasonProvider>
                <CountryProvider>
                <UnitsProvider>
                <AnalysisProvider>
                  <PortraitHistoryProvider>
                    <BodyProfileProvider>
                      <StylePrefsProvider>
                        <WardrobeProvider>
                          <TodayOutfitProvider>
                            <WishlistProductProvider>
                              <RootLayoutNav />
                            </WishlistProductProvider>
                          </TodayOutfitProvider>
                        </WardrobeProvider>
                      </StylePrefsProvider>
                    </BodyProfileProvider>
                  </PortraitHistoryProvider>
                </AnalysisProvider>
                </UnitsProvider>
                </CountryProvider>
                </SeasonProvider>
              </ThemeProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
