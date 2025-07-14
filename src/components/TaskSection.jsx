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
    onProjectDetailPress = () => {},
    onTaskDetailPress = () => {},
    onSeeAllPress = () => {},
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

    return (
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
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    style={styles.scrollView}
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
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollViewContent}
                    style={styles.scrollView}
                >
                    {tasks.map((task, index) => (
                        <View key={index} style={index === 0 ? styles.firstCardContainer : null}>
                            <TaskCardTugas
                                task={task}
                                onProjectDetailPress={onProjectDetailPress}
                                onTaskDetailPress={onTaskDetailPress}
                            />
                        </View>
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.noTasksBox}>
                    <View style={styles.noTasksIcon}>
                        <Feather name={getIconForSection(title)} size={48} color="#8E8E93" />
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
        marginBottom: 24,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F2F2F7',
    },
    sectionTitle: {
        fontSize: FONTS.size.md,
        fontFamily: 'Poppins-SemiBold',
        color: '#1C1C1E',
        letterSpacing: 0.2,
    },
    seeAllText: {
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        letterSpacing: 0.1,
    },
    scrollView: {
        marginHorizontal: -20,
    },
    scrollViewContent: {
        paddingHorizontal: 20,
        paddingRight: 40,
    },
    firstCardContainer: {
        paddingLeft: 0,
    },
    noTasksBox: {
        backgroundColor: '#F8FAFC',
        paddingVertical: 40,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(199, 199, 204, 0.3)',
        marginHorizontal: -20,
        marginBottom: -20,
    },
    noTasksIcon: {
        marginBottom: 16,
        opacity: 0.6,
    },
    noTasksText: {
        fontSize: 16,
        color: '#1C1C1E',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    noTasksSubtext: {
        fontSize: 14,
        color: '#8E8E93',
        fontFamily: 'Poppins-Regular',
        textAlign: 'center',
        lineHeight: 20,
        letterSpacing: 0.1,
        maxWidth: 280,
    },
});

export default TaskSection;
