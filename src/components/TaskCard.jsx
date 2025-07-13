import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusBadgeColor, getStatusAppearance } from '../utils/taskUtils';

const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

const TaskCard = ({ projectName, tasks }) => {
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
            {tasks.slice(0, 3).map((task, index) => (
                <View style={styles.taskSection} key={task.id || index}>
                    <View style={styles.taskItem}>
                        <View style={styles.taskInfo}>
                            <Text style={styles.taskName}>{truncateText(task.task_name, 50)}</Text>
                            <Text style={styles.taskDueDate}>Due: {formatDate(task.end_date)}</Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: getStatusAppearance(task.task_status).color }]}>
                            <Text
                                style={[styles.badgeText, { color: getStatusAppearance(task.task_status).textColor }]}
                            >
                                {getStatusAppearance(task.task_status).label}
                            </Text>
                        </View>
                    </View>
                    {task.task_status === 'workingOnIt' && renderStatusOrDays(task)}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    taskCard: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    projectTitle: {
        fontSize: 14,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
    },
    taskSection: {
        marginTop: 12,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#E9E9EB',
        gap: 10,
    },
    taskItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    taskInfo: {
        flex: 1,
        marginRight: 10,
        gap: 10,
    },
    taskName: {
        fontSize: 12,
        color: '#1C1C1E',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    taskDueDate: {
        fontSize: 12,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    badgeText: {
        fontSize: 10,
        fontFamily: 'Poppins-SemiBold',
    },
});

export default TaskCard;
