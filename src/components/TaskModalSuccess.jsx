import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Dimensions, Image } from 'react-native';
import { useFonts } from '../utils/UseFonts';
import * as Progress from 'react-native-progress';
import { useNavigation } from '@react-navigation/native'; 

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const TaskModalSuccess = ({ visible, onClose, taskDetails }) => {
    const fontsLoaded = useFonts();
    const navigation = useNavigation();
    if (!fontsLoaded) {
        return null;
    }

    const handleCommentPress = async () => {
        try {
            // Navigate to ChatInterface and pass the taskId and taskDetails
            navigation.navigate('ChatInterface', {
                taskId: taskDetails.id,
                taskDetails: taskDetails,
                taskSubtitle: taskDetails.subtitle, // Pass taskDetails here
                // chatData can be removed if not used in ChatInterface
            });
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={onClose} />
                <View style={styles.bottomSheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Detail Tugas</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.content} contentContainerStyle={styles.scrollContentContainer}>
                        <Text style={styles.sectionTitle}>Informasi Umum</Text>
                        <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: taskDetails.statusColor }]}>
                                <Text style={styles.statusText}>{taskDetails.status}</Text>
                            </View>
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
                        <View style={styles.infoContainer}>
                            {/* General Information */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Tanggal Mulai</Text>
                                    <Text style={styles.infoValue}>{taskDetails.startDate}</Text>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Tanggal Selesai</Text>
                                    <Text style={styles.infoValue}>{taskDetails.endDate}</Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Ditugaskan Oleh</Text>
                                    <Text style={styles.infoValue}>{taskDetails.assignedBy}</Text>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Keterangan</Text>
                                    <Text style={styles.infoValue}>
                                        {taskDetails.description || 'Tidak ada keterangan tersedia'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                        {/* Collection Information */}
                        <Text style={styles.sectionTitle}>Informasi Pengumpulan</Text>
                        <View style={styles.infoContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Tanggal Pengumpulan</Text>
                                    <Text style={styles.infoValue}>{taskDetails.collectionDate}</Text>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Status Pengumpulan</Text>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: taskDetails.collectionStatusColor },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                { color: taskDetails.collectionStatusTextColor },
                                            ]}
                                        >
                                            {taskDetails.collectionStatus}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Bukti Pengumpulan</Text>
                                    {taskDetails.task_image ? (
                                        <Image
                                            source={{ uri: taskDetails.task_image }}
                                            style={styles.evidenceImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={styles.evidenceBox}>
                                            <Text style={styles.noImageText}>Tidak ada bukti</Text>
                                        </View>
                                    )}
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Keterangan</Text>
                                    <Text style={styles.infoValue}>
                                        {taskDetails.collectionDescription || 'Tidak ada keterangan tersedia'}
                                    </Text>
                                    <TouchableOpacity style={styles.commentButton} onPress={handleCommentPress}>
                                        <Text style={styles.commentButtonText}>Tulis Komentar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                        {/* Spacer for scrollability */}
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheet: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: SCREEN_HEIGHT * 0.8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
    },
    content: {
        padding: 20,
    },
    scrollContentContainer: {
        paddingBottom: 100, // Add space for scrolling
    },
    sectionTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        marginBottom: 10,
    },
    taskTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 20,
        marginBottom: 15,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        width: 120, // Set the width to 100
        height: 40, // Set the height to 30
        borderRadius: 10, // Set the border radius to 5
        justifyContent: 'center', // Center the text vertically
        alignItems: 'center', // Center the text horizontally
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        color: '#1f1f1f',
    },
    progressCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E8F5E9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressText: {
        fontFamily: 'Poppins-SemiBold',
        color: '#4CAF50',
        fontSize: 14,
    },
    infoContainer: {
        marginBottom: 20,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    infoColumn: {
        flex: 1,
        marginRight: 10,
    },
    infoLabel: {
        fontFamily: 'Poppins-Bold',
        color: '#000',
        marginBottom: 2,
        fontSize: 12,
    },
    infoValue: {
        fontFamily: 'Poppins-Regular',
        color: '#666',
        fontSize: 14,
    },
    evidenceImage: {
        width: '100%',
        height: 150,
        borderRadius: 8,
        marginTop: 5,
    },
    evidenceBox: {
        height: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        marginTop: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        fontFamily: 'Poppins-Regular',
        color: '#666',
        fontSize: 14,
    },
    commentButton: {
        backgroundColor: '#27A0CF',
        width: 150,
        height: 38,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-end', // Align the button to the right
        marginTop: 50, // Optional: Add some margin for spacing
    },
    commentButtonText: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: 14, // Updated font size
    },
    bottomSpacer: {
        height: 20, // Space at the bottom for scrolling
    },
});

export default TaskModalSuccess;
