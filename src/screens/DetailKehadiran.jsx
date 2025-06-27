import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Dimensions,
    Platform,
    Animated,
    Haptics,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn } from '../api/absent';
import * as ImageManipulator from 'expo-image-manipulator';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import CheckBox from '../components/Checkbox';
import { Camera } from 'expo-camera';

const { width, height } = Dimensions.get('window');
const DetailKehadiran = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { location, locationName, jamTelat = '', radius } = route.params || {};

    const [currentTime, setCurrentTime] = useState('');
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [isWFH, setIsWFH] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedImageBase64, setCapturedImageBase64] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [reasonInput, setReasonInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));

    const [latitude, longitude] = location?.split(',').map((coord) => parseFloat(coord.trim())) || [0, 0];

    const parsedLocation = {
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude,
    };

    useEffect(() => {
        const interval = setInterval(updateCurrentTime, 1000);
        getStoredData();

        // Start animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        return () => clearInterval(interval);
    }, []);

    const updateCurrentTime = () => {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        setCurrentTime(now.toLocaleTimeString([], options));
    };

    const getStoredData = async () => {
        try {
            const storedEmployeeId = await AsyncStorage.getItem('employeeId');
            const storedCompanyId = await AsyncStorage.getItem('companyId');
            setEmployeeId(storedEmployeeId);
            setCompanyId(storedCompanyId);
        } catch (error) {
            console.error('Error fetching AsyncStorage data:', error);
        }
    };

    const calculateLateStatus = useCallback(() => {
        if (!jamTelat || typeof jamTelat !== 'string') return false;

        const currentDate = new Date();
        const [hours, minutes] = jamTelat.split(':');
        const officeStartTime = new Date();
        officeStartTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        return currentDate > officeStartTime;
    }, [jamTelat]);

    const isUserLate = calculateLateStatus();
    const compressAndConvertToBase64 = async (uri) => {
        try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1000 } }], // Resize to max width of 1000px
                { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
            );
            return manipulatedImage.base64;
        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    };
    const triggerCamera = async () => {
        try {
            // Add haptic feedback
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Izin kamera diperlukan untuk melanjutkan', 'error');
                return;
            }

            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                const compressedBase64 = await compressAndConvertToBase64(result.assets[0].uri);
                setCapturedImage(result.assets[0].uri);
                setCapturedImageBase64(compressedBase64);
                showAlert('Foto berhasil diambil!', 'success');
            }
        } catch (error) {
            console.error('Camera error:', error);
            showAlert('Terjadi kesalahan saat mengambil foto', 'error');
        }
    };

    const handleClockIn = async () => {
        if (!capturedImageBase64) {
            showAlert('Silakan ambil foto terlebih dahulu!', 'error');
            return;
        }

        if (isUserLate && !reasonInput.trim()) {
            showAlert('Silakan berikan alasan keterlambatan!', 'error');
            return;
        }

        // Add haptic feedback
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        setIsUploading(true);
        try {
            if (!employeeId || !companyId || !location) {
                throw new Error('Data check-in tidak lengkap');
            }

            const checkInPayload = {
                employeeId,
                companyId,
                reason: isUserLate ? reasonInput : null,
                image: capturedImageBase64,
                location,
                isWFH,
            };

            const response = await checkIn(
                checkInPayload.employeeId,
                checkInPayload.companyId,
                checkInPayload.reason,
                checkInPayload.image,
                checkInPayload.location,
                checkInPayload.isWFH,
            );

            if (!response || response.success === false) {
                throw new Error(response?.message || 'Check-in gagal');
            }

            showAlert('Check-in berhasil! 🎉', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            console.error('Check-in error:', error);

            let errorMessage = 'Terjadi kesalahan saat check-in';
            if (error.message.includes('tidak lengkap')) {
                errorMessage = 'Data check-in tidak lengkap. Silakan coba lagi.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Sesi berakhir. Silakan login kembali.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            showAlert(errorMessage, 'error');
        } finally {
            setIsUploading(false);
        }
    };
    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    };

    const handleGoBack = () => {
        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        }
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#2E5984']}
                style={styles.headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={handleGoBack} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>Detail Kehadiran</Text>
                    <View style={styles.placeholderView} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {/* Time and Status Card */}
                    <View style={styles.timeCard}>
                        <View style={styles.timeContainer}>
                            <Ionicons name="time" size={24} color="#4A90E2" />
                            <Text style={styles.timeText}>{currentTime}</Text>
                        </View>
                        {isUserLate && (
                            <View style={styles.lateStatusContainer}>
                                <View style={styles.lateStatusDot} />
                                <Text style={styles.lateStatusText}>Terlambat</Text>
                            </View>
                        )}
                    </View>

                    {/* Location Card */}
                    <View style={styles.locationCard}>
                        <View style={styles.locationHeader}>
                            <Ionicons name="location" size={20} color="#4A90E2" />
                            <Text style={styles.locationTitle}>Lokasi Saat Ini</Text>
                        </View>
                        <Text style={styles.locationName}>{locationName || 'Memuat lokasi...'}</Text>

                        {/* WFH Checkbox */}
                        <View style={styles.wfhContainer}>
                            <CheckBox
                                onPress={() => setIsWFH(!isWFH)}
                                title="Bekerja dari luar kantor (WFH)"
                                isChecked={isWFH}
                            />
                        </View>
                    </View>

                    {/* Camera Section */}
                    <View style={styles.cameraCard}>
                        <View style={styles.cameraHeader}>
                            <Ionicons name="camera" size={20} color="#4A90E2" />
                            <Text style={styles.cameraTitle}>Foto Kehadiran</Text>
                        </View>

                        {!capturedImage ? (
                            <TouchableOpacity style={styles.cameraButton} onPress={triggerCamera} activeOpacity={0.8}>
                                <View style={styles.cameraIconContainer}>
                                    <Ionicons name="camera" size={32} color="white" />
                                </View>
                                <Text style={styles.cameraButtonText}>Ambil Foto</Text>
                                <Text style={styles.cameraSubtext}>Tap untuk mengambil foto</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                                <TouchableOpacity
                                    style={styles.retakeButton}
                                    onPress={triggerCamera}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="camera" size={16} color="white" />
                                    <Text style={styles.retakeButtonText}>Ambil Ulang</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Late Reason Input */}
                    {isUserLate && (
                        <Animated.View
                            style={[
                                styles.reasonCard,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }],
                                },
                            ]}
                        >
                            <View style={styles.reasonHeader}>
                                <Ionicons name="document-text" size={20} color="#EF4444" />
                                <Text style={styles.reasonTitle}>Alasan Keterlambatan</Text>
                            </View>
                            <TextInput
                                style={styles.reasonInput}
                                placeholder="Jelaskan alasan keterlambatan Anda..."
                                value={reasonInput}
                                onChangeText={setReasonInput}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                placeholderTextColor="#9CA3AF"
                            />
                            <Text style={styles.characterCount}>{reasonInput.length}/200</Text>
                        </Animated.View>
                    )}
                </Animated.View>
            </ScrollView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.checkInButton,
                        (isUploading || !capturedImage || (isUserLate && !reasonInput.trim())) && styles.disabledButton,
                    ]}
                    onPress={handleClockIn}
                    disabled={isUploading || !capturedImage || (isUserLate && !reasonInput.trim())}
                    activeOpacity={0.8}
                >
                    {isUploading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.buttonText}>Memproses...</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                            <Text style={styles.buttonText}>Clock In</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Header Styles
    headerGradient: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    placeholderView: {
        width: 40,
    },

    // Content Styles
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    content: {
        padding: 20,
        gap: 20,
    },

    // Time Card Styles
    timeCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    timeText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
    },
    lateStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
        gap: 6,
    },
    lateStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#EF4444',
    },
    lateStatusText: {
        color: '#EF4444',
        fontWeight: '600',
        fontSize: 12,
    },

    // Location Card Styles
    locationCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        gap: 16,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    locationName: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginLeft: 28,
    },
    wfhContainer: {
        marginTop: 8,
    },

    // Camera Card Styles
    cameraCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        gap: 16,
    },
    cameraHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    cameraTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    cameraButton: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
        gap: 12,
    },
    cameraIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cameraButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    cameraSubtext: {
        fontSize: 14,
        color: '#6B7280',
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    previewImage: {
        width: '100%',
        height: 250,
        borderRadius: 12,
        resizeMode: 'contain',
        backgroundColor: '#F3F4F6',
    },
    retakeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    retakeButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },

    // Reason Card Styles
    reasonCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        gap: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    reasonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    reasonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    reasonInput: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 14,
        color: '#1F2937',
        minHeight: 80,
        backgroundColor: '#F9FAFB',
    },
    characterCount: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'right',
    },

    // Bottom Button Styles
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    checkInButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
        shadowColor: '#9CA3AF',
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default DetailKehadiran;
