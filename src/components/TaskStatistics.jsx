import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Shimmer from './Shimmer';

const TaskStatisticsSkeleton = () => (
    <View style={styles.container}>
        <View style={styles.statItem}>
            <Shimmer width={50} height={50} style={styles.shimmerNumber} />
            <Shimmer width={35} height={14} style={styles.shimmerLabel} />
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
            <Shimmer width={50} height={50} style={styles.shimmerNumber} />
            <Shimmer width={60} height={14} style={styles.shimmerLabel} />
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
            <Shimmer width={50} height={50} style={styles.shimmerNumber} />
            <Shimmer width={45} height={14} style={styles.shimmerLabel} />
        </View>
        <View style={styles.separator} />
        <View style={styles.statItem}>
            <Shimmer width={50} height={50} style={styles.shimmerNumber} />
            <Shimmer width={40} height={14} style={styles.shimmerLabel} />
        </View>
    </View>
);

const TaskStatistics = ({ tasks, adhocTasks, isLoading = false }) => {
    // Show skeleton while loading
    if (isLoading) {
        return <TaskStatisticsSkeleton />;
    }

    // Calculate totals for regular tasks
    const regularTotalTasks = Object.values(tasks || {}).reduce((total, taskArray) => total + (taskArray?.length || 0), 0);
    const regularCompletedTasks = (tasks?.completed || []).length;
    const regularInProgressTasks = (tasks?.inProgress || []).length;
    const regularPendingReview = (tasks?.inReview || []).length;

    // Calculate totals for adhoc tasks
    const adhocTotalTasks = Object.values(adhocTasks || {}).reduce((total, taskArray) => total + (taskArray?.length || 0), 0);
    const adhocCompletedTasks = (adhocTasks?.completed || []).length;
    const adhocInProgressTasks = (adhocTasks?.inProgress || []).length;
    const adhocPendingReview = (adhocTasks?.inReview || []).length;

    // Combined totals
    const totalTasks = regularTotalTasks + adhocTotalTasks;
    const completedTasks = regularCompletedTasks + adhocCompletedTasks;
    const inProgressTasks = regularInProgressTasks + adhocInProgressTasks;
    const pendingReview = regularPendingReview + adhocPendingReview;

    return (
        <View style={styles.container}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTasks ? totalTasks : 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{inProgressTasks ? inProgressTasks : 0}</Text>
                <Text style={styles.statLabel}>Dikerjakan</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{pendingReview ? pendingReview : 0}</Text>
                <Text style={styles.statLabel}>Review</Text>
            </View>
            <View style={styles.separator} />
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedTasks ? completedTasks : 0}</Text>
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
        shadowColor: '#444',
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
    shimmerNumber: {
        borderRadius: 4,
        marginBottom: 4,
    },
    shimmerLabel: {
        borderRadius: 4,
    },
});

export {TaskStatistics, TaskStatisticsSkeleton};