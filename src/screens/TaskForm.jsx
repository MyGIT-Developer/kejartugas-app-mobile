import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    ActivityIndicator,
    Dimensions,
    ScrollView,
    RefreshControl,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    Image,
    PermissionsAndroid,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox'; // External CheckBox component
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker'; // Import Image Picker
import * as FileSystem from 'expo-file-system'; // Import FileSystem
import { Feather } from '@expo/vector-icons';
import { addNewTask, updateTask } from '../api/task';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary } from 'react-native-image-picker';
import notificationService from '../utils/notificationService';

const TaskForm = () => {
    const route = useRoute();
    const { mode = 'create', initialTaskData = null, projectData } = route.params;
    const [companyId, setCompanyId] = useState('');
    const [employeeId, setEmployeeId] = useState('');
    const [jobId, setJobId] = useState('');
    const [imageUri, setImageUri] = useState(null);

    const navigation = useNavigation();
    const [formData, setFormData] = useState({
        project_id: projectData.id,
        company_id: companyId,
        task_name: initialTaskData?.task_name || '',
        assign_by: initialTaskData?.assign_by || employeeId,
        assign_to: initialTaskData?.assigned_employees.map((employee) => employee.employee_id) || [],
        start_date: initialTaskData?.start_date ? new Date(initialTaskData.start_date) : new Date(),
        end_date: initialTaskData?.end_date ? new Date(initialTaskData.end_date) : new Date(),
        task_description: initialTaskData?.task_description || '',
        task_label: initialTaskData?.task_label || '',
        description_images: initialTaskData?.description_images || '',
    });
    const [image, setImage] = useState(null);
    const [assignedEmployees, setAssignedEmployees] = useState([]);
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [availableEmployees, setAvailableEmployees] = useState([]);

    // Initialize assigned employees from project data
    useEffect(() => {
        const assignedEmployeesInProject = projectData.assignedEmployees;
        setAssignedEmployees(assignedEmployeesInProject);
    }, [projectData]);

    // Update available employees when assigned employees or form data changes
    useEffect(() => {
        if (assignedEmployees.length > 0) {
            setAvailableEmployees(assignedEmployees.filter((emp) => !formData.assign_to.includes(emp.id)));
        }
    }, [assignedEmployees, formData.assign_to]);

    const updateFormField = useCallback((field, value) => {
        setFormData((prevState) => ({ ...prevState, [field]: value }));
    }, []);

    useEffect(() => {
        const getData = async () => {
            try {
                const companyId = await AsyncStorage.getItem('companyId');
                const employeeId = await AsyncStorage.getItem('employeeId');
                const jobsId = await AsyncStorage.getItem('userJob');
                const roleId = await AsyncStorage.getItem('userRole');

                setCompanyId(companyId);
                setEmployeeId(employeeId);
                setJobId(jobsId);
                setFormData((prev) => ({
                    ...prev,
                    company_id: companyId,
                    role_id: roleId,
                    jobs_id: jobsId,
                    assign_by: employeeId,
                }));
            } catch (error) {
                console.error('Error fetching AsyncStorage data:', error);
            }
        };
        getData();
    }, []);

    const handleDateChange = useCallback(
        (field, event, selectedDate) => {
            const currentDate = selectedDate || formData[field];
            setFormData((prevState) => ({ ...prevState, [field]: currentDate }));
            field === 'start_date' ? setShowStartPicker(false) : setShowEndPicker(false);
        },
        [formData],
    );

    const renderDatePicker = useCallback(
        (field, showPicker, setShowPicker) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{field === 'start_date' ? 'Mulai' : 'Selesai'}</Text>
                <View>
                    <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.datePickerButton}>
                        <TextInput
                            style={styles.dateInput}
                            placeholder="Pilih Tanggal"
                            value={
                                formData[field]
                                    ? formData[field].toLocaleDateString('id-ID', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                      })
                                    : ''
                            }
                            editable={false}
                        />
                        <Feather name="calendar" size={24} color="#27A0CF" />
                    </TouchableOpacity>
                    {showPicker && (
                        <DateTimePicker
                            value={formData[field] || new Date()}
                            mode="date"
                            display="default"
                            borderRadius={25}
                            onChange={(event, selectedDate) => handleDateChange(field, event, selectedDate)}
                        />
                    )}
                </View>
            </View>
        ),
        [formData, handleDateChange],
    );

    const SelectedEmployees = ({ selectedIds, employees, onRemove }) => (
        <ScrollView
            horizontal={false}
            style={styles.scrollView}
            contentContainerStyle={styles.selectedEmployeesContainer}
        >
            {selectedIds.map((id) => {
                const employee = employees.find((emp) => emp.id === id);
                if (!employee) return null;
                return (
                    <View key={id} style={styles.selectedEmployee}>
                        <Text style={styles.selectedEmployeeName} numberOfLines={1} ellipsizeMode="tail">
                            {employee.employee_name}
                        </Text>
                        <TouchableOpacity onPress={() => onRemove(id)} style={styles.removeButton}>
                            <Icon name="close" size={18} color="#666" />
                        </TouchableOpacity>
                    </View>
                );
            })}
        </ScrollView>
    );

    const renderPicker = useCallback(
        (field, label, options, isMulti = false) => (
            <View style={styles.fieldGroup}>
                <Text style={styles.labelText}>{label}</Text>
                <View style={isMulti ? styles.multiPickerContainer : styles.pickerContainer}>
                    {isMulti && (
                        <SelectedEmployees
                            selectedIds={formData.assign_to}
                            employees={assignedEmployees}
                            onRemove={handleAssignToChange}
                        />
                    )}
                    {isMulti ? (
                        // <View style={styles.flatListContainer}>
                        <FlatList
                            style={styles.flatListContainer}
                            data={availableEmployees}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAssignToChange(item.id)}
                                    style={styles.contactItem}
                                >
                                    <View
                                        style={[
                                            styles.initialsCircle,
                                            { backgroundColor: getColorForInitials(item.employee_name) },
                                        ]}
                                    >
                                        <Text style={styles.initialsText}>{getInitials(item.employee_name)}</Text>
                                    </View>
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>{item.employee_name}</Text>
                                        <Text>{item.job_name}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            scrollEnabled={true}
                            nestedScrollEnabled={true}
                        />
                    ) : (
                        // </View>
                        <Picker
                            selectedValue={formData[field]}
                            onValueChange={(itemValue) => {
                                field === 'assign_by'
                                    ? handleAssignByChange(itemValue)
                                    : updateFormField(field, itemValue);
                            }}
                            style={styles.picker}
                        >
                            <Picker.Item label="Select an option" value="" />
                            {options.map((option) => (
                                <Picker.Item key={option.value} label={option.label} value={option.value} />
                            ))}
                        </Picker>
                    )}
                </View>
            </View>
        ),
        [formData.assign_to, assignedEmployees, availableEmployees, handleAssignToChange],
    );

    const getInitials = (name) => {
        return name
            .split(' ')
            .map((word) => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getColorForInitials = (name) => {
        const colors = ['#4A90E2', '#50E3C2', '#E35050', '#E3A050'];
        if (typeof name !== 'string' || name.length === 0) {
            return colors[0];
        }
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const handleAssignByChange = useCallback(
        (value) => {
            updateFormField('assign_by', value);
            updateFormField('assign_to', []);
        },
        [updateFormField],
    );

    const handleAssignToChange = useCallback((value) => {
        setFormData((prevState) => {
            const updatedAssignTo = prevState.assign_to.includes(value)
                ? prevState.assign_to.filter((item) => item !== value)
                : [...prevState.assign_to, value];

            return { ...prevState, assign_to: updatedAssignTo };
        });
    }, []);

    const validateForm = () => {
        if (mode === 'create') {
            if (!formData.task_name || !formData.assign_to.length) {
                throw new Error('Harap isi semua field yang wajib');
            }
        }
        return true;
    };

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

    // const handleSubmit = useCallback(async () => {
    //     try {
    //         const response = await addNewTask(formData);
    //         setAlert({ show: true, type: 'success', message: response.message });

    //         setTimeout(() => {
    //             navigation.goBack();
    //         }, 2000);
    //     } catch (error) {
    //         console.log('Error creating task:', error);
    //         setAlert({ show: true, type: 'error', message: error.message });
    //     }
    //     console.log(formData);
    // }, [formData, companyId]);

    const [hasNotificationPermission, setHasNotificationPermission] = useState(false);

    // Modify your existing useEffect for notification setup
    useEffect(() => {
        setupNotifications();
    }, []);

    const setupNotifications = async () => {
        try {
            const permissionGranted = await notificationService.requestPermissions();
            setHasNotificationPermission(permissionGranted);
        } catch (error) {
            console.error('Error setting up notifications:', error);
            setHasNotificationPermission(false);
        }
    };

    // Function to send task assignment notification
    const sendTaskAssignmentNotification = async (taskName, assignees) => {
        if (!hasNotificationPermission) return;

        const assigneeNames = assignees
            .map(id => assignedEmployees.find(emp => emp.id === id)?.employee_name)
            .filter(Boolean)
            .join(', ');

        // Notification for the task creator
        await notificationService.sendLocalNotification(
            'Task Created Successfully ✅',
            `Task "${taskName}" has been assigned to ${assigneeNames}`
        );

        // Schedule deadline reminder if end date exists
        if (formData.end_date) {
            // Reminder 1 day before deadline
            const reminderDate = new Date(formData.end_date);
            reminderDate.setDate(reminderDate.getDate() - 1);
            reminderDate.setHours(9, 0, 0); // Set to 9 AM

            await notificationService.scheduleNotification(
                'Task Deadline Reminder ⏰',
                `Task "${taskName}" is due tomorrow!`,
                reminderDate
            );

            // Reminder on the morning of the deadline
            const deadlineDate = new Date(formData.end_date);
            deadlineDate.setHours(9, 0, 0); // Set to 9 AM

            await notificationService.scheduleNotification(
                'Task Due Today ⚠️',
                `Task "${taskName}" is due today!`,
                deadlineDate
            );
        }
    };

    // Function to send task update notification
    const sendTaskUpdateNotification = async (taskName, status, assignees) => {
        if (!hasNotificationPermission) return;

        const assigneeNames = assignees
            .map(id => assignedEmployees.find(emp => emp.id === id)?.employee_name)
            .filter(Boolean)
            .join(', ');

        await notificationService.sendLocalNotification(
            'Task Updated 🔄',
            `Task "${taskName}" has been updated. Assigned to: ${assigneeNames}`
        );
    };

    const handleSubmit = useCallback(async () => {
        try {
            validateForm();

            const response = mode === 'create' 
                ? await addNewTask(formData) 
                : await updateTask(initialTaskData.id, formData, jobId);

            // Handle notifications based on mode
            if (response.data) {
                try {
                    if (mode === 'create') {
                        await sendTaskAssignmentNotification(
                            formData.task_name,
                            formData.assign_to
                        );
                    } else {
                        await sendTaskUpdateNotification(
                            formData.task_name,
                            'updated',
                            formData.assign_to
                        );
                    }
                } catch (notifError) {
                    console.error('Notification error:', notifError);
                    // Don't block the task creation/update if notification fails
                }
            }

            setAlert({
                show: true,
                type: 'success',
                message: response.message || `Task successfully ${mode === 'create' ? 'created' : 'updated'}`
            });

            // Navigate back after a short delay
            setTimeout(() => {
                navigation.goBack();
            }, 2000);

        } catch (error) {
            console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} task:`, error);
            setAlert({ 
                show: true, 
                type: 'error', 
                message: error.message 
            });
        }
    }, [formData, mode, initialTaskData, assignedEmployees, hasNotificationPermission]);

    const handleImagePick = () => {
        launchImageLibrary({ mediaType: 'photo' }, (response) => {
            if (response.assets) {
                // Assuming you want to use the first image selected
                setImage(response.assets[0].uri);
                updateFormField('description_images', response.assets[0]);
            }
        });
    };

return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
            colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
            style={styles.backgroundGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
        
        {/* Enhanced Header Section */}
        <View style={styles.headerSection}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <View style={styles.backButtonContainer}>
                    <Feather name="chevron-left" size={24} color="white" />
                </View>
            </TouchableOpacity>
            <View style={styles.headerContent}>
                <Text style={styles.header}>{mode === 'create' ? 'Tugas Baru' : 'Update Tugas'}</Text>
                <Text style={styles.subHeader}>
                    {mode === 'create' ? 'Tambahkan tugas baru untuk tim Anda' : 'Perbarui informasi tugas'}
                </Text>
            </View>
        </View>

        {/* Enhanced Form Container */}
        <View style={styles.formContainer}>
            {/* Task Name Field */}
            <View style={styles.fieldGroup}>
                <View style={styles.labelContainer}>
                    <Feather name="edit-3" size={18} color="#0E509E" />
                    <Text style={styles.labelText}>
                        Nama Tugas {mode === 'create' && <Text style={styles.required}>*</Text>}
                    </Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.input, 
                            mode === 'create' && !formData.task_name && styles.requiredField,
                            formData.task_name && styles.inputFilled
                        ]}
                        placeholder="Masukkan nama tugas yang jelas dan deskriptif"
                        placeholderTextColor="#999"
                        value={formData.task_name}
                        onChangeText={(value) => updateFormField('task_name', value)}
                    />
                    {formData.task_name ? (
                        <Feather name="check-circle" size={20} color="#10B981" style={styles.inputIcon} />
                    ) : null}
                </View>
            </View>

            {/* Task Label Field */}
            <View style={styles.fieldGroup}>
                <View style={styles.labelContainer}>
                    <Feather name="tag" size={18} color="#0E509E" />
                    <Text style={styles.labelText}>Label Tugas</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, formData.task_label && styles.inputFilled]}
                        placeholder="Tambahkan label untuk kategori tugas"
                        placeholderTextColor="#999"
                        value={formData.task_label}
                        onChangeText={(value) => updateFormField('task_label', value)}
                    />
                    {formData.task_label ? (
                        <Feather name="check-circle" size={20} color="#10B981" style={styles.inputIcon} />
                    ) : null}
                </View>
            </View>

            {/* Enhanced Date Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Feather name="calendar" size={20} color="#0E509E" />
                    <Text style={styles.sectionTitle}>Jadwal Tugas</Text>
                </View>
                <View style={styles.dateContainer}>
                    {renderDatePicker('start_date', showStartPicker, setShowStartPicker)}
                    {renderDatePicker('end_date', showEndPicker, setShowEndPicker)}
                </View>
            </View>

            {/* Enhanced Assignment Section */}
            <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                    <Feather name="users" size={20} color="#0E509E" />
                    <Text style={styles.sectionTitle}>
                        Penugasan {mode === 'create' && <Text style={styles.required}>*</Text>}
                    </Text>
                </View>
                <Text style={styles.sectionDescription}>
                    Pilih anggota tim yang akan bertanggung jawab atas tugas ini
                </Text>
                
                <View style={styles.multiPickerContainer}>
                    <SelectedEmployees
                        selectedIds={formData.assign_to}
                        employees={assignedEmployees}
                        onRemove={handleAssignToChange}
                    />
                    <View style={styles.employeeListContainer}>
                        <Text style={styles.listTitle}>Daftar Karyawan</Text>
                        <FlatList
                            style={styles.flatListContainer}
                            data={availableEmployees}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleAssignToChange(item.id)}
                                    style={[
                                        styles.contactItem,
                                        formData.assign_to.includes(item.id) && styles.contactItemSelected
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.initialsCircle,
                                            {
                                                backgroundColor: getColorForInitials(item.employee_name),
                                            },
                                        ]}
                                    >
                                        <Text style={styles.initialsText}>{getInitials(item.employee_name)}</Text>
                                    </View>
                                    <View style={styles.contactInfo}>
                                        <Text style={styles.contactName}>{item.employee_name}</Text>
                                        <Text style={styles.contactRole}>{item.job_name}</Text>
                                    </View>
                                    {formData.assign_to.includes(item.id) && (
                                        <Feather name="check-circle" size={20} color="#10B981" />
                                    )}
                                </TouchableOpacity>
                            )}
                            scrollEnabled={true}
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </View>
            </View>

            {/* Enhanced Description Field */}
            <View style={styles.fieldGroup}>
                <View style={styles.labelContainer}>
                    <Feather name="file-text" size={18} color="#0E509E" />
                    <Text style={styles.labelText}>Keterangan</Text>
                </View>
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[
                            styles.input, 
                            styles.textArea,
                            formData.task_description && styles.inputFilled
                        ]}
                        placeholder="Jelaskan detail tugas, requirements, dan ekspektasi hasil..."
                        placeholderTextColor="#999"
                        value={formData.task_description}
                        onChangeText={(value) => updateFormField('task_description', value)}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>
            </View>

            {/* Enhanced Upload Section */}
            <View style={styles.fieldGroup}>
                <View style={styles.labelContainer}>
                    <Feather name="paperclip" size={18} color="#0E509E" />
                    <Text style={styles.labelText}>Lampiran</Text>
                </View>
                <Text style={styles.fieldDescription}>
                    Tambahkan gambar atau dokumen pendukung untuk tugas ini
                </Text>
                <View style={styles.uploadContainer}>
                    <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
                        {imageUri ? (
                            <View style={styles.imageContainer}>
                                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                                <View style={styles.imageOverlay}>
                                    <Feather name="edit-2" size={20} color="white" />
                                </View>
                            </View>
                        ) : (
                            <View style={styles.uploadContent}>
                                <View style={styles.uploadIconContainer}>
                                    <Feather name="camera" size={28} color="#0E509E" />
                                    <Text style={styles.iconSeparator}>atau</Text>
                                    <Feather name="image" size={28} color="#0E509E" />
                                </View>
                                <Text style={styles.uploadText}>Tap untuk menambahkan foto</Text>
                                <Text style={styles.uploadSubtext}>Kamera • Galeri</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Enhanced Submit Button */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity 
                    style={[
                        styles.button,
                        !formData.task_name || formData.assign_to.length === 0 ? styles.buttonDisabled : null
                    ]} 
                    onPress={handleSubmit}
                    disabled={!formData.task_name || formData.assign_to.length === 0}
                >
                    <LinearGradient
                        colors={
                            !formData.task_name || formData.assign_to.length === 0 
                                ? ['#CBD5E0', '#A0AEC0'] 
                                : ['#0E509E', '#27A0CF']
                        }
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.buttonText}>
                            {mode === 'create' ? '✓ Simpan Tugas' : '✓ Update Tugas'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>

        <ReusableBottomPopUp
            show={alert.show}
            alertType={alert.type}
            message={alert.message}
            onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
        />
    </ScrollView>
)};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#F8FAFC',
    },
    backgroundGradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: '40%',
    },
    headerSection: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 20,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        left: 20,
        top: 60,
        zIndex: 1,
    },
    backButtonContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(10px)',
    },
    headerContent: {
        alignItems: 'center',
        marginTop: 20,
    },
    header: {
        fontSize: 28,
        fontWeight: '700',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subHeader: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
        letterSpacing: 0.2,
    },
    formContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 80,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    fieldGroup: {
        marginBottom: 28,
    },
    sectionContainer: {
        marginBottom: 32,
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1A202C',
        marginLeft: 12,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
        lineHeight: 20,
    },
    labelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    labelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        marginLeft: 10,
        flex: 1,
    },
    fieldDescription: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 12,
        lineHeight: 18,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        height: 56,
        borderColor: '#E2E8F0',
        borderWidth: 2,
        borderRadius: 14,
        paddingHorizontal: 18,
        paddingRight: 50,
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#1A202C',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inputFilled: {
        borderColor: '#10B981',
        backgroundColor: '#F0FDF4',
    },
    inputIcon: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    requiredField: {
        borderColor: '#EF4444',
        backgroundColor: '#FEF2F2',
    },
    required: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '600',
    },
    dateContainer: {
        gap: 16,
    },
    dateFieldContainer: {
        marginBottom: 0,
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        borderColor: '#E2E8F0',
        borderWidth: 2,
        borderRadius: 14,
        paddingHorizontal: 18,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    dateText: {
        fontSize: 16,
        color: '#1A202C',
        fontWeight: '500',
    },
    multiPickerContainer: {
        borderRadius: 14,
    },
    employeeListContainer: {
        marginTop: 16,
    },
    listTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 12,
    },
    flatListContainer: {
        maxHeight: 240,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        transition: 'all 0.2s ease',
    },
    contactItemSelected: {
        backgroundColor: '#EBF8FF',
        borderBottomColor: '#BEE3F8',
    },
    initialsCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    initialsText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 2,
    },
    contactRole: {
        fontSize: 14,
        color: '#64748B',
    },
    selectedEmployeesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 16,
    },
    selectedEmployee: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0E509E',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedEmployeeName: {
        fontSize: 14,
        marginRight: 8,
        fontWeight: '600',
        color: 'white',
    },
    removeButton: {
        padding: 2,
    },
    textArea: {
        height: 120,
        paddingTop: 18,
        paddingBottom: 18,
    },
    uploadContainer: {
        marginTop: 8,
    },
    uploadButton: {
        height: 180,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        overflow: 'hidden',
    },
    uploadContent: {
        alignItems: 'center',
    },
    uploadIconContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconSeparator: {
        marginHorizontal: 16,
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    uploadText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 4,
    },
    uploadSubtext: {
        fontSize: 14,
        color: '#64748B',
    },
    imageContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    imageOverlay: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        marginTop: 40,
    },
    button: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    buttonDisabled: {
        shadowOpacity: 0.1,
        elevation: 2,
    },
    buttonGradient: {
        paddingVertical: 18,
        paddingHorizontal: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 18,
        letterSpacing: 0.5,
    },
});

export default TaskForm;
