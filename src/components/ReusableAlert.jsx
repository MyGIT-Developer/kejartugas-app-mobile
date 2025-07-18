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
    [ALERT_TYPES.SUCCESS]: 'Aksi berhasil dilakukan.',
    [ALERT_TYPES.ERROR]: 'Terjadi kesalahan.',
    [ALERT_TYPES.DELETE]: 'Apakah Anda yakin ingin menghapus item ini?',
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
                    <Text style={styles.title}>{isSuccess ? 'Berhasil' : isDelete ? 'Konfirmasi Hapus' : 'Error'}</Text>
                    <Text style={styles.message}>{message || DEFAULT_MESSAGES[alertType]}</Text>
                    {isDelete ? (
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={onConfirm}>
                                <Text style={styles.buttonText}>Ya, Hapus</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.button} onPress={() => {}}>
                                <Text style={styles.buttonText}>Batal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        !isSuccess && (
                            <TouchableOpacity style={styles.button} onPress={onConfirm}>
                                <Text style={styles.buttonText}>OK</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        zIndex: 9999,
        elevation: 9999,
    },
    alertWrapper: {
        width: width * 0.85,
        alignItems: 'center',
        justifyContent: 'center',
        maxWidth: 340,
    },
    alertContent: {
        width: '100%',
        backgroundColor: '#ffffff',
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        marginBottom: 16,
    },
    icon: {
        width: '100%',
        height: '100%',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1a1a1a',
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    message: {
        fontSize: 15,
        color: '#666666',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 8,
    },
    button: {
        width: '85%',
        backgroundColor: '#4A90E2',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: -0.3,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    confirmButton: {
        backgroundColor: '#EF4444',
        flex: 1,
    },
});

export default ReusableAlert;
