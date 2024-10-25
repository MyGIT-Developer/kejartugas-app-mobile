import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from 'styled-components/native';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import RootNavigator from './src/components/RootNavigator';
import { useFonts } from './src/utils/UseFonts';
import { Text, TextInput, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Theme untuk styled-components
const theme = {
    fonts: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins_600SemiBold',
        bold: 'Poppins-Bold',
        italic: 'Poppins-Italic',
    },
};

// Theme untuk react-native-paper
const paperTheme = {
    ...DefaultTheme,
    fonts: {
        ...DefaultTheme.fonts,
        regular: {
            fontFamily: 'Poppins-Regular',
        },
        medium: {
            fontFamily: 'Poppins-Medium',
        },
        light: {
            fontFamily: 'Poppins-Regular',
        },
        thin: {
            fontFamily: 'Poppins-Regular',
        },
    },
};

SplashScreen.preventAutoHideAsync();

export default function App() {
    const fontsLoaded = useFonts();

    useEffect(() => {
        if (fontsLoaded) {
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
        <PaperProvider theme={paperTheme}>
            <ThemeProvider theme={theme}>
                <NavigationContainer>
                    <RootNavigator />
                </NavigationContainer>
            </ThemeProvider>
        </PaperProvider>
    );
}

const styles = StyleSheet.create({
    defaultText: {
        fontFamily: 'Poppins-Regular',
    },
});
