import { DefaultTheme } from 'react-native-paper';

// Theme untuk styled-components
export const styledTheme = {
    fonts: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins_600SemiBold',
        bold: 'Poppins-Bold',
        italic: 'Poppins-Italic',
    },
};

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
