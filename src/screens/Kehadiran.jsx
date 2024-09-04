import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useState, useEffect } from 'react';
import ColorList from '../components/ColorList';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library
import CircularButton from '../components/CircularButton';
import DateTimePicker from '@react-native-community/datetimepicker'; // Import the date picker
import { ScrollView } from 'react-native-gesture-handler';
import { markAbsent, getAttendance, getAttendanceReport, updateAttendance, deleteAttendance } from '../api/absent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Table, TableWrapper, Row, Rows, Col, Cols, Cell } from 'react-native-table-component';
import axios from 'axios';

const Kehadiran = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [locationName, setLocationName] = useState('Waiting for location...');
    const [errorMsg, setErrorMsg] = useState(null);
    const employeeId = AsyncStorage.getItem('employeeId');
    const [attendanceData, setAttendanceData] = useState([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);

    const startDate = new Date('2024-09-01'); // 1st September 2024
    const today = new Date(); // Today's date

    const fetchAttendanceData = async () => {
        try {
            const response = await getAttendance(27);
            if (response.status >= 200 && response.status < 300) {
                setAttendanceData(response.attendance);
                setIsCheckedIn(response.isCheckedInToday);
            } else {
                // console.error("Failed to fetch attendance data:", response.message);
            }
        } catch (error) {
            // console.error("Error fetching attendance data:", error);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [employeeId]);

    console.log('data absen:', attendanceData);

    // Calculate the number of days between startDate and today
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    // Generate the views based on the number of days
    const dateViews = [];
    for (let i = 0; i <= daysDiff; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Format the date to match the format in your attendance data
        const formattedDate = currentDate.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'

        // Find attendance data for the current date
        const attendanceForDate = attendanceData.find((attendance) => {
            // Extract only the date part from checkin and compare
            const checkinDate = new Date(attendance.checkin).toISOString().split('T')[0];
            return checkinDate === formattedDate;
        });

        // If attendance data exists for the current date, display the relevant information
        const status = attendanceForDate ? attendanceForDate.status : 'No Status';
        const checkIn = attendanceForDate ? new Date(attendanceForDate.checkin).toLocaleTimeString() : 'N/A';
        const checkOut = attendanceForDate ? new Date(attendanceForDate.checkout).toLocaleTimeString() : 'N/A';
        const duration = attendanceForDate ? attendanceForDate.duration : 'N/A';
        const notes = attendanceForDate ? attendanceForDate.notes : 'No notes';

        dateViews.push(
            <View key={i} style={styles.containerPerDate}>
                <View style={styles.upperAbsent}>
                    <Text>{currentDate.toDateString()}</Text>
                    <View style={styles.statusView}>
                        <Text>{status}</Text>
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
                    <View style={styles.column}>
                        <Text style={styles.tableHeader}>Keterangan</Text>
                        <Text style={styles.tableCell}>{notes}</Text>
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

    useEffect(() => {
        // Get location permissions and device location
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
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
    const handleClockIn = () => {
        setIsCheckedInToday(true);
        alert('You have successfully clocked in!');
    };

    const handleClockOut = () => {
        setIsCheckedInToday(false);
        alert('You have successfully clocked out!');
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
   <CircularButton title="Clock Out" onPress={handleClockOut} colors={['#E11414', '#EA4545', '#EA8F8F']}/>
                        ):(
                            <CircularButton title="Clock In" onPress={handleClockIn}  colors={['#0E509E', '#5FA0DC', '#9FD2FF']}/>
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
        height: 300,
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
        textAlign: 'center',
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
});

export default Kehadiran;
