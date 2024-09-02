import styled from 'styled-components/native'; // Use 'styled-components/native' for React Native
import { View, Image, Text, TextInput, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';

// Expo Constants
const StatusBarHeight = Constants.statusBarHeight;

// Colors
export const Colors = {
    primary: '#ffffff',
    secondary: '#E5E7EB',
    tertiary: '#1F2937',
    darklight: '#9CA3AF',
    brand: '#6D28D9',
    green: '#10B981',
    red: '#EF4444',
};

const { primary, brand, darklight, tertiary } = Colors;

export const StyledContainer = styled(View)`
    flex: 1;
    padding: 25px;
    padding-top: ${StatusBarHeight + 10}px;
    background-color: ${primary};
`;

export const InnerContainer = styled(View)`
    flex: 1;
    width: 100%;
    align-items: center;
    justify-content: center;
`;

export const PageLogo = styled(Image)`
    width: 150px;
    height: 75px;
`;

export const PageTitle = styled(Text)`
    font-size: 24px;
    text-align: center;
    font-weight: bold;
    color: ${brand};
    padding: 10px;
`;

export const FormContainer = styled(View)`
    width: 100%;
    padding: 20px;
`;

export const Input = styled(TextInput)`
    width: 100%;
    height: 50px;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid ${darklight};
    border-radius: 5px;
    font-size: 16px;
    color: ${tertiary};
`;

export const SubmitButton = styled(TouchableOpacity)`
    width: 100%;
    height: 50px;
    background-color: ${brand};
    border-radius: 5px;
    justify-content: center;
    align-items: center;
`;

export const ButtonText = styled(Text)`
    color: ${primary};
    font-size: 18px;
    font-weight: bold;
`;
