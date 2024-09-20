import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Shimmer from '../components/Shimmer';
import DetailProyekModal from '../components/ReusableBottomModal';
import DraggableModalTask from '../components/DraggableModalTask';
import { useNavigation } from '@react-navigation/native';

import { useFonts } from '../utils/UseFonts';
const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const TaskCard = React.memo(({ task = {}, onProjectDetailPress, onTaskDetailPress }) => {
    const isShortContent = task.title.length <= 30 && task.subtitle.length <= 20;

    return (
        <View style={[styles.taskCard, isShortContent && styles.taskCardShort]}>
            <View style={styles.taskContent}>
                <Text
                    style={[styles.taskTitle, isShortContent && styles.taskTitleShort]}
                    numberOfLines={isShortContent ? 1 : 2}
                    ellipsizeMode="tail"
                >
                    {task.title}
                </Text>
                <Text
                    style={[styles.taskSubtitle, isShortContent && styles.taskSubtitleShort]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {task.subtitle}
                </Text>
            </View>
            <View style={[styles.statusBadge, isShortContent ? styles.statusBadgeShort : styles.statusBadgeLong]}>
                <Text
                    style={[styles.statusText, isShortContent && styles.statusTextShort]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {task.status}
                </Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.detailButton} onPress={() => onTaskDetailPress(task)}>
                    <Text style={styles.detailButtonText}>Lihat detail {'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.projectButton, isShortContent && styles.projectButtonShort]}
                    onPress={() => onProjectDetailPress(task)}
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

const TaskSection = ({
    title,
    tasks = [],
    isLoading = false,
    onProjectDetailPress,
    onTaskDetailPress,
    onSeeAllPress,
}) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {tasks.length > 1 && !isLoading && (
                <TouchableOpacity onPress={onSeeAllPress}>
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
                          task={task}
                          onProjectDetailPress={onProjectDetailPress}
                          onTaskDetailPress={onTaskDetailPress}
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
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);

    const navigation = useNavigation();

    const fontsLoaded = useFonts();
    const handleSeeAllPress = (sectionTitle, tasks) => {
        navigation.navigate('DetailTaskSection', { sectionTitle, tasks });
    };
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
                        id: 1,
                        title: 'Pengembangan Fitur Baru',
                        subtitle: 'Aplikasi Mobile KejarTugas',
                        status: 'Dalam Proses',
                        assignedBy: 'Aa Dhanu',
                        startDate: 'Sep 15, 2024',
                        endDate: 'Oct 15, 2024',
                        duration: '15 hari',
                        description: 'Mengembangkan fitur notifikasi real-time untuk meningkatkan engagement pengguna.',
                        progress: 60,
                    },
                    {
                        id: 2,
                        title: 'Optimalisasi Database',
                        subtitle: 'Proyek Backend KejarTugas',
                        status: 'Urgent',
                        assignedBy: 'Budi Prakoso',
                        startDate: 'Sep 10, 2024',
                        endDate: 'Sep 25, 2024',
                        duration: '60 hari menjelang project selesai',
                        description: 'Meningkatkan performa query dan mengurangi waktu respons server.',
                        progress: 40,
                    },
                ],
                inReview: [
                    {
                        id: 3,
                        title: 'Desain UI Dashboard',
                        subtitle: 'Redesign Antarmuka KejarTugas',
                        status: 'Menunggu Review',
                        assignedBy: 'Citra Dewi',
                        startDate: 'Sep 05, 2024',
                        endDate: 'Sep 20, 2024',
                        description: 'Membuat desain baru untuk dashboard admin dengan fokus pada UX yang lebih baik.',
                        progress: 100,
                    },
                ],
                rejected: [
                    {
                        id: 4,
                        title: 'Integrasi Payment Gateway',
                        subtitle: 'Sistem Pembayaran KejarTugas',
                        status: 'Ditolak',
                        assignedBy: 'Dian Sastro',
                        startDate: 'Aug 20, 2024',
                        endDate: 'Sep 10, 2024',
                        description: 'Proposal integrasi ditolak karena masalah keamanan. Perlu revisi.',
                        progress: 0,
                    },
                ],
                postponed: [
                    {
                        id: 5,
                        title: 'Implementasi AI Chatbot',
                        subtitle: 'Fitur Bantuan KejarTugas',
                        status: 'Ditunda',
                        assignedBy: 'Eko Patrio',
                        startDate: 'Oct 01, 2024',
                        endDate: 'Nov 15, 2024',
                        description:
                            'Proyek ditunda karena perlu penelitian lebih lanjut tentang teknologi AI yang sesuai.',
                        progress: 0,
                    },
                ],
                completed: [
                    {
                        id: 6,
                        title: 'Migrasi Server',
                        subtitle: 'Infrastruktur KejarTugas',
                        status: 'Selesai',
                        assignedBy: 'Fajar Sadboy',
                        startDate: 'Aug 01, 2024',
                        endDate: 'Aug 15, 2024',
                        description: 'Migrasi server ke cloud berhasil dilakukan tanpa downtime.',
                        progress: 100,
                    },
                    {
                        id: 7,
                        title: 'Migrasi Server',
                        subtitle: 'Infrastruktur KejarTugas',
                        status: 'Selesai',
                        assignedBy: 'Fajar Sadboy',
                        startDate: 'Aug 01, 2024',
                        endDate: 'Aug 15, 2024',
                        description: 'Migrasi server ke cloud berhasil dilakukan tanpa downtime.',
                        progress: 100,
                    },
                ],
            });
            setIsLoading(false);
            setRefreshing(false);
        }, 2000); // Simulate 2 second loading time
    };

    const handleProjectDetailPress = (project) => {
        setSelectedProject(project);
        setModalVisible(true);
    };

    const handleTaskDetailPress = (task) => {
        setSelectedTask(task);
        setDraggableModalVisible(true);
    };

    if (!fontsLoaded) {
        return null;
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
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            <DraggableModalTask
                visible={draggableModalVisible}
                onClose={() => setDraggableModalVisible(false)}
                taskDetails={selectedTask || {}}
            />

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
