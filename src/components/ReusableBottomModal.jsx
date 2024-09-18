import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';

const { width, height } = Dimensions.get('window');

const ReusableBottomModal = ({ visible, onClose, projectDetails }) => {
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
                            <ScrollView style={styles.descriptionScrollView}>
                                <Text style={styles.detailValue}>
                                    {projectDetails.description || 'Tidak ada keterangan'}
                                </Text>
                            </ScrollView>
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
        maxHeight: height * 0.8, // Limit the height to 80% of screen height
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    detailContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    detailColumn: {
        flex: 1,
    },
    descriptionContainer: {
        marginBottom: 20,
        maxHeight: height * 0.3, // Limit description height to 30% of screen height
    },
    descriptionScrollView: {
        maxHeight: height * 0.25, // Adjust this value as needed
    },
    detailLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
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
    },
});

export default ReusableBottomModal;
