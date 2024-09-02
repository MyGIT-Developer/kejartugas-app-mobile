import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import SplashScreen from './src/screens/SplashScreen';
import RootNavigator from './src/components/RootNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        setIsUserLoggedIn(!!userData); // Set login status based on stored data
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };

    const timer = setTimeout(() => {
      setIsSplashVisible(false);
      checkLoginStatus();
    }, 3000); // Set splash screen duration

    return () => clearTimeout(timer);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  }

  return <RootNavigator />; // Use RootNavigator for app navigation
};

export default App;
