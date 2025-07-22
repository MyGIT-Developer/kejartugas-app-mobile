import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AccessDeniedScreen = ({ onBack }) => {
    return (
        <LinearGradient colors={['#EFF6FF', '#F2F6FC']} style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.errorCode}>403</Text>
                <Text style={styles.title}>Access Denied</Text>
                <Text style={styles.subtitle}>Sorry, you don’t have permission to access this page.</Text>
                <TouchableOpacity onPress={onBack}>
                    <Text style={styles.link}>Go back to previous page</Text>
                </TouchableOpacity>

                {/* <Image
                    source={require('../assets/403-illustration.png')} // Replace with your image path
                    style={styles.image}
                    resizeMode="contain"
                /> */}
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 30,
        borderRadius: 20,
        width: width * 0.85,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    errorCode: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#4A90E2',
        marginBottom: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#2E5984',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#777',
        textAlign: 'center',
        marginBottom: 12,
    },
    link: {
        fontSize: 14,
        color: '#4A90E2',
        textDecorationLine: 'underline',
        marginBottom: 20,
    },
    image: {
        width: 180,
        height: 180,
        marginTop: 10,
    },
});

export default AccessDeniedScreen;
