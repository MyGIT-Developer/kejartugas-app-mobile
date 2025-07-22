import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Image, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useNavigation } from '@react-navigation/native';
import ReusableAlertBottomPopUp from '../components/ReusableBottomPopUp';
import { submitTask } from '../api/task';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SubmitTugas = ({ route }) => {
    const { taskId } = route.params || {};
    const navigation = useNavigation();
    const [imageUri, setImageUri] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(true);
    const [description, setDescription] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!taskId) {
        console.error('taskId is undefined');
        return (
            <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={48} color="#FF6B6B" />
                <Text style={styles.errorText}>Error: Task ID is missing!</Text>
            </View>
        );
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
                quality: 0.7,
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

    const takePhoto = async () => {
        if (!(await requestPermissions())) return;

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
                return result.assets[0].base64;
            }
        } catch (error) {
            console.error('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo. Please try again.');
        }
        return null;
    };

    const handleSavePress = async () => {
        if (!description.trim()) {
            setAlertMessage('Mohon masukkan keterangan pengumpulan.');
            setIsSuccess(false);
            setShowAlert(true);
            return;
        }

        if (!imageUri) {
            setAlertMessage('Mohon upload bukti pengumpulan tugas.');
            setIsSuccess(false);
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
                if (fileInfo.size > 2 * 1024 * 1024) {
                    Alert.alert('File terlalu besar', 'Silakan pilih gambar yang lebih kecil (maksimal 2MB).');
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
                task_submit_reason: description.trim(),
            };

            await submitTask(taskId, payload);
            setIsSuccess(true);
            setAlertMessage('Tugas berhasil dikumpulkan! Menunggu review dari atasan.');
            setShowAlert(true);
        } catch (error) {
            console.error(error);
            setIsSuccess(false);
            setAlertMessage('Gagal mengumpulkan tugas. Silakan coba lagi.');
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

    const removeImage = () => {
        setImageUri(null);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#2E5984']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={handleCancelPress}>
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <MaterialIcons name="upload" size={24} color="#FFFFFF" style={styles.headerIcon} />
                        <Text style={styles.headerTitle}>Submit Tugas</Text>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Instructions Card */}
                    <View style={styles.instructionCard}>
                        <View style={styles.instructionHeader}>
                            <MaterialIcons name="info-outline" size={20} color="#4A90E2" />
                            <Text style={styles.instructionTitle}>Panduan Pengumpulan</Text>
                        </View>
                        <Text style={styles.instructionText}>
                            • Upload bukti pengerjaan tugas berupa foto atau gambar{'\n'}• Berikan keterangan yang jelas
                            tentang hasil pekerjaan{'\n'}• Pastikan gambar berkualitas baik dan dapat dibaca
                        </Text>
                    </View>

                    {/* Upload Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="photo-camera" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Bukti Pengumpulan</Text>
                            <Text style={styles.required}>*</Text>
                        </View>

                        <View style={styles.uploadContainer}>
                            {imageUri ? (
                                <View style={styles.imageContainer}>
                                    <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                                    <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                                        <MaterialIcons name="close" size={20} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <View style={styles.uploadPlaceholder}>
                                    <MaterialIcons name="cloud-upload" size={48} color="#94A3B8" />
                                    <Text style={styles.uploadText}>Upload Bukti Tugas</Text>
                                    <Text style={styles.uploadSubtext}>Tap untuk pilih gambar</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.uploadButtons}>
                            <TouchableOpacity style={styles.uploadOptionButton} onPress={takePhoto}>
                                <MaterialIcons name="photo-camera" size={20} color="#4A90E2" />
                                <Text style={styles.uploadOptionText}>Kamera</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.uploadOptionButton} onPress={pickImage}>
                                <MaterialIcons name="photo-library" size={20} color="#4A90E2" />
                                <Text style={styles.uploadOptionText}>Galeri</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Description Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="description" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Keterangan Pengumpulan</Text>
                            <Text style={styles.required}>*</Text>
                        </View>

                        <View style={styles.textInputContainer}>
                            <TextInput
                                style={styles.textInput}
                                multiline
                                numberOfLines={4}
                                placeholder="Jelaskan hasil pekerjaan yang telah Anda selesaikan..."
                                placeholderTextColor="#94A3B8"
                                value={description}
                                onChangeText={setDescription}
                                textAlignVertical="top"
                            />
                            <View style={styles.characterCount}>
                                <Text style={styles.characterCountText}>{description.length}/500</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Fixed Bottom Actions */}
            <View style={styles.bottomActions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelPress}
                    disabled={isLoading}
                >
                    <Icon name="x" size={18} color="#64748B" />
                    <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.submitButton, isLoading && styles.disabledButton]}
                    onPress={handleSavePress}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <MaterialIcons name="hourglass-empty" size={18} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Mengirim...</Text>
                        </>
                    ) : (
                        <>
                            <MaterialIcons name="send" size={18} color="#FFFFFF" />
                            <Text style={styles.submitButtonText}>Submit Tugas</Text>
                        </>
                    )}
                </TouchableOpacity>
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
        backgroundColor: '#F8FAFC',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        marginTop: 12,
        fontFamily: 'Poppins-Medium',
    },
    header: {
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingBottom: 30,
        paddingHorizontal: 20,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    headerIcon: {
        marginRight: 8,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        textAlign: 'center',
    },
    headerSpacer: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    instructionCard: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    instructionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    instructionTitle: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#1E293B',
        marginLeft: 8,
    },
    instructionText: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#475569',
        lineHeight: 18,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: '#1E293B',
        marginLeft: 8,
        flex: 1,
    },
    required: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: '#EF4444',
    },
    uploadContainer: {
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        overflow: 'hidden',
        marginBottom: 16,
    },
    uploadPlaceholder: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFBFC',
    },
    uploadText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: '#475569',
        marginTop: 12,
    },
    uploadSubtext: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#94A3B8',
        marginTop: 4,
    },
    imageContainer: {
        position: 'relative',
        height: 200,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    uploadOptionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    uploadOptionText: {
        fontSize: 14,
        fontFamily: 'Poppins-Medium',
        color: '#4A90E2',
        marginLeft: 8,
    },
    textInputContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    textInput: {
        padding: 16,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: '#1E293B',
        minHeight: 120,
        maxHeight: 160,
    },
    characterCount: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    characterCountText: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: '#94A3B8',
        textAlign: 'right',
    },
    bottomActions: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        gap: 12,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    cancelButton: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    cancelButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#64748B',
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    submitButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: '#FFFFFF',
    },
    disabledButton: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default SubmitTugas;
