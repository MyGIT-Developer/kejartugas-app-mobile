import React from 'react';
import { createStackNavigator, CardStyleInterpolators  } from '@react-navigation/stack';
import AppNavigator from '../components/AppNavigator';
import Login from '../screens/Login';
import WaitingMail from '../screens/WaitingMail';
import ForgotPassword from '../screens/ForgotPassword';
import SplashScreen from '../screens/SplashScreen'; // Ensure this import is correct
import Register from '../screens/Register';
import DetailKehadiran from '../screens/DetailKehadiran';

const Stack = createStackNavigator();

const RootNavigator = () => (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            gestureEnabled: true,
            gestureDirection: 'horizontal', // Enable sliding gestures
            cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
        }}
    >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Register" component={Register} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
        <Stack.Screen name="WaitingMail" component={WaitingMail} />
        <Stack.Screen name="App" component={AppNavigator} />
        <Stack.Screen name="DetailKehadiran" component={DetailKehadiran} />
    </Stack.Navigator>
);

export default RootNavigator;
