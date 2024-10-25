import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, RefreshControl, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialIcons } from '@expo/vector-icons';

import CircularButton from '../components/CircularButton';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import Shimmer from '../components/Shimmer';

const { height } = Dimensions.get('window');
const AccessDenied = () => {
    return (
        <View style={styles.accessDeniedContainer}>
            <View style={styles.iconContainer}>
                <MaterialIcons name="block" size={50} color="white" />
            </View>
            <Text style={styles.message}>Anda tidak mempunyai akses.</Text>
        </View>
    );
};

const ShimmerTaskCard = () => (
    <View style={[styles.containerPerDate, { marginBottom: 20 }]}>
        <View style={styles.upperAbsent}>
            <Shimmer width={100} height={15} style={styles.shimmerSubtitle} />
            <Shimmer width={50} height={15} style={styles.shimmerSubtitle} />
        </View>

        <View style={styles.midAbsent}>
            <View style={styles.column}>
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
            </View>
            <View style={styles.column}>
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
            </View>
            <View style={styles.column}>
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
            </View>
        </View>

        <View style={styles.lowerAbsent}>
            <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
            <View>
                <Shimmer width={70} height={15} style={styles.shimmerSubtitle} />
            </View>
        </View>
    </View>
);

const Kehadiran = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [locationName, setLocationName] = useState('Waiting for location...');
    const [errorMsg, setErrorMsg] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [jamTelat, setJamTelat] = useState('');
    const [radius, setRadius] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [location, setLocation] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [hasAccess, setHasAccess] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigation = useNavigation();

    const itemsPerPage = 7;
    const startDate = new Date('2024-09-01');
    const today = new Date();
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    const fetchData = useCallback(async () => {
        if (!employeeId || !companyId) return;
        setIsLoading(true);
        try {
            const [attendanceResponse, parameterResponse, locationResponse] = await Promise.all([
                getAttendance(employeeId),
                getParameter(companyId),
                Location.getCurrentPositionAsync({}),
            ]);

            // Get today's date in the format used by the attendance data, e.g., YYYY-MM-DD
            const today = new Date().toISOString().split('T')[0];

            // Find the attendance record for today by checking the date part of the checkin field
            const todayAttendance = attendanceResponse.attendance.find((record) => {
                const recordDate = new Date(record.checkin).toISOString().split('T')[0];
                return recordDate === today;
            });

            // Check if the user has checked out today
            const checkedOutStatus = todayAttendance && todayAttendance.checkout ? true : false;

            setAttendanceData(attendanceResponse.attendance);
            setIsCheckedIn(attendanceResponse.isCheckedInToday);
            setIsCheckedOut(checkedOutStatus);
            setJamTelat(parameterResponse.data.jam_telat);
            setRadius(parameterResponse.data.radius);

            const { latitude, longitude } = locationResponse.coords;
            const formattedCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            setLocation(formattedCoordinates);

            const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (reverseGeocodeResult) {
                setLocationName(
                    `${reverseGeocodeResult.street}, ${reverseGeocodeResult.city}, ${reverseGeocodeResult.region}, ${reverseGeocodeResult.country}`,
                );
            } else {
                setLocationName('Unable to retrieve location name');
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching data:', error);
            Alert.alert('Error', 'Failed to fetch data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, companyId]);

    const onRefresh = useCallback(async () => {
        setIsLoading(true);
        setRefreshing(true);
        try {
            await fetchData();
        } catch (error) {
            console.error('Error during refresh:', error);
            showAlert('Failed to refresh data. Please try again.', 'error');
        } finally {
            setRefreshing(false);
            setIsLoading(false);
        }
    }, [fetchData]);

    useEffect(() => {
        const getData = async () => {
            try {
                const storedEmployeeId = await AsyncStorage.getItem('employeeId');
                const storedCompanyId = await AsyncStorage.getItem('companyId');
                setEmployeeId(storedEmployeeId);
                setCompanyId(storedCompanyId);
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        if (employeeId && companyId) {
            fetchData();
        }
    }, [employeeId, companyId, fetchData]);

    useEffect(() => {
        const checkAccessPermission = async () => {
            try {
                const accessPermissions = await AsyncStorage.getItem('access_permissions');
                const permissions = JSON.parse(accessPermissions);
                setHasAccess(permissions?.access_attendance === true);
            } catch (error) {
                console.error('Error checking access permission:', error);
                setHasAccess(false);
            }
        };
        checkAccessPermission();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (hasAccess && employeeId && companyId) {
                fetchData();
            }
        }, [hasAccess, employeeId, companyId, fetchData]),
    );

    useEffect(() => {
        setIsLoading(true); // Set loading to true initially

        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        setCurrentTime(time);
        setIsLoading(false); // Set loading to false once the time is fetched

        const interval = setInterval(() => {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            setCurrentTime(time);
        }, 1000);

        return () => clearInterval(interval); // Clean up interval on component unmount
    }, []);

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    };

    const handleClockIn = useCallback(() => {
        if (!location || !locationName) {
            showAlert('Location data not available. Please try again.', 'error');
            return;
        }
        try {
            navigation.navigate('DetailKehadiran', { location, locationName, jamTelat, radius });
        } catch (error) {
            console.error('Navigation error:', error);
            showAlert('An error occurred while navigating. Please try again.', 'error');
        }
    }, [location, locationName, jamTelat, radius, navigation]);

    const handleClockOut = async () => {
        try {
            const updateResponse = await checkOut(employeeId, companyId);
            showAlert(`${updateResponse}`, 'success');
            fetchData();
        } catch (error) {
            const errorMessage = error.message || 'Unknown error';
            showAlert(`${errorMessage}`, 'error');
        }
    };

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

    const getBackgroundColor = (absenStatus) => {
        const colors = {
            'On Time': '#a5dbff',
            Early: '#c8ffca',
            Late: '#ffbda5',
            Holiday: '#dedede',
        };
        return colors[absenStatus] || '#dedede';
    };

    const getIndicatorDotColor = (absenStatus) => {
        const colors = {
            'On Time': '#4491c5',
            Early: '#00ff24',
            Late: '#ff0002',
            Holiday: '#aaaaaa',
        };
        return colors[absenStatus] || '#aaaaaa';
    };

    const calculateDuration = (checkinTime, checkoutTime) => {
        if (!checkinTime || !checkoutTime) return '-';

        const timeDifference = checkoutTime - checkinTime;
        if (isNaN(timeDifference) || timeDifference < 0) return '-';

        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const renderDateView = (date, index) => {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + index);

        const formattedDateForUpper = currentDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        const formattedDate = currentDate.toISOString().split('T')[0];

        const attendanceForDate = attendanceData.find((attendance) => {
            const checkinDate = new Date(attendance.checkin).toISOString().split('T')[0];
            return checkinDate === formattedDate;
        });

        const status = attendanceForDate ? attendanceForDate.status : 'Not Absent';
        const checkIn = attendanceForDate?.checkin
            ? new Date(attendanceForDate.checkin).toLocaleTimeString('id-ID', {
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

        return (
            <View key={index} style={styles.containerPerDate}>
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
            </View>
        );
    };

    const dateViews = Array.from({ length: daysDiff + 1 }, (_, index) => renderDateView(startDate, index)).reverse();
    const paginatedDateViews = dateViews.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage);
    const totalPages = Math.ceil(dateViews.length / itemsPerPage);

    return (
        <View style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
                <View style={styles.backgroundBox}>
                    <LinearGradient
                        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                        style={styles.linearGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>

                <Text style={styles.header}>Kehadiran</Text>

                <View style={styles.mainContainer}>
                    <View style={styles.upperContainer}>
                        {isLoading ? (
                            <View style={{ justifyContent: 'center', width: '100%', alignItems: 'center' }}>
                                <Shimmer width={125} height={35} style={[styles.shimmerTitle]} />
                            </View>
                        ) : (
                            <Text style={styles.timeText}>{currentTime}</Text>
                        )}
                        <Text style={styles.locationText}>{errorMsg || locationName}</Text>

                        <View style={styles.buttonContainer}>
                            {isLoading ? (
                                <CircularButton
                                    title="Loading..."
                                    colors={['#d9d9d9', '#b8b8b8', '#a1a1a1']}
                                    disabled={true}
                                />
                            ) : isCheckedIn == 0 ? ( // If user is checked out, disable clock in button
                                <CircularButton
                                    title="Clock In"
                                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                                    onPress={handleClockIn}
                                />
                            ) : isCheckedIn == 1 && isCheckedOut == false ? ( // If user is checked in, show clock out button
                                <CircularButton
                                    title="Clock Out"
                                    onPress={handleClockOut}
                                    colors={['#E11414', '#EA4545', '#EA8F8F']}
                                />
                            ) : isCheckedIn == 1 && isCheckedOut == true ? (
                                <CircularButton
                                    title="Clock In"
                                    colors={['#d9d9d9', '#b8b8b8', '#a1a1a1']}
                                    disabled={true}
                                />
                            ) : (
                                <CircularButton
                                    title="Clock In"
                                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                                    disabled={true}
                                />
                            )}
                        </View>
                    </View>

                    {isLoading ? (
                        <ScrollView>
                            {Array(3)
                                .fill()
                                .map((_, index) => (
                                    <ShimmerTaskCard key={index} />
                                ))}
                        </ScrollView>
                    ) : (
                        <View style={styles.lowerContainer}>{paginatedDateViews}</View>
                    )}

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
                                style={[
                                    styles.paginationButton,
                                    currentPage === totalPages - 1 && styles.disabledButton,
                                ]}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

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
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 20, // Add some bottom padding for better scrolling
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
        textAlign: 'center',
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
    //accessDenied
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0F0F0',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 40,
        color: 'white',
        fontWeight: 'bold',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        color: '#666',
    },
    message: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
    },
    shimmerTitle: {
        marginBottom: 10,
    },
    shimmerSubtitle: {
        marginBottom: 15,
    },
    shimmerStatus: {
        position: 'absolute',
        top: 20,
        right: 20,
        borderRadius: 20,
    },
});

export default Kehadiran;
