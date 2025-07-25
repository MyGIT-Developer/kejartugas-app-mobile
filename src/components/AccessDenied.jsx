import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Animated,
    StatusBar,
    SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../constants/fonts';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const AccessDeniedScreen = ({ setHasAccess }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const shakeAnim = useRef(new Animated.Value(0)).current;

    const navigation = useNavigation();

    useEffect(() => {
        // Entry animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();

        // Shake animation for the lock icon
        const shakeAnimation = () => {
            Animated.sequence([
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: -10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 10,
                    duration: 100,
                    useNativeDriver: true,
                }),
                Animated.timing(shakeAnim, {
                    toValue: 0,
                    duration: 100,
                    useNativeDriver: true,
                }),
            ]).start();
        };

        const shakeInterval = setInterval(shakeAnimation, 3000);
        return () => clearInterval(shakeInterval);
    }, []);

    const handleGoBack = () => {
        navigation.navigate('Home');
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#EFF6FF" />
            <LinearGradient
                colors={['#EFF6FF', '#DBEAFE', '#BFDBFE']}
                style={styles.container}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [
                                { translateY: slideAnim },
                                { scale: scaleAnim }
                            ]
                        }
                    ]}
                >
                    {/* Lock Icon with Animation */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            { transform: [{ translateX: shakeAnim }] }
                        ]}
                    >
                        <LinearGradient
                            colors={['#EF4444', '#DC2626']}
                            style={styles.iconGradient}
                        >
                            {/* Replace with your preferred icon or use text fallback */}
                            <Text style={styles.lockIcon}>🔒</Text>
                            {/* Uncomment if you have Ionicons available:
                            <Ionicons name="lock-closed" size={40} color="white" />
                            */}
                        </LinearGradient>
                    </Animated.View>

                    {/* Error Code */}
                    <Text style={styles.errorCode}>403</Text>

                    {/* Title */}
                    <Text style={styles.title}>Access Denied</Text>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        Oops! You don't have permission to access this resource.
                        Please contact your administrator or try a different page.
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.primaryButton}
                            onPress={handleGoBack}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={['#007AFF', '#0051A8']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.buttonGradient}
                            >
                                <Ionicons name="arrow-back" size={18} color="white" style={styles.buttonIcon} />

                                <Text style={styles.primaryButtonText}>Go Back</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </Animated.View>

                {/* Decorative Elements */}
                <View style={styles.decorativeCircle1} />
                <View style={styles.decorativeCircle2} />
                <View style={styles.decorativeCircle3} />
            </LinearGradient>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#EFF6FF',
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    content: {
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 32,
        borderRadius: 24,
        width: width * 0.9,
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    iconContainer: {
        marginBottom: 20,
    },
    iconGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    errorCode: {
        fontSize: 72,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.1)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
        paddingHorizontal: 8,
    },
    buttonContainer: {
        flexDirection: 'column',
        width: '100%',
        marginBottom: 24,
    },
    primaryButton: {
        marginBottom: 12,
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonGradient: {
        borderRadius: 5,
        padding: 10,
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',

    },
    primaryButtonText: {
        color: '#fff',
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.semiBold,
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#3B82F6',
        backgroundColor: 'transparent',
    },
    secondaryButtonText: {
        color: '#3B82F6',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    buttonIcon: {
        marginRight: 8,
        fontSize: 16,
        color: 'white',
        fontWeight: 'bold',
    },
    buttonIconSecondary: {
        marginRight: 8,
        fontSize: 16,
        color: '#3B82F6',
        fontWeight: 'bold',
    },
    lockIcon: {
        fontSize: 40,
        color: 'white',
    },
    helpIcon: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: 'bold',
        marginRight: 6,
        width: 16,
        height: 16,
        textAlign: 'center',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#6B7280',
    },
    helpContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    helpText: {
        color: '#6B7280',
        fontSize: 14,
        marginLeft: 6,
        textDecorationLine: 'underline',
    },
    // Decorative elements
    decorativeCircle1: {
        position: 'absolute',
        top: 100,
        right: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    decorativeCircle2: {
        position: 'absolute',
        bottom: 150,
        left: 40,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
    },
    decorativeCircle3: {
        position: 'absolute',
        top: 200,
        left: 20,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
    },

});

export default AccessDeniedScreen;