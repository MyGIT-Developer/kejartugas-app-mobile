import React from 'react';
import { View, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const FloatingButtonTask = ({ projectData }) => {
    const navigator = useNavigation();
    
    const handleGoToCreate = () => {
        navigator.navigate('TaskForm', {
            projectData: projectData
        });
    };

    return (
        <TouchableOpacity 
            onPress={handleGoToCreate} 
            style={styles.floatingButton}
            activeOpacity={0.7}
        >
            <Icon name="plus" size={26} color="#148FFF" />
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    floatingButton: {
        position: 'absolute',
        bottom: 280,
        // top: 300,
        right: 20,
        backgroundColor: '#fff',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        zIndex: 9999,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
    }
});

export default FloatingButtonTask;