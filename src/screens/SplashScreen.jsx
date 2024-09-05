import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts'; // Adjust the path as needed

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

                if (token && expiredToken) {
                    const currentTime = new Date();
                    const expirationTime = new Date(expiredToken);

                    console.log('Current time:', currentTime);
                    console.log('Expiration time:', expirationTime);

                    if (currentTime < expirationTime) {
                        console.log('Token is valid');
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'App' }],
                        });
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
                        navigation.navigate('Login');
                    }
                } else {
                    console.log('No valid token');
                    navigation.navigate('Login');
                }
            } catch (error) {
                console.error('Error checking authentication status:', error);
                navigation.navigate('Login');
            }
        };

        setTimeout(() => {
            checkAuthentication();
        }, 2000);
    }, [navigation]);

    if (!fontsLoaded) {
        return <ActivityIndicator size="small" color="#148FFF" style={styles.activityIndicator} />;
    }

    return (
        <View style={styles.container}>
            <Image source={require('./../../assets/images/kt_icon.png')} style={styles.logo} />
            <Image
                source={require('./../../assets/images/kt_city_scapes.png')}
                style={styles.cityscape}
                onError={(error) => console.log(error)}
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
