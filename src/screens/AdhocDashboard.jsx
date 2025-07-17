import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Image,
    TextInput,
    Modal,
    RefreshControl,
    Alert,
    Platform,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from '../utils/UseFonts';
import AdhocModalDetail from '../components/AdhocModalDetail';
import ReusableAlert from '../components/ReusableAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import {
    getAllAdhocTasks,
    getAdhocTaskDetail,
    getMyAdhocTasks,
    getPendingApprovalTasks,
    getHistoryTasks,
    cancelAdhocTask,
    approveAdhocTask,
    rejectAdhocTask,
    getMyAdhocTasksAssigner,
    submitAdhocTask,
} from '../api/adhocTask';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

const formatDate = (dateString) => {
    if (!dateString) return 'Tidak tersedia';

    try {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original string if invalid
        }

        return date.toLocaleDateString('id-ID', options);
    } catch (error) {
        return dateString; // Return original string if error
    }
};

// Helper function to truncate text
const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength - 3) + '...';
};

// Helper function to format date more concisely
const formatDateConcise = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
};

// Helper functions for status colors and text
const getStatusColor = (status) => {
    switch (status) {
        case 'working_on_it':
            return '#FFE082'; // Warm yellow
        case 'completed':
            return '#A5D6A7'; // Fresh green
        case 'waiting_for_approval':
            return '#90CAF9'; // Soft blue
        case 'rejected':
            return '#FFAB91'; // Soft red-orange
        case 'cancelled':
            return '#FFCDD2'; // Light red
        default:
            return '#E0E0E0'; // Light grey
    }
};

const getStatusTextColor = (status) => {
    switch (status) {
        case 'working_on_it':
            return '#F57C00'; // Orange
        case 'completed':
            return '#2E7D32'; // Dark green
        case 'waiting_for_approval':
            return '#1565C0'; // Dark blue
        case 'rejected':
            return '#D84315'; // Dark orange-red
        case 'cancelled':
            return '#C62828'; // Dark red
        default:
            return '#424242'; // Dark grey
    }
};

const getStatusText = (status) => {
    switch (status) {
        case 'working_on_it':
            return 'Sedang Dikerjakan';
        case 'completed':
            return 'Selesai';
        case 'waiting_for_approval':
            return 'Menunggu Persetujuan';
        case 'rejected':
            return 'Ditolak';
        case 'cancelled':
            return 'Dibatalkan';
        default:
            return 'Unknown';
    }
};

const BASE_URL = 'https://app.kejartugas.com/';

const AdhocDashboard = ({ navigation }) => {
    const [activeTab, setActiveTab] = useState('Tugas Dibuat');
    const [selectedTask, setSelectedTask] = useState(null);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [showSubmitSuccessAlert, setShowSubmitSuccessAlert] = useState(false);
    const [showApproveSuccessAlert, setShowApproveSuccessAlert] = useState(false);
    const [showRejectSuccessAlert, setShowRejectSuccessAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [refreshing, setRefreshing] = useState(false); // State for pull to refresh
    const tabs = ['Tugas Dibuat', 'Tugas Saya', 'Persetujuan', 'Riwayat'];
    const fontsLoaded = useFonts();
    const [adhocTasks, setAdhocTasks] = useState([]);
    const [myTasks, setMyTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [pendingApprovalTasks, setPendingApprovalTasks] = useState([]);
    const [historyTasks, setHistoryTasks] = useState([]);
    const [expandedSection, setExpandedSection] = useState(null);
    const [isApproveModalVisible, setIsApproveModalVisible] = useState(false);
    const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
    const [isSubmitModalVisible, setIsSubmitModalVisible] = useState(false);
    const [approvalComment, setApprovalComment] = useState('');
    const [submitReason, setSubmitReason] = useState('');
    const [submitImageUri, setSubmitImageUri] = useState(null);
    const [taskId, setTaskId] = useState(null);
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [isApprovalLevelDropdownOpen, setIsApprovalLevelDropdownOpen] = useState(false);

    useEffect(() => {
        getEmployeeId();
    }, []);

    useEffect(() => {
        if (employeeId) {
            if (activeTab === 'Tugas Dibuat') fetchAdhocTasks();
            else if (activeTab === 'Tugas Saya') fetchMyTasks();
            else if (activeTab === 'Persetujuan') fetchPendingApprovalTasks();
        }
    }, [activeTab, employeeId]);

    useEffect(() => {
        if (employeeId) fetchHistoryTasks();
    }, [employeeId]);

    const getEmployeeId = async () => {
        const id = await AsyncStorage.getItem('employeeId');
        setEmployeeId(id);
    };

    const fetchAdhocTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const companyId = await AsyncStorage.getItem('companyId');
            const response = await getAllAdhocTasks(companyId, employeeId);
            console.log('=== ADHOC TASKS API LOG ===');
            console.log('getAllAdhocTasks Response:', JSON.stringify(response, null, 2));
            console.log('=== END ADHOC TASKS LOG ===');

            if (response.status === 'success') setAdhocTasks(response.data);
            else setError(response.message || 'An error occurred');
        } catch (error) {
            setError('You do not have access to monitor adhoc tasks');
            console.error('Error fetching all adhoc tasks:', error.message);

            // Fallback to getMyAdhocTasksAssigner if access is denied
            try {
                const employeeId = await AsyncStorage.getItem('employeeId');
                const fallbackResponse = await getMyAdhocTasksAssigner(employeeId);
                console.log('=== FALLBACK ADHOC TASKS API LOG ===');
                console.log('getMyAdhocTasksAssigner Response:', JSON.stringify(fallbackResponse, null, 2));
                console.log('=== END FALLBACK LOG ===');

                setAdhocTasks(fallbackResponse.data); // Set tasks from fallback API
                setError(null); // Clear error since fallback was successful
            } catch (fallbackError) {
                setError(fallbackError.message || 'Fetching my adhoc tasks failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getMyAdhocTasks(employeeId);
            console.log('=== MY TASKS API LOG ===');
            console.log('getMyAdhocTasks Response:', JSON.stringify(response, null, 2));
            console.log('=== END MY TASKS LOG ===');

            if (response.status === 'success') setMyTasks(response.data);
            else setError(response.message || 'An error occurred');
        } catch (error) {
            setError('Failed to fetch your tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchTaskDetail = async (adhocId) => {
        try {
            const response = await getAdhocTaskDetail(adhocId);
            if (response.status === 'success') {
                console.log('=== FULL API RESPONSE LOG ===');
                console.log('Complete API Response:', JSON.stringify(response, null, 2));
                console.log('=== TASK DETAIL DATA ===');
                console.log('Task Detail Data:', JSON.stringify(response.data, null, 2));
                console.log('=== INDIVIDUAL FIELDS ===');
                console.log('adhoc_name:', response.data.adhoc_name);
                console.log('adhoc_desc:', response.data.adhoc_desc);
                console.log('adhoc_status:', response.data.adhoc_status);
                console.log('employee_tasks:', JSON.stringify(response.data.employee_tasks, null, 2));
                console.log('task_approvals:', JSON.stringify(response.data.task_approvals, null, 2));
                console.log('adhoc_image:', response.data.adhoc_image);
                console.log('adhoc_current_level:', response.data.adhoc_current_level);
                console.log('adhoc_last_level:', response.data.adhoc_last_level);
                console.log('=== END API LOG ===');

                setSelectedTaskDetail(response.data);
                setIsDetailModalVisible(true);
            } else console.error('Error fetching task detail:', response.message);
        } catch (error) {
            console.error('Error fetching task detail:', error);
        }
    };

    const fetchPendingApprovalTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getPendingApprovalTasks(employeeId);
            if (response.status === 'success') setPendingApprovalTasks(response.data);
            else setError(response.message || 'An error occurred');
        } catch (error) {
            setError('Failed to fetch pending approval tasks');
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch and display task details
    const fetchAndShowTaskDetail = async (taskId) => {
        try {
            const response = await getAdhocTaskDetail(taskId);
            if (response.status === 'success') {
                setSelectedTaskDetail(response.data); // Set task details
                setIsDetailModalVisible(true); // Open detail modal
            } else {
                console.error('Error fetching task detail:', response.message);
            }
        } catch (error) {
            console.error('Error fetching task detail:', error);
        }
    };

    // Function to handle chat press for adhoc tasks
    const handleAdhocChatPress = async () => {
        try {
            if (!selectedTaskDetail) {
                setErrorMessage('Detail tugas tidak tersedia');
                setShowErrorAlert(true);
                return;
            }

            // Navigate to ChatInterface with adhoc parameters
            navigation.navigate('ChatInterface', {
                adhocId: selectedTaskDetail.id,
                taskDetails: {
                    id: selectedTaskDetail.id,
                    title: selectedTaskDetail.adhoc_name,
                    subtitle: selectedTaskDetail.adhoc_desc || 'Adhoc Task',
                    status: selectedTaskDetail.adhoc_status,
                    assignedBy: selectedTaskDetail.task_approvals?.[0]?.employee?.employee_name || 'Unknown',
                    description: selectedTaskDetail.adhoc_desc,
                },
                isAdhoc: true, // Flag to indicate this is an adhoc task
            });
            setIsDetailModalVisible(false);
        } catch (error) {
            console.error('Error navigating to adhoc chat:', error.message);
            setErrorMessage('Gagal membuka chat');
            setShowErrorAlert(true);
        }
    };

    const fetchHistoryTasks = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await getHistoryTasks(employeeId);
            if (response.status === 'success') setHistoryTasks(response);
            else setError(response.message || 'An error occurred');
        } catch (error) {
            setError('Failed to fetch history tasks');
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true); // Start refreshing
        if (employeeId) {
            if (activeTab === 'Tugas Dibuat') await fetchAdhocTasks();
            else if (activeTab === 'Tugas Saya') await fetchMyTasks();
            else if (activeTab === 'Persetujuan') await fetchPendingApprovalTasks();
        }
        setRefreshing(false); // Stop refreshing after data is fetched
    };

    const handleApproveTask = async () => {
        setLoading(true); // Set loading state
        try {
            const companyId = await AsyncStorage.getItem('companyId'); // Fetch company ID from storage
            console.log('Approving task with ID:', taskId, 'and company ID:', companyId); // Debugging logs

            // Call the approve API
            await approveAdhocTask(taskId, companyId, approvalComment);

            // Show success alert using ReusableAlert
            setShowApproveSuccessAlert(true);

            // Refresh the approval tasks list
            await fetchPendingApprovalTasks();
        } catch (error) {
            setErrorMessage(`Failed to approve task: ${error.message}`);
            setShowErrorAlert(true); // Show error alert using ReusableAlert
        } finally {
            setLoading(false); // Reset loading state
            setIsApproveModalVisible(false); // Close modal if necessary
            setApprovalComment(''); // Reset comment
        }
    };

    const handleRejectTask = async () => {
        if (!approvalComment || approvalComment.trim() === '') {
            setErrorMessage('Approval comment is required to reject the task.');
            setShowErrorAlert(true); // Show error alert using ReusableAlert
            return;
        }

        setLoading(true); // Set loading state
        try {
            const companyId = await AsyncStorage.getItem('companyId'); // Fetch company ID from storage
            console.log('Rejecting task with ID:', taskId, 'and company ID:', companyId); // Debugging logs

            // Call the reject API
            await rejectAdhocTask(taskId, companyId, approvalComment);

            // Show success alert using ReusableAlert
            setShowRejectSuccessAlert(true);

            // Refresh the approval tasks list
            await fetchPendingApprovalTasks();
        } catch (error) {
            setErrorMessage(`Failed to reject task: ${error.message}`);
            setShowErrorAlert(true); // Show error alert using ReusableAlert
        } finally {
            setLoading(false); // Reset loading state
            setIsRejectModalVisible(false); // Close modal if necessary
            setApprovalComment(''); // Reset comment
        }
    };

    const handleSubmitTask = async () => {
        if (!submitReason || submitReason.trim() === '') {
            setErrorMessage('Alasan submit diperlukan untuk menyelesaikan tugas.');
            setShowErrorAlert(true);
            return;
        }

        if (!submitImageUri) {
            setErrorMessage('Gambar diperlukan untuk submit tugas.');
            setShowErrorAlert(true);
            return;
        }

        setLoading(true);
        try {
            const companyId = await AsyncStorage.getItem('companyId');
            console.log('Submitting task with ID:', selectedTaskId, 'and company ID:', companyId);

            // Convert image to base64
            let imageBase64 = '';
            if (submitImageUri) {
                const fileInfo = await FileSystem.getInfoAsync(submitImageUri);

                // Validate file size (1MB = 1024 * 1024 bytes)
                if (fileInfo.size > 1024 * 1024) {
                    setErrorMessage('Ukuran file terlalu besar. Mohon pilih gambar dengan ukuran maksimal 1MB.');
                    setShowErrorAlert(true);
                    setLoading(false);
                    return;
                }

                try {
                    imageBase64 = await FileSystem.readAsStringAsync(submitImageUri, {
                        encoding: FileSystem.EncodingType.Base64,
                    });

                    if (!imageBase64) {
                        throw new Error('Gagal memproses gambar');
                    }
                } catch (error) {
                    throw new Error('Gagal memproses gambar: ' + error.message);
                }
            }

            // Call the submit API with image
            await submitAdhocTask(selectedTaskId, companyId, imageBase64, submitReason);

            // Show success alert using ReusableAlert
            setShowSubmitSuccessAlert(true);

            // Refresh the my tasks list
            await fetchMyTasks();
        } catch (error) {
            setErrorMessage(`Gagal submit tugas: ${error.message}`);
            setShowErrorAlert(true);
        } finally {
            setLoading(false);
            setIsSubmitModalVisible(false);
            setSubmitReason('');
            setSubmitImageUri(null);
            setSelectedTaskId(null);
        }
    };

    const requestPermissions = async () => {
        const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (cameraStatus.status !== 'granted' || libraryStatus.status !== 'granted') {
            setErrorMessage('Camera and media library access is required to use this feature.');
            setShowErrorAlert(true);
            return false;
        }
        return true;
    };

    const pickImage = async (sourceType) => {
        if (!(await requestPermissions())) return;

        try {
            const result = await sourceType({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSubmitImageUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            setErrorMessage('Failed to pick image. Please try again.');
            setShowErrorAlert(true);
        }
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

    useEffect(() => {
        if (fontsLoaded) {
            // Fonts are loaded, additional actions if needed
        }
    }, [fontsLoaded]);

    const renderTabs = () => {
        const tabIcons = {
            'Tugas Dibuat': 'create',
            'Tugas Saya': 'person',
            Persetujuan: 'checkmark-circle',
            Riwayat: 'time',
        };

        return (
            <View style={styles.tabContainer}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
                        onPress={() => setActiveTab(tab)}
                        activeOpacity={0.8}
                    >
                        {activeTab === tab ? (
                            <LinearGradient
                                colors={['#4A90E2', '#357ABD', '#2E5984']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.activeTabGradient}
                            >
                                <View style={styles.tabContent}>
                                    <Ionicons name={tabIcons[tab]} size={16} color="white" style={styles.tabIcon} />
                                    <Text
                                        style={[styles.tabText, styles.activeTabText]}
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                    >
                                        {tab}
                                    </Text>
                                </View>
                            </LinearGradient>
                        ) : (
                            <View style={styles.tabContent}>
                                <Ionicons name={tabIcons[tab]} size={14} color="#64748B" style={styles.tabIcon} />
                                <Text
                                    style={[styles.tabText, styles.inactiveTabText]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                >
                                    {tab}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderTaskItem = (task) => {
        const isSelected = selectedTask === task.id;

        const handleCancelTask = (task) => {
            Alert.alert(
                'Konfirmasi Pembatalan',
                'Apakah Anda yakin ingin membatalkan tugas ini?',
                [
                    { text: 'Tidak', onPress: () => console.log('Pembatalan dibatalkan'), style: 'cancel' },
                    {
                        text: 'Ya',
                        onPress: async () => {
                            try {
                                await cancelAdhocTask(task.id);
                                console.log('Tugas berhasil dibatalkan');
                                setShowSuccessAlert(true);
                            } catch (error) {
                                setErrorMessage('Gagal membatalkan tugas. Silakan coba lagi.');
                                setShowErrorAlert(true);
                            }
                        },
                    },
                ],
                { cancelable: false },
            );
        };

        return (
            <View style={styles.createdTaskCard} key={task.id}>
                {/* Header Section */}
                <View style={styles.createdTaskHeader}>
                    <TouchableOpacity style={styles.createdTaskHeaderContent} onPress={() => fetchTaskDetail(task.id)}>
                        <View style={styles.createdTaskTitleSection}>
                            <Text
                                style={[
                                    styles.createdTaskTitle,
                                    fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null,
                                ]}
                            >
                                {truncateText(task.adhoc_name, 40)}
                            </Text>
                            <View style={styles.createdTaskStatusContainer}>
                                <View
                                    style={[
                                        styles.createdTaskStatusBadge,
                                        { backgroundColor: getStatusColor(task.adhoc_status) },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.createdTaskStatusText,
                                            { color: getStatusTextColor(task.adhoc_status) },
                                        ]}
                                    >
                                        {getStatusText(task.adhoc_status)}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.createdTaskMenuButton}
                        onPress={() => setSelectedTask(isSelected ? null : task.id)}
                    >
                        <Feather name="more-vertical" size={20} color="#64748B" />
                    </TouchableOpacity>
                </View>

                {/* Content Section */}
                <TouchableOpacity style={styles.createdTaskContent} onPress={() => fetchTaskDetail(task.id)}>
                    <View style={styles.createdTaskInfoGrid}>
                        <View style={styles.createdTaskInfoItem}>
                            <View style={styles.createdTaskInfoIcon}>
                                <Feather name="calendar" size={16} color="#F57C00" />
                            </View>
                            <View style={styles.createdTaskInfoText}>
                                <Text style={styles.createdTaskInfoLabel}>Deadline</Text>
                                <Text style={styles.createdTaskInfoValue}>
                                    {formatDateConcise(task.adhoc_end_date)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.createdTaskInfoItem}>
                            <View style={styles.createdTaskInfoIcon}>
                                <Feather name="users" size={16} color="#10B981" />
                            </View>
                            <View style={styles.createdTaskInfoText}>
                                <Text style={styles.createdTaskInfoLabel}>Assignee</Text>
                                <Text style={styles.createdTaskInfoValue}>
                                    {task.employee_tasks?.length || 0} orang
                                </Text>
                            </View>
                        </View>

                        <View style={styles.createdTaskInfoItem}>
                            <View style={styles.createdTaskInfoIcon}>
                                <Feather name="check-circle" size={16} color="#6366F1" />
                            </View>
                            <View style={styles.createdTaskInfoText}>
                                <Text style={styles.createdTaskInfoLabel}>Approval Level</Text>
                                <Text style={styles.createdTaskInfoValue}>
                                    {task.adhoc_current_level || 1}/{task.adhoc_last_level || 1}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.createdTaskInfoItem}>
                            <View style={styles.createdTaskInfoIcon}>
                                <Feather name="clock" size={16} color="#8B5CF6" />
                            </View>
                            <View style={styles.createdTaskInfoText}>
                                <Text style={styles.createdTaskInfoLabel}>Dibuat</Text>
                                <Text style={styles.createdTaskInfoValue}>{formatDateConcise(task.created_at)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Action Button */}
                    <View style={styles.createdTaskActionContainer}>
                        <TouchableOpacity style={styles.createdTaskDetailButton}>
                            <Text style={styles.createdTaskDetailButtonText}>Lihat Detail</Text>
                            <Feather name="chevron-right" size={16} color="#4A90E2" />
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>

                {/* Dropdown Menu */}
                {isSelected && (
                    <View style={styles.createdTaskDropdown}>
                        <TouchableOpacity
                            style={styles.createdTaskDropdownItem}
                            onPress={() => {
                                setSelectedTask(null);
                                navigation.navigate('EditAdhoc', { adhocId: task.id });
                            }}
                        >
                            <Feather name="edit-2" size={18} color="#4A90E2" />
                            <Text style={styles.createdTaskDropdownText}>Ubah Tugas</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.createdTaskDropdownItem}
                            onPress={() => {
                                setSelectedTask(null);
                                handleCancelTask(task);
                            }}
                        >
                            <Feather name="x-circle" size={18} color="#EF4444" />
                            <Text style={[styles.createdTaskDropdownText, { color: '#EF4444' }]}>Batalkan Tugas</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderMyTaskItem = (task) => (
        <View style={styles.myTaskCard} key={task.id}>
            {/* Header with Priority Indicator */}
            <View style={styles.myTaskCardHeader}>
                <View style={styles.myTaskPriorityIndicator}>
                    <View
                        style={[
                            styles.myTaskPriorityDot,
                            {
                                backgroundColor:
                                    task.adhoc_status === 'working_on_it'
                                        ? '#F59E0B'
                                        : task.adhoc_status === 'completed'
                                        ? '#10B981'
                                        : '#6B7280',
                            },
                        ]}
                    />
                </View>
                <View style={styles.myTaskHeaderContent}>
                    <TouchableOpacity style={styles.myTaskTitleContainer} onPress={() => fetchTaskDetail(task.id)}>
                        <Text style={[styles.myTaskCardTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                            {truncateText(task.adhoc_name, 35)}
                        </Text>
                        <View style={styles.myTaskStatusContainer}>
                            <View
                                style={[
                                    styles.myTaskStatusBadge,
                                    { backgroundColor: getStatusColor(task.adhoc_status) },
                                ]}
                            >
                                <Text
                                    style={[styles.myTaskStatusText, { color: getStatusTextColor(task.adhoc_status) }]}
                                >
                                    {getStatusText(task.adhoc_status)}
                                </Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            <TouchableOpacity style={styles.myTaskCardContent} onPress={() => fetchTaskDetail(task.id)}>
                {/* Progress Bar */}
                <View style={styles.myTaskProgressSection}>
                    <View style={styles.myTaskProgressBar}>
                        <View
                            style={[
                                styles.myTaskProgressFill,
                                {
                                    width:
                                        task.adhoc_status === 'completed'
                                            ? '100%'
                                            : task.adhoc_status === 'working_on_it'
                                            ? '60%'
                                            : '20%',
                                    backgroundColor:
                                        task.adhoc_status === 'completed'
                                            ? '#10B981'
                                            : task.adhoc_status === 'working_on_it'
                                            ? '#F59E0B'
                                            : '#6B7280',
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Task Info Grid */}
                <View style={styles.myTaskInfoGrid}>
                    <View style={styles.myTaskInfoRow}>
                        <View style={styles.myTaskInfoItem}>
                            <View style={styles.myTaskInfoIcon}>
                                <Feather name="clock" size={14} color="#F59E0B" />
                            </View>
                            <View style={styles.myTaskInfoText}>
                                <Text style={styles.myTaskInfoLabel}>Deadline</Text>
                                <Text style={styles.myTaskInfoValue}>{formatDateConcise(task.adhoc_end_date)}</Text>
                            </View>
                        </View>

                        <View style={styles.myTaskInfoItem}>
                            <View style={styles.myTaskInfoIcon}>
                                <Feather name="user" size={14} color="#6366F1" />
                            </View>
                            <View style={styles.myTaskInfoText}>
                                <Text style={styles.myTaskInfoLabel}>Assigner</Text>
                                <Text style={styles.myTaskInfoValue}>
                                    {truncateText(task.task_approvals[0]?.employee?.employee_name || 'Unknown', 15)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Priority and Level Info */}
                    <View style={styles.myTaskMetaInfo}>
                        <View style={styles.myTaskMetaItem}>
                            <Feather name="target" size={12} color="#8B5CF6" />
                            <Text style={styles.myTaskMetaText}>
                                Level {task.adhoc_current_level || 1}/{task.adhoc_last_level || 1}
                            </Text>
                        </View>
                        <View style={styles.myTaskMetaItem}>
                            <Feather name="calendar" size={12} color="#EC4899" />
                            <Text style={styles.myTaskMetaText}>{formatDateConcise(task.adhoc_start_date)}</Text>
                        </View>
                    </View>
                </View>

                {/* Action Button */}
                <View style={styles.myTaskActionSection}>
                    {task.adhoc_status === 'working_on_it' && (
                        <TouchableOpacity
                            style={styles.myTaskSubmitButton}
                            onPress={() => {
                                setSelectedTaskId(task.id);
                                setIsSubmitModalVisible(true);
                            }}
                        >
                            <Feather name="send" size={16} color="#FFFFFF" />
                            <Text style={styles.myTaskSubmitButtonText}>Submit</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.myTaskActionButton} onPress={() => fetchTaskDetail(task.id)}>
                        <Text style={styles.myTaskActionButtonText}>Lihat Detail</Text>
                        <Feather name="arrow-right" size={16} color="#4A90E2" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </View>
    );

    const renderApprovalTaskItem = (task) => (
        <View style={styles.approvalTaskCard} key={task.id}>
            {/* Header dengan gradient background */}
            <View style={styles.approvalCardHeader}>
                <View style={styles.approvalHeaderContent}>
                    <View style={styles.approvalTitleContainer}>
                        <Text
                            style={[styles.approvalCardTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}
                        >
                            {truncateText(task.adhoc_name, 35)}
                        </Text>
                        <View style={styles.approvalStatusContainer}>
                            <View style={[styles.approvalStatusBadge, { backgroundColor: '#FFF3E0' }]}>
                                <Text style={[styles.approvalStatusText, { color: '#F57C00' }]}>
                                    Menunggu Persetujuan
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

            {/* Main Content */}
            <TouchableOpacity style={styles.approvalCardContent} onPress={() => fetchTaskDetail(task.id)}>
                <View style={styles.approvalInfoSection}>
                    <View style={styles.approvalInfoRow}>
                        <View style={styles.approvalInfoIcon}>
                            <Feather name="send" size={16} color="#4A90E2" />
                        </View>
                        <View style={styles.approvalInfoText}>
                            <Text style={styles.approvalInfoLabel}>Disubmit pada</Text>
                            <Text style={styles.approvalInfoValue}>{formatDateConcise(task.adhoc_submitted_date)}</Text>
                        </View>
                    </View>

                    <View style={styles.approvalInfoRow}>
                        <View style={styles.approvalInfoIcon}>
                            <Feather name="user" size={16} color="#4A90E2" />
                        </View>
                        <View style={styles.approvalInfoText}>
                            <Text style={styles.approvalInfoLabel}>Dari</Text>
                            <Text style={styles.approvalInfoValue}>
                                {truncateText(task.employee_tasks[0]?.employee?.employee_name || 'Unknown', 25)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.approvalInfoRow}>
                        <View style={styles.approvalInfoIcon}>
                            <Feather name="clock" size={16} color="#F57C00" />
                        </View>
                        <View style={styles.approvalInfoText}>
                            <Text style={styles.approvalInfoLabel}>Deadline</Text>
                            <Text style={styles.approvalInfoValue}>{formatDateConcise(task.adhoc_end_date)}</Text>
                        </View>
                    </View>
                </View>

                {/* Detail Button */}
                <View style={styles.approvalDetailButtonContainer}>
                    <TouchableOpacity style={styles.approvalDetailButton}>
                        <Text style={styles.approvalDetailButtonText}>Lihat Detail</Text>
                        <Feather name="chevron-right" size={16} color="#4A90E2" />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>

            {/* Action Buttons */}
            <View style={styles.approvalActionButtons}>
                <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => {
                        const adhocApprovalId = task.task_approvals?.[0]?.id;
                        if (adhocApprovalId) {
                            setTaskId(adhocApprovalId);
                            setIsRejectModalVisible(true);
                        }
                    }}
                >
                    <Feather name="x" size={16} color="#FFFFFF" />
                    <Text style={styles.rejectButtonText}>Tolak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => {
                        const adhocApprovalId = task.task_approvals?.[0]?.id;
                        if (adhocApprovalId) {
                            setTaskId(adhocApprovalId);
                            setIsApproveModalVisible(true);
                        }
                    }}
                >
                    <Feather name="check" size={16} color="#FFFFFF" />
                    <Text style={styles.approveButtonText}>Setujui</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHistoryItem = (section) => {
        const isExpanded = expandedSection === section.title;

        // Get section icon and color based on title
        const getSectionConfig = (title) => {
            switch (title) {
                case 'Tugas Dibuat':
                    return { icon: 'plus-circle', color: '#4A90E2', bgColor: '#EBF4FF' };
                case 'Tugas Saya':
                    return { icon: 'user-check', color: '#10B981', bgColor: '#ECFDF5' };
                case 'Tugas Persetujuan':
                    return { icon: 'shield-check', color: '#F59E0B', bgColor: '#FFFBEB' };
                default:
                    return { icon: 'file-text', color: '#6B7280', bgColor: '#F9FAFB' };
            }
        };

        const config = getSectionConfig(section.title);

        return (
            <View style={styles.historySection} key={section.title}>
                {/* Enhanced Header */}
                <View style={[styles.historySectionHeader, { backgroundColor: config.bgColor }]}>
                    <View style={styles.historySectionTitleContainer}>
                        <View style={[styles.historySectionIcon, { backgroundColor: config.color }]}>
                            <Feather name={config.icon} size={18} color="white" />
                        </View>
                        <View style={styles.historySectionTitleGroup}>
                            <Text style={styles.historySectionTitle}>{section.title}</Text>
                            <Text style={styles.historySectionSubtitle}>{section.items.length} tugas selesai</Text>
                        </View>
                        <View style={[styles.historySectionBadge, { backgroundColor: config.color }]}>
                            <Text style={styles.historySectionBadgeText}>{section.items.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.expandButton, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]}
                        onPress={() => setExpandedSection(isExpanded ? null : section.title)}
                    >
                        <Text style={[styles.expandButtonText, { color: config.color }]}>
                            {isExpanded ? 'Tutup' : 'Lihat'}
                        </Text>
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={config.color} />
                    </TouchableOpacity>
                </View>

                {/* Enhanced Content */}
                <View style={styles.historyPreviewContainer}>
                    {section.items.length === 0 ? (
                        <View style={styles.historyEmptyState}>
                            <Feather name="inbox" size={32} color="#CBD5E1" />
                            <Text style={styles.historyEmptyText}>Belum ada riwayat tugas</Text>
                        </View>
                    ) : (
                        (isExpanded ? section.items : section.items.slice(0, 2)).map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.historyPreviewItem,
                                    index === section.items.length - 1 && !isExpanded ? null : styles.historyItemBorder,
                                ]}
                                activeOpacity={0.7}
                                onPress={() => fetchAndShowTaskDetail(item.id)}
                            >
                                <View style={styles.historyPreviewContent}>
                                    {/* Status Timeline Indicator */}
                                    <View style={styles.historyTimelineContainer}>
                                        <View
                                            style={[
                                                styles.historyTimelineDot,
                                                { backgroundColor: getStatusTextColor(item.adhoc_status) },
                                            ]}
                                        />
                                        {index <
                                            (isExpanded
                                                ? section.items.length - 1
                                                : Math.min(section.items.length - 1, 1)) && (
                                            <View style={styles.historyTimelineLine} />
                                        )}
                                    </View>

                                    {/* Task Content */}
                                    <View style={styles.historyTaskContent}>
                                        <View style={styles.historyTaskHeader}>
                                            <Text style={styles.historyPreviewTitle} numberOfLines={2}>
                                                {item.adhoc_name}
                                            </Text>
                                            <View
                                                style={[
                                                    styles.historyStatusBadge,
                                                    { backgroundColor: getStatusColor(item.adhoc_status) },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.historyStatusText,
                                                        { color: getStatusTextColor(item.adhoc_status) },
                                                    ]}
                                                >
                                                    {getStatusText(item.adhoc_status)}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Task Meta Info */}
                                        <View style={styles.historyTaskMeta}>
                                            <View style={styles.historyMetaItem}>
                                                <Feather name="calendar" size={12} color="#64748B" />
                                                <Text style={styles.historyPreviewDate}>
                                                    {item.adhoc_status === 'cancelled'
                                                        ? `Dibatalkan: ${formatDateConcise(item.updated_at)}`
                                                        : item.adhoc_status === 'rejected'
                                                        ? `Ditolak: ${formatDateConcise(item.updated_at)}`
                                                        : `Selesai: ${formatDateConcise(
                                                              item.adhoc_completed_date || item.updated_at,
                                                          )}`}
                                                </Text>
                                            </View>

                                            {item.employee_tasks && item.employee_tasks.length > 0 && (
                                                <View style={styles.historyMetaItem}>
                                                    <Feather name="users" size={12} color="#64748B" />
                                                    <Text style={styles.historyMetaText}>
                                                        {item.employee_tasks.length} assignee
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Arrow Icon */}
                                    <View style={styles.historyArrowContainer}>
                                        <Feather name="chevron-right" size={16} color="#CBD5E1" />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}

                    {/* Show More Button when collapsed and has more items */}
                    {!isExpanded && section.items.length > 2 && (
                        <TouchableOpacity
                            style={styles.historyShowMoreButton}
                            onPress={() => setExpandedSection(section.title)}
                        >
                            <Text style={[styles.historyShowMoreText, { color: config.color }]}>
                                Lihat {section.items.length - 2} tugas lainnya
                            </Text>
                            <Feather name="arrow-down" size={14} color={config.color} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    const historyItems = [
        {
            title: 'Tugas Dibuat',
            items: Array.isArray(historyTasks.assigner) ? historyTasks.assigner : [],
        },
        {
            title: 'Tugas Saya',
            items: Array.isArray(historyTasks.assignee) ? historyTasks.assignee : [],
        },
        {
            title: 'Tugas Persetujuan',
            items: Array.isArray(historyTasks.approver) ? historyTasks.approver : [],
        },
    ];

    const renderTasks = () => {
        let tasks;
        let renderFunction;

        switch (activeTab) {
            case 'Tugas Dibuat':
                tasks = adhocTasks;
                renderFunction = renderTaskItem;
                break;
            case 'Tugas Saya':
                tasks = myTasks;
                renderFunction = renderMyTaskItem;
                break;
            case 'Persetujuan':
                tasks = pendingApprovalTasks;
                renderFunction = renderApprovalTaskItem;
                break;
            case 'Riwayat':
                return historyItems.map(renderHistoryItem);
            default:
                tasks = [];
                renderFunction = () => null;
        }

        if (loading) {
            return (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContent}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        if (tasks.length === 0) {
            return (
                <View style={styles.centerContent}>
                    <View style={styles.emptyStateIcon}>
                        <Feather name="clipboard" size={64} color="#CBD5E1" />
                    </View>
                    <Text style={styles.noTasksText}>Tidak ada tugas tersedia</Text>
                    <Text style={styles.emptyStateSubtext}>Tugas akan muncul di sini ketika tersedia</Text>
                </View>
            );
        }

        return tasks.map(renderFunction);
    };

    // Header for AdhocDashboard, styled like Kehadiran
    const renderHeader = () => (
        <View style={styles.backgroundBox}>
            <LinearGradient
                colors={['#4A90E2', '#357ABD', '#7dbfff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.linearGradient}
            >
                <View style={styles.headerDecorations}>
                    <View style={styles.decorativeCircle1} />
                    <View style={styles.decorativeCircle2} />
                    <View style={styles.decorativeCircle3} />
                    <View style={styles.decorativeCircle4} />
                    <View style={styles.decorativeCircle5} />
                </View>
                <View style={styles.headerContainer}>
                    <View style={styles.headerCenterContent}>
                        <View style={styles.headerTitleWrapper}>
                            <View style={styles.headerIconContainer}>
                                <Ionicons name="chatbubble-ellipses-outline" size={28} color="white" />
                            </View>
                            <Text style={styles.header}>Adhoc Dashboard</Text>
                        </View>
                        <Text style={styles.headerSubtitle}>Kelola dan pantau tugas adhoc Anda</Text>
                    </View>
                </View>
            </LinearGradient>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            {renderHeader()}

            <View style={styles.mainContent}>
                <View style={styles.tabsContainer}>{renderTabs()}</View>

                <View style={styles.content}>
                    <ScrollView
                        style={styles.taskList}
                        contentContainerStyle={styles.taskListContent}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
                        }
                        showsVerticalScrollIndicator={false}
                    >
                        {renderTasks()}
                    </ScrollView>
                    {/* Floating Back Button */}
                    <TouchableOpacity style={styles.floatingBackButton} onPress={() => navigation.goBack()}>
                        <Feather name="chevron-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>

                    {activeTab === 'Tugas Dibuat' && !error && (
                        <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => navigation.navigate('AddAdhocTask')} // Navigasi ke layar AddAdhoc
                        >
                            <Feather name="plus" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
            <AdhocModalDetail
                visible={isDetailModalVisible}
                onClose={() => setIsDetailModalVisible(false)}
                title="Detail Tugas"
                showChatButton={true}
                onChatPress={handleAdhocChatPress}
            >
                {selectedTaskDetail &&
                    (() => {
                        const {
                            adhoc_name,
                            adhoc_desc,
                            adhoc_start_date,
                            adhoc_end_date,
                            adhoc_status,
                            adhoc_current_level,
                            adhoc_last_level,
                            employee_tasks,
                            task_approvals,
                            adhoc_image,
                            adhoc_assigner_images,
                        } = selectedTaskDetail;
                        const truncatedAdhocName = truncateText(adhoc_name, 30);
                        const isAssigner = employeeId === String(selectedTaskDetail.adhoc_assign_by);
                        const isAssignee = employee_tasks.some((task) => String(task.employee_id) === employeeId);
                        const currentApprover = task_approvals.find(
                            (approval) => approval.approval_level === adhoc_current_level,
                        );
                        const isApprover = currentApprover && String(currentApprover.employee_id) === employeeId;
                        const showSubmitButton = adhoc_status === 'working_on_it' && !isAssigner && isAssignee;

                        return (
                            <ScrollView style={styles.myTaskDetailContent}>
                                <View style={styles.taskHeaderSection}>
                                    <View style={styles.taskTitleWrapper}>
                                        <Text style={styles.taskMainTitle}>{truncatedAdhocName}</Text>
                                    </View>
                                    <View style={styles.assignerInfo}>
                                        <Feather name="user" size={16} color="#666" />
                                        <Text style={styles.assignerText}>
                                            Ditugaskan oleh {task_approvals[0].employee.employee_name}
                                        </Text>
                                    </View>
                                    <View style={styles.statusBadgeContainer}>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: getStatusColor(adhoc_status) },
                                            ]}
                                        >
                                            <Text
                                                style={[styles.statusText, { color: getStatusTextColor(adhoc_status) }]}
                                            >
                                                {getStatusText(adhoc_status)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.timelineSection}>
                                    <Text style={styles.sectionTitle}>Timeline</Text>
                                    <View style={styles.timelineContainer}>
                                        <View style={styles.timelineItem}>
                                            <View style={styles.timelineDotContainer}>
                                                <View style={styles.timelineDot} />
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.timelineLabel}>Mulai</Text>
                                                <Text style={styles.timelineDate}>{formatDate(adhoc_start_date)}</Text>
                                            </View>
                                        </View>
                                        <View style={styles.timelineConnector} />
                                        <View style={styles.timelineItem}>
                                            <View style={styles.timelineDotContainer}>
                                                <View style={[styles.timelineDot, { backgroundColor: '#FF5252' }]} />
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.timelineLabel}>Tenggat</Text>
                                                <Text style={styles.timelineDate}>{formatDate(adhoc_end_date)}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.descriptionSection}>
                                    <Text style={styles.sectionTitle}>Deskripsi Tugas</Text>
                                    <View style={styles.descriptionCard}>
                                        <Text style={styles.descriptionText}>
                                            {adhoc_desc || 'Tidak ada deskripsi'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.assigneeSection}>
                                    <Text style={styles.sectionTitle}>Ditugaskan kepada</Text>
                                    <View style={styles.assigneeList}>
                                        {employee_tasks.map((task, index) => (
                                            <View key={index} style={styles.assigneeItem}>
                                                <View style={styles.assigneeAvatar}>
                                                    <Text style={styles.assigneeInitial}>
                                                        {task.employee.employee_name.charAt(0)}
                                                    </Text>
                                                </View>
                                                <Text style={styles.assigneeName}>{task.employee.employee_name}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <TouchableOpacity
                                        style={styles.approvalLevelContainer}
                                        onPress={() => setIsApprovalLevelDropdownOpen(!isApprovalLevelDropdownOpen)}
                                    >
                                        <View style={styles.approvalLevelHeader}>
                                            <Text style={styles.approvalLevelText}>
                                                Level Persetujuan Saat Ini: {adhoc_current_level} / {adhoc_last_level}
                                            </Text>
                                            <Feather
                                                name={isApprovalLevelDropdownOpen ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color="#4A90E2"
                                            />
                                        </View>
                                    </TouchableOpacity>

                                    {isApprovalLevelDropdownOpen && (
                                        <View style={styles.approvalDropdown}>
                                            {task_approvals.map((approval, index) => (
                                                <View key={approval.id} style={styles.approvalLevelItem}>
                                                    <View style={styles.approvalLevelInfo}>
                                                        <View style={styles.approvalLevelHeader}>
                                                            <Text style={styles.approvalLevelNumber}>
                                                                Level {approval.approval_level}
                                                            </Text>
                                                            <View
                                                                style={[
                                                                    styles.approvalStatusBadge,
                                                                    {
                                                                        backgroundColor: approval.approval_action
                                                                            ? '#E8F5E8'
                                                                            : '#FFF3E0',
                                                                    },
                                                                ]}
                                                            >
                                                                <Text
                                                                    style={[
                                                                        styles.approvalStatusText,
                                                                        {
                                                                            color: approval.approval_action
                                                                                ? '#2E7D32'
                                                                                : '#F57C00',
                                                                        },
                                                                    ]}
                                                                >
                                                                    {approval.approval_action
                                                                        ? approval.approval_action === 'approved'
                                                                            ? 'Disetujui'
                                                                            : 'Ditolak'
                                                                        : 'Menunggu'}
                                                                </Text>
                                                            </View>
                                                        </View>
                                                        <View style={styles.approverInfo}>
                                                            <Feather name="user" size={14} color="#666" />
                                                            <Text style={styles.approverName}>
                                                                {approval.employee.employee_name}
                                                            </Text>
                                                        </View>
                                                        {approval.approval_action_date && (
                                                            <View style={styles.approvalDateInfo}>
                                                                <Feather name="calendar" size={14} color="#666" />
                                                                <Text style={styles.approvalDate}>
                                                                    {approval.approval_action === 'approved'
                                                                        ? 'Disetujui pada: '
                                                                        : 'Ditolak pada: '}
                                                                    {formatDateConcise(approval.approval_action_date)}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        {approval.approval_comment && (
                                                            <View style={styles.approvalCommentContainer}>
                                                                <Text style={styles.approvalCommentLabel}>
                                                                    Komentar:
                                                                </Text>
                                                                <Text style={styles.approvalCommentText}>
                                                                    {approval.approval_comment}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>

                                {adhoc_image && (
                                    <View style={styles.attachmentSection}>
                                        <Text style={styles.sectionTitle}>Lampiran</Text>
                                        <Image
                                            source={{ uri: BASE_URL + adhoc_image }}
                                            style={styles.attachmentImage}
                                            resizeMode="contain"
                                        />
                                    </View>
                                )}

                                {(selectedTaskDetail.adhoc_reason || selectedTaskDetail.adhoc_submitted_date) && (
                                    <View style={styles.submitInfoSection}>
                                        <Text style={styles.sectionTitle}>Informasi Submit</Text>

                                        {selectedTaskDetail.adhoc_reason && (
                                            <View style={styles.submitReasonContainer}>
                                                <View style={styles.submitReasonHeader}>
                                                    <Feather name="message-square" size={16} color="#4A90E2" />
                                                    <Text style={styles.submitReasonLabel}>
                                                        Alasan/Informasi Submit:
                                                    </Text>
                                                </View>
                                                <View style={styles.submitReasonCard}>
                                                    <Text style={styles.submitReasonText}>
                                                        {selectedTaskDetail.adhoc_reason}
                                                    </Text>
                                                </View>
                                            </View>
                                        )}

                                        {selectedTaskDetail.adhoc_submitted_date && (
                                            <View style={styles.submitDateContainer}>
                                                <View style={styles.submitDateHeader}>
                                                    <Feather name="send" size={16} color="#10B981" />
                                                    <Text style={styles.submitDateLabel}>Informasi Submit:</Text>
                                                </View>
                                                <View style={styles.submitDateCard}>
                                                    <View style={styles.submitInfoContent}>
                                                        <View style={styles.submitterInfo}>
                                                            <Feather name="user" size={14} color="#10B981" />
                                                            <Text style={styles.submitterText}>
                                                                Disubmit oleh:{' '}
                                                                {employee_tasks.length > 0
                                                                    ? employee_tasks[0].employee.employee_name
                                                                    : 'Unknown'}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.submitDateInfo}>
                                                            <Feather name="calendar" size={14} color="#10B981" />
                                                            <Text style={styles.submitDateText}>
                                                                Tanggal:{' '}
                                                                {formatDate(selectedTaskDetail.adhoc_submitted_date)}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    {selectedTaskDetail.adhoc_submit_status && (
                                                        <View
                                                            style={[
                                                                styles.submitStatusBadge,
                                                                {
                                                                    backgroundColor:
                                                                        selectedTaskDetail.adhoc_submit_status ===
                                                                        'overdue'
                                                                            ? '#FFEBEE'
                                                                            : '#E8F5E8',
                                                                },
                                                            ]}
                                                        >
                                                            <Text
                                                                style={[
                                                                    styles.submitStatusText,
                                                                    {
                                                                        color:
                                                                            selectedTaskDetail.adhoc_submit_status ===
                                                                            'overdue'
                                                                                ? '#C62828'
                                                                                : '#2E7D32',
                                                                    },
                                                                ]}
                                                            >
                                                                {selectedTaskDetail.adhoc_submit_status === 'overdue'
                                                                    ? 'Terlambat'
                                                                    : 'Tepat Waktu'}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {showSubmitButton && (
                                    <TouchableOpacity
                                        style={styles.submitButton}
                                        onPress={() => {
                                            setIsDetailModalVisible(false);
                                            navigation.navigate('SubmitForm', {
                                                adhocId: selectedTaskDetail.id,
                                                adhocData: selectedTaskDetail,
                                            });
                                        }}
                                    >
                                        <Text style={styles.submitButtonText}>Submit Tugas</Text>
                                    </TouchableOpacity>
                                )}
                            </ScrollView>
                        );
                    })()}
            </AdhocModalDetail>

            <ReusableAlert
                show={showSuccessAlert}
                alertType="success"
                message="Tugas berhasil dibatalkan."
                onConfirm={() => setShowSuccessAlert(false)}
            />
            {/* Modal for Approve */}
            <Modal transparent={true} visible={isApproveModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Approval Comment</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter approval comment"
                            value={approvalComment}
                            onChangeText={setApprovalComment}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleApproveTask} disabled={loading}>
                            <Text style={styles.sendButtonText}>{loading ? 'Approving...' : 'Send'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsApproveModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for Reject */}
            <Modal transparent={true} visible={isRejectModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Rejection Reason</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Enter rejection reason"
                            value={approvalComment}
                            onChangeText={setApprovalComment}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleRejectTask} disabled={loading}>
                            <Text style={styles.sendButtonText}>{loading ? 'Rejecting...' : 'Send'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={() => setIsRejectModalVisible(false)}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal for Submit */}
            <Modal transparent={true} visible={isSubmitModalVisible} animationType="slide">
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.modalTitle}>Submit Tugas</Text>

                            {/* Upload Image Section */}
                            <View style={styles.uploadSection}>
                                <Text style={styles.uploadLabel}>Gambar Bukti Submit *</Text>
                                <TouchableOpacity style={styles.uploadButton} onPress={handleUploadPress}>
                                    <Feather name="camera" size={20} color="#4A90E2" />
                                    <Text style={styles.uploadButtonText}>
                                        {submitImageUri ? 'Ganti Gambar' : 'Pilih Gambar'}
                                    </Text>
                                </TouchableOpacity>

                                {submitImageUri && (
                                    <View style={styles.imagePreviewContainer}>
                                        <Image source={{ uri: submitImageUri }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => setSubmitImageUri(null)}
                                        >
                                            <Feather name="x" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>

                            {/* Submit Reason Section */}
                            <View style={styles.reasonSection}>
                                <Text style={styles.reasonLabel}>Keterangan Submit *</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="Masukkan alasan atau keterangan submit"
                                    value={submitReason}
                                    onChangeText={setSubmitReason}
                                    multiline={true}
                                    numberOfLines={4}
                                />
                            </View>

                            <TouchableOpacity style={styles.sendButton} onPress={handleSubmitTask} disabled={loading}>
                                <Text style={styles.sendButtonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => {
                                    setIsSubmitModalVisible(false);
                                    setSubmitReason('');
                                    setSubmitImageUri(null);
                                }}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            <ReusableAlert
                show={showSuccessAlert}
                alertType="success"
                message="Tugas berhasil dibatalkan."
                onConfirm={() => {
                    setShowSuccessAlert(false);
                    fetchAdhocTasks(); // Refresh data setelah cancel
                }}
            />
            <ReusableAlert
                show={showSubmitSuccessAlert}
                alertType="success"
                message="Tugas telah berhasil disubmit."
                onConfirm={() => setShowSubmitSuccessAlert(false)}
            />
            <ReusableAlert
                show={showApproveSuccessAlert}
                alertType="success"
                message="Tugas telah berhasil disetujui."
                onConfirm={() => setShowApproveSuccessAlert(false)}
            />
            <ReusableAlert
                show={showRejectSuccessAlert}
                alertType="success"
                message="Tugas telah berhasil ditolak."
                onConfirm={() => setShowRejectSuccessAlert(false)}
            />
            <ReusableAlert
                show={showErrorAlert}
                alertType="error"
                message={errorMessage}
                onConfirm={() => setShowErrorAlert(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    // Header styles from Kehadiran
    backgroundBox: {
        height: 335,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        zIndex: 1,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    backButtonContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerCenterContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerRightSpace: {
        width: 40,
        height: 40,
    },
    header: {
        fontSize: calculateFontSize(24),
        fontFamily: 'Poppins-Bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -0.5,
        marginBottom: 0,
        textShadowColor: 'rgba(0, 0, 0, 0.15)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    headerSubtitle: {
        fontSize: calculateFontSize(13),
        fontFamily: 'Poppins-Regular',
        color: 'rgba(255, 255, 255, 0.85)',
        textAlign: 'center',
        marginTop: 4,
        letterSpacing: -0.5,
        lineHeight: calculateFontSize(18),
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    headerIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerDecorations: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
    },
    decorativeCircle1: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: -30,
        right: -20,
    },
    decorativeCircle2: {
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        top: 40,
        left: -25,
    },
    decorativeCircle3: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 80,
        right: 30,
    },
    decorativeCircle4: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        top: 150,
        left: -10,
    },
    decorativeCircle5: {
        position: 'absolute',
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        top: 120,
        left: 30,
    },
    // Main content layout
    mainContent: {
        flex: 1,
        marginTop: 220, // Account for header height
        backgroundColor: '#F8FAFC',
    },
    tabsContainer: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: -35,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        zIndex: 2,
        paddingVertical: 6,
        paddingHorizontal: 6,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderRadius: 12,
        marginHorizontal: 2,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 50,
        transition: 'all 0.3s ease',
    },
    activeTab: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
        transform: [{ scale: 1.08 }],
        borderRadius: 14,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    activeTabGradient: {
        borderRadius: 8,
        paddingVertical: 14,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 60,
        width: '110%',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    tabContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2,
    },
    tabIcon: {
        marginBottom: 2,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        borderRadius: 12,
    },
    tabText: {
        textAlign: 'center',
        fontSize: calculateFontSize(10),
        fontFamily: 'Poppins-Medium',
        fontWeight: '600',
        letterSpacing: -0.5,
        lineHeight: calculateFontSize(12),
    },
    activeTabText: {
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
        fontWeight: '700',
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        fontSize: calculateFontSize(11.5),
        letterSpacing: -0.5,
    },
    inactiveTabText: {
        color: '#64748B',
        fontFamily: 'Poppins-Medium',
        fontWeight: '600',
        opacity: 0.9,
        fontSize: calculateFontSize(9.5),
        letterSpacing: -0.5,
    },
    content: {
        flex: 1,
        position: 'relative',
        paddingTop: 60,
    },
    taskList: {
        flex: 1,
    },
    taskListContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    // Task item styles
    taskItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    selectedTaskItem: {
        borderColor: '#4A90E2',
        borderWidth: 2,
    },
    taskContent: {
        padding: 20,
    },
    taskHeader: {
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 24,
        letterSpacing: -0.5,
    },
    taskMiddleSection: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusBadgeContainer: {
        alignItems: 'flex-start',
        marginTop: 12,
        marginBottom: 8,
    },
    statusText: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    taskActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    detailButtonText: {
        color: 'white',
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    moreButton: {
        padding: 8,
    },
    // Dropdown menu
    dropdownMenu: {
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingVertical: 8,
    },
    dropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    dropdownText: {
        fontSize: calculateFontSize(14),
        color: '#374151',
        fontWeight: '500',
    },
    // Loading and error states
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    errorText: {
        fontSize: calculateFontSize(14),
        color: '#EF4444',
        textAlign: 'center',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    emptyStateIcon: {
        marginBottom: 16,
    },
    noTasksText: {
        fontSize: calculateFontSize(18),
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    emptyStateSubtext: {
        fontSize: calculateFontSize(14),
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 20,
        letterSpacing: -0.5,
    },
    // Floating action button
    floatingBackButton: {
        position: 'absolute',
        bottom: 90, // Position above the add button
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6C757D', // Slightly different color from add button
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    addButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4A90E2',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    // Created Task Card Styles
    createdTaskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 15,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    createdTaskHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    createdTaskHeaderContent: {
        flex: 1,
        marginRight: 12,
    },
    createdTaskTitleSection: {
        gap: 8,
    },
    createdTaskTitle: {
        fontSize: calculateFontSize(17),
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 24,
        letterSpacing: -0.5,
    },
    createdTaskStatusContainer: {
        alignItems: 'flex-start',
    },
    createdTaskStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    createdTaskStatusText: {
        fontSize: calculateFontSize(11),
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    createdTaskMenuButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    createdTaskContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    createdTaskInfoGrid: {
        gap: 12,
        marginBottom: 16,
    },
    createdTaskInfoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 6,
    },
    createdTaskInfoIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    createdTaskInfoText: {
        flex: 1,
    },
    createdTaskInfoLabel: {
        fontSize: calculateFontSize(11),
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    createdTaskInfoValue: {
        fontSize: calculateFontSize(13),
        color: '#1E293B',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    createdTaskActionContainer: {
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        alignItems: 'center',
    },
    createdTaskDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    createdTaskDetailButtonText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    createdTaskDropdown: {
        backgroundColor: '#F8FAFC',
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
        paddingVertical: 8,
    },
    createdTaskDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 12,
    },
    createdTaskDropdownText: {
        fontSize: calculateFontSize(14),
        color: '#374151',
        fontWeight: '500',
        letterSpacing: -0.5,
    },

    // My Task Card Styles
    myTaskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        overflow: 'hidden',
    },
    myTaskCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
    },
    myTaskPriorityIndicator: {
        marginRight: 12,
        paddingTop: 2,
    },
    myTaskPriorityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    myTaskHeaderContent: {
        flex: 1,
    },
    myTaskTitleContainer: {
        gap: 8,
    },
    myTaskCardTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '700',
        color: '#1E293B',
        lineHeight: 22,
        letterSpacing: -0.5,
    },
    myTaskStatusContainer: {
        alignItems: 'flex-start',
    },
    myTaskStatusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    myTaskStatusText: {
        fontSize: calculateFontSize(10),
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    myTaskCardContent: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    myTaskProgressSection: {
        marginBottom: 16,
    },
    myTaskProgressBar: {
        height: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 2,
        overflow: 'hidden',
    },
    myTaskProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    myTaskInfoGrid: {
        gap: 12,
        marginBottom: 16,
    },
    myTaskInfoRow: {
        flexDirection: 'row',
        gap: 16,
    },
    myTaskInfoItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    myTaskInfoIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    myTaskInfoText: {
        flex: 1,
    },
    myTaskInfoLabel: {
        fontSize: calculateFontSize(10),
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    myTaskInfoValue: {
        fontSize: calculateFontSize(12),
        color: '#1E293B',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    myTaskMetaInfo: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    myTaskMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    myTaskMetaText: {
        fontSize: calculateFontSize(11),
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    myTaskActionSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        gap: 12,
    },
    myTaskSubmitButton: {
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
    },
    myTaskSubmitButtonText: {
        fontSize: calculateFontSize(13),
        color: '#FFFFFF',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    myTaskActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flex: 1,
        justifyContent: 'center',
    },
    myTaskActionButtonText: {
        fontSize: calculateFontSize(13),
        color: '#4A90E2',
        fontWeight: '600',
        letterSpacing: -0.5,
    },

    // Task items for different tabs
    myTaskItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    myTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    myTaskTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
        marginRight: 12,
        letterSpacing: -0.5,
    },
    myTaskInfo: {
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: calculateFontSize(14),
        color: '#64748B',
        flex: 1,
        letterSpacing: -0.5,
    },
    // New Approval Task Card Styles
    approvalTaskCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: '#E8F2FF',
        overflow: 'hidden',
    },
    approvalCardHeader: {
        backgroundColor: '#F8FBFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E8F2FF',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    approvalHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    approvalTitleContainer: {
        flex: 1,
    },
    approvalCardTitle: {
        fontSize: calculateFontSize(17),
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        lineHeight: 24,
        letterSpacing: -0.5,
    },
    approvalStatusContainer: {
        alignItems: 'flex-start',
    },
    approvalStatusBadge: {
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        shadowColor: '#2196F3',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    approvalStatusText: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
        color: '#2196F3',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    approvalCardContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    approvalInfoSection: {
        marginBottom: 16,
        gap: 12,
    },
    approvalInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    approvalInfoIcon: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F0F7FF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    approvalInfoText: {
        flex: 1,
    },
    approvalInfoLabel: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        fontWeight: '500',
        marginBottom: 2,
        letterSpacing: -0.5,
    },
    approvalInfoValue: {
        fontSize: calculateFontSize(14),
        color: '#1E293B',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    approvalDetailButtonContainer: {
        alignItems: 'center',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    approvalDetailButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    approvalDetailButtonText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    approvalActionButtons: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontSize: calculateFontSize(14),
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
        lineHeight: calculateFontSize(16),
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    approveButtonText: {
        color: '#FFFFFF',
        fontSize: calculateFontSize(14),
        fontWeight: '700',
        letterSpacing: -0.5,
        textAlign: 'center',
        lineHeight: calculateFontSize(16),
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    modalContent: {
        width: '90%',
        maxHeight: '80%',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    modalTitle: {
        fontSize: calculateFontSize(18),
        fontWeight: '600',
        color: '#333',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    modalInput: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 12,
        fontSize: calculateFontSize(14),
        color: '#333',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        letterSpacing: -0.5,
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    sendButtonText: {
        color: 'white',
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    cancelButton: {
        backgroundColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#333',
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    // Upload section styles
    uploadSection: {
        marginBottom: 16,
    },
    uploadLabel: {
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        gap: 8,
    },
    uploadButtonText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    imagePreviewContainer: {
        marginTop: 12,
        position: 'relative',
        alignItems: 'flex-start',
        alignSelf: 'flex-start',
    },
    imagePreview: {
        width: 120,
        height: 120,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    removeImageButton: {
        position: 'absolute',
        top: -8,
        right: -8,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    reasonSection: {
        marginBottom: 16,
    },
    reasonLabel: {
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    // Detail modal styles
    myTaskDetailContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    taskHeaderSection: {
        marginBottom: 24,
    },
    taskTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    taskMainTitle: {
        fontSize: calculateFontSize(18),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        flex: 1,
        marginRight: 12,
        letterSpacing: -0.5,
    },
    assignerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    assignerText: {
        fontSize: calculateFontSize(14),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.5,
    },
    sectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 16,
        letterSpacing: -0.5,
    },
    timelineSection: {
        marginBottom: 24,
    },
    timelineContainer: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
    },
    timelineDotContainer: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4CAF50',
    },
    timelineConnector: {
        width: 2,
        height: 24,
        backgroundColor: '#E0E0E0',
        marginLeft: 11,
    },
    timelineContent: {
        marginLeft: 12,
    },
    timelineLabel: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    timelineDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
        letterSpacing: -0.5,
    },
    descriptionSection: {
        marginBottom: 24,
    },
    descriptionCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    descriptionText: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Regular',
        lineHeight: 20,
        letterSpacing: -0.5,
    },
    assigneeSection: {
        marginBottom: 24,
    },
    assigneeList: {
        gap: 12,
        marginBottom: 16,
    },
    assigneeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        padding: 12,
        borderRadius: 12,
    },
    assigneeAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#4A90E2',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    assigneeInitial: {
        color: 'white',
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    assigneeName: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    approvalLevelContainer: {
        backgroundColor: '#EBF4FF',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
    },
    approvalLevelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    approvalLevelText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '600',
        flex: 1,
        letterSpacing: -0.5,
    },
    // New styles for approval dropdown
    approvalDropdown: {
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        overflow: 'hidden',
    },
    approvalLevelItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    approvalLevelInfo: {
        gap: 8,
    },
    approvalLevelNumber: {
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    approvalStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
    },
    approvalStatusText: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    approverInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    approverName: {
        fontSize: calculateFontSize(13),
        color: '#64748B',
        letterSpacing: -0.5,
    },
    approvalDateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    approvalDate: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        letterSpacing: -0.5,
    },
    approvalCommentContainer: {
        backgroundColor: '#F1F5F9',
        padding: 8,
        borderRadius: 8,
        marginTop: 4,
    },
    approvalCommentLabel: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
        color: '#475569',
        marginBottom: 4,
        letterSpacing: -0.5,
    },
    approvalCommentText: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        lineHeight: 16,
        letterSpacing: -0.5,
    },
    // Submit Information Section Styles
    submitInfoSection: {
        marginBottom: 24,
    },
    submitReasonContainer: {
        marginBottom: 16,
    },
    submitReasonHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    submitReasonLabel: {
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        color: '#4A90E2',
        letterSpacing: -0.5,
    },
    submitReasonCard: {
        backgroundColor: '#F0F7FF',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4A90E2',
    },
    submitReasonText: {
        fontSize: calculateFontSize(14),
        color: '#1E293B',
        lineHeight: 20,
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.5,
    },
    submitDateContainer: {
        marginBottom: 8,
    },
    submitDateHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    submitDateLabel: {
        fontSize: calculateFontSize(14),
        fontWeight: '600',
        color: '#10B981',
        letterSpacing: -0.5,
    },
    submitDateCard: {
        backgroundColor: '#F0FDF4',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#10B981',
    },
    submitInfoContent: {
        flex: 1,
        gap: 8,
        marginBottom: 8,
    },
    submitterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    submitterText: {
        fontSize: calculateFontSize(13),
        color: '#1E293B',
        fontFamily: 'Poppins-Medium',
        fontWeight: '600',
    },
    submitDateInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    submitDateText: {
        fontSize: calculateFontSize(13),
        color: '#64748B',
        fontFamily: 'Poppins-Regular',
        letterSpacing: -0.5,
    },
    submitStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginTop: 0,
    },
    submitStatusText: {
        fontSize: calculateFontSize(11),
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    attachmentSection: {
        marginBottom: 24,
    },
    attachmentImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
    },
    chatButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: '#4A90E2',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    chatButtonText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: -0.5,
    },
    // Approval buttons
    approvalButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#10B981',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    approveButtonText: {
        color: 'white',
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#EF4444',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: 'white',
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-SemiBold',
        letterSpacing: -0.5,
    },
    // History section styles
    historySection: {
        marginBottom: 24,
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    historySectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    historySectionIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    historySectionTitleGroup: {
        flex: 1,
    },
    historySectionTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '700',
        color: '#1E293B',
        letterSpacing: -0.5,
        marginBottom: 2,
    },
    historySectionSubtitle: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    historySectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    historySectionBadgeText: {
        color: 'white',
        fontSize: calculateFontSize(12),
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    expandButtonText: {
        fontSize: calculateFontSize(13),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    historyPreviewContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    historyPreviewItem: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    historyItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    historyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    historyTimelineContainer: {
        alignItems: 'center',
        paddingTop: 4,
    },
    historyTimelineDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    historyTimelineLine: {
        width: 2,
        height: 32,
        backgroundColor: '#E2E8F0',
        marginTop: 8,
    },
    historyTaskContent: {
        flex: 1,
        gap: 8,
    },
    historyTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 12,
    },
    historyPreviewTitle: {
        fontSize: calculateFontSize(15),
        color: '#1E293B',
        fontWeight: '600',
        letterSpacing: -0.5,
        flex: 1,
        lineHeight: calculateFontSize(20),
    },
    historyStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    historyStatusText: {
        fontSize: calculateFontSize(10),
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: -0.5,
    },
    historyTaskMeta: {
        gap: 6,
    },
    historyMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    historyPreviewDate: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    historyMetaText: {
        fontSize: calculateFontSize(12),
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    historyArrowContainer: {
        paddingTop: 4,
    },
    historyEmptyState: {
        alignItems: 'center',
        paddingVertical: 32,
        gap: 8,
    },
    historyEmptyText: {
        fontSize: calculateFontSize(14),
        color: '#64748B',
        fontWeight: '500',
        letterSpacing: -0.5,
    },
    historyShowMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        backgroundColor: '#FAFBFC',
    },
    historyShowMoreText: {
        fontSize: calculateFontSize(13),
        fontWeight: '600',
        letterSpacing: -0.5,
    },
    historySeparator: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
});

export default AdhocDashboard;
