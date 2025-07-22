import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { editAdhocTask, getAdhocTaskDetail } from '../api/adhocTask';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ReusableAlert from '../components/ReusableAlert';

const EditAdhoc = ({ route, navigation }) => {
    const { adhocId } = route.params;

    const [formData, setFormData] = useState({
        adhoc_name: '',
        adhoc_desc: '',
        adhoc_start_date: new Date(),
        adhoc_end_date: new Date(),
    });

    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('');
    const [alertMessage, setAlertMessage] = useState('');

    const showAlertMessage = (type, message) => {
        setAlertType(type);
        setAlertMessage(message);
        setShowAlert(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getAdhocTaskDetail(adhocId);
                const data = response.data;

                setFormData({
                    adhoc_name: data.adhoc_name,
                    adhoc_desc: data.adhoc_desc,
                    adhoc_start_date: new Date(data.adhoc_start_date),
                    adhoc_end_date: new Date(data.adhoc_end_date),
                });
            } catch (error) {
                showAlertMessage('error', 'Gagal memuat data tugas.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [adhocId]);

    const handleEditAdhoc = async () => {
        setLoading(true);
        try {
            const companyId = await AsyncStorage.getItem('companyId');
            const updatedFormData = {
                ...formData,
                company_id: parseInt(companyId, 10),
                adhoc_start_date: formData.adhoc_start_date.toISOString(),
                adhoc_end_date: formData.adhoc_end_date.toISOString(),
            };

            await editAdhocTask(adhocId, updatedFormData);
            showAlertMessage('success', 'Tugas berhasil diperbarui');
        } catch (error) {
            showAlertMessage('error', 'Gagal mengedit tugas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Tugas Harian</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView}>
                <View style={styles.formContainer}>
                    <View style={styles.card}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Informasi Dasar</Text>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Nama Tugas</Text>
                                <TextInput
                                    value={formData.adhoc_name}
                                    onChangeText={(text) => setFormData({ ...formData, adhoc_name: text })}
                                    style={styles.input}
                                    placeholder="Masukkan Nama Tugas Anda"
                                    placeholderTextColor="#999"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Deskripsi Tugas</Text>
                                <TextInput
                                    value={formData.adhoc_desc}
                                    onChangeText={(text) => setFormData({ ...formData, adhoc_desc: text })}
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={4}
                                    placeholder="Deskripsi Tugas"
                                    placeholderTextColor="#999"
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.card}>
                        <View style={styles.formSection}>
                            <Text style={styles.sectionTitle}>Waktu Pelaksanaan</Text>
                            <View style={styles.dateContainer}>
                                <View style={styles.dateColumn}>
                                    <Text style={styles.label}>Mulai</Text>
                                    <TouchableOpacity
                                        onPress={() => setShowStartPicker(true)}
                                        style={styles.dateButton}
                                    >
                                        <Feather name="calendar" size={20} color="#4A90E2" />
                                        <Text style={styles.dateText}>
                                            {formData.adhoc_start_date.toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                    {showStartPicker && (
                                        <DateTimePicker
                                            value={formData.adhoc_start_date}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowStartPicker(false);
                                                if (selectedDate) {
                                                    setFormData({
                                                        ...formData,
                                                        adhoc_start_date: selectedDate,
                                                    });
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                                <View style={styles.dateColumn}>
                                    <Text style={styles.label}>Selesai</Text>
                                    <TouchableOpacity onPress={() => setShowEndPicker(true)} style={styles.dateButton}>
                                        <Feather name="calendar" size={20} color="#4A90E2" />
                                        <Text style={styles.dateText}>
                                            {formData.adhoc_end_date.toLocaleDateString()}
                                        </Text>
                                    </TouchableOpacity>
                                    {showEndPicker && (
                                        <DateTimePicker
                                            value={formData.adhoc_end_date}
                                            mode="date"
                                            display="default"
                                            onChange={(event, selectedDate) => {
                                                setShowEndPicker(false);
                                                if (selectedDate) {
                                                    setFormData({
                                                        ...formData,
                                                        adhoc_end_date: selectedDate,
                                                    });
                                                }
                                            }}
                                        />
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                    onPress={handleEditAdhoc}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <>
                            <Feather name="check-circle" size={20} color="#FFF" style={styles.submitIcon} />
                            <Text style={styles.submitButtonText}>Simpan Perubahan</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <ReusableAlert
                show={showAlert}
                alertType={alertType}
                message={alertMessage}
                onConfirm={() => {
                    setShowAlert(false);
                    if (alertType === 'success') {
                        navigation.goBack();
                    }
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
    },
    formContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    formSection: {
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 16,
    },
    inputGroup: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#F8F9FA',
        color: '#333',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    dateContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    dateColumn: {
        flex: 1,
        marginRight: 8,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 12,
        backgroundColor: '#F8F9FA',
    },
    dateText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#333',
    },
    submitButtonContainer: {
        padding: 16,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    submitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4A90E2',
        padding: 16,
        borderRadius: 12,
    },
    submitButtonDisabled: {
        backgroundColor: '#A0A0A0',
    },
    submitIcon: {
        marginRight: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditAdhoc;
