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
    Linking,
    Keyboard,
    Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { registerCompanies } from '../api/auth';
import ReusableAlert from '../components/ReusableAlert';
import LottieView from 'lottie-react-native';

const Step2 = ({ route, navigation }) => {
    const { company_name, company_email } = route.params;
    const [employee_name, setEmployeeName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isFormValid, setIsFormValid] = useState(false);
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [company_image, setCompanyImage] = useState('');
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
            setKeyboardVisible(true);
        });
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            setKeyboardVisible(false);
        });

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        setIsFormValid(
            employee_name.trim() !== '' &&
                username.trim() !== '' &&
                password.trim() !== '' &&
                confirmPassword.trim() !== '' &&
                password === confirmPassword,
        );
    }, [employee_name, username, password, confirmPassword]);

    const handleRegister = async () => {
        if (!isFormValid) return;

        setIsLoading(true);

        try {
            const response = await registerCompanies(
                company_name,
                company_email,
                username,
                employee_name,
                password,
                company_image,
            );

            setIsLoading(false);

            if (response.status === 'success') {
                const { company, employee } = response;
                navigation.navigate('SuccessRegist', {
                    company_name: company.company_name,
                    company_email: company.company_email,
                    username: employee.username,
                    employee_name: employee.employee_name,
                    company_expired: company.company_expired,
                });
            } else {
                throw new Error(response.message || 'Registration failed');
            }
        } catch (error) {
            setIsLoading(false);
            setAlertMessage(error.message);
            setAlertType('error');
            setAlertVisible(true);
        }
    };

    const handleLoginPress = () => {
        navigation.navigate('Login');
    };

    const handleContactUs = () => {
        Linking.openURL('mailto:HelpDesk@innovation.co.id');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
            >
                <ImageBackground
                    source={require('../../assets/images/kt_city_scapes.png')}
                    style={styles.backgroundImage}
                >
                    <View style={styles.contentContainer}>
                        <ScrollView contentContainerStyle={styles.scrollViewContent}>
                            <View style={styles.card}>
                                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                                    <Feather name="arrow-left" size={24} color="#0056b3" />
                                </TouchableOpacity>
                                <Image
                                    source={require('../../assets/images/Meotrik_PM_Logo.png')}
                                    style={styles.logo}
                                />
                                <Text style={styles.welcomeText}>Selamat Datang di</Text>
                                <Text style={styles.appName}>Meotrik</Text>
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
                                    value={employee_name}
                                    onChangeText={setEmployeeName}
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
                                        <Text style={styles.showPasswordText}>
                                            {showConfirmPassword ? 'Hide' : 'Show'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.buttonRow}>
                                    <TouchableOpacity
                                        style={styles.secondaryButton}
                                        onPress={() => navigation.goBack()}
                                    >
                                        <Text style={styles.secondaryButtonText}>Kembali</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.primaryButton, !isFormValid && styles.disabledButton]}
                                        disabled={!isFormValid}
                                        onPress={handleRegister}
                                    >
                                        <Text style={styles.primaryButtonText}>Daftar</Text>
                                    </TouchableOpacity>
                                </View>
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
                        </ScrollView>
                        {!keyboardVisible && (
                            <View style={styles.footerContainer}>
                                <Text style={styles.footerText}>
                                    © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
                                </Text>
                            </View>
                        )}
                    </View>
                </ImageBackground>
                <ReusableAlert
                    show={alertVisible}
                    alertType={alertType}
                    message={alertMessage}
                    onConfirm={() => setAlertVisible(false)}
                />
                <Modal transparent visible={isLoading}>
                    <View style={styles.loadingOverlay}>
                        <LottieView
                            source={require('../../assets/animations/loading.json')}
                            autoPlay
                            loop
                            style={styles.loadingAnimation}
                        />
                        <Text style={styles.loadingText}>Mohon tunggu sebentar...</Text>
                    </View>
                </Modal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 350,
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
        marginRight: 8,
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
    footerContainer: {
        backgroundColor: 'transparent',
        paddingVertical: 5,
    },
    loadingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingAnimation: {
        width: 200,
        height: 200,
    },
    loadingText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 20,
    },
});

export default Step2;
