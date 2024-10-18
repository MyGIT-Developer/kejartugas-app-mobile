import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import * as SplashScreen from 'expo-splash-screen';

const SPLASH_DELAY = 3000; // Delay 3 detik
const AUTH_KEYS = ['userData', 'token', 'userJob', 'employeeId', 'companyId', 'expiredToken', 'access_permissions'];

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
                const accessPermissions = await AsyncStorage.getItem('access_permissions');

                console.log('Retrieved token:', token);
                console.log('Retrieved expiredToken:', expiredToken);
                console.log('Retrieved access permissions:', accessPermissions);

                if (token && expiredToken && accessPermissions) {
                    const currentTime = new Date();
                    const expirationTime = new Date(expiredToken);
                    console.log('Current time:', currentTime);
                    console.log('Expiration time:', expirationTime);

                    if (currentTime < expirationTime) {
                        // Token is still valid and access permissions are available
                        navigateTo('App');
                    } else {
                        await clearAuthData();
                        navigateTo('Login');
                    }
                } else {
                    // If any of token, expiredToken, or accessPermissions is missing, go to login
                    await clearAuthData();
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

        // Delay untuk memeriksa autentikasi (3 detik)
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
