import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import DraggableModalTask from '../components/DraggableModalTask'; // Update the path accordingly
import { Ionicons } from '@expo/vector-icons';

// Group tasks by project name
const groupTasksByProject = (tasks) => {
    const groupedTasks = {};
    tasks.forEach((task) => {
        groupedTasks[task.subtitle] = groupedTasks[task.subtitle] || [];
        groupedTasks[task.subtitle].push(task);
    });
    return groupedTasks;
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

    return (
        <View style={styles.taskCard}>
            <Text style={styles.projectTitle}>{projectName}</Text>
            {tasks.map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                    <View style={styles.taskInfo}>
                        <Text style={styles.taskName}>{task.title}</Text>
                        <View
                            style={[
                                styles.statusContainer,
                                task.status === 'Completed' ? styles.completedStatus : styles.ongoingStatus,
                            ]}
                        >
                            <Text style={styles.statusText}>
                                {task.status === 'Completed' ? 'Completed' : `Tersisa ${task.remainingDays} Hari`}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.detailButton} onPress={() => onTaskPress(task)}>
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

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const groupedTasks = groupTasksByProject(tasks);

    const handleTaskPress = (task) => {
        setSelectedTask(task);
        setIsModalVisible(true);
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
                        onTaskPress={handleTaskPress}
                    />
                ))}
            </ScrollView>

            {selectedTask && (
                <DraggableModalTask
                    visible={isModalVisible}
                    onClose={() => setIsModalVisible(false)}
                    taskDetails={selectedTask}
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
        fontFamily: 'Poppins-Bold', // Updated to use Poppins-Bold
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
        fontFamily: 'Poppins-SemiBold', // Updated to use Poppins-SemiBold
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskInfo: {
        flexDirection: 'column',
    },
    taskName: {
        fontSize: 16,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium', // Updated to use Poppins-Medium
    },
    statusContainer: {
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 19,
        justifyContent: 'center',
        marginTop: 4,
        maxWidth: 150,
        alignSelf: 'flex-start',
    },
    completedStatus: {
        backgroundColor: '#C9F8C1',
    },
    ongoingStatus: {
        backgroundColor: '#FFE4E1',
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium', // Updated to use Poppins-Medium
        textAlign: 'center',
    },
    detailButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#E9E9EB',
        borderRadius: 6,
    },
    detailButtonText: {
        fontSize: 14,
        color: '#1f1f1f',
        fontFamily: 'Poppins-Regular', // Updated to use Poppins-Regular
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
        fontFamily: 'Poppins-Regular', // Updated to use Poppins-Regular
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
        fontFamily: 'Poppins-Medium', // Updated to use Poppins-Medium
        fontWeight: 'bold', // Optionally retain bold
    },
    detailValue: {
        fontSize: 14,
        color: '#333',
        marginBottom: 8,
        fontFamily: 'Poppins-Regular', // Updated to use Poppins-Regular
    },
});

export default DetailTaskSection;
