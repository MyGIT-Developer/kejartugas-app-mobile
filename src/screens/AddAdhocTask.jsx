import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    StatusBar,
    ScrollView,
    StyleSheet,
    Modal,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getEmployeeByCompany } from '../api/general';
import { createAdhocTask } from '../api/adhocTask';
import ReusableAlert from '../components/ReusableAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddAdhocTask = ({ navigation }) => {
    const [adhocName, setAdhocName] = useState('');
    const [adhocDesc, setAdhocDesc] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [duration, setDuration] = useState('');
    const [assignTo, setAssignTo] = useState([]); // Multi-select state for assigned employees
    const [employees, setEmployees] = useState([]);
    const [approval1, setApproval1] = useState(null); // Store the full employee object (name + id)
    const [approval2, setApproval2] = useState(null);
    const [approval3, setApproval3] = useState(null);
    const [approval4, setApproval4] = useState(null);
    const [image, setImage] = useState(null); // Image state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedField, setSelectedField] = useState(null); // Track which field (assignTo or approval) is being selected
    const [imageInfo, setImageInfo] = useState(null);
    // Add new states for focus and alert
    const [focusedInput, setFocusedInput] = useState(null);
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('success');
    const [alertMessage, setAlertMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fetch employees when modal opens
    useEffect(() => {
        if (isModalVisible) {
            fetchEmployees();
        }
    }, [isModalVisible]);

    const fetchEmployees = async () => {
        try {
            console.log('Fetching employees...');
            const companyId = await AsyncStorage.getItem('companyId');
            const token = await AsyncStorage.getItem('token');

            if (!companyId) {
                throw new Error('Company ID not found');
            }

            console.log(`Company ID: ${companyId}`);
            console.log(`Authorization Token: ${token}`);

            const response = await getEmployeeByCompany(companyId);
            console.log('Employee data fetched successfully:', response);

            setEmployees(response); // Assuming the API returns the employee list directly
        } catch (error) {
            console.error('Error fetching employee data:', error);
            Alert.alert('Error', error.message || 'Failed to fetch employees');
        }
    };

    const formatDate = (date) => {
        return date
            .toLocaleDateString('id-ID', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
            })
            .replace(/\//g, '/');
    };

    // Modified date change handlers
    const onStartDateChange = (event, selectedDate) => {
        setShowStartPicker(false);
        if (selectedDate) {
            // Ensure start date isn't after end date
            if (selectedDate > endDate) {
                Alert.alert('Error', 'Tanggal mulai tidak boleh lebih dari tanggal selesai');
                return;
            }
            setStartDate(selectedDate);
        }
    };

    const onEndDateChange = (event, selectedDate) => {
        setShowEndPicker(false);
        if (selectedDate) {
            // Ensure end date isn't before start date
            if (selectedDate < startDate) {
                Alert.alert('Error', 'Tanggal selesai tidak boleh kurang dari tanggal mulai');
                return;
            }
            setEndDate(selectedDate);
        }
    };
    // Function to calculate working days between two dates
    const calculateWorkingDays = (start, end) => {
        let count = 0;
        const curDate = new Date(start);
        const endDate = new Date(end);

        while (curDate <= endDate) {
            const dayOfWeek = curDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                // 0 = Sunday, 6 = Saturday
                count++;
            }
            curDate.setDate(curDate.getDate() + 1);
        }
        return count;
    };
    // Update duration whenever start or end date changes
    useEffect(() => {
        const workingDays = calculateWorkingDays(startDate, endDate);
        setDuration(`${workingDays} Hari Kerja`);
    }, [startDate, endDate]);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            const selectedUri = result.assets ? result.assets[0].uri : result.uri;
            setImage(selectedUri);

            // Fetch file information using FileSystem
            try {
                const fileInfo = await FileSystem.getInfoAsync(selectedUri);
                setImageInfo(fileInfo);
                console.log('File Info:', fileInfo);
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    };
    // Handle input focus
    const handleFocus = (inputName) => {
        setFocusedInput(inputName);
    };

    // Handle input blur
    const handleBlur = () => {
        setFocusedInput(null);
    };
    const handleFieldClick = (field) => {
        setSelectedField(field); // Set the field being selected (assignTo or approval)
        setIsModalVisible(true); // Show the modal
    };

    const handleEmployeeSelect = (employee) => {
        if (selectedField === 'assignTo') {
            // Handle multi-selection for assignTo (store employee object { id, employee_name })
            if (assignTo.find((emp) => emp.id === employee.id)) {
                setAssignTo(assignTo.filter((emp) => emp.id !== employee.id)); // Remove employee if already selected
            } else {
                setAssignTo([...assignTo, employee]); // Add employee if not already selected
            }
        } else if (selectedField === 'approval1') {
            setApproval1(employee);
        } else if (selectedField === 'approval2') {
            setApproval2(employee);
        } else if (selectedField === 'approval3') {
            setApproval3(employee);
        } else if (selectedField === 'approval4') {
            setApproval4(employee);
        }
        setIsModalVisible(false); // Hide the modal after selecting
    };

    const renderEmployeeItem = ({ item }) => {
        const isSelected = selectedField === 'assignTo' ? assignTo.some((emp) => emp.id === item.id) : false;
        return (
            <TouchableOpacity
                style={[styles.employeeItem, isSelected ? styles.selectedItem : null]}
                onPress={() => handleEmployeeSelect(item)}
            >
                <Text style={styles.employeeName}>{item.employee_name}</Text>
                <Text style={styles.employeeDetails}>
                    {item.job_name} - {item.team_name}
                </Text>
            </TouchableOpacity>
        );
    };

    const filterEmployees = () => {
        if (selectedField && selectedField.startsWith('approval')) {
            const selectedApprovals = [approval1?.id, approval2?.id, approval3?.id, approval4?.id];
            return employees.filter((emp) => !selectedApprovals.includes(emp.id)); // Filter out already selected approvals
        }
        return employees;
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true); // Start loading

            if (!adhocName.trim()) {
                setAlertType('error');
                setAlertMessage('Nama Tugas harus diisi');
                setShowAlert(true);
                setIsLoading(false); // Stop loading on validation error
                return;
            }

            // Get employee_id and company_id from AsyncStorage
            const employeeId = await AsyncStorage.getItem('employeeId');
            const companyId = await AsyncStorage.getItem('companyId');

            // Format approvals array
            const formattedApprovals = [];
            if (approval1) {
                formattedApprovals.push({
                    level: 1,
                    employee_id: approval1.id,
                });
            }
            if (approval2) {
                formattedApprovals.push({
                    level: 2,
                    employee_id: approval2.id,
                });
            }
            if (approval3) {
                formattedApprovals.push({
                    level: 3,
                    employee_id: approval3.id,
                });
            }
            if (approval4) {
                formattedApprovals.push({
                    level: 4,
                    employee_id: approval4.id,
                });
            }

            // Format dates to YYYY-MM-DD
            const formatDate = (date) => {
                return date.toISOString().split('T')[0];
            };

            const taskData = {
                company_id: parseInt(companyId),
                adhoc_name: adhocName,
                adhoc_desc: adhocDesc || '',
                adhoc_start_date: formatDate(startDate),
                adhoc_end_date: formatDate(endDate),
                adhoc_assign_by: parseInt(employeeId),
                adhoc_status: 'working_on_it',
                adhoc_current_level: 0,
                assign_to: assignTo.map((emp) => emp.id),
                approvals: formattedApprovals,
                adhoc_assigner_images: image ? image : '',
            };

            await createAdhocTask(taskData);

            setAlertType('success');
            setAlertMessage('Tugas berhasil dibuat');
            setShowAlert(true);
        } catch (error) {
            console.error('Error creating task:', error);
            setAlertType('error');
            setAlertMessage(error.message || 'Gagal membuat tugas');
            setShowAlert(true);
        } finally {
            setIsLoading(false); // Stop loading regardless of success/failure
        }
    };
    // Handle alert confirmation
    const handleAlertConfirm = () => {
        setShowAlert(false);
        if (alertType === 'success') {
            navigation.goBack();
        }
    };
    // Modified input style function
    const getInputStyle = (inputName) => {
        return [styles.input, focusedInput === inputName && styles.focusedInput];
    };
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            <LinearGradient colors={['#4A90E2', '#4A90E2']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Tugas Harian</Text>
                    <View style={styles.placeholder} />
                </View>
            </LinearGradient>

            <ScrollView style={styles.scrollView}>
                <View style={styles.formContainer}>
                    <Text style={styles.label}>Nama Tugas</Text>
                    <TextInput
                        value={adhocName}
                        onChangeText={setAdhocName}
                        placeholder="Masukkan Nama Tugas Anda"
                        style={getInputStyle('adhocName')}
                        onFocus={() => handleFocus('adhocName')}
                        onBlur={handleBlur}
                    />
                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>Mulai</Text>
                            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
                                <TextInput value={formatDate(startDate)} editable={false} style={styles.dateInput} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.column}>
                            <Text style={styles.label}>Selesai</Text>
                            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
                                <TextInput value={formatDate(endDate)} editable={false} style={styles.dateInput} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>Ditugaskan Kepada</Text>
                            <TouchableOpacity onPress={() => handleFieldClick('assignTo')}>
                                <TextInput
                                    value={
                                        assignTo.length > 0 ? assignTo.map((emp) => emp.employee_name).join(', ') : ''
                                    }
                                    style={styles.input}
                                    editable={false}
                                    placeholder="Pilih Pegawai"
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.column}>
                            <Text style={styles.label}>Durasi</Text>
                            <TextInput value={duration} style={styles.input} editable={false} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>Approval 1</Text>
                            <TouchableOpacity onPress={() => handleFieldClick('approval1')}>
                                <TextInput
                                    value={approval1?.employee_name || ''}
                                    style={styles.input}
                                    editable={false}
                                    placeholder="Pilih Approval 1"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.column}>
                            <Text style={styles.label}>Approval 2</Text>
                            <TouchableOpacity
                                onPress={() => handleFieldClick('approval2')}
                                disabled={!approval1} // Disable if approval1 not selected
                            >
                                <TextInput
                                    value={approval2?.employee_name || ''}
                                    style={[styles.input, !approval1 && styles.disabledInput]}
                                    editable={false}
                                    placeholder="Pilih Approval 2"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={styles.column}>
                            <Text style={styles.label}>Approval 3</Text>
                            <TouchableOpacity
                                onPress={() => handleFieldClick('approval3')}
                                disabled={!approval2} // Disable if approval2 not selected
                            >
                                <TextInput
                                    value={approval3?.employee_name || ''}
                                    style={[styles.input, !approval2 && styles.disabledInput]}
                                    editable={false}
                                    placeholder="Pilih Approval 3"
                                />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.column}>
                            <Text style={styles.label}>Approval 4</Text>
                            <TouchableOpacity
                                onPress={() => handleFieldClick('approval4')}
                                disabled={!approval3} // Disable if approval3 not selected
                            >
                                <TextInput
                                    value={approval4?.employee_name || ''}
                                    style={[styles.input, !approval3 && styles.disabledInput]}
                                    editable={false}
                                    placeholder="Pilih Approval 4"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Text style={styles.label}>Pilih Foto Tugas</Text>
                    {image ? (
                        <TouchableOpacity onPress={pickImage}>
                            <Image source={{ uri: image }} style={styles.selectedImage} />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={pickImage} style={styles.uploadButton}>
                            <Feather name="paperclip" size={20} color="#FFF" />
                            <Text style={styles.uploadText}>Pilih Bukti</Text>
                        </TouchableOpacity>
                    )}

                    {/* {imageInfo && (
                        <Text style={styles.infoText}>
                            File Size: {imageInfo.size} bytes{'\n'}
                            URI: {imageInfo.uri}
                        </Text>
                    )} */}

                    <Text style={styles.label}>Keterangan</Text>
                    <TextInput
                        value={adhocDesc}
                        onChangeText={setAdhocDesc}
                        placeholder="Tidak Ada Keterangan"
                        multiline={true}
                        numberOfLines={4}
                        style={[styles.textArea, focusedInput === 'adhocDesc' && styles.focusedInput]}
                        onFocus={() => handleFocus('adhocDesc')}
                        onBlur={handleBlur}
                    />

                    {showStartPicker && (
                        <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDateChange} />
                    )}

                    {showEndPicker && (
                        <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndDateChange} />
                    )}
                </View>
            </ScrollView>

            <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#FFF" size="small" />
                    ) : (
                        <Text style={styles.submitButtonText}>Simpan</Text>
                    )}
                </TouchableOpacity>
            </View>
            <ReusableAlert
                show={showAlert}
                alertType={alertType}
                message={alertMessage}
                onConfirm={handleAlertConfirm}
            />
            {/* Modal for employee selection */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Pilih Pegawai</Text>
                        {employees.length > 0 ? (
                            <FlatList
                                data={filterEmployees()}
                                keyExtractor={(item) => item.id.toString()}
                                renderItem={renderEmployeeItem}
                            />
                        ) : (
                            <Text>No employees available</Text>
                        )}
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsModalVisible(false)}>
                            <Text style={styles.modalCloseButtonText}>Tutup</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        height: 60,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 24,
    },
    formContainer: {
        padding: 16,
        paddingBottom: 32,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#333',
    },
    // Add new styles for focused state
    focusedInput: {
        borderColor: '#4A90E2',
        borderWidth: 2,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
        backgroundColor: '#fff',
        height: 40,
    },

    textArea: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        padding: 8,
        marginBottom: 16,
        backgroundColor: '#fff',
        height: 40,
    },
    disabledInput: {
        backgroundColor: '#f0f0f0',
        color: '#aaa',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    column: {
        flex: 1,
        marginRight: 8,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        marginBottom: 16,
        backgroundColor: '#fff',
        height: 40,
        justifyContent: 'center',
    },
    picker: {
        height: 40,
    },
    uploadButton: {
        backgroundColor: '#4A90E2',
        padding: 12,
        borderRadius: 4,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadText: {
        color: '#FFF',
        marginLeft: 8,
    },
    selectedImage: {
        width: '100%',
        height: 200,
        borderRadius: 10,
        marginBottom: 16,
        resizeMode: 'contain',
    },
    submitButtonContainer: {
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        borderRadius: 10,
        padding: 20,
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    employeeItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
    },
    selectedItem: {
        backgroundColor: '#E0E0E0', // Highlight selected items
    },
    modalCloseButton: {
        marginTop: 10,
        padding: 10,
        backgroundColor: '#4A90E2',
        borderRadius: 5,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddAdhocTask;
