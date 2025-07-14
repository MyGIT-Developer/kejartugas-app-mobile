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
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from '../utils/UseFonts';
import ReusableModalBottom from '../components/ReusableModalBottom';
import ReusableAlert from '../components/ReusableAlert';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
} from '../api/adhocTask';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Function to calculate responsive font size
const calculateFontSize = (size) => {
    const scale = SCREEN_WIDTH / 375;
    const newSize = size * scale;
    return Math.round(newSize);
};

const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', options);
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
    const [approvalComment, setApprovalComment] = useState('');
    const [taskId, setTaskId] = useState(null);

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
            if (response.status === 'success') setAdhocTasks(response.data);
            else setError(response.message || 'An error occurred');
        } catch (error) {
            setError('You do not have access to monitor adhoc tasks');
            console.error('Error fetching all adhoc tasks:', error.message);

            // Fallback to getMyAdhocTasksAssigner if access is denied
            try {
                const employeeId = await AsyncStorage.getItem('employeeId');
                const fallbackResponse = await getMyAdhocTasksAssigner(employeeId);
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
                Alert.alert('Error', 'Detail tugas tidak tersedia');
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
            Alert.alert('Error', 'Gagal membuka chat');
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

            setShowSuccessAlert(true); // Show success alert using ReusableAlert
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

            setShowSuccessAlert(true); // Show success alert using ReusableAlert
        } catch (error) {
            setErrorMessage(`Failed to reject task: ${error.message}`);
            setShowErrorAlert(true); // Show error alert using ReusableAlert
        } finally {
            setLoading(false); // Reset loading state
            setIsRejectModalVisible(false); // Close modal if necessary
            setApprovalComment(''); // Reset comment
        }
    };

    useEffect(() => {
        if (fontsLoaded) {
            // Fonts are loaded, additional actions if needed
        }
    }, [fontsLoaded]);

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab ? styles.activeTab : styles.inactiveTab]}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text
                        style={[styles.tabText, activeTab === tab ? styles.activeTabText : styles.inactiveTabText]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {tab}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

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
            <View style={[styles.taskItem, isSelected && styles.selectedTaskItem]} key={task.id}>
                <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                        <Text
                            style={[styles.taskTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {task.adhoc_name}
                        </Text>
                    </View>

                    <View style={styles.taskMiddleSection}>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.adhoc_status) }]}>
                            <Text style={[styles.statusText, { color: getStatusTextColor(task.adhoc_status) }]}>
                                {getStatusText(task.adhoc_status)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.taskActions}>
                        <TouchableOpacity style={styles.detailButton} onPress={() => fetchTaskDetail(task.id)}>
                            <Text
                                style={[
                                    styles.detailButtonText,
                                    fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                                ]}
                            >
                                Detail
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => setSelectedTask(isSelected ? null : task.id)}
                        >
                            <Feather name="more-horizontal" size={20} color="#666" />
                        </TouchableOpacity>
                    </View>
                </View>

                {isSelected && (
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                            style={styles.dropdownItem}
                            onPress={() => navigation.navigate('EditAdhoc', { adhocId: task.id })} // Navigasi ke EditAdhoc dengan adhocId
                        >
                            <Feather name="edit-2" size={20} color="#4A90E2" />
                            <Text style={[styles.dropdownText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                                Ubah Tugas
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.dropdownItem} onPress={() => handleCancelTask(task)}>
                            <Feather name="x-circle" size={20} color="red" />
                            <Text
                                style={[
                                    styles.dropdownText,
                                    { color: 'red' },
                                    fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                                ]}
                            >
                                Batal
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderDetailModalContent = () => {
        if (!selectedTaskDetail) return null;

        const {
            adhoc_name,
            adhoc_desc,
            adhoc_start_date,
            adhoc_end_date,
            adhoc_status,
            adhoc_current_level, // Current approval level
            adhoc_last_level, // Last level for approval
            employee_tasks,
            task_approvals,
            adhoc_image,
            adhoc_assigner_images,
        } = selectedTaskDetail;
        const truncatedAdhocName = truncateText(adhoc_name, 30);
        const isAssigner = employeeId === String(selectedTaskDetail.adhoc_assign_by);
        const isAssignee = employee_tasks.some((task) => String(task.employee_id) === employeeId);

        // Determine if the user is the approver for the current approval level
        const currentApprover = task_approvals.find((approval) => approval.approval_level === adhoc_current_level);
        const isApprover = currentApprover && String(currentApprover.employee_id) === employeeId;

        // Show submit button if the task is being worked on by the assignee
        const showSubmitButton = adhoc_status === 'working_on_it' && !isAssigner && isAssignee;

        // Show approval buttons if the user is the approver for the current level
        const showApprovalButtons = adhoc_status === 'waiting_for_approval' && isApprover;

        return (
            <ScrollView style={styles.myTaskDetailContent}>
                <View style={styles.taskHeaderSection}>
                    <View style={styles.taskTitleWrapper}>
                        <Text style={styles.taskMainTitle}>{truncatedAdhocName}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(adhoc_status) }]}>
                            <Text style={[styles.statusText, { color: getStatusTextColor(adhoc_status) }]}>
                                {getStatusText(adhoc_status)}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.assignerInfo}>
                        <Feather name="user" size={16} color="#666" />
                        <Text style={styles.assignerText}>
                            Ditugaskan oleh {task_approvals[0].employee.employee_name}
                        </Text>
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
                        <Text style={styles.descriptionText}>{adhoc_desc || 'Tidak ada deskripsi'}</Text>
                    </View>
                </View>

                <View style={styles.assigneeSection}>
                    <Text style={styles.sectionTitle}>Ditugaskan kepada</Text>
                    <View style={styles.assigneeList}>
                        {employee_tasks.map((task, index) => (
                            <View key={index} style={styles.assigneeItem}>
                                <View style={styles.assigneeAvatar}>
                                    <Text style={styles.assigneeInitial}>{task.employee.employee_name.charAt(0)}</Text>
                                </View>
                                <Text style={styles.assigneeName}>{task.employee.employee_name}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.approvalLevelContainer}>
                        <Text style={styles.approvalLevelText}>
                            Level Persetujuan Saat Ini: {adhoc_current_level} / {adhoc_last_level}
                        </Text>
                    </View>
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

                {/* Chat button - Always visible for all participants */}
                <TouchableOpacity style={styles.chatButton} onPress={handleAdhocChatPress}>
                    <Feather name="message-circle" size={20} color="#4A90E2" />
                    <Text style={styles.chatButtonText}>Chat Tugas</Text>
                </TouchableOpacity>

                {showApprovalButtons ? (
                    <View style={styles.approvalButtonsContainer}>
                        {/* Reject button */}
                        <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => {
                                const adhocApprovalId = selectedTaskDetail.task_approvals?.[0]?.id; // Cek apakah task_approvals adalah array
                                // Get the approval ID
                                if (adhocApprovalId) {
                                    setTaskId(adhocApprovalId); // Set the correct approval ID
                                    setIsRejectModalVisible(true); // Show the reject modal
                                }
                            }}
                        >
                            <Text style={styles.rejectButtonText}>Reject</Text>
                        </TouchableOpacity>

                        {/* Approve button */}
                        <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => {
                                const adhocApprovalId = selectedTaskDetail.task_approvals?.[0]?.id; // Cek apakah task_approvals adalah array

                                if (adhocApprovalId) {
                                    setTaskId(adhocApprovalId); // Set the correct approval ID
                                    setIsApproveModalVisible(true); // Show the approve modal
                                }
                            }}
                        >
                            <Text style={styles.approveButtonText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    showSubmitButton && (
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
                    )
                )}
            </ScrollView>
        );
    };

    const renderMyTaskItem = (task) => (
        <TouchableOpacity style={styles.myTaskItem} key={task.id} onPress={() => fetchTaskDetail(task.id)}>
            <View style={styles.myTaskHeader}>
                <Text style={[styles.myTaskTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                    {truncateText(task.adhoc_name, 30)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(task.adhoc_status) }]}>
                    <Text style={[styles.statusText, { color: getStatusTextColor(task.adhoc_status) }]}>
                        {getStatusText(task.adhoc_status)}
                    </Text>
                </View>
            </View>

            <View style={styles.myTaskInfo}>
                <View style={styles.infoItem}>
                    <Feather name="calendar" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                        Deadline: {formatDateConcise(task.adhoc_end_date)}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Feather name="user" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                        Ditugaskan oleh:{' '}
                        {truncateText(task.task_approvals[0]?.employee?.employee_name || 'Unknown', 20)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderApprovalTaskItem = (task) => (
        <TouchableOpacity style={styles.approvalTaskItem} key={task.id} onPress={() => fetchTaskDetail(task.id)}>
            <View style={styles.approvalTaskHeader}>
                <Text style={[styles.approvalTaskTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                    {truncateText(task.adhoc_name, 30)}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.statusText, { color: '#2196F3' }]}>Menunggu Persetujuan</Text>
                </View>
            </View>

            <View style={styles.approvalTaskInfo}>
                <View style={styles.infoItem}>
                    <Feather name="calendar" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                        Submitted: {formatDateConcise(task.adhoc_submitted_date)}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Feather name="user" size={16} color="#666" />
                    <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                        Dari: {truncateText(task.employee_tasks[0]?.employee?.employee_name || 'Unknown', 20)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderHistoryItem = (section) => {
        const isExpanded = expandedSection === section.title;

        return (
            <View style={styles.historySection} key={section.title}>
                <View style={styles.historySectionHeader}>
                    <View style={styles.historySectionTitleContainer}>
                        <Text style={styles.historySectionTitle}>{section.title}</Text>
                        <View style={styles.historySectionBadge}>
                            <Text style={styles.historySectionBadgeText}>{section.items.length}</Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={styles.expandButton}
                        onPress={() => setExpandedSection(isExpanded ? null : section.title)}
                    >
                        <Text style={styles.expandButtonText}>{isExpanded ? 'Tutup' : 'Lihat semua'}</Text>
                        <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#4A90E2" />
                    </TouchableOpacity>
                </View>

                <View style={styles.historyPreviewContainer}>
                    {isExpanded
                        ? section.items.map((item, index) => (
                              <TouchableOpacity
                                  key={index}
                                  style={styles.historyPreviewItem}
                                  activeOpacity={0.7}
                                  onPress={() => fetchAndShowTaskDetail(item.id)} // Show task detail when clicked
                              >
                                  <View style={styles.historyPreviewContent}>
                                      <View style={styles.historyIconContainer}>
                                          <Feather name="file-text" size={24} color="#4A90E2" />
                                      </View>
                                      <View style={styles.historyPreviewInfo}>
                                          <Text style={styles.historyPreviewTitle}>{item.adhoc_name}</Text>
                                          <Text style={styles.historyPreviewDate}>
                                              {item.adhoc_status === 'cancelled'
                                                  ? `Dibatalkan pada: ${formatDateConcise(item.updated_at)}`
                                                  : item.adhoc_status === 'rejected'
                                                    ? `Ditolak pada: ${formatDateConcise(item.updated_at)}`
                                                    : `Selesai Pada: ${formatDateConcise(item.adhoc_completed_date)}`}
                                          </Text>
                                          <View
                                              style={{
                                                  backgroundColor: getStatusColor(item.adhoc_status),
                                                  paddingHorizontal: 12,
                                                  paddingVertical: 6,
                                                  borderRadius: 16,
                                                  marginTop: 8,
                                                  alignSelf: 'flex-start',
                                                  shadowColor: '#000',
                                                  shadowOffset: { width: 0, height: 1 },
                                                  shadowOpacity: 0.1,
                                                  shadowRadius: 2,
                                                  elevation: 2,
                                              }}
                                          >
                                              <Text
                                                  style={{
                                                      color: getStatusTextColor(item.adhoc_status),
                                                      fontWeight: '600',
                                                      fontSize: 12,
                                                      textTransform: 'uppercase',
                                                      letterSpacing: 0.5,
                                                  }}
                                              >
                                                  {getStatusText(item.adhoc_status)}
                                              </Text>
                                          </View>
                                      </View>
                                      <Feather name="chevron-right" size={20} color="#C5C5C5" />
                                  </View>
                              </TouchableOpacity>
                          ))
                        : section.items.slice(0, 1).map((item, index) => (
                              <TouchableOpacity
                                  key={index}
                                  style={styles.historyPreviewItem}
                                  activeOpacity={0.7}
                                  onPress={() => fetchAndShowTaskDetail(item.id)} // Show task detail when clicked
                              >
                                  <View style={styles.historyPreviewContent}>
                                      <View style={styles.historyIconContainer}>
                                          <Feather name="file-text" size={24} color="#4A90E2" />
                                      </View>
                                      <View style={styles.historyPreviewInfo}>
                                          <Text style={styles.historyPreviewTitle}>{item.adhoc_name}</Text>
                                          <Text style={styles.historyPreviewDate}>
                                              {item.adhoc_status === 'cancelled'
                                                  ? `Dibatalkan pada: ${formatDateConcise(item.updated_at)}`
                                                  : item.adhoc_status === 'rejected'
                                                    ? `Ditolak pada: ${formatDateConcise(item.updated_at)}`
                                                    : `Last updated: ${formatDateConcise(item.adhoc_completed_date)}`}
                                          </Text>
                                          <View
                                              style={{
                                                  backgroundColor: getStatusColor(item.adhoc_status),
                                                  paddingHorizontal: 12,
                                                  paddingVertical: 6,
                                                  borderRadius: 16,
                                                  marginTop: 8,
                                                  alignSelf: 'flex-start',
                                                  shadowColor: '#000',
                                                  shadowOffset: { width: 0, height: 1 },
                                                  shadowOpacity: 0.1,
                                                  shadowRadius: 2,
                                                  elevation: 2,
                                              }}
                                          >
                                              <Text
                                                  style={{
                                                      color: getStatusTextColor(item.adhoc_status),
                                                      fontWeight: '600',
                                                      fontSize: 12,
                                                      textTransform: 'uppercase',
                                                      letterSpacing: 0.5,
                                                  }}
                                              >
                                                  {getStatusText(item.adhoc_status)}
                                              </Text>
                                          </View>
                                      </View>
                                      <Feather name="chevron-right" size={20} color="#C5C5C5" />
                                  </View>
                              </TouchableOpacity>
                          ))}
                </View>
                <View style={styles.historySeparator} />
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
            <ReusableModalBottom
                visible={isDetailModalVisible}
                onClose={() => setIsDetailModalVisible(false)}
                title="Detail Tugas"
            >
                {renderDetailModalContent()}
            </ReusableModalBottom>

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
        height: 220,
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
        letterSpacing: -0.8,
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
        letterSpacing: 0.3,
        lineHeight: calculateFontSize(18),
    },
    headerTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
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
        marginHorizontal: 20,
        marginTop: -70,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        zIndex: 2,
        paddingVertical: 8,
    },
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#4A90E2',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        textAlign: 'center',
        fontSize: calculateFontSize(11),
        fontFamily: 'Poppins-Medium',
        fontWeight: '600',
    },
    activeTabText: {
        color: 'white',
        fontFamily: 'Poppins-SemiBold',
    },
    inactiveTabText: {
        color: '#64748B',
        fontFamily: 'Poppins-Medium',
    },
    content: {
        flex: 1,
        position: 'relative',
        paddingTop: 20,
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
    statusText: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
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
    },
    emptyStateSubtext: {
        fontSize: calculateFontSize(14),
        color: '#6B7280',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 20,
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
    },
    // Approval task styles
    approvalTaskItem: {
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
    approvalTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    approvalTaskTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
        marginRight: 12,
    },
    approvalTaskInfo: {
        gap: 8,
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
    },
    sectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        marginBottom: 16,
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
    },
    timelineDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
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
    },
    assigneeName: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontWeight: '500',
    },
    approvalLevelContainer: {
        backgroundColor: '#EBF4FF',
        padding: 12,
        borderRadius: 12,
    },
    approvalLevelText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '600',
        textAlign: 'center',
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
    },
    // History section styles
    historySection: {
        marginBottom: 20,
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    historySectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    historySectionTitle: {
        fontSize: calculateFontSize(16),
        fontWeight: '600',
        color: '#1E293B',
    },
    historySectionBadge: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    historySectionBadgeText: {
        color: 'white',
        fontSize: calculateFontSize(12),
        fontWeight: '600',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    expandButtonText: {
        fontSize: calculateFontSize(14),
        color: '#4A90E2',
        fontWeight: '500',
    },
    historyPreviewContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    historyPreviewItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    historyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF4FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    historyPreviewInfo: {
        flex: 1,
    },
    historyPreviewTitle: {
        fontSize: calculateFontSize(15),
        color: '#1E293B',
        fontWeight: '600',
        marginBottom: 4,
    },
    historyPreviewDate: {
        fontSize: calculateFontSize(13),
        color: '#64748B',
        fontWeight: '400',
    },
    historySeparator: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: 16,
    },
});

export default AdhocDashboard;
