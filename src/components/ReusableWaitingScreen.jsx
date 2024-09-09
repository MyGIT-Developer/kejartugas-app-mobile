import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LottieView from 'lottie-react-native';

const ReusableWaitingScreen = ({ title, subtitle, animationFile, buttonText, onButtonPress, buttonDelay = 3000 }) => {
    const [showButton, setShowButton] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowButton(true);
        }, buttonDelay);

        return () => clearTimeout(timer);
    }, [buttonDelay]);

    return (
        <View style={styles.container}>
            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>

            <View style={styles.visualContainer}>
                {animationFile && (
                    <LottieView
                        source={animationFile}
                        autoPlay
                        loop
                        style={styles.animation}
                        resizeMode="cover" // Ensure the Lottie animation scales correctly
                    />
                )}
            </View>

            {showButton && (
                <TouchableOpacity style={styles.button} onPress={onButtonPress}>
                    <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    textContainer: {
        alignSelf: 'flex-start',
        marginTop: Platform.OS === 'ios' ? 60 : 40,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'left',
        fontFamily: 'Poppins-Bold',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'left',
        color: '#6B7280',
        fontFamily: 'Poppins-Regular',
    },
    visualContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%', // Ensure the container spans the width of the screen
        marginVertical: 20, // Add some vertical margin for better spacing
    },
    animation: {
        width: '80%', // Ensure the animation scales properly
        height: 300, // Adjust height based on content
        resizeMode: 'cover', // Adjust the mode to ensure it scales well
    },
    button: {
        backgroundColor: '#007BFF',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        width: '100%',
        marginBottom: 30,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
    },
});

export default ReusableWaitingScreen;
