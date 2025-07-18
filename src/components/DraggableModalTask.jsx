import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    TextInput,
    Pressable,
    Modal,
    TouchableWithoutFeedback
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, useAnimatedGestureHandler, withDecay } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView, PinchGestureHandler, PanGestureHandler } from 'react-native-gesture-handler';
import { useFonts } from '../utils/UseFonts';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { approveTask, rejectTask } from '../api/task';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS } from '../constants/fonts';
import * as FileSystem from 'expo-file-system';

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

const DraggableModalTask = ({ visible, onClose, taskDetails }) => {
    // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
    const navigation = useNavigation();
    const [employeeId, setEmployeeId] = useState(null);
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const { color: badgeColor, label: displayStatus, textColor, icon } = getStatusBadgeColor(taskDetails.status);

    const scale = useSharedValue(1);
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    const pinchHandler = useAnimatedGestureHandler({
        onActive: (event) => {
            scale.value = event.scale;
        },
        onEnd: () => {
            scale.value = withDecay({ velocity: 0 });
        },
    });

    const panHandler = useAnimatedGestureHandler({
        onActive: (event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
        },
    });

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateX: translateX.value },
            { translateY: translateY.value },
        ],
    }));

    const fontsLoaded = useFonts();

    // Create ref properly - remove TypeScript annotation if not using TypeScript
    const bottomSheetRef = useRef(null);

    const snapPoints = useMemo(() => ['60%', '80%', '100%'], []);

    const handleSheetChanges = useCallback((index) => {
        console.log('Sheet changed to:', index);
    }, []);

    const handleDismiss = useCallback(() => {
        onClose();
    }, [onClose]);

    useEffect(() => {
        const getData = async () => {
            try {
                const id = await AsyncStorage.getItem('employeeId');
                setEmployeeId(id);
            } catch (error) {
                console.error('Error getting employeeId:', error.message);
            }
        };
        getData();
    }, []);

    useEffect(() => {
        if (visible && bottomSheetRef.current) {
            bottomSheetRef.current.present();
        } else if (!visible && bottomSheetRef.current) {
            bottomSheetRef.current.dismiss();
        }
    }, [visible]);

    // 🚨 Only now is it safe to do a conditional return
    if (!taskDetails || !fontsLoaded) {
        return null;
    }

    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    const handleCommentPress = async () => {
        try {
            navigation.navigate('ChatInterface', {
                taskId: taskDetails.id,
                taskDetails: taskDetails,
                taskSubtitle: taskDetails.subtitle,
            });
            onClose();
        } catch (error) {
            console.error('Error navigating to chat:', error.message);
        }
    };

    const handleSubmit = () => {
        navigation.navigate('SubmitTugas', { taskId: taskDetails.id });
        onClose();
    };

    const handleReject = async (rejectionReason) => {
        try {
            const response = await rejectTask(taskDetails.id, rejectionReason);
            onClose();
            console.log('Task rejected successfully:', response.message);
        } catch (error) {
            console.error('Error rejecting task:', error.message);
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
        }
    };

    // const downloadAndShareImage = async (imageUrl) => {
    //     try {
    //         const fileUri = FileSystem.documentDirectory + 'downloaded-image.jpg';

    //         // Download
    //         const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);

    //         // Share (or save manually if needed)
    //         if (await Sharing.isAvailableAsync()) {
    //             await Sharing.shareAsync(uri);
    //         } else {
    //             alert("Sharing not available on this device");
    //         }
    //     } catch (error) {
    //         console.error("Download error", error);
    //     }
    // };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                enablePanDownToClose
                onDismiss={handleDismiss}
                onChange={handleSheetChanges}
            >
                <BottomSheetScrollView
                    contentContainerStyle={{
                        padding: 16,
                    }}
                >
                    <View style={styles.taskTitleContainer}>
                        <View style={styles.headerContent}>
                            <View style={styles.headerContent}>
                                <MaterialIcons name="assignment" size={14} color="#27A0CF" />
                                <Text style={styles.title}>Detail Tugas</Text>
                            </View>
                        </View>

                        <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                        <View style={styles.headerContent}>
                            <LinearGradient
                                colors={badgeColor}
                                style={styles.statusBadge}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <MaterialIcons name={icon} size={16} color={textColor} />
                                <Text style={[styles.statusText, { color: textColor }]}>{displayStatus}</Text>
                            </LinearGradient>
                            {taskDetails.collectionStatus === "N/A" ? (
                                <></>
                            ) : (
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: taskDetails.collectionStatusColor },
                                    ]}
                                >
                                    <MaterialIcons name={"schedule"} size={16} color={taskDetails.collectionStatusTextColor} />
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: taskDetails.collectionStatusTextColor },
                                        ]}
                                    >
                                        {taskDetails.collectionStatus}
                                    </Text>
                                </View>
                            )}
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
                                    <Text style={styles.infoValue}>
                                        {taskDetails.assignedByName || taskDetails.assignedBy || 'N/A'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoColumn}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="document-text-outline" size={16} color="#666" />
                                    <Text style={styles.infoLabel}>Keterangan</Text>
                                </View>
                                <ScrollView style={styles.descriptionScrollView}>
                                    <Text style={styles.infoValue}>
                                        {!taskDetails.description || taskDetails.description === "N/A" ? 'Tidak ada keterangan tersedia' : taskDetails.description}
                                    </Text>
                                </ScrollView>
                            </View>
                        </View>
                    </View>

                    {/* Collection Information Section */}
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
                                    </View>
                                    <View style={styles.infoRow}>
                                        <View style={styles.infoColumn}>
                                            <View style={styles.infoItem}>
                                                <Ionicons name="image-outline" size={16} color="#666" />
                                                <Text style={styles.infoLabel}>Bukti Pengumpulan</Text>
                                            </View>

                                            {taskDetails.task_image ? (
                                                <>
                                                    <TouchableOpacity
                                                        activeOpacity={0.8}
                                                        onPress={() => setPreviewVisible(true)}
                                                        style={styles.evidenceTouchable}
                                                    >
                                                        <Image
                                                            source={{ uri: taskDetails.task_image }}
                                                            style={styles.evidenceImage}
                                                            resizeMode="cover"
                                                        />
                                                    </TouchableOpacity>

                                                    <Modal visible={visible} transparent animationType="fade">
                                                        <View style={{ flex: 1, backgroundColor: 'black' }}>
                                                            {/* Tap outside to close */}
                                                            <TouchableWithoutFeedback onPress={onClose}>
                                                                <View style={{ flex: 1 }} />
                                                            </TouchableWithoutFeedback>

                                                            {/* Centered image with gestures */}
                                                            <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -150 }, { translateY: -200 }] }}>
                                                                <PanGestureHandler onGestureEvent={panHandler}>
                                                                    <Animated.View>
                                                                        <PinchGestureHandler onGestureEvent={pinchHandler}>
                                                                            <Animated.Image
                                                                                source={{ uri: taskDetails.task_image }}
                                                                                style={[{ width: 300, height: 400 }, animatedStyle]}
                                                                                resizeMode="contain"
                                                                            />
                                                                        </PinchGestureHandler>
                                                                    </Animated.View>
                                                                </PanGestureHandler>
                                                            </View>
                                                        </View>
                                                    </Modal>
                                                </>
                                            ) : (
                                                <View style={styles.evidenceBox}>
                                                    <Ionicons name="image-outline" size={32} color="#ccc" />
                                                    <Text style={styles.noImageText}>Tidak ada bukti</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <View style={styles.infoColumn}>
                                        <View style={styles.infoItem}>
                                            <Ionicons name="document-text-outline" size={16} color="#666" />
                                            <Text style={styles.infoLabel}>Keterangan Pengumpulan</Text>
                                        </View>
                                        <ScrollView style={styles.descriptionScrollView}>
                                            <Text style={styles.infoValue}>
                                                {taskDetails.collectionDescription &&
                                                    taskDetails.collectionDescription.trim().toLowerCase() !== 'n/a'
                                                    ? taskDetails.collectionDescription
                                                    : 'Tidak ada keterangan pengumpulan'}
                                            </Text>
                                        </ScrollView>
                                    </View>
                                </View>
                            </View>
                        )}
                </BottomSheetScrollView>

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
                    {(taskDetails.status === 'workingOnIt' || taskDetails.status === 'rejected') && (
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
                </View>
            </BottomSheetModal>

            <RejectConfirmationModal
                visible={isRejectModalVisible}
                onConfirm={handleReject}
                onCancel={() => setIsRejectModalVisible(false)}
            />
        </GestureHandlerRootView>
    );
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


const styles = StyleSheet.create({
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    title: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.md,
        color: '#6e6e6eff',
        letterSpacing: -0.5,
    },
    taskTitleContainer: {
        marginBottom: 20,
        paddingVertical: 20,

        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    taskTitle: {
        fontFamily: FONTS.family.bold,
        fontSize: FONTS.size['2xl'],
        color: '#111827',
        marginBottom: 12,
        lineHeight: 32,
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderRadius: 24,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statusText: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.sm,
        letterSpacing: -0.5,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.lg,
        color: '#111827',
        letterSpacing: -0.5,
    },
    infoCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    infoColumn: {
        flex: 1,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    infoLabel: {
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        fontSize: FONTS.size.md,
        // textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    infoValue: {
        fontFamily: FONTS.family.medium,
        color: '#111827',
        fontSize: FONTS.size.md,
        lineHeight: 22,
        letterSpacing: -0.5,
    },
    descriptionScrollView: {
        maxHeight: 100,
    },
    actionContainer: {
        paddingVertical: 24,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    commentButton: {
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        flex: 1,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingVertical: 12,
        gap: 10,
    },
    commentButtonText: {
        fontFamily: FONTS.family.semiBold,
        color: 'white',
        fontSize: FONTS.size.md,
        letterSpacing: -0.5,
    },
    submitTaskButton: {
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        flex: 1,
    },
    viewEvidenceButton: {
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        flex: 1,
    },
    reviewButtonContainer: {
        flexDirection: 'row',
        gap: 16,
    },
    reviewButton: {
        flex: 1,
        borderRadius: 6,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
        flex: 1
    },
    submitButtonText: {
        fontFamily: FONTS.family.semiBold,
        color: 'white',
        fontSize: FONTS.size.md,
        letterSpacing: -0.5,
    },
    evidenceTouchable: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        marginTop: 8,
    },
    evidenceImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
    },
    evidenceBox: {
        height: 180,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    noImageText: {
        marginTop: 6,
        color: '#999',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: '100%',
        height: '100%',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalView: {
        backgroundColor: 'white',
        borderRadius: 28,
        paddingVertical: 36,
        paddingHorizontal: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 12,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 16,
        width: '90%',
        maxWidth: 420,
    },
    modalIconContainer: {
        marginBottom: 20,
        backgroundColor: '#FEF2F2',
        padding: 16,
        borderRadius: 24,
    },
    modalTitle: {
        fontSize: 22,
        fontFamily: 'Poppins-Bold',
        marginBottom: 12,
        textAlign: 'center',
        color: '#111827',
        letterSpacing: 0.3,
    },
    modalText: {
        fontSize: 16,
        fontFamily: 'Poppins-Regular',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 24,
        color: '#6B7280',
    },
    input: {
        minHeight: 100,
        borderColor: '#D1D5DB',
        borderWidth: 2,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        marginBottom: 28,
        backgroundColor: '#F9FAFB',
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: '#111827',
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 16,
    },
    button: {
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        elevation: 4,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    cancelButton: {
        backgroundColor: '#6B7280',
    },
    confirmButton: {
        backgroundColor: '#DC2626',
    },
    disabledButton: {
        backgroundColor: '#D1D5DB',
    },
    buttonText: {
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        textAlign: 'center',
        fontSize: 16,
        letterSpacing: 0.2,
    },
});

export default DraggableModalTask;
