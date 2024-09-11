import React, { useState, useEffect } from 'react';
import { TextInput, View, Text, StyleSheet } from 'react-native';
import { useFonts } from '../utils/UseFonts';

const FormField = ({ label, value, onChangeText, placeholder, secureTextEntry }) => {
    const [isFocused, setIsFocused] = useState(false);
    const fontsLoaded = useFonts();

    const handleChangeText = (text) => {
        onChangeText(text);
    };

    if (!fontsLoaded) {
        return null; // or a loading indicator
    }

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[styles.input, isFocused && styles.inputFocused]}
                value={value}
                onChangeText={handleChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        padding: 12,
        borderRadius: 6,
        fontFamily: 'Poppins-Regular',
    },
    inputFocused: {
        borderColor: '#3b82f6',
    },
});

export default FormField;
