import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    RefreshControl,
    Platform,
    SafeAreaView,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';

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

const { width } = Dimensions.get('window');

// Enhanced Skeleton components with animations
const SkeletonTaskCard = () => {
    const [pulseAnim] = useState(new Animated.Value(0.4));

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0.4,
                    duration: 1200,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ]),
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View style={[styles.skeletonCard, { opacity: pulseAnim }]}>
            <View style={styles.skeletonHeader}>
                <Shimmer width={180} height={18} style={styles.shimmerTitle} />
                <Shimmer width={40} height={16} style={styles.shimmerBadge} />
            </View>
            {[...Array(3)].map((_, index) => (
                <View style={styles.skeletonTaskSection} key={index}>
                    <View style={styles.skeletonTaskItem}>
                        <View style={styles.skeletonTaskInfo}>
                            <Shimmer width={160} height={16} style={styles.shimmerText} />
                            <Shimmer width={120} height={14} style={styles.shimmerSubtext} />
                        </View>
                        <Shimmer width={60} height={24} style={styles.shimmerStatus} />
                    </View>
                </View>
            ))}
        </Animated.View>
    );
};

// Enhanced Menu button component with animations
const MenuButton = ({ icon, description, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptics error in MenuButton:', error);
        }
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            tension: 150,
            friction: 4,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 150,
            friction: 4,
        }).start();
    };

    const handlePress = () => {
        console.log('MenuButton pressed:', description);
        if (onPress) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={styles.menuButtonContainer}
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View
                style={[
                    styles.menuIconContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                    },
                ]}
            >
                <Feather name={icon} size={24} color="#148FFF" />
            </Animated.View>
            <Text style={styles.menuButtonText}>{description}</Text>
        </TouchableOpacity>
    );
};

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

    // Animation refs
    const scrollY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const statsAnimations = useRef([...Array(4)].map(() => new Animated.Value(0))).current;

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

    // Show alert helper with debug logging
    const showAlert = useCallback((message, type) => {
        console.log('showAlert called:', { message, type });
        setAlert({ show: true, type, message });
        setTimeout(() => {
            console.log('Alert timeout reached, hiding alert');
            setAlert((prev) => ({ ...prev, show: false }));
        }, 3000);
    }, []);

    // Enhanced menu and navigation handlers with haptic feedback
    const handleMenuPress = useCallback(
        (menuId) => {
            console.log('Menu pressed:', menuId); // Debug log
            try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch (error) {
                console.log('Haptics error:', error);
            }

            switch (menuId) {
                case 'adhoc':
                    console.log('Navigating to AdhocDashboard');
                    try {
                        navigation.navigate('AdhocDashboard');
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                        showAlert('Error navigating to Ad Hoc Dashboard', 'error');
                    }
                    break;
                case 'leave':
                    console.log('Showing leave alert');
                    showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Cuti sedang dalam pengembangan.', 'error');
                    break;
                case 'claim':
                    console.log('Showing claim alert');
                    showAlert('Fitur Belum Tersedia. Mohon maaf, fitur Klaim sedang dalam pengembangan.', 'error');
                    break;
                default:
                    console.log('Unknown menu ID:', menuId);
                    showAlert('Menu tidak dikenal', 'error');
            }
        },
        [navigation, showAlert],
    );

    const handlePress = useCallback(
        (stat) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

    // Enhanced refresh control with haptic feedback
    const onRefresh = useCallback(async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setRefreshing(true);
        await checkTokenExpiration();
        await Promise.all([refetchTasks(), refetchDashboard(), refetchNotifications()]);
        setRefreshing(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [checkTokenExpiration, refetchTasks, refetchDashboard, refetchNotifications]);

    // Entrance animations
    useEffect(() => {
        const animateEntrance = () => {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 800,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 800,
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                }),
                Animated.stagger(
                    150,
                    statsAnimations.map((anim) =>
                        Animated.spring(anim, {
                            toValue: 1,
                            tension: 50,
                            friction: 7,
                            useNativeDriver: true,
                        }),
                    ),
                ),
            ]).start();
        };

        if (!isLoading && dashboardData) {
            animateEntrance();
        }
    }, [isLoading, dashboardData, fadeAnim, slideAnim, statsAnimations]);

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

    // Notification navigation handler with haptic feedback
    const handleNotificationPress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        navigation.navigate('NotificationScreen', {
            notifications: notifications,
            onNotificationsUpdate: (updatedNotifications) => {
                setNotifications(updatedNotifications);
                setUnreadCount(updatedNotifications.filter((n) => !n.read).length);
                AsyncStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            },
        });
    }, [navigation, notifications, setNotifications, setUnreadCount]);

    // Header animation based on scroll
    const headerOpacity = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.9],
        extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 0.98],
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    styles.headerWrapper,
                    {
                        opacity: headerOpacity,
                        transform: [{ scale: headerScale }],
                    },
                ]}
            >
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.headerContainer}>
                            <Animated.View
                                style={[
                                    styles.greetingContainer,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ translateY: slideAnim }],
                                    },
                                ]}
                            >
                                <Text style={styles.greetingText}>{greeting}</Text>
                                <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
                                    {employeeData.name}
                                </Text>
                            </Animated.View>
                            <View style={styles.headerRight}>
                                <NotificationIcon unreadCount={unreadCount} onPress={handleNotificationPress} />
                            </View>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </Animated.View>

            <Animated.ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                        progressBackgroundColor="#F8F9FA"
                    />
                }
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: false,
                })}
                scrollEventThrottle={16}
            >
                {/* Statistics Cards */}
                <Animated.View
                    style={[
                        styles.upperGridContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {statistics.map((stat, index) =>
                        isLoading ? (
                            <StatisticSkeleton key={index} color={stat.color} />
                        ) : (
                            <Animated.View
                                key={index}
                                style={{
                                    transform: [{ scale: statsAnimations[index] }],
                                }}
                            >
                                <StatisticCard {...stat} onPress={() => handlePress(stat)} />
                            </Animated.View>
                        ),
                    )}
                </Animated.View>

                {/* Enhanced Menu Section */}
                <Animated.View
                    style={[
                        styles.menuSection,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                    pointerEvents="box-none"
                >
                    <View style={styles.menuContainer} pointerEvents="box-none">
                        <MenuButton
                            icon="users"
                            description="Tugas Ad Hoc"
                            onPress={() => {
                                console.log('Ad Hoc button pressed');
                                handleMenuPress('adhoc');
                            }}
                        />
                        <MenuButton
                            icon="calendar"
                            description="Cuti"
                            onPress={() => {
                                console.log('Cuti button pressed');
                                handleMenuPress('leave');
                            }}
                        />
                        <MenuButton
                            icon="credit-card"
                            description="Klaim"
                            onPress={() => {
                                console.log('Klaim button pressed');
                                handleMenuPress('claim');
                            }}
                        />
                    </View>
                </Animated.View>

                {/* Tasks Section with Enhanced UI */}
                <Animated.View
                    style={[
                        styles.lowerContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Tugas Saya</Text>
                        <TouchableOpacity
                            onPress={() => navigation.navigate('Tugas')}
                            style={styles.sectionLinkContainer}
                        >
                            <Text style={styles.sectionLink}>Lihat Semua</Text>
                            <Feather name="arrow-right" size={16} color="#0E509E" style={styles.sectionLinkIcon} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tasksContainer}>
                        {isLoading ? (
                            <>
                                {[...Array(3)].map((_, index) => (
                                    <SkeletonTaskCard key={`skeleton-${index}`} />
                                ))}
                            </>
                        ) : groupedTasks && Object.keys(groupedTasks).length > 0 ? (
                            <>
                                {Object.keys(groupedTasks)
                                    .slice(0, 3)
                                    .map((projectName, index) => (
                                        <Animated.View
                                            key={index}
                                            style={{
                                                opacity: fadeAnim,
                                                transform: [
                                                    {
                                                        translateY: Animated.add(
                                                            slideAnim,
                                                            new Animated.Value(index * 10),
                                                        ),
                                                    },
                                                ],
                                            }}
                                        >
                                            <TaskCard projectName={projectName} tasks={groupedTasks[projectName]} />
                                        </Animated.View>
                                    ))}
                                {Object.keys(groupedTasks).length > 3 && (
                                    <TouchableOpacity
                                        style={styles.moreInfoContainer}
                                        onPress={() => navigation.navigate('Tugas')}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.moreInfoText}>
                                            {`Lihat ${Object.keys(groupedTasks).length - 3} proyek lainnya`}
                                        </Text>
                                        <Feather
                                            name="arrow-right"
                                            size={16}
                                            color="white"
                                            style={styles.moreInfoIcon}
                                        />
                                    </TouchableOpacity>
                                )}
                            </>
                        ) : (
                            <Animated.View
                                style={[
                                    styles.noTasksBox,
                                    {
                                        opacity: fadeAnim,
                                        transform: [{ scale: fadeAnim }],
                                    },
                                ]}
                            >
                                <Feather name="inbox" size={48} color="#C7C7CC" style={styles.noTasksIcon} />
                                <Text style={styles.noTasksText}>Tidak ada tugas saat ini</Text>
                                <Text style={styles.noTasksSubtext}>
                                    Semua tugas telah selesai atau belum ada tugas baru
                                </Text>
                            </Animated.View>
                        )}
                    </View>
                </Animated.View>
            </Animated.ScrollView>

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
        backgroundColor: '#F8F9FA',
    },
    headerWrapper: {
        width: '100%',
        zIndex: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    headerGradient: {
        paddingBottom: 24,
        borderBottomRightRadius: 32,
        borderBottomLeftRadius: 32,
    },
    safeArea: {
        width: '100%',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: Platform.OS === 'ios' ? 0 : 40,
        paddingBottom: 20,
    },
    greetingContainer: {
        flex: 1,
        marginRight: 16,
    },
    greetingText: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        fontFamily: 'Poppins-Regular',
        marginBottom: 4,
        letterSpacing: 0.3,
    },
    nameText: {
        fontSize: 22,
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        lineHeight: 30,
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 24,
        paddingBottom: 40,
    },
    upperGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 16,
        marginBottom: 24,
        paddingHorizontal: 16,
    },
    menuSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 20,
        paddingVertical: 20,
        paddingHorizontal: 8,
        marginBottom: 24,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        pointerEvents: 'box-none',
    },
    menuContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        pointerEvents: 'box-none',
    },
    menuButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        pointerEvents: 'auto',
    },
    menuIconContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        width: 56,
        height: 56,
        marginBottom: 8,
        elevation: 4,
        shadowColor: '#148FFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(20, 143, 255, 0.1)',
    },
    menuButtonText: {
        fontSize: 13,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        textAlign: 'center',
        lineHeight: 18,
        letterSpacing: 0.2,
    },
    lowerContainer: {
        marginTop: 8,
        paddingHorizontal: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.3,
    },
    sectionLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: 'rgba(14, 80, 158, 0.1)',
    },
    sectionLink: {
        fontSize: 14,
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
        marginRight: 4,
    },
    sectionLinkIcon: {
        marginLeft: 2,
    },
    tasksContainer: {
        minHeight: 120,
        borderRadius: 16,
        backgroundColor: 'transparent',
        gap: 16,
        paddingBottom: 20,
    },
    moreInfoContainer: {
        backgroundColor: '#0E509E',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginTop: 8,
        elevation: 3,
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    moreInfoText: {
        fontSize: 15,
        color: 'white',
        fontFamily: 'Poppins-Medium',
        marginRight: 8,
        letterSpacing: 0.3,
    },
    moreInfoIcon: {
        marginLeft: 4,
    },
    noTasksBox: {
        backgroundColor: 'white',
        paddingVertical: 40,
        paddingHorizontal: 24,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(199, 199, 204, 0.3)',
    },
    noTasksIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    noTasksText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    noTasksSubtext: {
        fontSize: 14,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        lineHeight: 20,
        letterSpacing: 0.1,
    },
    // Enhanced Skeleton styles
    skeletonCard: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    skeletonHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    skeletonTaskSection: {
        marginBottom: 12,
        paddingVertical: 8,
    },
    skeletonTaskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    skeletonTaskInfo: {
        flex: 1,
        marginRight: 12,
    },
    shimmerTitle: {
        borderRadius: 6,
        marginBottom: 4,
    },
    shimmerText: {
        borderRadius: 4,
        marginBottom: 6,
    },
    shimmerSubtext: {
        borderRadius: 4,
        marginBottom: 4,
    },
    shimmerStatus: {
        borderRadius: 12,
    },
    shimmerBadge: {
        borderRadius: 8,
    },
});

export default Home;
