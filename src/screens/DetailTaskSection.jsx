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
import {
    getStatusBadgeColor as utilsGetStatusBadgeColor,
    getCollectionStatusBadgeColor as utilsGetCollectionStatusBadgeColor,
} from '../utils/taskUtils';
import { useFonts } from '../utils/UseFonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

// Consistent font system
const FONTS = {
    family: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semiBold: 'Poppins-SemiBold',
        bold: 'Poppins-Bold',
    },
    size: {
        xs: calculateFontSize(10),
        sm: calculateFontSize(12),
        base: calculateFontSize(14),
        lg: calculateFontSize(16),
        xl: calculateFontSize(18),
        '2xl': calculateFontSize(20),
        '3xl': calculateFontSize(24),
    },
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
    const [showAllTasks, setShowAllTasks] = useState(false);

    // Show only first 3 tasks initially if there are more than 3 tasks
    const visibleTasks = showAllTasks || tasks.length <= 3 ? tasks : tasks.slice(0, 3);
    const hasMoreTasks = tasks.length > 3;

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

    const getProjectProgress = () => {
        const completedTasks = tasks.filter(task => task.task_status === 'completed').length;
        return tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    };

    return (
        <View style={styles.taskCard}>
            {/* Project Header with improved layout */}
            <View style={styles.projectHeader}>
                <View style={styles.projectTitleSection}>
                    <TouchableOpacity onPress={() => setIsExpanded(prev => !prev)}>
                        <Text style={styles.projectTitle} numberOfLines={2} ellipsizeMode="tail">
                            {projectName}
                        </Text>
                    </TouchableOpacity>
                    <LinearGradient
                        colors={['#4A90E2', '#357ABD', '#2E5984']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientHeader}
                    >
                        <View style={styles.gradientPattern} />
                    </LinearGradient>
                </View>
                <View style={styles.taskCountBadge}>
                    <Text style={styles.taskCountText}>
                        {tasks.length}
                    </Text>
                    <Text style={styles.taskCountLabel}>Tugas</Text>
                </View>
            </View>

            {/* Enhanced Project Details */}
            {isExpanded && projectDetails && (
                <View style={styles.projectDetails}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailCard}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="person-circle" size={20} color="#4A90E2" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Ditugaskan Oleh</Text>
                                <Text style={styles.detailValue}>{projectDetails.assignedBy}</Text>
                            </View>
                        </View>
                        <View style={styles.detailCard}>
                            <View style={styles.detailIconContainer}>
                                <Ionicons name="time" size={20} color="#4A90E2" />
                            </View>
                            <View style={styles.detailContent}>
                                <Text style={styles.detailLabel}>Durasi Proyek</Text>
                                <Text style={styles.detailValue}>
                                    {calculateDuration(projectDetails.start_date, projectDetails.end_date)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <View style={styles.descriptionCard}>
                        <View style={styles.detailIconContainer}>
                            <Ionicons name="document-text" size={20} color="#4A90E2" />
                        </View>
                        <View style={styles.detailContent}>
                            <Text style={styles.detailLabel}>Keterangan Proyek</Text>
                            <Text style={styles.detailValue}>
                                {projectDetails.description || 'Tidak ada Keterangan'}
                            </Text>
                        </View>
                    </View>
                    {/* Add a button to close the expanded details */}
                    <TouchableOpacity
                        style={styles.showMoreButton}
                        onPress={() => setIsExpanded(false)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.showMoreButtonText}>
                            Tutup Detail Proyek
                        </Text>
                        <Ionicons name="chevron-up" size={18} color="#4A90E2" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Enhanced Task Items */}
            <View style={styles.tasksList}>
                {visibleTasks.map((task, index) => (
                    <TouchableOpacity
                        // style={styles.detailButton}
                        onPress={() => onTaskPress(task)}
                        activeOpacity={0.8}
                    >
                        <View key={task.id || index} style={styles.taskItem}>
                            <View style={styles.taskContent}>
                                <View style={styles.taskHeader}>
                                    <Text style={styles.taskName} numberOfLines={2}>
                                        {truncateText(task.title, 60)}
                                    </Text>
                                    {renderStatusOrDays(task)}
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Show more tasks button */}
            <TouchableOpacity
                style={styles.showMoreButton}
                onPress={() => setShowAllTasks(prev => !prev)}
                activeOpacity={0.7}
            >
                <Text style={styles.showMoreButtonText}>
                    { showAllTasks === true ?  `Tutup Detail`: `Lihat ${tasks.length - 3} tugas lainnya`}
                </Text>
                <Ionicons name={showAllTasks === true ? "chevron-up" : "chevron-down"} size={18} color="#4A90E2" />
            </TouchableOpacity>
        </View>
    );
};

const DetailTaskSection = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sectionTitle, tasks = [] } = route.params || {};
    const fontsLoaded = useFonts();

    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalType, setModalType] = useState('default'); // Initialize modalType state

    const groupedTasks = groupTasksByProject(tasks);

    // Return null if fonts are not loaded
    if (!fontsLoaded) {
        return null;
    }

    const handleTaskDetailPress = async (task) => {
        const baseUrl = 'https://app.kejartugas.com/';
        console.log('Original task data:', task); // Debug log

        try {
            const response = await fetchTaskById(task.id); // Fetch task details by ID
            const taskDetails = response.data; // Access the data field from the response
            console.log('API response data:', taskDetails); // Debug log

            const collectionStatus = utilsGetCollectionStatusBadgeColor(taskDetails.task_submit_status || 'N/A');

            // Transform the task details to match the structure expected by DraggableModalTask
            const transformedTaskDetails = {
                id: taskDetails.id,
                title: taskDetails.task_name,
                subtitle: task.subtitle || taskDetails.project_name, // Use original data as fallback
                startDate: taskDetails.start_date,
                endDate: taskDetails.end_date,
                assignedById: taskDetails.assign_by ? taskDetails.assign_by.id : 'N/A', // Accessing nested object
                assignedByName: taskDetails.assign_by ? taskDetails.assign_by.name : task.assignedBy || 'N/A', // Use original data as fallback
                assignedBy: taskDetails.assign_by ? taskDetails.assign_by.name : task.assignedBy || 'N/A', // Add this field for compatibility
                description: taskDetails.task_desc || 'N/A',
                progress: taskDetails.percentage_task || 0,
                status: taskDetails.task_status,
                statusColor: utilsGetStatusBadgeColor(taskDetails.task_status, taskDetails.end_date).color,
                collectionDate: taskDetails.task_submit_date || task.collectionDate || 'N/A',
                collectionStatus: collectionStatus.label,
                collectionStatusColor: collectionStatus.color,
                collectionStatusTextColor: collectionStatus.textColor,
                collectionDescription: taskDetails.task_desc || 'N/A',
                task_image: taskDetails.task_image ? `${baseUrl}${taskDetails.task_image}` : null,

                // Project details from original task data
                project_desc: task.project_desc || taskDetails.project_desc,
                project_start_date: task.project_start_date || taskDetails.project_start_date,
                project_end_date: task.project_end_date || taskDetails.project_end_date,

                // Additional fields based on your previous structure
                baselineWeight: taskDetails.baseline_weight || '0',
                actualWeight: taskDetails.actual_weight || '0',
                durationTask: taskDetails.duration_task || 0,
                assignedEmployees:
                    taskDetails.assignedEmployees?.map((emp) => ({
                        employeeId: emp.employee_id,
                        employeeName: emp.employee_name,
                    })) || [],
                taskProgress:
                    taskDetails.taskProgress?.map((progress) => ({
                        tasksId: progress.tasks_id,
                        updateDate: progress.update_date,
                        percentage: progress.percentage,
                    })) || [],
                isAdhoc: task.isAdhoc || false,
            };

            console.log('Transformed task details for modal:', transformedTaskDetails); // Debug log
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
            // Fallback to original data if API call fails
            const taskStatus = task.task_status || task.status;
            const collectionStatus = utilsGetCollectionStatusBadgeColor(task.collectionStatus || 'N/A');

            const fallbackTaskDetails = {
                id: task.id,
                title: task.title,
                subtitle: task.subtitle,
                startDate: task.start_date,
                endDate: task.end_date,
                assignedById: task.assignedById || 'N/A',
                assignedByName: task.assignedBy || 'N/A',
                assignedBy: task.assignedBy || 'N/A',
                description: task.task_desc || task.description || 'N/A',
                progress: task.percentage_task || 0,
                status: taskStatus,
                project_desc: task.project_desc,
                project_start_date: task.project_start_date,
                project_end_date: task.project_end_date,
                statusColor: utilsGetStatusBadgeColor(taskStatus, task.end_date).color,
                collectionDate: task.collectionDate || 'N/A',
                collectionStatus: collectionStatus.label,
                collectionStatusColor: collectionStatus.color,
                collectionStatusTextColor: collectionStatus.textColor,
                collectionDescription: task.task_desc || task.description || 'N/A',
                task_image: task.task_image,
                assignedEmployees: [],
                taskProgress: [],
                isAdhoc: task.isAdhoc || false,
            };

            console.log('Fallback task details for modal:', fallbackTaskDetails); // Debug log
            setSelectedTask(fallbackTaskDetails);

            if (taskStatus === 'Completed') {
                setModalType('success');
            } else {
                setModalType('default');
            }

            setDraggableModalVisible(true);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Fixed Header Background */}
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#4A90E2', '#357ABD', '#2E5984']}
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
                </LinearGradient>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={styles.scrollViewContent}
                showsVerticalScrollIndicator={false}
                style={styles.scrollView}
            >
                {/* Header Content Inside ScrollView */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerCenterContent}>
                        <View style={styles.headerTitleWrapper}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="list-outline" size={28} color="white" />
                            </View>
                            <Text style={styles.header}>Tugas {sectionTitle || 'Tasks'}</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Detail tugas dan progres proyek Anda</Text>
                    </View>
                </View>

                {/* Main Container */}
                <View style={styles.mainContainer}>
                    {/* Task Cards */}
                    {Object.keys(groupedTasks).map((projectName, index) => (
                        <TaskCard
                            key={index}
                            projectName={projectName}
                            tasks={groupedTasks[projectName]}
                            onTaskPress={handleTaskDetailPress}
                        />
                    ))}
                </View>
            </ScrollView>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollView: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
    },
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
        shadowColor: '#000',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
        gap: 16,
        marginTop: 20,
        zIndex: 1,
    },
    headerCenterContent: {
        alignItems: 'center',
        justifyContent: 'center',
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
        marginTop: 20,
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
    scrollContent: {
        padding: 20,
        flexGrow: 1,
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
        overflow: 'hidden',
    },
    gradientHeader: {
        height: 6,
        width: '75%',
        position: 'relative',
        borderRadius: 16,
    },
    gradientPattern: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.1,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    projectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    projectTitleSection: {
        flex: 1,
        marginRight: 16,
        gap: 8,
    },
    projectTitle: {
        fontSize: FONTS.size['xl'],
        color: '#0F172A',
        fontFamily: FONTS.family.semiBold,
        lineHeight: 24,
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
    projectDetails: {
        padding: 24,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    detailRow: {
        flexDirection: 'column',
        gap: 12,
        marginBottom: 12,
    },
    detailCard: {
        flex: 1,
        backgroundColor: '#FAFBFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    descriptionCard: {
        backgroundColor: '#FAFBFC',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        flexDirection: 'row',
        alignItems: 'flex-start',
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    detailIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F9FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: FONTS.size.sm,
        color: '#64748B',
        marginBottom: 4,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    detailValue: {
        fontSize: FONTS.size.md,
        color: '#1E293B',
        fontWeight: '600',
        lineHeight: 18,
        letterSpacing: -0.5,
    },
    tasksList: {
        paddingTop: 16,
        paddingHorizontal: 24,
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
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
    },
    taskStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
    },
    taskName: {
        flex: 1,
        fontSize: FONTS.size.md,
        color: '#1E293B',
        fontFamily: FONTS.family.semiBold,
        lineHeight: 20,
        letterSpacing: -0.5,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    badgeText: {
        fontSize: FONTS.size.xs,
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
    detailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#4A90E2',
        borderRadius: 16,
        gap: 8,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },

    detailButtonText: {
        fontSize: FONTS.size.md,
        color: 'white',
        fontWeight: '700',
        letterSpacing: -0.5,
    },

    showMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginBottom: 12,
        paddingVertical: 12,
        backgroundColor: '#F0F9FF',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#4A90E2',
        gap: 8,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },
    projectDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 24,
        marginTop: 12,
        paddingVertical: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 2,
    },

    projectDetailButtonText: {
        fontSize: 14,
        color: '#357ABD',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    floatingTaskContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        marginTop: -45,
        marginBottom: 20,
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
    showMoreButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginTop: 6,
        marginBottom: 6,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 1,
    },
    showMoreButtonText: {
        fontSize: FONTS.size.xs,
        color: '#3B82F6',
        fontFamily: FONTS.family.semiBold,
        marginRight: 4,
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
});

export default DetailTaskSection;
