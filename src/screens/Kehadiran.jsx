import React, { useState, useEffect, useCallback, useMemo, memo, useRef, useContext } from 'react';
import { LocationContext } from '../../App';
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
    InteractionManager,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';

import CircularButton from '../components/CircularButton';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { markAbsent, getAttendance, getAttendanceReport, checkOut, checkIn, lunchStart, lunchEnd } from '../api/absent';
import { getParameter } from '../api/parameter';
import Shimmer from '../components/Shimmer';
import { FONTS } from '../constants/fonts';

const { height, width } = Dimensions.get('window');

// Constants for better maintainability
const ITEMS_PER_PAGE = 10;
const SHIMMER_CARDS_COUNT = 3;
const START_DATE = new Date('2024-09-01');
const DEFAULT_LATE_TIME = '09:00';
const DEFAULT_RADIUS = 100;
const ANIMATION_DURATION = {
    SHORT: 200,
    MEDIUM: 300,
    LONG: 600,
};

// Status configuration for better maintainability
const STATUS_CONFIG = {
    'On Time': {
        icon: 'checkmark-circle',
        color: '#10B981',
        backgroundColor: '#ECFDF5',
    },
    Early: {
        icon: 'time',
        color: '#3B82F6',
        backgroundColor: '#F0F9FF',
    },
    Late: {
        icon: 'warning',
        color: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    Holiday: {
        icon: 'calendar',
        color: '#6B7280',
        backgroundColor: '#F9FAFB',
    },
    'Not Absent': {
        icon: 'close-circle',
        color: '#9CA3AF',
        backgroundColor: '#F3F4F6',
    },
};

// Utility functions for better maintainability
const calculateDaysDiff = () => Math.floor((new Date() - START_DATE) / (1000 * 60 * 60 * 24));

const formatDuration = (checkinTime, checkoutTime) => {
    if (!checkinTime || !checkoutTime) return '-';

    const timeDifference = checkoutTime - checkinTime;
    if (isNaN(timeDifference) || timeDifference < 0) return '-';

    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG['Not Absent'];

// Memoized EmptyState Component with enhanced styling
const EmptyState = memo(() => (
    <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconContainer}>
            <Ionicons name="calendar-outline" size={48} color="#9CA3AF" />
        </View>
        <Text style={styles.emptyStateTitle}>Belum Ada Data Kehadiran</Text>
        <Text style={styles.emptyStateSubtitle}>Mulai clock in untuk mencatat kehadiran pertama Anda</Text>
    </View>
));
EmptyState.displayName = 'EmptyState';

// Memoized ShimmerTaskCard Component with optimized rendering
const ShimmerTaskCard = memo(() => (
    <View style={[styles.containerPerDate, { marginBottom: 16 }]}>
        <View style={styles.cardHeader}>
            <View style={styles.dateSection}>
                <Shimmer width={180} height={20} style={styles.shimmerTitle} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Shimmer width={100} height={28} style={{ borderRadius: 14 }} />
                    <Shimmer width={80} height={28} style={{ borderRadius: 14 }} />
                </View>
            </View>
        </View>

        <View style={styles.cardContent}>
            <View style={styles.leftContent}>
                <View style={styles.timeDetailsGrid}>
                    {Array.from({ length: 3 }, (_, index) => (
                        <View key={`shimmer-time-${index}`} style={styles.timeColumn}>
                            <Shimmer width={60} height={12} style={styles.shimmerSubtitle} />
                            <Shimmer width={50} height={16} style={{ borderRadius: 2 }} />
                        </View>
                    ))}
                </View>

                <View style={styles.notesSection}>
                    <Shimmer width={60} height={12} style={styles.shimmerSubtitle} />
                    <Shimmer width={width * 0.4} height={40} style={{ borderRadius: 4 }} />
                </View>
            </View>

            <View style={styles.imageContainer}>
                <Shimmer width={90} height={120} style={{ borderRadius: 8 }} />
            </View>
        </View>
    </View>
));

ShimmerTaskCard.displayName = 'ShimmerTaskCard';

const Kehadiran = () => {
    const { location, errorMsg, locationName } = useContext(LocationContext);
    // State management
    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        }),
    );
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [isCheckedOut, setIsCheckedOut] = useState(false);
    const [jamTelat, setJamTelat] = useState('');
    const [radius, setRadius] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [currentPage, setCurrentPage] = useState(0);
    const [hasAccess, setHasAccess] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [isPaginating, setIsPaginating] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const PAGE_SIZE = 10;

    // Animation refs for better performance
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const buttonPulseAnim = useRef(new Animated.Value(1)).current;
    const historySlideAnim = useRef(new Animated.Value(-100)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;
    const headerScaleAnim = useRef(new Animated.Value(0.9)).current;

    // Refs for performance optimization
    const timeInterval = useRef(null);
    const mountedRef = useRef(true);

    const navigation = useNavigation();

    // Memoized calculations for better performance
    const daysDiff = useMemo(() => calculateDaysDiff(), []);

    // const totalPages = useMemo(() => Math.ceil((daysDiff + 1) / ITEMS_PER_PAGE), [daysDiff]);

    // State for attendance times
    const [checkInTime, setCheckInTime] = useState(null);
    const [checkOutTime, setCheckOutTime] = useState(null);
    const [totalHours, setTotalHours] = useState(null);
    const [todayAttendanceId, setTodayAttendanceId] = useState(null);
    // Today's lunch timestamps (strings from server) — used to control UI and buttons
    const [todayLunchStart, setTodayLunchStart] = useState(null);
    const [todayLunchEnd, setTodayLunchEnd] = useState(null);
    const [hasLunchStarted, setHasLunchStarted] = useState(false);
    const [isLunchProcessing, setIsLunchProcessing] = useState(false);

    // Memoized start date for pagination
    const startDate = useMemo(() => new Date(START_DATE), []);

    // Cleanup effect for mounted state
    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
            }
        };
    }, []);

    // Enhanced fetchData with better error handling and performance
    // Sudah tidak perlu reverse geocoding di sini, cukup fetch data attendance dan parameter
    const fetchData = useCallback(async () => {
        if (!employeeId || !companyId || !mountedRef.current) return;

        setIsLoading(true);
        try {
            // Step 1: Fetch attendance and parameters
            const [attendanceResponse, parameterResponse] = await Promise.all([
                getAttendance(employeeId, 1, PAGE_SIZE).catch((error) => {
                    if (error.message === 'No attendance records found') {
                        return {
                            data: [],
                            pagination: { totalPages: 1 },
                            isCheckedInToday: 0,
                        };
                    }
                    throw error;
                }),
                getParameter(companyId).catch((error) => {
                    return {
                        data: {
                            jam_telat: DEFAULT_LATE_TIME,
                            radius: DEFAULT_RADIUS,
                        },
                    };
                }),
            ]);

            // Step 2: Extract params
            const jamTelat = parameterResponse?.data?.jam_telat || DEFAULT_LATE_TIME;
            const radius = parameterResponse?.data?.radius || DEFAULT_RADIUS;

            // Step 3: Find today's attendance from first page
            const today = new Date();
            const todayAttendance = attendanceResponse.attendance?.find((record) => {
                // Use local timezone for date comparison to avoid timezone issues
                const recordDate = new Date(record.checkin);
                const localRecordDate = new Date(recordDate.getFullYear(), recordDate.getMonth(), recordDate.getDate());
                const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return localRecordDate.getTime() === localToday.getTime();
            });

            const checkedOutStatus = Boolean(todayAttendance?.checkout);
            let todayCheckInTime = null;
            let todayCheckOutTime = null;
            let todayTotalHours = null;

            if (todayAttendance) {
                if (todayAttendance.checkin) {
                    const checkInDate = new Date(todayAttendance.checkin);
                    todayCheckInTime = checkInDate.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });
                }

                if (todayAttendance.checkout) {
                    const checkOutDate = new Date(todayAttendance.checkout);
                    todayCheckOutTime = checkOutDate.toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                    });

                    if (todayAttendance.checkin) {
                        const checkInDate = new Date(todayAttendance.checkin);
                        const diffInMilliseconds = checkOutDate - checkInDate;
                        const diffInHours = diffInMilliseconds / (1000 * 60 * 60);
                        const hours = Math.floor(diffInHours);
                        const minutes = Math.floor((diffInHours % 1) * 60);
                        todayTotalHours = `${hours}:${minutes.toString().padStart(2, '0')}`;
                    }
                }
            }

            // Step 4: Update UI states
            if (mountedRef.current) {
                setAttendanceData(attendanceResponse.attendance || []);
                setIsCheckedIn(attendanceResponse.isCheckedInToday);
                setIsCheckedOut(checkedOutStatus);
                setJamTelat(jamTelat);
                setRadius(radius);
                setCheckInTime(todayCheckInTime);
                setCheckOutTime(todayCheckOutTime);
                setTotalHours(todayTotalHours);
                setCurrentPage(attendanceResponse.pagination.current_page - 1);
                setTotalPages(attendanceResponse.pagination.last_page);
                setTotalRecords(attendanceResponse.pagination.total || 0);
                // Persist today's attendance id and lunch status for lunch actions
                setTodayAttendanceId(todayAttendance?.id || null);
                // Extract today's lunch start/end explicitly
                const lunchStartRaw = todayAttendance?.lunch_start || null;
                const lunchEndRaw = todayAttendance?.lunch_end || null;
                setTodayLunchStart(lunchStartRaw);
                setTodayLunchEnd(lunchEndRaw);

                // Prefer server-provided flag (if backend returns isLunchStartedToday), otherwise fall back to today's attendance record
                const serverLunchFlag =
                    typeof attendanceResponse.isLunchStartedToday !== 'undefined'
                        ? attendanceResponse.isLunchStartedToday
                        : null;
                setHasLunchStarted(serverLunchFlag !== null ? Boolean(serverLunchFlag) : Boolean(lunchStartRaw));
            }
        } catch (error) {
            if (mountedRef.current) {
                showAlert('Gagal memuat data. Silakan coba lagi.', 'error');
            }
        } finally {
            if (mountedRef.current) {
                setIsLoading(false);
            }
        }
    }, [employeeId, companyId]);

    // Enhanced refresh function with better UX
    const onRefresh = useCallback(async () => {
        if (!mountedRef.current) return;

        // Haptic feedback for better UX
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }

        setRefreshing(true);

        try {
            await fetchData();
            // Brief delay for smooth UX
            await new Promise((resolve) => setTimeout(resolve, 300));
        } catch (error) {
            console.error('Error during refresh:', error);
            if (mountedRef.current) {
                showAlert('Gagal memuat data. Silakan coba lagi.', 'error');
            }
        } finally {
            if (mountedRef.current) {
                setRefreshing(false);
            }
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

    // Enhanced animation and time management
    useEffect(() => {
        if (!mountedRef.current) return;

        // Defer animations to improve initial load performance
        InteractionManager.runAfterInteractions(() => {
            if (!mountedRef.current) return;

            // Start entrance animations with optimized timing
            Animated.sequence([
                Animated.parallel([
                    Animated.timing(headerAnim, {
                        toValue: 1,
                        duration: ANIMATION_DURATION.LONG,
                        useNativeDriver: true,
                    }),
                    Animated.spring(headerScaleAnim, {
                        toValue: 1,
                        tension: 80,
                        friction: 8,
                        useNativeDriver: true,
                    }),
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: ANIMATION_DURATION.LONG,
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
                // Subtle button pulse animation
                Animated.loop(
                    Animated.sequence([
                        Animated.timing(buttonPulseAnim, {
                            toValue: 1.03,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                        Animated.timing(buttonPulseAnim, {
                            toValue: 1,
                            duration: 2000,
                            useNativeDriver: true,
                        }),
                    ]),
                ),
            ]).start();
        });

        // Initialize time with better formatting - include seconds for real-time update
        const updateTime = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            });
            if (mountedRef.current) {
                setCurrentTime(time);
            }
        };

        updateTime();
        setIsLoading(false);

        // Optimized interval with cleanup - update every second for real-time clock
        timeInterval.current = setInterval(updateTime, 1000);

        return () => {
            if (timeInterval.current) {
                clearInterval(timeInterval.current);
                timeInterval.current = null;
            }
        };
    }, []);

    // Enhanced alert function with better UX
    const showAlert = useCallback((message, type = 'info') => {
        if (!mountedRef.current) return;

        setAlert({ show: true, type, message });
        setTimeout(() => {
            if (mountedRef.current) {
                setAlert((prev) => ({ ...prev, show: false }));
            }
        }, 3000);
    }, []);

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
            // Konversi objek location menjadi string
            const locationString = `${location.coords.latitude}, ${location.coords.longitude}`;
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
                const addressString = locationName; // atau hasil reverse geocode lain

                navigation.navigate('DetailKehadiran', {
                    location: locationString,
                    locationName,
                    jamTelat,
                    radius,
                    address: addressString, // <-- tambahkan di sini
                });
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

    // Lunch start handler - allowed only if checked in and not yet lunch started
    const handleLunchStart = useCallback(async () => {
        if (!isCheckedIn || isCheckedOut) {
            showAlert('Anda harus melakukan clock in sebelum memulai istirahat.', 'error');
            return;
        }

        if (hasLunchStarted) {
            showAlert('Istirahat sudah dimulai sebelumnya.', 'info');
            return;
        }

        if (!todayAttendanceId) {
            showAlert('Data absen hari ini tidak ditemukan.', 'error');
            return;
        }

        try {
            setIsLunchProcessing(true);
            const locationString = location ? `${location.coords.latitude}, ${location.coords.longitude}` : '';
            // Send null for lunch_image (image not required)
            const res = await lunchStart(todayAttendanceId, locationString, null);

            if (res && (res.success === true || res.status === 'success')) {
                // Use a fixed, clear success message to avoid displaying unrelated backend messages
                showAlert('Istirahat dimulai — selamat istirahat! ⏱️', 'success');
                setHasLunchStarted(true);
                await fetchData();
            } else {
                throw new Error(res.message || 'Gagal memulai istirahat');
            }
        } catch (err) {
            console.error('handleLunchStart error', err);
            showAlert(err.message || 'Gagal memulai istirahat. Silakan coba lagi.', 'error');
        } finally {
            setIsLunchProcessing(false);
        }
    }, [isCheckedIn, isCheckedOut, hasLunchStarted, todayAttendanceId, location, fetchData]);

    // Lunch end handler - allowed only if lunch started
    const handleLunchEnd = useCallback(async () => {
        if (!hasLunchStarted) {
            showAlert('Kamu belum memulai waktu istirahat.', 'error');
            return;
        }

        if (!todayAttendanceId) {
            showAlert('Data absen hari ini tidak ditemukan. Silakan muat ulang.', 'error');
            return;
        }

        try {
            setIsLunchProcessing(true);
            const res = await lunchEnd(todayAttendanceId);
            if (res && (res.success === true || res.status === 'success')) {
                // Use a fixed success message to prevent backend messages (e.g., 'checkout') from showing here
                showAlert('Istirahat selesai — semoga kembali segar!', 'success');
                setHasLunchStarted(false);
                await fetchData();
            } else {
                throw new Error(res.message || 'Gagal mengakhiri istirahat');
            }
        } catch (err) {
            console.error('handleLunchEnd error', err);
            showAlert(err.message || 'Gagal mengakhiri istirahat. Silakan coba lagi.', 'error');
        } finally {
            setIsLunchProcessing(false);
        }
    }, [hasLunchStarted, todayAttendanceId, fetchData]);

    const handleNextPage = () => {
        if (currentPage < totalPages - 1) {
            if (Platform.OS === 'ios') {
                Haptics.selectionAsync();
            }

            Animated.timing(slideAnim, {
                toValue: 30,
                duration: 200,
                useNativeDriver: true,
            }).start(async () => {
                const nextPage = currentPage + 1;

                try {
                    const res = await getAttendance(employeeId, nextPage + 1, PAGE_SIZE);

                    if (mountedRef.current) {
                        setAttendanceData(res.attendance); // <-- use res.attendance
                        setCurrentPage(res.pagination.current_page - 1); // <- make sure it stays 0-indexed in UI
                        setTotalPages(res.pagination.last_page); // <- keep updated if total pages can change
                    }
                } catch (err) {
                    console.error('Failed to fetch next page:', err);
                }

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

            Animated.timing(slideAnim, {
                toValue: -30,
                duration: 200,
                useNativeDriver: true,
            }).start(async () => {
                const prevPage = currentPage - 1;

                try {
                    const res = await getAttendance(employeeId, prevPage + 1, PAGE_SIZE);

                    if (mountedRef.current) {
                        setAttendanceData(res.attendance); // <-- use res.attendance
                        setCurrentPage(res.pagination.current_page - 1);
                        setTotalPages(res.pagination.last_page);
                    }
                } catch (err) {
                    console.error('Failed to fetch previous page:', err);
                }

                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            });
        }
    };

    // Optimized utility functions using configurations
    const getBackgroundColor = useCallback((status) => {
        return getStatusConfig(status).backgroundColor;
    }, []);

    const getStatusIcon = useCallback((status) => {
        return getStatusConfig(status).icon;
    }, []);

    const getStatusIconColor = useCallback((status) => {
        return getStatusConfig(status).color;
    }, []);

    // Memoized date views for pagination - render only actual attendance records from monthly data
    const dateViews = useMemo(() => {
        // Map through attendanceData to create cards for actual records only
        return attendanceData.map((attendance, index) => {
            const checkinDate = new Date(attendance.checkin);
            const formattedDateForUpper = checkinDate.toLocaleDateString('id-ID', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            });
            const formattedDate = checkinDate.toISOString().split('T')[0];

            const status = attendance.status || 'Not Absent';
            const checkIn = attendance.checkin
                ? new Date(attendance.checkin).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                  })
                : '-';

            const checkOut = attendance.checkout
                ? new Date(attendance.checkout).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false,
                  })
                : '-';

            const duration =
                attendance.checkin && attendance.checkout
                    ? formatDuration(new Date(attendance.checkin), new Date(attendance.checkout))
                    : '-';

            const wfh = attendance.isWFH ? 'At Home' : 'In Office';

            return (
                <Animated.View
                    key={`attendance-${attendance.id || index}-${formattedDate}`}
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
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 8,
                                    width: '100%',
                                    justifyContent: 'space-between',
                                }}
                            >
                                <Text style={styles.dateText}>{formattedDateForUpper}</Text>
                                <View style={styles.statusRow}>
                                    <View style={[styles.statusBadge, { backgroundColor: getBackgroundColor(status) }]}>
                                        <Ionicons
                                            name={getStatusIcon(status)}
                                            size={12}
                                            color={getStatusIconColor(status)}
                                        />
                                        <Text style={[styles.statusText, { color: getStatusIconColor(status) }]}>
                                            {status}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.wfhBadge,
                                            {
                                                backgroundColor: attendance.isWFH ? '#FEF3C7' : '#DBEAFE',
                                            },
                                        ]}
                                    >
                                        <Ionicons
                                            name={attendance.isWFH ? 'home' : 'business'}
                                            size={12}
                                            color={attendance.isWFH ? '#D97706' : '#2563EB'}
                                        />
                                        <Text
                                            style={[
                                                styles.wfhText,
                                                {
                                                    color: attendance.isWFH ? '#D97706' : '#2563EB',
                                                },
                                            ]}
                                        >
                                            {wfh}
                                        </Text>
                                    </View>
                                </View>
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

                            {/* Lunch Info Section */}
                            <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                                {(() => {
                                    const lunchStartRaw = attendance.lunch_start;
                                    const lunchEndRaw = attendance.lunch_end;

                                    const lunchStartFormatted = lunchStartRaw
                                        ? new Date(lunchStartRaw).toLocaleTimeString('id-ID', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: false,
                                          })
                                        : '-';
                                    const lunchEndFormatted = lunchEndRaw
                                        ? new Date(lunchEndRaw).toLocaleTimeString('id-ID', {
                                              hour: '2-digit',
                                              minute: '2-digit',
                                              hour12: false,
                                          })
                                        : '-';

                                    let lunchDurationDisplay = '-';
                                    if (lunchStartRaw && lunchEndRaw) {
                                        const diff = new Date(lunchEndRaw) - new Date(lunchStartRaw);
                                        if (!isNaN(diff) && diff >= 0) {
                                            const hours = Math.floor(diff / (1000 * 60 * 60));
                                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                                            lunchDurationDisplay = `${hours}h ${minutes}m`;
                                        }
                                    }

                                    return (
                                        <>
                                            <View style={{ flex: 1, alignItems: 'center' }}>
                                                <Text style={styles.timeLabel}>Istirahat Mulai</Text>
                                                <Text style={styles.timeValue}>{lunchStartFormatted}</Text>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'center' }}>
                                                <Text style={styles.timeLabel}>Istirahat Selesai</Text>
                                                <Text style={styles.timeValue}>{lunchEndFormatted}</Text>
                                            </View>
                                            <View style={{ flex: 1, alignItems: 'center' }}>
                                                <Text style={styles.timeLabel}>Durasi Istirahat</Text>
                                                <Text style={styles.timeValue}>{lunchDurationDisplay}</Text>
                                            </View>
                                        </>
                                    );
                                })()}
                            </View>
                        </View>
                    </View>
                </Animated.View>
            );
        });
    }, [attendanceData, fadeAnim, slideAnim, getBackgroundColor, getStatusIcon, getStatusIconColor, formatDuration]);

    const paginatedDateViews = useMemo(() => {
        return dateViews.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);
    }, [dateViews, currentPage, PAGE_SIZE]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent={true} />
            {/* Enhanced Header Background */}
            <Animated.View
                style={[
                    styles.backgroundBox,
                    {
                        opacity: headerAnim,
                        transform: [
                            {
                                scale: headerScaleAnim.interpolate({
                                    inputRange: [0.9, 1],
                                    outputRange: [0.95, 1],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Header decorative elements */}
                <View style={styles.headerDecorations}>
                    <Animated.View
                        style={[
                            styles.decorativeCircle1,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.6],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.5, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle2,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.4],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.3, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle3,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle4,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                    <Animated.View
                        style={[
                            styles.decorativeCircle5,
                            {
                                opacity: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 0.5],
                                }),
                                transform: [
                                    {
                                        scale: headerAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.7, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    />
                </View>
            </Animated.View>

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
                {/* Enhanced Header Content */}
                <Animated.View
                    style={[
                        styles.headerContainer,
                        {
                            opacity: headerAnim,
                            transform: [
                                {
                                    translateY: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [-30, 0],
                                    }),
                                },
                                { scale: headerScaleAnim },
                            ],
                        },
                    ]}
                >
                    <View style={styles.headerContent}>
                        <View style={styles.headerTitleWrapper}>
                            <Animated.View
                                style={[
                                    styles.headerIconContainer,
                                    {
                                        opacity: headerAnim,
                                        transform: [
                                            {
                                                scale: headerAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.5, 1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <Ionicons name="time" size={24} color="white" />
                            </Animated.View>

                            <Animated.Text
                                style={[
                                    styles.header,
                                    {
                                        opacity: headerAnim,
                                        transform: [
                                            {
                                                scale: headerAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.8, 1],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                Kehadiran
                            </Animated.Text>
                        </View>

                        {/* Enhanced Status Indicator */}
                        {!isLoading && !(isCheckedIn == 1 && isCheckedOut == true) && (
                            <Animated.View
                                style={[
                                    styles.statusIndicator,
                                    {
                                        opacity: headerAnim,
                                        transform: [
                                            {
                                                scale: headerAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [0.9, 1],
                                                }),
                                            },
                                            {
                                                translateY: headerAnim.interpolate({
                                                    inputRange: [0, 1],
                                                    outputRange: [20, 0],
                                                }),
                                            },
                                        ],
                                    },
                                ]}
                            >
                                <View style={styles.statusIndicatorContent}>
                                    <Animated.View
                                        style={[
                                            styles.statusDot,
                                            {
                                                backgroundColor: isCheckedIn && !isCheckedOut ? '#10B981' : '#6B7280',
                                                transform: [
                                                    {
                                                        scale: buttonPulseAnim.interpolate({
                                                            inputRange: [1, 1.03],
                                                            outputRange: [1, 1.2],
                                                        }),
                                                    },
                                                ],
                                            },
                                        ]}
                                    />
                                    <Text style={styles.statusIndicatorText}>
                                        {isCheckedIn && !isCheckedOut ? 'Sedang Bekerja' : 'Belum Clock In'}
                                    </Text>
                                    <View style={styles.statusIndicatorBadge}>
                                        <Ionicons
                                            name={isCheckedIn && !isCheckedOut ? 'checkmark' : 'time-outline'}
                                            size={12}
                                            color="white"
                                        />
                                    </View>
                                </View>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>

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
                                    {/* Date above the time */}
                                    <Text style={styles.todayText}>
                                        {new Date().toLocaleDateString('id-ID', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </Text>
                                    <Text style={styles.timeText}>{currentTime}</Text>
                                    <View style={styles.locationContainer}>
                                        <View style={styles.locationIconContainer}>
                                            <Ionicons name="location" size={16} color="#10B981" />
                                        </View>
                                        <Text style={styles.locationText}>{errorMsg ? errorMsg : locationName}</Text>
                                    </View>
                                </>
                            )}
                            <View style={styles.buttonContainer}>
                                {isLoading ? (
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: scaleAnim }],
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
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
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <CircularButton
                                            title="Clock In"
                                            colors={['#4A90E2', '#357ABD', '#2E5984']}
                                            onPress={handleClockIn}
                                        />
                                    </Animated.View>
                                ) : isCheckedIn == 1 && isCheckedOut == false ? (
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: scaleAnim }],
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <CircularButton
                                            title="Clock Out"
                                            onPress={handleClockOut}
                                            colors={['#EF4444', '#DC2626', '#B91C1C']}
                                        />
                                        {/* Lunch action buttons underneath */}
                                        <View
                                            style={{
                                                flexDirection: 'row',
                                                marginTop: 12,
                                                justifyContent: 'center',
                                                gap: 12,
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    styles.smallActionButton,
                                                    {
                                                        backgroundColor:
                                                            isLunchProcessing || hasLunchStarted || todayLunchStart
                                                                ? '#F3F4F6'
                                                                : '#4A90E2',
                                                    },
                                                ]}
                                                onPress={handleLunchStart}
                                                disabled={isLunchProcessing || hasLunchStarted || !!todayLunchStart}
                                            >
                                                <Text
                                                    style={[
                                                        styles.smallActionText,
                                                        {
                                                            color:
                                                                isLunchProcessing ||
                                                                hasLunchStarted ||
                                                                !!todayLunchStart
                                                                    ? '#9CA3AF'
                                                                    : '#fff',
                                                        },
                                                    ]}
                                                >
                                                    {isLunchProcessing && !hasLunchStarted
                                                        ? 'Memproses...'
                                                        : 'Mulai Istirahat'}
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[
                                                    styles.smallActionButton,
                                                    {
                                                        backgroundColor:
                                                            isLunchProcessing || !hasLunchStarted || todayLunchEnd
                                                                ? '#F3F4F6'
                                                                : '#EF4444',
                                                    },
                                                ]}
                                                onPress={handleLunchEnd}
                                                disabled={isLunchProcessing || !hasLunchStarted || !!todayLunchEnd}
                                            >
                                                <Text
                                                    style={[
                                                        styles.smallActionText,
                                                        {
                                                            color:
                                                                isLunchProcessing || !hasLunchStarted || !!todayLunchEnd
                                                                    ? '#9CA3AF'
                                                                    : '#fff',
                                                        },
                                                    ]}
                                                >
                                                    {isLunchProcessing && hasLunchStarted
                                                        ? 'Memproses...'
                                                        : 'Akhiri Istirahat'}
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </Animated.View>
                                ) : isCheckedIn == 1 && isCheckedOut == true ? (
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: scaleAnim }],
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <CircularButton
                                            title="Selesai"
                                            colors={['#10B981', '#059669', '#047857']}
                                            disabled={true}
                                        />
                                    </Animated.View>
                                ) : (
                                    <Animated.View
                                        style={{
                                            transform: [{ scale: scaleAnim }],
                                            alignItems: 'center',
                                            width: '100%',
                                        }}
                                    >
                                        <CircularButton
                                            title="Clock In"
                                            colors={['#4A90E2', '#357ABD', '#2E5984']}
                                            disabled={true}
                                        />
                                    </Animated.View>
                                )}
                            </View>
                        </View>
                    </Animated.View>

                    {/* Attendance History Cards - Directly displayed without toggle */}
                    <View style={styles.historySection}>
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
                            {/* Loading shimmer hanya saat benar-benar loading */}
                            {isLoading && (
                                <View style={styles.historyContainer}>
                                    {[...Array(3)].map((_, index) => (
                                        <ShimmerTaskCard key={index} />
                                    ))}
                                </View>
                            )}
                            {/* Jika sudah tidak loading dan ada data */}
                            {!isLoading && paginatedDateViews.length > 0 && (
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
                                                disabled={currentPage === totalPages - 1 || isPaginating}
                                                style={[
                                                    styles.paginationButton,
                                                    currentPage === totalPages - 1 && styles.disabledPaginationButton,
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
                            )}
                            {/* Jika sudah tidak loading dan data kosong, tampilkan pesan tanpa delay dan tanpa animasi berat */}
                            {!isLoading && paginatedDateViews.length === 0 && (
                                <View
                                    style={{
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
                                </View>
                            )}
                        </Animated.View>
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
        paddingTop: 20,
        paddingBottom: 120,
    },
    backgroundBox: {
        height: 325,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
        marginBottom: 30,
    },
    headerContainer: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        position: 'relative',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
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
        marginTop: 1,
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

    // Enhanced Header Styles
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    statusIndicatorContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicatorBadge: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -30,
        right: -20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 80,
        right: 30,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        Left: -10,
    },
    decorativeCircle5: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 120,
        left: 30,
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
        padding: 20,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        marginTop: -3,
        alignItems: 'center',
    },
    timeSection: {
        alignItems: 'center',
        width: '100%',
    },
    todayText: {
        fontSize: 14,
        color: '#6B7280',
        fontFamily: FONTS.family.semiBold,
        marginBottom: 4,
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
        marginHorizontal: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    locationIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#DCFCE7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    locationText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#15803D',
        textAlign: 'center',
        maxWidth: width * 0.6,
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 16,
        width: '100%',
    },

    attendanceDataContainer: {
        marginTop: 20,
        paddingHorizontal: 0,
    },
    attendanceHeader: {
        marginBottom: 12,
    },
    attendanceTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: -0.3,
    },
    attendanceDataRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        flexWrap: 'wrap',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 0,
        gap: 12,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 0,
    },
    attendanceCard: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 75,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        paddingVertical: 16,
    },
    attendanceIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    attendanceCardValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    attendanceCardLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6B7280',
        textAlign: 'center',
    },
    attendanceStatusContainer: {
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        padding: 12,
        marginTop: 8,
    },
    attendanceStatusText: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontStyle: 'italic',
    },

    centerContent: {
        alignItems: 'center',
    },

    // History Section
    historySection: {
        flex: 1,
        paddingBottom: 20,
        marginTop: 110,
    },

    // Stats Section
    statsContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    statsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsTitle: {
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10,
        marginTop: 16,
    },
    statCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 8,
        alignItems: 'center',
        gap: 2,
        width: '48%',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
    },
    statNumber: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
    },
    statLabel: {
        fontSize: FONTS.size.xs,
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        textAlign: 'center',
    },

    historySectionHeader: {
        flexDirection: 'column',
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
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
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        letterSpacing: -0.5,
    },
    totalRecordsContainer: {
        flexDirection: 'column',
        alignItems: 'start',
        justifyContent: 'space-between',
        gap: 12,
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
        gap: 20,
    },

    // Card Styles
    containerPerDate: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 20,
        marginHorizontal: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        overflow: 'hidden',
    },
    cardHeader: {
        padding: 18,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
    },
    dateSection: {
        gap: 6,
    },
    dateText: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
    },
    statusRow: {
        flexDirection: 'row',
        gap: 4,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    statusText: {
        fontSize: FONTS.size.xs,
        fontFamily: FONTS.family.medium,
    },
    wfhBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        gap: 3,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    wfhText: {
        fontSize: FONTS.size.xs,
        fontFamily: FONTS.family.medium,
    },
    cardContent: {
        flexDirection: 'row',
        padding: 20,
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
        gap: 10,
    },
    timeCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 14,
        padding: 14,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 3,
    },
    timeIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    timeLabel: {
        fontSize: 11,
        fontFamily: FONTS.family.semiBold,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 2,
    },
    timeValue: {
        fontSize: 16,
        fontFamily: FONTS.family.bold,
        color: '#1F2937',
        textAlign: 'center',
        letterSpacing: -0.5,
    },

    // Notes Section
    notesSection: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    },
    notesHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    notesLabel: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#6B7280',
    },
    notesText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.regular,
        color: '#374151',
        lineHeight: 20,
    },

    // Image Container
    imageContainer: {
        width: 90,
        height: 90,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        shadowColor: '#444',
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
        gap: 8,
    },
    noImageText: {
        fontSize: FONTS.size.xs,
        color: '#9CA3AF',
        fontFamily: FONTS.family.medium,
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
        shadowColor: '#444',
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
    collapsedIndicator: {},
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
        shadowColor: '#444',
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
    smallActionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        minWidth: 130,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    smallActionText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default Kehadiran;
