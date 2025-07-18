import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTask } from '../api/projectTask';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { Feather, Ionicons } from '@expo/vector-icons';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { fetchTaskById } from '../api/task'; // Import the fetchTaskById function

const calculateRemainingDays = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 3600 * 24));
};

const getDurationBadge = (remainingDays) => {
    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FFE9CB', textColor: '#E07706', label: `Tersisa ${remainingDays} hari` };
    }
};

const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#A7C8E5', textColor: '#092D58', label: 'Selesai' };
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

const getStatusBadgeColor = (status, endDate) => {
    if (status === 'Completed') {
        return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
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
            return { color: '#9AE1EA', textColor: '#333333', label: 'Dalam Peninjauan' };
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

const TaskItem = ({ task, onPress }) => {
    const remainingDays = useMemo(() => calculateRemainingDays(task.end_date), [task.end_date]);
    const durationBadge = useMemo(() => getDurationBadge(remainingDays), [remainingDays]);

    return (
        <View style={styles.taskItem}>
            <View style={styles.taskContent}>
                <View style={styles.upperTaskContent}>
                    <Text style={styles.taskTitle}>{task.task_name}</Text>
                    <TouchableOpacity style={styles.detailButton} onPress={onPress}>
                        <Text style={styles.detailText}>Detail</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: durationBadge.color }]}>
                        <Text style={[styles.badgeText, { color: durationBadge.textColor }]}>
                            {durationBadge.label}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

const ProjectTasksGroup = ({ projectName, tasks, onTaskPress }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const projectDetails = tasks.length > 0 ? tasks[0] : null;

    // Calculate project duration
    const calculateDuration = (start_date, end_date) => {
        const start = new Date(start_date);
        const end = new Date(end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        const days = diffDays % 30;

        let duration = '';
        if (years > 0) duration += `${years} Tahun `;
        if (months > 0) duration += `${months} Bulan `;
        if (days > 0) duration += `${days} Hari`;
        return duration.trim();
    };

    return (
        <View style={styles.projectGroup}>
            <Text style={styles.projectTitle}>{projectName}</Text>
            {tasks.map((task) => (
                <TaskItem key={task.id} task={task} onPress={() => onTaskPress(task)} />
            ))}
            <TouchableOpacity style={styles.projectDetailButton} onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.projectDetailButtonText}>
                    {isExpanded ? 'Sembunyikan detail proyek' : 'Lihat detail proyek'}
                </Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#1f1f1f"
                    style={styles.chevronIcon}
                />
            </TouchableOpacity>
            {isExpanded && projectDetails && (
                <View style={styles.projectDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.leftColumn}>
                            <Text style={styles.detailLabel}>Ditugaskan Oleh:</Text>
                            <Text style={styles.detailValue}>{projectDetails.assignedBy}</Text>
                            <Text style={styles.detailLabel}>Durasi Proyek:</Text>
                            <Text style={styles.detailValue}>
                                {calculateDuration(projectDetails.start_date, projectDetails.end_date)}
                            </Text>
                        </View>
                        <View style={styles.rightColumn}>
                            <Text style={styles.detailLabel}>Keterangan Proyek:</Text>
                            <Text style={styles.detailValue}>
                                {projectDetails.description || 'Tidak ada Keterangan'}
                            </Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const TaskOnReview = () => {
    const [taskData, setTaskData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const [modalType, setModalType] = useState('default'); // Initialize modalType state
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const companyId = await AsyncStorage.getItem('companyId');
            if (companyId) {
                const response = await getTask(companyId);
                setTaskData(response);
            } else {
                throw new Error('Company ID not found');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const filteredAndGroupedTasks = useMemo(() => {
        const filteredTasks = taskData.filter((task) => task.task_status === 'onReview');

        return filteredTasks.reduce((grouped, task) => {
            const key = task.project_name || task.project_id || 'Ungrouped';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(task);
            return grouped;
        }, {});
    }, [taskData]);

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text>Error: {error}</Text>
            </View>
        );
    }

    const projectsWithTasks = Object.entries(filteredAndGroupedTasks);

    if (projectsWithTasks.length === 0) {
        return (
            <View style={styles.centered}>
                <Text>No projects with tasks in progress or rejected.</Text>
            </View>
        );
    }

    const handleTaskDetailPress = async (task) => {
        const baseUrl = 'https://app.kejartugas.com/';
        try {
            const response = await fetchTaskById(task.id); // Fetch task details by ID
            const taskDetails = response.data; // Access the data field from the response
            const collectionStatus = getCollectionStatusBadgeColor(taskDetails.task_submit_status || 'N/A');
            // Transform the task details to match the structure expected by DraggableModalTask
            const transformedTaskDetails = {
                id: taskDetails.id,
                title: taskDetails.task_name,
                startDate: taskDetails.start_date,
                endDate: taskDetails.end_date,
                assignedById: taskDetails.assign_by ? taskDetails.assign_by.id : 'N/A', // Accessing nested object
                assignedByName: taskDetails.assign_by ? taskDetails.assign_by.name : 'N/A', // Accessing nested object
                description: taskDetails.task_desc || 'N/A',
                progress: taskDetails.percentage_task || 0,
                status: taskDetails.task_status,
                statusColor: getStatusBadgeColor(taskDetails.task_status, taskDetails.end_date).color,
                collectionDate: task.task_submit_date || 'N/A',
                collectionStatus: collectionStatus.label,
                collectionStatusColor: collectionStatus.color,
                collectionStatusTextColor: collectionStatus.textColor,
                collectionDescription: taskDetails.task_desc || 'N/A',
                task_image: taskDetails.task_image ? `${baseUrl}${taskDetails.task_image}` : null,

                // Additional fields based on your previous structure
                baselineWeight: taskDetails.baseline_weight || '0',
                actualWeight: taskDetails.actual_weight || '0',
                durationTask: taskDetails.duration_task || 0,
                assignedEmployees:
                    taskDetails.assignedEmployees.map((emp) => ({
                        employeeId: emp.employee_id,
                        employeeName: emp.employee_name,
                    })) || [],
                taskProgress:
                    taskDetails.taskProgress.map((progress) => ({
                        tasksId: progress.tasks_id,
                        updateDate: progress.update_date,
                        percentage: progress.percentage,
                    })) || [],
            };

            setSelectedTask(transformedTaskDetails);

            // Optionally check task status for modal type
            if (taskDetails.task_status === 'Completed') {
                setModalType('default');
            } else {
                setModalType('default');
            }

            setDraggableModalVisible(true);
        } catch (error) {
            console.error('Error fetching task details:', error);
            // Optionally, show an alert or a message to the user
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.mainContainer}>
                <View style={styles.backgroundBox}>
                    <LinearGradient
                        colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                        style={styles.linearGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    />
                </View>
                <View style={styles.headerSection}>
                    <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                    <Text style={styles.header}>Dalam Peninjauan</Text>
                </View>

                <FlatList
                    data={projectsWithTasks}
                    contentContainerStyle={styles.contentContainer}
                    keyExtractor={([projectName]) => projectName}
                    renderItem={({ item: [projectName, tasks] }) => (
                        <ProjectTasksGroup
                            projectName={projectName}
                            tasks={tasks}
                            onTaskPress={handleTaskDetailPress}
                        />
                    )}
                />

                {modalType === 'default' ? (
                    <DraggableModalTask
                        visible={draggableModalVisible}
                        onClose={() => {
                            setDraggableModalVisible(false);
                            setSelectedTask(null); // Optional: Reset selectedTask on close
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
            </ScrollView>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: {
        minHeight: height, // Ensure the content is at least as tall as the screen
        flexGrow: 1,
    },
    backgroundBox: {
        height: 120,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
        marginTop: 30,
        letterSpacing: -1,
    },
    backIcon: {
        position: 'absolute',
        top: 35,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    contentContainer: {
        marginTop: 10,
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 20,
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    mainContainer: {
        // height: '200vh',
        borderRadius: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    sectionContainer: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    subHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subHeaderTextLeft: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    subHeaderTextRight: {
        fontSize: 14,
        color: 'gray',
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectGroup: {
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
    },
    taskItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderBottomColor: '#E9E9EB',
        borderBottomWidth: 1,
        padding: 12,
    },
    taskContent: {
        flex: 1,
    },
    upperTaskContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'semibold',
        color: '#333333',
        flex: 1,
    },
    detailButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E9E9EB',
        borderRadius: 6,
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    detailButtonText: {
        fontSize: 14,
        color: '#1f1f1f',
        fontFamily: 'Poppins-Regular',
    },
    badgeContainer: {
        flexDirection: 'row',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 4,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    projectDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    projectDetailButtonText: {
        fontSize: 14,
        color: '#1f1f1f',
        marginRight: 5,
        fontFamily: 'Poppins-Regular',
    },
    chevronIcon: {
        marginTop: 2,
    },
    projectDetails: {
        marginTop: 10,
        padding: 10,
        backgroundColor: 'transparent',
        borderRadius: 5,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
        marginRight: 10,
    },
    rightColumn: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
        fontFamily: 'Poppins-Medium',
        fontWeight: 'bold',
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontFamily: 'Poppins-Regular',
    },
});

export default TaskOnReview;
