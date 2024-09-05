import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const WaitingMail = () => {
    const [showButton, setShowButton] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        // Setelah 3 detik, tampilkan tombol
        const timer = setTimeout(() => {
            setShowButton(true);
        }, 3000);

        // Bersihkan timeout ketika komponen unmount
        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            {/* Teks judul dan deskripsi di kiri atas */}
            <View style={styles.textContainer}>
                <Text style={styles.title}>Email Untuk ubah kata sandi sudah Terkirim</Text>
                <Text style={styles.subtitle}>
                    Kami telah mengirimkan email berisi instruksi untuk mengatur ulang kata sandi Anda. Silakan cek
                    email Anda dan ikuti langkah-langkah di dalamnya.
                </Text>
            </View>

            {/* Gambar email di tengah */}
            <View style={styles.iconContainer}>
                <Image
                    source={require('../../assets/images/mail.png')} // Ganti path sesuai lokasi gambarnya
                    style={styles.image} // Gaya untuk gambar
                    resizeMode="contain" // Supaya gambar disesuaikan ke area yang tersedia
                />
            </View>

            {/* Tombol di bawah, muncul setelah 3 detik */}
            {showButton && (
                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.buttonText}>Kembali ke Login</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        justifyContent: 'space-between', // Teks di atas, tombol di bawah
        alignItems: 'center', // Tengah untuk ikon
    },
    textContainer: {
        alignSelf: 'flex-start', // Teks di kiri atas
        marginTop: Platform.OS === 'ios' ? 60 : 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'left',
        fontFamily: 'Poppins-Bold', // Menggunakan Poppins Bold
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'left',
        color: '#6B7280',
        fontFamily: 'Poppins-Regular', // Menggunakan Poppins Regular
    },
    iconContainer: {
        flex: 1,
        justifyContent: 'center', // Tengah secara vertikal
    },
    image: {
        width: 150, // Atur lebar gambar
        height: 150, // Atur tinggi gambar
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-Medium', // Menggunakan Poppins Medium
    },
});

export default WaitingMail;
