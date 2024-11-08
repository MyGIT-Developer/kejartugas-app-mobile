import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Alert,
    Platform,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getHomeData } from '../api/general';
const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;
import { fetchTaskById, fetchTotalTasksForEmployee } from '../api/task'; // Import the fetchTaskById function
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import Shimmer from '../components/Shimmer';
import { getNotificationByEmployee } from '../api/notification';
import NotificationService from '../utils/notificationService';

const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

// Group tasks by project name
const groupTasksByProject = (tasks) => {
    const groupedTasks = {};
    tasks.forEach((task) => {
        groupedTasks[task.project_name] = groupedTasks[task.project_name] || [];
        groupedTasks[task.project_name].push(task);
    });
    return groupedTasks;
};

const calculateRemainingDays = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day for accurate comparison
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};

const getStatusBadgeColor = (status, endDate) => {
    if (status === 'Completed') {
        return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
    } else if (status === 'onPending') {
        return { color: '#F0E08A', textColor: '#333333', label: 'Tersedia' };
    } else if (status === 'onHold') {
        return { color: '#F69292', textColor: '#811616', label: 'Ditunda' };
    } else if (status === 'rejected') {
        return { color: '#050404FF', textColor: '#811616', label: 'Ditolak' };
    } else if (status === 'onReview') {
        return { color: '#ffd000', textColor: '#333333', label: 'Dalam Peninjauan' };
    }

    const remainingDays = calculateRemainingDays(endDate, status);

    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FFE9CB', textColor: '#E07706', label: `Tersisa ${remainingDays} hari` };
    }

    // Existing status handling logic
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', textColor: '#333333', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#ffd000', textColor: '#333333', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#050404FF', textColor: '#811616', label: 'Ditolak' };
        case 'onHold':
            return { color: '#F69292', textColor: '#811616', label: 'Ditunda' };
        case 'Completed':
            return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' }; // Updated label
        case 'onPending':
            return { color: '#F0E08A', textColor: '#333333', label: 'Tersedia' };
        default:
            return { color: '#E0E0E0', textColor: '#333333', label: status };
    }
};

const getStatusAppearance = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', textColor: '#333333', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#ffd000', textColor: '#333333', label: 'Dalam Peninjauan' };
    }
};

const SkeletonTaskCard = () => {
    return (
        <View style={styles.taskCard}>
            <Shimmer width={200} height={30} style={styles.shimmerTitle} />
            {[...Array(3)].map((_, index) => (
                <View style={styles.taskSection} key={index}>
                    <View style={[styles.taskItem]}>
                        <View style={styles.taskInfo}>
                            <Shimmer width={170} height={20} style={styles.shimmerTitle} />
                            <Shimmer width={140} height={20} style={styles.shimmerTitle} />
                        </View>
                        <Shimmer width={50} height={20} style={styles.shimmerStatus} />
                    </View>
                    <Shimmer width={150} height={20} style={styles.shimmerTitle} />
                </View>
            ))}
        </View>
    );
};

const TaskCard = ({ projectName, tasks }) => {
    const truncateText = (text, maxLength) => {
        return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };

    const renderStatusOrDays = (task) => {
        const {
            color: badgeColor,
            textColor: badgeTextColor,
            label: displayStatus,
        } = getStatusBadgeColor(task.task_status, task.end_date);
        return (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={[styles.badgeText, { color: badgeTextColor }]} numberOfLines={1} ellipsizeMode="tail">
                    {displayStatus}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.taskCard}>
            <Text style={styles.projectTitle}>{projectName}</Text>
            {tasks.slice(0, 3).map((task, index) => (
                <View style={styles.taskSection} key={task.id || index}>
                    <View style={styles.taskItem}>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskName}>{truncateText(task.task_name, 50)}</Text>
                            <Text style={styles.taskDueDate}>Due: {formatDate(task.end_date)}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getStatusAppearance(task.task_status).color }]}>
                            <Text
                                style={[styles.badgeText, { color: getStatusAppearance(task.task_status).textColor }]}
                            >
                                {getStatusAppearance(task.task_status).label}
                            </Text>
                        </View>
                    </View>
                    {task.task_status === 'workingOnIt' && renderStatusOrDays(task)}
                </View>
            ))}
        </View>
    );
};

const StatisticSkeleton = () => (
    <View style={[styles.statisticCard, { borderColor: '#e0e0e0' }]}>
        <View style={[styles.textContainer, { gap: 5, display: 'flex', flexDirection: 'column', marginRight: 10 }]}>
            <Shimmer width={60} height={25} style={styles.shimmerTitle} />
            <Shimmer width={50} height={20} style={styles.shimmerTitle} />
        </View>
        <Shimmer width={50} height={55} style={styles.shimmerTitle} />
    </View>
);

const StatisticCard = ({ value, description, color, icon, onPress }) => (
    <TouchableOpacity onPress={onPress}>
        <View style={[styles.statisticCard, { borderColor: color }]}>
            <View style={styles.textContainer}>
                <Text style={styles.valueText}>{value}</Text>
                <Text style={styles.descriptionText}>{description}</Text>
            </View>
            <Feather name={icon} size={30} color={color} style={styles.icon} />
        </View>
    </TouchableOpacity>
);

const MenuButton = ({ icon, description, onPress }) => (
    <TouchableOpacity style={styles.menuButtonContainer} onPress={onPress}>
        <View style={styles.statCard}>
            <Feather name={icon} size={24} color="#148FFF" />
        </View>
        <Text style={styles.menuButtonText}>{description}</Text>
    </TouchableOpacity>
);

const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
        return 'Selamat Pagi';
    } else if (currentHour < 15) {
        return 'Selamat Siang';
    } else if (currentHour < 19) {
        return 'Selamat Sore';
    } else {
        return 'Selamat Malam';
    }
};

const Home = () => {
    const [employeeData, setEmployeeData] = useState({
        name: '',
        id: '',
        companyId: '',
        roleId: '',
        token: '',
    });
    const [dashboardData, setDashboardData] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [greeting, setGreeting] = useState(getGreeting());
    const navigation = useNavigation();
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [projects, setProjects] = useState([]);
    const [accessPermissions, setAccessPermissions] = useState([]);
    const [notifications, setNotifications] = useState([]); // To store notifications
    const [unreadCount, setUnreadCount] = useState(0);

    const checkAccessPermission = async () => {
        try {
            const accessPermissions = await AsyncStorage.getItem('access_permissions');
            const permissions = JSON.parse(accessPermissions) || [];
            setAccessPermissions(permissions);
        } catch (error) {
            console.error('Error checking access permission:', error);
            setAccessPermissions([]); // Ensure permissions is an empty array on error
        } finally {
            setIsLoading(false); // Set loading to false regardless of success or error
        }
    };

    useEffect(() => {
        checkAccessPermission();
    }, []);

    const handleMenuPress = (menuId) => {
        switch (menuId) {
            case 'adhoc':
                navigation.navigate('AdhocDashboard');
                break;
            case 'leave':
                // Alert.alert('Fitur Belum Tersedia', 'Mohon maaf, fitur Cuti sedang dalam pengembangan.', [
                //     { text: 'OK', onPress: () => console.log('OK Pressed') },
                // ]);
                showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Cuti sedang dalam pengembangan.', 'error');
                break;
            case 'claim':
                // Alert.alert('Fitur Belum Tersedia', 'Mohon maaf, fitur Klaim sedang dalam pengembangan.', [
                //     { text: 'OK', onPress: () => console.log('OK Pressed') },
                // ]);
                showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Klaim sedang dalam pengembangan.', 'error');
                break;
        }
    };

    const handlePress = (stat) => {
        // Determine the required permission for the intended screen based on the stat description
        let requiredPermission;

        switch (stat.description) {
            case 'Projek Dalam Pengerjaan':
                requiredPermission = accessPermissions.access_project; // Define the required permission for this screen
                break;
            case 'Total Projek Selesai':
                requiredPermission = accessPermissions.access_project; // Define the required permission for this screen
                break;
            case 'Tugas Dalam Pengerjaan':
                requiredPermission = accessPermissions.access_tasks; // Define the required permission for this screen
                break;
            case 'Tugas Selesai':
                requiredPermission = accessPermissions.access_tasks; // Define the required permission for this screen
                break;
            default:
                // Alert.alert('Fitur Belum Tersedia', 'Tidak ada Fitur', [
                //     { text: 'OK', onPress: () => console.log('OK Pressed') },
                // ]);;
                showAlert('Fitur Belum Tersedia.', 'error');
                return;
        }

        if (!requiredPermission) {
            // Show an alert or message indicating no access
            // Alert.alert('You do not have permission to access this feature.', 'Anda tidak memiliki akses ke dalam fitur ini', [
            //     { text: 'OK', onPress: () => console.log('OK Pressed') },
            // ]);
            showAlert('You do not have permission to access this feature.', 'error');
            return;
        }

        // Navigate based on the description
        switch (stat.description) {
            case 'Projek Dalam Pengerjaan':
                navigation.navigate('ProjectOnWorking');
                break;
            case 'Total Projek Selesai':
                navigation.navigate('ProjectList');
                break;
            case 'Tugas Dalam Pengerjaan':
                navigation.navigate('Tugas');
                break;
            case 'Tugas Selesai':
                navigation.navigate('Tugas');
                break;
            default:
                break; // Default case is covered above
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    };

    const checkTokenExpiration = async () => {
        try {
            const expiredToken = await AsyncStorage.getItem('expiredToken');
            if (expiredToken) {
                const tokenExpiration = new Date(expiredToken);
                const now = new Date();
                if (now > tokenExpiration) {
                    // Token has expired, logout and navigate to login screen
                    await AsyncStorage.multiRemove([
                        'employee_name',
                        'employeeId',
                        'companyId',
                        'userRole',
                        'token',
                        'expiredToken',
                    ]);
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                }
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
        }
    };

    const [notificationsSeen, setNotificationsSeen] = useState(new Set());
const [lastFetchTime, setLastFetchTime] = useState(Date.now());

const fetchNotifications = async () => {
    setIsLoading(true);

    try {
        const currentTime = Date.now();
        const response = await getNotificationByEmployee(employeeData.id);
        const notifications = response.data;

        // Find new unread notifications that came after last fetch
        const newUnreadNotifications = notifications.filter(notification => 
            !notification.is_read && 
            !notificationsSeen.has(notification.id) &&
            new Date(notification.created_at) > new Date(lastFetchTime)
        );

        // Show notifications only for new ones
        if (newUnreadNotifications.length > 0) {
            for (const notification of newUnreadNotifications) {
                await handleLocalNotification(notification);
                // Add to seen notifications
                setNotificationsSeen(prev => new Set([...prev, notification.id]));
            }
        }

        // Update state
        setNotifications(notifications);
        setLastFetchTime(currentTime);
        const unread = notifications.filter((notif) => !notif.is_read).length;
        setUnreadCount(unread);

    } catch (error) {
        console.error('Error fetching notifications:', error);
    } finally {
        setIsLoading(false);
    }
};

const handleLocalNotification = async (notification) => {
    try {
        let title = 'New Notification';
        let body = notification.message;

        switch (notification.notif_type) {
            case 'TASK_ASSIGNED':
                title = '🔔 New Task Assignment';
                break;
            case 'TASK_UPDATE':
                title = '📝 Task Update';
                break;
            case 'TASK_COMMENT':
                title = '💬 New Comment';
                break;
            // Add more cases as needed
            default:
                title = '🔔 New Notification';
        }

        await NotificationService.sendLocalNotification(
            title,
            body,
            {
                data: {
                    type: notification.notif_type,
                    taskId: notification.task_id,
                    notificationId: notification.id
                }
            }
        );
    } catch (error) {
        console.error('Error sending local notification:', error);
    }
};


// Update your notification fetch interval
useEffect(() => {
    let intervalId;

    if (employeeData.id) {
        // Initial fetch
        fetchNotifications();

        // Set up interval for subsequent fetches
        intervalId = setInterval(() => {
            fetchNotifications();
        }, 60000); // Check every minute instead of 30 seconds
    }

    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
}, [employeeData.id]);

// Optional: Persist seen notifications
useEffect(() => {
    const saveSeenNotifications = async () => {
        try {
            await AsyncStorage.setItem(
                'seenNotifications', 
                JSON.stringify(Array.from(notificationsSeen))
            );
        } catch (error) {
            console.error('Error saving seen notifications:', error);
        }
    };

    if (notificationsSeen.size > 0) {
        saveSeenNotifications();
    }
}, [notificationsSeen]);

// Load saved seen notifications on mount
useEffect(() => {
    const loadSeenNotifications = async () => {
        try {
            const stored = await AsyncStorage.getItem('seenNotifications');
            if (stored) {
                setNotificationsSeen(new Set(JSON.parse(stored)));
            }
        } catch (error) {
            console.error('Error loading seen notifications:', error);
        }
    };

    loadSeenNotifications();
}, []);

    const fetchTasks = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                throw new Error('ID Karyawan tidak ditemukan');
            }

            const data = await fetchTotalTasksForEmployee(employeeId);

            const sortedTasks = data.employeeTasks
                .filter((task) => task.task_status === 'onReview' || task.task_status === 'workingOnIt')
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

            setTasks(sortedTasks);

            const projectsMap = new Map();
            sortedTasks.forEach((task) => {
                if (!projectsMap.has(task.project_id)) {
                    projectsMap.set(task.project_id, {
                        project_id: task.project_id,
                        project_name: task.project_name,
                        tasks: [],
                    });
                }
                projectsMap.get(task.project_id).tasks.push(task);
            });
            setProjects(Array.from(projectsMap.values()));

            // Store task IDs in AsyncStorage
            await Promise.all(
                sortedTasks.map((task) => AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id))),
            );
        } catch (error) {
            setError('Gagal mengambil tugas. Silakan coba lagi nanti.');
            showAlert(error.response?.data?.message || 'An error occurred', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHomeData = useCallback(async () => {
        if (!employeeData.companyId || !employeeData.id || !employeeData.roleId || !employeeData.token) return;
        setIsLoading(true);
        try {
            const response = await getHomeData(
                employeeData.companyId,
                employeeData.id,
                employeeData.roleId,
                employeeData.token,
            );
            setDashboardData(response);
        } catch (error) {
            console.error('Error fetching home data:', error);
            showAlert('Failed to fetch home data', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [employeeData]);

    // Modify your refresh control
const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setIsLoading(true);
    await checkTokenExpiration();
    await Promise.all([
        fetchTasks(),
        fetchHomeData(),
        // Update last fetch time before fetching new notifications
        fetchNotifications(),
    ]);
    setRefreshing(false);
    setIsLoading(false);
}, [fetchHomeData]);

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const keys = ['employee_name', 'employeeId', 'companyId', 'userRole', 'token'];
                const values = await AsyncStorage.multiGet(keys);
                const data = Object.fromEntries(values);
                setEmployeeData({
                    name: data.employee_name,
                    id: data.employeeId,
                    companyId: data.companyId,
                    roleId: data.userRole,
                    token: data.token,
                });
            } catch (error) {
                console.error('Error fetching data from AsyncStorage:', error);
                showAlert('Failed to fetch employee data', 'error');
            }
        };

        fetchEmployeeData();
        checkTokenExpiration();

        // Update greeting every minute
        const intervalId = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        fetchTasks();
        fetchHomeData();
    }, [fetchHomeData]);

    const groupedTasks = groupTasksByProject(tasks);

    const statistics = dashboardData
        ? [
              {
                  description: 'Projek Dalam Pengerjaan',
                  value: dashboardData.total_projects_working_on_it,
                  color: '#FAA1A7',
                  icon: 'monitor',
              },
              {
                  description: 'Total Projek Selesai',
                  value: dashboardData.total_projects_complete,
                  color: '#3E84CF',
                  icon: 'check-circle',
              },
              {
                  description: 'Tugas Dalam Pengerjaan',
                  value: dashboardData.total_tasks_working_on_it,
                  color: '#DD9968',
                  icon: 'rotate-cw',
              },
              {
                  description: 'Tugas Selesai',
                  value: dashboardData.total_tasks_completed,
                  color: '#3AD665',
                  icon: 'check-square',
              },
          ]
        : [];

    const NotificationIcon = ({ unreadCount, onPress }) => (
        <TouchableOpacity
            style={styles.notificationButton}
            onPress={() =>
                navigation.navigate('NotificationScreen', {
                    notifications: notifications,
                    onNotificationsUpdate: (updatedNotifications) => {
                        setNotifications(updatedNotifications);
                        setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
                        AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
                    },
                })
            }
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Feather name="bell" size={24} color="white" />
                {unreadCount > 0 && (
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.headerWrapper}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.headerContainer}>
                            <View style={styles.greetingContainer}>
                                <Text style={styles.greetingText}>{greeting}</Text>
                                <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
                                    {employeeData.name}
                                </Text>
                            </View>
                            <View style={styles.headerRight}>
                                <NotificationIcon unreadCount={unreadCount} />
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                    />
                }
            >
                <View style={styles.upperGridContainer}>
                    {statistics.map((stat, index) =>
                        isLoading ? (
                            <StatisticSkeleton key={index} color={stat.color} />
                        ) : (
                            <StatisticCard
                                key={index}
                                {...stat}
                                onPress={() => handlePress(stat)} // Tambahkan onPress untuk navigasi
                            />
                        ),
                    )}
                </View>
                {/* Menu buttons between containers */}
                <View style={styles.menuContainer}>
                    <MenuButton icon="users" description="Tugas Ad Hoc" onPress={() => handleMenuPress('adhoc')} />
                    <MenuButton icon="credit-card" description="Cuti" onPress={() => handleMenuPress('leave')} />
                    <MenuButton icon="check-circle" description="Klaim" onPress={() => handleMenuPress('claim')} />
                </View>
                <View style={styles.lowerContainer}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tugas Saya</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Tugas')}>
                            <Text style={styles.sectionLink}>Lihat Semua</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tasksContainer}>
                        {isLoading ? (
                            <>
                                {Object.keys(groupedTasks)
                                    .slice(0, 3)
                                    .map((projectName, index) => (
                                        <SkeletonTaskCard />
                                    ))}
                            </>
                        ) : groupedTasks && Object.keys(groupedTasks).length > 0 ? (
                            <>
                                {Object.keys(groupedTasks)
                                    .slice(0, 3)
                                    .map((projectName, index) => (
                                        <TaskCard
                                            key={index}
                                            projectName={projectName}
                                            tasks={groupedTasks[projectName]}
                                        />
                                    ))}
                                {Object.keys(groupedTasks).length > 3 && (
                                    <TouchableOpacity
                                        style={styles.moreInfoContainer}
                                        onPress={() => navigation.navigate('Tugas')}
                                    >
                                        <Text style={styles.moreInfoText}>
                                            {`Lihat ${Object.keys(groupedTasks).length - 3} proyek lainnya`}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <View style={styles.noTasksBox}>
                                <Text style={styles.noTasksText}>Tidak ada tugas saat ini.</Text>
                            </View>
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
    },
    headerWrapper: {
        width: '100%',
        zIndex: 10,
    },
    headerGradient: {
        paddingBottom: 20,
        borderBottomRightRadius: 30,
        borderBottomLeftRadius: 30,
    },
    safeArea: {
        width: '100%',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 15,
    },
    greetingContainer: {
        flex: 1,
        marginRight: 16,
    },
    greetingText: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 20,
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        lineHeight: 28,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    notificationButton: {
        padding: 8,
        marginLeft: 8,
    },
    iconContainer: {
        position: 'relative',
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
    },
    badgeContainer: {
        position: 'absolute',
        top: -2,
        right: -2,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 2,
        backgroundColor: '#fc5953',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 10,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 40,
    },
    upperGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 20,
        marginBottom: 20,
    },
    statisticCard: {
        width: cardWidth,
        height: 80, // Reduced height
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12, // Reduced padding
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 2,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    valueText: {
        fontSize: 24, // Reduced font size
        color: 'black',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.5,
        lineHeight: 30, // Added line height for better control
    },
    descriptionText: {
        fontSize: 11, // Reduced font size
        color: 'black',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
        lineHeight: 13, // Added line height for better control
    },
    icon: {
        marginLeft: 8, // Reduced margin
    },
    midContainer: {
        padding: 20,
    },
    buttonGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    menuContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 10,
    },

    menuButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '30%',
    },

    statCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },

    menuButtonText: {
        fontSize: 12,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        marginTop: 4,
    },
    lowerContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 14,
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
    },
    sectionLink: {
        fontSize: 14,
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
    },
    tasksContainer: {
        minHeight: 100,
        borderRadius: 10,
        backgroundColor: '#F2F2F7',
        marginBottom: 70,
    },
    scrollContent: {
        flexGrow: 1,
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    projectTitle: {
        fontSize: 18,
        marginBottom: 12,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Bold',
    },
    taskSection: {
        marginBottom: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9EB',
        gap: 10,
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    taskInfo: {
        flex: 1,
        marginRight: 10,
        gap: 10,
    },
    taskName: {
        fontSize: 16,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    taskDueDate: {
        fontSize: 12,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    detailButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#0E509E',
        borderRadius: 6,
    },
    detailButtonText: {
        color: 'white',
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    moreInfoContainer: {
        backgroundColor: '#0E509E',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    moreInfoText: {
        fontSize: 14,
        color: 'white',
        fontFamily: 'Poppins-Medium',
    },
    noTasksBox: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 10,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    noTasksText: {
        fontSize: 12,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
    },
    shimmerTitle: {
        borderRadius: 4,
    },
    shimmerSubtitle: {
        marginBottom: 15,
    },
    shimmerStatus: {
        top: 0,
        borderRadius: 4,
    },
    shimmerButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
});

export default Home;
