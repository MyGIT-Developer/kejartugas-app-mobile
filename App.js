import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import RootNavigator from './src/components/RootNavigator';
import { useFonts } from './src/utils/UseFonts';
import { Text, TextInput, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen'; // Import SplashScreen

const theme = {
    fonts: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins_600SemiBold',
        bold: 'Poppins-Bold',
        italic: 'Poppins-Italic',
    },
};

SplashScreen.preventAutoHideAsync(); // Prevent the splash screen from auto-hiding

export default function App() {
    const fontsLoaded = useFonts();

    useEffect(() => {
        if (fontsLoaded) {
            // Hide the splash screen after 3 seconds
            setTimeout(async () => {
                await SplashScreen.hideAsync();
            }, 3000);
        }
    }, [fontsLoaded]);

    if (!fontsLoaded) {
        return null;
    }

    // Override the default text styles
    const oldTextRender = Text.render;
    Text.render = function (...args) {
        const origin = oldTextRender.call(this, ...args);
        return React.cloneElement(origin, {
            style: [styles.defaultText, origin.props.style],
        });
    };

    // Override the default TextInput styles
    const oldTextInputRender = TextInput.render;
    TextInput.render = function (...args) {
        const origin = oldTextInputRender.call(this, ...args);
        return React.cloneElement(origin, {
            style: [styles.defaultText, origin.props.style],
        });
    };

    return (
        <ThemeProvider theme={theme}>
            <NavigationContainer>
                <RootNavigator />
            </NavigationContainer>
        </ThemeProvider>
    );
}

const styles = StyleSheet.create({
    defaultText: {
        fontFamily: 'Poppins-Regular',
    },
});
