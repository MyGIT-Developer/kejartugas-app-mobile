import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    Animated,
    StatusBar,
    Platform,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getNotificationByEmployee, markAsRead, markAllAsRead } from '../api/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation }) => {
    const [employeeId, setEmployeeId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // Ubah default menjadi true
    const [refreshing, setRefreshing] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const loadingOpacity = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const headerAnim = useRef(new Animated.Value(0)).current;
    const headerScaleAnim = useRef(new Animated.Value(0.95)).current;
    const emptyAnim = useRef(new Animated.Value(0)).current;

    const fetchNotifications = useCallback(async () => {
        try {
            setIsLoading(true);
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                console.warn('No employee ID found');
                return;
            }

            const response = await getNotificationByEmployee(employeeId);
            if (!response?.data) {
                throw new Error('No data received from server');
            }

            // Filter hanya notifikasi yang belum dibaca
            const unreadNotifications = response.data.filter((notif) => !notif.is_read);
            setNotifications(unreadNotifications);
            setUnreadCount(unreadNotifications.length);

            await AsyncStorage.setItem('cachedNotifications', JSON.stringify(unreadNotifications));
            await AsyncStorage.setItem('lastFetchTime', new Date().toISOString());
        } catch (error) {
            console.error('Error fetching notifications:', error);
            const cachedData = await AsyncStorage.getItem('cachedNotifications');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                const unreadCached = parsedData.filter((notif) => !notif.is_read);
                setNotifications(unreadCached);
                setUnreadCount(unreadCached.length);
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshNotifications = useCallback(async () => {
        setRefreshing(true);
        await fetchNotifications();
        setRefreshing(false);
    }, [fetchNotifications]);

    useEffect(() => {
        Animated.timing(loadingOpacity, {
            toValue: isLoading ? 1 : 0,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [isLoading]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true); // Pastikan loading aktif saat mulai

            try {
                const cachedData = await AsyncStorage.getItem('cachedNotifications');
                if (cachedData) {
                    const parsedData = JSON.parse(cachedData);
                    setNotifications(parsedData);
                    setUnreadCount(parsedData.filter((notif) => !notif.is_read).length);
                }

                await fetchNotifications();
            } finally {
                setIsLoading(false); // Matikan loading setelah selesai
            }
        };

        loadInitialData();

        // Start animations
        Animated.parallel([
            Animated.timing(headerAnim, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(headerScaleAnim, {
                toValue: 1,
                tension: 90,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                delay: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 90,
                friction: 10,
                delay: 100,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (notifications.length === 0) {
                Animated.timing(emptyAnim, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.elastic(1),
                    useNativeDriver: true,
                }).start();
            }
        });
    }, []);

    const handleMarkAllAsRead = async () => {
        try {
            setIsLoading(true);
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) return;

            // Kosongkan daftar notifikasi karena semua akan ditandai sebagai sudah dibaca
            setNotifications([]);
            setUnreadCount(0);

            await markAllAsRead(employeeId);

            // Update cache
            await AsyncStorage.setItem('cachedNotifications', JSON.stringify([]));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            fetchNotifications(); // Re-fetch jika error
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationPress = async (notification) => {
        try {
            // Hapus notifikasi dari daftar karena akan ditandai sebagai sudah dibaca
            const updatedNotifications = notifications.filter((notif) => notif.id !== notification.id);
            setNotifications(updatedNotifications);
            setUnreadCount(updatedNotifications.length);

            await markAsRead(notification.id);

            // Update cache
            await AsyncStorage.setItem('cachedNotifications', JSON.stringify(updatedNotifications));

            // Navigation logic tetap sama
            const navigationParams = {
                taskId: notification.taskId,
                projectId: notification.projectId,
                mode: 'view',
            };

            switch (notification.notif_type) {
                case 'new_task_notif':
                    navigation.navigate('Tugas', navigationParams);
                    break;
                case 'submit_task_notif':
                    navigation.navigate('TaskOnReview', { ...navigationParams, mode: 'review' });
                    break;
                case 'approve_task_notif':
                    navigation.navigate('Tugas', { ...navigationParams, showCompletionStatus: true });
                    break;
                case 'reject_task_notif':
                    navigation.navigate('Tugas', { ...navigationParams, mode: 'edit', showRevisionComments: true });
                    break;
                case 'hold_task_notif':
                    navigation.navigate('Tugas', { ...navigationParams, showChangelog: true });
                    break;
                default:
                    console.log('Unknown notification type:', notification.notif_type);
            }
        } catch (error) {
            console.error('Failed to handle notification:', error);
            fetchNotifications(); // Re-fetch if error occurs
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'new_task_notif':
                return 'plus-circle';
            case 'submit_task_notif':
                return 'send';
            case 'approve_task_notif':
                return 'check-circle';
            case 'reject_task_notif':
                return 'x-circle';
            case 'hold_task_notif':
                return 'clock';
            default:
                return 'bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'new_task_notif':
                return '#3B82F6'; // Blue-500
            case 'submit_task_notif':
                return '#F59E0B'; // Amber-500
            case 'approve_task_notif':
                return '#10B981'; // Emerald-500
            case 'reject_task_notif':
                return '#EF4444'; // Red-500
            case 'hold_task_notif':
                return '#8B5CF6'; // Violet-500
            default:
                return '#3B82F6';
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const createdAt = new Date(dateString);
        const diffInMilliseconds = now - createdAt;
        const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);

        if (diffInMinutes < 1) return 'Baru saja';
        if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
        if (diffInHours < 24) return `${diffInHours} jam lalu`;
        if (diffInDays < 7) return `${diffInDays} hari lalu`;

        return createdAt.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const NotificationItem = ({ notification, index }) => {
        const scaleAnim = useRef(new Animated.Value(0.9)).current;
        const opacityAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            Animated.parallel([
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 60,
                    friction: 7,
                    delay: index * 30,
                    useNativeDriver: true,
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 300,
                    delay: index * 30,
                    useNativeDriver: true,
                }),
            ]).start();
        }, []);

        const borderColor = getNotificationColor(notification.notif_type);

        return (
            <Animated.View
                style={[
                    styles.notificationItemContainer,
                    {
                        opacity: opacityAnim,
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <TouchableOpacity
                    style={[
                        styles.notificationItem,
                        {
                            backgroundColor: '#F8FAFC', // Always use unread background
                            borderLeftWidth: 4,
                            borderLeftColor: borderColor,
                        },
                    ]}
                    activeOpacity={0.7}
                    onPress={() => handleNotificationPress(notification)}
                >
                    <View
                        style={[
                            styles.notificationIconContainer,
                            { backgroundColor: `${getNotificationColor(notification.notif_type)}10` },
                        ]}
                    >
                        <Feather
                            name={getNotificationIcon(notification.notif_type)}
                            size={20}
                            color={getNotificationColor(notification.notif_type)}
                        />
                    </View>

                    <View style={styles.notificationContent}>
                        <Text
                            style={[
                                styles.notificationTitle,
                                {
                                    color: '#1E293B', // Always use unread text color
                                    fontWeight: '600', // Always use unread font weight
                                },
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {notification.task_name}
                        </Text>
                        <Text style={styles.notificationMessage} numberOfLines={2} ellipsizeMode="tail">
                            {notification.message}
                        </Text>
                        <View style={styles.notificationFooter}>
                            <Text style={styles.notificationTime}>{formatTimeAgo(notification.created_at)}</Text>
                            <View
                                style={[
                                    styles.unreadBadge,
                                    { backgroundColor: getNotificationColor(notification.notif_type) },
                                ]}
                            />
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            {/* Header Background */}
            <Animated.View
                style={[
                    styles.headerBackground,
                    {
                        opacity: headerAnim,
                        transform: [{ scale: headerScaleAnim }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                {/* Decorative Circles */}
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

            {/* Header Content */}
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        opacity: headerAnim,
                        transform: [
                            {
                                translateY: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-15, 0],
                                }),
                            },
                            { scale: headerScaleAnim },
                        ],
                    },
                ]}
            >
                <View style={styles.headerContentColumn}>
                    <Text style={styles.headerTitleCenter}>Notifikasi</Text>
                    <View style={styles.headerStatusRow}>
                        <View style={styles.unreadCountBadge}>
                            <Text style={styles.unreadCountText}>{unreadCount} belum dibaca</Text>
                        </View>
                        {unreadCount > 0 && (
                            <TouchableOpacity
                                style={styles.markAllButton}
                                onPress={handleMarkAllAsRead}
                                disabled={isLoading}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name="check-all"
                                    size={20}
                                    color="white"
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={styles.markAllText}>Tandai semua</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </Animated.View>

            {/* Notifications List */}
            <Animated.View
                style={[
                    styles.notificationsContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}
            >
                <ScrollView
                    contentContainerStyle={[styles.scrollViewContent, notifications.length === 0 && { flex: 1 }]}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={refreshNotifications}
                            colors={['#3B82F6']}
                            tintColor="#3B82F6"
                            progressBackgroundColor="#FFFFFF"
                            enabled={!isLoading}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                    scrollEnabled={!isLoading}
                >
                    {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                            <NotificationItem key={notification.id} notification={notification} index={index} />
                        ))
                    ) : (
                        <Animated.View
                            style={[
                                styles.emptyContainer,
                                {
                                    opacity: emptyAnim,
                                    transform: [
                                        {
                                            scale: emptyAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.9, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <View style={styles.emptyIconContainer}>
                                <Feather name="bell-off" size={72} color="#CBD5E1" style={styles.emptyIcon} />
                                <View style={styles.emptyIconCircle} />
                            </View>
                            <Text style={styles.emptyTitle}>Tidak ada notifikasi</Text>
                            <Text style={styles.emptySubtitle}>Anda belum memiliki notifikasi saat ini</Text>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={refreshNotifications}
                                activeOpacity={0.7}
                            >
                                <Feather name="refresh-cw" size={18} color="#3B82F6" />
                                <Text style={styles.refreshButtonText}>Muat Ulang</Text>
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </ScrollView>
            </Animated.View>

            {/* Floating Back Button */}
            <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>

            {/* Full Screen Loading Overlay */}
            {isLoading && (
                <Animated.View
                    style={[
                        styles.loadingOverlay,
                        {
                            opacity: loadingOpacity,
                            transform: [
                                {
                                    scale: loadingOpacity.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.95, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>Memuat notifikasi...</Text>
                    </View>
                </Animated.View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerBackground: {
        height: 325,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        overflow: 'hidden',
    },
    headerGradient: {
        flex: 1,
    },
    headerContainer: {
        // Tambah jarak agar header lebih turun
        paddingTop: Platform.OS === 'ios' ? 100 : 70,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    headerContentColumn: {
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        gap: 12,
        paddingLeft: 8,
        paddingBottom: 0,
    },
    headerStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: 10,
        marginTop: 4,
    },
    headerTitleCenter: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        letterSpacing: 0.5,
        textAlign: 'left',
        marginLeft: 0,
        marginBottom: 0,
    },
    floatingBackButton: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        backgroundColor: '#3B82F6',
        borderRadius: 28,
        width: 56,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.18,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 100,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
    },
    markAllText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 4,
    },
    headerStatus: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    unreadCountBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 40,
        minWidth: 0,
    },
    unreadCountText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationsContainer: {
        flex: 1,
        paddingHorizontal: 12,
        marginTop: 20,
    },
    scrollViewContent: {
        paddingBottom: 24,
    },
    notificationItemContainer: {
        marginBottom: 12,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 14,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,

        shadowRadius: 3,
        elevation: 2,
    },
    notificationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        marginBottom: 6,
    },
    notificationMessage: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 8,
        lineHeight: 20,
    },
    notificationFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    notificationTime: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    unreadBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 24,
    },
    emptyIconContainer: {
        position: 'relative',
        marginBottom: 24,
    },
    emptyIcon: {
        opacity: 0.8,
        zIndex: 2,
    },
    emptyIconCircle: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(203, 213, 225, 0.2)',
        top: -4,
        left: -4,
        zIndex: 1,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 15,
        color: '#64748B',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 22,
        marginBottom: 24,
    },
    refreshButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
        backgroundColor: '#EFF6FF',
    },
    refreshButtonText: {
        color: '#3B82F6',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: -30,
        left: -30,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 20,
        right: -20,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 60,
        left: -20,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 100,
        right: -40,
    },
    decorativeCircle5: {
        position: 'absolute',
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        left: -50,
    },
    // Loading Overlay Styles
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#334155',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
});

export default NotificationScreen;
