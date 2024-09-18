import { View, Text } from 'react-native';
import React from 'react';
import ColorList from '../components/ColorList';
import { LinearGradient } from 'expo-linear-gradient'; // Ensure you import LinearGradient

const styles = {
    backgroundBox: {
        height: 125, // Set your desired height
        width: '100%', // Set your desired width
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1, // Ensure the gradient fills the backgroundBox
    },
};

const Tugas = () => {
    return (
        <View style={{ flex: 1 }}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient} // Apply the gradient to the entire backgroundBox
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
            <ColorList color="#4f46e5" />
        </View>
    );
};

export default Tugas;
