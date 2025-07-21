// components/MenuButton.js
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MenuButton = ({ icon, description, onPress, isActive }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptics error in MenuButton:', error);
        }
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 150,
            friction: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 4,
        }).start();
    };

    return (
        <TouchableOpacity
            style={styles.menuButtonContainer}
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
        >
            <View style={styles.buttonContent}>
                <Animated.View
                    style={[
                        styles.menuIconContainer,
                        {
                            transform: [{ scale: scaleAnim }],
                            backgroundColor: isActive ? '#EBF4FF' : 'transparent',
                            borderColor: isActive ? '#4A90E2' : 'transparent',
                        },
                    ]}
                >
                    <Feather
                        name={icon}
                        size={24} // Diubah menjadi 24
                        color={isActive ? '#4A90E2' : '#64748B'}
                        style={styles.icon}
                    />
                </Animated.View>
                <Text
                    style={[
                        styles.menuButtonText,
                        {
                            color: isActive ? '#4A90E2' : '#64748B',
                            fontFamily: isActive ? 'Poppins-SemiBold' : 'Poppins-Regular',
                        },
                    ]}
                >
                    {description}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    menuButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
    },
    buttonContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
        paddingVertical: 8,
    },
    menuIconContainer: {
        borderRadius: 12,
        width: 52, // Diperbesar untuk menampung ikon 24
        height: 52, // Diperbesar untuk menampung ikon 24
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        borderWidth: 1,
    },
    menuButtonText: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
        letterSpacing: -0.3,
        marginTop: 6,
    },
});

export default MenuButton;
