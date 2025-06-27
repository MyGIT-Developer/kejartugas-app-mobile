import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import TaskCardTugas from './TaskCardTugas';
import ShimmerTaskCard from './ShimmerTaskCard';

const TaskSection = ({
    title = '',
    tasks = [],
    isLoading = false,
    onProjectDetailPress = () => {},
    onTaskDetailPress = () => {},
    onSeeAllPress = () => {},
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
        {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array(3)
                    .fill()
                    .map((_, index) => (
                        <ShimmerTaskCard key={index} />
                    ))}
            </ScrollView>
        ) : tasks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tasks.map((task, index) => (
                    <TaskCardTugas
                        key={index}
                        task={task}
                        onProjectDetailPress={onProjectDetailPress}
                        onTaskDetailPress={onTaskDetailPress}
                    />
                ))}
            </ScrollView>
        ) : (
            <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>Tidak ada tugas</Text>
            </View>
        )}
    </View>
);

const styles = StyleSheet.create({
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
        fontFamily: 'Poppins-Medium',
    },
    seeAllText: {
        color: '#0E509E',
        fontFamily: 'Poppins-Regular',
    },
    noTasksContainer: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noTasksText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
    },
});

export default TaskSection;
