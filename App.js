import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { Provider as PaperProvider } from 'react-native-paper';
import RootNavigator from './src/components/RootNavigator';
import { useFonts } from './src/utils/UseFonts';
import { styledTheme, paperTheme } from './src/constants/themes';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotifications } from './src/api/notification';

// Create navigation ref for notifications
export const navigationRef = React.createRef();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function App() {
    const fontsLoaded = useFonts();

    useEffect(() => {
        const setupApp = async () => {
            try {
                if (fontsLoaded) {
                    // Check if user is logged in and setup notifications
                    const token = await AsyncStorage.getItem('token');
                    if (token) {
                        await setupNotifications();
                    }

                    // Hide splash screen after 3 seconds
                    setTimeout(async () => {
                        await SplashScreen.hideAsync();
                    }, 3000);
                }
            } catch (error) {
                console.error('Error setting up app:', error);
                await SplashScreen.hideAsync();
            }
        };

        setupApp();
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <PaperProvider theme={paperTheme}>
            <ThemeProvider theme={styledTheme}>
                <NavigationContainer ref={navigationRef}>
                    <RootNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </PaperProvider>
    );
}
