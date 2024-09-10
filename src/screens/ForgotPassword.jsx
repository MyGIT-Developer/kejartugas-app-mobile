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
    ActivityIndicator,
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
    const [focusedField, setFocusedField] = useState(null); // Single state for focus

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
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#148FFF" />
            </View>
        );
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

                    <View style={[styles.inputContainer, focusedField === 'email' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={false}
                            onFocus={() => setFocusedField('email')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={[styles.inputContainer, focusedField === 'otp' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Masukkan Kode OTP"
                            value={otp_code}
                            onChangeText={setOtpCode}
                            keyboardType="default"
                            onFocus={() => setFocusedField('otp')}
                            onBlur={() => setFocusedField(null)}
                        />
                    </View>

                    <View style={[styles.inputContainer, focusedField === 'password' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Kata Sandi Baru"
                            secureTextEntry={!isPasswordVisible}
                            value={password}
                            onChangeText={setPassword}
                            onFocus={() => setFocusedField('password')}
                            onBlur={() => setFocusedField(null)}
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

                    <View style={[styles.inputContainer, focusedField === 'confirmPassword' && styles.inputFocused]}>
                        <TextInput
                            style={styles.input}
                            placeholder="Konfirmasi Kata Sandi Baru"
                            secureTextEntry={!isConfirmPasswordVisible}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            onFocus={() => setFocusedField('confirmPassword')}
                            onBlur={() => setFocusedField(null)}
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

                    <TouchableOpacity style={styles.submitButton} onPress={handlePasswordReset}>
                        <Text style={styles.submitButtonText}>Reset Kata Sandi</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            <ReusableAlert
                visible={showAlert}
                message={alertMessage}
                onClose={() => setShowAlert(false)}
                animationFile={require('../../assets/animations/error.json')}
            />
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContainer: { flexGrow: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
    },
    rightIcon: { width: 40, height: 40 },
    content: { paddingHorizontal: 20, paddingBottom: 30 },
    title: { fontSize: 24, fontFamily: 'Poppins-Bold', color: '#148FFF', marginBottom: 10 },
    subtitle: { fontSize: 16, fontFamily: 'Poppins-Regular', color: '#777', marginBottom: 20 },
    inputContainer: {
        borderColor: '#E5E7EB',
        borderWidth: 1,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 10,
    },
    inputFocused: { borderColor: '#148FFF' },
    input: { flex: 1, paddingVertical: 10, fontSize: 16, fontFamily: 'Poppins-Regular', color: '#333' },
    eyeIcon: { padding: 10 },
    strengthIndicatorContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    strengthBar: { height: 6, flex: 1 },
    strengthBarMargin: { marginRight: 4 },
    strengthText: { textAlign: 'right', fontSize: 14, fontFamily: 'Poppins-Regular', marginBottom: 15 },
    requirementsText: { fontSize: 12, fontFamily: 'Poppins-Regular', color: '#888', marginBottom: 20 },
    submitButton: {
        backgroundColor: '#148FFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitButtonText: { fontSize: 18, fontFamily: 'Poppins-Bold', color: '#fff' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingAnimation: { width: 100, height: 100 },
    loadingText: { fontFamily: 'Poppins-Regular', fontSize: 16, color: '#148FFF', marginTop: 20 },
});

export default ForgotPassword;
