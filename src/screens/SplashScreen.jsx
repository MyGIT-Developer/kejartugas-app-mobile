import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SplashScreen({ onAuthCheck }) {
    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                console.log('Checking authentication...');
                const token = await AsyncStorage.getItem('token');
                const expiredToken = await AsyncStorage.getItem('expiredToken');

                console.log('Retrieved token:', token);
                console.log('Retrieved expiredToken:', expiredToken);

                if (token && expiredToken) {
                    const currentTime = new Date();
                    const expirationTime = new Date(expiredToken);

                    console.log('Current time:', currentTime);
                    console.log('Expiration time:', expirationTime);

                    if (currentTime < expirationTime) {
                        console.log('Token is valid');
                        onAuthCheck(true);
                    } else {
                        console.log('Token expired, clearing storage');
                        await AsyncStorage.multiRemove([
                            'userData',
                            'token',
                            'userJob',
                            'employeeId',
                            'companyId',
                            'expiredToken',
                        ]);
                        onAuthCheck(false);
                    }
                } else {
                    console.log('No valid token');
                    onAuthCheck(false);
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
                onAuthCheck(false);
            }
        };

        // Simulate a delay for the splash screen (e.g., 3 seconds)
        setTimeout(() => {
            checkAuthentication();
        }, 3000);
    }, [onAuthCheck]);

    return (
        <View style={styles.container}>
            <Image source={require('./../../assets/images/kt_icon.png')} style={styles.logo} />
            <Image
                source={require('./../../assets/images/kt_city_scapes.png')}
                style={styles.cityscape}
                onError={(error) => console.log(error)}
            />
            <ActivityIndicator size="large" color="#148FFF" style={styles.activityIndicator} />
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
        height: 711, // Maintained your original height
        resizeMode: 'cover', // Adjust as necessary
    },
    activityIndicator: {
        position: 'absolute',
        bottom: 100,
    },
});
