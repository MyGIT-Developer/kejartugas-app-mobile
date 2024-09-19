import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Shimmer from '../components/Shimmer';
import DetailProyekModal from '../components/ReusableBottomModal';
import { useFonts } from '../utils/UseFonts'; // Import the useFonts hook
import TaskDetailModal from '../components/TaskDetailModal'; // Import the standard modal

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const TaskCard = React.memo(({ title = '', subtitle = '', status = '', onProjectDetailPress, onTaskDetailPress }) => {
    const isShortContent = title.length <= 30 && subtitle.length <= 20;

    return (
        <View style={[styles.taskCard, isShortContent && styles.taskCardShort]}>
            <View style={styles.taskContent}>
                <Text
                    style={[styles.taskTitle, isShortContent && styles.taskTitleShort]}
                    numberOfLines={isShortContent ? 1 : 2}
                    ellipsizeMode="tail"
                >
                    {title}
                </Text>
                <Text
                    style={[styles.taskSubtitle, isShortContent && styles.taskSubtitleShort]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {subtitle}
                </Text>
            </View>
            <View style={[styles.statusBadge, isShortContent ? styles.statusBadgeShort : styles.statusBadgeLong]}>
                <Text
                    style={[styles.statusText, isShortContent && styles.statusTextShort]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {status}
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.detailButton} onPress={onTaskDetailPress}>
                    <Text style={styles.detailButtonText}>Lihat detail {'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.projectButton, isShortContent && styles.projectButtonShort]}
                    onPress={onProjectDetailPress}
                >
                    <Text style={[styles.projectButtonText, isShortContent && styles.projectButtonTextShort]}>
                        Detail Proyek
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const ShimmerTaskCard = ({ isShortContent = false }) => (
    <View style={styles.taskCard}>
        <Shimmer width={isShortContent ? 150 : 200} height={20} style={styles.shimmerTitle} />
        <Shimmer width={isShortContent ? 100 : 150} height={15} style={styles.shimmerSubtitle} />
        <Shimmer width={isShortContent ? 80 : 100} height={25} style={styles.shimmerStatus} />
        <Shimmer width={isShortContent ? 80 : 100} height={15} style={styles.shimmerButton} />
    </View>
);

const TaskSection = ({ title, tasks = [], isLoading = false, onProjectDetailPress, onTaskDetailPress }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {tasks.length > 1 && !isLoading && (
                <TouchableOpacity>
                    <Text style={styles.seeAllText}>Lihat semua</Text>
                </TouchableOpacity>
            )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading
                ? Array(3)
                      .fill()
                      .map((_, index) => <ShimmerTaskCard key={index} isShortContent={index % 2 === 0} />)
                : tasks.map((task, index) => (
                      <TaskCard
                          key={index}
                          title={task.title}
                          subtitle={task.subtitle}
                          status={task.status}
                          onProjectDetailPress={() => onProjectDetailPress(task)}
                          onTaskDetailPress={() => onTaskDetailPress(task)}
                      />
                  ))}
        </ScrollView>
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
    const [selectedTask, setSelectedTask] = useState(null);
    const [taskDetailModalVisible, setTaskDetailModalVisible] = useState(false);

    const fontsLoaded = useFonts(); // Call the useFonts hook

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = () => {
        setRefreshing(true);
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setTasks({
                inProgress: [
                    {
                        title: 'Task 1',
                        subtitle: 'KejarTugas',
                        status: 'Tersisa 10 Hari',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                    {
                        title: 'Pengembangan Platform E-learning Interaktif dengan Fitur Kecerdasan Buatan',
                        subtitle: 'KejarTugas - Revolusi Pendidikan Digital melalui Teknologi Adaptif',
                        status: 'Tersisa 5 Hari',
                        assignedBy: 'Jane Smith',
                        duration: '1 week',
                        description: 'Another project description',
                    },
                ],
                inReview: [
                    {
                        title: 'Analisis dan Optimalisasi Performa Aplikasi Mobile untuk Peningkatan Pengalaman Pengguna',
                        subtitle:
                            'KejarTugas - Meningkatkan Kecepatan dan Efisiensi Aplikasi Melalui Teknik Optimasi Lanjutan',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                    {
                        title: 'Implementasi Sistem Keamanan Cyber Terpadu untuk Infrastruktur Perusahaan',
                        subtitle: 'KejarTugas - Memperkuat Pertahanan Digital dengan Solusi Keamanan Multi-Lapisan',
                        status: 'Dalam Proses',
                        assignedBy: 'Jane Smith',
                        duration: '1 week',
                        description: 'Another project description',
                    },
                ],
                rejected: [
                    {
                        title: 'Pengembangan Aplikasi IoT untuk Manajemen Energi Pintar di Gedung Komersial',
                        subtitle: 'KejarTugas - Mengoptimalkan Konsumsi Energi melalui Teknologi Internet of Things',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
                postponed: [
                    {
                        title: 'Implementasi Sistem Analitik Big Data untuk Prediksi Tren Pasar dan Perilaku Konsumen',
                        subtitle:
                            'KejarTugas - Memanfaatkan Data Besar untuk Pengambilan Keputusan Bisnis yang Lebih Baik',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
                completed: [
                    {
                        title: 'Pengembangan Platform Blockchain untuk Manajemen Rantai Pasokan Transparan',
                        subtitle: 'KejarTugas - Meningkatkan Efisiensi dan Kepercayaan dalam Rantai Pasokan Global',
                        status: 'Selesai',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
            });
            setIsLoading(false);
            setRefreshing(false);
        }, 2000); // Simulate 2 second loading time
    };

    const handleProjectDetailPress = (project) => {
        setSelectedProject(project);
        setModalVisible(true); // Open the reusable modal for project details
    };

    const handleTaskDetailPress = (task) => {
        setSelectedTask(task);
        setTaskDetailModalVisible(true); // Open the standard modal for task details
    };

    if (!fontsLoaded) {
        return null; // Optionally, you can return a loading indicator here
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

                <View style={styles.content}>
                    <TaskSection
                        title="Dalam Pengerjaan"
                        tasks={tasks.inProgress}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                    />
                    <TaskSection
                        title="Dalam Peninjauan"
                        tasks={tasks.inReview}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                    />
                    <TaskSection
                        title="Ditolak"
                        tasks={tasks.rejected}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                    />
                    <TaskSection
                        title="Ditunda"
                        tasks={tasks.postponed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                    />
                    <TaskSection
                        title="Selesai"
                        tasks={tasks.completed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                        onTaskDetailPress={handleTaskDetailPress}
                    />
                </View>

                {/* Spacer View */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Standard Modal for Task Details */}
            {selectedTask && (
                <TaskDetailModal
                    visible={taskDetailModalVisible}
                    onClose={() => setTaskDetailModalVisible(false)}
                    taskDetails={selectedTask}
                />
            )}

            {/* Reusable Bottom Modal for Project Details */}
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
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
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
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
    seeAllText: {
        color: '#0E509E',
        fontFamily: 'Poppins-Regular', // Use the custom font
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
    taskCardShort: {
        height: 100,
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
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
    taskTitleShort: {
        fontSize: 18,
        marginBottom: 2,
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontFamily: 'Poppins-Regular', // Use the custom font
    },
    taskSubtitleShort: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular', // Use the custom font
    },
    statusBadge: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusBadgeShort: {
        position: 'absolute',
        top: 15,
        right: 15,
    },
    statusBadgeLong: {
        position: 'absolute',
        bottom: 50,
        left: 10,
    },
    statusText: {
        color: '#333',
        fontWeight: '500',
        fontSize: 12,
        fontFamily: 'Poppins-Regular', // Use the custom font
    },
    statusTextShort: {
        fontSize: 10,
        fontFamily: 'Poppins-Regular', // Use the custom font
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
    detailButtonText: {
        color: '#0E509E',
        fontWeight: '500',
        fontSize: 14,
        fontFamily: 'Poppins-Regular', // Use the custom font
    },
    projectButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    projectButtonShort: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
    },
    projectButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
        fontFamily: 'Poppins-Regular', // Use the custom font
    },
    projectButtonTextShort: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular', // Use the custom font
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
