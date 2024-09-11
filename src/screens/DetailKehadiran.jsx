import { View, Text, StyleSheet, Button, Alert, TextInput, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';
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

    const startDate = new Date('2024-09-01'); // 1st September 2024
    const today = new Date(); // Today's date

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

    console.log('response', jamTelat);

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

    const getBackgroundColor = (absenStatus) => {
        switch (absenStatus) {
            case 'On Time':
                return '#6d8de4';
            case 'Early':
                return '#9de8bf';
            case 'Late':
                return '#f99c92';
            case 'Holiday':
                return '#c0c0c0';
            default:
                return '#c0c0c0';
        }
    };

    const getIndicatorColor = (absenStatus) => {
        switch (absenStatus) {
            case 'On Time':
                return '#2066ae';
            case 'Early':
                return '#20ae60';
            case 'Late':
                return '#ae2920';
            case 'Holiday':
                return '#6e6e6e';
            default:
                return '#6e6e6e';
        }
    };

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
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);

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
            console.log('latitude', latitude);
            console.log('longitude', longitude);
            // Format latitude and longitude
            const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(formattedCoordinates);
            setLongitude(longitude);
            setLatitude(latitude);
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

    const [isCheckedInToday, setIsCheckedInToday] = useState(false);
    const [lateReason, setLateReason] = useState('Saya Telat Oi');

    const calculateLateStatus = () => {
        const currentDate = new Date();
        const jamTelatParts = jamTelat.split(':');
        const officeStartTime = new Date();
        officeStartTime.setHours(parseInt(jamTelatParts[0], 10));
        officeStartTime.setMinutes(parseInt(jamTelatParts[1], 10));
        officeStartTime.setSeconds(0);

        return currentDate > officeStartTime;
    };

    const handleClockIn = async () => {
        let attendanceImage = '';

        try {
            // Open the camera with base64 option enabled
            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: true,
            });

            // Check if the camera operation was successful
            if (!result.canceled && result.assets && result.assets[0].uri) {
                // Use base64 from the result if available
                attendanceImage = result.assets[0].base64
                    ? `data:image/jpeg;base64,${result.assets[0].base64}`
                    : await FileSystem.readAsStringAsync(result.assets[0].uri, {
                          encoding: FileSystem.EncodingType.Base64,
                      });

                // Log data to verify
                console.log(companyId, employeeId, lateReason, location);

                // completeCheckIn(attendanceImage, null);
                // Calculate if the user is late
                const isLate = calculateLateStatus();
                const response = await checkIn(employeeId, companyId, lateReason, attendanceImage, location);
                console.log(response.data);
                if (isLate) {
                    // Show an alert or modal to input the late reason
                    Alert.prompt(
                        'Anda Terlambat!',
                        'Silakan berikan alasan keterlambatan Anda:',
                        [
                            {
                                text: 'Batal',
                                style: 'cancel',
                                onPress: () => console.log('Check-in canceled'),
                            },
                            {
                                text: 'Kirim',
                                onPress: (reason) => {
                                    setLateReason(reason);
                                    completeCheckIn(attendanceImage, reason);
                                },
                            },
                        ],
                        'plain-text',
                    );
                } else {
                    // Proceed with the check-in without late reason
                    completeCheckIn(attendanceImage, lateReason);
                }
            } else {
                return; // Exit if the camera was cancelled or no valid URI was returned
            }
        } catch (error) {
            const errorMessage = error || 'Unknown error';
            console.log('Check-in error:', errorMessage);
            alert(`Error when checking in: ${errorMessage}`);
        }
    };

    // Complete check-in function
    const completeCheckIn = async (attendanceImage, note) => {
        try {
            // Continue with the API call using attendanceImage, lateReason, and location
            const response = await checkIn(employeeId, companyId, note, attendanceImage, location);
            console.log('Check-in success:', response.data);
        alert('Anda berhasil check-in!');
        } catch (error) {
            const errorMessage = error || 'Unknown error';
            console.log('Check-in error:', errorMessage);
            alert(`Error when checking in: ${errorMessage}`);
        }
    };

    const handleClockOut = async () => {
        // setIsCheckedInToday(false);
        try {
            const updateResponse = await checkOut(employeeId, companyId);

            console.log('Check-out success:', updateResponse.data);

            alert('You have successfully checked out!');

            fetchAttendanceData();
        } catch (error) {
            // console.error("Error when checking out:", error);
            const errorMessage = error || 'Unknown error';

            console.log('Check-out error:', errorMessage);
            alert(`Error when checking out: ${errorMessage}`);
        }
    };

    const [date, setDate] = useState(new Date()); // State to hold the selected date
    const [show, setShow] = useState(false); // State to control visibility of the date picker

    // Function to handle date change
    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(Platform.OS === 'ios'); // Keep the picker open on iOS
        setDate(currentDate);
    };

    // Function to show the date picker
    const showDatePicker = () => {
        setShow(true);
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <View style={{ flex: 1 }}>
            <Icon name="arrow-back" size={30} color="black" style={styles.backIcon} onPress={handleGoBack} />

            {/* Map View */}
            <MyMap />

            {/* Time and Location Overlay */}
            <View style={styles.overlay}>
                <View>
                    <Text style={styles.timeText}>{currentTime}</Text>
                <Text style={styles.locationText}>{locationName}</Text>
                </View>
                <View style={styles.midContainer}>

      {/* Text area (TextInput) */}
      <TextInput
        style={styles.textArea}
        placeholder="Enter your text here"
        multiline
        numberOfLines={4}
        value={textAreaValue}
        onChangeText={(text) => setTextAreaValue(text)}
      />
    </View>
                <View style={styles.buttonContainer}>
                      <Button title="Clock In" style={styles.checkInButton} onPress={handleClockIn} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backIcon: {
        position: 'absolute',
        top: 50,
        left: 20,
        zIndex: 1, // Make sure it's above the map
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        height:'50%',
        width: '100%',
        backgroundColor: 'white', // Semi-transparent background
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 30,
            height: 10,
        },
        shadowOpacity: 0.5,
    },
    timeText: {
        color: 'white',
        fontSize: 18,
    },
    locationText: {
        color: 'white',
        fontSize: 16,
        marginTop: 5,
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
        fontSize: 34,
        fontWeight: 'bold',
        textAlign: 'center',
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
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    checkInButton: {
        backgroundColor: '#6d8de4',
        color: 'white',
        width: '100%',
        padding: 10,
        borderRadius: 10,
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
        marginTop: 20,
        height: 250,
    },
});

export default DetailKehadiran;
