import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions, Text, TouchableOpacity, Keyboard, Modal } from 'react-native';
import LottieView from 'lottie-react-native';

import successAnimation from '../../assets/animations/success.json';
import errorAnimation from '../../assets/animations/error.json';
import deleteAnimation from '../../assets/animations/trash-success.json';

const { width, height } = Dimensions.get('window');

const ReusableAlertBottomPopUp = ({ show, alertType, message, onConfirm }) => {
    const isSuccess = alertType === 'success';
    const isDelete = alertType === 'delete';
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        if (show) {
            Keyboard.dismiss();
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: height,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [show]);

    const getAnimationSource = () => {
        switch (alertType) {
            case 'success':
                return successAnimation;
            case 'delete':
                return deleteAnimation;
            default:
                return errorAnimation;
        }
    };

    const getTitle = () => {
        switch (alertType) {
            case 'success':
                return 'Success';
            case 'delete':
                return 'Deleted';
            default:
                return 'Error';
        }
    };

    const getDefaultMessage = () => {
        switch (alertType) {
            case 'success':
                return 'Action completed successfully.';
            case 'delete':
                return 'Item has been deleted successfully.';
            default:
                return 'An error occurred.';
        }
    };

    return (
        <Modal visible={show} transparent={true} animationType="fade" onRequestClose={() => {}}>
            <View style={styles.overlay}>
                <Animated.View style={[styles.alertWrapper, { transform: [{ translateY: slideAnim }] }]}>
                    <View style={styles.alertContent}>
                        <View style={styles.iconContainer}>
                            <LottieView source={getAnimationSource()} autoPlay loop={false} style={styles.icon} />
                        </View>
                        <Text style={styles.title}>{getTitle()}</Text>
                        <Text style={styles.message}>{message || getDefaultMessage()}</Text>
                        <TouchableOpacity style={styles.button} onPress={onConfirm}>
                            <Text style={styles.buttonText}>Okay</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Darken the background when modal is active
    },
    alertWrapper: {
        width: width,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        bottom: 0,
        zIndex: 1000,
    },
    alertContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        marginBottom: 20,
    },
    icon: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    button: {
        width: '80%',
        backgroundColor: '#148FFF',
        paddingVertical: 12,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ReusableAlertBottomPopUp;
