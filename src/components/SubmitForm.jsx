import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import ReusableAlertBottomPopUp from './ReusableBottomPopUp';
import { submitAdhocTask } from '../api/adhocTask';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubmitForm = ({ route }) => {
    const { adhocId } = route.params || {};
    const navigation = useNavigation();
    const [imageUri, setImageUri] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(true);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!adhocId) {
        console.error('adhocId is undefined');
        return <Text>Error: Adhoc ID is missing!</Text>;
    }

    const requestPermissions = async () => {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
            Alert.alert('Permission Required', 'Camera and media library access is required to use this feature.');
            return false;
        }
        return true;
    };

    const pickImage = async (sourceType) => {
        if (!(await requestPermissions())) return;

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                return result.assets[0].base64;
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image. Please try again.');
        }
        return null;
    };

    const handleUploadPress = () => {
        Alert.alert(
            'Pilih Sumber Gambar',
            'Silakan pilih sumber gambar yang akan digunakan',
            [
                {
                    text: 'Kamera',
                    onPress: () => pickImage(ImagePicker.launchCameraAsync),
                    style: 'default',
                },
                {
                    text: 'Galeri',
                    onPress: () => pickImage(ImagePicker.launchImageLibraryAsync),
                    style: 'default',
                },
                {
                    text: 'Batal',
                    style: 'cancel',
                },
            ],
            { cancelable: true },
        );
    };

    const handleSavePress = async () => {
        // Validate inputs
        if (!imageUri || !description.trim()) {
            setAlertMessage(
                !imageUri ? 'Mohon sertakan gambar untuk pengumpulan.' : 'Mohon isi keterangan pengumpulan.',
            );
            setShowAlert(true);
            return;
        }

        setIsLoading(true);

        try {
            const companyId = await AsyncStorage.getItem('companyId');

            let imageBase64 = '';
            if (imageUri) {
                const fileInfo = await FileSystem.getInfoAsync(imageUri);
                if (fileInfo.size > 1024 * 1024) {
                    Alert.alert('Ukuran file terlalu besar', 'Mohon pilih gambar dengan ukuran maksimal 1MB.');
                    setIsLoading(false);
                    return;
                }
                imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
            }

            await submitAdhocTask(adhocId, companyId, imageBase64, description);
            setIsSuccess(true);
            setAlertMessage('Pengumpulan berhasil disimpan.');
            setShowAlert(true);
        } catch (error) {
            console.error(error);
            setIsSuccess(false);
            setAlertMessage('Pengumpulan gagal. Silakan coba lagi.');
            setShowAlert(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelPress = () => {
        navigation.goBack();
    };

    const handleAlertConfirm = () => {
        setShowAlert(false);
        if (isSuccess) {
            navigation.goBack();
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={handleCancelPress} disabled={isLoading}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Submit Adhoc Task</Text>
                </View>
            </LinearGradient>

            {/* Main Content */}
            <View style={styles.content}>
                {/* Image Upload Section */}
                <View style={styles.uploadContainer}>
                    <View style={styles.labelContainer}>
                        <Icon name="image" size={20} color="#0E509E" />
                        <Text style={styles.label}>Foto/Gambar</Text>
                        <Text style={styles.required}>*</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.uploadButton, imageUri && styles.uploadButtonWithImage]}
                        onPress={handleUploadPress}
                        disabled={isLoading}
                    >
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                        ) : (
                            <View style={styles.uploadPlaceholder}>
                                <Icon name="upload" size={32} color="#999999" />
                                <Text style={styles.uploadText}>Ketuk untuk memilih gambar</Text>
                                <Text style={styles.uploadSubText}>Ukuran maksimal 1MB</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Description Input */}
                <View style={styles.inputContainer}>
                    <View style={styles.labelContainer}>
                        <Icon name="file-text" size={20} color="#0E509E" />
                        <Text style={styles.label}>Keterangan Pengumpulan</Text>
                        <Text style={styles.required}>*</Text>
                    </View>
                    <TextInput
                        style={styles.textInput}
                        multiline
                        placeholder="Masukkan keterangan pengumpulan..."
                        placeholderTextColor="#999999"
                        value={description}
                        onChangeText={setDescription}
                        editable={!isLoading}
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.cancelButton]}
                        onPress={handleCancelPress}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.cancelButtonText]}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton, isLoading && styles.buttonDisabled]}
                        onPress={handleSavePress}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color="#FFFFFF" />
                                <Text style={[styles.buttonText, styles.saveButtonText, styles.loadingText]}>
                                    Mengirim...
                                </Text>
                            </View>
                        ) : (
                            <Text style={[styles.buttonText, styles.saveButtonText]}>Simpan</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={styles.loadingCard}>
                        <ActivityIndicator size="large" color="#0E509E" />
                        <Text style={styles.loadingText}>Sedang mengirim...</Text>
                    </View>
                </View>
            )}

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
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 4,
    },
    headerContent: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButton: {
        position: 'absolute',
        left: 0,
        padding: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginLeft: 8,
    },
    required: {
        color: '#FF0000',
        marginLeft: 4,
    },
    uploadContainer: {
        marginBottom: 24,
    },
    uploadButton: {
        height: 200,
        borderWidth: 2,
        borderColor: '#CCCCCC',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
    },
    uploadButtonWithImage: {
        borderStyle: 'solid',
        borderColor: '#0E509E',
    },
    uploadPlaceholder: {
        alignItems: 'center',
    },
    uploadText: {
        marginTop: 12,
        fontSize: 16,
        color: '#666666',
        fontWeight: '500',
    },
    uploadSubText: {
        marginTop: 4,
        fontSize: 14,
        color: '#999999',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },
    inputContainer: {
        marginBottom: 24,
    },
    textInput: {
        height: 120,
        padding: 12,
        borderWidth: 1,
        borderColor: '#CCCCCC',
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
        fontSize: 16,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    button: {
        minWidth: 100,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    cancelButton: {
        backgroundColor: '#F2F2F2',
        borderWidth: 1,
        borderColor: '#CCCCCC',
    },
    saveButton: {
        backgroundColor: '#0E509E',
    },
    buttonDisabled: {
        backgroundColor: '#ACC4E4',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666666',
    },
    saveButtonText: {
        color: '#FFFFFF',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        marginLeft: 8,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        backgroundColor: '#FFFFFF',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
    },
});

export default SubmitForm;
