import { DefaultTheme } from 'react-native-paper';

// Theme untuk react-native-paper
export const paperTheme = {
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
