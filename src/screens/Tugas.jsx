import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    RefreshControl,
    Animated,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DetailProyekModal from '../components/DetailProjectModal';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import ReusableAlert from '../components/ReusableAlert';
import AccessDenied from '../components/AccessDenied';
import TaskSection from '../components/TaskSection';
import TaskStatistics from '../components/TaskStatistics';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import { useTasksData } from '../hooks/useTasksData';
import { useAccessPermission } from '../hooks/useAccessPermission';
import { getStatusBadgeColor, getCollectionStatusBadgeColor } from '../utils/taskUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const Tugas = () => {
    // State for modals and UI
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalType, setModalType] = useState('default');
    const [showAlert, setShowAlert] = useState(false);

    // Animated values for loading dots
    const dot1Opacity = React.useRef(new Animated.Value(0.3)).current;
    const dot2Opacity = React.useRef(new Animated.Value(0.3)).current;
    const dot3Opacity = React.useRef(new Animated.Value(0.3)).current;

    // Hooks
    const navigation = useNavigation();
    const fontsLoaded = useFonts();
    const hasAccess = useAccessPermission('access_tasks');
    const { tasks, isLoading, refreshing, error, fetchTasks, setError } = useTasksData();

    // Animate loading dots
    React.useEffect(() => {
        const animateLoadingDots = () => {
            const sequence = Animated.sequence([
                Animated.timing(dot1Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(dot2Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(dot3Opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(dot1Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                Animated.timing(dot2Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
                Animated.timing(dot3Opacity, { toValue: 0.3, duration: 300, useNativeDriver: true }),
            ]);

            Animated.loop(sequence).start();
        };

        if (hasAccess === null) {
            animateLoadingDots();
        }
    }, [hasAccess, dot1Opacity, dot2Opacity, dot3Opacity]);

    // Handle refresh with haptic feedback
    const handleRefresh = async () => {
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (error) {
            // Haptics not available on this device
            console.log('Haptics not available:', error.message);
        }
        fetchTasks();
    };

    // Check if all task arrays are empty
    const hasAnyTasks =
        tasks.inProgress.length > 0 ||
        tasks.inReview.length > 0 ||
        tasks.rejected.length > 0 ||
        tasks.postponed.length > 0 ||
        tasks.completed.length > 0;

    // Show alert when error occurs
    React.useEffect(() => {
        if (error) {
            setShowAlert(true);
        }
    }, [error]);

    const handleSeeAllPress = (sectionTitle, tasks) => {
        const baseUrl = 'https://app.kejartugas.com/';
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
        const baseUrl = 'https://app.kejartugas.com/';
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
            <View style={styles.loadingContainer}>
                <View style={styles.loadingContent}>
                    <Text style={styles.loadingText}>Memuat...</Text>
                    <View style={styles.loadingDots}>
                        <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
                        <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
                        <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
                    </View>
                </View>
            </View>
        );
    }

    if (hasAccess === false) {
        return <AccessDenied />;
    }

    // Header for Tugas, styled like AdhocDashboard
    const renderHeader = () => (
        <View style={styles.backgroundBox}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
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
                                <Ionicons name="clipboard-outline" size={28} color="white" />
                            </View>
                            <Text style={styles.header}>Tugas Saya</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Kelola dan pantau semua tugas Anda</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0E509E" />
            {renderHeader()}

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor="#0E509E"
                        colors={['#0E509E']}
                        title="Tarik untuk memuat ulang..."
                        titleColor="#666"
                    />
                }
            >
                <View style={styles.mainContent}>
                    {/* Task Statistics - positioned closer to header */}
                    <View style={styles.statisticsContainer}>
                        <TaskStatistics tasks={tasks} />
                    </View>

                    <View style={styles.content}>
                        {!isLoading && !hasAnyTasks ? (
                            <View style={styles.emptyStateContainer}>
                                <View style={styles.emptyStateIcon}>
                                    <Feather name="clipboard" size={64} color="#CBD5E1" />
                                </View>
                                <Text style={styles.emptyStateTitle}>Belum Ada Tugas</Text>
                                <Text style={styles.emptyStateSubtitle}>
                                    Anda belum memiliki tugas yang diberikan.{'\n'}
                                    Tugas baru akan muncul di sini ketika tersedia.
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Render shimmer if loading, otherwise render TaskSection */}
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
                            </>
                        )}
                    </View>
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

            <ReusableAlert
                show={showAlert}
                alertType="error"
                message={error}
                onConfirm={() => {
                    setShowAlert(false);
                    setError(null);
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    container: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
    },
    // New header styles matching AdhocDashboard
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Changed to center for proper centering
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
        marginBottom: 8,
        marginTop: 35, // Added margin to move icon down with the text
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
    statisticsContainer: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 20, // Positive margin to ensure it's clearly below header
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 2,
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    content: {
        padding: 20,
        paddingTop: 16, // Reduced top padding since statistics moved above
        gap: 0, // Remove gap since sections now have their own spacing
    },
    bottomSpacer: {
        height: 100,
    },
    // Loading state styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-Medium',
        color: '#666',
        marginBottom: 20,
    },
    loadingDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#0E509E',
        marginHorizontal: 4,
    },
    // Empty state styles - improved to match AdhocDashboard
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 80,
        minHeight: 400,
    },
    emptyStateIcon: {
        marginBottom: 24,
    },
    emptyStateTitle: {
        fontSize: calculateFontSize(18),
        fontFamily: 'Poppins-SemiBold',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptyStateSubtitle: {
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-Regular',
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },
});

export default Tugas;
