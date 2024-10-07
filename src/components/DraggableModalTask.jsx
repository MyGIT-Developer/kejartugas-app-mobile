import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Modal, Animated } from 'react-native';
import * as Progress from 'react-native-progress';
import { useFonts } from '../utils/UseFonts';
import { useNavigation } from '@react-navigation/native';
import { fetchChatByTaskId } from '../api/task';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', label: 'Dalam Pengerjaan', textColor: '#282828' };
        case 'onReview':
            return { color: '#9AE1EA', label: 'Dalam Peninjauan', textColor: '#0D2E4B' };
        case 'rejected':
            return { color: '#F69292', label: 'Ditolak', textColor: '#811616' };
        case 'onHold':
            return { color: '#F69292', label: 'Ditunda', textColor: '#811616' };
        case 'Completed':
            return { color: '#C9F8C1', label: 'Selesai', textColor: '#0A642E' };
        case 'onPending':
            return { color: '#F0E08A', label: 'Tersedia', textColor: '#656218' };
        default:
            return { color: '#E0E0E0', label: status, textColor: '#000000' };
    }
};

const DraggableModalTask = ({ visible, onClose, taskDetails }) => {
    const navigation = useNavigation();
    const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fontsLoaded = useFonts();

    React.useEffect(() => {
        if (visible) {
            Animated.spring(modalY, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.spring(modalY, {
                toValue: SCREEN_HEIGHT,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    const handleClose = () => {
        Animated.spring(modalY, {
            toValue: SCREEN_HEIGHT,
            useNativeDriver: true,
        }).start(() => onClose());
    };
    const handleCommentPress = async () => {
        try {
            // Navigate to ChatInterface and pass the taskId and taskDetails
            navigation.navigate('ChatInterface', {
                taskId: taskDetails.id,
                taskDetails: taskDetails,
                taskSubtitle: taskDetails.subtitle, // Pass taskDetails here
                // chatData can be removed if not used in ChatInterface
            });
            onClose();
        } catch (error) {
            console.error('Error navigating to chat:', error.message);
            // Handle error (e.g., show an alert or notification)
        }
    };

    const handleSubmit = () => {
        navigation.navigate('SubmitTugas', { taskId: taskDetails.id });
        onClose(); // Close the modal after navigation
    };

    if (!fontsLoaded) {
        return null;
    }

    const { color: badgeColor, label: displayStatus, textColor } = getStatusBadgeColor(taskDetails.status);

    return (
        <Modal transparent={true} visible={visible} onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={handleClose} />
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        {
                            transform: [{ translateY: modalY }],
                        },
                    ]}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Detail Tugas</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.content}>
                        <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                                <Text style={[styles.statusText, { color: textColor }]}>{displayStatus}</Text>
                            </View>
                            <Progress.Circle
                                size={60}
                                progress={taskDetails.progress / 100}
                                thickness={6}
                                color="#27B44E"
                                unfilledColor="#E8F5E9"
                                borderWidth={0}
                                showsText={true}
                                formatText={() => `${taskDetails.progress}%`}
                                textStyle={styles.progressText}
                            />
                        </View>
                        <View style={styles.infoContainer}>
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
                                    <TouchableOpacity style={styles.commentButton} onPress={handleCommentPress}>
                                        <Text style={styles.commentButtonText}>Tulis Komentar</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Keterangan</Text>
                                    <ScrollView style={styles.descriptionScrollView}>
                                        <Text style={styles.infoValue}>
                                            {taskDetails.description || 'Tidak ada keterangan tersedia'}
                                        </Text>
                                    </ScrollView>
                                </View>
                            </View>
                        </View>
                        {taskDetails.status !== 'onReview' && ( // Conditional rendering for submit button
                            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                <Text style={styles.submitButtonText}>Submit Tugas</Text>
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </Animated.View>
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
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        padding: 20,
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
        width: 120,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10,
    },
    progressText: {
        fontFamily: 'Poppins-SemiBold',
        color: '#4CAF50',
        fontSize: 14,
    },
    infoContainer: {
        marginBottom: 10,
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
    descriptionScrollView: {
        maxHeight: 100,
    },
    commentButton: {
        backgroundColor: '#27A0CF',
        padding: 10,
        borderRadius: 6,
        alignSelf: 'flex-start',
        marginTop: 10,
        marginBottom: 15,
    },
    commentButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: 'white',
        fontSize: 14,
    },
    submitButton: {
        backgroundColor: '#27A0CF',
        padding: 15,
        width: 262,
        marginTop: 15,
        justifyContent: 'center',
        borderRadius: 30,
        alignItems: 'center',
        alignSelf: 'center',
    },
    submitButtonText: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: 14,
    },
});

export default DraggableModalTask;
