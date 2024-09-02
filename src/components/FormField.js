import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { useTailwind } from 'tailwind-rn';

const FormField = ({ label, value, onChangeText, placeholder, secureTextEntry }) => {
    const tailwind = useTailwind();

    return (
        <View style={tailwind('mb-4')}>
            {label && <Text style={tailwind('text-sm font-poppins mb-2')}>{label}</Text>}
            <TextInput
                style={tailwind('border border-gray-300 p-3 rounded-md font-poppins')}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                secureTextEntry={secureTextEntry}
            />
        </View>
    );
};

export default FormField;
