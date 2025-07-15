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
                    {/* Modal Handle Bar */}
                    <View style={styles.handleBar} />

                    <ScrollView contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
        width: '100%',
        maxHeight: SCREEN_HEIGHT * 0.85,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    handleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E0E4E7',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: 20,
    },
    scrollViewContent: {
        flexGrow: 1,
        paddingBottom: 10,
    },
    contentContainer: {
        paddingBottom: 20,
    },
    title: {
        fontSize: calculateFontSize(20),
        fontWeight: '700',
        marginBottom: 24,
        textAlign: 'center',
        fontFamily: 'Poppins-Bold',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    button: {
        backgroundColor: '#4A90E2',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#4A90E2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    buttonText: {
        color: 'white',
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: 0.2,
    },
});

export default ReusableModalBottom;
