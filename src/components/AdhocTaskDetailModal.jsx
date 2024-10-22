import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';

const TaskDetailSection = ({ title, children }) => (
    <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {children}
    </View>
);

const TimelineItem = ({ label, date, isLast }) => (
    <View style={styles.timelineItemContainer}>
        <View style={styles.timelineLeft}>
            <View style={[styles.timelineDot, label === 'Tenggat' && styles.timelineDotDeadline]} />
            {!isLast && <View style={styles.timelineConnector} />}
        </View>
        <View style={styles.timelineContent}>
            <Text style={styles.timelineLabel}>{label}</Text>
            <Text style={styles.timelineDate}>{date}</Text>
        </View>
    </View>
);

const AttachmentItem = ({ name, size, onDownload }) => (
    <View style={styles.attachmentItem}>
        <View style={styles.attachmentIconContainer}>
            <Feather name="file-text" size={20} color="#4A90E2" />
        </View>
        <View style={styles.attachmentInfo}>
            <Text style={styles.attachmentName}>{name}</Text>
            <Text style={styles.attachmentSize}>{size}</Text>
        </View>
        <TouchableOpacity onPress={onDownload} style={styles.downloadButton}>
            <Feather name="download" size={20} color="#4A90E2" />
        </TouchableOpacity>
    </View>
);

const BulletPoint = ({ text }) => (
    <View style={styles.bulletPoint}>
        <View style={styles.bullet} />
        <Text style={styles.bulletText}>{text}</Text>
    </View>
);

export const TaskDetailContent = ({ task, onSubmit }) => (
    <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
            <View style={styles.titleContainer}>
                <Text style={styles.title}>{task.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: task.statusColor }]}>
                    <Text style={[styles.statusText, { color: task.statusTextColor }]}>{task.status}</Text>
                </View>
            </View>
            <View style={styles.assignerContainer}>
                <Feather name="user" size={16} color="#666" />
                <Text style={styles.assignerText}>Ditugaskan oleh {task.assignedBy}</Text>
            </View>
        </View>

        {/* Timeline Section */}
        <TaskDetailSection title="Timeline">
            <View style={styles.timelineContainer}>
                <TimelineItem label="Mulai" date={task.startDate} />
                <TimelineItem label="Tenggat" date={task.dueDate} isLast />
            </View>
        </TaskDetailSection>

        {/* Description Section */}
        <TaskDetailSection title="Deskripsi Tugas">
            <View style={styles.descriptionCard}>
                <Text style={styles.descriptionText}>{task.description}</Text>
                <View style={styles.bulletPoints}>
                    {task.bulletPoints.map((point, index) => (
                        <BulletPoint key={index} text={point} />
                    ))}
                </View>
            </View>
        </TaskDetailSection>

        {/* Attachments Section */}
        <TaskDetailSection title="Lampiran">
            <View style={styles.attachmentsCard}>
                {task.attachments.map((attachment, index) => (
                    <AttachmentItem
                        key={index}
                        name={attachment.name}
                        size={attachment.size}
                        onDownload={attachment.onDownload}
                    />
                ))}
            </View>
        </TaskDetailSection>

        {/* Action Button */}
        <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
            <Text style={styles.submitButtonText}>Submit Tugas</Text>
        </TouchableOpacity>
    </ScrollView>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
        fontFamily: 'Poppins-SemiBold',
    },
    header: {
        marginBottom: 24,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    assignerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assignerText: {
        fontSize: 14,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    timelineContainer: {
        paddingLeft: 8,
    },
    timelineItemContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    timelineLeft: {
        width: 20,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4A90E2',
    },
    timelineDotDeadline: {
        backgroundColor: '#FF5252',
    },
    timelineConnector: {
        width: 2,
        height: 30,
        backgroundColor: '#E0E0E0',
        marginVertical: 4,
    },
    timelineContent: {
        marginLeft: 12,
        flex: 1,
        paddingBottom: 20,
    },
    timelineLabel: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    timelineDate: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    descriptionCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    descriptionText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontFamily: 'Poppins-Regular',
    },
    bulletPoints: {
        gap: 8,
    },
    bulletPoint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4A90E2',
    },
    bulletText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
        fontFamily: 'Poppins-Regular',
    },
    attachmentsCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 8,
        padding: 12,
    },
    attachmentIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    attachmentName: {
        fontSize: 14,
        color: '#333',
        marginBottom: 2,
        fontFamily: 'Poppins-Medium',
    },
    attachmentSize: {
        fontSize: 12,
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    downloadButton: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
    },
});
