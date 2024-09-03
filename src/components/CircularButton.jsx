import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient'; // Import the LinearGradient component

const CircularButton = ({ title, onPress }) => {
    return (
        <TouchableOpacity style={styles.button} onPress={onPress}>
            <LinearGradient
                colors={['#0853AC', '#0086FF', '#9FD2FF']} // Adjust colors as needed
                style={styles.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.iconContainer}>
                    <Icon name="alarm" size={50} color="#fff" /> 
                </View>
                <Text style={styles.title}>{title}</Text>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        width: 125, // Width of the button
        height: 125, // Height of the button
        borderRadius: 100, // Make it circular
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    gradient: {
        flex: 1, // Ensure the gradient covers the entire button
        borderRadius: 50, // Match the border radius to make it circular
        alignItems: 'center',
        justifyContent: 'center',
        width: 125, // Width of the button
        height: 125, // Height of the button
        borderRadius: 100, // Make it circular
    },
    iconContainer: {
        marginBottom: 5,
    },
    title: {
        color: '#fff',
        fontSize: 14,
        textAlign: 'center',
    },
});

export default CircularButton;
