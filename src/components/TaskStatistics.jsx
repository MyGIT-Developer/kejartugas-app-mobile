import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TaskStatistics = ({ tasks, adhocTasks }) => {
    // Calculate totals for regular tasks
    const regularTotalTasks = Object.values(tasks).reduce((total, taskArray) => total + taskArray.length, 0);
    const regularCompletedTasks = tasks.completed.length;
    const regularInProgressTasks = tasks.inProgress.length;
    const regularPendingReview = tasks.inReview.length;

    // Calculate totals for adhoc tasks
    const adhocTotalTasks = Object.values(adhocTasks || {}).reduce((total, taskArray) => total + taskArray.length, 0);
    const adhocCompletedTasks = (adhocTasks?.completed || []).length;
    const adhocInProgressTasks = (adhocTasks?.inProgress || []).length;
    const adhocPendingReview = (adhocTasks?.inReview || []).length;

    // Combined totals
    const totalTasks = regularTotalTasks + adhocTotalTasks;
    const completedTasks = regularCompletedTasks + adhocCompletedTasks;
    const inProgressTasks = regularInProgressTasks + adhocInProgressTasks;
    const pendingReview = regularPendingReview + adhocPendingReview;

    if (totalTasks === 0) return null;

    return (
        <View style={styles.container}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTasks}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{inProgressTasks}</Text>
                <Text style={styles.statLabel}>Dikerjakan</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pendingReview}</Text>
                <Text style={styles.statLabel}>Review</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedTasks}</Text>
                <Text style={styles.statLabel}>Selesai</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#0E509E',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#666',
        textAlign: 'center',
    },
    separator: {
        width: 1,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 8,
    },
});

export default TaskStatistics;
