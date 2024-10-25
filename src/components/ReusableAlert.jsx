import React from 'react';
import { Animated, StyleSheet, View, Dimensions, Text, TouchableOpacity, Keyboard } from 'react-native';
import LottieView from 'lottie-react-native';

// Adjust these paths based on your project structure
import successAnimation from '../../assets/animations/success.json';
import errorAnimation from '../../assets/animations/error.json';
import trashAnimation from '../../assets/animations/trash-success.json';

const { width, height } = Dimensions.get('window');

const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    DELETE: 'delete',
};

const DEFAULT_MESSAGES = {
    [ALERT_TYPES.SUCCESS]: 'Action completed successfully.',
    [ALERT_TYPES.ERROR]: 'An error occurred.',
    [ALERT_TYPES.DELETE]: 'Are you sure you want to delete this item?',
};

const useSlideAnimation = (show) => {
    const slideAnim = React.useRef(new Animated.Value(height)).current;

    React.useEffect(() => {
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
    }, [show, slideAnim]);

    return slideAnim;
};

const ReusableAlert = React.memo(({ show, alertType, message, onConfirm }) => {
    const slideAnim = useSlideAnimation(show);
    const isSuccess = alertType === ALERT_TYPES.SUCCESS;
    const isDelete = alertType === ALERT_TYPES.DELETE;

    React.useEffect(() => {
        if (show && isSuccess) {
            // Automatically close the alert after 2 seconds for success messages
            const timer = setTimeout(onConfirm, 2000);
            return () => clearTimeout(timer); // Clean up the timer when the alert is dismissed
        }
    }, [show, isSuccess, onConfirm]);

    if (!show) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.alertWrapper, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.alertContent}>
                    <View style={styles.iconContainer}>
                        <LottieView
                            source={isSuccess ? successAnimation : isDelete ? trashAnimation : errorAnimation}
                            autoPlay
                            loop={false}
                            style={styles.icon}
                        />
                    </View>
                    <Text style={styles.title}>{isSuccess ? 'Success' : isDelete ? 'Delete Confirmation' : 'Error'}</Text>
                    <Text style={styles.message}>{message || DEFAULT_MESSAGES[alertType]}</Text>
                    {isDelete ? (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                                <Text style={styles.buttonText}>Yes, Delete</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={onCancel}>
                                <Text style={styles.buttonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        !isSuccess && (
                            <TouchableOpacity style={styles.button} onPress={onConfirm}>
                                <Text style={styles.buttonText}>Okay</Text>
                            </TouchableOpacity>
                        )
                    )}
                </View>
            </Animated.View>
        </View>
    );
});

ReusableAlert.defaultProps = {
    show: false,
    alertType: ALERT_TYPES.SUCCESS,
    message: '',
    onConfirm: () => {},
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    alertWrapper: {
        width: width * 0.85,
        alignItems: 'center',
        justifyContent: 'center',
    },
    alertContent: {
        width: '100%',
        backgroundColor: '#fff',
        borderRadius: 20,
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

export default ReusableAlert;
