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
    Animated,
    Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getEmployeeByCompany } from '../api/general';
import { createAdhocTask } from '../api/adhocTask';
import ReusableAlert from '../components/ReusableAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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
    const [scaleAnim] = useState(new Animated.Value(1));
    const [fadeAnim] = useState(new Animated.Value(1));
    const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

    // Fetch employees when modal opens
    useEffect(() => {
        if (isModalVisible) {
            fetchEmployees();
        }
    }, [isModalVisible]);

    const fetchEmployees = async () => {
        try {
            setIsLoadingEmployees(true);
            const companyId = await AsyncStorage.getItem('companyId');
            const token = await AsyncStorage.getItem('token');

            if (!companyId) {
                throw new Error('Company ID not found');
            }

            const response = await getEmployeeByCompany(companyId);
            setEmployees(response || []); // Ensure it's always an array
        } catch (error) {
            console.error('Error fetching employee data:', error);
            setEmployees([]); // Set empty array on error
            Alert.alert('Error', error.message || 'Failed to fetch employees');
        } finally {
            setIsLoadingEmployees(false);
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
    // Handle input focus with animation
    const handleFocus = (inputName) => {
        setFocusedInput(inputName);
        Animated.spring(scaleAnim, {
            toValue: 1.02,
            useNativeDriver: true,
        }).start();
    };

    // Handle input blur with animation
    const handleBlur = () => {
        setFocusedInput(null);
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };
    const handleFieldClick = (field) => {
        setSelectedField(field); // Set the field being selected (assignTo or approval)
        setIsModalVisible(true); // Show the modal

        // Fetch employees if not already loaded
        if (employees.length === 0) {
            fetchEmployees();
        }
    };

    const handleEmployeeSelect = (employee) => {
        if (selectedField === 'assignTo') {
            // Handle multi-selection for assignTo (store employee object { id, employee_name })
            if (assignTo.find((emp) => emp.id === employee.id)) {
                setAssignTo(assignTo.filter((emp) => emp.id !== employee.id)); // Remove employee if already selected
            } else {
                setAssignTo([...assignTo, employee]); // Add employee if not already selected
            }
            // Don't close modal for multi-select
            return;
        } else if (selectedField === 'approval1') {
            setApproval1(employee);
        } else if (selectedField === 'approval2') {
            setApproval2(employee);
        } else if (selectedField === 'approval3') {
            setApproval3(employee);
        } else if (selectedField === 'approval4') {
            setApproval4(employee);
        }

        // Close modal for single selections (approvals)
        setIsModalVisible(false);
    };

    const renderEmployeeItem = ({ item }) => {
        const isSelected = selectedField === 'assignTo' ? assignTo.some((emp) => emp.id === item.id) : false;
        return (
            <TouchableOpacity
                style={[styles.employeeItem, isSelected && styles.selectedEmployeeItem]}
                onPress={() => handleEmployeeSelect(item)}
                activeOpacity={0.8}
            >
                <View style={styles.employeeInfo}>
                    <View style={styles.employeeAvatar}>
                        <MaterialIcons name="person" size={20} color={isSelected ? '#FFF' : '#4A90E2'} />
                    </View>
                    <View style={styles.employeeDetails}>
                        <Text style={[styles.employeeName, isSelected && styles.selectedEmployeeName]}>
                            {item.employee_name}
                        </Text>
                        <Text style={[styles.employeeSubtitle, isSelected && styles.selectedEmployeeSubtitle]}>
                            {item.job_name} • {item.team_name}
                        </Text>
                    </View>
                </View>
                {isSelected && <MaterialIcons name="check-circle" size={20} color="#4CAF50" />}
            </TouchableOpacity>
        );
    };

    const filterEmployees = () => {
        // First filter out disabled employees
        const activeEmployees = employees.filter((emp) => !emp.disable);

        if (selectedField && selectedField.startsWith('approval')) {
            const selectedApprovals = [approval1?.id, approval2?.id, approval3?.id, approval4?.id];
            const filtered = activeEmployees.filter((emp) => !selectedApprovals.includes(emp.id));
            return filtered;
        }
        return activeEmployees;
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
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />

            {/* Modern Header with Gradient */}
            <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
                        <Feather name="arrow-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Buat Tugas Baru</Text>
                    <View style={styles.headerRightSpace} />
                </View>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Form Card Container */}
                <View style={styles.formCard}>
                    {/* Task Info Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="assignment" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Informasi Tugas</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nama Tugas *</Text>
                            <Animated.View
                                style={[
                                    styles.inputWrapper,
                                    focusedInput === 'adhocName' && styles.focusedInputWrapper,
                                    { transform: [{ scale: focusedInput === 'adhocName' ? scaleAnim : 1 }] },
                                ]}
                            >
                                <TextInput
                                    value={adhocName}
                                    onChangeText={setAdhocName}
                                    placeholder="Masukkan nama tugas yang akan dikerjakan"
                                    placeholderTextColor="#999"
                                    style={styles.textInput}
                                    onFocus={() => handleFocus('adhocName')}
                                    onBlur={handleBlur}
                                />
                            </Animated.View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Deskripsi Tugas</Text>
                            <Animated.View
                                style={[
                                    styles.inputWrapper,
                                    styles.textAreaWrapper,
                                    focusedInput === 'adhocDesc' && styles.focusedInputWrapper,
                                    { transform: [{ scale: focusedInput === 'adhocDesc' ? scaleAnim : 1 }] },
                                ]}
                            >
                                <TextInput
                                    value={adhocDesc}
                                    onChangeText={setAdhocDesc}
                                    placeholder="Tambahkan deskripsi atau keterangan tugas (opsional)"
                                    placeholderTextColor="#999"
                                    multiline={true}
                                    numberOfLines={4}
                                    style={[styles.textInput, styles.textArea]}
                                    onFocus={() => handleFocus('adhocDesc')}
                                    onBlur={handleBlur}
                                />
                            </Animated.View>
                        </View>
                    </View>

                    {/* Timeline Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="schedule" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Jadwal Tugas</Text>
                        </View>

                        <View style={styles.dateRow}>
                            <View style={styles.dateColumn}>
                                <Text style={styles.label}>Tanggal Mulai</Text>
                                <TouchableOpacity
                                    onPress={() => setShowStartPicker(true)}
                                    style={styles.dateButton}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="event" size={18} color="#4A90E2" />
                                    <Text style={styles.dateText}>{formatDate(startDate)}</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.dateColumn}>
                                <Text style={styles.label}>Tanggal Selesai</Text>
                                <TouchableOpacity
                                    onPress={() => setShowEndPicker(true)}
                                    style={styles.dateButton}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="event" size={18} color="#4A90E2" />
                                    <Text style={styles.dateText}>{formatDate(endDate)}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.durationContainer}>
                            <Text style={styles.label}>Durasi Estimasi</Text>
                            <View style={styles.durationBadge}>
                                <MaterialIcons name="timer" size={16} color="#4A90E2" />
                                <Text style={styles.durationText}>{duration}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Assignment Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="people" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Penugasan</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Ditugaskan Kepada *</Text>
                            <TouchableOpacity
                                onPress={() => handleFieldClick('assignTo')}
                                style={styles.selectButton}
                                activeOpacity={0.8}
                            >
                                <View style={styles.selectContent}>
                                    <MaterialIcons name="person-add" size={18} color="#4A90E2" />
                                    <Text style={[styles.selectText, assignTo.length === 0 && styles.placeholderText]}>
                                        {assignTo.length > 0
                                            ? assignTo.map((emp) => emp.employee_name).join(', ')
                                            : 'Pilih karyawan yang akan mengerjakan tugas'}
                                    </Text>
                                </View>
                                <MaterialIcons name="chevron-right" size={20} color="#999" />
                            </TouchableOpacity>
                            {assignTo.length > 0 && (
                                <View style={styles.selectedEmployeesContainer}>
                                    {assignTo.map((emp, index) => (
                                        <View key={emp.id} style={styles.employeeChip}>
                                            <Text style={styles.employeeChipText}>{emp.employee_name}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Approval Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="verified-user" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Persetujuan</Text>
                        </View>

                        <View style={styles.approvalGrid}>
                            {[
                                { key: 'approval1', value: approval1, label: 'Approval 1', enabled: true },
                                { key: 'approval2', value: approval2, label: 'Approval 2', enabled: !!approval1 },
                                { key: 'approval3', value: approval3, label: 'Approval 3', enabled: !!approval2 },
                                { key: 'approval4', value: approval4, label: 'Approval 4', enabled: !!approval3 },
                            ].map((approval, index) => (
                                <View key={approval.key} style={styles.approvalItem}>
                                    <Text style={[styles.label, !approval.enabled && styles.disabledLabel]}>
                                        {approval.label}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleFieldClick(approval.key)}
                                        style={[styles.approvalButton, !approval.enabled && styles.disabledButton]}
                                        disabled={!approval.enabled}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.approvalContent}>
                                            <MaterialIcons
                                                name={approval.value ? 'person' : 'person-outline'}
                                                size={16}
                                                color={approval.enabled ? '#4A90E2' : '#ccc'}
                                            />
                                            <Text
                                                style={[
                                                    styles.approvalText,
                                                    !approval.enabled && styles.disabledText,
                                                    !approval.value && styles.placeholderText,
                                                ]}
                                            >
                                                {approval.value?.employee_name || `Pilih ${approval.label}`}
                                            </Text>
                                        </View>
                                        {approval.enabled && (
                                            <MaterialIcons name="chevron-right" size={16} color="#999" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Attachment Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <MaterialIcons name="attach-file" size={20} color="#4A90E2" />
                            <Text style={styles.sectionTitle}>Lampiran</Text>
                        </View>

                        {image ? (
                            <View style={styles.imageContainer}>
                                <TouchableOpacity onPress={pickImage} activeOpacity={0.8}>
                                    <Image source={{ uri: image }} style={styles.selectedImage} />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => setImage(null)}
                                    style={styles.removeImageButton}
                                    activeOpacity={0.8}
                                >
                                    <MaterialIcons name="close" size={16} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={pickImage} style={styles.uploadButton} activeOpacity={0.8}>
                                <View style={styles.uploadContent}>
                                    <MaterialIcons name="cloud-upload" size={32} color="#4A90E2" />
                                    <Text style={styles.uploadTitle}>Pilih Foto Tugas</Text>
                                    <Text style={styles.uploadSubtitle}>Tambahkan gambar sebagai referensi tugas</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Date Pickers */}
                {showStartPicker && (
                    <DateTimePicker value={startDate} mode="date" display="default" onChange={onStartDateChange} />
                )}

                {showEndPicker && (
                    <DateTimePicker value={endDate} mode="date" display="default" onChange={onEndDateChange} />
                )}
            </ScrollView>

            {/* Fixed Submit Button */}
            <View style={styles.submitContainer}>
                <TouchableOpacity
                    style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={isLoading ? ['#ccc', '#aaa'] : ['#4A90E2', '#357ABD']}
                        style={styles.submitGradient}
                    >
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator color="#FFF" size="small" />
                                <Text style={styles.submitButtonText}>Menyimpan...</Text>
                            </View>
                        ) : (
                            <View style={styles.submitContent}>
                                <MaterialIcons name="save" size={20} color="#FFF" />
                                <Text style={styles.submitButtonText}>Simpan Tugas</Text>
                            </View>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            </View>

            {/* Reusable Alert */}
            <ReusableAlert
                show={showAlert}
                alertType={alertType}
                message={alertMessage}
                onConfirm={handleAlertConfirm}
            />

            {/* Modern Employee Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {selectedField === 'assignTo' ? 'Pilih Karyawan' : 'Pilih Approval'}
                            </Text>
                            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseIcon}>
                                <MaterialIcons name="close" size={24} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalContent}>
                            {isLoadingEmployees ? (
                                <View style={styles.loadingState}>
                                    <ActivityIndicator size="large" color="#4A90E2" />
                                    <Text style={styles.loadingText}>Memuat daftar karyawan...</Text>
                                </View>
                            ) : employees.length > 0 ? (
                                <FlatList
                                    data={filterEmployees()}
                                    keyExtractor={(item) => item.id.toString()}
                                    renderItem={renderEmployeeItem}
                                    showsVerticalScrollIndicator={true}
                                    ItemSeparatorComponent={() => <View style={styles.employeeSeparator} />}
                                    style={styles.employeeList}
                                    contentContainerStyle={{ paddingBottom: 20 }}
                                    bounces={true}
                                    removeClippedSubviews={false}
                                    initialNumToRender={10}
                                    windowSize={10}
                                />
                            ) : (
                                <View style={styles.emptyState}>
                                    <MaterialIcons name="people-outline" size={48} color="#ccc" />
                                    <Text style={styles.emptyStateText}>Tidak ada karyawan tersedia</Text>
                                    <TouchableOpacity
                                        onPress={fetchEmployees}
                                        style={styles.retryButton}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={styles.retryButtonText}>Coba Lagi</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* Show Done button for multi-select (assignTo) */}
                        {selectedField === 'assignTo' && (
                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    onPress={() => setIsModalVisible(false)}
                                    style={styles.doneButton}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.doneButtonText}>
                                        Selesai {assignTo.length > 0 ? `(${assignTo.length} dipilih)` : ''}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        paddingTop: 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    headerRightSpace: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    formCard: {
        margin: 16,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
        marginBottom: 8,
    },
    disabledLabel: {
        color: '#bbb',
    },
    inputWrapper: {
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        backgroundColor: '#fff',
        transition: 'all 0.2s ease',
    },
    focusedInputWrapper: {
        borderColor: '#4A90E2',
        elevation: 2,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    textInput: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
        fontWeight: '400',
    },
    textAreaWrapper: {
        minHeight: 100,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
        paddingTop: 12,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    dateColumn: {
        flex: 1,
    },
    dateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 12,
        gap: 8,
    },
    dateText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    durationContainer: {
        marginTop: 16,
    },
    durationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#f8f9ff',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    durationText: {
        fontSize: 14,
        color: '#4A90E2',
        fontWeight: '600',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 12,
    },
    selectContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    selectText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    placeholderText: {
        color: '#999',
        fontWeight: '400',
    },
    selectedEmployeesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
        gap: 8,
    },
    employeeChip: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    employeeChipText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '500',
    },
    approvalGrid: {
        gap: 12,
    },
    approvalItem: {
        marginBottom: 8,
    },
    approvalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#e1e5e9',
        borderRadius: 12,
    },
    disabledButton: {
        backgroundColor: '#f8f9fa',
        borderColor: '#e9ecef',
    },
    approvalContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 8,
    },
    approvalText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
    },
    disabledText: {
        color: '#bbb',
    },
    imageContainer: {
        position: 'relative',
        alignItems: 'center',
    },
    selectedImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        resizeMode: 'cover',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 12,
        padding: 4,
    },
    uploadButton: {
        backgroundColor: '#f0f7ff',
        borderWidth: 2,
        borderColor: '#4A90E2',
        borderStyle: 'dashed',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
    },
    uploadContent: {
        alignItems: 'center',
        gap: 8,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A90E2',
    },
    uploadSubtitle: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
    },
    submitContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: 16,
        paddingBottom: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 2,
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    submitButtonDisabled: {
        elevation: 0,
        shadowOpacity: 0,
    },
    submitGradient: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    modalCloseIcon: {
        padding: 4,
    },
    modalContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
        minHeight: 300,
    },
    employeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#fff',
        marginVertical: 4,
        borderWidth: 1,
        borderColor: '#f0f0f0',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    selectedEmployeeItem: {
        backgroundColor: '#e3f2fd',
        borderWidth: 1,
        borderColor: '#4A90E2',
    },
    employeeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    employeeAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    employeeDetails: {
        flex: 1,
    },
    employeeName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    selectedEmployeeName: {
        color: '#4A90E2',
    },
    employeeSubtitle: {
        fontSize: 12,
        color: '#666',
    },
    selectedEmployeeSubtitle: {
        color: '#4A90E2',
    },
    employeeSeparator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginVertical: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#999',
        marginTop: 12,
        textAlign: 'center',
    },
    loadingState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
        marginTop: 12,
        textAlign: 'center',
    },
    employeeList: {
        flex: 1,
        marginTop: 8,
    },
    retryButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
        marginTop: 16,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    modalFooter: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    doneButton: {
        backgroundColor: '#4A90E2',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
    },
    doneButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default AddAdhocTask;
