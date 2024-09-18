import React, { useState, useCallback } from 'react';
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
import { login } from './../api/auth';
import LogoKTApp from '../../assets/images/kt_app.png';
import BackgroundImage from '../../assets/images/kt_city_scapes.png';
import { useNavigation } from '@react-navigation/native';
import ReusableAlert from '../components/ReusableAlert'; // Import the ReusableAlert component
import { useFonts } from '../utils/UseFonts';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const fontsLoaded = useFonts();
    const navigation = useNavigation();

    React.useEffect(() => {
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
            const data = await login(username, password);
            await AsyncStorage.setItem('userData', JSON.stringify(data));

            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                const { jobs_id, company_id, id } = decodedToken.data;

                await Promise.all([
                    AsyncStorage.setItem('expiredToken', data.expires_token),
                    AsyncStorage.setItem('userJob', jobs_id.toString()),
                    AsyncStorage.setItem('employeeId', id.toString()),
                    AsyncStorage.setItem('companyId', company_id.toString()),
                    AsyncStorage.setItem('employee_name', username),
                ]);
            }

            showAlert('Login Berhasil! Anda akan diarahkan ke halaman utama.', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Home' });
            }, 1500);
        } catch (err) {
            showAlert(err.message);
        }
    }, [credentials, navigation, showAlert]);

    const togglePasswordVisibility = () => {
        setPasswordVisible(!passwordVisible);
    };

    const handleAlertConfirm = () => {
        setAlert((prev) => ({ ...prev, show: false }));
    };

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
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>User Name</Text>
                        <TextInput
                            placeholder="Masukkan Username"
                            value={credentials.username}
                            onChangeText={(value) => handleInputChange('username', value)}
                            style={styles.input}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.passwordContainer}>
                            <TextInput
                                placeholder="Masukkan Password"
                                value={credentials.password}
                                onChangeText={(value) => handleInputChange('password', value)}
                                secureTextEntry={!passwordVisible}
                                style={styles.passwordInput}
                            />
                            <TouchableOpacity onPress={togglePasswordVisibility} style={styles.showButton}>
                                <Text style={styles.showButtonText}>{passwordVisible ? 'Hide' : 'Show'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
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
            {!keyboardVisible && (
                <Text style={styles.footerText}>
                    © 2024 KejarTugas.com by PT Global Innovation Technology. All rights reserved.
                </Text>
            )}
            <ReusableAlert
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={handleAlertConfirm}
            />
        </ImageBackground>
    );
};

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
