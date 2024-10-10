import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import MyMap from '../components/Maps';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { Feather } from '@expo/vector-icons';
import CheckBox from '../components/Checkbox';
import DraggableOverlayBottom from '../components/DraggableOverlayBottom';

const DetailKehadiran = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [locationName, setLocationName] = useState('Waiting for location...');
    const [errorMsg, setErrorMsg] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [jamTelat, setjamTelat] = useState('');
    const navigation = useNavigation();
    const [isWFH, setIsWFH] = useState(false);
    const [currentStep, setCurrentStep] = useState('camera');
    const [capturedImage, setCapturedImage] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [reasonInput, setReasonInput] = useState('');
    const [location, setLocation] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    useEffect(() => {
        const setupPage = async () => {
            await getStoredData();
            if (currentStep === 'camera' && isCameraReady) {
                await requestCameraPermission();
            }
        };

        setupPage();
    }, [currentStep, isCameraReady]);

    useEffect(() => {
        setIsCameraReady(true);
        return () => setIsCameraReady(false);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const options = { hour: '2-digit', minute: '2-digit', hour12: true };
            const time = now.toLocaleTimeString([], options);
            setCurrentTime(time);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetchOfficeHour();
        fetchAttendanceData();
        getLocation();
    }, [companyId, employeeId]);

    const getStoredData = async () => {
        try {
            const storedEmployeeId = await AsyncStorage.getItem('employeeId');
            const storedCompanyId = await AsyncStorage.getItem('companyId');
            setEmployeeId(storedEmployeeId);
            setCompanyId(storedCompanyId);
        } catch (error) {
            console.error('Error fetching AsyncStorage data:', error);
            showAlert('Failed to load user data', 'error');
        }
    };

    const fetchOfficeHour = async () => {
        try {
            const response = await getParameter(companyId);
            setjamTelat(response.data.jam_telat);
            console.log('nasgor', response.data.jam_telat);
        } catch (error) {
            console.error("Error fetching office hour data:", error.response.data.message);
            showAlert('Failed to fetch office hours', 'error');
        }
    };

    const fetchAttendanceData = async () => {
        try {
            const response = await getAttendance(employeeId);
            setAttendanceData(response.attendance);
            setIsCheckedIn(response.isCheckedInToday);
        } catch (error) {
            console.error("Error fetching attendance data:", error);
            showAlert('Failed to load attendance data', 'error');
        }
    };

    const getLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let locationResult = await Location.getCurrentPositionAsync({});
            const latitude = locationResult.coords.latitude;
            const longitude = locationResult.coords.longitude;

            const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(formattedCoordinates);

            const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (reverseGeocodeResult) {
                setLocationName(
                    `${reverseGeocodeResult.street || ''}, ${reverseGeocodeResult.city || ''}, ${reverseGeocodeResult.region || ''}, ${reverseGeocodeResult.country || ''}`.replace(/^[,\s]+|[,\s]+$/g, '').replace(/,\s*,/g, ',')
                );
            } else {
                setLocationName('Unable to retrieve location name');
            }
        } catch (error) {
            setErrorMsg('Error getting location: ' + error.message);
            showAlert('Failed to get location', 'error');
        }
    };

    const requestCameraPermission = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera permission is required to take photos.');
            return false;
        }
        triggerCamera();
        return true;
    };

    const triggerCamera = async () => {
        try {
            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                if (await validateImage(result.assets[0].uri)) {
                    setCapturedImage(result.assets[0].uri);
                    setCurrentStep('location');
                } else {
                    throw new Error('Invalid image data');
                }
            } else {
                Alert.alert('Camera was canceled or no valid image was captured.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', `Error when using camera: ${error.message || 'Unknown error'}`);
            navigation.goBack();
        }
    };

    const validateImage = async (uri) => {
        try {
            const fileInfo = await FileSystem.getInfoAsync(uri);
            return fileInfo.exists && fileInfo.size > 0;
        } catch (error) {
            console.error('Error validating image:', error);
            return false;
        }
    };

    const calculateLateStatus = () => {
        const currentDate = new Date();
        const jamTelatParts = jamTelat.split(':');
        const officeStartTime = new Date();
        officeStartTime.setHours(parseInt(jamTelatParts[0], 10));
        officeStartTime.setMinutes(parseInt(jamTelatParts[1], 10));
        officeStartTime.setSeconds(0);

        return currentDate > officeStartTime;
    };

    const isUserLate = calculateLateStatus();

    const handleClockIn = async () => {
        if (isUserLate && !reasonInput.trim()) {
            showAlert('Silahkan memberikan Alasan Keterlambatan!', 'error');
            return;
        }

        try {
            await ensureDirectoryExists(FileSystem.documentDirectory + 'recents/');
            const response = await checkIn(
                employeeId,
                companyId,
                isUserLate ? reasonInput : null,
                capturedImage,
                location,
                isWFH
            );
            showAlert('Anda berhasil check-in!', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            console.error('Check-in error:', error.message);
            showAlert(`Error when checking in: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const ensureDirectoryExists = async (directory) => {
        const dirInfo = await FileSystem.getInfoAsync(directory);
        if (!dirInfo.exists) {
            await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    if (currentStep === 'camera') {
        return (
            <View style={styles.container}>
                <Text>Preparing camera...</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <View style={styles.headerContainer}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={handleGoBack} />
                <Text style={styles.headerText}>Lokasi Kehadiran</Text>
            </View>

            <MyMap />

            <DraggableOverlayBottom>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <View style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <View style={styles.locationContainer}>
                                <View style={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                                    <Icon name="location-on" size={24} color="gray" style={{ fontWeight: '500' }} />
                                    <Text style={{ fontWeight: '500', fontSize: 18 }}>Lokasi saat ini</Text>
                                </View>
                                <View style={{ display: 'flex', flexDirection: 'row', gap: 3, alignItems: 'center' }}>
                                    <Text style={{ fontWeight: '400', fontSize: 14 }}>{locationName}</Text>
                                </View>
                            </View>
                            <CheckBox
                                onPress={() => setIsWFH(!isWFH)}
                                title="Sedang berada di luar kantor"
                                isChecked={isWFH}
                            />
                            {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}
                            {isUserLate && (
                                <View style={styles.lateContainer}>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Silahkan berikan alasan keterlambatan"
                                        value={reasonInput}
                                        onChangeText={setReasonInput}
                                        multiline
                                    />
                                </View>
                            )}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.checkInButton,
                                        isUserLate && !reasonInput ? styles.disabledButton : styles.enabledButton,
                                    ]}
                                    onPress={handleClockIn}
                                    disabled={isUserLate && !reasonInput}
                                >
                                    <Text style={styles.buttonText}>Clock In</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </DraggableOverlayBottom>
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
    },
    backgroundBox: {
        height: 110,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        opacity: 0.9,
        zIndex: 1,
    },
    linearGradient: {
        flex: 1,
        height: 150,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContainer: {
        flexDirection: 'row', // Align elements horizontally
        alignItems: 'center', // Vertically center both icon and text
        justifyContent: 'center', // Center them horizontally in the container
        position: 'absolute',
        top: 60, // Adjust the top margin based on your needs
        width: '100%', // Ensure the header takes the full width
        zIndex: 11, // Ensure it stays above other elements
    },
    backIcon: {
        position: 'absolute',
        left: 20, // Adjust left padding if necessary
        color: 'white',
        fontSize: 24, // Ensure icon size matches the text size
        zIndex: 11,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -1,
    },
    overlayBottom: {
        position: 'absolute',
        bottom: 0,
        height: '40%',
        width: '100%',
        backgroundColor: 'white',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 20,
        justifyContent: 'flex-start',
        alignItems: 'center',

        // iOS Shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 5,
            height: 5, // Positive value to cast shadow upwards
        },
        shadowOpacity: 0.9,
        shadowRadius: 6,

        // Android Shadow (Elevation)
        elevation: 15,
    },
    previewImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
        marginBottom: 20,
        borderRadius: 10,
    },
    lateContainer: {
        marginBottom: 0,
    },
    statusView: {
        backgroundColor: '#ddd',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 50,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    keyboardAvoidingView: {
        flex: 1, // Make sure it covers the full area
    },
    checkboxContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    checkbox: {
        alignSelf: 'center',
    },
    label: {
        margin: 8,
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    buttonContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        gap: 10,
    },
    retakeButton: { backgroundColor: '#27A0CF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    checkInButton: {
        backgroundColor: '#27A0CF',
        borderRadius: 30,
        padding: 15,
        width: '100%', // Adjust the width as needed
        alignItems: 'center', // Center the text horizontally
        justifyContent: 'center', // Center the text vertically
    },
    enabledButton: {
        backgroundColor: '#27A0CF', // Button color when enabled
    },
    disabledButton: {
        backgroundColor: 'gray', // Button color when disabled
    },
    buttonText: {
        color: 'white', // Text color
        fontSize: 16,
        textAlign: 'center',
    },
    locationContainer: {
        display: 'flex',
        flexDirection: 'column',
        marginTop: 10,
        gap: 10,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        width: '100%',
        marginBottom: 20,
        height: 100,
        textAlignVertical: 'top',
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginTop: 50,
    },
    upperContainer: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 20,
        // height: 200,
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        padding: 20,
    },
    locationText: {
        fontSize: 14,
        textAlign: 'center',
        color: 'gray',
        marginBottom: 10,
    },
    icon: {
        marginRight: 10, // Space between the icon and text
    },
    textArea: {
        height: 100,
        width: '100%',
        borderColor: 'gray',
        borderWidth: 1,
        marginTop: 10,
        padding: 10,
        borderRadius: 10,
        textAlignVertical: 'top', // Ensures text starts at the top of the area
    },
    midContainer: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 20,
        maxHeight: 75,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    lowerContainer: {
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        height: 250,
    },
});

export default DetailKehadiran;
