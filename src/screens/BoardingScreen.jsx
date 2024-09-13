import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, ImageBackground } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const BoardingScreen = () => {
    const navigation = useNavigation();

    const handleLoginPress = () => {
        navigation.navigate('Login');
    };

    const handleRegisterPress = () => {
        navigation.navigate('Step1');
    };
    const handleContactUs = () => {
        Linking.openURL('mailto:HelpDesk@innovation.co.id');
    };

    return (
        <ImageBackground source={require('../../assets/images/kt_city_scapes.png')} style={styles.backgroundImage}>
            <View style={styles.container}>
                <View style={styles.card}>
                    <Image source={require('../../assets/images/k_logo.png')} style={styles.logo} />
                    <Text style={styles.welcomeText}>Selamat Datang di</Text>
                    <Text style={styles.appName}>Kejar Tugas</Text>
                    <TouchableOpacity style={styles.registerButton} onPress={handleRegisterPress}>
                        <Feather name="briefcase" size={20} color="#fff" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Daftar Baru</Text>
                    </TouchableOpacity>
                    <Text style={styles.questionText}>Ada pertanyaan?</Text>
                    <TouchableOpacity style={styles.contactButton} onPress={handleContactUs}>
                        <Feather name="mail" size={20} color="#0056b3" style={styles.contactButtonIcon} />
                        <Text style={styles.contactButtonText}>Hubungi Kami</Text>
                    </TouchableOpacity>
                    <Text style={styles.loginText}>
                        Sudah punya akun?{' '}
                        <Text style={styles.loginLink} onPress={handleLoginPress}>
                            Masuk
                        </Text>
                    </Text>
                </View>
            </View>
            <Text style={styles.footerText}>
                © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
            </Text>
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    backButton: {
        position: 'absolute',
        top: 10,
        left: 10,
    },
    logo: {
        width: 60,
        height: 60,
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 16,
        color: '#666',
    },
    appName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0056b3',
        marginBottom: 20,
    },
    progressBar: {
        width: '100%',
        height: 4,
        backgroundColor: '#e0e0e0',
        marginBottom: 20,
    },
    progressIndicator: {
        width: '50%',
        height: '100%',
        backgroundColor: '#0056b3',
    },
    stepText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#0056b3',
    },
    label: {
        alignSelf: 'flex-start',
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    required: {
        color: 'red',
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    input: {
        width: '100%',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
    },
    checkboxContainer: {
        width: '100%',
        marginBottom: 20,
    },
    checkboxWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderColor: '#0056b3',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxText: {
        flex: 1,
        fontSize: 14,
        color: '#333',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
    },
    primaryButton: {
        backgroundColor: '#0056b3',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    secondaryButtonText: {
        color: '#333',
    },
    registerButton: {
        backgroundColor: '#0056b3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        marginBottom: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    buttonIcon: {
        marginRight: 10,
    },
    questionText: {
        color: '#666',
        marginBottom: 10,
    },
    contactButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 5,
        width: '100%',
        backgroundColor: '#e6f3ff',
        marginBottom: 20,
    },
    contactButtonText: {
        color: '#0056b3',
        fontSize: 16,
    },
    contactButtonIcon: {
        marginRight: 8, // Tambahkan margin kanan
    },
    loginText: {
        color: '#666',
    },
    loginLink: {
        color: '#0056b3',
        textDecorationLine: 'underline',
    },
    linkText: {
        color: '#0056b3',
        textDecorationLine: 'underline',
    },
    footerText: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 5,
    },
});

export default BoardingScreen;
