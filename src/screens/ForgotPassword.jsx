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
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import ReusableWaitingScreen from '../components/ReusableWaitingScreen';
import { forgotPassword } from '../api/auth';

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
            Alert.alert('Error', 'Please fill in all fields.');
            return;
        }
        if (passwordStrength <= 2) {
            Alert.alert('Weak Password', 'Please choose a stronger password.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Password Mismatch', 'Both passwords must match.');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email, otp_code, password);
            setIsCompleted(true);
        } catch (error) {
            Alert.alert('Error', error.message);
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

        if (strength <= 2) setPasswordStrengthLabel('Weak');
        else if (strength <= 4) setPasswordStrengthLabel('Medium');
        else setPasswordStrengthLabel('Strong');
    };

    const getStrengthBarColor = (index) => {
        if (passwordStrength <= 2) return index === 0 ? '#EF4444' : '#E5E7EB';
        if (passwordStrength <= 4) return index <= 1 ? '#FBBF24' : '#E5E7EB';
        return '#10B981';
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require('../../assets/animations/loading.json')}
                    autoPlay
                    loop
                    style={styles.loadingAnimation}
                />
                <Text style={styles.loadingText}>Please wait...</Text>
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
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email, OTP code, and new password to reset your password.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter OTP Code"
                            value={otp_code}
                            onChangeText={setOtpCode}
                            keyboardType="default"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="New Password"
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
                        Password must contain at least 8 characters, including uppercase, lowercase, number, and special
                        character.
                    </Text>

                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Confirm New Password"
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
                    {password !== confirmPassword && <Text style={styles.errorText}>Both passwords must match.</Text>}

                    <TouchableOpacity
                        style={[
                            styles.resetButton,
                            (passwordStrength <= 2 || password !== confirmPassword) && styles.disabledButton,
                        ]}
                        onPress={handlePasswordReset}
                        disabled={passwordStrength <= 2 || password !== confirmPassword}
                    >
                        <Text style={styles.resetButtonText}>Reset Password</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 30,
    },
    inputContainer: {
        marginBottom: 15,
        position: 'relative',
    },
    input: {
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
        fontSize: 14,
        marginBottom: 20,
    },
    requirementsText: {
        fontSize: 12,
        color: '#888',
        marginBottom: 20,
    },
    errorText: {
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
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
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
        fontSize: 18,
        marginTop: 10,
    },
});

export default ForgotPassword;
