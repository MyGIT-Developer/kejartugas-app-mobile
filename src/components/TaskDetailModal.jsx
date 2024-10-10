import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { ProgressCircle } from 'react-native-progress'; // Import ProgressCircle

const TaskDetailModal = ({ visible, onClose, taskDetails }) => {
    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <ScrollView>
                        <Text style={styles.title}>Detail Tugas</Text>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Informasi Umum</Text>
                            <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                            <View style={styles.progressContainer}>
                            <Progress.Circle
                                size={60}
                                progress={taskDetails.progress / 100}
                                thickness={6}
                                color={taskDetails.progress === 0 ? "#E0E0E0" : taskDetails.progress < 50 ? "#F69292" : taskDetails.progress < 75 ? "#F0E08A" : "#C9F8C1"} 
                                unfilledColor="#E8F5E9"
                                borderWidth={0}
                                showsText={true}
                                formatText={() => `${taskDetails.progress}%`}
                                textStyle={{
                                    fontFamily: 'Poppins-SemiBold',
                                    fontSize: 14,
                                    color: taskDetails.progress === 0 ? "#000000" : taskDetails.progress < 50 ? "#811616" : taskDetails.progress < 75 ? "#656218" : "#0A642E" // Text color based on progress
                                }}
                            />

                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Tanggal Mulai</Text>
                                <Text style={styles.value}>{taskDetails.startDate}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Tanggal Selesai</Text>
                                <Text style={styles.value}>{taskDetails.endDate}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Ditugaskan Oleh</Text>
                                <Text style={styles.value}>{taskDetails.assignedBy}</Text>
                            </View>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Informasi Pengumpulan</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Tanggal Pengumpulan</Text>
                                <Text style={styles.value}>{taskDetails.submissionDate}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Status Pengumpulan</Text>
                                <Text style={styles.value}>{taskDetails.submissionStatus}</Text>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Bukti Pengumpulan</Text>
                                <View style={styles.evidenceContainer}>
                                    <Text style={styles.evidenceText}>[Gambar Bukti]</Text>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <Text style={styles.label}>Keterangan</Text>
                                <Text style={styles.value}>
                                    {taskDetails.submissionDescription || 'Tidak ada keterangan tersedia'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity style={styles.commentButton} onPress={onClose}>
                            <Text style={styles.buttonText}>Tutup</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '90%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    taskTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    progressContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    label: {
        fontSize: 16,
        color: '#333',
    },
    value: {
        fontSize: 16,
        color: '#666',
    },
    evidenceContainer: {
        width: 100,
        height: 60,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 5,
    },
    evidenceText: {
        color: '#666',
    },
    commentButton: {
        backgroundColor: '#3498db',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TaskDetailModal;
