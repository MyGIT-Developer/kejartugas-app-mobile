import 'react-native-reanimated';
import React, { useEffect, useState, createContext } from 'react';
import * as Location from 'expo-location';
// Context untuk lokasi
export const LocationContext = createContext({ location: null, errorMsg: null, locationName: null });
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Text, StyleSheet } from 'react-native';
import RootNavigator from './src/components/RootNavigator';
import { useFonts } from './src/utils/UseFonts';
import { paperTheme } from './src/constants/themes';
import * as SplashScreen from 'expo-splash-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupNotifications } from './src/api/notification';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import 'react-native-gesture-handler';

// Create navigation ref for notifications
export const navigationRef = React.createRef();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Error Boundary Class Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={errorStyles.container}>
                    <Text style={errorStyles.title}>Oops! Something went wrong</Text>
                    <Text style={errorStyles.message}>Please restart the app</Text>
                </View>
            );
        }
        return this.props.children;
    }
}

const errorStyles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
        marginBottom: 10,
    },
    message: {
        fontSize: 14,
        color: '#6c757d',
        textAlign: 'center',
    },
});

export default function App() {
    const fontsLoaded = useFonts();
    const [location, setLocation] = useState(null);
    const [errorMsg, setErrorMsg] = useState(null);
    const [locationName, setLocationName] = useState('Mencari lokasi...');

    useEffect(() => {
        const setupApp = async () => {
            try {
                if (fontsLoaded) {
                    // Ambil lokasi sekali di awal
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        setErrorMsg('Izin lokasi ditolak');
                        setLocationName('Izin lokasi ditolak');
                    } else {
                        try {
                            let loc = await Location.getCurrentPositionAsync({});
                            setLocation(loc);
                            // Reverse geocode langsung di sini
                            let address = null;
                            try {
                                const geo = await Location.reverseGeocodeAsync({
                                    latitude: loc.coords.latitude,
                                    longitude: loc.coords.longitude,
                                });
                                if (geo && geo.length > 0) {
                                    // Gabungkan nama jalan, kelurahan, kota, dsb
                                    const g = geo[0];
                                    address = [g.name, g.street, g.subregion, g.city, g.region]
                                        .filter(Boolean)
                                        .join(', ');
                                }
                            } catch (geoErr) {
                                address = 'Tidak ditemukan';
                            }
                            setLocationName(address || 'Tidak ditemukan');
                        } catch (locError) {
                            setErrorMsg('Gagal mengambil lokasi');
                            setLocationName('Gagal mengambil lokasi');
                        }
                    }

                    // Check if user is logged in and setup notifications
                    const token = await AsyncStorage.getItem('token');
                    if (token) {
                        try {
                            await setupNotifications();
                        } catch (notifError) {
                            console.warn('Notification setup failed:', notifError);
                            // Continue without notifications
                        }
                    }

                    // Hide splash screen after 3 seconds
                    setTimeout(async () => {
                        try {
                            await SplashScreen.hideAsync();
                        } catch (splashError) {
                            console.warn('Splash hide error:', splashError);
                        }
                    }, 3000);
                }
            } catch (error) {
                console.error('Error setting up app:', error);
                try {
                    await SplashScreen.hideAsync();
                } catch (splashError) {
                    console.warn('Splash hide error:', splashError);
                }
            }
        };

        setupApp();
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <ErrorBoundary>
            <LocationContext.Provider value={{ location, errorMsg, locationName }}>
                <GestureHandlerRootView style={{ flex: 1 }}>
                    <BottomSheetModalProvider>
                        <PaperProvider theme={paperTheme}>
                            <NavigationContainer ref={navigationRef}>
                                <RootNavigator />
                            </NavigationContainer>
                        </PaperProvider>
                    </BottomSheetModalProvider>
                </GestureHandlerRootView>
            </LocationContext.Provider>
        </ErrorBoundary>
    );
}
