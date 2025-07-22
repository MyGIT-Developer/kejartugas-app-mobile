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
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getNotificationByEmployee, markAsRead, markAllAsRead } from '../api/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation }) => {
    const [employeeId, setEmployeeId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
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
            console.log('fetchNotifications response:', response);
            if (!response?.data) {
                throw new Error('No data received from server');
            }

            const notificationData = response.data;
            setNotifications(notificationData);
            setUnreadCount(notificationData.filter((notif) => !notif.is_read).length);

            await AsyncStorage.setItem('cachedNotifications', JSON.stringify(notificationData));
            await AsyncStorage.setItem('lastFetchTime', new Date().toISOString());
        } catch (error) {
            console.error('Error fetching notifications:', error);
            const cachedData = await AsyncStorage.getItem('cachedNotifications');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setNotifications(parsedData);
                setUnreadCount(parsedData.filter((notif) => !notif.is_read).length);
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
        const loadInitialData = async () => {
            const cachedData = await AsyncStorage.getItem('cachedNotifications');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setNotifications(parsedData);
                setUnreadCount(parsedData.filter((notif) => !notif.is_read).length);
            }

            await fetchNotifications();
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

            // Optimistic UI update
            const updatedNotifications = notifications.map((notif) => ({ ...notif, is_read: true }));
            setNotifications(updatedNotifications);
            setUnreadCount(0);

            await markAllAsRead(employeeId);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            // Revert changes if failed
            fetchNotifications();
        } finally {
            setIsLoading(false);
        }
    };

    const handleNotificationPress = async (notification) => {
        try {
            // Optimistic UI update
            const updatedNotifications = notifications.map((notif) =>
                notif.id === notification.id ? { ...notif, is_read: true } : notif,
            );
            setNotifications(updatedNotifications);
            setUnreadCount(updatedNotifications.filter((notif) => !notif.is_read).length);

            await markAsRead(notification.id);

            // Navigation logic
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

        const backgroundColor = notification.is_read ? '#FFFFFF' : '#F8FAFC';
        const borderColor = getNotificationColor(notification.notif_type);
        const textColor = notification.is_read ? '#64748B' : '#1E293B';
        const titleWeight = notification.is_read ? '500' : '600';

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
                            backgroundColor,
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
                                    color: textColor,
                                    fontWeight: titleWeight,
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
                            {!notification.is_read && (
                                <View
                                    style={[
                                        styles.unreadBadge,
                                        { backgroundColor: getNotificationColor(notification.notif_type) },
                                    ]}
                                />
                            )}
                        </View>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#1D4ED8" />

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
                    colors={['#1D4ED8', '#3B82F6', '#60A5FA']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
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
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text style={styles.headerTitle}>Notifikasi</Text>

                    <View style={styles.headerRightRow}>
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
                        />
                    }
                    showsVerticalScrollIndicator={false}
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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerBackground: {
        height: 200,
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
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingHorizontal: 24,
        paddingBottom: 24,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        gap: 8,
    },
    headerRightRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
        flex: 1,
        marginLeft: 16,
        letterSpacing: 0.5,
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    unreadCountText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '600',
    },
    notificationsContainer: {
        flex: 1,
        paddingHorizontal: 20,
        marginTop: -24,
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
});

export default NotificationScreen;
