import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getStatusBadgeColor } from '../utils/taskUtils';
import { FONTS } from '../constants/fonts';

const TaskCard = React.memo(({ task, onProjectDetailPress = () => {}, onTaskDetailPress = () => {} }) => {
    const {
        color: badgeColor,
        textColor: badgeTextColor,
        label: displayStatus,
    } = getStatusBadgeColor(task.task_status, task.end_date);

    const renderStatusOrDays = () => {
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
            <View style={styles.taskContent}>
                <Text style={styles.taskTitle} numberOfLines={2} ellipsizeMode="tail">
                    {task.task_name}
                </Text>
                <Text style={styles.taskSubtitle} numberOfLines={1} ellipsizeMode="tail">
                    {task.project_name}
                </Text>
            </View>
            {renderStatusOrDays()}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.detailButton} onPress={() => onTaskDetailPress(task)}>
                    <Text style={styles.detailButtonText}>Lihat detail {'>'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.projectButton} onPress={() => onProjectDetailPress(task)}>
                    <Text style={styles.projectButtonText}>Detail Proyek</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    taskCard: {
        backgroundColor: '#ffffffff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(199, 199, 204, 0.3)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginHorizontal: 10
    },
    taskContent: {
        flex: 1,
    },
    taskTitle: {
        fontSize: FONTS.size.md,
        color: '#000',
        marginBottom: 5,
        lineHeight: 22,
        fontFamily: 'Poppins-Bold',
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontFamily: 'Poppins-Regular',
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        position: 'absolute',
        bottom: 50,
        left: 10,
    },
    badgeText: {
        color: '#333',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
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
        // No additional styles needed
    },
    detailButtonText: {
        color: '#444444',
        marginTop: 20,
        fontSize: FONTS.size.sm,
        fontFamily: 'Poppins-Regular',
    },
    projectButton: {
        backgroundColor: '#3498db',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    projectButtonText: {
        color: 'white',
        fontSize: FONTS.size.sm,
        fontFamily: 'Poppins-Regular',
    },
});

export default TaskCard;
