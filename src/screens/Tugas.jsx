import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Shimmer from '../components/Shimmer';
import DetailProyekModal from '../components/DetailProjectModal';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { MaterialIcons } from '@expo/vector-icons';
import ReusableAlert from '../components/ReusableAlert';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTotalTasksForEmployee } from '../api/task';

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const calculateRemainingDays = (endDate, status) => {
    if (status === 'Completed') {
        21111;
        return 0;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const timeDiff = end.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
};
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
const getStatusBadgeColor = (status, endDate) => {
    if (status === 'Completed') {
        return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
    }

    const remainingDays = calculateRemainingDays(endDate, status);

    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    }

    switch (status) {
        case 'workingOnIt':
            return { color: '#aeaeae', label: 'Dalam Pengerjaan', textColor: '#000000' };
        case 'onReview':
            return { color: '#f6e092', label: 'Dalam Peninjauan', textColor: '#ee9000' };
        case 'rejected':
            return { color: '#F69292', label: 'Ditolak', textColor: '#811616' };
        case 'onHold':
            return { color: '#F69292', label: 'Ditunda', textColor: '#811616' };
        case 'Completed':
            return { color: '#C9F8C1', label: 'Selesai', textColor: '#0A642E' };
        case 'onPending':
            return { color: '#F0E08A', label: 'Tersedia', textColor: '#656218' };
        default:
            return { color: '#E0E0E0', label: status, textColor: '#000000' };
    }
};

const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#A7C8E5', textColor: '#092D58', label: 'Tepat Waktu' };
        case 'earlyFinish':
            return { color: '#9ADFAD', textColor: '#0A642E', label: 'Selesai Lebih Awal' };
        case 'finish in delay':
            return { color: '#F0E089', textColor: '#80490A', label: 'Selesai Terlambat' };
        case 'overdue':
            return { color: '#F69292', textColor: '#811616', label: 'Terlambat' };
        default:
            return { color: '#E0E0E0', textColor: '#000000', label: status || 'Belum Dikumpulkan' };
    }
};

const TaskCard = React.memo(({ task = {}, onProjectDetailPress = () => {}, onTaskDetailPress = () => {} }) => {
    const {
        color: badgeColor,
        textColor: badgeTextColor,
        label: displayStatus,
    } = getStatusBadgeColor(task.task_status, task.end_date);

    const renderStatusOrDays = () => {
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
            <View style={styles.taskContent}>
                <Text style={styles.taskTitle} numberOfLines={2} ellipsizeMode="tail">
                    {task.task_name}
                </Text>
                <Text style={styles.taskSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    {task.project_name}
                </Text>
            </View>
            {renderStatusOrDays()}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.detailButton} onPress={() => onTaskDetailPress(task)}>
                    <Text style={styles.detailButtonText}>Lihat detail {'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.projectButton} onPress={() => onProjectDetailPress(task)}>
                    <Text style={styles.projectButtonText}>Detail Proyek</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const ShimmerTaskCard = () => (
    <View style={styles.taskCard}>
        <View style={styles.taskContent}>
            <Shimmer width={200} height={20} style={styles.shimmerTitle} />
            <Shimmer width={175} height={20} style={styles.shimmerTitle} />
        </View>
        <Shimmer width={150} height={20} style={[styles.shimmerTitle, {marginBottom:45}]} />
      
        <View style={styles.buttonContainer}>
            <Shimmer width={120} height={25} style={styles.shimmerButton} />
            <Shimmer width={100} height={30} style={styles.shimmerButton} />
        </View>
    </View>
);

const TaskSection = ({
    title,
    tasks = [],
    isLoading = false,
    onProjectDetailPress,
    onTaskDetailPress,
    onSeeAllPress,
}) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {tasks.length > 1 && !isLoading && (
                <TouchableOpacity onPress={onSeeAllPress}>
                    <Text style={styles.seeAllText}>Lihat semua</Text>
                </TouchableOpacity>
            )}
        </View>
        {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array(3)
                    .fill()
                    .map((_, index) => (
                        <ShimmerTaskCard key={index} />
                    ))}
            </ScrollView>
        ) : tasks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tasks.map((task, index) => (
                    <TaskCard
                        key={index}
                        task={task}
                        onProjectDetailPress={onProjectDetailPress}
                        onTaskDetailPress={onTaskDetailPress}
                    />
                ))}
            </ScrollView>
        ) : (
            <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>Tidak ada tugas</Text>
            </View>
        )}
    </View>
);

const Tugas = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [tasks, setTasks] = useState({
        inProgress: [],
        inReview: [],
        rejected: [],
        postponed: [],
        completed: [],
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [error, setError] = useState(null);
    const [projects, setProjects] = useState([]);
    const [modalType, setModalType] = useState('default');
    const [showAlert, setShowAlert] = useState(false);
    const [hasAccess, setHasAccess] = useState(null);

    const navigation = useNavigation();

    const fontsLoaded = useFonts();

    useEffect(() => {
        checkAccessPermission();
    }, []);
    const checkAccessPermission = async () => {
        try {
            const accessPermissions = await AsyncStorage.getItem('access_permissions');
            const permissions = JSON.parse(accessPermissions);
            setHasAccess(permissions?.access_tasks === true);
        } catch (error) {
            console.error('Error checking access permission:', error);
            setHasAccess(false);
        }
    };
    useEffect(() => {
        if (hasAccess) {
            fetchTasks();
        }
    }, [hasAccess]);
    const fetchTasks = async () => {
        setRefreshing(true);
        setIsLoading(true);
        setError(null);
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            if (!employeeId) {
                throw new Error('ID Karyawan tidak ditemukan');
            }

            const data = await fetchTotalTasksForEmployee(employeeId);

            const sortedTasks = data.employeeTasks.sort((a, b) => {
                return new Date(b.start_date) - new Date(a.start_date);
            });

            const tasksByStatus = {
                inProgress: sortedTasks.filter((task) => task.task_status === 'workingOnIt'),
                inReview: sortedTasks.filter((task) => task.task_status === 'onReview'),
                rejected: sortedTasks.filter((task) => task.task_status === 'rejected'),
                postponed: sortedTasks.filter((task) => task.task_status === 'onHold'),
                completed: sortedTasks.filter((task) => task.task_status === 'Completed'),
            };
            setTasks(tasksByStatus);

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

            for (const status in tasksByStatus) {
                tasksByStatus[status].forEach(async (task) => {
                    if (task.id) {
                        await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id));
                    }
                });
            }
        } catch (error) {
            setError('Gagal mengambil tugas. Silakan coba lagi nanti.');
            setShowAlert(true);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleSeeAllPress = (sectionTitle, tasks) => {
        const baseUrl = 'http://202.10.36.103:8000/';
        navigation.navigate('DetailTaskSection', {
            sectionTitle,
            tasks: tasks.map((task) => ({
                title: task.task_name,
                subtitle: task.project_name,
                task_status: task.task_status, // Ensure this matches your data structure
                id: task.id,
                task_desc: task.task_desc, // Ensure this matches your data structure
                start_date: task.start_date,
                end_date: task.end_date,
                assignedBy: task.assign_by_name,
                project_desc: task.project_desc, // Ensure this matches your data structure
                project_start_date: task.project_start_date,
                project_end_date: task.project_end_date,
                percentage_task: task.percentage_task || 0, // Ensure this matches your data structure
                statusColor: getStatusBadgeColor(task.task_status, task.end_date).color,
                collectionDate: task.task_submit_date || 'N/A',
                collectionStatus: task.task_submit_status || 'N/A',
                collectionStatusColor: getCollectionStatusBadgeColor(task.task_submit_status || 'N/A').color,
                collectionStatusTextColor: getCollectionStatusBadgeColor(task.task_submit_status || 'N/A').textColor,
                collectionDescription: task.task_desc || 'N/A',
                task_image: task.task_image ? `${baseUrl}${task.task_image}` : null,
            })),
        });
    };

    const handleProjectDetailPress = (task) => {
        const projectDetails = {
            assign_by_name: task.assign_by_name,
            start_date: task.project_start_date,
            end_date: task.project_end_date,
            description: task.project_desc,
        };

        setSelectedProject(projectDetails);
        setModalVisible(true);
    };

    const handleTaskDetailPress = (task) => {
        const baseUrl = 'http://202.10.36.103:8000/';
        const collectionStatus = getCollectionStatusBadgeColor(task.task_submit_status || 'N/A');
        const taskDetails = {
            id: task.id,
            title: task.task_name,
            subtitle: task.project_name,
            startDate: task.start_date,
            endDate: task.end_date,
            assignedById: task.assign_by ? task.assign_by : 'N/A', // Accessing nested object
            assignedByName: task.assign_by_name ? task.assign_by_name : 'N/A', // Accessing nested object
            description: task.task_desc,
            progress: task.percentage_task || 0,
            status: task.task_status,
            project_desc: task.project_desc, // Ensure this matches your data structure
            project_start_date: task.project_start_date,
            project_end_date: task.project_end_date,
            statusColor: getStatusBadgeColor(task.task_status, task.end_date).color,
            collectionDate: task.task_submit_date || 'N/A',
            collectionStatus: collectionStatus.label,
            collectionStatusColor: collectionStatus.color,
            collectionStatusTextColor: collectionStatus.textColor,
            collectionDescription: task.task_desc || 'N/A',
            task_image: task.task_image ? `${baseUrl}${task.task_image}` : null,
            assignedEmployees:
                task.assignedEmployees.map((emp) => ({
                    employeeId: emp.id,
                    employeeName: emp.employee_name,
                })) || [],
        };

        setSelectedTask(taskDetails);

        if (task.task_status === 'Completed') {
            setModalType('success');
        } else {
            setModalType('default');
        }

        setDraggableModalVisible(true);
    };

    if (!fontsLoaded) {
        return null;
    }
    if (hasAccess === null) {
        return (
            <View style={styles.container}>
                <Text>Loading...</Text>
            </View>
        );
    }

    if (hasAccess === false) {
        return <AccessDenied />;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchTasks} />}
            >
                <LinearGradient
                    colors={GRADIENT_COLORS}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.headerTitle}>Tugas Saya</Text>
                </LinearGradient>

                <View style={styles.content}>
                    <TaskSection
                        title="Dalam Pengerjaan"
                        tasks={tasks.inProgress}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                        onSeeAllPress={() => handleSeeAllPress('Dalam Pengerjaan', tasks.inProgress)}
                    />
                    <TaskSection
                        title="Dalam Peninjauan"
                        tasks={tasks.inReview}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                        onSeeAllPress={() => handleSeeAllPress('Dalam Peninjauan', tasks.inReview)}
                    />
                    <TaskSection
                        title="Ditolak"
                        tasks={tasks.rejected}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                        onSeeAllPress={() => handleSeeAllPress('Ditolak', tasks.rejected)}
                    />
                    <TaskSection
                        title="Ditunda"
                        tasks={tasks.postponed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                        onSeeAllPress={() => handleSeeAllPress('Ditunda', tasks.postponed)}
                    />
                    <TaskSection
                        title="Selesai"
                        tasks={tasks.completed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                        onSeeAllPress={() => handleSeeAllPress('Selesai', tasks.completed)}
                    />
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {modalType === 'default' ? (
                <DraggableModalTask
                    visible={draggableModalVisible}
                    onClose={() => {
                        setDraggableModalVisible(false);
                        setSelectedTask(null);
                    }}
                    taskDetails={selectedTask || {}}
                />
            ) : (
                <ReusableModalSuccess
                    visible={draggableModalVisible}
                    onClose={() => setDraggableModalVisible(false)}
                    taskDetails={selectedTask || {}}
                />
            )}

            <DetailProyekModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                projectDetails={selectedProject || {}}
            />

            <ReusableAlert show={showAlert} alertType="error" message={error} onConfirm={() => setShowAlert(false)} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    header: {
        height: 125,
        paddingTop: 40,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: 'white',
        marginBottom: 10,
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
    },
    content: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Medium',
    },
    seeAllText: {
        color: '#0E509E',
        fontFamily: 'Poppins-Regular',
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 19,
        padding: 15,
        marginRight: 15,
        width: 312,
        height: 180,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 16,
        color: '#000',
        marginBottom: 5,
        lineHeight: 22,
        fontFamily: 'Poppins-Bold',
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontFamily: 'Poppins-Regular',
    },
    statusBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        position: 'absolute',
        bottom: 50,
        left: 10,
    },
    statusText: {
        color: '#333',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        position: 'absolute',
        bottom: 50,
        left: 10,
    },
    badgeText: {
        color: '#333',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 15,
        left: 15,
        right: 15,
    },
    detailButton: {
        // Styles remain the same
    },
    detailButtonText: {
        color: '#444444',
        marginTop: 20,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    projectButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    projectButtonText: {
        color: 'white',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    section: {
        marginBottom: 20,
    },
    noTasksContainer: {
        height: 100, // Adjust this value to match the height of your task cards
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTasksText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
    },
    shimmerTitle: {
        marginBottom: 10,
    },
    shimmerSubtitle: {
        marginBottom: 0,
    },
    shimmerStatus: {
        position: 'absolute',
        top: 20,
        right: 20,
        borderRadius: 20,
    },
    shimmerButton: {
        
    },
    bottomSpacer: {
        height: 100,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        marginVertical: 5,
    },
    remainingDays: {
        position: 'absolute',
        bottom: 50,
        left: 10,
    },
    remainingDaysText: {
        color: '#0E509E',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    //accessDenied
    accessDeniedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F0F0F0',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 40,
        color: 'white',
        fontFamily: 'Poppins-Bold',
    },
    message: {
        fontSize: 16,
        textAlign: 'center',
        fontFamily: 'Poppins-Regular',
        color: '#666',
    },
    //accessDenied
});

export default Tugas;
