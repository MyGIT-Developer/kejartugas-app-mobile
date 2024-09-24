import React, { useRef, useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    ScrollView,
    PanResponder,
    Animated,
    Modal,
} from 'react-native';
import * as Progress from 'react-native-progress';
import { useFonts } from '../utils/UseFonts';
import { useNavigation } from '@react-navigation/native'; // Import the useNavigation hook

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;

// Tambahkan fungsi getStatusBadgeColor di atas komponen DraggableModalTask
const getStatusBadgeColor = (status) => {
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#9AE1EA', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#F69292', label: 'Ditolak' };
        case 'onHold':
            return { color: '#F69292', label: 'Ditunda' };
        case 'Completed':
            return { color: '#C9F8C1', label: 'Selesai' };
        case 'onPending':
            return { color: '#F0E08A', label: 'Tersedia' };
        default:
            return { color: '#E0E0E0', label: status }; // Warna default
    }
};

const DraggableModalTask = ({ visible, onClose, taskDetails }) => {
    const navigation = useNavigation(); // Get the navigation object
    const [isFullScreen, setIsFullScreen] = useState(false);
    const modalHeight = useRef(new Animated.Value(SCREEN_HEIGHT * 0.8)).current;
    const modalY = useRef(new Animated.Value(0)).current;
    const [dragging, setDragging] = useState(false);
    const fontsLoaded = useFonts();

    useEffect(() => {
        if (visible) {
            resetModalPosition();
        }
    }, [visible]);

    const resetModalPosition = () => {
        Animated.parallel([
            Animated.spring(modalHeight, {
                toValue: SCREEN_HEIGHT * 0.8,
                useNativeDriver: false,
            }),
            Animated.spring(modalY, {
                toValue: 0,
                useNativeDriver: false,
            }),
        ]).start();
    };

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                return Math.abs(gestureState.dy) > 5;
            },
            onPanResponderGrant: () => {
                setDragging(true);
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    modalY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                setDragging(false);
                const isDraggedEnough = gestureState.dy > SCREEN_HEIGHT * 0.2;
                if (isDraggedEnough) {
                    onClose();
                } else {
                    resetModalPosition();
                }
            },
        }),
    ).current;

    const modalStyle = {
        ...styles.container,
        height: modalHeight,
        transform: [{ translateY: modalY }],
    };

    if (!fontsLoaded) {
        return null; // Or a loading indicator
    }

    const handleSubmit = () => {
        navigation.navigate('SubmitTugas'); // Navigate to SubmitTugas
        onClose(); // Optionally close the modal after navigation
    };

    // Get status badge color and label
    const { color: badgeColor, label: displayStatus } = getStatusBadgeColor(taskDetails.status);

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Animated.View style={modalStyle}>
                    <View {...panResponder.panHandlers} style={styles.dragIndicatorContainer}>
                        <View style={styles.dragIndicator} />
                    </View>
                    <View style={styles.header}>
                        <Text style={styles.title}>Detail Tugas</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.content}>
                        <Text style={styles.taskTitle}>{taskDetails.title}</Text>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
                                <Text style={styles.statusText}>{displayStatus}</Text>
                            </View>
                            <Progress.Circle
                                size={60}
                                progress={taskDetails.progress / 100} // Ensure this is a fraction (0 to 1)
                                thickness={6}
                                color="#4CAF50"
                                unfilledColor="#E8F5E9"
                                borderWidth={0}
                                showsText
                                formatText={() => `${taskDetails.progress}%`} // Display the percentage
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
                                    <TouchableOpacity style={styles.commentButton}>
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
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit Tugas</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        width: SCREEN_WIDTH,
    },
    dragIndicatorContainer: {
        width: '100%',
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dragIndicator: {
        width: 40,
        height: 5,
        backgroundColor: '#ccc',
        borderRadius: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    title: {
        fontFamily: 'Poppins-Bold',
        fontSize: 18,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        right: 20,
        top: 20,
    },
    closeButtonText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 24,
        color: '#000',
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
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    statusText: {
        fontFamily: 'Poppins-SemiBold',
        color: '#1f1f1f',
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
        marginTop: 10, // Add margin for spacing
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
        alignSelf: 'center', // Menempatkan tombol di tengah secara horizontal
    },

    submitButtonText: {
        fontFamily: 'Poppins-Bold',
        color: 'white',
        fontSize: 14,
    },
});

export default DraggableModalTask;
