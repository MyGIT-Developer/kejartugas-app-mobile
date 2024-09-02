import React, { useState, useEffect } from 'react';
import { StatusBar, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyledContainer, PageLogo, FormContainer, Input, SubmitButton, ButtonText } from '../components/styles';
import { login } from './../api/auth';
import LogoKTApp from './../../assets/images/kt_app.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import ReusableAlert from '../components/ReusableAlert'; // Import ReusableAlert

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
            await AsyncStorage.setItem('userData', JSON.stringify(data));
            setAlertMessage('Login Berhasil! Anda akan diarahkan ke halaman utama.');
            setAlertType('success');
            setShowAlert(true);
            setTimeout(() => {
                setShowAlert(false);
                navigation.navigate('App');
            }, 1500);
        } catch (err) {
            setAlertMessage(err.message);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    if (!fontsLoaded) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>Loading...</Text>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
            <LinearGradient
                colors={['#0853AC', '#0086FF', '#9FD2FF']}
                style={{ flex: 1 }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <StatusBar barStyle="dark-content" />
                <StyledContainer
                    style={{ backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' }}
                >
                    <View
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: 15,
                            padding: 20,
                            width: 303,
                            height: 385,
                            alignItems: 'center',
                            marginLeft: 24,
                            marginRight: 24,
                        }}
                    >
                        <PageLogo resizeMode="cover" source={LogoKTApp} />
                        <Text style={{ color: '#148FFF', fontSize: 18, fontWeight: '700', fontFamily: 'Poppins-Bold' }}>
                            Log In Akun
                        </Text>
                        <FormContainer>
                            <Input
                                placeholder="Username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                style={{ fontFamily: 'Poppins-Regular' }}
                            />
                            <Input
                                placeholder="Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                style={{ fontFamily: 'Poppins-Regular' }}
                            />
                            <Text
                                style={{
                                    color: '#148FFF',
                                    fontSize: 13,
                                    fontWeight: '500',
                                    fontFamily: 'Poppins-Regular',
                                    marginTop: 6,
                                }}
                            >
                                Lupa Password?
                            </Text>
                            <SubmitButton
                                onPress={handleLogin}
                                style={{
                                    backgroundColor: '#148FFF',
                                    borderRadius: 12,
                                    height: 36,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    elevation: 5,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    marginTop: 18,
                                }}
                            >
                                <ButtonText style={{ fontFamily: 'Poppins-Bold' }}>Masuk</ButtonText>
                            </SubmitButton>
                        </FormContainer>
                    </View>
                </StyledContainer>

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

export default Login;
