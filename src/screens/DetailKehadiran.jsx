import {
    View,
    Text,
    StyleSheet,
    Button,
    Alert,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library
import { ScrollView } from 'react-native-gesture-handler';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // To convert image to base64
import MyMap from '../components/Maps';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { Feather } from '@expo/vector-icons';
import CheckBox from '../components/Checkbox';
import DraggableOverlayBottom from '../components/DraggableOverlayBottom'; // Adjust the import path as needed
import ClickableBottomOverlay from '../components/ClickableBottomOverlay';

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

    const fetchOfficeHour = async () => {
        try {
            const response = await getParameter(companyId);

            setjamTelat(response.data.jam_telat);
        } catch (error) {
            // console.error("Error fetching office hour data:", error);
        }
    };

    useEffect(() => {
        fetchOfficeHour();
    }, [companyId]);

    const fetchAttendanceData = async () => {
        try {
            const response = await getAttendance(employeeId);
            setAttendanceData(response.attendance);
            setIsCheckedIn(response.isCheckedInToday);
        } catch (error) {
            // console.error("Error fetching attendance data:", error);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [employeeId]);

    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            const now = new Date();
            const options = {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            };
            const time = now.toLocaleTimeString([], options);
            setCurrentTime(time);
        }, 1000);

        // Cleanup interval on component unmount
        return () => clearInterval(interval);
    }, []);

    const [location, setLocation] = useState(null);

    useEffect(() => {
        // Get location permissions and device location
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            // const latitude = -6.1974472;
            // const longitude = 106.7610134;
            console.log('Latitude:', latitude);
            console.log('Longitude:', longitude);
            // Format latitude and longitude
            const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(formattedCoordinates);
            // Reverse geocode to get location name
            const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (reverseGeocodeResult) {
                setLocationName(
                    `${reverseGeocodeResult.street}, ${reverseGeocodeResult.city}, ${reverseGeocodeResult.region}, ${reverseGeocodeResult.country}`,
                );
            } else {
                setLocationName('Unable to retrieve location name');
            }
        })();
    }, []);

    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [reasonInput, setReasonInput] = useState('');

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
    const [capturedImage, setCapturedImage] = useState(null);

    useEffect(() => {
        const setupPage = async () => {
            await getStoredData();
            await getLocation();
            triggerCamera();
        };

        setupPage();
    }, []);

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

    const getLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(`${location.coords.latitude}, ${location.coords.longitude}`);

        const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
        });

        if (reverseGeocodeResult) {
            setLocationName(
                `${reverseGeocodeResult.street}, ${reverseGeocodeResult.city}, ${reverseGeocodeResult.region}, ${reverseGeocodeResult.country}`,
            );
        }
    };

    const triggerCamera = async () => {
        try {
            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                setCapturedImage(result.assets[0].uri);
            } else {
                Alert.alert('Camera was canceled or no valid image was captured.');
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', `Error when using camera: ${error.message || 'Unknown error'}`);
        }
    };

    const handleClockIn = async () => {
        if (!capturedImage) {
            Alert.alert('Error', 'No image captured. Please take a photo first.');
            return;
        }

        if (isUserLate && !reasonInput.trim()) {
            Alert.alert('Error', 'Please provide a reason for being late.');
            return;
        }

        try {
            const response = await checkIn(
                employeeId,
                companyId,
                isUserLate ? reasonInput : null,
                capturedImage,
                location,
                isWFH,
            );
            showAlert('Anda berhasil check-in!', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            console.error('Check-in error:', error);
            Alert.alert('Error', `Error when checking in: ${error.message || 'Unknown error'}`);
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

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

            {/* Container for the back icon and text */}
            <View style={styles.headerContainer}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={handleGoBack} />
                <Text style={styles.headerText}>Lokasi Kehadiran</Text>
            </View>

            {/* Map View */}
            <MyMap />

            {/* Time and Location Overlay */}
            <DraggableOverlayBottom>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <View style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
                            <View
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    gap: 10,
                                }}
                            >
                                <Text style={{ fontWeight: '500', fontSize: 20 }}>Clock In</Text>
                                {isUserLate && (
                                    <View style={[styles.statusView, { backgroundColor: '#ffbda5' }]}>
                                        <View style={{ padding: 4, borderRadius: 50, backgroundColor: '#ff0002' }} />
                                        <Text style={{ color: '#000' }}>Late</Text>
                                    </View>
                                )}
                            </View>

                            <View style={styles.locationContainer}>
                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: 3,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Icon name="location-on" size={24} color="gray" style={{ fontWeight: '500' }} />
                                    <Text style={{ fontWeight: '500', fontSize: 18 }}>Lokasi saat ini</Text>
                                </View>

                                <View
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        gap: 3,
                                        alignItems: 'center',
                                    }}
                                >
                                    <Text style={{ fontWeight: '400', fontSize: 14 }}>{locationName}</Text>
                                </View>
                            </View>
                            <CheckBox onPress={() => setIsWFH(!isWFH)} title="Sedang berada di luar kantor" isChecked={isWFH} />
                            {capturedImage && <Image source={{ uri: capturedImage }} style={styles.previewImage} />}
                            {isUserLate && (
                                <View style={styles.lateContainer}>
                                    {/* <Text style={styles.lateText}></Text> */}
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
                            {isUserLate ? (
                                <TouchableOpacity
                                    style={[
                                        styles.checkInButton, styles.enabledButton,
                                    ]}
                                    onPress={handleClockIn}
                                >
                                    <Text style={styles.buttonText}>Clock In</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[
                                        styles.checkInButton,
                                    ]}
                                    onPress={handleClockIn}
                                >
                                    <Text style={styles.buttonText}>Clock In</Text>
                                </TouchableOpacity>
                            )}
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
        zIndex: 2, // Ensure it stays above other elements
    },
    backIcon: {
        position: 'absolute',
        left: 20, // Adjust left padding if necessary
        color: 'white',
        fontSize: 24, // Ensure icon size matches the text size
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
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
        marginBottom: 20,
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
        padding: 10,
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
