import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

import { useNavigation } from '@react-navigation/native';
import ReusableAlertBottomPopUp from '../components/ReusableBottomPopUp';
import { submitTask } from '../api/task';
import * as ImagePicker from 'expo-image-picker'; // Import Image Picker
import * as FileSystem from 'expo-file-system'; // Import FileSystem
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubmitTugas = ({ route }) => {
    const { taskId } = route.params || {}; // Default to an empty object
    const navigation = useNavigation();
    const [imageUri, setImageUri] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(true);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Loading state

    if (!taskId) {
        console.error('taskId is undefined');
        return <Text>Error: Task ID is missing!</Text>; // Fallback UI
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
        Alert.alert('Pilih Sumber', 'Silakan pilih sumber gambar', [
            { text: 'Kamera', onPress: () => pickImage(ImagePicker.launchCameraAsync) },
            { text: 'Galeri', onPress: () => pickImage(ImagePicker.launchImageLibraryAsync) },
            { text: 'Batal', style: 'cancel' },
        ]);
    };

    const handleSavePress = async () => {
        if (!description || !imageUri) {
            setAlertMessage('Please provide a description and an image.');
            setShowAlert(true);
            return;
        }

        setIsLoading(true);

        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            const companyId = await AsyncStorage.getItem('companyId');

            let taskImageBase64 = '';
            if (imageUri) {
                const fileInfo = await FileSystem.getInfoAsync(imageUri);
                if (fileInfo.size > 1024 * 1024) {
                    Alert.alert('File too large', 'Please choose a smaller image (max 1MB).');
                    setIsLoading(false);
                    return;
                }
                taskImageBase64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
            }

            const payload = {
                uploaded_by: employeeId,
                company_id: companyId,
                task_image: taskImageBase64,
                task_submit_reason: description,
            };

            await submitTask(taskId, payload);
            setIsSuccess(true);
            setAlertMessage('Pengumpulan berhasil disimpan.');
            setShowAlert(true);
        } catch (error) {
            console.error(error);
            setIsSuccess(false);
            setAlertMessage('Pengumpulan gagal. Coba lagi.');
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
                            <View style={styles.iconContainer}>
                                <Icon name="camera" size={24} color="#999999" />
                                <Text style={styles.iconSeparator}>/</Text>
                                <Icon name="image" size={24} color="#999999" />
                            </View>
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
                    <TouchableOpacity
                        style={[styles.button, styles.saveButton]}
                        onPress={handleSavePress}
                        disabled={isLoading}
                    >
                        <Text style={[styles.buttonText, styles.saveButtonText]}>
                            {isLoading ? 'Mengirim...' : 'Simpan'}
                        </Text>
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
        justifyContent: 'center',
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerContent: {
        flexDirection: 'row',
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
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
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
        marginLeft: 8,
    },
    cancelButton: {
        backgroundColor: '#F2F2F2',
    },
    saveButton: {
        backgroundColor: '#0E509E',
    },
    buttonText: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    saveButtonText: {
        color: '#FFFFFF',
    },
    iconContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconSeparator: {
        marginHorizontal: 8,
        fontSize: 24,
        color: '#999999',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
});

export default SubmitTugas;
