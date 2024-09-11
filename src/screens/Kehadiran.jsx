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
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import axios from 'axios';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import * as FileSystem from 'expo-file-system'; // To convert image to base64
import { useNavigation } from '@react-navigation/native';

const Kehadiran = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [locationName, setLocationName] = useState('Waiting for location...');
    const [errorMsg, setErrorMsg] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [jamTelat, setjamTelat] = useState('');
    const navigation = useNavigation();

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

    // Calculate the number of days between startDate and today
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 7;

    const dateViews = [];
    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        const formattedDateForUpper = currentDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const formattedDate = currentDate.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        const attendanceForDate = attendanceData.find((attendance) => {
            const checkinDate = new Date(attendance.checkin).toISOString().split('T')[0];
            return checkinDate === formattedDate;
        });

        const status = attendanceForDate ? attendanceForDate.status : 'No Status';
        const checkIn = attendanceForDate
            ? new Date(attendanceForDate.checkin).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : 'N/A';

        const checkOut = attendanceForDate
            ? new Date(attendanceForDate.checkout).toLocaleTimeString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : attendanceForDate === 'null'
            ? '-'
            : 'N/A';

        const duration = attendanceForDate ? attendanceForDate.duration : 'N/A';
        const notes = attendanceForDate ? attendanceForDate.note : 'No notes';

        // Push the views into the array to render later
        dateViews.push(
            <View key={i} style={styles.containerPerDate}>
                <View style={styles.upperAbsent}>
                    <Text>{formattedDateForUpper}</Text>
                    <View style={[styles.statusView, { backgroundColor: getBackgroundColor(status) }]}>
                        <Text style={{ color: getIndicatorColor(status) }}>{status}</Text>
                    </View>
                </View>

                <View style={styles.midAbsent}>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Check In</Text>
                        <Text style={styles.tableCell}>{checkIn}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Check Out</Text>
                        <Text style={styles.tableCell}>{checkOut}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Durasi</Text>
                        <Text style={styles.tableCell}>{duration}</Text>
                    </View>
                </View>

                <View style={styles.lowerAbsent}>
                    <Text>Notes</Text>
                    <View style={styles.statusView}>
                        <Text>{notes}</Text>
                    </View>
                </View>
            </View>,
        );
    }

    // Calculate the current page's date views
    const paginatedDateViews = dateViews.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);

    // Calculate the total number of pages
    const totalPages = Math.ceil(dateViews.length / itemsPerPage);

    // Handle "Next" and "Previous" page navigation
    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
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

    // const handleClockIn = async () => {
    //     navigation.navigate('DetailKehadiran');
    // };

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
        } finally {
            fetchAttendanceData();
            setIsCheckedInToday(true);
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

    return (
        <View style={{ flex: 1 }}>
            {/* Ensure the parent View takes the full available space */}
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient} // Apply the gradient to the entire backgroundBox
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <Text style={styles.header}>Kehadiran</Text>
            <ScrollView>
                <View style={styles.upperContainer}>
                    <Text style={styles.timeText}>{currentTime}</Text>
                    {/* <View style={styles.locationContainer}>
                    <Icon name="location-on" size={24} color="#000" style={styles.icon} />
                    <Text style={styles.locationText}>{errorMsg || locationName}</Text>
                </View> */}
                    <Text style={styles.locationText}>{errorMsg || locationName}</Text>

                    <View style={styles.buttonContainer}>
                        {isCheckedInToday ? (
                            <CircularButton
                                title="Clock Out"
                                onPress={handleClockOut}
                                colors={['#E11414', '#EA4545', '#EA8F8F']}
                            />
                        ) : (
                            <CircularButton
                                title="Clock In"
                                onPress={handleClockIn}
                                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                            />
                        )}
                    </View>
                    {/* <Button title="Clock In" onPress={handleClockIn} /> */}
                </View>
                <View style={styles.midContainer}>
                    <Text style={styles.label}>Mulai</Text>
                    {show && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            display="default"
                            onChange={onChange}
                            style={styles.datePicker}
                        />
                    )}
                    <View style={styles.datepickerBox}>
                        <Text style={styles.dateText} onPress={showDatePicker}>
                            {date.toDateString()}
                        </Text>
                    </View>

                    <Button title="Cari" style={styles.searchButton} onPress={showDatePicker} />
                </View>

                {/* <View style={styles.midContainer}>
                    <View style={styles.paginationControls}>
                        <TouchableOpacity onPress={handlePreviousPage} disabled={currentPage === 0}>
                            <Text style={[styles.paginationButton, currentPage === 0 && styles.disabledButton]}>
                                Previous
                            </Text>
                        </TouchableOpacity>

                        <Text>
                            Page {currentPage + 1} of {totalPages}
                        </Text>

                        <TouchableOpacity onPress={handleNextPage} disabled={currentPage === totalPages - 1}>
                            <Text
                                style={[
                                    styles.paginationButton,
                                    currentPage === totalPages - 1 && styles.disabledButton,
                                ]}
                            >
                                Next
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View> */}
                {/* <View style={styles.lowerContainer}>{paginatedDateViews}</View> */}
                <ScrollView style={styles.lowerContainer}>{dateViews}</ScrollView>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    locationContainer: {
        flexDirection: 'row', // Align items horizontally
        alignItems: 'center', // Center items vertically
        padding: 10,
    },
    backgroundBox: {
        height: 125, // Set your desired height
        width: '100%', // Set your desired width
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1, // Ensure the gradient covers the entire view
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 30,
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
    buttonContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    label: {
        fontSize: 18,
        marginBottom: 10,
    },
    dateText: {
        fontSize: 16,
        marginTop: 10,
    },
    datePicker: {
        width: '100%',
        marginVertical: 10,
    },
    datepickerBox: {
        backgroundBox: '#d7d7d7',
    },
    searchButton: {
        backgroundColor: '000',
    },
    lowerContainer: {
        flex: 1,
        borderRadius: 20,
        marginHorizontal: 20,
        marginTop: 20,
        height: 250,
    },
    containerPerDate: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
    },
    upperAbsent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        paddingBottom: 10,
    },
    midAbsent: {
        display: 'flex',
        flexDirection: 'row',
        marginTop: 10,
    },
    tableContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingVertical: 10,
        paddingHorizontal: 10,
    },
    tableHeader: {
        fontWeight: 'bold',
        marginBottom: 5,
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    tableCell: {
        flex: 1,
        padding: 5,
    },
    column: {
        flexDirection: 'column',
        flex: 1,
        justifyContent: 'center',
        alignContent: 'center',
    },
    lowerAbsent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'gray',
        paddingTop: 10,
    },
    statusView: {
        backgroundColor: '#ddd',
        padding: 5,
        borderRadius: 4,
    },
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 20,
    },
    paginationButton: {
        fontSize: 16,
        color: '#148FFF',
    },
    disabledButton: {
        color: '#ccc',
    },
});

export default Kehadiran;
