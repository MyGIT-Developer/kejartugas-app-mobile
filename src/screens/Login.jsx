import React, { useState, useCallback } from 'react';
import {
    StatusBar,
    KeyboardAvoidingView,
    Platform,
    Text,
    View,
    TouchableOpacity,
    StyleSheet,
    Image,
    TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login } from './../api/auth';
import LogoKTApp from '../../assets/images/k_logo.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ReusableAlert from '../components/ReusableAlert';
import { useFonts } from '../utils/UseFonts';
import { Ionicons } from '@expo/vector-icons';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [focusedField, setFocusedField] = useState(null);
    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });
    const [passwordVisible, setPasswordVisible] = useState(false);
    const fontsLoaded = useFonts();
    const navigation = useNavigation();

    const handleInputChange = useCallback((field, value) => {
        setCredentials((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleFocus = useCallback((field) => setFocusedField(field), []);
    const handleBlur = useCallback(() => setFocusedField(null), []);

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
            console.error('Login failed:', err);
            showAlert(err.message);
        }
    }, [credentials, navigation, showAlert]);

    if (!fontsLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <StatusBar barStyle="dark-content" />
                <View style={styles.innerContainer}>
                    <View style={styles.formContainer}>
                        <Image source={LogoKTApp} style={styles.pageLogo} resizeMode="cover" />
                        <Text style={styles.title}>Log In Akun</Text>
                        <View style={styles.form}>
                            <TextInput
                                placeholder="Username"
                                value={credentials.username}
                                onChangeText={(value) => handleInputChange('username', value)}
                                onFocus={() => handleFocus('username')}
                                onBlur={handleBlur}
                                autoCapitalize="none"
                                style={[
                                    styles.input,
                                    { borderBottomColor: focusedField === 'username' ? '#148FFF' : '#E5E7EB' },
                                ]}
                            />
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    placeholder="Password"
                                    value={credentials.password}
                                    onChangeText={(value) => handleInputChange('password', value)}
                                    onFocus={() => handleFocus('password')}
                                    onBlur={handleBlur}
                                    secureTextEntry={!passwordVisible}
                                    autoCapitalize="none"
                                    style={[
                                        styles.input,
                                        { borderBottomColor: focusedField === 'password' ? '#148FFF' : '#E5E7EB' },
                                    ]}
                                />
                                <TouchableOpacity
                                    onPress={() => setPasswordVisible(!passwordVisible)}
                                    style={styles.iconContainer}
                                >
                                    <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={24} color="gray" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('SentEmail')}>
                                <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogin} style={styles.submitButton}>
                                <Text style={styles.submitButtonText}>Masuk</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <ReusableAlert
                    show={alert.show}
                    alertType={alert.type}
                    message={alert.message}
                    onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
                />
            </LinearGradient>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    formContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: 320,
        alignItems: 'center',
    },
    pageLogo: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    title: {
        color: '#148FFF',
        fontSize: 20,
        fontWeight: '700',
        fontFamily: 'Poppins-Bold',
        marginBottom: 20,
    },
    form: {
        width: '100%',
    },
    input: {
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        padding: 12,
        marginBottom: 12,
        fontFamily: 'Poppins-Regular',
    },
    passwordContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    iconContainer: {
        position: 'absolute',
        right: 10,
        top: 10,
    },
    forgotPasswordText: {
        color: '#148FFF',
        fontSize: 13,
        fontWeight: '500',
        fontFamily: 'Poppins-Regular',
        marginTop: 6,
        alignSelf: 'flex-end',
    },
    submitButton: {
        backgroundColor: '#148FFF',
        borderRadius: 12,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        marginTop: 18,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-Bold',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Login;
