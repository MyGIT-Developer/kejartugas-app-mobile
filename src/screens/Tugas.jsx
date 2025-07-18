import React, { useState, useRef } from 'react';
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
    Pressable,
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
import { TaskStatistics, TaskStatisticsSkeleton } from '../components/TaskStatistics';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import { useTasksData } from '../hooks/useTasksData';
import { useAccessPermission } from '../hooks/useAccessPermission';
import { getStatusBadgeColor, getCollectionStatusBadgeColor } from '../utils/taskUtils';
import PagerView from 'react-native-pager-view';
import { FONTS } from '../constants/fonts';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const Tugas = () => {
    const pagerRef = useRef(null);
    const tabScrollRef = useRef(null);
    const tabItemRefs = useRef([]);

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
    const headerAnim = React.useRef(new Animated.Value(1)).current;
    const headerScaleAnim = React.useRef(new Animated.Value(1)).current;

    // Hooks
    const navigation = useNavigation();
    const fontsLoaded = useFonts();
    const hasAccess = useAccessPermission('access_tasks');
    const { tasks, adhocTasks, isLoading, refreshing, error, fetchTasks, setError } = useTasksData();

    console.log('is loading:', isLoading);

    // Tabs
    const taskTabs = [
        { key: 'inProgress', label: 'Dalam Pengerjaan' },
        { key: 'inReview', label: 'Dalam Peninjauan' },
        { key: 'rejected', label: 'Ditolak' },
        { key: 'postponed', label: 'Ditunda' },
        { key: 'completed', label: 'Selesai' },
    ];

    const [activeTab, setActiveTab] = useState('inProgress');

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

    // Check if all task arrays are empty (including adhoc tasks)
    const hasAnyTasks =
        tasks.inProgress.length > 0 ||
        tasks.inReview.length > 0 ||
        tasks.rejected.length > 0 ||
        tasks.postponed.length > 0 ||
        tasks.completed.length > 0 ||
        adhocTasks.inProgress.length > 0 ||
        adhocTasks.inReview.length > 0 ||
        adhocTasks.rejected.length > 0 ||
        adhocTasks.postponed.length > 0 ||
        adhocTasks.completed.length > 0;

    // Show alert when error occurs
    React.useEffect(() => {
        if (error) {
            setShowAlert(true);
        }
    }, [error]);

    // Combine regular tasks and adhoc tasks for each status
    const getCombinedTasks = (status) => {
        const regularTasks = tasks[status] || [];
        const adhocTasksForStatus = adhocTasks[status] || [];

        // Transform adhoc tasks to match regular task structure
        const transformedAdhocTasks = adhocTasksForStatus.map((adhocTask) => ({
            ...adhocTask,
            task_name: adhocTask.name || adhocTask.task_name,
            task_status: adhocTask.status,
            project_name: adhocTask.project_name || 'Tugas Adhoc',
            task_desc: adhocTask.description || adhocTask.task_desc,
            assign_by_name: adhocTask.created_by_name || adhocTask.assign_by_name,
            percentage_task: adhocTask.progress || adhocTask.percentage_task || 0,
            assignedEmployees: [], // Adhoc tasks might not have assigned employees
            isAdhoc: true, // Mark as adhoc task
        }));

        return [...regularTasks, ...transformedAdhocTasks].sort((a, b) => {
            return new Date(b.start_date) - new Date(a.start_date);
        });
    };

    const handleSeeAllPress = (sectionTitle, status) => {
        const combinedTasks = getCombinedTasks(status);
        const baseUrl = 'https://app.kejartugas.com/';

        navigation.navigate('DetailTaskSection', {
            sectionTitle,
            tasks: combinedTasks.map((task) => ({
                title: task.task_name,
                subtitle: task.project_name,
                task_status: task.task_status || task.status,
                id: task.id,
                task_desc: task.task_desc,
                start_date: task.start_date,
                end_date: task.end_date,
                assignedBy: task.assign_by_name,
                project_desc: task.project_desc,
                project_start_date: task.project_start_date,
                project_end_date: task.project_end_date,
                percentage_task: task.percentage_task || 0,
                statusColor: getStatusBadgeColor(task.task_status || task.status, task.end_date).color,
                collectionDate: task.task_submit_date || 'N/A',
                collectionStatus: task.task_submit_status || 'N/A',
                collectionStatusColor: getCollectionStatusBadgeColor(task.task_submit_status || 'N/A').color,
                collectionStatusTextColor: getCollectionStatusBadgeColor(task.task_submit_status || 'N/A').textColor,
                collectionDescription: task.task_desc || 'N/A',
                task_image: task.task_image ? `${baseUrl}${task.task_image}` : null,
                isAdhoc: task.isAdhoc || false,
            })),
        });
    };

    const handleProjectDetailPress = (task) => {
        const projectDetails = {
            title: task.project_name,
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
        const taskStatus = task.task_status || task.status;
        const submitTaskStatus = task.task_submit_status || 'N/A';
        const collectionStatus = getCollectionStatusBadgeColor(task.task_submit_status || 'N/A');

        const taskDetails = {
            id: task.id,
            title: task.task_name,
            subtitle: task.project_name,
            startDate: task.start_date,
            endDate: task.end_date,
            assignedById: task.assign_by ? task.assign_by : 'N/A',
            assignedBy: task.assign_by_name ? task.assign_by_name : 'N/A',
            description: task.task_desc,
            progress: task.percentage_task || 0,
            status: taskStatus,
            project_desc: task.project_desc,
            project_start_date: task.project_start_date,
            project_end_date: task.project_end_date,
            statusColor: getStatusBadgeColor(taskStatus, task.end_date).color,
            collectionDate: task.task_submit_date || 'N/A',
            collectionStatus: collectionStatus.label,
            collectionStatusColor: collectionStatus.color,
            collectionStatusTextColor: collectionStatus.textColor,
            collectionDescription: task.task_desc || 'N/A',
            task_image: task.task_image ? `${baseUrl}${task.task_image}` : null,
            assignedEmployees: task.assignedEmployees || [],
            isAdhoc: task.isAdhoc || false,
        };

        setSelectedTask(taskDetails);
        setModalType('default');
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
        <View style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#0E509E" />
            {renderHeader()}

            <View style={styles.scrollViewContent}>
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
                                Tugas Saya
                            </Animated.Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Kelola dan pantau semua tugas Anda</Text>
                    </View>
                </Animated.View>

                <View style={styles.statisticsContainer}>
                    {isLoading && hasAnyTasks ? (
                        <TaskStatisticsSkeleton />
                    ) : (
                        <TaskStatistics tasks={tasks} adhocTasks={adhocTasks} isLoading={isLoading} />
                    )}
                </View>

                <View>
                    <View style={styles.content}>
                        {isLoading && hasAnyTasks ? (
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
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={styles.tabHeader}
                                    ref={tabScrollRef}
                                >
                                    {taskTabs.map((tab, index) => (
                                        <Pressable
                                            key={tab.key}
                                            ref={(ref) => (tabItemRefs.current[index] = ref)}
                                            style={[styles.tabButton, activeTab === tab.key && styles.activeTabButton]}
                                            onPress={() => {
                                                setActiveTab(tab.key);
                                                pagerRef.current?.setPage(index);
                                            }}
                                        >
                                            <Text
                                                style={[
                                                    styles.tabLabel,
                                                    activeTab === tab.key && styles.activeTabLabel,
                                                ]}
                                            >
                                                {tab.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>

                                {/* Swipeable Content */}

                                <PagerView
                                    style={{ minHeight: 500 }}
                                    initialPage={taskTabs.findIndex((t) => t.key === activeTab)}
                                    onPageSelected={(e) => {
                                        const index = e.nativeEvent.position;
                                        const key = taskTabs[index].key;
                                        setActiveTab(key);

                                        // Scroll tab header to active tab
                                        tabItemRefs.current[index]?.measureLayout(
                                            tabScrollRef.current,
                                            (x) => {
                                                tabScrollRef.current?.scrollTo({ x: x - 16, animated: true }); // adjust offset if needed
                                            },
                                            (error) => console.warn('measure error', error),
                                        );
                                    }}
                                    ref={pagerRef}
                                >
                                    {taskTabs.map((tab) => (
                                        <View key={tab.key} style={{}}>
                                            <TaskSection
                                                title={tab.label}
                                                tasks={getCombinedTasks(tab.key)}
                                                isLoading={isLoading}
                                                onProjectDetailPress={handleProjectDetailPress}
                                                onTaskDetailPress={handleTaskDetailPress}
                                                onSeeAllPress={() => handleSeeAllPress(tab.label, tab.key)}
                                                refreshing={refreshing}
                                                onRefresh={handleRefresh}
                                            />
                                        </View>
                                    ))}
                                </PagerView>
                            </>
                        )}
                    </View>
                </View>
            </View>

            <DraggableModalTask
                visible={draggableModalVisible}
                onClose={() => {
                    setDraggableModalVisible(false);
                    setSelectedTask(null);
                }}
                taskDetails={selectedTask || {}}
            />

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
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingTop: 20,
        paddingBottom: 120,
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
    headerContent: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 20,
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
    statisticsContainer: {
        marginTop: 20,
        paddingHorizontal: 20,
    },
    taskScrollSection: {
        width: '100%',
        marginTop: 10,
    },
    content: {
        marginTop: 10,
        paddingHorizontal: 20,
    },
    tabHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderRadius: 12,
        marginBottom: 10,
    },
    tabButton: {
        paddingVertical: 8,
        borderBottomColor: '#E5E7EB',
        borderBottomWidth: 1,
        paddingHorizontal: 12,
    },
    activeTabButton: {
        borderBottomColor: '#357ABD',
        borderBottomWidth: 2,
    },
    tabLabel: {
        fontSize: 14,
        color: '#64748B',
        fontFamily: FONTS.family.medium,
        letterSpacing: -0.5,
    },
    activeTabLabel: {
        color: '#357ABD',
        fontFamily: FONTS.family.semiBold,
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
