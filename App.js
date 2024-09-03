import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import SplashScreen from './src/screens/SplashScreen';
import RootNavigator from './src/components/RootNavigator';
import Login from './src/screens/Login'; // Ensure this path is correct

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null); // null indicates loading state

    const handleAuthenticationCheck = (authStatus) => {
        setIsAuthenticated(authStatus);
    };

    if (isAuthenticated === null) {
        // Still checking authentication, show splash screen
        return <SplashScreen onAuthCheck={handleAuthenticationCheck} />;
    }

    return <NavigationContainer>{isAuthenticated ? <RootNavigator /> : <Login />}</NavigationContainer>;
};

export default App;
