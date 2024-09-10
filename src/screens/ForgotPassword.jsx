import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    Image,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import ReusableWaitingScreen from '../components/ReusableWaitingScreen';
import ReusableAlert from '../components/ReusableAlert';
import { forgotPassword } from '../api/auth';
import { useFonts } from '../utils/UseFonts'; // Import useFonts

const ForgotPassword = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [otp_code, setOtpCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordStrengthLabel, setPasswordStrengthLabel] = useState('');
    const [isCompleted, setIsCompleted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    const fontsLoaded = useFonts(); // Use the custom hook to load fonts
    useEffect(() => {
        const loadEmail = async () => {
            try {
                const userEmail = await AsyncStorage.getItem('userEmail');
                if (userEmail) {
                    setEmail(userEmail);
                }
            } catch (error) {
                console.log('Error loading email from AsyncStorage:', error);
            }
        };
        loadEmail();
    }, []);

    useEffect(() => {
        calculatePasswordStrength(password);
    }, [password]);

    const handlePasswordReset = async () => {
        if (!email || !otp_code || !password) {
            setAlertMessage('Mohon isi semua kolom.');
            setShowAlert(true);
            return;
        }
        if (passwordStrength <= 2) {
            setAlertMessage('Mohon pilih kata sandi yang lebih kuat.');
            setShowAlert(true);
            return;
        }
        if (password !== confirmPassword) {
            setAlertMessage('Kedua kata sandi harus sama.');
            setShowAlert(true);
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email, otp_code, password);
            setIsCompleted(true);
        } catch (error) {
            setAlertMessage(error.message);
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    const calculatePasswordStrength = (pass) => {
        let strength = 0;
        if (pass.length >= 8) strength += 1;
        if (pass.length >= 12) strength += 1;
        if (/[A-Z]/.test(pass)) strength += 1;
        if (/[a-z]/.test(pass)) strength += 1;
        if (/[0-9]/.test(pass)) strength += 1;
        if (/[^A-Za-z0-9]/.test(pass)) strength += 1;

        setPasswordStrength(strength);

        if (strength <= 2) setPasswordStrengthLabel('Lemah');
        else if (strength <= 4) setPasswordStrengthLabel('Sedang');
        else setPasswordStrengthLabel('Kuat');
    };

    const getStrengthBarColor = (index) => {
        if (passwordStrength <= 2) return index === 0 ? '#EF4444' : '#E5E7EB';
        if (passwordStrength <= 4) return index <= 1 ? '#FBBF24' : '#E5E7EB';
        return '#10B981';
    };
    if (!fontsLoaded) {
        return null; // or a loading indicator
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../../assets/animations/loading.json')}
                    autoPlay
                    loop
                    style={styles.loadingAnimation}
                />
                <Text style={styles.loadingText}>Mohon tunggu...</Text>
            </View>
        );
    }

    if (isCompleted) {
        return (
            <ReusableWaitingScreen
                title="Kata Sandi Berhasil Direset"
                subtitle="Kata sandi Anda telah berhasil direset. Silakan masuk dengan kata sandi baru Anda."
                animationFile={require('../../assets/animations/success.json')}
                buttonText="Masuk"
                onButtonPress={() => navigation.navigate('Login')}
            />
        );
    }

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
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

                <View style={styles.content}>
                    <Text style={styles.title}>Reset Kata Sandi</Text>
                    <Text style={styles.subtitle}>
                        Masukkan email, kode OTP, dan kata sandi baru untuk mereset kata sandi Anda.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan Kode OTP"
                            value={otp_code}
                            onChangeText={setOtpCode}
                            keyboardType="default"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Kata Sandi Baru"
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                        >
                            <Icon name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.strengthIndicatorContainer}>
                        {[0, 1, 2].map((index) => (
                            <View
                                key={index}
                                style={[
                                    styles.strengthBar,
                                    { backgroundColor: getStrengthBarColor(index) },
                                    index < 2 && styles.strengthBarMargin,
                                ]}
                            />
                        ))}
                    </View>
                    <Text style={[styles.strengthText, { color: getStrengthBarColor(0) }]}>
                        {passwordStrengthLabel}
                    </Text>

                    <Text style={styles.requirementsText}>
                        Kata sandi harus mengandung minimal 8 karakter, termasuk huruf besar, huruf kecil, angka, dan
                        karakter khusus.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Kata Sandi Baru"
                            secureTextEntry={!isConfirmPasswordVisible}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity
                            style={styles.eyeIcon}
                            onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}
                        >
                            <Icon
                                name={isConfirmPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
                                size={20}
                                color="#888"
                            />
                        </TouchableOpacity>
                    </View>
                    {password !== confirmPassword && <Text style={styles.errorText}>Kedua kata sandi harus sama.</Text>}

                    <TouchableOpacity
                        style={[
                            styles.resetButton,
                            (passwordStrength <= 2 || password !== confirmPassword) && styles.disabledButton,
                        ]}
                        onPress={handlePasswordReset}
                        disabled={passwordStrength <= 2 || password !== confirmPassword}
                    >
                        <Text style={styles.resetButtonText}>Reset Kata Sandi</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <ReusableAlert
                show={showAlert}
                alertType="error"
                message={alertMessage}
                onConfirm={() => setShowAlert(false)}
            />
        </KeyboardAvoidingView>
    );
};
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContainer: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rightIcon: {
        width: 40,
        height: 40,
    },
    content: {
        marginTop: 40,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 24,
        color: '#148FFF',
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    input: {
        fontFamily: 'Poppins-Regular',
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    eyeIcon: {
        position: 'absolute',
        right: 10,
        top: 15,
    },
    strengthIndicatorContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    strengthBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthBarMargin: {
        marginRight: 5,
    },
    strengthText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        marginBottom: 20,
    },
    requirementsText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: '#888',
        marginBottom: 20,
    },
    errorText: {
        fontFamily: 'Poppins-Regular',
        color: '#EF4444',
        fontSize: 14,
        marginBottom: 10,
    },
    resetButton: {
        backgroundColor: '#148FFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        fontFamily: 'Poppins-Bold',
        color: '#fff',
        fontSize: 18,
    },
    disabledButton: {
        backgroundColor: '#BEBEBE',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingAnimation: {
        width: 100,
        height: 100,
    },
    loadingText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 18,
        marginTop: 10,
    },
});

export default ForgotPassword;
