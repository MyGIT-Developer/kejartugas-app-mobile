// src/components/ReusableHeader.js
import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const ReusableHeader = () => {
    const navigation = useNavigation();

    return (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
                <Icon name="arrow-back-outline" size={24} color="#000" />
            </TouchableOpacity>
            <Image source={require('../../assets/images/kt_icon.png')} style={styles.rightIcon} resizeMode="contain" />
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        top: Platform.OS === 'ios' ? 20 : 0, // Adjust for iOS and Android
        left: 20,
        right: 20,
        height: 60,
        zIndex: 1,
    },
    rightIcon: {
        width: 80,
        height: 30,
    },
});

export default ReusableHeader;
