import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Platform,
    SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

// Custom hooks
import { useEmployeeData, useDashboardData, useTasksData, useNotifications } from '../hooks/useHomeData';

// Components
import { StatisticCard, StatisticSkeleton } from '../components/StatisticCard';
import TaskCard from '../components/TaskCard';
import NotificationIcon from '../components/NotificationIcon';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import Shimmer from '../components/Shimmer';

// Utils
import { groupTasksByProject, getGreeting } from '../utils/taskUtils';

// Skeleton components
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

// Menu button component
const MenuButton = ({ icon, description, onPress }) => (
    <TouchableOpacity style={styles.menuButtonContainer} onPress={onPress}>
        <View style={styles.statCard}>
            <Feather name={icon} size={24} color="#148FFF" />
        </View>
        <Text style={styles.menuButtonText}>{description}</Text>
    </TouchableOpacity>
);

const Home = () => {
    // Custom hooks for data management
    const employeeData = useEmployeeData();
    const { dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useDashboardData(employeeData);
    const { tasks, projects, isLoading: tasksLoading, refetch: refetchTasks } = useTasksData(employeeData);
    const {
        notifications,
        unreadCount,
        refetch: refetchNotifications,
        setNotifications,
        setUnreadCount,
    } = useNotifications(employeeData);

    // Local state
    const [greeting, setGreeting] = useState(getGreeting());
    const [refreshing, setRefreshing] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [accessPermissions, setAccessPermissions] = useState([]);

    const navigation = useNavigation();
    const isLoading = dashboardLoading || tasksLoading;

    // Check access permissions
    const checkAccessPermission = useCallback(async () => {
        try {
            const accessPermissions = await AsyncStorage.getItem('access_permissions');
            const permissions = JSON.parse(accessPermissions) || [];
            setAccessPermissions(permissions);
        } catch (error) {
            console.error('Error checking access permission:', error);
            setAccessPermissions([]);
        }
    }, []);

    // Token expiration check
    const checkTokenExpiration = useCallback(async () => {
        try {
            const expiredToken = await AsyncStorage.getItem('expiredToken');
            if (expiredToken) {
                const tokenExpiration = new Date(expiredToken);
                const now = new Date();
                if (now > tokenExpiration) {
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
    }, [navigation]);

    // Show alert helper
    const showAlert = useCallback((message, type) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert((prev) => ({ ...prev, show: false })), 3000);
    }, []);

    // Menu and navigation handlers
    const handleMenuPress = useCallback(
        (menuId) => {
            switch (menuId) {
                case 'adhoc':
                    navigation.navigate('AdhocDashboard');
                    break;
                case 'leave':
                    showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Cuti sedang dalam pengembangan.', 'error');
                    break;
                case 'claim':
                    showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Klaim sedang dalam pengembangan.', 'error');
                    break;
            }
        },
        [navigation],
    );

    const handlePress = useCallback(
        (stat) => {
            let requiredPermission;

            switch (stat.description) {
                case 'Projek Dalam Pengerjaan':
                case 'Total Projek Selesai':
                    requiredPermission = accessPermissions.access_project;
                    break;
                case 'Tugas Dalam Pengerjaan':
                case 'Tugas Selesai':
                    requiredPermission = accessPermissions.access_tasks;
                    break;
                default:
                    showAlert('Fitur Belum Tersedia.', 'error');
                    return;
            }

            if (!requiredPermission) {
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
                case 'Tugas Selesai':
                    navigation.navigate('Tugas');
                    break;
            }
        },
        [accessPermissions, navigation, showAlert],
    );

    // Refresh control
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await checkTokenExpiration();
        await Promise.all([refetchTasks(), refetchDashboard(), refetchNotifications()]);
        setRefreshing(false);
    }, [checkTokenExpiration, refetchTasks, refetchDashboard, refetchNotifications]);

    // Effects
    useEffect(() => {
        checkAccessPermission();
        checkTokenExpiration();

        // Update greeting every minute
        const intervalId = setInterval(() => {
            setGreeting(getGreeting());
        }, 60000);

        return () => clearInterval(intervalId);
    }, [checkAccessPermission, checkTokenExpiration]);

    // Prepare data for rendering
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

    // Notification navigation handler
    const handleNotificationPress = useCallback(() => {
        navigation.navigate('NotificationScreen', {
            notifications: notifications,
            onNotificationsUpdate: (updatedNotifications) => {
                setNotifications(updatedNotifications);
                setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
                AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            },
        });
    }, [navigation, notifications, setNotifications, setUnreadCount]);

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
                                <NotificationIcon unreadCount={unreadCount} onPress={handleNotificationPress} />
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
                                        <SkeletonTaskCard key={`skeleton-${index}`} />
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
    // Skeleton styles
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
    shimmerTitle: {
        borderRadius: 4,
    },
    shimmerStatus: {
        top: 0,
        borderRadius: 4,
    },
});

export default Home;
