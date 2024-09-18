import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Shimmer from '../components/Shimmer';
import DetailProyekModal from '../components/ReusableBottomModal';

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const TaskCard = React.memo(({ title, subtitle, status, onProjectDetailPress }) => (
    <View style={styles.taskCard}>
        <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>{title}</Text>
            <Text style={styles.taskSubtitle}>{subtitle}</Text>
        </View>
        <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{status}</Text>
        </View>
        <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.detailButton}>
                <Text style={styles.detailButtonText}>Lihat detail {'>'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.projectButton} onPress={onProjectDetailPress}>
                <Text style={styles.projectButtonText}>Detail Proyek</Text>
            </TouchableOpacity>
        </View>
    </View>
));

const ShimmerTaskCard = () => (
    <View style={styles.taskCard}>
        <Shimmer width={200} height={20} style={styles.shimmerTitle} />
        <Shimmer width={150} height={15} style={styles.shimmerSubtitle} />
        <Shimmer width={100} height={25} style={styles.shimmerStatus} />
        <Shimmer width={100} height={15} style={styles.shimmerButton} />
    </View>
);

const TaskSection = ({ title, tasks, isLoading, onProjectDetailPress }) => (
    <View style={styles.section}>
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <TouchableOpacity>
                <Text style={styles.seeAllText}>Lihat semua</Text>
            </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {isLoading
                ? Array(3)
                      .fill()
                      .map((_, index) => <ShimmerTaskCard key={index} />)
                : tasks.map((task, index) => (
                      <TaskCard
                          key={index}
                          title={task.title}
                          subtitle={task.subtitle}
                          status={task.status}
                          onProjectDetailPress={() => onProjectDetailPress(task)}
                      />
                  ))}
        </ScrollView>
    </View>
);

const Tugas = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState({
        inProgress: [],
        inReview: [],
        rejected: [],
        postponed: [],
        completed: [],
    });
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
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
                        title: 'Task 2',
                        subtitle: 'KejarTugas',
                        status: 'Tersisa 5 Hari',
                        assignedBy: 'Jane Smith',
                        duration: '1 week',
                        description: 'Another project description',
                    },
                ],
                inReview: [
                    {
                        title: 'Review 1',
                        subtitle: 'KejarTugas',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                    {
                        title: 'Review 2',
                        subtitle: 'KejarTugas',
                        status: 'Dalam Proses',
                        assignedBy: 'Jane Smith',
                        duration: '1 week',
                        description: 'Another project description',
                    },
                ],
                rejected: [
                    {
                        title: 'Ditolak 1',
                        subtitle: 'KejarTugas',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
                postponed: [
                    {
                        title: 'Ditunda 1',
                        subtitle: 'KejarTugas',
                        status: 'Menunggu',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
                completed: [
                    {
                        title: 'Selesai 1',
                        subtitle: 'KejarTugas',
                        status: 'Selesai',
                        assignedBy: 'John Doe',
                        duration: '2 weeks',
                        description: 'Project description here',
                    },
                ],
            });
            setIsLoading(false);
        }, 2000); // Simulate 2 second loading time
    }, []);

    const handleProjectDetailPress = (project) => {
        setSelectedProject(project);
        setModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
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
                    />
                    <TaskSection
                        title="Dalam Peninjauan"
                        tasks={tasks.inReview}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                    />
                    <TaskSection
                        title="Ditolak"
                        tasks={tasks.rejected}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                    />
                    <TaskSection
                        title="Ditunda"
                        tasks={tasks.postponed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                    />
                    <TaskSection
                        title="Selesai"
                        tasks={tasks.completed}
                        isLoading={isLoading}
                        onProjectDetailPress={handleProjectDetailPress}
                    />
                </View>

                {/* Spacer View */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

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
    },
    seeAllText: {
        color: '#0E509E',
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 19,
        padding: 20,
        marginRight: 15,
        width: 312,
        height: 140, // Increased height to accommodate new button
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    taskContent: {
        marginBottom: 15,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#666',
    },
    statusBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#333',
        fontWeight: '500',
        fontSize: 12,
    },
    detailButton: {
        // Remove position: 'absolute' and adjust as needed
    },
    detailButtonText: {
        color: '#0E509E',
        fontWeight: '500',
        fontSize: 14,
    },
    projectButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    projectButtonText: {
        color: 'white',
        fontWeight: '500',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
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
        height: 100, // Adjust this value as needed
    },
});

export default Tugas;
