import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './AppNavigator';
import Login from '../screens/Login'; // Example login screen

const Stack = createStackNavigator();

const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="App" component={AppNavigator} />
      {/* You can add more screens here as needed */}
    </Stack.Navigator>
  </NavigationContainer>
);

export default RootNavigator;
