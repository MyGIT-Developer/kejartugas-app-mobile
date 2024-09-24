import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SlidingButton = ({ fragments, activeFragment, onPress }) => {
    return (
        <View style={styles.outerContainer}>
            <View style={styles.buttonContainer}>
                {fragments.map((fragment, index) => (
                    <TouchableOpacity
                        key={index}
                        style={[
                            styles.button,
                            activeFragment === index && styles.activeButton,
                        ]}
                        onPress={() => onPress(index)}
                    >
                        <Text 
                            style={[
                                styles.buttonText,
                                activeFragment === index && styles.activeButtonText
                            ]}
                        >
                            {fragment.title}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        marginBottom: 20,
        borderRadius: 25,
        overflow: 'hidden',
        borderColor: 'white',
        borderWidth: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
    },
    button: {
        padding: 10,
    },
    activeButton: {
        backgroundColor: 'white',
        borderRadius: 25,
    },
    buttonText: {
        color: '#fff',
    },
    activeButtonText: {
        color: '#238FBA',
    },
});

export default SlidingButton;