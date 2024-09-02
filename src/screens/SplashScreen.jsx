import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

export default function SplashScreen() {
    return (
        <View style={styles.container}>
            <Image source={require('./../../assets/images/kt_icon.png')} style={styles.logo} />
            <Image
                source={require('./../../assets/images/kt_city_scapes.png')}
                style={styles.cityscape}
                onError={(error) => console.log(error)}
            />
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
        height: 711, // Increased height to see if it appears
        resizeMode: 'cover', // Try 'contain' or 'stretch' if 'cover' doesn't work
    },
});
