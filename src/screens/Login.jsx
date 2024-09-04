// Login.js
import React, { useState, useEffect } from 'react';
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
import * as Font from 'expo-font';
import ReusableAlert from '../components/ReusableAlert';
import { jwtDecode } from 'jwt-decode';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [usernameFocused, setUsernameFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertType, setAlertType] = useState('success');
    const [fontsLoaded, setFontsLoaded] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        const loadFonts = async () => {
            try {
                await Font.loadAsync({
                    'Poppins-Regular': require('./../../assets/fonts/Poppins-Regular.ttf'),
                    'Poppins-Bold': require('./../../assets/fonts/Poppins-Bold.ttf'),
                });
                setFontsLoaded(true);
            } catch (error) {
                console.warn(error);
            }
        };
        loadFonts();
    }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            let message = '';
            if (!username && !password) {
                message = 'Username dan Password harus diisi';
            } else if (!username) {
                message = 'Username harus diisi';
            } else if (!password) {
                message = 'Password harus diisi';
            }
            setAlertMessage(message);
            setAlertType('error');
            setShowAlert(true);
            return;
        }

        try {
            const data = await login(username, password);

            console.log('Login successful. Response data:', data);

            await AsyncStorage.setItem('userData', JSON.stringify(data));
            console.log('User data saved to AsyncStorage.');

            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                console.log('Decoded token:', decodedToken);

                const userJob = decodedToken.data.jobs_id.toString();
                const companyId = decodedToken.data.company_id.toString();
                const employeeId = decodedToken.data.id.toString();
                const expiredToken = data.expires_token;
                await AsyncStorage.setItem('expiredToken', expiredToken);
                console.log('Token expiration time saved to AsyncStorage.');

                await AsyncStorage.setItem('userJob', userJob);
                await AsyncStorage.setItem('employeeId', employeeId);
                await AsyncStorage.setItem('companyId', companyId);
                await AsyncStorage.setItem('employee_name', username);
            }

            setAlertMessage('Login Berhasil! Anda akan diarahkan ke halaman utama.');
            setAlertType('success');
            setShowAlert(true);
            console.log('Before navigation:', navigation); // Check if navigation is defined
            setTimeout(() => {
                setShowAlert(false);
                navigation.navigate('App', { screen: 'Home' });
            }, 1500);
        } catch (err) {
            console.error('Login failed:', err);
            setAlertMessage(err.message);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleForgotPassword = () => {
        navigation.navigate('ForgotPassword');
    };

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
                                value={username}
                                onChangeText={setUsername}
                                onFocus={() => setUsernameFocused(true)}
                                onBlur={() => setUsernameFocused(false)}
                                autoCapitalize="none"
                                style={[styles.input, { borderBottomColor: usernameFocused ? '#148FFF' : '#E5E7EB' }]}
                            />
                            <TextInput
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                secureTextEntry
                                autoCapitalize="none"
                                style={[styles.input, { borderBottomColor: passwordFocused ? '#148FFF' : '#E5E7EB' }]}
                            />
                            <TouchableOpacity onPress={handleForgotPassword}>
                                <Text style={styles.forgotPasswordText}>Lupa Password?</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleLogin} style={styles.submitButton}>
                                <Text style={styles.submitButtonText}>Masuk</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <ReusableAlert
                    show={showAlert}
                    alertType={alertType}
                    message={alertMessage}
                    onConfirm={() => setShowAlert(false)}
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
