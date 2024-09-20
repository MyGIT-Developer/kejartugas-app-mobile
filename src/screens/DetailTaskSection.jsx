import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const GRADIENT_COLORS = ['#0E509E', '#5FA0DC', '#9FD2FF'];

const TaskCard = ({ task, onTaskPress }) => (
    <View style={styles.taskCard}>
        <View style={styles.taskContent}>
            <Text style={styles.taskTitle} numberOfLines={2} ellipsizeMode="tail">
                {task.title}
            </Text>
            <Text style={styles.taskSubtitle} numberOfLines={1} ellipsizeMode="tail">
                {task.subtitle}
            </Text>
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{task.status}</Text>
            </View>
        </View>
        <TouchableOpacity style={styles.detailButton} onPress={() => onTaskPress(task)}>
            <Text style={styles.detailButtonText}>Lihat detail</Text>
        </TouchableOpacity>
    </View>
);

const DetailTaskSection = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { sectionTitle, tasks } = route.params || {};

    const handleTaskPress = (task) => {
        // Handle task press (e.g., navigate to task details or show modal)
        console.log('Task pressed:', task);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={GRADIENT_COLORS} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{sectionTitle || 'Tasks'}</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {tasks && tasks.length > 0 ? (
                    tasks.map((task, index) => <TaskCard key={index} task={task} onTaskPress={handleTaskPress} />)
                ) : (
                    <Text style={styles.noTasksText}>No tasks available</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F2F7',
    },
    header: {
        height: 125,
        paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    placeholder: {
        width: 24,
    },
    scrollContent: {
        padding: 16,
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
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Bold',
    },
    taskSubtitle: {
        fontSize: 14,
        marginBottom: 8,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
    },
    statusContainer: {
        backgroundColor: '#E9E9EB',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        fontSize: 12,
        color: '#8E8E93',
        fontFamily: 'Poppins-Medium',
    },
    detailButton: {
        marginTop: 12,
        alignSelf: 'flex-end',
    },
    detailButtonText: {
        fontSize: 14,
        color: '#007AFF',
        fontFamily: 'Poppins-Medium',
    },
    noTasksText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
    },
});

export default DetailTaskSection;
