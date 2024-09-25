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
        // Overwrite the array for the subtitle key
        groupedTasks[task.subtitle] = groupedTasks[task.subtitle] || [];
        groupedTasks[task.subtitle].push(task);
    });
    return groupedTasks;
};

const TaskCard = ({ projectName, tasks, onTaskPress }) => {
    const [isExpanded, setIsExpanded] = useState(false); // State for toggling project details

    return (
        <View style={styles.taskCard}>
            <Text style={styles.projectTitle}>{projectName}</Text>
            {tasks.map((task, index) => (
                <View key={task.id || index} style={styles.taskItem}>
                    <View style={styles.taskInfo}>
                        <Text style={styles.taskName}>{task.title}</Text>
                        {task.status === 'Completed' ? (
                            <View style={styles.remainingDaysContainer}>
                                <Text style={styles.remainingDays}>Completed</Text>
                            </View>
                        ) : (
                            <View style={styles.remainingDaysContainer}>
                                <Text style={styles.remainingDays}>Tersisa {task.remainingDays} Hari</Text>
                            </View>
                        )}
                    </View>
                    <TouchableOpacity style={styles.detailButton} onPress={() => onTaskPress(task)}>
                        <Text style={styles.detailButtonText}>Detail</Text>
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity
                style={styles.projectDetailButton}
                onPress={() => setIsExpanded(!isExpanded)} // Toggle the visibility
            >
                <Text style={styles.projectDetailButtonText}>
                    {isExpanded ? 'Sembunyikan detail proyek' : 'Lihat detail proyek'}
                </Text>
            </TouchableOpacity>
            {isExpanded && (
                <View style={styles.projectDetails}>
                    <Text style={styles.detailText}>Ditugaskan Oleh: Aa Dhanu</Text>
                    <Text style={styles.detailText}>Keterangan Proyek: Tidak ada Keterangan</Text>
                    <Text style={styles.detailText}>Durasi Proyek: 17 Tahun</Text>
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
    },
    remainingDaysContainer: {
        backgroundColor: '#C9F8C1',
        paddingHorizontal: 8,
        height: 22,
        borderRadius: 19,
        justifyContent: 'center',
        marginTop: 14,
        maxWidth: 150,
        alignSelf: 'flex-start',
    },
    remainingDays: {
        fontSize: 12,
        color: '#0A642E',
        fontFamily: 'Poppins-Medium',
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
        color: '#007AFF',
    },
    projectDetailButton: {
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    projectDetailButtonText: {
        fontSize: 14,
        color: '#007AFF',
    },
    projectDetails: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    detailText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 5,
    },
});

export default DetailTaskSection;
