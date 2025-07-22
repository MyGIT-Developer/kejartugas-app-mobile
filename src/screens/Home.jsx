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
import TaskCard from '../components/TaskCardByProject';
import { NotificationIcon, NotificationIconSkeleton } from '../components/NotificationIcon';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import Shimmer from '../components/Shimmer';

// Utils
import { groupTasksByProject, getGreeting } from '../utils/taskUtils';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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

const MenuButton = ({ icon, description, onPress }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            console.log('Haptics error:', error);
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

    const dynamicShadow = {
        shadowOpacity: scaleAnim.interpolate({
            inputRange: [0.95, 1],
            outputRange: [0.25, 0.15],
        }),
        elevation: scaleAnim.interpolate({
            inputRange: [0.95, 1],
            outputRange: [6, 4],
        }),
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Menu ${description}`}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Animated.View style={[styles.menuButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
                <AnimatedLinearGradient
                    colors={['#E0F0FF', '#FFFFFF']}
                    style={[styles.menuIconContainer, dynamicShadow]}
                >
                    <Feather name={icon} size={24} color="#148FFF" />
                </AnimatedLinearGradient>
                <Text style={styles.menuButtonText}>{description}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};


const HEADER_HEIGHT = 325;
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
    // const isLoading = true;

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
                case 'project':
                    console.log('Navigating to Project Dashboard');
                    try {
                        navigation.navigate('ProjectDashboard');
                    } catch (navError) {
                        console.error('Navigation error:', navError);
                        showAlert('Error navigating to Project Dashboard', 'error');
                    }
                    break;
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
                description: 'Dalam Pengerjaan',
                value: `${dashboardData.total_projects_working_on_it} Projek`,
                color: '#FAA1A7',
                icon: 'monitor',
            },
            {
                description: 'Selesai',
                value: `${dashboardData.total_projects_complete} Projek`,
                color: '#3E84CF',
                icon: 'check-circle',
            },
            {
                description: 'Dalam Pengerjaan',
                value: `${dashboardData.total_tasks_working_on_it} Tugas`,
                color: '#DD9968',
                icon: 'rotate-cw',
            },
            {
                description: 'Selesai',
                value: `${dashboardData.total_tasks_completed} Tugas`,
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
        outputRange: [1, 1],
        extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [1, 1],
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
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
                    style={styles.headerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />

                {/* Header decorative elements */}
                <View style={styles.headerDecorations}>
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                    <View style={styles.decorativeCircle3} />
                    <View style={styles.decorativeCircle4} />
                    <View style={styles.decorativeCircle5} />
                </View>
            </Animated.View>

            <Animated.ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                    useNativeDriver: true,
                })}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#4A90E2']}
                        tintColor="#4A90E2"
                        progressBackgroundColor="#ffffff"
                    />
                }
            >
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
                        <Text style={styles.greetingText}>{greeting},</Text>
                        <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">
                            {employeeData.name}
                        </Text>
                    </Animated.View>
                    <View style={styles.headerRight}>
                        {isLoading ? (
                            <>
                                <NotificationIconSkeleton />
                            </>
                        ) : (
                            <>
                                <NotificationIcon unreadCount={unreadCount} onPress={handleNotificationPress} />
                            </>
                        )}
                        <TouchableOpacity
                            style={{
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                            onPress={() => navigation.navigate('Profile')}
                            activeOpacity={0.8}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: '#fff',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    shadowColor: '#444',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.08,
                                    shadowRadius: 4,
                                    elevation: 2,
                                }}
                            >
                                <Feather name="user" size={24} color="#0E509E" />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
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
                    <Text
                        style={{
                            fontSize: 14,
                            color: '#1C1C1E',
                            fontFamily: 'Poppins-SemiBold',
                            marginBottom: 12,
                            marginLeft: 4,
                        }}
                    >
                        Menu Lainnya
                    </Text>
                    <View style={styles.menuContainer} pointerEvents="box-none">
                        <MenuButton
                            icon="folder"
                            description="Project"
                            onPress={() => {
                                console.log('Project button pressed');
                                handleMenuPress('project');
                            }}
                        />
                        <MenuButton
                            icon="users"
                            description="Adhoc"
                            onPress={() => {
                                console.log('Adhoc button pressed');
                                handleMenuPress('adhoc');
                            }}
                        />
                        {/* <MenuButton
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
                        /> */}
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
        backgroundColor: '#F8FAFC',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
    },
    headerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: HEADER_HEIGHT,
        overflow: 'hidden',
    },
    headerGradient: {
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
        right: -50,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 100,
        right: 30,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        left: -10,
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
        letterSpacing: 0.3,
    },
    nameText: {
        fontSize: 22,
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        textTransform: 'capitalize',
        letterSpacing: -0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    upperGridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
        width: '100%',
    },
    menuSection: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        borderRadius: 10,
        padding: 12,
        marginBottom: 24,
        elevation: 3,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        pointerEvents: 'box-none',
    },
    menuContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-around',
        alignItems: 'center',
        rowGap: 12,
        columnGap: 16,
    },
    menuButtonContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        pointerEvents: 'auto',
    },
    menuIconContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        marginBottom: 4,
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
        letterSpacing: -0.5,
    },
    lowerContainer: {
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
        fontSize: 14,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
    },
    sectionLinkContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(14, 80, 158, 0.1)',
        gap: 4,
    },
    sectionLink: {
        fontSize: 12,
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
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
        shadowColor: '#444',
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
        shadowColor: '#444',
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
