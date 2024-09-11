import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';

export default function SplashScreen() {
    const navigation = useNavigation();
    const fontsLoaded = useFonts();

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                console.log('Checking authentication...');
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
                            console.log('Token is valid');
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'BoardingScreen' }],
                            });
                        } else {
                            console.log('Token expired, clearing storage');
                            await clearAuthData();
                            navigation.navigate('BoardingScreen');
                        }
                    } else {
                        console.log('Token exists but no expiration time. Proceeding to App.');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'BoardingScreen' }],
                        });
                    }
                } else {
                    console.log('No token found');
                    navigation.navigate('BoardingScreen');
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
                await clearAuthData();
                navigation.navigate('BoardingScreen');
            }
        };

        const clearAuthData = async () => {
            await AsyncStorage.multiRemove(['userData', 'token', 'userJob', 'employeeId', 'companyId', 'expiredToken']);
        };

        setTimeout(checkAuthentication, 2000);
    }, [navigation]);

    if (!fontsLoaded) {
        return <ActivityIndicator size="small" color="#148FFF" style={styles.activityIndicator} />;
    }

    return (
        <View style={styles.container}>
            <Image source={require('./../../assets/images/kt_app.png')} style={styles.logo} />
            <Image
                source={require('./../../assets/images/kt_city_scapes.png')}
                style={styles.cityscape}
                onError={(error) => console.log('Image loading error:', error)}
            />
            <ActivityIndicator size="small" color="#148FFF" style={styles.activityIndicator} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#E7E7E7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 200,
        height: 100,
        resizeMode: 'contain',
        marginBottom: 20,
    },
    cityscape: {
        position: 'absolute',
        bottom: 0,
        width: 360,
        height: 711,
        resizeMode: 'cover',
    },
    activityIndicator: {
        position: 'absolute',
        bottom: 100,
    },
});
