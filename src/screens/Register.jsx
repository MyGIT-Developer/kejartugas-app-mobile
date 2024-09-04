import React, { useState, useEffect } from 'react';
import { StatusBar, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StyledContainer, PageLogo, FormContainer, Input, SubmitButton, ButtonText } from '../components/styles';
import { login } from '../api/auth';
import LogoKTApp from '../../assets/images/kt_app.png';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Font from 'expo-font';
import ReusableAlert from '../components/ReusableAlert'; // Import ReusableAlert
import { jwtDecode } from 'jwt-decode';

const Register = () => {
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

            // Log data response from API
            console.log('Login successful. Response data:', data);

            // Save login data to AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(data));
            console.log('User data saved to AsyncStorage.');

            // If there is a token, decode, save it, and log it
            if (data.token) {
                await AsyncStorage.setItem('token', data.token);
                const decodedToken = jwtDecode(data.token);
                console.log('ini yang udh di decode', decodedToken);
                console.log('Token saved to AsyncStorage.');
                
                const userJob = decodedToken.data.jobs_id.toString(); // Convert to string
                const companyId = decodedToken.data.company_id.toString(); // Convert to string
                const employeeId = decodedToken.data.id.toString(); // Convert to string                const expiredToken = new Date(data.expires_token * 1000).toISOString(); // Convert to ISO string
                const employeeName = decodedToken.data.employee_name;
                // Save token expiration time
                const expiresToken = data.expires_token;
                const expirationTime = new Date(expiresToken).toISOString();
                await AsyncStorage.setItem('expiredToken', expirationTime);
                console.log('Token expiration time saved to AsyncStorage.');

                // Retrieve token expiration time
                const retrievedExpirationTime = await AsyncStorage.getItem('expiredToken');
                if (retrievedExpirationTime) {
                    console.log('Retrieved token expiration time:', retrievedExpirationTime);
                } else {
                    console.error('Expiration time not found in AsyncStorage.');
                }

                // Save the converted string values
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
                if (navigation) {
                    navigation.navigate('App');
                } else {
                    console.error('Navigation is undefined.');
                }
            }, 1500);
        } catch (err) {
            console.error('Login failed:', err);
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
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
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
                            paddingTop: 10,
                            width: 303,
                            alignItems: 'center',
                            marginLeft: 24,
                            marginRight: 24,
                        }}
                    >
                        <PageLogo resizeMode="cover" source={LogoKTApp} />
                        <Text style={{ color: '#148FFF', fontSize: 18, fontWeight: '700', fontFamily: 'Poppins-Bold' }}>
                            Create An Account
                        </Text>
                        <FormContainer>
                        <Input
                                placeholder="Nama Karyawan"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                style={{ fontFamily: 'Poppins-Regular' }}
                            />
                             <Input
                                placeholder="Email"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                style={{ fontFamily: 'Poppins-Regular' }}
                            />
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
                              <Input
                                placeholder="Konfirmasi Password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                autoCapitalize="none"
                                style={{ fontFamily: 'Poppins-Regular' }}
                            />
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

export default Register;
