import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isFocused, setIsFocused] = useState(false); // State untuk melacak fokus input
    const navigation = useNavigation();

    const handlePasswordReset = () => {
        console.log('Permintaan reset kata sandi untuk:', email);
        navigation.navigate('WaitingMail'); // Navigasi ke halaman WaitingMail.jsx
    };

    return (
        <View style={styles.container}>
            {/* Bagian Header */}
            <View style={styles.header}>
                {/* Panah Kembali */}
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back-outline" size={24} color="#000" />
                </TouchableOpacity>

                {/* Ikon Kanan */}
                <Image
                    source={require('../../assets/images/kt_icon.png')}
                    style={styles.rightIcon}
                    resizeMode="contain"
                />
            </View>

            {/* Judul dan Subjudul */}
            <View style={styles.titleContainer}>
                <Text style={styles.title}>Reset Kata Sandi</Text>
                <Text style={styles.subtitle}>
                    Masukkan alamat email yang Anda gunakan saat mendaftar dan kami akan mengirimkan instruksi untuk
                    mengatur ulang kata sandi Anda.
                </Text>

                {/* Input Email */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.input,
                            { borderColor: isFocused ? '#148FFF' : '#E5E7EB' }, // Ubah warna border saat fokus
                        ]}
                        placeholder="Masukkan email Anda..."
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onFocus={() => setIsFocused(true)} // Atur fokus saat input difokuskan
                        onBlur={() => setIsFocused(false)} // Kembalikan state fokus saat input blur
                    />
                </View>
            </View>

            {/* Bagian Footer */}
            <View style={styles.footer}>
                {/* Tombol Reset Kata Sandi */}
                <TouchableOpacity onPress={handlePasswordReset} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>Minta Reset Kata Sandi</Text>
                </TouchableOpacity>

                {/* Tautan Login */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>Ingat kata sandi Anda? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.loginLink}>Masuk</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingVertical: 30,
        paddingTop: Platform.OS === 'ios' ? 20 : 0, // Sesuaikan untuk iOS dan Android
        justifyContent: 'flex-start', // Sejajarkan item dari atas
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        top: Platform.OS === 'ios' ? 20 : 0, // Sesuaikan untuk iOS dan Android
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
        marginTop: 100, // Ruang di bawah header
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
        borderColor: '#E5E7EB', // Warna border default
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#F9FAFB',
    },
    footer: {
        alignItems: 'center',
        marginBottom: 20, // Sesuaikan jarak dari bawah
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
});

export default ForgotPassword;
