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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Step2 = ({ navigation }) => {
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordMatch, setPasswordMatch] = useState(true);

    useEffect(() => {
        setIsFormValid(
            fullName.trim() !== '' &&
                username.trim() !== '' &&
                password.trim() !== '' &&
                confirmPassword.trim() !== '' &&
                password === confirmPassword &&
                passwordMatch,
        );
    }, [fullName, username, password, confirmPassword, passwordMatch]);

    useEffect(() => {
        checkPasswordStrength(password);
    }, [password]);

    const checkPasswordStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 1;
        if (pass.length >= 12) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) strength += 1;
        setPasswordStrength(strength);
    };

    const getPasswordStrengthColor = (index) => {
        if (passwordStrength >= index + 1) {
            if (passwordStrength === 1) return '#FF0000'; // Red
            if (passwordStrength === 2) return '#FFA500'; // Orange
            return '#00FF00'; // Green
        }
        return '#E0E0E0'; // Gray for inactive bars
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ImageBackground source={require('../../assets/images/kt_city_scapes.png')} style={styles.backgroundImage}>
                <View style={styles.contentContainer}>
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
                            <Text style={styles.stepText}>Step 2: Registrasi Akun Admin</Text>
                            <Text style={styles.label}>
                                Nama Lengkap <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Masukkan Nama Lengkap"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                            <Text style={styles.label}>
                                Username <Text style={styles.required}>*</Text>
                            </Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                            />
                            <Text style={styles.label}>
                                Password <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Masukkan Password"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.showPasswordButton}
                                >
                                    <Text style={styles.showPasswordText}>{showPassword ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.passwordStrengthContainer}>
                                {[0, 1, 2].map((index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.passwordStrengthBar,
                                            { backgroundColor: getPasswordStrengthColor(index) },
                                        ]}
                                    />
                                ))}
                            </View>
                            <Text style={styles.passwordStrengthText}>
                                {passwordStrength <= 1 ? 'Lemah' : passwordStrength === 2 ? 'Sedang' : 'Kuat'}
                            </Text>
                            <Text style={styles.label}>
                                Konfirmasi Password <Text style={styles.required}>*</Text>
                            </Text>
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Masukkan Kembali Password"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.showPasswordButton}
                                >
                                    <Text style={styles.showPasswordText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.buttonRow}>
                                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                                    <Text style={styles.secondaryButtonText}>Kembali</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
                                    disabled={!isFormValid}
                                >
                                    <Text style={styles.primaryButtonText}>Daftar</Text>
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
                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>
                            © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
                        </Text>
                    </View>
                </View>
            </ImageBackground>
        </SafeAreaView>
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
        paddingHorizontal: 20,
        paddingVertical: 40, // Add vertical padding
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)', // Make card slightly transparent
        borderRadius: 10,
        padding: 20,
        width: '90%', // Reduce width to 90% of the screen
        maxWidth: 350, // Set a maximum width
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
        width: '100%',
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
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        marginBottom: 15,
    },
    passwordInput: {
        flex: 1,
        padding: 10,
    },
    showPasswordButton: {
        padding: 10,
    },
    showPasswordText: {
        color: '#0056b3',
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
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
    safeArea: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    footerContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        paddingVertical: 5,
    },
    passwordStrengthContainer: {
        flexDirection: 'row',
        height: 5,
        marginBottom: 5,
    },
    passwordStrengthBar: {
        flex: 1,
        height: '100%',
        borderRadius: 2,
        marginHorizontal: 1,
    },
    passwordStrengthText: {
        fontSize: 12,
        color: '#666',
        marginBottom: 10,
    },
});

export default Step2;
