import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';
import { useFonts } from '../utils/UseFonts'; // Import the useFonts hook

const { width, height } = Dimensions.get('window');

const ReusableBottomModal = ({ visible, onClose, projectDetails }) => {
    const fontsLoaded = useFonts();

    if (!fontsLoaded) {
        return null;
    }

    // Check if projectDetails is defined
    if (!projectDetails) {
        return null; // Optionally, return null or render a loading indicator here
    }

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <Text style={styles.title}>Detail Proyek</Text>

                        <View style={styles.detailContainer}>
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Ditugaskan Oleh</Text>
                                <Text style={styles.detailValue}>{projectDetails.assignedBy}</Text>
                            </View>
                            <View style={styles.detailColumn}>
                                <Text style={styles.detailLabel}>Durasi Proyek</Text>
                                <Text style={styles.detailValue}>{projectDetails.duration}</Text>
                            </View>
                        </View>

                        <View style={styles.descriptionContainer}>
                            <Text style={styles.detailLabel}>Keterangan Proyek</Text>
                            <Text style={styles.detailValue}>
                                {projectDetails.description || 'Tidak ada keterangan'}
                            </Text>
                        </View>
                    </ScrollView>

                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Oke</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '80%', // Limit the height to 80% of screen height
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        fontFamily: 'Poppins-Bold', // Use the custom font
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
    detailLabel: {
        fontSize: 14,
        color: '#000',
        marginBottom: 5,
        fontFamily: 'Poppins-Bold', // Use the custom font and make it bold
    },
    detailValue: {
        fontSize: 16,
        color: '#666', // Set the value color to #666
        fontFamily: 'Poppins-Regular', // Use the custom font
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
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
});

export default ReusableBottomModal;
