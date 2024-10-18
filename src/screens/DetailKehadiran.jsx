import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn } from '../api/absent';
import * as ImageManipulator from 'expo-image-manipulator';
import Shimmer from '../components/Shimmer'; // Sesuaikan path jika diperlukan
import MyMap from '../components/Maps';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import CheckBox from '../components/Checkbox';
import { Camera } from 'expo-camera'; // Import Camera
const DetailKehadiran = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { location, locationName, jamTelat = [], radius } = route.params || {};

    const [currentTime, setCurrentTime] = useState('');
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [isWFH, setIsWFH] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [capturedImageBase64, setCapturedImageBase64] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [reasonInput, setReasonInput] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const [latitude, longitude] = location.split(',').map((coord) => parseFloat(coord.trim()));

    const parsedLocation = {
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude,
    };

    useEffect(() => {
        const interval = setInterval(updateCurrentTime, 1000);
        getStoredData();
        triggerCamera();
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
            const { status } = await Camera.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showAlert('Izin Ditolak. Aplikasi membutuhkan izin kamera untuk melanjutkan.', 'error');
                return;
            }

            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                const compressedBase64 = await compressAndConvertToBase64(result.assets[0].uri);
                setCapturedImage(result.assets[0].uri);
                setCapturedImageBase64(compressedBase64);
            } else {
                showAlert('Kamera dibatalkan atau tidak ada gambar yang diambil.', 'error');
            }
        } catch (error) {
            console.error('Error menggunakan kamera:', error);
            showAlert(`Error saat menggunakan kamera: ${error.message || 'Error tidak diketahui'}`, 'error');
        }
    };

    const handleClockIn = async () => {
        if (!capturedImageBase64) {
            showAlert('Silahkan mengambil foto terlebih dahulu!', 'error');
            return;
        }

        if (isUserLate && !reasonInput.trim()) {
            showAlert('Silahkan memberikan Alasan Keterlambatan!', 'error');
            return;
        }

        setIsUploading(true);
        try {
            const response = await checkIn(
                employeeId,
                companyId,
                isUserLate ? reasonInput : null,
                capturedImageBase64,
                location,
                isWFH,
            );
            console.log('Check-in response:', response); // Log the server response
            showAlert('Anda berhasil check-in!', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            console.error('Check-in error:', error);
            showAlert(`Error when checking in: ${error.message || 'Unknown error'}`, 'error');
        } finally {
            setIsUploading(false);
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.headerContainer}>
                        <Feather name="chevron-left" style={styles.backIcon} onPress={handleGoBack} />
                        <Text style={styles.headerText}>Lokasi Kehadiran</Text>
                    </View>
                </LinearGradient>

                <View style={styles.content}>
                    <View style={styles.timeContainer}>
                        <Text style={styles.timeText}>{currentTime}</Text>
                        {isUserLate && (
                            <View style={styles.lateStatusContainer}>
                                <View style={styles.lateStatusDot} />
                                <Text style={styles.lateStatusText}>Late</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.locationContainer}>
                        <Icon name="location-on" size={24} color="gray" />
                        <Text style={styles.locationTitle}>Lokasi saat ini</Text>
                    </View>
                    <Text style={styles.locationName}>{locationName}</Text>

                    <CheckBox onPress={() => setIsWFH(!isWFH)} title="Sedang berada di luar kantor" isChecked={isWFH} />

                    {!capturedImage && (
                        <TouchableOpacity style={styles.cameraButton} onPress={triggerCamera}>
                            <Icon name="camera-alt" size={24} color="white" />
                            <Text style={styles.cameraButtonText}>Ambil Foto Ulang</Text>
                        </TouchableOpacity>
                    )}

                    {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}

                    {isUserLate && (
                        <TextInput
                            style={styles.input}
                            placeholder="Silahkan berikan alasan keterlambatan"
                            value={reasonInput}
                            onChangeText={setReasonInput}
                            multiline
                        />
                    )}
                </View>
            </ScrollView>

            <View style={styles.bottomButtonContainer}>
                <TouchableOpacity
                    style={[
                        styles.checkInButton,
                        (isUploading || !capturedImage || (isUserLate && !reasonInput)) && styles.disabledButton,
                    ]}
                    onPress={handleClockIn}
                    disabled={isUploading || !capturedImage || (isUserLate && !reasonInput)}
                >
                    <Text style={styles.buttonText}>{isUploading ? 'Uploading...' : 'Clock In'}</Text>
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
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        paddingBottom: 100, // Provide space for the button at the bottom
    },
    linearGradient: {
        height: 110,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    backIcon: {
        position: 'absolute',
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    content: {
        padding: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    lateStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffbda5',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    lateStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff0002',
        marginRight: 5,
    },
    lateStatusText: {
        color: '#000',
        fontWeight: '500',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 5,
    },
    locationName: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 15,
    },
    mapContainer: {
        height: 200,
        marginBottom: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27A0CF',
        padding: 15,
        borderRadius: 10,
        marginVertical: 20,
    },
    cameraButtonText: {
        color: 'white',
        marginLeft: 10,
        fontSize: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        height: 100,
        textAlignVertical: 'top',
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    checkInButton: {
        backgroundColor: '#27A0CF',
        borderRadius: 30,
        padding: 15,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: 'gray',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default DetailKehadiran;
