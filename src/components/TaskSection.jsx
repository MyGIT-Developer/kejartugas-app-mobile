import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import TaskCardTugas from './TaskCardTugas';
import ShimmerTaskCard from './ShimmerTaskCard';
import { FONTS } from '../constants/fonts';

const TaskSection = ({
    title = '',
    tasks = [],
    isLoading = false,
    onProjectDetailPress = () => { },
    onTaskDetailPress = () => { },
    onSeeAllPress = () => { },
}) => {
    // Icon mapping for different task types
    const getIconForSection = (sectionTitle) => {
        const lowerTitle = sectionTitle.toLowerCase();
        if (lowerTitle.includes('pengerjaan')) return 'clock';
        if (lowerTitle.includes('peninjauan')) return 'eye';
        if (lowerTitle.includes('ditolak')) return 'x-circle';
        if (lowerTitle.includes('ditunda')) return 'pause-circle';
        if (lowerTitle.includes('selesai')) return 'check-circle';
        return 'inbox';
    };

    const getIconColor = (sectionTitle) => {
        const lowerTitle = sectionTitle.toLowerCase();
        if (lowerTitle.includes('pengerjaan')) return '#FF9500'; // Orange
        if (lowerTitle.includes('peninjauan')) return '#007AFF'; // Blue
        if (lowerTitle.includes('ditolak')) return '#FF3B30'; // Red
        if (lowerTitle.includes('ditunda')) return '#FFCC00'; // Yellow
        if (lowerTitle.includes('selesai')) return '#34C759'; // Green
        return '#8E8E93'; // Default gray
    };

    return (
        <View style={styles.section}>
            {isLoading ? (
                <ScrollView
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    {Array(3)
                        .fill()
                        .map((_, index) => (
                            <View key={index} style={index === 0 ? styles.firstCardContainer : null}>
                                <ShimmerTaskCard />
                            </View>
                        ))}
                </ScrollView>
            ) : tasks.length > 0 ? (
                <ScrollView
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    style={{ marginBottom: 150, width: '100%' }}
                >
                    {tasks
                    .slice(0, 5)
                    .map((task, index) => (
                        <View key={index} style={index === 0 ? styles.firstCardContainer : null}>
                            <TaskCardTugas
                                task={task}
                                onProjectDetailPress={onProjectDetailPress}
                                onTaskDetailPress={onTaskDetailPress}
                            />
                        </View>
                    ))}

                    <View style={styles.sectionHeader}>
                    <TouchableOpacity onPress={onSeeAllPress} style={styles.seeAllTextButton}>
                        <Text style={styles.seeAllText}>Lihat Semua Detail ({tasks.length})</Text>
                    </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <View style={styles.noTasksBox}>
                    <View style={styles.noTasksIcon}>
                        <Feather name={getIconForSection(title)} size={40} color={getIconColor(title)} />
                    </View>
                    <Text style={styles.noTasksText}>Tidak ada tugas {title.toLowerCase()}</Text>
                    <Text style={styles.noTasksSubtext}>
                        Tugas dengan status "{title.toLowerCase()}" akan muncul di sini ketika tersedia
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    section: {
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    sectionHeader: {
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    sectionTitle: {
        fontSize: FONTS.size.md,
        fontFamily: 'Poppins-SemiBold',
        color: '#1C1C1E',
        letterSpacing: 0.2,
    },
    seeAllTextButton: {
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal:0,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 4,
        backgroundColor: '#357ABD',
        width: '100%',
    },
    seeAllText: {
        color: '#fff',
        fontFamily: 'Poppins-Medium',
        fontSize: FONTS.size.md,
        letterSpacing: -0.5,
    },
    scrollViewContent: {
        gap: 10,
        paddingBottom: 75,
    },
    firstCardContainer: {
        paddingLeft: 0,
    },
    noTasksBox: {
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
    noTasksIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    noTasksText: {
        fontSize: FONTS.size.md,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    noTasksSubtext: {
        fontSize: FONTS.size.sm,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        lineHeight: 20,
        letterSpacing: 0.1,
        maxWidth: 280,
    },
});

export default TaskSection;
