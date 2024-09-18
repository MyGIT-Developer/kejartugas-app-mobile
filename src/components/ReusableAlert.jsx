import React from 'react';
import { Animated, StyleSheet, View, Dimensions, Text, TouchableOpacity, Keyboard } from 'react-native';
import LottieView from 'lottie-react-native';

// Adjust these paths based on your project structure
import successAnimation from '../../assets/animations/success.json';
import errorAnimation from '../../assets/animations/error.json';

const { width, height } = Dimensions.get('window');

const ALERT_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
};

const DEFAULT_MESSAGES = {
    [ALERT_TYPES.SUCCESS]: 'Action completed successfully.',
    [ALERT_TYPES.ERROR]: 'An error occurred.',
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
    const isSuccess = alertType === ALERT_TYPES.SUCCESS;
    const slideAnim = useSlideAnimation(show);

    if (!show) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View style={[styles.alertWrapper, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.alertContent}>
                    <View style={styles.iconContainer}>
                        <LottieView
                            source={isSuccess ? successAnimation : errorAnimation}
                            autoPlay
                            loop={false}
                            style={styles.icon}
                        />
                    </View>
                    <Text style={styles.title}>{isSuccess ? 'Success' : 'Error'}</Text>
                    <Text style={styles.message}>{message || DEFAULT_MESSAGES[alertType]}</Text>
                    {!isSuccess && (
                        <TouchableOpacity style={styles.button} onPress={onConfirm}>
                            <Text style={styles.buttonText}>Okay</Text>
                        </TouchableOpacity>
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
