import React, { useEffect, useRef } from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    ActivityIndicator,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LogoutModal = ({ 
    visible, 
    isLoading, 
    fontsLoaded, 
    onCancel, 
    onConfirm 
}) => {
    // All animations are contained within this component
    const slideAnim = useRef(new Animated.Value(300)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const iconRotateAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const blurFadeAnim = useRef(new Animated.Value(0)).current;
    const loadingScaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        if (visible) {
            // Reset all animations
            slideAnim.setValue(300);
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.8);
            iconRotateAnim.setValue(0);
            buttonScaleAnim.setValue(1);
            
            // Entrance animation sequence
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Icon animation
            Animated.timing(iconRotateAnim, {
                toValue: 1,
                duration: 500,
                delay: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    useEffect(() => {
        if (isLoading) {
            // Animate to fullscreen blur
            Animated.parallel([
                Animated.timing(blurFadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.spring(loadingScaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();

            // Start progress animation when loading
            Animated.loop(
                Animated.timing(progressAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                })
            ).start();
        } else {
            blurFadeAnim.setValue(0);
            loadingScaleAnim.setValue(0.8);
            progressAnim.setValue(0);
        }
    }, [isLoading]);

    const handleButtonPress = (callback, isConfirm = false) => {
        // Button press animation
        Animated.sequence([
            Animated.timing(buttonScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        // Execute callback immediately - no exit animations to prevent issues
        callback();
    };

    const iconRotation = iconRotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    const styles = {
        overlay: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        modalContent: {
            width: Math.min(width * 0.85, 340),
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 28,
            alignItems: 'center',
            shadowColor: '#444',
            shadowOffset: { width: 0, height: 15 },
            shadowOpacity: 0.3,
            shadowRadius: 25,
            elevation: 20,
            ...Platform.select({
                ios: {
                    shadowColor: '#444',
                    shadowOffset: { width: 0, height: 15 },
                    shadowOpacity: 0.3,
                    shadowRadius: 25,
                },
                android: {
                    elevation: 20,
                },
            }),
        },
        modalIcon: {
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            borderWidth: 2,
            borderColor: 'rgba(239, 68, 68, 0.2)',
        },
        modalTitle: {
            fontSize: 22,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 10,
            textAlign: 'center',
            letterSpacing: -0.5,
        },
        modalSubtitle: {
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 28,
            lineHeight: 22,
            paddingHorizontal: 4,
        },
        fullscreenBlur: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: width,
            height: height,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
        },
        loadingContainer: {
            alignItems: 'center',
            paddingVertical: 40,
            paddingHorizontal: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            borderRadius: 24,
            minWidth: 280,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 20 },
            shadowOpacity: 0.25,
            shadowRadius: 25,
            elevation: 25,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.2)',
        },
        loadingIcon: {
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: 'rgba(14, 80, 158, 0.1)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            borderWidth: 2,
            borderColor: 'rgba(14, 80, 158, 0.2)',
        },
        loadingTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: '#1F2937',
            marginBottom: 8,
            textAlign: 'center',
            letterSpacing: -0.3,
        },
        loadingText: {
            fontSize: 16,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 24,
            lineHeight: 22,
        },
        loadingProgress: {
            width: 200,
            height: 6,
            backgroundColor: '#E5E7EB',
            borderRadius: 3,
            overflow: 'hidden',
        },
        loadingProgressFill: {
            height: '100%',
            backgroundColor: '#0E509E',
            borderRadius: 3,
        },
        modalButtonContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            width: '100%',
            gap: 14,
        },
        confirmButton: {
            backgroundColor: '#EF4444',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 14,
            flex: 1,
            alignItems: 'center',
            shadowColor: '#EF4444',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 6,
            minHeight: 52,
            justifyContent: 'center',
        },
        confirmButtonText: {
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: 0.2,
        },
        cancelButton: {
            backgroundColor: '#F9FAFB',
            paddingVertical: 16,
            paddingHorizontal: 24,
            borderRadius: 14,
            flex: 1,
            alignItems: 'center',
            borderWidth: 1.5,
            borderColor: '#E5E7EB',
            minHeight: 52,
            justifyContent: 'center',
        },
        cancelButtonText: {
            color: '#6B7280',
            fontSize: 16,
            fontWeight: '600',
            letterSpacing: 0.2,
        },
        disabledButton: {
            opacity: 0.6,
        },
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="none"
            statusBarTranslucent={true}
        >
            <Animated.View 
                style={[
                    styles.overlay, 
                    { opacity: fadeAnim }
                ]}
            >
                <Animated.View 
                    style={[
                        styles.modalContent, 
                        { 
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ] 
                        }
                    ]}
                >
                    <View style={styles.modalIcon}>
                        <Animated.View
                            style={{
                                transform: [{ rotate: iconRotation }]
                            }}
                        >
                            <Ionicons 
                                name="log-out-outline" 
                                size={52} 
                                color="#EF4444" 
                            />
                        </Animated.View>
                    </View>
                    <Text
                        style={[
                            styles.modalTitle, 
                            fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null
                        ]}
                    >
                        Konfirmasi Logout
                    </Text>
                    <Text
                        style={[
                            styles.modalSubtitle,
                            fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                        ]}
                    >
                        Apakah Anda yakin ingin keluar dari aplikasi? Anda perlu login kembali untuk mengakses akun.
                    </Text>
                    <Animated.View 
                        style={[
                            styles.modalButtonContainer,
                            { transform: [{ scale: buttonScaleAnim }] }
                        ]}
                    >
                        <TouchableOpacity
                            style={[
                                styles.cancelButton,
                                isLoading && styles.disabledButton
                            ]}
                            onPress={() => handleButtonPress(onCancel, false)}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            <Text
                                style={[
                                    styles.cancelButtonText,
                                    fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                                ]}
                            >
                                Batal
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                isLoading && styles.disabledButton
                            ]}
                            onPress={() => handleButtonPress(onConfirm, true)}
                            activeOpacity={0.8}
                            disabled={isLoading}
                        >
                            <Text
                                style={[
                                    styles.confirmButtonText,
                                    fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                                ]}
                            >
                                Logout
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </Animated.View>
            </Animated.View>

            {/* Fullscreen Loading Overlay */}
            {isLoading && (
                <Animated.View
                    style={[
                        styles.fullscreenBlur,
                        { opacity: blurFadeAnim }
                    ]}
                >
                    <Animated.View 
                        style={[
                            styles.loadingContainer,
                            { transform: [{ scale: loadingScaleAnim }] }
                        ]}
                    >
                        <View style={styles.loadingIcon}>
                            <ActivityIndicator size="large" color="#0E509E" />
                        </View>
                        <Text
                            style={[
                                styles.loadingTitle,
                                fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null,
                            ]}
                        >
                            Logging Out
                        </Text>
                        <Text
                            style={[
                                styles.loadingText,
                                fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                            ]}
                        >
                            Sedang memproses logout...
                        </Text>
                        <View style={styles.loadingProgress}>
                            <Animated.View 
                                style={[
                                    styles.loadingProgressFill,
                                    { width: progressWidth }
                                ]} 
                            />
                        </View>
                    </Animated.View>
                </Animated.View>
            )}
        </Modal>
    );
};

export default LogoutModal;