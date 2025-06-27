import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, RefreshControl, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import DetailProyekModal from '../components/DetailProjectModal';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { MaterialIcons } from '@expo/vector-icons';
import ReusableAlert from '../components/ReusableAlert';
import AccessDenied from '../components/AccessDenied';
import TaskSection from '../components/TaskSection';
import TaskStatistics from '../components/TaskStatistics';
import { useNavigation } from '@react-navigation/native';
import { useFonts } from '../utils/UseFonts';
import { useTasksData } from '../hooks/useTasksData';
import { useAccessPermission } from '../hooks/useAccessPermission';
import { getStatusBadgeColor, getCollectionStatusBadgeColor } from '../utils/taskUtils';

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

    return (
        <SafeAreaView style={styles.safeArea}>
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
                <LinearGradient
                    colors={GRADIENT_COLORS}
                    style={styles.header}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.headerTitle}>Tugas Saya</Text>
                </LinearGradient>

                <View style={styles.content}>
                    {!isLoading && !hasAnyTasks ? (
                        <View style={styles.emptyStateContainer}>
                            <View style={styles.emptyStateIcon}>
                                <MaterialIcons name="assignment" size={64} color="#CCCCCC" />
                            </View>
                            <Text style={styles.emptyStateTitle}>Belum Ada Tugas</Text>
                            <Text style={styles.emptyStateSubtitle}>
                                Anda belum memiliki tugas yang diberikan.{'\n'}
                                Tugas baru akan muncul di sini ketika tersedia.
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Task Statistics */}
                            <TaskStatistics tasks={tasks} />

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
    },
    content: {
        padding: 20,
    },
    bottomSpacer: {
        height: 100,
    },
    // Loading state styles
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
    },
    loadingContent: {
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
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
    // Empty state styles
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
        minHeight: 400,
    },
    emptyStateIcon: {
        marginBottom: 20,
        opacity: 0.5,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: '#333',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptyStateSubtitle: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Tugas;
