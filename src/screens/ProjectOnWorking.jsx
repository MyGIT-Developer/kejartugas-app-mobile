import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Platform,
    Animated
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTask } from '../api/projectTask';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { Feather, Ionicons } from '@expo/vector-icons';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { fetchTaskById } from '../api/task'; // Import the fetchTaskById function
import { FONTS } from '../constants/fonts';

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
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <View style={styles.taskItem}>
                <View style={styles.taskContent}>
                    <View style={styles.upperTaskContent}>
                        <Text style={styles.taskTitle} numberOfLines={2}>{task.task_name}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: durationBadge.color }]}>
                        <Ionicons
                            name="time-outline"
                            size={16}
                            color={durationBadge.textColor}
                        />
                        <Text style={[styles.badgeText, { color: durationBadge.textColor }]}>
                            {durationBadge.label}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
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

    console.log('Project Details:', projectDetails);

    return (
        <View style={styles.projectGroup}>
            <TouchableOpacity
                style={styles.projectHeader} onPress={() => setIsExpanded(!isExpanded)}>
                <View style={styles.projectTitleSection}>
                    <Text style={styles.projectTitleLabel}>Nama Proyek</Text>
                    <Text style={styles.projectTitle}>{projectName}</Text>
                </View>
                <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>{tasks.length}</Text>
                    <Text style={styles.taskCountLabel}>Tugas</Text>
                </View>
            </TouchableOpacity>
            {isExpanded && projectDetails && (
                <View style={{ borderBottomWidth: 1, borderColor: '#E0E0E0', paddingBottom: 10 }}>
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons
                                name="person-circle-outline"
                                size={16}
                                color="#3498db"
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.sectionLabel}>Ditugaskan Oleh</Text>
                        </View>
                        <Text style={styles.sectionValue}>{projectDetails.assign_by_name ? projectDetails.assign_by_name : 'Tidak tersedia'}</Text>

                        <View style={[styles.row, { marginTop: 12 }]}>
                            <Ionicons name="calendar-outline" size={16} color="#3498db" style={{ marginRight: 6 }} />
                            <Text style={styles.sectionLabel}>Durasi Proyek</Text>
                        </View>
                        <Text style={styles.sectionValue}>{calculateDuration(projectDetails.start_date, projectDetails.end_date)}</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons
                                name="document-text-outline"
                                size={16}
                                color="#3498db"
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.sectionLabel}>Keterangan</Text>
                        </View>
                        <Text style={styles.sectionValue}>{projectDetails.description || 'Tidak ada keterangan'}</Text>
                    </View>
                </View>
            )}
            <View style={styles.tasksList}>
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} onPress={() => onTaskPress(task)} />
                ))}
            </View>
        </View>
    );
};

const ProjectOnWorking = () => {
    const route = useRoute();
    const { status, subStatus } = route.params || {};
    const [taskData, setTaskData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigation = useNavigation();
    const [modalType, setModalType] = useState('default'); // Initialize modalType state
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);

    const headerAnim = React.useRef(new Animated.Value(1)).current;
    const headerScaleAnim = React.useRef(new Animated.Value(1)).current;

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
        const filteredTasks = taskData.filter(
            (task) => task.task_status === status || task.task_status === subStatus,
        );

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

    const renderHeader = () => (
        <Animated.View
            style={[
                styles.backgroundBox,
                {
                    opacity: headerAnim,
                    transform: [
                        {
                            scale: headerScaleAnim.interpolate({
                                inputRange: [0.9, 1],
                                outputRange: [0.95, 1],
                                extrapolate: 'clamp',
                            }),
                        },
                    ],
                },
            ]}
        >
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#2E5984']}
                style={styles.linearGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header decorative elements */}
            <View style={styles.headerDecorations}>
                <Animated.View
                    style={[
                        styles.decorativeCircle1,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.6],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.5, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle2,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.4],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.3, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle3,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle4,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.decorativeCircle5,
                        {
                            opacity: headerAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 0.5],
                            }),
                            transform: [
                                {
                                    scale: headerAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0.7, 1],
                                    }),
                                },
                            ],
                        },
                    ]}
                />
            </View>
        </Animated.View>
    );

    return (
        <View style={styles.container}>
            {renderHeader()}
            <Animated.View
                style={[
                    styles.headerContainer,
                    {
                        opacity: headerAnim,
                        transform: [
                            {
                                translateY: headerAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-30, 0],
                                }),
                            },
                            { scale: headerScaleAnim },
                        ],
                    },
                ]}
            >
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <View style={styles.headerContent}>
                    <View style={styles.headerTitleWrapper}>
                        <Animated.View
                            style={[
                                styles.headerIconContainer,
                                {
                                    opacity: headerAnim,
                                    transform: [
                                        {
                                            scale: headerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.5, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="clipboard-outline" size={28} color="white" />
                        </Animated.View>
                        <Animated.Text
                            style={[
                                styles.header,
                                {
                                    opacity: headerAnim,
                                    transform: [
                                        {
                                            scale: headerAnim.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [0.8, 1],
                                            }),
                                        },
                                    ],
                                },
                            ]}
                        >
                            {status === 'workingOnIt' ? 'Dalam Pengerjaan' : 'Dalam Peninjauan'}
                        </Animated.Text>
                    </View>
                </View>
            </Animated.View>

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
                showsVerticalScrollIndicator={false}
            />

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
        </View>
    );
};
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    // New header styles matching AdhocDashboard
    backgroundBox: {
        height: 325,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
    },
    linearGradient: {
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
    headerContainer: {
        alignItems: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 30,
        paddingHorizontal: 20,
        position: 'relative',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
        gap: 10,
        marginTop: 20,
    },
    header: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.regular,
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 0.2,
        lineHeight: 18,
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
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
        right: -20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 80,
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

    contentContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    header: {
        fontSize: FONTS.size['3xl'],
        fontFamily: FONTS.family.bold,
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    backIcon: {
        position: 'absolute',
        top: 80,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    projectGroup: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
        marginHorizontal: 20,
    },
    projectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    projectTitleSection: {
        flex: 1,
        marginRight: 16,
    },
    projectTitleLabel: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        marginBottom: 4,
        color: '#444',
        letterSpacing: -0.5,
    },
    projectTitle: {
        fontSize: FONTS.size.lg,
        fontFamily: FONTS.family.semiBold,
        marginBottom: 8,
        color: '#1C1C1E',
        letterSpacing: -0.5,
    },
    taskCountBadge: {
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#357ABD',
        minWidth: 70,
        shadowColor: '#357ABD',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    taskCountText: {
        fontSize: 24,
        color: '#357ABD',
        fontWeight: '800',
        lineHeight: 28,
    },
    taskCountLabel: {
        fontSize: 12,
        color: '#357ABD',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    tasksList: {
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    taskItem: {
        marginBottom: 12,
        backgroundColor: '#FAFBFC',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    taskContent: {
        gap: 16,
    },
    upperTaskContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    taskTitle: {
        flex: 1,
        fontSize: FONTS.size.md,
        color: '#1E293B',
        fontFamily: FONTS.family.semiBold,
        lineHeight: 20,
        letterSpacing: -0.5,
    },
    detailButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E9E9EB',
        borderRadius: 6,
        alignSelf: 'flex-start',
        shadowColor: '#444',
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
    badge: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        gap: 8,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: FONTS.size.xs,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    projectDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    projectDetailButtonText: {
        fontSize: FONTS.size.sm,
        color: '#1f1f1f',
        marginRight: 5,
        fontFamily: FONTS.family.semiBold,
        letterSpacing: -0.5,
    },
    chevronIcon: {
        marginTop: 2,
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#444',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginHorizontal: 20,
        marginTop: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        letterSpacing: -0.5,
    },
    sectionValue: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#111827',
        marginTop: 4,
        lineHeight: 22,
        letterSpacing: -0.5,
    },
    title: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.md,
        color: '#6e6e6eff',
        letterSpacing: -0.5,
    },
    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    detailColumn: {
        flex: 1,
        marginRight: 10, // Add some space between columns
    },
    descriptionContainer: {
        marginBottom: 20,
    },
});

export default ProjectOnWorking;
