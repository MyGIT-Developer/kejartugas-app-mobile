import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Dimensions,
    Platform,
    Animated,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { lunchStart, lunchEnd } from '../api/absent';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { FONTS } from '../constants/fonts';

const { width, height } = Dimensions.get('window');

const LunchCamera = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { attendanceId, location, locationName, action } = route.params || {};

    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedImageBase64, setCapturedImageBase64] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const isLunchStart = action === 'start';
    const title = isLunchStart ? 'Foto Mulai Istirahat' : 'Foto Akhir Istirahat';

    useEffect(() => {
        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 80,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const showAlert = (message, type = 'info') => {
        setAlert({ show: true, type, message });
        setTimeout(() => {
            setAlert({ show: false, type, message: '' });
        }, 3000);
    };

    const compressAndConvertToBase64 = async (uri) => {
        try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 800 } }], {
                compress: 0.7,
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
            });
            return `data:image/jpeg;base64,${manipulatedImage.base64}`;
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    };

    const handleTakePicture = async () => {
        try {
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Izin kamera diperlukan untuk melanjutkan', 'error');
                return;
            }

            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
                allowsMultipleSelection: false,
                exif: false,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                const compressedBase64 = await compressAndConvertToBase64(result.assets[0].uri);
                setCapturedImage(result.assets[0].uri);
                setCapturedImageBase64(compressedBase64);
                showAlert('Foto berhasil diambil! 📸', 'success');
            }
        } catch (error) {
            console.error('Camera error:', error);
            showAlert('Terjadi kesalahan saat mengambil foto', 'error');
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setCapturedImageBase64(null);
    };

    const handleSubmit = async () => {
        if (!capturedImageBase64) {
            showAlert('Silakan ambil foto terlebih dahulu', 'error');
            return;
        }

        if (!attendanceId || !location) {
            showAlert('Data tidak lengkap. Silakan coba lagi.', 'error');
            return;
        }

        setIsUploading(true);

        try {
            const locationString =
                typeof location === 'string' ? location : `${location.coords.latitude}, ${location.coords.longitude}`;

            let response;
            if (isLunchStart) {
                response = await lunchStart(attendanceId, locationString, capturedImageBase64, locationName);
            } else {
                response = await lunchEnd(attendanceId, capturedImageBase64, locationName);
            }

            if (response && (response.success === true || response.status === 'success')) {
                showAlert(
                    isLunchStart
                        ? 'Istirahat dimulai — selamat istirahat! ⏱️'
                        : 'Istirahat selesai — semoga kembali segar!',
                    'success',
                );

                setTimeout(() => {
                    // Navigate back to Kehadiran and pass a serializable refresh flag
                    try {
                        // Try nested navigation: App -> Kehadiran
                        navigation.navigate('App', {
                            screen: 'Kehadiran',
                            params: { refreshLunch: isLunchStart ? 'start' : 'end' },
                        });
                    } catch (e) {
                        // Fallback: goBack and rely on parent screen to re-fetch on focus
                        navigation.goBack();
                    }
                }, 1500);
            } else {
                throw new Error(response.message || 'Gagal memproses istirahat');
            }
        } catch (error) {
            console.error('Submit lunch error:', error);
            showAlert(error.message || 'Terjadi kesalahan. Silakan coba lagi.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Header */}
            <Animated.View
                style={[
                    styles.header,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{title}</Text>
                    <View style={{ width: 40 }} />
                </LinearGradient>
            </Animated.View>

            {/* Camera Section */}
            <Animated.View
                style={[
                    styles.cameraContainer,
                    {
                        opacity: fadeAnim,
                    },
                ]}
            >
                {capturedImage ? (
                    <View style={styles.previewContainer}>
                        <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                    </View>
                ) : (
                    <View style={styles.cameraPlaceholder}>
                        <View style={styles.cameraIconWrapper}>
                            <Ionicons name="camera" size={64} color="#4A90E2" />
                        </View>
                        <Text style={styles.cameraPlaceholderText}>
                            {isLunchStart
                                ? 'Ambil foto untuk memulai istirahat'
                                : 'Ambil foto untuk mengakhiri istirahat'}
                        </Text>
                        <TouchableOpacity style={styles.takePictureButton} onPress={handleTakePicture}>
                            <Ionicons name="camera" size={24} color="white" />
                            <Text style={styles.takePictureButtonText}>Buka Kamera</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            {/* Controls */}
            <Animated.View
                style={[
                    styles.controls,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: fadeAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [50, 0],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {/* Location Info */}
                <View style={styles.locationInfo}>
                    <Ionicons name="location" size={16} color="#10B981" />
                    <Text style={styles.locationText} numberOfLines={1}>
                        {locationName || 'Memuat lokasi...'}
                    </Text>
                </View>

                {/* Action Buttons */}
                {capturedImage && (
                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.retakeButton]}
                            onPress={handleRetake}
                            disabled={isUploading}
                        >
                            <Ionicons name="refresh" size={24} color="white" />
                            <Text style={styles.actionButtonText}>Ambil Ulang</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.submitButton]}
                            onPress={handleSubmit}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark-circle" size={24} color="white" />
                                    <Text style={styles.actionButtonText}>
                                        {isLunchStart ? 'Mulai Istirahat' : 'Akhiri Istirahat'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </Animated.View>

            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert({ show: false, type: 'success', message: '' })}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        zIndex: 10,
    },
    headerGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: FONTS.size.xl,
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
    },
    cameraContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    cameraPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    cameraIconWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(74, 144, 226, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    cameraPlaceholderText: {
        fontSize: FONTS.size.base,
        fontFamily: FONTS.family.medium,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 32,
        paddingHorizontal: 40,
    },
    takePictureButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        shadowColor: '#4A90E2',
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
        elevation: 5,
    },
    takePictureButtonText: {
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.bold,
        color: 'white',
    },
    previewContainer: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewImage: {
        width: width - 40,
        height: width - 40,
        borderRadius: 20,
        resizeMode: 'cover',
    },
    controls: {
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        paddingHorizontal: 20,
        gap: 20,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        gap: 8,
    },
    locationText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#15803D',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: 20,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        gap: 8,
    },
    retakeButton: {
        backgroundColor: '#6B7280',
    },
    submitButton: {
        backgroundColor: '#10B981',
    },
    actionButtonText: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.bold,
        color: 'white',
    },
});

export default LunchCamera;
