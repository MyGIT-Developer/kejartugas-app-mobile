import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import * as Animatable from 'react-native-animatable';
import { useNavigation } from '@react-navigation/native';

const FloatingButtonProject = () => {
    const navigator = useNavigation();
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleGoToCreate = () => {
        navigator.navigate('AddProjectForm');
    };

    return (
        <View style={styles.container}>
            {isOpen && (
                <View style={styles.menu}>
                    <Animatable.View animation="bounceIn" style={styles.button}>
                        <TouchableOpacity onPress={() => alert('Create')}>
                            <Icon name="plus" size={26} color="#148FFF" onPress={handleGoToCreate}/>
                        </TouchableOpacity>
                    </Animatable.View>
                    <Animatable.View animation="bounceIn" style={styles.button}>
                        <TouchableOpacity onPress={() => alert('Update')}>
                            <Icon name="refresh-cw" size={26} color="#148FFF" />
                        </TouchableOpacity>
                    </Animatable.View>
                </View>
            )}
            <TouchableOpacity onPress={toggleMenu} style={styles.floatingButton}>
                <Icon name={isOpen ? 'x' : 'plus'} size={26} color="#148FFF" />
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

export default FloatingButtonProject;
