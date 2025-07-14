import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    KeyboardAvoidingView,
    StatusBar,
    ToastAndroid,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn } from '../api/absent';
import { getClientsByCompanyId } from '../api/client';
import * as ImageManipulator from 'expo-image-manipulator';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import CheckBox from '../components/Checkbox';
import ClientDropdown from '../components/ClientDropdown';
import { Camera } from 'expo-camera';
import { FONTS } from '../constants/fonts';

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
    const [toast, setToast] = useState({ show: false, message: '' });
    const [reasonInput, setReasonInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [backButtonScale] = useState(new Animated.Value(1));

    // Client-related states
    const [clients, setClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState([]);
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [isClientEnabled, setIsClientEnabled] = useState(false);
    const [originalLocation, setOriginalLocation] = useState(null);
    const [originalLocationName, setOriginalLocationName] = useState(null);
    const [currentLocation, setCurrentLocation] = useState(null);
    const [currentLocationName, setCurrentLocationName] = useState('');

    // Animation refs for better performance
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const statsSlideAnim = useRef(new Animated.Value(-100)).current;
    const historySlideAnim = useRef(new Animated.Value(-100)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;
    const headerScaleAnim = useRef(new Animated.Value(0.9)).current;

    const [latitude, longitude] = (currentLocation || location)
        ?.split(',')
        .map((coord) => parseFloat(coord.trim())) || [0, 0];

    const parsedLocation = {
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude,
    };

    // Toast function for simple notifications
    const showToast = (message) => {
        if (Platform.OS === 'android') {
            ToastAndroid.show(message, ToastAndroid.SHORT);
        } else {
            // For iOS, show custom toast
            setToast({ show: true, message });
            setTimeout(() => {
                setToast({ show: false, message: '' });
            }, 2000);
        }
    };

    useEffect(() => {
        const interval = setInterval(updateCurrentTime, 1000);
        getStoredData();

        // Initialize location states
        setOriginalLocation(location);
        setOriginalLocationName(locationName);
        setCurrentLocation(location);
        setCurrentLocationName(locationName || 'Memuat lokasi...');

        // Start animations with staggered effect
        Animated.sequence([
            Animated.parallel([
                Animated.timing(headerAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
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
            ]),
        ]).start();

        // Start pulse animation for late status
        if (isUserLate) {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ]),
            );
            pulse.start();
        }

        return () => clearInterval(interval);
    }, [location, locationName, isUserLate, pulseAnim]);

    const updateCurrentTime = () => {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        setCurrentTime(now.toLocaleTimeString([], options));
    };

    const getStoredData = async () => {
        try {
            const storedEmployeeId = await AsyncStorage.getItem('employeeId');
            const storedCompanyId = await AsyncStorage.getItem('companyId');
            const storedToken = await AsyncStorage.getItem('token');

            console.log('Retrieved stored data:');
            console.log('Employee ID:', storedEmployeeId);
            console.log('Company ID:', storedCompanyId);
            console.log('Token exists:', !!storedToken);

            setEmployeeId(storedEmployeeId);
            setCompanyId(storedCompanyId);

            // Fetch clients when we have company ID
            if (storedCompanyId) {
                await fetchClients(storedCompanyId);
            } else {
                console.log('No company ID found, cannot fetch clients');
            }
        } catch (error) {
            console.error('Error fetching AsyncStorage data:', error);
        }
    };

    // Fetch clients from API
    const fetchClients = async (companyId) => {
        if (!companyId) return;

        console.log('Fetching clients for company ID:', companyId);
        setIsLoadingClients(true);
        try {
            const response = await getClientsByCompanyId(companyId);
            console.log('Clients API response:', response);

            // Handle different response formats
            let clientsData = [];
            if (response && response.status === 'success' && response.data) {
                // Format: { status: "success", data: [...] }
                clientsData = response.data;
            } else if (response && response.success && response.data) {
                // Format: { success: true, data: [...] }
                clientsData = response.data;
            } else if (response && Array.isArray(response)) {
                // Direct array format
                clientsData = response;
            } else if (response && response.clients) {
                // Format: { clients: [...] }
                clientsData = response.clients;
            }

            // Transform the data to match ClientDropdown expected format
            const transformedClients = clientsData.map((client) => ({
                id: client.id,
                name: client.client_name,
                address: client.location_client_name || null,
                location: client.location_client || null,
            }));

            console.log('Setting clients:', transformedClients);
            setClients(transformedClients);

            if (transformedClients.length === 0) {
                showAlert('Tidak ada klien tersedia untuk perusahaan ini', 'info');
            }
        } catch (error) {
            console.error('Error fetching clients:', error);
            showAlert('Gagal memuat data klien: ' + error.message, 'error');
            setClients([]);
        } finally {
            setIsLoadingClients(false);
        }
    };

    // Handle client selection and location switching
    const handleClientSelection = (client) => {
        setSelectedClient(client);
        console.log('Selected client:', client);
        setShowClientDropdown(false);

        // Switch to client location
        if (client && client.location) {
            setCurrentLocation(client.location);
            setCurrentLocationName(client.address || client.name || 'Lokasi klien');

            // Add haptic feedback for selection
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }

            showToast(`📍 Lokasi berhasil diganti ke: ${client.name}`);
        }
    };

    // Handle client enable/disable
    const handleClientToggle = () => {
        const newValue = !isClientEnabled;
        setIsClientEnabled(newValue);

        if (!newValue) {
            // Client disabled - restore original location
            setSelectedClient(null);
            setShowClientDropdown(false);
            setCurrentLocation(originalLocation);
            setCurrentLocationName(originalLocationName);

            // Add haptic feedback
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            showToast('🔄 Lokasi kembali ke lokasi awal');
        } else {
            // Client enabled - show dropdown if no client selected, refresh clients
            if (companyId) {
                fetchClients(companyId);
            }

            // Only show dropdown if no client is selected
            if (!selectedClient) {
                setShowClientDropdown(true);
            }

            // Add haptic feedback
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    };

    const calculateLateStatus = useCallback(() => {
        if (!jamTelat || typeof jamTelat !== 'string') return false;

        const currentDate = new Date();
        const [hours, minutes] = jamTelat.split(':');
        const officeStartTime = new Date();
        officeStartTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

        // Add a small buffer to avoid edge cases
        const isLate = currentDate > officeStartTime;

        // Log for debugging
        console.log('Late calculation:', {
            currentTime: currentDate.toLocaleTimeString(),
            officeStartTime: officeStartTime.toLocaleTimeString(),
            isLate,
        });

        return isLate;
    }, [jamTelat]);

    const isUserLate = calculateLateStatus();

    // Validate late reason function
    const validateLateReason = useCallback((text) => {
        // Remove punctuation and extra spaces to count only letters
        const cleanText = text.replace(/[^\w\s]/gi, '').trim();
        const letterCount = cleanText.replace(/\s/g, '').length;

        return {
            isValid: letterCount >= 5,
            letterCount: letterCount,
            cleanText: cleanText,
            hasPunctuation: /[^\w\s]/gi.test(text),
        };
    }, []);

    const reasonValidation = validateLateReason(reasonInput);
    const compressAndConvertToBase64 = async (uri) => {
        try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
                uri,
                [{ resize: { width: 1000 } }], // Resize to max width of 1000px
                { compress: 0.8, format: 'jpeg', base64: true },
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
                allowsMultipleSelection: false,
                exif: false,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                const compressedBase64 = await compressAndConvertToBase64(result.assets[0].uri);
                setCapturedImage(result.assets[0].uri);
                setCapturedImageBase64(compressedBase64);

                // Enhanced success feedback
                if (Platform.OS === 'ios') {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                showToast('Foto berhasil diambil! 📸');
            }
        } catch (error) {
            console.error('Camera error:', error);
            if (Platform.OS === 'ios') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
            showAlert('Terjadi kesalahan saat mengambil foto', 'error');
        }
    };

    const handleClockIn = async () => {
        if (!capturedImageBase64) {
            showAlert('Silakan ambil foto terlebih dahulu!', 'error');
            return;
        }

        if (isUserLate && (!reasonInput.trim() || !reasonValidation.isValid || reasonValidation.hasPunctuation)) {
            if (!reasonInput.trim()) {
                showAlert('Silakan berikan alasan keterlambatan!', 'error');
            } else if (!reasonValidation.isValid) {
                showAlert('Alasan keterlambatan harus minimal 5 kata!', 'error');
            } else if (reasonValidation.hasPunctuation) {
                showAlert('Alasan keterlambatan tidak boleh mengandung tanda baca!', 'error');
            }
            return;
        }

        if (isClientEnabled && !selectedClient) {
            showAlert('Silakan pilih klien terlebih dahulu!', 'error');
            return;
        }

        if (!currentLocation || !currentLocationName) {
            showAlert('Data lokasi tidak tersedia. Silakan coba lagi.', 'error');
            return;
        }

        // Add haptic feedback
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }

        setIsUploading(true);
        try {
            if (!employeeId || !companyId || !currentLocation) {
                throw new Error('Data check-in tidak lengkap');
            }

            const checkInPayload = {
                employeeId,
                companyId,
                reason: isUserLate ? reasonInput : null,
                image: capturedImageBase64,
                location: currentLocation,
                isWFH,
                clientId: isClientEnabled && selectedClient ? selectedClient.id : null,
            };

            const response = await checkIn(
                checkInPayload.employeeId,
                checkInPayload.companyId,
                checkInPayload.reason,
                checkInPayload.image,
                checkInPayload.location,
                checkInPayload.isWFH,
                checkInPayload.clientId,
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

        // Add haptic feedback for alerts
        if (Platform.OS === 'ios') {
            if (type === 'success') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else if (type === 'error') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }

        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    };

    const handleGoBack = () => {
        // Animate button press
        Animated.sequence([
            Animated.timing(backButtonScale, {
                toValue: 0.9,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(backButtonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        if (Platform.OS === 'ios') {
            Haptics.selectionAsync();
        }
        navigation.goBack();
    };

    // Header animation based on scroll
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 1],
        extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 1],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />

            {/* Enhanced Header */}
            <Animated.View
                style={[
                    styles.backgroundBox,
                    {
                        opacity: headerOpacity,
                        transform: [{ scale: headerScale }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Header decorative elements */}
                <View style={styles.headerDecorations}>
                    <Animated.View
                        style={[
                            styles.decorativeCircle1,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.6],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle2,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.4],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle3,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle4,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle5,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                </View>
            </Animated.View>

            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.headerContainer}>
                        <TouchableOpacity style={[
                            styles.backButton,
                            {
                                transform: [{ scale: backButtonScale }],
                            },
                        ]}
                            onPress={handleGoBack}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="chevron-back" size={24} color="white" />
                        </TouchableOpacity>

                        <Animated.Text
                            style={[
                                styles.headerText,
                                {
                                    opacity: headerAnim,
                                    transform: [
                                        {
                                            scale: headerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            Detail Kehadiran
                        </Animated.Text>

                        <View style={styles.placeholderView} />
                    </View>

                    <Animated.View
                        style={[
                            styles.content,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        {/* Camera Section */}
                        <View style={styles.cameraCard}>
                            <View style={styles.timeLocationHeader}>
                                <View style={styles.timeStatusContainer}>
                                    <Text style={styles.timeText}>{currentTime}</Text>
                                    {isUserLate && (
                                        <Animated.View
                                            style={[
                                                styles.lateStatusContainer,
                                                {
                                                    transform: [{ scale: pulseAnim }],
                                                },
                                            ]}
                                        >
                                            <View style={styles.lateStatusDot} />
                                            <Text style={styles.lateStatusText}>Terlambat</Text>
                                        </Animated.View>
                                    )}
                                </View>
                                <View style={[styles.locationContainer, isClientEnabled && styles.clientModeCard]}>
                                    <View style={styles.locationHeader}>
                                        <Ionicons
                                            name={isClientEnabled && selectedClient ? 'business' : 'location'}
                                            size={20}
                                            color={isClientEnabled ? '#10B981' : '#4A90E2'}
                                        />
                                        <Text style={styles.locationTitle}>
                                            {isClientEnabled && selectedClient ? 'Lokasi Client' : 'Lokasi Saat Ini'}
                                        </Text>
                                        {isClientEnabled && selectedClient && (
                                            <View style={styles.clientIndicator}>
                                                <Text style={styles.clientIndicatorText}>CLIENT</Text>
                                            </View>
                                        )}
                                        {isClientEnabled && !selectedClient && (
                                            <View style={styles.clientModeIndicator}>
                                                <Text style={styles.clientModeText}>MODE CLIENT</Text>
                                            </View>
                                        )}
                                    </View>

                                    <View style={styles.locationDetails}>
                                        <Text style={styles.locationName}>{currentLocationName || 'Memuat lokasi...'}</Text>
                                        {currentLocation && <Text style={styles.coordinatesText}>{currentLocation}</Text>}
                                    </View>

                                </View>
                            </View>

                            <View style={styles.cameraHeader}>
                                <Ionicons name="camera" size={20} color="#4A90E2" />
                                <Text style={styles.cameraTitle}>Foto Kehadiran</Text>
                            </View>

                            {!capturedImage ? (
                                <Animated.View
                                    style={{
                                        opacity: fadeAnim,
                                        transform: [{ translateY: slideAnim }],
                                    }}
                                >
                                    <TouchableOpacity
                                        style={styles.cameraButton}
                                        onPress={triggerCamera}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.cameraIconContainer}>
                                            <Ionicons name="camera" size={32} color="white" />
                                        </View>
                                        <Text style={styles.cameraButtonText}>Ambil Foto</Text>
                                        <Text style={styles.cameraSubtext}>Tap untuk mengambil foto</Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ) : (
                                <Animated.View
                                    style={{
                                        opacity: fadeAnim,
                                        transform: [{ scale: fadeAnim }],
                                    }}
                                >
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
                                </Animated.View>
                            )}
                        </View>

                        {/* Location Card */}
                        <View style={[styles.locationCard, isClientEnabled && styles.clientModeCard]}>
                            <View style={styles.checkboxContainer}>
                                <Text style={styles.checkboxTitle}>
                                    Pilih jika Anda bekerja dari rumah (WFH) atau absen di lokasi klien
                                </Text>
                                <View style={styles.checkboxItem}>
                                    <CheckBox
                                        onPress={() => setIsWFH(!isWFH)}
                                        title="Bekerja dari luar kantor (WFH)"
                                        isChecked={isWFH}
                                    />
                                </View>

                                {/* Client Checkbox */}
                                <View style={styles.checkboxItem}>
                                    <CheckBox
                                        onPress={handleClientToggle}
                                        title="Absen di Client"
                                        isChecked={isClientEnabled}
                                    />
                                </View>
                            </View>

                            {/* Client Dropdown or Selected Client */}
                            {isClientEnabled && (
                                <Animated.View
                                    style={[
                                        styles.clientContainer,
                                        {
                                            opacity: fadeAnim,
                                            transform: [{ translateY: slideAnim }],
                                        },
                                    ]}
                                >
                                    {isLoadingClients ? (
                                        <View style={styles.loadingClientContainer}>
                                            <View style={styles.loadingIcon}>
                                                <Ionicons name="business" size={20} color="#10B981" />
                                            </View>
                                            <View style={styles.loadingTextContainer}>
                                                <Text style={styles.loadingTitle}>Memuat Klien</Text>
                                                <Text style={styles.loadingSubtitle}>
                                                    Sedang mengambil data klien...
                                                </Text>
                                            </View>
                                        </View>
                                    ) : selectedClient ? (
                                        /* Selected Client Card - Replaces Dropdown */
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (Platform.OS === 'ios') {
                                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                                }
                                                setShowClientDropdown(true);
                                            }}
                                            activeOpacity={0.3}
                                        >
                                            <Animated.View
                                                style={[
                                                    styles.selectedClientCard,
                                                    {
                                                        opacity: fadeAnim,
                                                        transform: [{ scale: fadeAnim }],
                                                    },
                                                ]}
                                            >
                                                <View style={styles.selectedClientHeader}>
                                                    <View style={styles.clientIconWrapper}>
                                                        <Ionicons name="business" size={18} color="#FFFFFF" />
                                                    </View>
                                                    <View style={styles.clientInfoWrapper}>
                                                        <Text style={styles.selectedClientLabel}>
                                                            Klien yang kamu pilih
                                                        </Text>
                                                        <Text style={styles.selectedClientName}>{selectedClient.name}</Text>
                                                    </View>
                                                </View>

                                                {selectedClient.address && (
                                                    <View style={styles.selectedClientAddress}>

                                                        <Text style={styles.selectedClientAddressText}>
                                                            {selectedClient.address}
                                                        </Text>
                                                    </View>
                                                )}

                                                {/* <View style={styles.selectedClientFooter}>
                                                    <View style={styles.statusIndicator}>
                                                        <View style={styles.statusDot} />
                                                        <Text style={styles.statusText}>Lokasi Aktif</Text>
                                                    </View>
                                                </View> */}
                                            </Animated.View>
                                        </TouchableOpacity>
                                    ) : (
                                        /* Client Dropdown - Only shown when no client selected */
                                        <ClientDropdown
                                            clients={clients}
                                            selectedClient={selectedClient}
                                            onSelectClient={handleClientSelection}
                                            onToggle={() => setShowClientDropdown(!showClientDropdown)}
                                            isVisible={showClientDropdown}
                                            placeholder="Pilih klien..."
                                            onClose={() => setShowClientDropdown(false)}
                                        />
                                    )}

                                    {/* Client Change Modal - Shows when changing client */}
                                    {selectedClient && showClientDropdown && (
                                        <Animated.View
                                            style={[
                                                styles.changeClientModal,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: [{ translateY: slideAnim }],
                                                },
                                            ]}
                                        >
                                            <ClientDropdown
                                                clients={clients}
                                                selectedClient={null}
                                                onSelectClient={handleClientSelection}
                                                onToggle={() => setShowClientDropdown(!showClientDropdown)}
                                                isVisible={showClientDropdown}
                                                placeholder="Pilih klien baru..."
                                                onClose={() => setShowClientDropdown(false)}
                                            />
                                        </Animated.View>
                                    )}
                                </Animated.View>
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
                                    style={[
                                        styles.reasonInput,
                                        reasonInput.length > 180 && styles.nearLimitInput,
                                        reasonValidation.hasPunctuation && styles.invalidInput,
                                        !reasonValidation.isValid && reasonInput.length > 0 && styles.invalidInput,
                                    ]}
                                    placeholder="Jelaskan alasan keterlambatan Anda..."
                                    value={reasonInput}
                                    onChangeText={(text) => {
                                        if (text.length <= 200) {
                                            setReasonInput(text);
                                        }
                                    }}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                    placeholderTextColor="#9CA3AF"
                                    maxLength={200}
                                />
                                <View style={styles.validationContainer}>
                                    <View style={styles.characterCountContainer}>
                                        <Text
                                            style={[
                                                styles.characterCount,
                                                reasonInput.length > 180 && styles.nearLimitCount,
                                                reasonInput.length === 200 && styles.limitReachedCount,
                                            ]}
                                        >
                                            {reasonInput.length}/200
                                        </Text>
                                        {reasonInput.length > 180 && (
                                            <Text style={styles.limitWarning}>
                                                {200 - reasonInput.length} karakter tersisa
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Bottom Button */}
            <View style={styles.bottomContainer}>
                <TouchableOpacity
                    style={[
                        styles.checkInButton,
                        (isUploading ||
                            !capturedImage ||
                            (isUserLate &&
                                (!reasonInput.trim() ||
                                    !reasonValidation.isValid ||
                                    reasonValidation.hasPunctuation)) ||
                            (isClientEnabled && !selectedClient)) &&
                        styles.disabledButton,
                    ]}
                    onPress={handleClockIn}
                    disabled={
                        isUploading ||
                        !capturedImage ||
                        (isUserLate &&
                            (!reasonInput.trim() || !reasonValidation.isValid || reasonValidation.hasPunctuation)) ||
                        (isClientEnabled && !selectedClient)
                    }
                    activeOpacity={0.8}
                >
                    {isUploading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.buttonText}>Memproses...</Text>
                        </View>
                    ) : (
                        <View style={styles.buttonContent}>
                            <Ionicons name="checkmark-circle" size={20} color="white" />
                            <Text style={styles.buttonText}>{isUserLate ? 'Clock In (Terlambat)' : 'Clock In'}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Custom Toast for iOS */}
            {
                Platform.OS === 'ios' && toast.show && (
                    <Animated.View style={styles.toastContainer}>
                        <View style={styles.toastContent}>
                            <Text style={styles.toastText}>{toast.message}</Text>
                        </View>
                    </Animated.View>
                )
            }

            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },

    // Enhanced Header Styles
    backgroundBox: {
        height: 325,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 30,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 16,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 20,
    },
    backButton: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    headerText: {
        fontSize: FONTS.size['4xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    placeholderView: {
        width: 44,
    },

    // Enhanced Header Styles
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusIndicatorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicatorBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -30,
        right: -20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 80,
        right: 30,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        Left: -10,
    },
    decorativeCircle5: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 120,
        left: 30,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 24,
    },
    decorationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
    decorationDotLarge: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },

    // Content Styles
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
    },
    content: {
        padding: 20,
        gap: 20,
    },

    // Time Card Styles
    timeLocationCard: {
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
    timeLocationHeader: {
        flexDirection: 'column',
        gap: 16,
    },
    timeStatusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
    },
    lateStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffddddff',
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
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.xs,
    },

    // Location Card Styles
    locationCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        gap: 16,
    },
    clientModeCard: {
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
        backgroundColor: '#F0FDF4',
        padding: 20,
        borderRadius: 12,
    },
    locationContainer: {
        flexDirection: 'column',
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    clientIndicator: {
        marginLeft: 'auto',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    clientIndicatorText: {
        color: 'white',
        fontSize: FONTS.size.xs,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        letterSpacing: 0.5,
    },
    clientModeIndicator: {
        marginLeft: 'auto',
        backgroundColor: '#10B981',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    clientModeText: {
        color: 'white',
        fontSize: FONTS.size.xs,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        letterSpacing: 0.5,
    },
    locationTitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        color: '#1F2937',
        flex: 1,
    },
    locationDetails: {
        marginLeft: 28,
        gap: 4,
    },
    locationName: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#1F2937',
        lineHeight: 20,
    },
    coordinatesText: {
        fontSize: FONTS.size.sm,
        color: '#9CA3AF',
        fontFamily: 'monospace',
    },
    checkboxContainer: {
        gap: 8,
    },
    checkboxTitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        color: '#1F2937',
        marginBottom: 8,
    },
    checkboxItem: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    wfhContainer: {
        marginTop: 8,
    },

    // Client Styles
    clientContainer: {
        marginTop: 4,
        gap: 8,
        paddingTop: 6,
        paddingHorizontal: 4,
    },
    clientInfoContainer: {
        backgroundColor: 'linear-gradient(135deg, #EBF8FF 0%, #F0F9FF 100%)',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        borderWidth: 1,
        borderColor: '#BAE6FD',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    selectedClientCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginTop: 6,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1.5,
        borderColor: '#10B981',
        position: 'relative',
        overflow: 'hidden',
    },
    selectedClientHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 12,
    },
    clientIconWrapper: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#10B981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3,
        elevation: 3,
    },
    clientInfoWrapper: {
        flex: 1,
        gap: 4,
    },
    selectedClientLabel: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#10B981',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    selectedClientName: {
        fontSize: FONTS.size.md,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        lineHeight: 24,
    },
    checkmarkWrapper: {
        backgroundColor: '#F0FDF4',
        borderRadius: 20,
        padding: 8,
    },
    changeClientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 6,
    },
    changeClientText: {
        fontSize: FONTS.size.sm,
        fontWeight: '600',
        fontFamily: FONTS.family.semiBold,
        color: '#10B981',
    },
    changeClientModal: {
        marginTop: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    selectedClientAddress: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#F8FAF8',
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#10B981',
        marginBottom: 12,
    },
    addressIconWrapper: {
        marginTop: 2,
    },
    selectedClientAddressText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#374151',
        flex: 1,
        lineHeight: 20,
        fontWeight: '500',
    },
    selectedClientFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10B981',
    },
    statusText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#10B981',
    },
    clientNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0F2FE',
    },
    clientNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#0C4A6E',
        flex: 1,
    },
    loadingContainer: {
        paddingVertical: 20,
        paddingHorizontal: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    loadingClientContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 14,
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
        gap: 12,
    },
    loadingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#DCFCE7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingTextContainer: {
        flex: 1,
        gap: 4,
    },
    loadingTitle: {
        fontSize: FONTS.size.lg,
        fontWeight: '600',
        fontFamily: FONTS.family.semiBold,
        color: '#15803D',
    },
    loadingSubtitle: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.regular,
        color: '#22C55E',
        fontWeight: '400',
    },
    loadingText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    clientAddressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 8,
    },
    clientAddressText: {
        fontSize: 13,
        color: '#374151',
        flex: 1,
        lineHeight: 18,
        fontWeight: '400',
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
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        color: '#1F2937',
    },
    cameraButton: {
        backgroundColor: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        gap: 16,
        minHeight: 160,
    },
    cameraIconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    cameraButtonText: {
        fontSize: FONTS.size.lg,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        marginTop: 4,
    },
    cameraSubtext: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    previewImage: {
        width: '100%',
        height: 280,
        borderRadius: 12,
        resizeMode: 'cover',
        backgroundColor: '#F3F4F6',
    },
    retakeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    retakeButtonText: {
        color: 'white',
        fontSize: FONTS.size.sm,
        fontWeight: '600',
        fontFamily: FONTS.family.semiBold,
    },

    // Reason Card Styles
    reasonCard: {
        backgroundColor: '#FEF2F2',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    reasonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 4,
    },
    reasonTitle: {
        fontSize: FONTS.size.md,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        color: '#DC2626',
        flex: 1,
    },
    reasonInput: {
        borderWidth: 2,
        borderColor: '#FECACA',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        fontSize: FONTS.size.base,
        fontFamily: FONTS.family.regular,
        color: '#1F2937',
        minHeight: 100,
        backgroundColor: 'white',
        textAlignVertical: 'top',
        fontWeight: '500',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    nearLimitInput: {
        borderColor: '#F59E0B',
        shadowColor: '#F59E0B',
    },
    invalidInput: {
        borderColor: '#EF4444',
        shadowColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    characterCountContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    characterCount: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    nearLimitCount: {
        color: '#F59E0B',
        fontWeight: '600',
        fontFamily: FONTS.family.semiBold,
    },
    limitReachedCount: {
        color: '#EF4444',
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
    },
    limitWarning: {
        fontSize: FONTS.size.xs,
        fontFamily: FONTS.family.semiBold,
        color: '#F59E0B',
        fontWeight: '600',
        fontStyle: 'italic',
    },
    // Bottom Button Styles
    bottomContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        paddingHorizontal: 20,
        paddingVertical: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 12,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },
    checkInButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 16,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
        minHeight: 56,
    },
    disabledButton: {
        backgroundColor: '#9CA3AF',
        shadowColor: '#9CA3AF',
        shadowOpacity: 0.2,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: FONTS.size.lg,
        fontWeight: '700',
        fontFamily: FONTS.family.bold,
        letterSpacing: 0.5,
    },

    // Toast Styles for iOS
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 100 : 80,
        left: 20,
        right: 20,
        zIndex: 1000,
        alignItems: 'center',
    },
    toastContent: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        maxWidth: '90%',
    },
    toastText: {
        color: 'white',
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        textAlign: 'center',
    },
});

export default DetailKehadiran;
