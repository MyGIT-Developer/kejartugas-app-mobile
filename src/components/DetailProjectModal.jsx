import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
    Pressable,
    Animated,
    PanResponder,
    Easing,
} from 'react-native';
import { useFonts } from '../utils/UseFonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FONTS } from '../constants/fonts';

const { width, height } = Dimensions.get('window');

// Helper function to calculate the duration between two dates
const calculateProjectDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const durationInMs = end - start;
    const durationInDays = Math.ceil(durationInMs / (1000 * 60 * 60 * 24));
    return durationInDays > 0 ? `${durationInDays} hari` : 'Durasi tidak valid';
};

const ReusableBottomModal = ({ visible, onClose, projectDetails }) => {
    const fontsLoaded = useFonts();
    const slideAnim = useRef(new Animated.Value(height)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const pan = useRef(new Animated.Value(0)).current;

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    pan.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 150) {
                    onClose(); // Close modal
                } else {
                    Animated.timing(pan, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }
            },
        }),
    ).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: height,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    if (!fontsLoaded) {
        return null;
    }

    if (!projectDetails) {
        return null; // Optionally, render a loading indicator here
    }

    const { assign_by_name, start_date, end_date, description } = projectDetails;
    const projectDuration = calculateProjectDuration(start_date, end_date);

    return (
        <Modal transparent visible={visible} animationType="none">
            {/* Animated Overlay */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
                <Animated.View
                    style={[
                        styles.overlay,
                        {
                            opacity: fadeAnim,
                        },
                    ]}
                />
            </Pressable>

            {/* Sliding Up Modal */}
            <Animated.View
                style={[styles.modalContent, { transform: [{ translateY: Animated.add(slideAnim, pan) }] }]}
                {...panResponder.panHandlers}
            >
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <View style={styles.cardHeader}>
                        <Ionicons name="folder-outline" size={18} color="#3498db" />
                        <Text style={styles.title}>Detail Proyek</Text>
                    </View>

                    {/* Assigner & Duration */}
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons
                                name="person-circle-outline"
                                size={18}
                                color="#3498db"
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.sectionLabel}>Ditugaskan Oleh</Text>
                        </View>
                        <Text style={styles.sectionValue}>{assign_by_name || 'Tidak tersedia'}</Text>

                        <View style={[styles.row, { marginTop: 12 }]}>
                            <Ionicons name="calendar-outline" size={18} color="#3498db" style={{ marginRight: 6 }} />
                            <Text style={styles.sectionLabel}>Durasi Proyek</Text>
                        </View>
                        <Text style={styles.sectionValue}>{projectDuration}</Text>
                    </View>

                    {/* Description */}
                    <View style={styles.card}>
                        <View style={styles.row}>
                            <Ionicons
                                name="document-text-outline"
                                size={18}
                                color="#3498db"
                                style={{ marginRight: 6 }}
                            />
                            <Text style={styles.sectionLabel}>Keterangan</Text>
                        </View>
                        <Text style={styles.sectionValue}>{description || 'Tidak ada keterangan'}</Text>
                    </View>
                </ScrollView>

                <TouchableOpacity style={styles.button} onPress={onClose}>
                    <Text style={styles.buttonText}>Tutup</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    modalContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 5,
    },
    scrollViewContent: {
        paddingBottom: 30,
        paddingHorizontal: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
        justifyContent: 'center',
    },
    card: {
        backgroundColor: '#f9f9f9',
        padding: 14,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        letterSpacing: -0.5,
    },
    sectionValue: {
        fontSize: 15,
        fontFamily: FONTS.family.medium,
        color: '#111827',
        marginTop: 4,
        lineHeight: 22,
        letterSpacing: -0.5,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        fontFamily: 'Poppins-Bold',
        letterSpacing: -0.5,
    },
    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    detailColumn: {
        flex: 1,
        marginRight: 10, // Add some space between columns
    },
    descriptionContainer: {
        marginBottom: 20,
    },
    button: {
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
        fontFamily: 'Poppins-Bold',
    },
});

export default ReusableBottomModal;
