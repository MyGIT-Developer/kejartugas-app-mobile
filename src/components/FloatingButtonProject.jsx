import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Animatable from 'react-native-animatable';

const FloatingButtonProject = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <View style={styles.container}>
            {isOpen && (
                <View style={styles.menu}>
                    <Animatable.View animation="bounceIn" style={styles.button}>
                        <TouchableOpacity onPress={() => alert('Create')}>
                            <Icon name="plus" size={24} color="#fff" />
                        </TouchableOpacity>
                    </Animatable.View>
                    <Animatable.View animation="bounceIn" style={styles.button}>
                        <TouchableOpacity onPress={() => alert('Update')}>
                            <Icon name="refresh-cw" size={24} color="#fff" />
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
            )}
            <TouchableOpacity onPress={toggleMenu} style={styles.floatingButton}>
                <Icon name={isOpen ? 'x' : 'plus'} size={24} color="#fff" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80,
        right: 20,
        alignItems: 'center',
    },
    floatingButton: {
        backgroundColor: '#0891b2',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    menu: {
        position: 'absolute',
        bottom: 70,
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#0891b2',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 5,
    },
});

export default FloatingButtonProject;
