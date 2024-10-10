import {
    View,
    Text,
    StyleSheet,
    Button,
    Alert,
    TextInput,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from 'react-native';
import React, { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import CircularButton from '../components/CircularButton';
import { ScrollView } from 'react-native-gesture-handler';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
const { height } = Dimensions.get('window');

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
    const [refreshing, setRefreshing] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

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

    const fetchAttendanceData = useCallback(async () => {
        if (!employeeId) return;

        try {
            const response = await getAttendance(employeeId);
            setAttendanceData(response.attendance);
            // Assuming the API returns an isCheckedInToday property
            setIsCheckedIn(response.isCheckedInToday);
        } catch (error) {
            console.error('Error fetching attendance data:', error);
            Alert.alert('Error', 'Failed to fetch attendance data. Please try again.');
        }
    }, [employeeId]);

    useEffect(() => {
        if (employeeId) {
            fetchAttendanceData();
        }
    }, [employeeId, fetchAttendanceData]);

    useFocusEffect(
        useCallback(() => {
            fetchAttendanceData();
        }, [fetchAttendanceData]),
    );

    const onRefresh = useCallback(async () => {
        console.log('onRefresh called');
        setRefreshing(true);
        try {
            await fetchAttendanceData();
        } catch (error) {
            console.error('Error during refresh:', error);
        } finally {
            setRefreshing(false);
        }
    }, [fetchAttendanceData]);

    const getBackgroundColor = (absenStatus) => {
        switch (absenStatus) {
            case 'On Time':
                return '#a5dbff';
            case 'Early':
                return '#c8ffca';
            case 'Late':
                return '#ffbda5';
            case 'Holiday':
                return '#dedede';
            default:
                return '#dedede';
        }
    };

    const getIndicatorDotColor = (absenStatus) => {
        switch (absenStatus) {
            case 'On Time':
                return '#4491c5';
            case 'Early':
                return '#00ff24';
            case 'Late':
                return '#ff0002';
            case 'Holiday':
                return '#aaaaaa';
            default:
                return '#aaaaaa';
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

        // Format the date to match the format in your attendance data
        const formattedDate = currentDate.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        // Find attendance data for the current date
        const attendanceForDate = attendanceData.find((attendance) => {
            const checkinDate = new Date(attendance.checkin).toISOString().split('T')[0];
            return checkinDate === formattedDate;
        });

        const calculateDuration = (checkinTime, checkoutTime) => {
            if (!checkinTime || !checkoutTime) {
                return '-';
            }

            const timeDifference = checkoutTime - checkinTime;

            if (isNaN(timeDifference) || timeDifference < 0) {
                return '-';
            }

            const hours = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

            return `${hours}h ${minutes}m`;
        };

        const status = attendanceForDate ? attendanceForDate.status : 'Not Absent';
        const checkIn = attendanceForDate?.checkin
            ? new Date(attendanceForDate?.checkin).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '-';

        const checkOut = attendanceForDate?.checkout
            ? new Date(attendanceForDate.checkout).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
              })
            : '-';

        const duration = attendanceForDate
            ? calculateDuration(new Date(attendanceForDate.checkin), new Date(attendanceForDate.checkout))
            : '-';
        const notes = attendanceForDate ? attendanceForDate.note : 'No notes';

        // Insert the views at the start of the array to sort by the newest date first
        dateViews.unshift(
            <View key={i} style={styles.containerPerDate}>
                <View style={styles.upperAbsent}>
                    <Text>{formattedDateForUpper}</Text>
                    <View style={[styles.statusView, { backgroundColor: getBackgroundColor(status) }]}>
                        <View style={{ padding: 4, borderRadius: 50, backgroundColor: getIndicatorDotColor(status) }} />
                        <Text style={{ color: '#000' }}>{status}</Text>
                    </View>
                </View>

                <View style={styles.midAbsent}>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Clock In</Text>
                        <Text style={styles.tableCell}>{checkIn}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Clock Out</Text>
                        <Text style={styles.tableCell}>{checkOut}</Text>
                    </View>
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Durasi</Text>
                        <Text style={styles.tableCell}>{duration}</Text>
                    </View>
                </View>

                <View style={styles.lowerAbsent}>
                    <Text>Notes</Text>
                    <View>
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

    const handleClockIn = async () => {
        navigation.navigate('DetailKehadiran');
    };

    const handleClockOut = async () => {
        // setIsCheckedInToday(false);
        try {
            const updateResponse = await checkOut(employeeId, companyId);

            showAlert(`${updateResponse}`, 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
            }, 3000);

            fetchAttendanceData();
        } catch (error) {
            // console.error("Error when checking out:", error);
            const errorMessage = error.message || 'Unknown error';

            showAlert(`${errorMessage}`, 'error');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
            }, 3000);
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

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
    };

    return (
        <View style={styles.container}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>
    
            {/* ScrollView wrapping only scrollable content */}
            <ScrollView
                contentContainerStyle={[styles.scrollViewContent, { flexGrow: 1 }]}  // Ensure flexGrow is applied
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                    />
                }
            >
                {/* Static Header */}
                <Text style={styles.header}>Kehadiran</Text>
    
                {/* Main scrollable container */}
                <View style={styles.mainContainer}>
                    {/* Top Section */}
                    <View style={styles.upperContainer}>
                        <Text style={styles.timeText}>{currentTime}</Text>
                        <Text style={styles.locationText}>{errorMsg || locationName}</Text>
    
                        <View style={styles.buttonContainer}>
                        {isCheckedIn ? (
    <CircularButton
        title="Clock Out"
        onPress={handleClockOut}
        colors={['#E11414', '#EA4545', '#EA8F8F']}
        disabled={!!attendanceData.checkout} // Disable if user has already checked out
    />
) : (
    <CircularButton
        title="Clock In"
        onPress={handleClockIn}
        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
    />
)}

                        </View>
                    </View>
    
                    {/* Scrollable Section */}
                    <View style={styles.lowerContainer}>{paginatedDateViews}</View>
    
                    {/* Pagination */}
                    <View style={styles.paginationControls}>
                        <TouchableOpacity onPress={handlePreviousPage} disabled={currentPage === 0}>
                            <Feather
                                name="chevron-left"
                                size={24}
                                color="#148FFF"
                                style={[styles.paginationButton, currentPage === 0 && styles.disabledButton]}
                            />
                        </TouchableOpacity>
    
                        <Text>
                            Page {currentPage + 1} of {totalPages}
                        </Text>
    
                        <TouchableOpacity onPress={handleNextPage} disabled={currentPage === totalPages - 1}>
                            <Feather
                                name="chevron-right"
                                size={24}
                                color="#148FFF"
                                style={[styles.paginationButton, currentPage === totalPages - 1 && styles.disabledButton]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
    
            {/* Alert Popup */}
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
        minHeight: height, // Ensure the content is at least as tall as the screen
        flexGrow: 1,
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
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -1,
        marginTop: 50,
    },
    mainContainer: {
        height: '200vh',
        borderRadius: 20,
        margin: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    upperContainer: {
        backgroundColor: 'white',
        flex: 1,
        borderRadius: 20,
        // height: 200,
        display: 'flex',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 10,
        padding: 20,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
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
        borderRadius: 15,
        maxHeight: 75,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
    },
    label: {
        fontSize: 16,
    },
    dateText: {
        fontSize: 16,
    },
    datePicker: {
        width: '100%',
        marginVertical: 10,
    },
    datepickerBox: {
        backgroundBox: '#d7d7d7',
    },
    searchButton: {
        backgroundColor: '#000',
        padding: 10,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderRadius: 10,
    },
    lowerContainer: {
        flex: 1,
        borderRadius: 20,
        flexDirection: 'column',
        gap: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerPerDate: {
        padding: 10,
        backgroundColor: 'white',
        borderRadius: 8,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
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
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 50,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 100,
        marginHorizontal: 80,
        gap: 20,
        alignItems: 'center',
        padding: 10,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        elevation: 5,
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
