import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { Ionicons } from '@expo/vector-icons';
import { fetchTaskById } from '../api/task'; // Import the fetchTaskById function

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

const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#A7C8E5', textColor: '#092D58', label: 'Labeling' };
        case 'earlyFinish':
            return { color: '#9ADFAD', textColor: '#0A642E', label: 'Early Finish' };
        case 'finish in delay':
            return { color: '#F0E089', textColor: '#80490A', label: 'Finish Delay' };
        case 'overdue':
            return { color: '#F69292', textColor: '#811616', label: 'Overdue' };
        case 'Completed':
            return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
        default:
            return { color: '#E0E0E0', textColor: '#000000', label: status };
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
            <Text style={styles.projectTitle}>{projectName}</Text>
            {tasks.map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                    <View style={styles.taskInfo}>
                        <Text style={styles.taskName} numberOfLines={2}>
                            {truncateText(task.title, 50)}
                        </Text>
                        {renderStatusOrDays(task)}
                    </View>
                    <TouchableOpacity
                        style={[styles.detailButton, { alignSelf: 'flex-start', marginTop: 5 }]}
                        onPress={() => onTaskPress(task)}
                    >
                        <Text style={styles.detailButtonText}>Detail</Text>
                    </TouchableOpacity>
                </View>
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

const DetailTaskSection = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sectionTitle, tasks = [] } = route.params || {};

    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [modalType, setModalType] = useState('default'); // Initialize modalType state

    const groupedTasks = groupTasksByProject(tasks);

    const handleTaskDetailPress = async (task) => {
        const baseUrl = 'http://202.10.36.103:8000/';
        try {
            const response = await fetchTaskById(task.id); // Fetch task details by ID
            const taskDetails = response.data; // Access the data field from the response
            console.log('Fetched task details:', taskDetails); // Debugging log

            // Transform the task details to match the structure expected by DraggableModalTask
            const transformedTaskDetails = {
                id: taskDetails.id,
                title: taskDetails.task_name,
                startDate: taskDetails.start_date,
                endDate: taskDetails.end_date,
                assignedBy: taskDetails.assign_by ? taskDetails.assign_by.name : 'N/A', // Accessing nested object
                description: taskDetails.task_desc || 'N/A',
                progress: taskDetails.percentage_task || 0,
                status: taskDetails.task_status,
                statusColor: getStatusBadgeColor(taskDetails.task_status, taskDetails.end_date).color,
                collectionDate: taskDetails.task_submit_date || 'N/A',
                collectionStatus:
                    taskDetails.task_status === 'Completed' ? 'Selesai' : taskDetails.task_submit_status || 'N/A',
                collectionStatusColor: getCollectionStatusBadgeColor(
                    taskDetails.task_status === 'Completed' ? 'Completed' : taskDetails.task_submit_status || 'N/A',
                ).color,
                collectionStatusTextColor: getCollectionStatusBadgeColor(
                    taskDetails.task_status === 'Completed' ? 'Completed' : taskDetails.task_submit_status || 'N/A',
                ).textColor,
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
            console.log(transformedTaskDetails); // Debugging log

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
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#0E509E', '#5FA0DC', '#9FD2FF']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{sectionTitle || 'Tasks'}</Text>
                </View>
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {Object.keys(groupedTasks).map((projectName, index) => (
                    <TaskCard
                        key={index}
                        projectName={projectName}
                        tasks={groupedTasks[projectName]}
                        onTaskPress={handleTaskDetailPress} // Update here
                    />
                ))}
            </ScrollView>

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
        backgroundColor: '#F2F2F7',
    },
    header: {
        height: 80,
        paddingTop: 10,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Poppins-Bold',
        alignSelf: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 5,
    },
    scrollContent: {
        padding: 16,
        flexGrow: 1,
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    projectTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    taskInfo: {
        flexDirection: 'column',
        flex: 1,
        marginRight: 10,
    },
    taskName: {
        fontSize: 16,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
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
    detailButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E9E9EB',
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    detailButtonText: {
        fontSize: 14,
        color: '#1f1f1f',
        fontFamily: 'Poppins-Regular',
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

export default DetailTaskSection;
