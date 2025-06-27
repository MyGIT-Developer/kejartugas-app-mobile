import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';

// Expo Constants
const StatusBarHeight = Constants.statusBarHeight;

// Colors
export const Colors = {
    primary: '#ffffff',
    secondary: '#E5E7EB',
    tertiary: '#1F2937',
    darkLight: '#9CA3AF',
    brand: '#6D28D9',
    green: '#10B981',
    red: '#EF4444',
    gray: '#6B7280',
    lightGray: '#F3F4F6',
    black: '#000000',
    blue: '#3B82F6',
};

// Common Styles
export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 25,
        paddingTop: StatusBarHeight + 30,
        backgroundColor: Colors.primary,
    },
    innerContainer: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
    },
    pageTitle: {
        fontSize: 30,
        textAlign: 'center',
        fontWeight: 'bold',
        color: Colors.brand,
        padding: 10,
    },
    subTitle: {
        fontSize: 18,
        marginBottom: 20,
        letterSpacing: 1,
        fontWeight: 'bold',
        color: Colors.tertiary,
    },
    formArea: {
        width: '90%',
    },
    textInput: {
        backgroundColor: Colors.secondary,
        padding: 15,
        paddingLeft: 55,
        paddingRight: 55,
        borderRadius: 5,
        fontSize: 16,
        height: 60,
        marginVertical: 3,
        marginBottom: 10,
        color: Colors.tertiary,
    },
    leftIcon: {
        left: 15,
        top: 38,
        position: 'absolute',
        zIndex: 1,
    },
    rightIcon: {
        right: 15,
        top: 38,
        position: 'absolute',
        zIndex: 1,
    },
    button: {
        padding: 15,
        backgroundColor: Colors.brand,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
        marginVertical: 5,
        height: 60,
    },
    buttonText: {
        color: Colors.primary,
        fontSize: 16,
    },
    msgBox: {
        textAlign: 'center',
        fontSize: 13,
    },
    line: {
        height: 1,
        width: '100%',
        backgroundColor: Colors.darkLight,
        marginVertical: 10,
    },
    extraView: {
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    extraText: {
        justifyContent: 'center',
        alignContent: 'center',
        color: Colors.tertiary,
        fontSize: 15,
    },
    textLink: {
        color: Colors.brand,
        fontSize: 15,
    },
});

export default commonStyles;
