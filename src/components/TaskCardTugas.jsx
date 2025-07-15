import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getStatusBadgeColor } from '../utils/taskUtils';
import { FONTS } from '../constants/fonts';

const TaskCard = React.memo(({ task, onProjectDetailPress = () => { }, onTaskDetailPress = () => { } }) => {
    const {
        color: badgeColor,
        textColor: badgeTextColor,
        label: displayStatus,
    } = getStatusBadgeColor(task.task_status, task.end_date);

    return (
        <View style={styles.taskCard}>
            <View style={styles.header}>
                <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={2}>
                        {task.task_name}
                    </Text>
                    <Text style={styles.taskSubtitle} numberOfLines={1}>
                        {task.project_name}
                    </Text>
                </View>
            </View>

            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                <Text style={[styles.badgeText, { color: badgeTextColor }]}>
                    {displayStatus}
                </Text>
            </View>

            <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => onTaskDetailPress(task)}>
                    <Text style={styles.detailButtonText}>Lihat Detail &gt;</Text>
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
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    taskInfo: {
        flex: 1,
        paddingRight: 12,
    },
    taskTitle: {
        fontSize: FONTS.size.md,
        color: '#111',
        fontFamily: 'Poppins-Bold',
        marginBottom: 4,
    },
    taskSubtitle: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    badge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        alignItems: 'center',
        marginTop: 4,
    },
    detailButtonText: {
        color: '#444',
        fontSize: FONTS.size.sm,
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.5,
    },
    projectButton: {
        backgroundColor: '#357ABD',
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
    },
    projectButtonText: {
        color: '#fff',
        fontSize: FONTS.size.sm,
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.5,
    },
});

export default TaskCard;
