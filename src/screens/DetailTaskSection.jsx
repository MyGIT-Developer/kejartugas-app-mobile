import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView } from 'react-native';
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

const ShimmerCard = () => (
    <View style={styles.taskCard}>
        <View style={styles.taskContent}>
            <Text style={styles.taskTitle}>{/* Shimmer effect for title */}</Text>
            <Text style={styles.taskSubtitle}>{/* Shimmer effect for subtitle */}</Text>
            <View style={styles.statusContainer}>
                <Text style={styles.statusText}>{/* Shimmer effect for status */}</Text>
            </View>
        </View>
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
                    tasks.map((task, index) => (
                        <TaskCard key={task.id || index} task={task} onTaskPress={handleTaskPress} />
                    ))
                ) : (
                    <ShimmerCard /> // Use ShimmerCard when no tasks are available
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
        marginBottom: 10,
        alignSelf: 'center',
        fontFamily: 'Poppins-Bold',
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center horizontally
        paddingHorizontal: 20,
    },
    backButton: {
        position: 'absolute', // Absolute positioning for back button
        left: 0, // Move the back button further left
        top: 20, // Keep top positioning the same
    },
    placeholder: {
        width: 24, // Placeholder to ensure title is centered
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
