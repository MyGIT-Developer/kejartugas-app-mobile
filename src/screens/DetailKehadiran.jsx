import {
    View,
    Text,
    StyleSheet,
    Button,
    Modal,
    Alert,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import ColorList from '../components/ColorList';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library
import CircularButton from '../components/CircularButton';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import the date picker
import { ScrollView } from 'react-native-gesture-handler';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // To convert image to base64
import MyMap from '../components/Maps';
import { AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
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
    const [textAreaValue, setTextAreaValue] = useState(''); // State for text input
    const [attendanceImage, setAttendanceImage] = useState(null); // State to hold the attendance image
    const [isUserLate, setIsUserLate] = useState(false); // State to track if user is late
    const [modalVisible, setModalVisible] = useState(false); // State to control modal visibility
    const [reasonInput, setReasonInput] = useState(''); // State to hold the late reason input
    const [locationParameter, setLocationParameter] = useState(null);
    const [radiusParameter, setRadiusParameter] = useState(0);

    useEffect(() => {
        const getData = async () => {
            try {
                const employeeId = await AsyncStorage.getItem('employeeId');
                const companyId = await AsyncStorage.getItem('companyId');

                setEmployeeId(employeeId);
                setCompanyId(companyId);
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };

        getData(); // Call the async function
    }, []); // Empty array ensures this effect runs only once after the component mounts

    const fetchOfficeHour = async () => {
        try {
            const response = await getParameter(companyId);
            setjamTelat(response.data.jam_telat);
            setLocationParameter(response.data.location);
            setRadiusParameter(response.data.radius);
        } catch (error) {
            console.error('Error fetching office hour data:', error);
            return null;
        }
    };

    const calculateLateStatus = (jamTelat) => {
        if (!jamTelat) return false;

        const currentDate = new Date();
        const [hours, minutes] = jamTelat.split(':').map(Number);

        const officeStartTime = new Date();
        officeStartTime.setHours(hours, minutes, 0, 0);

        return currentDate > officeStartTime;
    };

    useEffect(() => {
        fetchOfficeHour();
    }, [companyId]);

    useEffect(() => {
        if (jamTelat) {
            const isLate = calculateLateStatus(jamTelat);
            setIsUserLate(isLate);
            console.log('isLate', isLate);
        }
    }, [jamTelat, currentTime]);

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

    console.log('location parameter', locationParameter);
    console.log('radius parameter', radiusParameter);

    const [location, setLocation] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [latitude, setLatitude] = useState(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const latitude = location.coords.latitude;
            const longitude = location.coords.longitude;

            // Format latitude and longitude
            const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(formattedCoordinates);
            setLatitude(latitude);
            setLongitude(longitude);

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

    const [alert, setAlert] = useState({ show: false, message: '', type: 'success' });

    const showAlert = useCallback((message, type = 'error') => {
        setAlert({ show: true, message, type });
    }, []);

    const handleClockIn = async () => {
        try {
            // Launch the camera to capture an image
            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                // Check if the base64 data exists; if not, read from the file
                const attendanceImage = result.assets[0].base64
                    ? `data:image/jpeg;base64,${result.assets[0].base64}`
                    : await FileSystem.readAsStringAsync(result.assets[0].uri, {
                          encoding: FileSystem.EncodingType.Base64,
                      });

                setAttendanceImage(attendanceImage);

                const note = isUserLate ? reasonInput : null;

                try {
                    const response = await checkIn(employeeId, companyId, note, attendanceImage, location);
                    // Complete the check-in process
                    console.log('Check-in success:', response);
                    showAlert('Anda berhasil check-in!', 'success');

                    fetchAttendanceData();
                } catch (error) {
                    console.error('Check-in error:', error);
                    showAlert(`${error.message}`, 'error');
                }
            } else {
                console.log('Camera was canceled or no valid image was captured.');
            }
        } catch (error) {
            console.error('Check-in error:', error);
            showAlert(`${error.message}`, 'error');
        }
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    const markerCoordinates = {
        latitude: latitude,
        longitude: longitude,
    };

    const circleRadius = 500;

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient} // Apply the gradient to the entire backgroundBox
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <Feather name="chevron-left" style={styles.backIcon} />

            <Text style={styles.timeText} onPress={handleGoBack}>
                {currentTime}
            </Text>

            {/* Map View */}
            <MyMap markerCoordinates={markerCoordinates} circleRadius={circleRadius}/>

            {/* Time and Location Overlay */}
            <View style={styles.overlayBottom}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardAvoidingView}
                >
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <View style={{ padding: 20 }}>
                            <Text style={{ fontWeight: '500', fontSize: 20 }}>Clock In</Text>
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
                                    <View />
                                    <Text style={{ fontWeight: '400', fontSize: 14 }}>{locationName}</Text>
                                </View>
                            </View>
                        </View>

                        {isUserLate && (
                            <View style={styles.midContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={reasonInput}
                                    onChangeText={setReasonInput}
                                    placeholder="Masukkan alasan keterlambatan"
                                />
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.checkInButton,
                                    !reasonInput ? styles.disabledButton : styles.enabledButton,
                                ]}
                                onPress={handleClockIn}
                                disabled={!reasonInput}
                            >
                                <Text style={styles.buttonText}>Clock In</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    },
    backgroundBox: {
        height: 80, // Set your desired height
        width: '100%', // Set your desired width
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
        zIndex: 2, // Ensure it's behind other elements
        opacity: 0.9, // Semi-transparent
    },
    linearGradient: {
        flex: 1, // Ensure the gradient covers the entire view
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    header: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backIcon: {
        position: 'absolute',
        fontSize: 24,
        top: 40,
        left: 20,
        zIndex: 5, // Make sure it's above the map
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
            width: 0,
            height: 5, // Positive value to cast shadow upwards
        },
        shadowOpacity: 0.3,
        shadowRadius: 6,

        // Android Shadow (Elevation)
        elevation: 8,
    },
    keyboardAvoidingView: {
        flex: 1, // Make sure it covers the full area
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
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
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        width: '100%',
        marginBottom: 20,
    },
    imageStyle: {
        width: 100, // Set the width of the image
        height: 100, // Set the height of the image
        borderRadius: 10, // Optional: for rounded corners
        marginTop: 10, // Space between the image and other content
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
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        position: 'absolute',
        color: 'white',
        top: 35,
        left: 0,
        right: 0,
        zIndex: 5,
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
        width: '100%',
        borderColor: 'gray',
        borderWidth: 1,
        padding: 10,
        borderRadius: 10,
        textAlignVertical: 'top', // Ensures text starts at the top of the area
    },
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    midContainer: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        display: 'flex',
        flexDirection: 'column',
    },
    lowerContainer: {
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 20,
        height: 250,
    },
});

export default DetailKehadiran;
