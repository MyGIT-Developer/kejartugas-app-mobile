import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

export const useFonts = () => {
    const [fontsLoaded, setFontsLoaded] = useState(false);

    useEffect(() => {
        const loadFonts = async () => {
            try {
                await SplashScreen.preventAutoHideAsync(); // Prevent splash screen from hiding
                await Font.loadAsync({
                    'Poppins-Regular': require('../../assets/fonts/Poppins-Regular.ttf'),
                    'Poppins-Bold': require('../../assets/fonts/Poppins-Bold.ttf'),
                    'Poppins-Italic': require('../../assets/fonts/Poppins-Italic.ttf'),
                    'Poppins-Medium': require('../../assets/fonts/Poppins-Medium.ttf'),
                    'Poppins-SemiBold': require('../../assets/fonts/Poppins-SemiBold.ttf'),
                });
                setFontsLoaded(true);
            } catch (error) {
                console.error('Error loading fonts:', error);
            } finally {
                await SplashScreen.hideAsync(); // Hide splash screen after loading
            }
        };

        loadFonts();
    }, []);

    return fontsLoaded;
};
