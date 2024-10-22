import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import { getHomeData } from '../api/general';
const { width } = Dimensions.get('window');
const cardWidth = (width - 60) / 2;
import { fetchTaskById, fetchTotalTasksForEmployee } from '../api/task'; // Import the fetchTaskById function
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { isAxiosError } from 'axios';

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
            <View style={[styles.skeletonText, { width: '75%', height: 30 }]} />
            {[...Array(3)].map((_, index) => (
                <View style={styles.taskSection} key={index}>
                    <View style={[styles.taskItem]}>
                        <View style={styles.taskInfo}>
                            <View style={[styles.skeletonText, { width: '70%', height: 20, marginBottom: 5 }]} />
                            <View style={[styles.skeletonText, { width: '40%', height: 20 }]} />
                        </View>
                        <View style={[styles.skeletonText, { width: 50, height: 20 }]} />
                    </View>
                    <View style={[styles.skeletonText, { width: '50%', height: 20, marginTop: 5 }]} />
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
            <View style={[styles.skeletonText, { width: 60, height: 25, marginRight: 5 }]} />
            <View style={[styles.skeletonText, { width: 50, height: 20 }]} />
        </View>
        <View style={[styles.skeletonText, { marginLeft: 5, width: 50, height: 55 }]} />
    </View>
);

const StatisticCard = ({ value, description, color, icon }) => (
    <View style={[styles.statisticCard, { borderColor: color }]}>
        <View style={styles.textContainer}>
            <Text style={styles.valueText}>{value}</Text>
            <Text style={styles.descriptionText}>{description}</Text>
        </View>
        <Feather name={icon} size={30} color={color} style={styles.icon} />
    </View>
);

const MenuButton = ({ icon, description }) => (
    <View style={styles.menuButtonContainer}>
        <View style={styles.statCard}>
            <Feather name={icon} size={24} color="#148FFF" />
        </View>
        <Text style={styles.menuButtonText}>{description}</Text>
    </View>
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

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        setIsLoading(true);
        await checkTokenExpiration();
        await Promise.all([fetchTasks(), fetchHomeData()]);
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

    const ButtonList = [
        { id: 1, icon: 'users', description: 'Tugas Ad Hoc' },
        { id: 2, icon: 'credit-card', description: 'Cuti' },
        { id: 3, icon: 'check-circle', description: 'Klaim' },
    ];

    const MenuButton = ({ icon, description, onPress }) => (
        <TouchableOpacity style={styles.menuButtonContainer} onPress={onPress}>
            <View style={styles.statCard}>
                <Feather name={icon} size={24} color="#148FFF" />
            </View>
            <Text style={styles.menuButtonText}>{description}</Text>
        </TouchableOpacity>
    );
    const handleButtonPress = (buttonId) => {
        switch (buttonId) {
            case 1:
                navigation.navigate('AdhocDashboard');
                break;
            case 2:
                // Navigasi untuk Cuti
                break;
            case 3:
                // Navigasi untuk Klaim
                break;
            default:
                break;
        }
    };
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
                  description: 'Total Dalam Pengerjaan',
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

    return (
        <View style={styles.container}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <Text style={styles.header}>
                {greeting}, {employeeData.name}
            </Text>

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
                            <StatisticCard key={index} {...stat} />
                        ),
                    )}
                </View>
                <View style={styles.midContainer}>
                    <View style={styles.buttonGridContainer}>
                        {ButtonList.map((button) => (
                            <MenuButton
                                key={button.id}
                                icon={button.icon}
                                description={button.description}
                                onPress={() => handleButtonPress(button.id)}
                            />
                        ))}
                    </View>
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
    locationContainer: {
        flexDirection: 'row', // Align items horizontally
        alignItems: 'center', // Center items vertically
        padding: 10,
    },
    backgroundBox: {
        height: 125,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 30,
    },
    header: {
        fontSize: 24,
        color: 'white',
        paddingVertical: 20,
        paddingHorizontal: 40,
        marginTop: 50,
        fontFamily: 'Poppins-Regular',
        letterSpacing: -1,
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
    menuButtonContainer: {
        width: '30%',
        alignItems: 'center',
        marginBottom: 20,
    },
    statCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        width: 60,
        height: 60,
    },
    menuButtonText: {
        textAlign: 'center',
        marginTop: 5,
        fontWeight: '600',
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
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
    },
    taskSection: {
        marginBottom: 12,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9EB',
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    taskInfo: {
        flex: 1,
        marginRight: 10,
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
    skeletonText: {
        backgroundColor: '#e0e0e0',
        borderRadius: 4,
    },
});

export default Home;
