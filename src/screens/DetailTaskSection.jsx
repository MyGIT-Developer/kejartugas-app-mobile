import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    Dimensions,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { Ionicons } from '@expo/vector-icons';
import { fetchTaskById } from '../api/task'; // Import the fetchTaskById function

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

// Group tasks by project name
const groupTasksByProject = (tasks) => {
    const groupedTasks = {};
    tasks.forEach((task) => {
        groupedTasks[task.subtitle] = groupedTasks[task.subtitle] || [];
        groupedTasks[task.subtitle].push(task);
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
        return { color: '#DCFCE7', textColor: '#166534', label: 'Selesai' };
    }

    const remainingDays = calculateRemainingDays(endDate, status);

    if (remainingDays === 0) {
        return { color: '#FEF2F2', textColor: '#DC2626', label: 'Deadline Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#FEF2F2', textColor: '#DC2626', label: `Terlambat ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FEF3C7', textColor: '#D97706', label: `Tersisa ${remainingDays} hari` };
    }

    // Existing status handling logic
    switch (status) {
        case 'workingOnIt':
            return { color: '#F1F5F9', textColor: '#475569', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#DBEAFE', textColor: '#1D4ED8', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#FEF2F2', textColor: '#DC2626', label: 'Ditolak' };
        case 'onHold':
            return { color: '#FEF3C7', textColor: '#D97706', label: 'Ditunda' };
        case 'Completed':
            return { color: '#DCFCE7', textColor: '#166534', label: 'Selesai' };
        case 'onPending':
            return { color: '#EFF6FF', textColor: '#2563EB', label: 'Tersedia' };
        default:
            return { color: '#F8FAFC', textColor: '#64748B', label: status };
    }
};

const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#DBEAFE', textColor: '#1E40AF', label: 'Selesai' };
        case 'earlyFinish':
            return { color: '#DCFCE7', textColor: '#166534', label: 'Selesai Lebih Awal' };
        case 'finish in delay':
            return { color: '#FEF3C7', textColor: '#D97706', label: 'Selesai Terlambat' };
        case 'overdue':
            return { color: '#FEF2F2', textColor: '#DC2626', label: 'Terlambat' };
        default:
            return { color: '#F8FAFC', textColor: '#64748B', label: status || 'Belum Dikumpulkan' };
    }
};

const TaskCard = ({ projectName, tasks, onTaskPress }) => {
    const [isExpanded, setIsExpanded] = useState(false);

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

    // Assuming all tasks in a project have the same project details
    const projectDetails = tasks.length > 0 ? tasks[0] : null;

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
            <View style={styles.projectHeader}>
                <View style={styles.projectTitleContainer}>
                    <Text style={styles.projectTitle} numberOfLines={2} ellipsizeMode="tail">
                        {projectName}
                    </Text>
                </View>
                <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>
                        {tasks.length} Task{tasks.length > 1 ? 's' : ''}
                    </Text>
                </View>
            </View>
            {tasks.map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                    <View style={styles.taskInfo}>
                        <Text style={styles.taskName} numberOfLines={2}>
                            {truncateText(task.title, 50)}
                        </Text>
                        {renderStatusOrDays(task)}
                        <TouchableOpacity style={styles.detailButton} onPress={() => onTaskPress(task)}>
                            <Text style={styles.detailButtonText}>Lihat Detail</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
            <TouchableOpacity style={styles.projectDetailButton} onPress={() => setIsExpanded(!isExpanded)}>
                <Text style={styles.projectDetailButtonText}>
                    {isExpanded ? 'Sembunyikan detail proyek' : 'Lihat detail proyek'}
                </Text>
                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#475569"
                    style={styles.chevronIcon}
                />
            </TouchableOpacity>
            {isExpanded && projectDetails && (
                <View style={styles.projectDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.leftColumn}>
                            <Text style={styles.detailLabel}>Ditugaskan Oleh</Text>
                            <Text style={styles.detailValue}>{projectDetails.assignedBy}</Text>
                        </View>
                        <View style={styles.rightColumn}>
                            <Text style={styles.detailLabel}>Durasi Proyek</Text>
                            <Text style={styles.detailValue}>
                                {calculateDuration(projectDetails.start_date, projectDetails.end_date)}
                            </Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 16 }}>
                        <View style={[styles.leftColumn, { marginRight: 0 }]}>
                            <Text style={styles.detailLabel}>Keterangan Proyek</Text>
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

const DetailTaskSection = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sectionTitle, tasks = [] } = route.params || {};

    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalType, setModalType] = useState('default'); // Initialize modalType state

    const groupedTasks = groupTasksByProject(tasks);

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
                setModalType('success');
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
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Header with AdhocDashboard style */}
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#7dbfff']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.linearGradient}
                >
                    <View style={styles.headerDecorations}>
                        <View style={styles.decorativeCircle1} />
                        <View style={styles.decorativeCircle2} />
                        <View style={styles.decorativeCircle3} />
                        <View style={styles.decorativeCircle4} />
                        <View style={styles.decorativeCircle5} />
                    </View>
                    <View style={styles.headerContainer}>
                        <View style={styles.headerCenterContent}>
                            <View style={styles.headerTitleWrapper}>
                                <View style={styles.headerIconContainer}>
                                    <Ionicons name="list-outline" size={28} color="white" />
                                </View>
                                <Text style={styles.header}>{sectionTitle || 'Tasks'}</Text>
                            </View>
                            <Text style={styles.headerSubtitle}>Detail tugas dan progres proyek Anda</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Main Content */}
            <View style={styles.mainContent}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {Object.keys(groupedTasks).map((projectName, index) => (
                        <TaskCard
                            key={index}
                            projectName={projectName}
                            tasks={groupedTasks[projectName]}
                            onTaskPress={handleTaskDetailPress}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Floating Back Button */}
            <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

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
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    backgroundBox: {
        height: 220,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 1,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerCenterContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: calculateFontSize(24),
        fontFamily: 'Poppins-Bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.8,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: calculateFontSize(13),
        fontFamily: 'Poppins-Regular',
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: 0.3,
        lineHeight: calculateFontSize(18),
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
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
    mainContent: {
        flex: 1,
        marginTop: 220,
        backgroundColor: '#F8FAFC',
    },
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.8)',
    },
    projectHeader: {
        flexDirection: 'column',
        marginBottom: 16,
    },
    projectTitleContainer: {
        marginBottom: 8,
    },
    projectTitle: {
        fontSize: 20,
        color: '#0F172A',
        fontFamily: 'Poppins-Bold',
        letterSpacing: 0.3,
        lineHeight: 26,
    },
    taskCountBadge: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DBEAFE',
        alignSelf: 'flex-start',
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    taskCountText: {
        fontSize: 12,
        color: '#2563EB',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.3,
    },
    taskItem: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    taskInfo: {
        flexDirection: 'column',
        flex: 1,
        marginBottom: 12,
    },
    taskName: {
        fontSize: 16,
        color: '#1E293B',
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 8,
        lineHeight: 22,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.2,
    },
    detailButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        alignSelf: 'flex-start',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    detailButtonText: {
        fontSize: 14,
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.3,
    },
    projectDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 16,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#CBD5E1',
    },
    projectDetailButtonText: {
        fontSize: 14,
        color: '#475569',
        marginRight: 6,
        fontFamily: 'Poppins-Medium',
    },
    chevronIcon: {
        marginTop: 1,
    },
    projectDetails: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailRow: {
        flexDirection: 'column',
        gap: 16,
    },
    leftColumn: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    rightColumn: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailLabel: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 4,
        fontFamily: 'Poppins-Medium',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        color: '#1E293B',
        marginBottom: 0,
        fontFamily: 'Poppins-Regular',
        lineHeight: 20,
    },
    floatingBackButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        zIndex: 1000,
    },
});

export default DetailTaskSection;
