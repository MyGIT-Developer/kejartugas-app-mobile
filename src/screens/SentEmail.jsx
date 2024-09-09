import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import LottieView from 'lottie-react-native'; // Import Lottie
import ReusableAlert from '../components/ReusableAlert'; // Adjust the import path as needed
import { generateResetCode } from '../api/auth'; // Make sure to create this function
import ReusableWaitingScreen from './../components/ReusableWaitingScreen'; // Adjust the import path as needed
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

const SentEmail = () => {
    const [email, setEmail] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const [isWaiting, setIsWaiting] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // New state for loading animation
    const navigation = useNavigation();

    const handlePasswordReset = async () => {
        setError(null); // Reset error state
        try {
            setIsLoading(true); // Show loading animation
            await generateResetCode(email);
            await AsyncStorage.setItem('userEmail', email); // Save email to AsyncStorage
            setIsWaiting(true); // Show waiting screen when success
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan, silakan coba lagi.'); // Set error message
        } finally {
            setIsLoading(false); // Hide loading animation
        }
    };

    // Jika sedang menunggu (success case), tampilkan ReusableWaitingScreen
    if (isWaiting) {
        return (
            <ReusableWaitingScreen
                title="Email untuk ubah kata sandi sudah terkirim"
                subtitle="Kami telah mengirimkan email berisi instruksi untuk mengatur ulang kata sandi Anda. Silakan cek email Anda dan ikuti langkah-langkah di dalamnya."
                animationFile={require('../../assets/animations/email-sent.json')} // Path to your Lottie animation
                buttonText="Selanjutnya"
                onButtonPress={() => navigation.navigate('ForgotPassword')}
            />
        );
    }

    // Jika sedang loading (proses pengecekan), tampilkan animasi loading
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../../assets/animations/loading.json')} // Path to your loading Lottie animation
                    autoPlay
                    loop
                    style={styles.loadingAnimation}
                />
                <Text style={styles.loadingText}>Mohon tunggu...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header section */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-outline" size={24} color="#000" />
                </TouchableOpacity>
                <Image
                    source={require('../../assets/images/kt_icon.png')}
                    style={styles.rightIcon}
                    resizeMode="contain"
                />
            </View>

            {/* Title and subtitle */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Reset Kata Sandi</Text>
                <Text style={styles.subtitle}>
                    Masukkan alamat email yang Anda gunakan saat mendaftar dan kami akan mengirimkan instruksi untuk
                    mengatur ulang kata sandi Anda.
                </Text>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { borderColor: isFocused ? '#148FFF' : '#E5E7EB' }]}
                        placeholder="Masukkan email Anda..."
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                    />
                </View>
            </View>

            {/* Footer section */}
            <View style={styles.footer}>
                <TouchableOpacity onPress={handlePasswordReset} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>Minta Reset Kata Sandi</Text>
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Ingat kata sandi Anda? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Masuk</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tampilkan alert jika terjadi error */}
            {error && (
                <ReusableAlert show={!!error} alertType="error" message={error} onConfirm={() => setError(null)} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 30,
        paddingTop: Platform.OS === 'ios' ? 20 : 0,
        justifyContent: 'flex-start',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        top: Platform.OS === 'ios' ? 20 : 0,
        left: 20,
        right: 20,
        height: 60,
        zIndex: 1,
    },
    rightIcon: {
        width: 80,
        height: 30,
    },
    titleContainer: {
        marginTop: 100,
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        textAlign: 'left',
        color: '#6B7280',
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    resetButton: {
        width: '100%',
        backgroundColor: '#007BFF',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 20,
    },
    resetButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        color: '#6B7280',
    },
    loginLink: {
        color: '#007BFF',
        fontWeight: '600',
    },
    // Loading styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingAnimation: {
        width: 150,
        height: 150,
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
        color: '#6B7280',
    },
});

export default SentEmail;
