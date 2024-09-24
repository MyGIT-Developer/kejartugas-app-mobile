import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    RefreshControl,
    Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Shimmer from '../components/Shimmer';
import DetailProyekModal from '../components/ReusableBottomModal';
import DraggableModalTask from '../components/DraggableModalTask';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchTotalTasksForEmployee } from '../api/task';

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#9AE1EA', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#F69292', label: 'Ditolak' };
        case 'onHold':
            return { color: '#F69292', label: 'Ditunda' };
        case 'Completed':
            return { color: '#C9F8C1', label: 'Selesai' };
        case 'onPending':
            return { color: '#F0E08A', label: 'Tersedia' };
        default:
            return { color: '#E0E0E0', label: status }; // Warna default
    }
};

const TaskCard = React.memo(({ task = {}, onProjectDetailPress, onTaskDetailPress }) => {
    const { color: badgeColor, label: displayStatus } = getStatusBadgeColor(task.task_status);

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
            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">
                    {displayStatus}
                </Text>
            </View>
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
        <Shimmer width={200} height={20} style={styles.shimmerTitle} />
        <Shimmer width={150} height={15} style={styles.shimmerSubtitle} />
        <Shimmer width={100} height={25} style={styles.shimmerStatus} />
        <Shimmer width={100} height={15} style={styles.shimmerButton} />
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

    const navigation = useNavigation();

    const fontsLoaded = useFonts();

    const handleSeeAllPress = (sectionTitle, tasks) => {
        navigation.navigate('DetailTaskSection', {
            sectionTitle,
            tasks: tasks.map((task) => ({
                title: task.task_name,
                subtitle: task.project_name,
                status: task.task_status,
                // Add any other relevant task details here
                id: task.id,
                description: task.task_desc,
                startDate: task.start_date,
                endDate: task.end_date,
                assignedBy: task.assign_by_name,
                progress: task.percentage_task || 0,
            })),
        });
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setRefreshing(true);
        setIsLoading(true);
        setError(null);
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            console.log('Employee ID:', employeeId); // Log the employeeId
            if (!employeeId) {
                throw new Error('Employee ID not found');
            }

            const data = await fetchTotalTasksForEmployee(employeeId);

            const tasksByStatus = {
                inProgress: data.employeeTasks.filter((task) => task.task_status === 'workingOnIt'),
                inReview: data.employeeTasks.filter((task) => task.task_status === 'onReview'),
                rejected: data.employeeTasks.filter((task) => task.task_status === 'rejected'),
                postponed: data.employeeTasks.filter((task) => task.task_status === 'onHold'),
                completed: data.employeeTasks.filter((task) => task.task_status === 'Completed'),
            };

            setTasks(tasksByStatus);

            // Store TaskIds to AsyncStorage and add console log
            for (const status in tasksByStatus) {
                tasksByStatus[status].forEach(async (task) => {
                    console.log(`Task object for status ${status}:`, task); // Log the entire task object

                    // Use the correct field (id) to store Task IDs
                    if (task.id) {
                        // console.log(`Storing Task ID: ${task.id} for status: ${status}`);
                        await AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id));
                        // console.log(`Task ID ${task.id} stored in AsyncStorage`);
                    } else {
                        // console.log(`Task ID not found for task:`, task);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            if (error.response && error.response.status === 404) {
                setError('Tasks not found. Please check the employee ID or the API endpoint.');
            } else {
                setError('Failed to fetch tasks. Please try again later.');
            }
            Alert.alert('Error', error.message);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const handleProjectDetailPress = (task) => {
        const projectDetails = {
            assign_by_name: task.assign_by_name, // Make sure the property names match your task structure
            start_date: task.project_start_date,
            end_date: task.project_end_date,
            description: task.project_desc, // Add description if needed
        };

        setSelectedProject(projectDetails);
        setModalVisible(true);
    };

    const handleTaskDetailPress = (task) => {
        // Assuming `task` is from `employeeTasks`
        const taskDetails = {
            title: task.task_name,
            startDate: task.start_date,
            endDate: task.end_date,
            assignedBy: task.assign_by_name, // Assuming this field exists
            description: task.task_desc,
            progress: task.percentage_task || 0, // Accessing percentage_task directly
            status: task.task_status,
        };

        setSelectedTask(taskDetails);
        setDraggableModalVisible(true);
    };

    if (!fontsLoaded) {
        return null;
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

                {error ? (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity style={styles.retryButton} onPress={fetchTasks}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
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
                )}

                <View style={styles.bottomSpacer} />
            </ScrollView>

            <DraggableModalTask
                visible={draggableModalVisible}
                onClose={() => setDraggableModalVisible(false)}
                taskDetails={selectedTask || {}}
            />

            <DetailProyekModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                projectDetails={selectedProject || {}}
            />
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
        fontWeight: 'bold',
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
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold',
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
        fontWeight: 'bold',
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
        fontWeight: '500',
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

    detailButtonText: {
        color: '#0E509E',
        fontWeight: '500',
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
        fontWeight: '500',
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
    shimmerTitle: {
        marginBottom: 10,
    },
    shimmerSubtitle: {
        marginBottom: 15,
    },
    shimmerStatus: {
        position: 'absolute',
        top: 20,
        right: 20,
        borderRadius: 20,
    },
    shimmerButton: {
        position: 'absolute',
        bottom: 20,
        left: 20,
    },
    bottomSpacer: {
        height: 100,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        marginVertical: 5,
    },
});

export default Tugas;
