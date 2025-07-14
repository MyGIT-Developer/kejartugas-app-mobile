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
    Easing,
    TextInput,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useFonts } from '../utils/UseFonts';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { approveTask, rejectTask } from '../api/task';
import { LinearGradient } from 'expo-linear-gradient';
const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'workingOnIt':
            return {
                color: ['#E8F5E9', '#C8E6C9'],
                label: 'Dalam Pengerjaan',
                textColor: '#2E7D32',
                icon: 'work-outline',
            };
        case 'onReview':
            return {
                color: ['#FFF8E1', '#FFECB3'],
                label: 'Dalam Peninjauan',
                textColor: '#F57C00',
                icon: 'visibility',
            };
        case 'rejected':
            return {
                color: ['#FFEBEE', '#FFCDD2'],
                label: 'Ditolak',
                textColor: '#D32F2F',
                icon: 'cancel',
            };
        case 'onHold':
            return {
                color: ['#FFF3E0', '#FFE0B2'],
                label: 'Ditunda',
                textColor: '#F57C00',
                icon: 'pause-circle-outline',
            };
        case 'Completed':
            return {
                color: ['#E8F5E9', '#C8E6C9'],
                label: 'Selesai',
                textColor: '#2E7D32',
                icon: 'check-circle',
            };
        case 'onPending':
            return {
                color: ['#F3E5F5', '#E1BEE7'],
                label: 'Tersedia',
                textColor: '#7B1FA2',
                icon: 'schedule',
            };
        default:
            return {
                color: ['#F5F5F5', '#EEEEEE'],
                label: status,
                textColor: '#424242',
                icon: 'help-outline',
            };
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
                    <View style={styles.modalIconContainer}>
                        <MaterialIcons name="warning" size={48} color="#FF6B6B" />
                    </View>
                    <Text style={styles.modalTitle}>Konfirmasi Penolakan</Text>
                    <Text style={styles.modalText}>Apakah Anda yakin ingin menolak tugas ini?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Alasan penolakan (wajib diisi)"
                        placeholderTextColor="#999"
                        value={rejectionReason}
                        onChangeText={setRejectionReason}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                            <Text style={styles.buttonText}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.button,
                                styles.confirmButton,
                                !rejectionReason.trim() && styles.disabledButton,
                            ]}
                            onPress={handleConfirm}
                            disabled={!rejectionReason.trim()}
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

    const ANIMATION_DURATION = 600; // Increased duration for smoother effect

    const handleClose = () => {
        Animated.timing(modalY, {
            toValue: SCREEN_HEIGHT,
            duration: ANIMATION_DURATION,
            easing: Easing.out(Easing.cubic), // Changed easing function
            useNativeDriver: true,
        }).start(({ finished }) => {
            if (finished) {
                onClose();
            }
        });
    };

    // Add this listener to track the animation progress
    useEffect(() => {
        const listener = modalY.addListener(({ value }) => {});

        return () => {
            modalY.removeListener(listener);
        };
    }, []);

    // Don't forget to remove the listener when the component unmounts
    useEffect(() => {
        if (visible) {
            modalY.setValue(SCREEN_HEIGHT);
            Animated.spring(modalY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        }
    }, [visible]);

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
            // Success feedback could be handled by parent component
            console.log('Task rejected successfully:', response.message);
        } catch (error) {
            console.error('Error rejecting task:', error.message);
            // Error feedback could be handled by parent component
        }
        setIsRejectModalVisible(false);
    };

    const handleApprove = async () => {
        try {
            const response = await approveTask(taskDetails.id);
            onClose();
            console.log('Task approved successfully:', response.message);
        } catch (error) {
            console.error('Error approving task:', error.message);
            // Error feedback could be handled by parent component
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    const { color: badgeColor, label: displayStatus, textColor, icon } = getStatusBadgeColor(taskDetails.status);

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    const getProgressColor = (progress) => {
        if (progress === 0) return '#E0E0E0';
        if (progress < 30) return '#FF6B6B';
        if (progress < 70) return '#FFA726';
        return '#4CAF50';
    };

    const getProgressTextColor = (progress) => {
        if (progress === 0) return '#666';
        if (progress < 30) return '#D32F2F';
        if (progress < 70) return '#F57C00';
        return '#2E7D32';
    };

    return (
        <Modal transparent={true} visible={visible} onRequestClose={handleClose}>
            <View style={styles.modalContainer}>
                <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
                <Animated.View
                    style={[
                        styles.bottomSheetContainer,
                        {
                            transform: [{ translateY: modalY }],
                        },
                    ]}
                >
                    <View style={styles.bottomSheet}>
                        {/* Handle bar */}
                        <View style={styles.handleContainer}>
                            <View style={styles.handle} />
                        </View>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerContent}>
                                <MaterialIcons name="assignment" size={24} color="#27A0CF" />
                                <Text style={styles.title}>Detail Tugas</Text>
                            </View>
                            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            {/* Task Header with Status */}
                            <View style={styles.taskHeaderSection}>
                                <View style={styles.taskTitleContainer}>
                                    <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                                    <LinearGradient
                                        colors={badgeColor}
                                        style={styles.statusBadge}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <MaterialIcons name={icon} size={16} color={textColor} />
                                        <Text style={[styles.statusText, { color: textColor }]}>{displayStatus}</Text>
                                    </LinearGradient>
                                </View>

                                {/* Progress Circle */}
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressWrapper}>
                                        <Progress.Circle
                                            size={85}
                                            progress={taskDetails.progress / 100}
                                            thickness={8}
                                            color={getProgressColor(taskDetails.progress)}
                                            unfilledColor="#F5F5F5"
                                            borderWidth={0}
                                            showsText={true}
                                            formatText={() => `${taskDetails.progress}%`}
                                            textStyle={{
                                                fontFamily: 'Poppins-Bold',
                                                fontSize: 16,
                                                color: getProgressTextColor(taskDetails.progress),
                                            }}
                                        />
                                        {taskDetails.status === 'Completed' && (
                                            <View style={styles.completionOverlay}>
                                                <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.progressLabelContainer}>
                                        <Text style={styles.progressLabel}>
                                            {taskDetails.status === 'Completed' ? 'Selesai' : 'Progress'}
                                        </Text>
                                        {taskDetails.status === 'Completed' && (
                                            <View style={styles.completedBadge}>
                                                <MaterialIcons name="verified" size={16} color="#4CAF50" />
                                                <Text style={styles.completedBadgeText}>100% Selesai</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* General Information Section */}
                            <View style={styles.section}>
                                <View style={styles.sectionHeader}>
                                    <MaterialIcons name="info-outline" size={20} color="#27A0CF" />
                                    <Text style={styles.sectionTitle}>Informasi Umum</Text>
                                </View>
                                <View style={styles.infoCard}>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoColumn}>
                                            <View style={styles.infoItem}>
                                                <Ionicons name="calendar-outline" size={16} color="#666" />
                                                <Text style={styles.infoLabel}>Tanggal Mulai</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{formatDate(taskDetails.startDate)}</Text>
                                        </View>
                                        <View style={styles.infoColumn}>
                                            <View style={styles.infoItem}>
                                                <Ionicons name="calendar-outline" size={16} color="#666" />
                                                <Text style={styles.infoLabel}>Tanggal Selesai</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{formatDate(taskDetails.endDate)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoColumn}>
                                            <View style={styles.infoItem}>
                                                <Ionicons name="person-outline" size={16} color="#666" />
                                                <Text style={styles.infoLabel}>Ditugaskan Oleh</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{taskDetails.assignedBy}</Text>
                                        </View>
                                        <View style={styles.infoColumn}>
                                            <View style={styles.infoItem}>
                                                <Ionicons name="document-text-outline" size={16} color="#666" />
                                                <Text style={styles.infoLabel}>Keterangan</Text>
                                            </View>
                                            <ScrollView style={styles.descriptionScrollView}>
                                                <Text style={styles.infoValue}>
                                                    {taskDetails.description || 'Tidak ada keterangan tersedia'}
                                                </Text>
                                            </ScrollView>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            {/* Collection Information */}
                            {(taskDetails.status === 'onReview' ||
                                taskDetails.status === 'Completed' ||
                                taskDetails.status === 'onHold') &&
                                taskDetails.collectionDate && (
                                    <View style={styles.section}>
                                        <View style={styles.sectionHeader}>
                                            <MaterialIcons name="cloud-upload" size={20} color="#27A0CF" />
                                            <Text style={styles.sectionTitle}>Informasi Pengumpulan</Text>
                                        </View>
                                        <View style={styles.infoCard}>
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoColumn}>
                                                    <View style={styles.infoItem}>
                                                        <Ionicons name="calendar-outline" size={16} color="#666" />
                                                        <Text style={styles.infoLabel}>Tanggal Pengumpulan</Text>
                                                    </View>
                                                    <Text style={styles.infoValue}>
                                                        {formatDate(taskDetails.collectionDate)}
                                                    </Text>
                                                </View>
                                                <View style={styles.infoColumn}>
                                                    <View style={styles.infoItem}>
                                                        <Ionicons
                                                            name="checkmark-circle-outline"
                                                            size={16}
                                                            color="#666"
                                                        />
                                                        <Text style={styles.infoLabel}>Status Pengumpulan</Text>
                                                    </View>
                                                    {taskDetails.collectionStatusColor ? (
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
                                                    ) : (
                                                        <LinearGradient
                                                            colors={['#E8F5E9', '#C8E6C9']}
                                                            style={styles.statusBadge}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                        >
                                                            <MaterialIcons
                                                                name="check-circle"
                                                                size={16}
                                                                color="#2E7D32"
                                                            />
                                                            <Text style={[styles.statusText, { color: '#2E7D32' }]}>
                                                                Dikumpulkan
                                                            </Text>
                                                        </LinearGradient>
                                                    )}
                                                </View>
                                            </View>
                                            <View style={styles.infoRow}>
                                                <View style={styles.infoColumn}>
                                                    <View style={styles.infoItem}>
                                                        <Ionicons name="image-outline" size={16} color="#666" />
                                                        <Text style={styles.infoLabel}>Bukti Pengumpulan</Text>
                                                    </View>
                                                    {taskDetails.task_image ? (
                                                        <TouchableOpacity activeOpacity={0.8}>
                                                            <Image
                                                                source={{ uri: taskDetails.task_image }}
                                                                style={styles.evidenceImage}
                                                                resizeMode="cover"
                                                            />
                                                        </TouchableOpacity>
                                                    ) : (
                                                        <View style={styles.evidenceBox}>
                                                            <Ionicons name="image-outline" size={32} color="#ccc" />
                                                            <Text style={styles.noImageText}>Tidak ada bukti</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <View style={styles.infoColumn}>
                                                    <View style={styles.infoItem}>
                                                        <Ionicons name="document-text-outline" size={16} color="#666" />
                                                        <Text style={styles.infoLabel}>Keterangan Pengumpulan</Text>
                                                    </View>
                                                    <ScrollView style={styles.descriptionScrollView}>
                                                        <Text style={styles.infoValue}>
                                                            {taskDetails.collectionDescription ||
                                                                'Tidak ada keterangan pengumpulan'}
                                                        </Text>
                                                    </ScrollView>
                                                </View>
                                            </View>

                                            {/* Additional info for completed tasks */}
                                            {taskDetails.status === 'Completed' && (
                                                <View style={styles.completedTaskInfo}>
                                                    <View style={styles.completionBadge}>
                                                        <LinearGradient
                                                            colors={['#4CAF50', '#2E7D32']}
                                                            style={styles.completionGradient}
                                                            start={{ x: 0, y: 0 }}
                                                            end={{ x: 1, y: 1 }}
                                                        >
                                                            <MaterialIcons name="task-alt" size={20} color="white" />
                                                            <Text style={styles.completionText}>
                                                                Tugas Telah Selesai
                                                            </Text>
                                                        </LinearGradient>
                                                    </View>
                                                    {taskDetails.completedDate && (
                                                        <View style={styles.infoItem}>
                                                            <Ionicons
                                                                name="checkmark-done-circle"
                                                                size={16}
                                                                color="#4CAF50"
                                                            />
                                                            <Text style={styles.completedDateLabel}>
                                                                Diselesaikan pada:{' '}
                                                                {formatDate(taskDetails.completedDate)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                )}

                            {/* Action Buttons */}
                            <View style={styles.actionContainer}>
                                <TouchableOpacity
                                    style={styles.commentButton}
                                    onPress={handleCommentPress}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={['#27A0CF', '#1976D2']}
                                        style={styles.gradientButton}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Feather name="message-square" size={18} color="white" />
                                        <Text style={styles.commentButtonText}>Komentar</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Submit button for working/rejected tasks */}
                                {(taskDetails.status === 'workingOnIt' || taskDetails.status === 'rejected') &&
                                    taskDetails.assignedEmployees?.some(
                                        (employee) => employee.employeeId == employeeId,
                                    ) && (
                                        <TouchableOpacity
                                            style={styles.submitTaskButton}
                                            onPress={handleSubmit}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#4CAF50', '#2E7D32']}
                                                style={styles.gradientButton}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <MaterialIcons name="upload" size={18} color="white" />
                                                <Text style={styles.submitButtonText}>Submit Tugas</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    )}

                                {/* Review buttons for pending review */}
                                {taskDetails.status === 'onReview' && taskDetails.assignedById == employeeId && (
                                    <View style={styles.reviewButtonContainer}>
                                        <TouchableOpacity
                                            style={styles.reviewButton}
                                            onPress={() => setIsRejectModalVisible(true)}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#FF6B6B', '#D32F2F']}
                                                style={styles.gradientButton}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <MaterialIcons name="close" size={18} color="white" />
                                                <Text style={styles.submitButtonText}>Tolak</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.reviewButton}
                                            onPress={handleApprove}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={['#4CAF50', '#2E7D32']}
                                                style={styles.gradientButton}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <MaterialIcons name="check" size={18} color="white" />
                                                <Text style={styles.submitButtonText}>Setujui</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                )}

                                {/* Additional actions for completed tasks */}
                                {taskDetails.status === 'Completed' && taskDetails.task_image && (
                                    <TouchableOpacity
                                        style={styles.viewEvidenceButton}
                                        onPress={() => {
                                            // Handle view evidence - could open full screen image viewer
                                            console.log('View evidence:', taskDetails.task_image);
                                        }}
                                        activeOpacity={0.8}
                                    >
                                        <LinearGradient
                                            colors={['#9C27B0', '#7B1FA2']}
                                            style={styles.gradientButton}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <MaterialIcons name="visibility" size={18} color="white" />
                                            <Text style={styles.submitButtonText}>Lihat Bukti Lengkap</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.bottomSpacer} />
                        </ScrollView>
                    </View>
                </Animated.View>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: SCREEN_HEIGHT * 0.85,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -8,
        },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 10,
    },
    bottomSheetContainer: {
        height: SCREEN_HEIGHT,
        width: SCREEN_WIDTH,
    },
    handleContainer: {
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 20,
        color: '#1A1A1A',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    taskHeaderSection: {
        marginBottom: 24,
    },
    taskTitleContainer: {
        marginBottom: 16,
    },
    taskTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 22,
        color: '#1A1A1A',
        marginBottom: 8,
        lineHeight: 28,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        alignSelf: 'flex-start',
        gap: 4,
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
    },
    progressContainer: {
        alignItems: 'center',
        gap: 8,
    },
    progressWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    completionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 50,
    },
    progressLabelContainer: {
        alignItems: 'center',
        gap: 4,
    },
    progressLabel: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: '#666',
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    completedBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: '#4CAF50',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: '#1A1A1A',
    },
    infoCard: {
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    infoColumn: {
        flex: 1,
        marginRight: 12,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    infoLabel: {
        fontFamily: 'Poppins-Medium',
        color: '#666',
        fontSize: 12,
    },
    infoValue: {
        fontFamily: 'Poppins-Regular',
        color: '#1A1A1A',
        fontSize: 14,
        lineHeight: 20,
    },
    descriptionScrollView: {
        maxHeight: 80,
    },
    actionContainer: {
        paddingVertical: 20,
        paddingHorizontal: 4,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        gap: 12,
    },
    commentButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
    },
    commentButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: 'white',
        fontSize: 16,
    },
    submitTaskButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    viewEvidenceButton: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    reviewButtonContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    reviewButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    submitButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: 'white',
        fontSize: 16,
    },
    evidenceImage: {
        width: '100%',
        height: 120,
        borderRadius: 12,
        marginTop: 8,
    },
    evidenceBox: {
        height: 120,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        marginTop: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
        gap: 8,
    },
    noImageText: {
        fontFamily: 'Poppins-Regular',
        color: '#999',
        fontSize: 13,
    },
    bottomSpacer: {
        height: 24,
    },
    // Completed task specific styles
    completedTaskInfo: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E8F5E9',
    },
    completionBadge: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    completionGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 8,
    },
    completionText: {
        fontFamily: 'Poppins-SemiBold',
        color: 'white',
        fontSize: 14,
    },
    completedDateLabel: {
        fontFamily: 'Poppins-Medium',
        color: '#4CAF50',
        fontSize: 12,
    },
    // Modal styles
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 24,
        paddingVertical: 32,
        paddingHorizontal: 28,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 12,
        width: '88%',
        maxWidth: 400,
    },
    modalIconContainer: {
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-Bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#1A1A1A',
    },
    modalText: {
        fontSize: 15,
        fontFamily: 'Poppins-Regular',
        marginBottom: 20,
        textAlign: 'center',
        lineHeight: 22,
        color: '#666',
    },
    input: {
        minHeight: 80,
        borderColor: '#E0E0E0',
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        width: '100%',
        marginBottom: 24,
        backgroundColor: '#FAFAFA',
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: '#1A1A1A',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    button: {
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        elevation: 2,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        backgroundColor: '#9E9E9E',
    },
    confirmButton: {
        backgroundColor: '#FF6B6B',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
    },
    buttonText: {
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        fontSize: 15,
    },
});

export default DraggableModalTask;
