import React, { useState, useCallback, useEffect } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
    ImageBackground,
    Keyboard,
    ActivityIndicator,
    ToastAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { jwtDecode } from 'jwt-decode';
import { loginMobile } from '../api/auth';
import LogoKTApp from '../../assets/images/kt_logo_app.png';
import BackgroundImage from '../../assets/images/kt_city_scapes.png';
import ReusableAlert from '../components/ReusableAlert';
import { useFonts } from '../utils/UseFonts';
import NotificationService from '../utils/notificationService';
import { setupNotifications } from '../api/notification';
import { FONTS } from '../constants/fonts';
import { LinearGradient } from 'expo-linear-gradient';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [inputErrors, setInputErrors] = useState({ username: '', password: '' });
    const fontsLoaded = useFonts();
    const navigation = useNavigation();

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        // Clear sensitive data on unmount
        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            setCredentials({ username: '', password: '' });
        };
    }, []);

    // Input validation function
    const validateInputs = useCallback(() => {
        const { username, password } = credentials;
        const errors = { username: '', password: '' };
        let isValid = true;

        if (!username.trim()) {
            errors.username = 'Username tidak boleh kosong';
            isValid = false;
        } else if (username.length < 3) {
            errors.username = 'Username minimal 3 karakter';
            isValid = false;
        }

        if (!password) {
            errors.password = 'Password tidak boleh kosong';
            isValid = false;
        } else if (password.length < 6) {
            errors.password = 'Password minimal 6 karakter';
            isValid = false;
        }

        setInputErrors(errors);
        return isValid;
    }, [credentials]);

    // Enhanced error message handler
    const getErrorMessage = useCallback((error) => {
        // Prefer server-provided message when available
        const serverMessage = error.response?.data?.message || error.response?.data?.error;
        if (serverMessage) return serverMessage;

        if (error.response?.status === 401) {
            return 'Username atau password salah';
        }
        if (error.response?.status === 500) {
            return 'Server sedang bermasalah, coba lagi nanti';
        }
        if (error.response?.status === 429) {
            return 'Terlalu banyak percobaan login, coba lagi nanti';
        }
        if (!error.response) {
            return 'Tidak ada koneksi internet';
        }
        return error.message || 'Terjadi kesalahan tidak terduga';
    }, []);

    const handleInputChange = useCallback(
        (field, value) => {
            setCredentials((prev) => ({ ...prev, [field]: value }));
            // Clear error when user starts typing
            if (inputErrors[field]) {
                setInputErrors((prev) => ({ ...prev, [field]: '' }));
            }
        },
        [inputErrors],
    );

    const showAlert = useCallback((message, type = 'error') => {
        setAlert({ show: true, message, type });
    }, []);

    const handleLogin = useCallback(async () => {
        // Prevent double submission
        if (isLoading) return;

        // Validate inputs first
        if (!validateInputs()) {
            return;
        }

        setIsLoading(true);
        const { username, password } = credentials;

        try {
            // Login process
            const data = await loginMobile(username.trim(), password);
            await AsyncStorage.setItem('userData', JSON.stringify(data));

            if (data.token && data.access_permissions) {
                const decodedToken = jwtDecode(data.token);
                const { jobs_id, company_id, id, role_id } = decodedToken.data;

                // Store user data
                await Promise.all([
                    AsyncStorage.setItem('token', data.token),
                    AsyncStorage.setItem('expiredToken', data.expires_token),
                    AsyncStorage.setItem('userJob', jobs_id.toString()),
                    AsyncStorage.setItem('userRole', role_id.toString()),
                    AsyncStorage.setItem('employeeId', id.toString()),
                    AsyncStorage.setItem('companyId', company_id.toString()),
                    AsyncStorage.setItem('employee_name', username.trim()),
                    AsyncStorage.setItem('access_permissions', JSON.stringify(data.access_permissions)),
                ]);

                try {
                    // Setup notifications
                    await setupNotifications();
                    console.log('Access Permissions:', data.access_permissions);
                } catch (notificationError) {
                    // Don't block login if notification setup fails
                    console.error('Error setting up notifications:', notificationError);
                }

                showAlert('Login Berhasil! Anda akan diarahkan ke halaman utama.', 'success');

                setTimeout(() => {
                    setAlert((prev) => ({ ...prev, show: false }));
                    navigation.navigate('App', { screen: 'Home' });
                }, 1500);
            } else {
                throw new Error('Login gagal: Data tidak lengkap');
            }
        } catch (err) {
            showAlert(getErrorMessage(err));
        } finally {
            setIsLoading(false);
        }
    }, [credentials, navigation, showAlert, isLoading, validateInputs, getErrorMessage]);

    const togglePasswordVisibility = useCallback(() => {
        setPasswordVisible((prev) => !prev);
    }, []);

    const handleAlertConfirm = useCallback(() => {
        setAlert((prev) => ({ ...prev, show: false }));
    }, []);

    // Handle register button press with toast message
    const handleRegisterPress = useCallback(() => {
        // Show toast message
        if (Platform.OS === 'android') {
            ToastAndroid.show('Untuk melakukan pendaftaran silahkan kunjungi KejarTugas.com', ToastAndroid.LONG);
        } else {
            // For iOS, use alert as fallback since ToastAndroid is Android only
            showAlert('Untuk melakukan pendaftaran silahkan kunjungi KejarTugas.com', 'info');
        }

        // Still navigate to WebView (keeping existing functionality)
        // navigation.navigate('WebViewScreen', {
        //     url: 'https://app.kejartugas.com/register/free',
        //     title: 'Daftar KejarTugas',
        // });
    }, [navigation, showAlert]);

    if (!fontsLoaded) {
        return (
            <View style={styles.centeredLoadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <ImageBackground source={BackgroundImage} style={styles.backgroundImage}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
                <View style={styles.card}>
                    <Image source={LogoKTApp} style={styles.logo} resizeMode="contain" />
                    <InputField
                        label="User Name"
                        value={credentials.username}
                        onChangeText={(value) => handleInputChange('username', value)}
                        placeholder="Masukkan Username"
                        error={inputErrors.username}
                        editable={!isLoading}
                    />
                    <PasswordField
                        value={credentials.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        passwordVisible={passwordVisible}
                        togglePasswordVisibility={togglePasswordVisibility}
                        error={inputErrors.password}
                        editable={!isLoading}
                        placeholder="Masukkan Password"
                    />
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotPasswordContainer}
                    >
                        <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={handleLogin}
                        style={[{ width: '100%' }, isLoading && styles.loginButtonDisabled]}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={isLoading ? ['#ccc', '#727272ff'] : ['#007AFF', '#0051A8']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.loginButton}
                        >
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#fff" />
                                    <Text style={[styles.loginButtonText, { marginLeft: 10 }]}>Logging in...</Text>
                                </View>
                            ) : (
                                <Text style={styles.loginButtonText}>Login</Text>
                            )}
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleRegisterPress}>
                        <Text style={styles.registerText}>
                            <Text style={styles.registerTextBlack}>Belum punya akun? </Text>
                            <Text style={styles.registerTextBlue}>Daftar sekarang!</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
            {!keyboardVisible && <FooterText />}
            <ReusableAlert
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={handleAlertConfirm}
            />
        </ImageBackground>
    );
};

const InputField = ({ label, value, onChangeText, placeholder, error, editable = true }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            placeholder={placeholder}
            value={value}
            onChangeText={onChangeText}
            style={[styles.input, error && styles.inputError]}
            editable={editable}
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#888"
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

const PasswordField = ({
    value,
    onChangeText,
    passwordVisible,
    togglePasswordVisibility,
    error,
    editable = true,
    placeholder,
}) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={[styles.passwordContainer, error && styles.inputError]}>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!passwordVisible}
                style={styles.passwordInput}
                editable={editable}
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#888"
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.showButton}>
                <Text style={styles.showButtonText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
);

const FooterText = () => (
    <Text style={styles.footerText}>
        © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
    </Text>
);

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        alignItems: 'center',
    },
    logo: {
        width: 200,
        height: 80,
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 15,
    },
    label: {
        fontSize: FONTS.size.md,
        marginBottom: 5,
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 10,
        fontSize: FONTS.size.md,
        borderWidth: 1,
        borderColor: '#ccc',
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
        color: '#000',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    passwordInput: {
        flex: 1,
        padding: 10,
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
        color: '#000',
    },
    showButton: {
        padding: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#ccc',
    },
    showButtonText: {
        color: '#007AFF',
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    forgotPasswordText: {
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
        color: '#000',
        fontSize: FONTS.size.md,
    },
    loginButton: {
        borderRadius: 5,
        padding: 10,
        width: '100%',
        alignItems: 'center',
    },
    loginButtonDisabled: {
        backgroundColor: '#ccc',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.semiBold,
    },
    inputError: {
        borderColor: '#ff3333',
        borderWidth: 1,
    },
    errorText: {
        color: '#ff3333',
        fontSize: FONTS.size.sm,
        marginTop: 5,
        fontFamily: FONTS.family.regular,
        letterSpacing: -0.5,
    },
    centeredLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#007AFF',
        fontFamily: FONTS.family.regular,
    },
    registerText: {
        marginTop: 20,
        flexDirection: 'row',
        letterSpacing: -0.5,
        fontSize: FONTS.size.md,
    },
    registerTextBlack: {
        color: '#000',
        fontFamily: FONTS.family.regular,
    },
    registerTextBlue: {
        color: '#007AFF',
        fontFamily: FONTS.family.semiBold,
    },
    footerText: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
        fontFamily: FONTS.family.regular,
    },
});

export default Login;
