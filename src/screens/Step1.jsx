import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    ImageBackground,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Keyboard, // Added import for Keyboard API
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const Step1 = ({ navigation }) => {
    const [organizationName, setOrganizationName] = useState('');
    const [email, setEmail] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [footerVisible, setFooterVisible] = useState(true); // State to control footer visibility

    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex untuk validasi email
        setIsFormValid(
            organizationName.trim() !== '' &&
                emailRegex.test(email) && // Validasi email
                agreeToTerms,
        );
    }, [organizationName, email, agreeToTerms]);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setFooterVisible(false); // Hide footer when keyboard is shown
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setFooterVisible(true); // Show footer when keyboard is hidden
        });

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    const handleNext = () => {
        navigation.navigate('Step2');
    };

    return (
        <ImageBackground source={require('../../assets/images/kt_city_scapes.png')} style={styles.backgroundImage}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Feather name="arrow-left" size={24} color="#0056b3" />
                        </TouchableOpacity>
                        <Image source={require('../../assets/images/k_logo.png')} style={styles.logo} />
                        <Text style={styles.welcomeText}>Selamat Datang di</Text>
                        <Text style={styles.appName}>Kejar Tugas</Text>
                        <View style={styles.progressBar}>
                            <View style={styles.progressIndicator} />
                        </View>
                        <Text style={styles.stepText}>Step 1: Buat Akun Organisasi</Text>
                        <Text style={styles.label}>
                            Nama Organisasi <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan Nama Organisasi"
                            value={organizationName}
                            onChangeText={setOrganizationName}
                        />
                        <Text style={styles.label}>
                            Email <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. xx@gmail.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <View style={styles.checkboxContainer}>
                            <TouchableOpacity onPress={() => setAgreeToTerms(!agreeToTerms)} style={styles.checkbox}>
                                {agreeToTerms && <Feather name="check" size={16} color="#0056b3" />}
                            </TouchableOpacity>
                            <Text style={styles.checkboxText}>
                                Saya setuju dengan <Text style={styles.linkText}>syarat dan ketentuan</Text>.
                            </Text>
                        </View>
                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                                <Text style={styles.secondaryButtonText}>Tutup</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
                                disabled={!isFormValid}
                                onPress={handleNext}
                            >
                                <Text style={styles.primaryButtonText}>Lanjut</Text>
                                <Feather name="arrow-right" size={20} color="#fff" style={styles.buttonIcon} />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.questionText}>Ada pertanyaan?</Text>
                        <TouchableOpacity style={styles.contactButton}>
                            <Feather name="mail" size={20} color="#0056b3" style={styles.contactButtonIcon} />
                            <Text style={styles.contactButtonText}>Hubungi Kami</Text>
                        </TouchableOpacity>
                        <Text style={styles.loginText}>
                            Sudah punya akun? <Text style={styles.loginLink}>Masuk</Text>
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            {footerVisible && ( // Conditionally render footer
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
                    </Text>
                </View>
            )}
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
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '100%',
        maxWidth: 400,
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
        top: 20,
        left: 20,
    },
    logo: {
        width: 60,
        height: 60,
        alignSelf: 'center',
        marginTop: 20,
        marginBottom: 10,
    },
    welcomeText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
    },
    appName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#0056b3',
        marginBottom: 20,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#e0e0e0',
        marginBottom: 20,
    },
    progressIndicator: {
        height: '100%',
        width: '50%',
        backgroundColor: '#0056b3',
    },
    stepText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#0056b3',
    },
    label: {
        fontSize: 14,
        marginBottom: 5,
        color: '#333',
    },
    required: {
        color: 'red',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
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
        fontSize: 14,
        color: '#333',
    },
    linkText: {
        color: '#0056b3',
        textDecorationLine: 'underline',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    secondaryButton: {
        backgroundColor: '#f0f0f0',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    primaryButton: {
        backgroundColor: '#0056b3',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    secondaryButtonText: {
        color: '#333',
    },
    primaryButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        marginRight: 5,
    },
    buttonIcon: {
        marginLeft: 5,
    },
    questionText: {
        textAlign: 'center',
        marginBottom: 10,
        color: '#666',
    },
    contactButton: {
        flexDirection: 'row',
        backgroundColor: '#e6f3ff',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    contactButtonIcon: {
        marginRight: 10,
    },
    contactButtonText: {
        color: '#0056b3',
    },
    loginText: {
        textAlign: 'center',
        color: '#666',
    },
    loginLink: {
        color: '#0056b3',
        textDecorationLine: 'underline',
    },
    footerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        padding: 5,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default Step1;
