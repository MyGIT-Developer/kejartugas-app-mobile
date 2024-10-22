import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, ScrollView } from 'react-native';
import { useFonts } from '../utils/UseFonts'; // Import the useFonts hook

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Fungsi untuk menghitung ukuran font responsif
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375; // 375 adalah lebar base untuk iPhone X
    return Math.round(size * scale);
};

const ReusableModalBottom = ({
    visible,
    onClose,
    title = 'Judul Modal', // Default title
    children, // Custom content to be rendered
    customButtonText = 'Oke', // Default button text
}) => {
    const fontsLoaded = useFonts();

    if (!fontsLoaded) {
        return null;
    }

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ScrollView contentContainerStyle={styles.scrollViewContent}>
                        <Text style={styles.title}>{title}</Text>
                        <View style={styles.contentContainer}>{children}</View>
                    </ScrollView>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>{customButtonText}</Text>
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
        maxHeight: SCREEN_HEIGHT * 0.8,
    },
    scrollViewContent: {
        flexGrow: 1,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    title: {
        fontSize: calculateFontSize(18),
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        fontFamily: 'Poppins-Bold', // Use the custom font
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
        fontSize: calculateFontSize(16),
        fontWeight: 'bold',
        fontFamily: 'Poppins-Bold', // Use the custom font
    },
});

export default ReusableModalBottom;
