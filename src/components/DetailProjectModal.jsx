import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
    Animated,
    PanResponder,
} from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from '../utils/UseFonts';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
    const { title, assign_by_name, start_date, end_date, description } = projectDetails;
    const projectDuration = calculateProjectDuration(start_date, end_date);

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
        if (visible && bottomSheetRef.current) {
            bottomSheetRef.current.present();
        } else if (!visible && bottomSheetRef.current) {
            bottomSheetRef.current.dismiss();
        }
    }, [visible]);

    if (!fontsLoaded) {
        return null;
    }

    if (!projectDetails) {
        return null; // Optionally, render a loading indicator here
    }

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
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <View style={styles.taskTitleContainer}>
                            <View style={styles.headerContent}>
                                <View style={styles.headerContent}>
                                    <MaterialIcons name="assignment" size={14} color="#27A0CF" />
                                    <Text style={styles.title}>Detail Proyek</Text>
                                </View>
                            </View>

                            <Text style={styles.taskTitle}>{title}</Text>
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
                </BottomSheetScrollView>
            </BottomSheetModal>
        </GestureHandlerRootView>
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
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 10,
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 1,
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
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.md,
        color: '#6e6e6eff',
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
