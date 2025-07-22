import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ImageBackground, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const SuccessRegist = ({ route, navigation }) => {
    const { company_name, company_email, username, employee_name, company_expired } = route.params;

    const handleContactUs = () => {
        Linking.openURL('mailto:HelpDesk@innovation.co.id');
    };

    const handleLogin = () => {
        navigation.navigate('Login');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ImageBackground source={require('../../assets/images/kt_city_scapes.png')} style={styles.backgroundImage}>
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
                            <Feather name="arrow-left" size={24} color="#0056b3" />
                        </TouchableOpacity>
                        <Image source={require('../../assets/images/Meotrik_PM_Logo.png')} style={styles.logo} />
                        <Text style={styles.welcomeText}>Selamat Datang di</Text>
                        <Text style={styles.appName}>Kejar Tugas</Text>
                        <View style={styles.row}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Nama Organisasi</Text>
                                <View style={styles.valueContainer}>
                                    <Feather name="briefcase" size={20} color="#0056b3" style={styles.icon} />
                                    <Text style={styles.value}>{company_name}</Text>
                                </View>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Username Admin</Text>
                                <View style={styles.valueContainer}>
                                    <Feather name="user" size={20} color="#0056b3" style={styles.icon} />
                                    <Text style={styles.value}>{username}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.row}>
                            <View style={styles.column}>
                                <Text style={styles.label}>Nama Admin</Text>
                                <View style={styles.valueContainer}>
                                    <Feather name="user" size={20} color="#0056b3" style={styles.icon} />
                                    <Text style={styles.value}>{employee_name}</Text>
                                </View>
                            </View>
                            <View style={styles.column}>
                                <Text style={styles.label}>Tanggal Berakhir</Text>
                                <View style={styles.valueContainer}>
                                    <Feather name="calendar" size={20} color="#0056b3" style={styles.icon} />
                                    <Text style={styles.value}>{company_expired}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.infoSection}>
                            <Text style={styles.linkText}>Informasi berikut juga dikirim melalui:</Text>
                            <Text style={styles.emailText}>{company_email}</Text>
                        </View>
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Selesai</Text>
                        </TouchableOpacity>
                        <Text style={styles.questionText}>Ada pertanyaan?</Text>
                        <TouchableOpacity style={styles.contactButton} onPress={handleContactUs}>
                            <Feather name="mail" size={20} color="#0056b3" style={styles.contactButtonIcon} />
                            <Text style={styles.contactButtonText}>Hubungi Kami</Text>
                        </TouchableOpacity>
                        <Text style={styles.loginText}>
                            Sudah punya akun?{' '}
                            <Text style={styles.loginLink} onPress={handleLogin}>
                                Masuk
                            </Text>
                        </Text>
                    </View>
                </ScrollView>
                <View style={styles.footerContainer}>
                    <Text style={styles.footerText}>
                        © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
                    </Text>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
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
        shadowColor: '#444',
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
    infoSection: {
        marginBottom: 15,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    column: {
        flex: 1,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 10,
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    linkText: {
        fontSize: 12,
        color: '#666',
        marginTop: 10,
    },
    emailText: {
        fontSize: 14,
        color: '#0056b3',
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#3c4b64',
        paddingVertical: 12,
        borderRadius: 5,
        marginVertical: 20,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
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
        justifyContent: 'center',
        alignItems: 'center',
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
        padding: 10,
    },
    footerText: {
        fontSize: 12,
        color: '#666',
        textAlign: 'center',
    },
});

export default SuccessRegist;
