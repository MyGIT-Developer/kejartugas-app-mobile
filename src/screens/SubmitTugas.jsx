import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import ReusableAlertBottomPopUp from '../components/ReusableBottomPopUp'; // Adjust the import path as needed

const SubmitTugas = () => {
    const navigation = useNavigation();
    const [imageUri, setImageUri] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(true);
    const [description, setDescription] = useState('');

    const openImagePicker = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const openCamera = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleUploadPress = () => {
        Alert.alert('Pilih Sumber', 'Silakan pilih sumber gambar', [
            { text: 'Kamera', onPress: openCamera },
            { text: 'Galeri', onPress: openImagePicker },
            { text: 'Batal', style: 'cancel', onPress: () => setImageUri(null) },
        ]);
    };

    const handleSavePress = () => {
        // Here you can add any logic to save the data if needed
        setIsSuccess(true); // Set to true if the save is successful
        setAlertMessage('Pengumpulan berhasil disimpan.');
        setShowAlert(true);
    };

    const handleCancelPress = () => {
        navigation.goBack();
    };

    const handleAlertConfirm = () => {
        setShowAlert(false);
        navigation.goBack(); // Navigate back when the alert button is pressed
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={handleCancelPress}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Submit Tugas</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.uploadContainer}>
                    <Text style={styles.label}>Ambil foto/upload gambar</Text>
                    <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        ) : (
                            <>
                                <Icon name="camera" size={24} color="#999999" />
                                <Icon name="image" size={24} color="#999999" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Keterangan Pengumpulan</Text>
                <TextInput
                    style={styles.textInput}
                    multiline
                    placeholder="Masukkan keterangan..."
                    placeholderTextColor="#999999"
                    value={description}
                    onChangeText={setDescription}
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancelPress}>
                        <Text style={styles.buttonText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSavePress}>
                        <Text style={[styles.buttonText, styles.saveButtonText]}>Simpan</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <ReusableAlertBottomPopUp
                show={showAlert}
                alertType={isSuccess ? 'success' : 'error'}
                message={alertMessage}
                onConfirm={handleAlertConfirm}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        height: 89,
        paddingTop: 40,
        paddingHorizontal: 16,
        justifyContent: 'center', // Center vertically
        flexDirection: 'row', // Align items in a row
        alignItems: 'center', // Align items vertically
    },
    headerContent: {
        flexDirection: 'row',
        flex: 1, // Allow the content to take full width
        justifyContent: 'space-between', // Space out the back button and title
        alignItems: 'center',
    },
    backButton: {
        marginRight: 8, // Reduced margin for closer alignment
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1, // Allow the title to take available space
        textAlign: 'center', // Center the title text
    },
    content: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333333',
    },
    uploadContainer: {
        marginBottom: 16,
    },
    uploadButton: {
        height: 200,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderStyle: 'dashed',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    textInput: {
        height: 100,
        padding: 8,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 8,
        backgroundColor: '#F9F9F9',
        marginBottom: 16,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    button: {
        width: 93,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    cancelButton: {
        backgroundColor: '#EEEEEE',
    },
    saveButton: {
        backgroundColor: '#3498DB',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    saveButtonText: {
        color: '#FFFFFF',
    },
});

export default SubmitTugas;
