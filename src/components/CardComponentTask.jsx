import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const CardComponentTask = ({ title, tasks }) => {
    return (
        <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            {tasks.map((task, index) => (
                <View key={index} style={styles.taskRow}>
                    <Text style={styles.taskText}>{task.name}</Text>
                    <TouchableOpacity style={styles.detailButton}>
                        <Text style={styles.detailButtonText}>Detail</Text>
                    </TouchableOpacity>
                </View>
            ))}
            <TouchableOpacity style={styles.viewDetailsLink}>
                <Text style={styles.viewDetailsText}>Lihat detail proyek ›</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        margin: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    taskRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    taskText: {
        fontSize: 14,
    },
    detailButton: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    detailButtonText: {
        fontSize: 12,
        color: '#333',
    },
    viewDetailsLink: {
        marginTop: 8,
    },
    viewDetailsText: {
        color: '#0066CC',
        fontSize: 14,
    },
});

export default CardComponentTask;
