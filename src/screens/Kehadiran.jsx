import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    ScrollView,
    Image,
    Animated,
    Platform,
    Haptics,
    Share,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

import CircularButton from '../components/CircularButton';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn } from '../api/absent';
import { getParameter } from '../api/parameter';
import Shimmer from '../components/Shimmer';
import { FONTS } from '../constants/fonts';

const { height, width } = Dimensions.get('window');

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

const EmptyState = () => (
    <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyStateTitle}>Belum Ada Data Kehadiran</Text>
        <Text style={styles.emptyStateSubtitle}>Mulai clock in untuk mencatat kehadiran pertama Anda</Text>
    </View>
);

const ShimmerTaskCard = () => (
    <View style={[styles.containerPerDate, { marginBottom: 16 }]}>
        <View style={styles.cardHeader}>
            <View style={styles.dateSection}>
                <Shimmer width={180} height={20} style={{ marginBottom: 8, borderRadius: 4 }} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Shimmer width={100} height={28} style={{ borderRadius: 14 }} />
                    <Shimmer width={80} height={28} style={{ borderRadius: 14 }} />
                </View>
            </View>
        </View>

        <View style={styles.cardContent}>
            <View style={styles.leftContent}>
                <View style={styles.timeDetailsGrid}>
                    {[1, 2, 3].map((_, index) => (
                        <View key={index} style={styles.timeColumn}>
                            <Shimmer width={60} height={12} style={{ marginBottom: 4, borderRadius: 2 }} />
                            <Shimmer width={50} height={16} style={{ borderRadius: 2 }} />
                        </View>
                    ))}
                </View>

                <View style={styles.notesSection}>
                    <Shimmer width={60} height={12} style={{ marginBottom: 6, borderRadius: 2 }} />
                    <Shimmer width={width * 0.4} height={40} style={{ borderRadius: 4 }} />
                </View>
            </View>

            <View style={styles.imageContainer}>
                <Shimmer width={90} height={120} style={{ borderRadius: 8 }} />
            </View>
        </View>
    </View>
);

const Kehadiran = () => {
    const [currentTime, setCurrentTime] = useState('');
    const [locationName, setLocationName] = useState('Mencari lokasi...');
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
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [buttonPulseAnim] = useState(new Animated.Value(1));
    const [statsSlideAnim] = useState(new Animated.Value(-100));
    const [showStats, setShowStats] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [historySlideAnim] = useState(new Animated.Value(-100));
    const navigation = useNavigation();

    const itemsPerPage = 7;
    const startDate = new Date('2024-09-01');
    const today = new Date();
    const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

    const fetchData = useCallback(async () => {
        if (!employeeId || !companyId) return;
        setIsLoading(true);

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Izin lokasi ditolak. Harap aktifkan akses lokasi di pengaturan.');
                showAlert('Izin lokasi ditolak. Harap aktifkan akses lokasi di pengaturan.', 'error');
                setIsLoading(false);
                return;
            }

            const [attendanceResponse, parameterResponse, locationResponse] = await Promise.all([
                getAttendance(employeeId).catch((error) => {
                    // Check if it's the "No attendance records" case
                    if (error.message === 'No attendance records found') {
                        return {
                            attendance: [],
                            isCheckedInToday: 0, // Default to not checked in
                        };
                    }
                    throw error; // Re-throw if it's a different error
                }),
                getParameter(companyId).catch((error) => {
                    console.error('Parameter fetch error:', error);
                    // Return default values if parameter fetch fails
                    return {
                        data: {
                            jam_telat: '09:00', // Default late time
                            radius: 100, // Default radius in meters
                        },
                    };
                }),
                Location.getCurrentPositionAsync({}),
            ]);

            // Safely access parameter response data with defaults
            const jamTelat = parameterResponse?.data?.jam_telat || '09:00';
            const radius = parameterResponse?.data?.radius || 100;

            const today = new Date().toISOString().split('T')[0];
            const todayAttendance = attendanceResponse.attendance.find((record) => {
                const recordDate = new Date(record.checkin).toISOString().split('T')[0];
                return recordDate === today;
            });

            const checkedOutStatus = todayAttendance && todayAttendance.checkout ? true : false;
            setAttendanceData(attendanceResponse.attendance || []);
            setIsCheckedIn(attendanceResponse.isCheckedInToday);
            setIsCheckedOut(checkedOutStatus);
            setJamTelat(jamTelat);
            setRadius(radius);

            const { latitude, longitude } = locationResponse.coords;
            setLocation(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);

            const [reverseGeocodeResult] = await Location.reverseGeocodeAsync({ latitude, longitude });
            setLocationName(
                reverseGeocodeResult
                    ? `${reverseGeocodeResult.street}, ${reverseGeocodeResult.city}, ${reverseGeocodeResult.region}, ${reverseGeocodeResult.country}`
                    : 'Tidak dapat mengambil nama lokasi',
            );
        } catch (error) {
            // Only show error alert for actual errors, not for "No attendance records"
            if (!error.message?.includes('No attendance records found')) {
                console.error('Error fetching data:', error);
                showAlert('Gagal memuat data. Silakan coba lagi.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [employeeId, companyId]);

    const onRefresh = useCallback(async () => {
        // Add haptic feedback for better UX
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setIsLoading(true);
        setRefreshing(true);
        try {
            await fetchData();
            // Small delay to show the refresh animation
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error during refresh:', error);
            showAlert('Gagal memuat data. Silakan coba lagi.', 'error');
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
        setIsLoading(true);

        // Start entrance animations with stagger effect
        Animated.sequence([
            Animated.parallel([
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
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]),
            // Button pulse animation after entrance
            Animated.loop(
                Animated.sequence([
                    Animated.timing(buttonPulseAnim, {
                        toValue: 1.05,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(buttonPulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                    }),
                ]),
            ),
        ]).start();

        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
        setCurrentTime(time);
        setIsLoading(false);

        const interval = setInterval(() => {
            const now = new Date();
            const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            setCurrentTime(time);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    };

    const handleClockIn = useCallback(() => {
        if (!location || !locationName) {
            showAlert('Data lokasi tidak tersedia. Silakan coba lagi.', 'error');
            return;
        }
        try {
            // Enhanced haptic feedback with button animation
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            // Enhanced button press animation with spring effect
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 100,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            // Add a subtle delay for better perceived performance
            setTimeout(() => {
                navigation.navigate('DetailKehadiran', { location, locationName, jamTelat, radius });
            }, 200);
        } catch (error) {
            console.error('Navigation error:', error);
            showAlert('Terjadi kesalahan saat navigasi. Silakan coba lagi.', 'error');
        }
    }, [location, locationName, jamTelat, radius, navigation, scaleAnim]);

    const handleClockOut = async () => {
        try {
            // Add haptic feedback for better UX
            if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }

            const checkOutPayload = {
                employeeId,
                companyId,
                location,
                location_name: locationName,
            };

            const updateResponse = await checkOut(
                checkOutPayload.employeeId,
                checkOutPayload.companyId,
                checkOutPayload.location,
                checkOutPayload.location_name,
            );

            if (!updateResponse) {
                throw new Error('No response received from server');
            }

            if (updateResponse.success === false || !updateResponse.data) {
                throw new Error(updateResponse.message || 'Check-out Failed');
            }

            showAlert(updateResponse.message, 'success'); // Show success message properly
            await fetchData();
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            const errorMessage = error.message || 'Unknown error';
            showAlert(errorMessage, 'error'); // Show correct error message
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
            }
            // Add smooth transition animation
            Animated.timing(slideAnim, {
                toValue: 30,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentPage(currentPage + 1);
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 0) {
            if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
            }
            // Add smooth transition animation
            Animated.timing(slideAnim, {
                toValue: -30,
                duration: 200,
                useNativeDriver: true,
            }).start(() => {
                setCurrentPage(currentPage - 1);
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    const getBackgroundColor = (absenStatus) => {
        const colors = {
            'On Time': '#ECFDF5',
            Early: '#F0F9FF',
            Late: '#FEF2F2',
            Holiday: '#F9FAFB',
            'Not Absent': '#F3F4F6',
        };
        return colors[absenStatus] || '#F3F4F6';
    };

    const calculateDuration = (checkinTime, checkoutTime) => {
        if (!checkinTime || !checkoutTime) return '-';

        const timeDifference = checkoutTime - checkinTime;
        if (isNaN(timeDifference) || timeDifference < 0) return '-';

        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    };

    const getStatusIcon = (status) => {
        const icons = {
            'On Time': 'checkmark-circle',
            Early: 'time',
            Late: 'warning',
            Holiday: 'calendar',
            'Not Absent': 'close-circle',
        };
        return icons[status] || 'help-circle';
    };

    const getStatusIconColor = (status) => {
        const colors = {
            'On Time': '#10B981',
            Early: '#3B82F6',
            Late: '#EF4444',
            Holiday: '#6B7280',
            'Not Absent': '#9CA3AF',
        };
        return colors[status] || '#6B7280';
    };

    // Calculate attendance statistics
    const getAttendanceStats = () => {
        const stats = {
            total: attendanceData.length,
            onTime: 0,
            late: 0,
            early: 0,
            absent: 0,
        };

        attendanceData.forEach((record) => {
            switch (record.status) {
                case 'On Time':
                    stats.onTime++;
                    break;
                case 'Late':
                    stats.late++;
                    break;
                case 'Early':
                    stats.early++;
                    break;
                default:
                    stats.absent++;
            }
        });

        return stats;
    };

    const AttendanceStats = () => {
        const stats = getAttendanceStats();

        if (stats.total === 0) return null;

        return (
            <View style={styles.statsContainer}>
                <TouchableOpacity
                    style={styles.statsHeader}
                    onPress={() => {
                        if (Platform.OS === 'ios') {
                            Haptics.selectionAsync();
                        }
                        setShowStats(!showStats);

                        // Animate the stats section
                        Animated.timing(statsSlideAnim, {
                            toValue: showStats ? -100 : 0,
                            duration: 300,
                            useNativeDriver: true,
                        }).start();
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={styles.statsTitle}>Ringkasan Kehadiran</Text>
                    <Animated.View
                        style={{
                            transform: [
                                {
                                    rotate: showStats ? '180deg' : '0deg',
                                },
                            ],
                        }}
                    >
                        <Ionicons name="chevron-down" size={20} color="#6B7280" />
                    </Animated.View>
                </TouchableOpacity>

                {showStats && (
                    <Animated.View
                        style={[
                            styles.statsGrid,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: statsSlideAnim }],
                            },
                        ]}
                    >
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.onTime}</Text>
                            <Text style={styles.statLabel}>Tepat Waktu</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#EF4444' }]}>{stats.late}</Text>
                            <Text style={styles.statLabel}>Terlambat</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={[styles.statNumber, { color: '#3B82F6' }]}>{stats.early}</Text>
                            <Text style={styles.statLabel}>Lebih Awal</Text>
                        </View>
                    </Animated.View>
                )}
            </View>
        );
    };

    // Export attendance data function
    const exportAttendanceData = async () => {
        try {
            if (attendanceData.length === 0) {
                showAlert('Tidak ada data kehadiran untuk diekspor', 'error');
                return;
            }

            const stats = getAttendanceStats();
            let csvData = 'Data Kehadiran Ekspor\n\n';
            csvData += `Total Kehadiran: ${stats.total}\n`;
            csvData += `Tepat Waktu: ${stats.onTime}\n`;
            csvData += `Terlambat: ${stats.late}\n`;
            csvData += `Lebih Awal: ${stats.early}\n\n`;
            csvData += 'Tanggal,Status,Jam Masuk,Jam Keluar,Durasi,Catatan,Lokasi Kerja\n';

            attendanceData.forEach((record) => {
                const date = new Date(record.date).toLocaleDateString('id-ID');
                const checkIn = record.checkin
                    ? new Date(record.checkin).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-';
                const checkOut = record.checkout
                    ? new Date(record.checkout).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '-';
                const duration =
                    record.checkin && record.checkout
                        ? calculateDuration(new Date(record.checkin), new Date(record.checkout))
                        : '-';
                const notes = record.note || 'Tidak ada catatan';
                const workLocation = record.isWFH ? 'Work From Home' : 'Bekerja di Kantor';

                csvData += `${date},${record.status},${checkIn},${checkOut},${duration},"${notes}",${workLocation}\n`;
            });

            csvData += `\nDiekspor pada: ${new Date().toLocaleString('id-ID')}\n`;

            await Share.share({
                message: csvData,
                title: 'Data Kehadiran',
            });
        } catch (error) {
            console.error('Error exporting data:', error);
            showAlert('Gagal mengekspor data', 'error');
        }
    };

    const renderImage = (imageUri) => {
        return imageUri ? (
            <Image
                source={{ uri: imageUri }}
                style={styles.attendanceImage}
                onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
            />
        ) : (
            <View style={styles.noAttendanceImage}>
                <Text>No Image Available</Text>
            </View>
        );
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
        const notes = attendanceForDate ? attendanceForDate.note : 'Tidak ada catatan';
        const attendanceImage = attendanceForDate?.attendance_image
            ? `https://app.kejartugas.com/${attendanceForDate.attendance_image}`
            : null;
        const wfh = attendanceForDate
            ? attendanceForDate.isWFH
                ? 'Work From Home'
                : 'Bekerja di Kantor'
            : 'Tidak ada data';

        return (
            <Animated.View
                key={index}
                style={[
                    styles.containerPerDate,
                    {
                        opacity: fadeAnim,
                        transform: [
                            {
                                translateY: slideAnim.interpolate({
                                    inputRange: [0, 50],
                                    outputRange: [0, 50 + index * 5],
                                }),
                            },
                        ],
                    },
                ]}
            >
                {/* Card Header */}
                <View style={styles.cardHeader}>
                    <View style={styles.dateSection}>
                        <Text style={styles.dateText}>{formattedDateForUpper}</Text>
                        <View style={styles.statusRow}>
                            <View style={[styles.statusBadge, { backgroundColor: getBackgroundColor(status) }]}>
                                <Ionicons name={getStatusIcon(status)} size={14} color={getStatusIconColor(status)} />
                                <Text style={[styles.statusText, { color: getStatusIconColor(status) }]}>{status}</Text>
                            </View>
                            {wfh !== 'Tidak ada data' && (
                                <View
                                    style={[
                                        styles.wfhBadge,
                                        {
                                            backgroundColor: attendanceForDate?.isWFH ? '#FEF3C7' : '#DBEAFE',
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={attendanceForDate?.isWFH ? 'home' : 'business'}
                                        size={12}
                                        color={attendanceForDate?.isWFH ? '#D97706' : '#2563EB'}
                                    />
                                    <Text
                                        style={[
                                            styles.wfhText,
                                            {
                                                color: attendanceForDate?.isWFH ? '#D97706' : '#2563EB',
                                            },
                                        ]}
                                    >
                                        {wfh}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Card Content */}
                <View style={styles.cardContent}>
                    <View style={styles.leftContent}>
                        {/* Time Details Grid */}
                        <View style={styles.timeDetailsGrid}>
                            <View style={styles.timeCard}>
                                <View style={styles.timeIconContainer}>
                                    <Ionicons name="log-in" size={16} color="#10B981" />
                                </View>
                                <Text style={styles.timeLabel}>Masuk</Text>
                                <Text style={styles.timeValue}>{checkIn}</Text>
                            </View>

                            <View style={styles.timeCard}>
                                <View style={styles.timeIconContainer}>
                                    <Ionicons name="log-out" size={16} color="#EF4444" />
                                </View>
                                <Text style={styles.timeLabel}>Keluar</Text>
                                <Text style={styles.timeValue}>{checkOut}</Text>
                            </View>

                            <View style={styles.timeCard}>
                                <View style={styles.timeIconContainer}>
                                    <Ionicons name="timer" size={16} color="#6366F1" />
                                </View>
                                <Text style={styles.timeLabel}>Durasi</Text>
                                <Text style={styles.timeValue}>{duration}</Text>
                            </View>
                        </View>

                        {/* Notes Section */}
                        <View style={styles.notesSection}>
                            <View style={styles.notesHeader}>
                                <Ionicons name="document-text" size={16} color="#6B7280" />
                                <Text style={styles.notesLabel}>Catatan:</Text>
                            </View>
                            <Text style={styles.notesText}>{notes}</Text>
                        </View>
                    </View>

                    {/* Attendance Image */}
                    <View style={styles.imageContainer}>{renderImage(attendanceImage)}</View>
                </View>
            </Animated.View>
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
                        colors={['#4A90E2']}
                        tintColor="#4A90E2"
                        progressBackgroundColor="#ffffff"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header Background */}
                <View style={styles.backgroundBox}>
                    <LinearGradient
                        colors={['#4A90E2', '#357ABD', '#2E5984']}
                        style={styles.linearGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>

                {/* Header */}
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Kehadiran</Text>

                    {/* Status Indicator - Replace subtitle */}
                    {!isLoading && !(isCheckedIn == 1 && isCheckedOut == true) && (
                        <View style={styles.statusIndicator}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: isCheckedIn && !isCheckedOut ? '#10B981' : '#6B7280' },
                                ]}
                            />
                            <Text style={styles.statusIndicatorText}>
                                {isCheckedIn && !isCheckedOut ? 'Sedang Bekerja' : 'Belum Clock In'}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.mainContainer}>
                    {/* Clock In/Out Card */}
                    <Animated.View
                        style={[
                            styles.upperContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            },
                        ]}
                    >
                        <View style={styles.timeSection}>
                            {isLoading ? (
                                <View style={styles.centerContent}>
                                    <Shimmer width={140} height={40} style={styles.shimmerTitle} />
                                    <Shimmer width={200} height={16} style={styles.shimmerSubtitle} />
                                </View>
                            ) : (
                                <>
                                    <Text style={styles.timeText}>{currentTime}</Text>
                                    <View style={styles.locationContainer}>
                                        <Ionicons name="location" size={16} color="#6B7280" />
                                        <Text style={styles.locationText}>{errorMsg || locationName}</Text>
                                    </View>
                                </>
                            )}
                        </View>

                        <View style={styles.buttonContainer}>
                            {isLoading ? (
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <CircularButton
                                        title="Memuat..."
                                        colors={['#E5E7EB', '#D1D5DB', '#9CA3AF']}
                                        disabled={true}
                                    />
                                </Animated.View>
                            ) : isCheckedIn == 0 ? (
                                <Animated.View
                                    style={{
                                        transform: [{ scale: scaleAnim }, { scale: buttonPulseAnim }],
                                    }}
                                >
                                    <CircularButton
                                        title="Clock In"
                                        colors={['#4A90E2', '#357ABD', '#2E5984']}
                                        onPress={handleClockIn}
                                    />
                                </Animated.View>
                            ) : isCheckedIn == 1 && isCheckedOut == false ? (
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <CircularButton
                                        title="Clock Out"
                                        onPress={handleClockOut}
                                        colors={['#EF4444', '#DC2626', '#B91C1C']}
                                    />
                                </Animated.View>
                            ) : isCheckedIn == 1 && isCheckedOut == true ? (
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <CircularButton
                                        title="Selesai"
                                        colors={['#10B981', '#059669', '#047857']}
                                        disabled={true}
                                    />
                                </Animated.View>
                            ) : (
                                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                                    <CircularButton
                                        title="Clock In"
                                        colors={['#4A90E2', '#357ABD', '#2E5984']}
                                        disabled={true}
                                    />
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>

                    {/* Attendance History */}
                    <View style={styles.historySection}>
                        {/* Attendance Stats */}
                        {!isLoading && <AttendanceStats />}

                        <TouchableOpacity
                            style={styles.historySectionHeader}
                            onPress={() => {
                                if (Platform.OS === 'ios') {
                                    Haptics.selectionAsync();
                                }

                                const newShowHistory = !showHistory;
                                setShowHistory(newShowHistory);

                                // Enhanced animation with spring effect
                                Animated.parallel([
                                    Animated.spring(historySlideAnim, {
                                        toValue: newShowHistory ? 0 : -50,
                                        tension: 80,
                                        friction: 8,
                                        useNativeDriver: true,
                                    }),
                                    Animated.timing(fadeAnim, {
                                        toValue: newShowHistory ? 1 : 0.7,
                                        duration: 300,
                                        useNativeDriver: true,
                                    }),
                                ]).start();
                            }}
                            activeOpacity={0.7}
                        >
                            <View style={styles.historyTitleContainer}>
                                <View style={styles.historyTitleWrapper}>
                                    <View style={styles.historyTitleLeft}>
                                        <Ionicons name="time-outline" size={22} color="#4A90E2" />
                                        <Text style={styles.historySectionTitle}>Riwayat Kehadiran</Text>
                                    </View>
                                    {/* Tombol export dihapus */}
                                </View>
                                <Animated.View
                                    style={{
                                        transform: [
                                            {
                                                rotate: showHistory ? '180deg' : '0deg',
                                            },
                                        ],
                                    }}
                                >
                                    <Ionicons name="chevron-down" size={20} color="#6B7280" />
                                </Animated.View>
                            </View>
                            <View style={styles.totalRecordsContainer}>
                                <View style={styles.totalRecords}>
                                    <Ionicons name="document-text" size={14} color="white" />
                                    <Text style={styles.totalRecordsText}>{attendanceData.length} catatan</Text>
                                </View>
                                {attendanceData.length > 0 && (
                                    <Text style={styles.lastUpdateText}>
                                        Update terakhir: {new Date().toLocaleDateString('id-ID')}
                                    </Text>
                                )}
                            </View>
                        </TouchableOpacity>

                        {!showHistory && attendanceData.length > 0 && (
                            <Animated.View
                                style={[
                                    styles.collapsedIndicator,
                                    {
                                        opacity: fadeAnim.interpolate({
                                            inputRange: [0.7, 1],
                                            outputRange: [0.6, 1],
                                        }),
                                        transform: [
                                            {
                                                scale: buttonPulseAnim.interpolate({
                                                    inputRange: [1, 1.05],
                                                    outputRange: [1, 1.02],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <Text style={styles.collapsedText}>
                                    👆 Tap untuk melihat {attendanceData.length} riwayat kehadiran
                                </Text>
                            </Animated.View>
                        )}

                        {showHistory && (
                            <Animated.View
                                style={{
                                    opacity: fadeAnim,
                                    transform: [
                                        {
                                            translateY: historySlideAnim.interpolate({
                                                inputRange: [-50, 0],
                                                outputRange: [-20, 0],
                                                extrapolate: 'clamp',
                                            }),
                                        },
                                        {
                                            scale: fadeAnim.interpolate({
                                                inputRange: [0.7, 1],
                                                outputRange: [0.97, 1], // Smoother scale
                                                extrapolate: 'clamp',
                                            }),
                                        },
                                    ],
                                }}
                                accessible={true}
                                accessibilityLabel="Riwayat Kehadiran"
                            >
                                {isLoading ? (
                                    <Animated.View
                                        style={[
                                            styles.historyContainer,
                                            {
                                                opacity: fadeAnim,
                                                transform: [{ translateY: historySlideAnim }],
                                            },
                                        ]}
                                    >
                                        {Array(3)
                                            .fill()
                                            .map((_, index) => (
                                                <ShimmerTaskCard key={index} />
                                            ))}
                                    </Animated.View>
                                ) : paginatedDateViews.length > 0 ? (
                                    <>
                                        <Animated.View
                                            style={[
                                                styles.historyContainer,
                                                {
                                                    opacity: fadeAnim,
                                                    transform: [{ translateY: historySlideAnim }],
                                                },
                                            ]}
                                        >
                                            {paginatedDateViews}
                                        </Animated.View>
                                        {/* Pagination - Always show if there are multiple pages */}
                                        {totalPages > 1 && (
                                            <Animated.View
                                                style={[
                                                    styles.paginationControls,
                                                    {
                                                        opacity: fadeAnim,
                                                        transform: [{ translateY: historySlideAnim }],
                                                    },
                                                ]}
                                            >
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        handlePreviousPage();
                                                        if (Platform.OS === 'ios') Haptics.selectionAsync();
                                                    }}
                                                    disabled={currentPage === 0}
                                                    style={[
                                                        styles.paginationButton,
                                                        currentPage === 0 && styles.disabledPaginationButton,
                                                    ]}
                                                    accessibilityLabel="Halaman sebelumnya"
                                                >
                                                    <Ionicons
                                                        name="chevron-back"
                                                        size={20}
                                                        color={currentPage === 0 ? '#D1D5DB' : '#4A90E2'}
                                                    />
                                                </TouchableOpacity>

                                                <View
                                                    style={styles.pageIndicator}
                                                    accessible={true}
                                                    accessibilityLabel={`Halaman ${currentPage + 1} dari ${totalPages}`}
                                                >
                                                    <Text style={styles.pageText}>
                                                        {currentPage + 1} / {totalPages}
                                                    </Text>
                                                </View>

                                                <TouchableOpacity
                                                    onPress={() => {
                                                        handleNextPage();
                                                        if (Platform.OS === 'ios') Haptics.selectionAsync();
                                                    }}
                                                    disabled={currentPage === totalPages - 1}
                                                    style={[
                                                        styles.paginationButton,
                                                        currentPage === totalPages - 1 &&
                                                            styles.disabledPaginationButton,
                                                    ]}
                                                    accessibilityLabel="Halaman berikutnya"
                                                >
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={20}
                                                        color={currentPage === totalPages - 1 ? '#D1D5DB' : '#4A90E2'}
                                                    />
                                                </TouchableOpacity>
                                            </Animated.View>
                                        )}
                                    </>
                                ) : (
                                    <Animated.View
                                        style={{
                                            opacity: fadeAnim,
                                            transform: [{ translateY: historySlideAnim }],
                                            alignItems: 'center',
                                            paddingVertical: 32,
                                        }}
                                    >
                                        <Ionicons
                                            name="cloud-offline"
                                            size={48}
                                            color="#D1D5DB"
                                            style={{ marginBottom: 8 }}
                                        />
                                        <Text
                                            style={{
                                                color: '#9CA3AF',
                                                fontSize: 16,
                                                fontWeight: '600',
                                                marginBottom: 4,
                                            }}
                                        >
                                            Belum ada riwayat kehadiran
                                        </Text>
                                        <Text
                                            style={{
                                                color: '#B0B0B0',
                                                fontSize: 13,
                                                textAlign: 'center',
                                                maxWidth: 220,
                                            }}
                                        >
                                            Catatan kehadiran Anda akan muncul di sini setelah Anda melakukan clock in.
                                        </Text>
                                    </Animated.View>
                                )}
                            </Animated.View>
                        )}
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
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 120,
    },
    backgroundBox: {
        height: 140,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContainer: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    header: {
        fontSize: FONTS.size['4xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.regular,
        color: 'rgba(255, 255, 255, 0.9)',
        textAlign: 'center',
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        gap: 6,
        alignSelf: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusIndicatorText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: 'white',
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 24,
    },

    // Upper Container (Clock In/Out)
    upperContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        marginTop: -10,
    },
    timeSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    timeText: {
        fontSize: FONTS.size['6xl'],
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: -1,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    locationText: {
        fontSize: FONTS.size.base,
        fontFamily: FONTS.family.regular,
        color: '#6B7280',
        marginLeft: 6,
        textAlign: 'center',
        maxWidth: width * 0.7,
    },
    buttonContainer: {
        alignItems: 'center',
    },
    centerContent: {
        alignItems: 'center',
    },

    // History Section
    historySection: {
        flex: 1,
        paddingBottom: 20,
    },

    // Stats Section
    statsContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },

    historySectionHeader: {
        flexDirection: 'column',
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
    },
    historyTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    historyTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        flex: 1,
    },
    historyTitleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historySectionTitle: {
        fontSize: FONTS.size['2xl'],
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    totalRecordsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    totalRecords: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A90E2',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        gap: 6,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    totalRecordsText: {
        color: 'white',
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
    },
    lastUpdateText: {
        fontSize: FONTS.size.xs,
        fontFamily: FONTS.family.regular,
        color: '#9CA3AF',
        fontStyle: 'italic',
    },
    historyContainer: {
        gap: 16,
    },

    // Card Styles
    containerPerDate: {
        backgroundColor: 'white',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    dateSection: {
        gap: 12,
    },
    dateText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    statusText: {
        fontSize: 13,
        fontWeight: '600',
    },
    wfhBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 4,
    },
    wfhText: {
        fontSize: 11,
        fontWeight: '500',
    },

    cardContent: {
        flexDirection: 'row',
        padding: 16,
        gap: 16,
    },
    leftContent: {
        flex: 1,
        gap: 16,
    },

    // Time Details Grid
    timeDetailsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    timeCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 6,
    },
    timeIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },
    timeValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
    },

    // Notes Section
    notesSection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    notesLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    notesText: {
        fontSize: 14,
        color: '#374151',
        lineHeight: 20,
    },

    // Image Container
    imageContainer: {
        width: 90,
        height: 120,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attendanceImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    noAttendanceImage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },

    // Pagination
    paginationControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        marginBottom: 60,
        marginHorizontal: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    paginationButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
    },
    disabledPaginationButton: {
        opacity: 0.5,
    },
    paginationButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A90E2',
    },
    disabledPaginationText: {
        color: '#D1D5DB',
    },
    pageIndicator: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
    },
    pageText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },

    // Shimmer Styles
    shimmerTitle: {
        marginBottom: 8,
        borderRadius: 8,
    },
    shimmerSubtitle: {
        borderRadius: 4,
    },

    // Collapsed Indicator
    collapsedIndicator: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    collapsedText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
        textAlign: 'center',
    },

    // Empty History
    emptyHistoryCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 40,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    emptyHistoryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyHistorySubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },

    // Access Denied
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    message: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginTop: 20,
    },

    // Empty State
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Kehadiran;
