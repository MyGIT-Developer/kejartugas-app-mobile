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

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const fontsLoaded = useFonts();
    const navigation = useNavigation();

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleInputChange = useCallback((field, value) => {
        setCredentials((prev) => ({ ...prev, [field]: value }));
    }, []);

    const showAlert = useCallback((message, type = 'error') => {
        setAlert({ show: true, message, type });
    }, []);

    const handleLogin = useCallback(async () => {
        const { username, password } = credentials;
        if (!username || !password) {
            showAlert(
                !username && !password
                    ? 'Username dan Password harus diisi'
                    : !username
                      ? 'Username harus diisi'
                      : 'Password harus diisi',
            );
            return;
        }

        try {
            // Login process
            const data = await loginMobile(username, password);
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
                    AsyncStorage.setItem('employee_name', username),
                    AsyncStorage.setItem('access_permissions', JSON.stringify(data.access_permissions)),
                ]);

                try {
                    // Setup notifications
                    await setupNotifications();

                    console.log('Access Permissions:', data.access_permissions);
                    showAlert('Login Berhasil! Anda akan diarahkan ke halaman utama.', 'success');

                    setTimeout(() => {
                        setAlert((prev) => ({ ...prev, show: false }));
                        navigation.navigate('App', { screen: 'Home' });
                    }, 1500);
                } catch (notificationError) {
                    // Don't block login if notification setup fails
                    console.error('Error setting up notifications:', notificationError);
                    // Still proceed with login
                    showAlert('Login Berhasil! Anda akan diarahkan ke halaman utama.', 'success');
                    setTimeout(() => {
                        setAlert((prev) => ({ ...prev, show: false }));
                        navigation.navigate('App', { screen: 'Home' });
                    }, 1500);
                }
            } else {
                throw new Error('Login gagal: Data tidak lengkap');
            }
        } catch (err) {
            showAlert(err.message);
        }
    }, [credentials, navigation, showAlert]);

    const togglePasswordVisibility = useCallback(() => {
        setPasswordVisible((prev) => !prev);
    }, []);

    const handleAlertConfirm = useCallback(() => {
        setAlert((prev) => ({ ...prev, show: false }));
    }, []);

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
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
                    />
                    <PasswordField
                        value={credentials.password}
                        onChangeText={(value) => handleInputChange('password', value)}
                        passwordVisible={passwordVisible}
                        togglePasswordVisibility={togglePasswordVisibility}
                    />
                    <TouchableOpacity
                        onPress={() => navigation.navigate('ForgotPassword')}
                        style={styles.forgotPasswordContainer}
                    >
                        <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
                        <Text style={styles.loginButtonText}>Login</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('BoardingScreen')}>
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

const InputField = ({ label, value, onChangeText, placeholder }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput placeholder={placeholder} value={value} onChangeText={onChangeText} style={styles.input} />
    </View>
);

const PasswordField = ({ value, onChangeText, passwordVisible, togglePasswordVisibility }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
            <TextInput
                placeholder="Masukkan Password"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={!passwordVisible}
                style={styles.passwordInput}
            />
            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.showButton}>
                <Text style={styles.showButtonText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
        </View>
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
        fontSize: 16,
        marginBottom: 5,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 5,
        padding: 10,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ccc',
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
        fontSize: 16,
    },
    showButton: {
        padding: 10,
        borderLeftWidth: 1,
        borderLeftColor: '#ccc',
    },
    showButtonText: {
        color: '#007AFF',
        fontSize: 14,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-start',
        marginBottom: 20,
    },
    forgotPasswordText: {
        color: '#000',
        fontSize: 14,
    },
    loginButton: {
        backgroundColor: '#007AFF',
        borderRadius: 5,
        padding: 15,
        width: '100%',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerText: {
        marginTop: 20,
        flexDirection: 'row',
    },
    registerTextBlack: {
        color: '#000',
    },
    registerTextBlue: {
        color: '#007AFF',
    },
    footerText: {
        position: 'absolute',
        bottom: 10,
        width: '100%',
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
    },
});

export default Login;
