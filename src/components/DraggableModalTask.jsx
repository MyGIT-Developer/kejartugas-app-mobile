import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    Modal,
    Image,
    Animated,
    TextInput,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useFonts } from '../utils/UseFonts';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { approveTask, rejectTask } from '../api/task';
import ReusableAlertBottomPopUp from './ReusableBottomPopUp';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#aeaeae', label: 'Dalam Pengerjaan', textColor: '#000000' };
        case 'onReview':
            return { color: '#f6e092', label: 'Dalam Peninjauan', textColor: '#ee9000' };
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

const RejectConfirmationModal = ({ visible, onConfirm, onCancel }) => {
    const [rejectionReason, setRejectionReason] = useState('');

    const handleConfirm = () => {
        onConfirm(rejectionReason);
        setRejectionReason('');
    };

    return (
        <Modal transparent={true} visible={visible} onRequestClose={onCancel} animationType="fade">
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Konfirmasi Penolakan</Text>
                    <Text style={styles.modalText}>Apakah Anda yakin ingin menolak tugas ini?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Alasan penolakan"
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        multiline
                    />
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                            <Text style={styles.buttonText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, !rejectionReason && styles.disabledButton]}
                            onPress={handleConfirm}
                            disabled={!rejectionReason}
                        >
                            <Text style={styles.buttonText}>Konfirmasi</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const DraggableModalTask = ({ visible, onClose, taskDetails }) => {
    const navigation = useNavigation();
    const modalY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fontsLoaded = useFonts();
    const [employeeId, setEmployeeId] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);

    const isWorkingOnIt = taskDetails.status === 'workingOnIt';
    const isOnHold = taskDetails.status === 'onHold';

    const startButtonStyle = [styles.submitButton, isWorkingOnIt ? styles.grayButton : styles.greenButton];

    const pauseButtonStyle = [styles.submitButton, isWorkingOnIt ? styles.redButton : styles.grayButton];

    const getData = async () => {
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            setEmployeeId(employeeId);
        } catch (error) {
            console.error('Error getting employeeId:', error.message);
        }
    };

    useEffect(() => {
        getData();
    }, []);

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

    const handleReject = async (rejectionReason) => {
        try {
            const response = await rejectTask(taskDetails.id, rejectionReason);
            onClose();
            setAlert({
                show: true,
                type: 'success',
                message: response.message,
            });
        } catch (error) {
            console.error('Error rejecting task:', error.message);
            setAlert({
                show: true,
                type: 'error',
                message: error.message,
            });
        }
        setIsRejectModalVisible(false);
    };

    const handleApprove = async () => {
        try {
            const response = await approveTask(taskDetails.id);
            onClose();

            setAlert({
                show: true,
                type: 'success',
                message: response.message,
            });
        } catch (error) {
            console.error('Error approving task:', error.message);
            // Handle error (e.g., show an alert or notification)
            setAlert({
                show: true,
                type: 'error',
                message: error.message,
            });
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    const { color: badgeColor, label: displayStatus, textColor } = getStatusBadgeColor(taskDetails.status);

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    return (
        <Modal transparent={true} visible={visible} onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={handleClose} />
                <View style={styles.bottomSheet}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Detail Tugas</Text>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>X</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.content}>
                        <View style={styles.statusContainer}>
                            <View style={styles.taskHeader}>
                                <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                                <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                                    <Text style={[styles.statusText, { color: textColor }]}>{displayStatus}</Text>
                                </View>
                            </View>

                            <Progress.Circle
                                size={75}
                                progress={taskDetails.progress}
                                thickness={6}
                                color={
                                    taskDetails.progress === 0
                                        ? '#E0E0E0'
                                        : taskDetails.progress < 50
                                        ? '#F69292'
                                        : taskDetails.progress < 75
                                        ? '#F0E08A'
                                        : '#C9F8C1'
                                }
                                unfilledColor="#E8F5E9"
                                borderWidth={0}
                                showsText={true}
                                formatText={() => `${taskDetails.progress}%`}
                                textStyle={{
                                    fontFamily: 'Poppins-SemiBold',
                                    fontSize: 14,
                                    color:
                                        taskDetails.progress === 0
                                            ? '#000000'
                                            : taskDetails.progress < 50
                                            ? '#811616'
                                            : taskDetails.progress < 75
                                            ? '#656218'
                                            : '#0A642E', // Text color based on progress
                                }}
                            />
                        </View>
                        <Text style={styles.sectionTitle}>Informasi Umum</Text>
                        <View style={styles.infoContainer}>
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Tanggal Mulai</Text>
                                    <Text style={styles.infoValue}>{formatDate(taskDetails.startDate)}</Text>
                                </View>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Tanggal Selesai</Text>
                                    <Text style={styles.infoValue}>{formatDate(taskDetails.endDate)}</Text>
                                </View>
                            </View>
                            <View style={styles.infoRow}>
                                <View style={styles.infoColumn}>
                                    <Text style={styles.infoLabel}>Ditugaskan Oleh</Text>
                                    <Text style={styles.infoValue}>{taskDetails.assignedByName}</Text>
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
                            {/* Collection Information */}
                            <Text style={styles.sectionTitle}>Informasi Pengumpulan</Text>
                            <View style={styles.infoContainer}>
                                <View style={styles.infoRow}>
                                    <View style={styles.infoColumn}>
                                        <Text style={styles.infoLabel}>Tanggal Pengumpulan</Text>
                                        <Text style={styles.infoValue}>{formatDate(taskDetails.collectionDate)}</Text>
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
                                    </View>
                                </View>
                            </View>
                            {/* <View
                                style={[
                                    styles.buttonContainer,
                                    { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#a0a0a0' },
                                ]}
                            >
                                <TouchableOpacity
                                    style={startButtonStyle}
                                    // onPress={() => handleSubmit('start')}
                                    disabled={isWorkingOnIt}
                                >
                                    <Text style={styles.submitButtonText}>Mulai</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={pauseButtonStyle}
                                    // onPress={() => handleSubmit('pause')}
                                    disabled={isOnHold}
                                >
                                    <Text style={styles.submitButtonText}>Tunda</Text>
                                </TouchableOpacity>
                            </View> */}
                        </View>
                        <View style={styles.actionContainer}>
                            <TouchableOpacity style={styles.commentButton} onPress={handleCommentPress}>
                                <Feather name="message-square" size={16} color="white" />
                                <Text style={styles.commentButtonText}>Komentar</Text>
                            </TouchableOpacity>
                            
                            {taskDetails.status !== 'onReview' &&
                                taskDetails.assignedEmployees?.some((employee) => employee.employeeId === employeeId) && (
                                    <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                                        <Text style={styles.submitButtonText}>Submit Tugas</Text>
                                    </TouchableOpacity>
                                )}

                            {taskDetails.status === 'onReview' && taskDetails.assignedById == employeeId && (
                                <View style={styles.reviewButtonContainer}>
                                    <TouchableOpacity
                                        style={[styles.submitButton, styles.rejectButton]}
                                        onPress={() => setIsRejectModalVisible(true)}
                                    >
                                        <Text style={styles.submitButtonText}>Tolak</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.submitButton, styles.approveButton]}
                                        onPress={handleApprove}
                                    >
                                        <Text style={styles.submitButtonText}>Setujui</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        
                        <View style={styles.bottomSpacer} />
                    </ScrollView>
                </View>
            </View>
            <RejectConfirmationModal
                visible={isRejectModalVisible}
                onConfirm={handleReject}
                onCancel={() => setIsRejectModalVisible(false)}
            />
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
    taskHeader: {
        flexDirection: 'column',
    },
    taskTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
    },
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusBadge: {
        padding: 10,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
    },
    progressText: {
        fontFamily: 'Poppins-SemiBold',
        color: '#4CAF50',
        fontSize: 14,
    },
    sectionTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        marginBottom: 10,
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
    actionContainer: {
        paddingVertical: 20, // Adjusted padding to make space around buttons more consistent
        paddingHorizontal: 10, // Added horizontal padding
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 10, // Add space between buttons
    },
    commentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#27A0CF',
        justifyContent: 'center',
        borderRadius: 14,
        padding: 10,
    },
    commentButtonText: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: 14,
        marginLeft: 5,
    },
    submitButton: {
        backgroundColor: '#27A0CF',
        borderRadius: 30,
        alignItems: 'center',
        padding: 10,
    },
    reviewButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%', // Make sure buttons take the full width of the container
    },
    rejectButton: {
        backgroundColor: '#FF6B6B',
        flex: 1,
        marginRight: 5,
    },
    approveButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
        marginLeft: 5,
    },
    submitButtonText: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: 14,
        textAlign: 'center', // Center text inside the buttons
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 20,
        paddingVertical: 30,
        paddingHorizontal: 25,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        width: '85%',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    modalText: {
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22, // Improve readability
        color: '#4A4A4A', // Subtle text color
    },
    input: {
        height: 100,
        borderColor: '#ccc', // Lighter border color for inactive state
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        width: '100%',
        marginBottom: 20,
        backgroundColor: '#F9F9F9', // Subtle background color for the input
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    button: {
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 15,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#A0A0A0',
    },
    confirmButton: {
        backgroundColor: '#FF6B6B',
    },
    disabledButton: {
        backgroundColor: '#D3D3D3',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
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
    bottomSpacer: {
        height: 20, // Space at the bottom for scrolling
    },
});

export default DraggableModalTask;
