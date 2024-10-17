import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const FloatingButtonTask = ({ projectData }) => {
    const navigator = useNavigation();
    
    const handleGoToCreate = () => {
        navigator.navigate('AddTaskForm', { projectData }); // Pass projectData as a parameter
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={handleGoToCreate} style={styles.floatingButton}>
                <Icon name="plus" size={26} color="#148FFF" />
            </TouchableOpacity>
        </View>
    );
};


const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        right: 20,
        alignItems: 'center',
    },
    floatingButton: {
        backgroundColor: '#fff',
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
        backgroundColor: '#fff',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        elevation: 5,
    },
});

export default FloatingButtonTask;
