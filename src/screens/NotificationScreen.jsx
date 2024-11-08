import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getNotificationByEmployee, markAsRead } from '../api/notification';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationScreen = ({ navigation }) => {
    const [employeeId, setEmployeeId] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);

    // Use useCallback for memoized function
    const fetchNotifications = useCallback(async () => {
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                console.warn('No employee ID found');
                return;
            }

            const response = await getNotificationByEmployee(employeeId);
            if (!response?.data) {
                throw new Error('No data received from server');
            }

            // Process notifications and update state in one go
            const notificationData = response.data;
            setNotifications(notificationData);
            setUnreadCount(notificationData.filter((notif) => !notif.is_read).length);

            // Optional: Cache the notifications
            await AsyncStorage.setItem('cachedNotifications', JSON.stringify(notificationData));
            await AsyncStorage.setItem('lastFetchTime', new Date().toISOString());
        } catch (error) {
            console.error('Error fetching notifications:', error);
            // Optionally load cached notifications if fetch fails
            const cachedData = await AsyncStorage.getItem('cachedNotifications');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setNotifications(parsedData);
                setUnreadCount(parsedData.filter((notif) => !notif.is_read).length);
            }
        }
    }, []);

    // Function to refresh notifications
    const refreshNotifications = useCallback(async () => {
        await fetchNotifications();
    }, [fetchNotifications]);

    // Initial load with cached data first
    useEffect(() => {
        const loadInitialData = async () => {
            // Try to load cached data first for instant display
            const cachedData = await AsyncStorage.getItem('cachedNotifications');
            if (cachedData) {
                const parsedData = JSON.parse(cachedData);
                setNotifications(parsedData);
                setUnreadCount(parsedData.filter((notif) => !notif.is_read).length);
            }

            // Then fetch fresh data
            await fetchNotifications();
        };

        loadInitialData();

        // Optional: Set up polling for new notifications
        const pollInterval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds

        return () => {
            clearInterval(pollInterval);
        };
    }, [fetchNotifications]);
    // Add error state if needed
    const [error, setError] = useState(null);

    // Add loading state if needed
    const [isLoading, setIsLoading] = useState(false);

    const handleNotificationPress = (notification) => {
        // Mark as read
        markAsRead(notification.id);

        // Navigate based on notification type
        switch (notification.notif_type) {
            case 'new_task_notif':
                navigation.navigate('Tugas', {
                    taskId: notification.taskId,
                    projectId: notification.projectId,
                    mode: 'view',
                });
                break;

            case 'submit_task_notif':
                navigation.navigate('TaskOnReview', {
                    taskId: notification.taskId,
                    projectId: notification.projectId,
                    mode: 'review',
                });
                break;

            case 'approve_task_notif':
                navigation.navigate('Tugas', {
                    taskId: notification.taskId,
                    projectId: notification.projectId,
                    mode: 'view',
                    showCompletionStatus: true,
                });
                break;

            case 'reject_task_notif':
                navigation.navigate('Tugas', {
                    taskId: notification.taskId,
                    projectId: notification.projectId,
                    mode: 'edit',
                    showRevisionComments: true,
                });
                break;

            case 'hold_task_notif':
                navigation.navigate('Tugas', {
                    taskId: notification.taskId,
                    projectId: notification.projectId,
                    mode: 'view',
                    showChangelog: true,
                });
                break;

            default:
                console.log('Unknown notification type:', notification.notif_type);
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
                return 'edit';
            default:
                return 'bell';
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'new_task_notif':
                return '#0E509E'; // Blue
            case 'submit_task_notif':
                return '#F0B86E'; // Orange
            case 'approve_task_notif':
                return '#3AD665'; // Green
            case 'reject_task_notif':
                return '#FF6B6B'; // Red
            case 'hold_task_notif':
                return '#A084DC'; // Purple
            default:
                return '#0E509E';
        }
    };

    const formatTimeAgoDetailed = (dateString) => {
        const now = new Date();
        const createdAt = new Date(dateString);
        const diffInMilliseconds = now - createdAt;
        const diffInSeconds = Math.floor(diffInMilliseconds / 1000);
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        const diffInHours = Math.floor(diffInMinutes / 60);
        const diffInDays = Math.floor(diffInHours / 24);
        const diffInWeeks = Math.floor(diffInDays / 7);
        const diffInMonths = Math.floor(diffInDays / 30);
    
        // For very recent updates
        if (diffInSeconds < 30) {
            return 'Baru saja';
        }
        
        // Less than a minute
        if (diffInSeconds < 60) {
            return `${diffInSeconds} detik yang lalu`;
        }
        
        // Less than an hour
        if (diffInMinutes < 60) {
            return `${diffInMinutes} menit yang lalu`;
        }
        
        // Less than a day
        if (diffInHours < 24) {
            return `${diffInHours} jam yang lalu`;
        }
        
        // Less than a week
        if (diffInDays < 7) {
            return `${diffInDays} hari yang lalu`;
        }
        
        // Less than a month
        if (diffInWeeks < 4) {
            return `${diffInWeeks} minggu yang lalu`;
        }
        
        // Less than a year
        if (diffInMonths < 12) {
            return `${diffInMonths} bulan yang lalu`;
        }
    
        // More than a year, show full date
        return createdAt.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };
    
    // Optional: Auto-updating version
    const AutoUpdatingTime = ({ date }) => {
        const [timeAgo, setTimeAgo] = useState(formatTimeAgoDetailed(date));
    
        useEffect(() => {
            // Update every minute for recent items
            const interval = setInterval(() => {
                setTimeAgo(formatTimeAgoDetailed(date));
            }, 60000);
    
            return () => clearInterval(interval);
        }, [date]);
    
        return (
            <Text style={styles.notificationTime}>{timeAgo}</Text>
        );
    };

    const NotificationItem = ({ notification }) => (
        <TouchableOpacity
            style={[styles.notificationItem, !notification.is_read && styles.unreadNotification]}
            onPress={() => handleNotificationPress(notification)}
        >
            <View
                style={[
                    styles.notificationIconContainer,
                    { backgroundColor: `${getNotificationColor(notification.notif_type)}15` },
                ]}
            >
                <Feather
                    name={getNotificationIcon(notification.notif_type)}
                    size={24}
                    color={getNotificationColor(notification.notif_type)}
                />
            </View>
            <View style={styles.notificationContent}>
                <Text style={styles.notificationTitle}>{notification.task_name}</Text>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <AutoUpdatingTime date={notification.created_at} />
            </View>
            {!notification.is_read && (
                <View style={[styles.unreadDot, { backgroundColor: getNotificationColor(notification.notif_type) }]} />
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Feather name="chevron-left" size={28} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                {/* {notifications && notifications.some((n) => !n.is_read) && (
                    <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                        <Text style={styles.markAllText}>Mark all as read</Text>
                    </TouchableOpacity>
                )} */}
            </View>

            {/* Notifications List */}
            <ScrollView
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshNotifications} />}
                style={styles.notificationsList}
            >
                {notifications?.length > 0 ? (
                    notifications.map((notification) => (
                        <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onRead={()=>markAsRead(notification.id)}
                            // onNavigate={handleNotificationNavigation}
                        />
                    ))
                ) : (
                    <View style={styles.emptyContainer}>
                        <Feather name="bell-off" size={48} color="#8E8E93" />
                        <Text style={styles.emptyText}>No notifications</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 20,
    },
    backButton: {
        padding: 8,
        zIndex: 1,
    },
    headerTitle: {
        flex: 1,
        fontSize: 20,
        color: 'white',
        fontFamily: 'Poppins-Medium',
        marginLeft: 16,
        zIndex: 1,
    },
    markAllButton: {
        padding: 8,
        zIndex: 1,
    },
    markAllText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
    },
    notificationsList: {
        flex: 1,
        padding: 16,
    },
    notificationItem: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    notificationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    unreadNotification: {
        backgroundColor: '#F0F7FF',
    },
    notificationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F7FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        color: '#1C1C1E',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#8E8E93',
        marginBottom: 4,
    },
    notificationTime: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#8E8E93',
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0E509E',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        color: '#8E8E93',
        marginTop: 16,
    },
});

export default NotificationScreen;
