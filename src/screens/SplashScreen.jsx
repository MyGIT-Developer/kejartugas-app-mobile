import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import * as SplashScreen from 'expo-splash-screen';

const SPLASH_DELAY = 2000;
const AUTH_KEYS = ['userData', 'token', 'userJob', 'employeeId', 'companyId', 'expiredToken'];

// Prevent the splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function SplashScreenWrapper() {
    const navigation = useNavigation();
    const fontsLoaded = useFonts();
    const [isLoading, setIsLoading] = useState(true);

    const clearAuthData = useCallback(async () => {
        await AsyncStorage.multiRemove(AUTH_KEYS);
    }, []);

    const navigateTo = useCallback(
        (routeName) => {
            navigation.reset({
                index: 0,
                routes: [{ name: routeName }],
            });
        },
        [navigation],
    );

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const expiredToken = await AsyncStorage.getItem('expiredToken');

                console.log('Retrieved token:', token);
                console.log('Retrieved expiredToken:', expiredToken);

                if (token) {
                    if (expiredToken) {
                        const currentTime = new Date();
                        const expirationTime = new Date(expiredToken);

                        console.log('Current time:', currentTime);
                        console.log('Expiration time:', expirationTime);

                        if (currentTime < expirationTime) {
                            navigateTo('App');
                        } else {
                            await clearAuthData();
                            navigateTo('Login');
                        }
                    } else {
                        navigateTo('Login');
                    }
                } else {
                    navigateTo('Login');
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
                await clearAuthData();
                navigateTo('Login');
            } finally {
                setIsLoading(false);
                // Hide the splash screen
                await SplashScreen.hideAsync();
            }
        };

        const timer = setTimeout(checkAuthentication, SPLASH_DELAY);
        return () => clearTimeout(timer);
    }, [clearAuthData, navigateTo]);

    if (!fontsLoaded || isLoading) {
        return null; // Return null to keep showing the native splash screen
    }

    return <View style={styles.container} />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
