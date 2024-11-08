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
            return '#FFF9C4'; // Light yellow
        case 'completed':
            return '#E8F5E9'; // Light green
        case 'waiting_for_approval':
            return '#E3F2FD'; // Light blue
        case 'rejected':
            return '#FFCDD2'; // Light red
        case 'cancelled':
            return '#FFEBEE'; // Light red
        default:
            return '#F5F5F5'; // Light grey
    }
};

const getStatusTextColor = (status) => {
    switch (status) {
        case 'working_on_it':
            return '#FBC02D'; // Dark yellow
        case 'completed':
            return '#4CAF50'; // Green
        case 'waiting_for_approval':
            return '#2196F3'; // Blue
        case 'rejected':
            return '#D32F2F'; // Dark red
        case 'cancelled':
            return '#D32F2F'; // Dark red
        default:
            return '#757575'; // Grey
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
                        style={[
                            styles.tabText,
                            activeTab === tab ? styles.activeTabText : styles.inactiveTabText,
                            fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                            { fontSize: calculateFontSize(12) },
                        ]}
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
                            numberOfLines={1} // Membatasi teks hanya satu baris
                            ellipsizeMode="tail" // Menampilkan "..." jika teks terlalu panjang
                        >
                            {task.adhoc_name}
                        </Text>
                        <View style={[styles.statusBox, { backgroundColor: getStatusColor(task.adhoc_status) }]}>
                            <Text style={[styles.statusText, { color: getStatusTextColor(task.adhoc_status) }]}>
                                {getStatusText(task.adhoc_status)}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.taskActions}>
                        <TouchableOpacity
                            style={styles.moreButton}
                            onPress={() => setSelectedTask(isSelected ? null : task.id)}
                        >
                            <Feather name="more-horizontal" size={24} color="#000" />
                        </TouchableOpacity>
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
                                                  padding: 5,
                                                  borderRadius: 5,
                                                  marginTop: 5,
                                                  alignItems: 'center',
                                              }}
                                          >
                                              <Text
                                                  style={{
                                                      color: getStatusTextColor(item.adhoc_status),
                                                      fontWeight: 'bold',
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
                                                  padding: 5,
                                                  borderRadius: 5,
                                                  marginTop: 5,
                                                  alignItems: 'center',
                                              }}
                                          >
                                              <Text
                                                  style={{
                                                      color: getStatusTextColor(item.adhoc_status),
                                                      fontWeight: 'bold',
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
                    <Text style={styles.noTasksText}>No tasks available</Text>
                </View>
            );
        }

        return tasks.map(renderFunction);
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#4A90E2" />
            <LinearGradient colors={['#4A90E2', '#4A90E2']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                        Tugas Ad Hoc
                    </Text>
                    <View style={styles.placeholder} />
                </View>
                {renderTabs()}
            </LinearGradient>
            <View style={styles.content}>
                <ScrollView
                    style={styles.taskList}
                    contentContainerStyle={styles.taskListContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
                    }
                >
                    {renderTasks()}
                </ScrollView>
                {activeTab === 'Tugas Dibuat' && !error && (
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={() => navigation.navigate('AddAdhocTask')} // Navigasi ke layar AddAdhoc
                    >
                        <Feather name="plus" size={24} color="#4A90E2" />
                    </TouchableOpacity>
                )}
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
    // Define all the styles here, like before...
    container: {
        flex: 1,
        backgroundColor: '#F0F0F0',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 24,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 25,
        padding: 3,
        marginTop: 10,
    },
    tab: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 25,
    },
    activeTab: {
        backgroundColor: '#FFF',
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        textAlign: 'center',
    },
    activeTabText: {
        color: '#4A90E2',
        fontWeight: 'bold',
    },
    inactiveTabText: {
        color: '#FFF',
        fontWeight: 'normal',
    },
    taskList: {
        flex: 1,
    },
    taskListContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 80,
    },
    taskItem: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        marginBottom: 10,
        elevation: 2,
        overflow: 'hidden',
    },
    selectedTaskItem: {
        marginBottom: 20,
    },
    taskContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
    },
    taskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    taskActions: {
        alignItems: 'flex-end',
    },
    moreButton: {
        padding: 5,
        marginBottom: 5,
    },
    detailButton: {
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 5,
    },
    detailButtonText: {
        color: '#000',
        fontSize: 12,
    },
    dropdownMenu: {
        backgroundColor: '#F8F8F8',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
    },
    dropdownItem: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    dropdownText: {
        marginTop: 5,
        fontSize: 12,
        textAlign: 'center',
    },
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#FFFFFFFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    detailContent: {
        paddingHorizontal: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    detailTitle: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Bold',
    },
    detailLabel: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Bold',
    },
    detailValue: {
        fontSize: calculateFontSize(14),
        color: '#1f1f1f',
        fontFamily: 'Poppins-Medium',
        textAlign: 'left',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginLeft: 10,
    },
    statusText: {
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },

    myTaskItem: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginBottom: 12,
        padding: 16,
        elevation: 2,
    },
    myTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    myTaskTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    myTaskInfo: {
        marginTop: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 12,
        color: '#666',
        flex: 1,
    },
    approvalItem: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    approvalHeader: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    approvalTitleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    approvalTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        flex: 1,
    },
    statusContainer: {
        backgroundColor: '#FFF3E0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusText: {
        color: '#FB8C00',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    approvalContent: {
        padding: 15,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    infoItemHalf: {
        flex: 1,
    },
    infoLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 8,
    },
    infoIcon: {
        marginRight: 8,
    },
    infoValue: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        flex: 1,
    },
    descriptionContainer: {
        marginTop: 15,
    },
    descriptionLabel: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginBottom: 8,
    },
    approvalDescription: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Regular',
        lineHeight: 20,
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 15,
    },
    approvalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 15,
    },
    approveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    rejectButton: {
        flex: 1,
        backgroundColor: '#F44336',
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    approveButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-Medium',
    },
    rejectButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(14),
        fontFamily: 'Poppins-Medium',
    },
    historySection: {
        marginBottom: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        elevation: 2,
        marginHorizontal: 2,
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    historySectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historySectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
    },
    historySectionBadge: {
        backgroundColor: '#E3F2FD',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    historySectionBadgeText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    expandButtonText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    historyPreviewContainer: {
        padding: 12,
    },
    historyPreviewItem: {
        marginBottom: 8,
        backgroundColor: '#F8F9FA',
        borderRadius: 8,
        overflow: 'hidden',
    },
    historyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
    },
    historyIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    historyPreviewInfo: {
        flex: 1,
        marginRight: 8,
    },
    historyPreviewTitle: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    historyPreviewDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    historySeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
    detailList: {
        padding: 12,
    },

    detailItemInfo: {
        flex: 1,
    },
    detailItemTitle: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
        marginBottom: 4,
    },
    detailItemDate: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
    },
    detailItemStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailItemStatusBadge: {
        backgroundColor: '#E8F5E9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    detailItemStatusText: {
        color: '#4CAF50',
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    myTaskDetailContent: {
        paddingHorizontal: 20,
        paddingBottom: 24,
    },
    taskHeaderSection: {
        marginBottom: 24,
    },
    taskTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    taskMainTitle: {
        fontSize: calculateFontSize(18),
        color: '#333',
        fontFamily: 'Poppins-SemiBold',
        flex: 1,
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
        marginBottom: 12,
    },

    attachmentsSection: {
        marginBottom: 24,
    },
    attachmentCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
    },
    attachmentItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    attachmentIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    attachmentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    attachmentName: {
        fontSize: calculateFontSize(14),
        color: '#333',
        fontFamily: 'Poppins-Medium',
    },
    attachmentSize: {
        fontSize: calculateFontSize(12),
        color: '#666',
        fontFamily: 'Poppins-Regular',
        marginTop: 2,
    },
    downloadButton: {
        padding: 8,
    },
    submitButton: {
        backgroundColor: '#4A90E2',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20, // Adding margin top for spacing between elements
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-SemiBold',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        color: '#FF6B6B',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
    },
    noTasksText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
    },
    assigneeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    assigneeAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    assigneeInitial: {
        fontSize: 18,
        color: '#333',
        fontFamily: 'Poppins-Bold',
    },
    assigneeName: {
        fontSize: 16,
        color: '#333',
        fontFamily: 'Poppins-Regular',
    },
    approvalTaskItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 2,
    },
    approvalTaskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    approvalTaskTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        flex: 1,
        marginRight: 8,
    },
    approvalTaskInfo: {
        marginTop: 8,
    },
    attachmentSection: {
        marginTop: 20,
    },
    attachmentImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
    },
    approvalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    rejectButton: {
        backgroundColor: '#D32F2F', // Darker red for reject
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#00C853', // Bright green for approve
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: calculateFontSize(16), // Slightly larger text for better readability
    },
    approveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: calculateFontSize(16), // Slightly larger text for better readability
    },
    statusBox: {
        padding: 8,
        borderRadius: 12,
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: calculateFontSize(12),
        fontFamily: 'Poppins-Medium',
    },
    approvalLevelContainer: {
        marginTop: 16,
        padding: 12,
        backgroundColor: '#E3F2FD',
        borderRadius: 8,
        marginBottom: 20, // Adding margin bottom for spacing
    },
    approvalLevelText: {
        fontSize: calculateFontSize(14),
        color: '#2196F3',
        fontFamily: 'Poppins-SemiBold',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        padding: 10,
        marginBottom: 15,
    },
    sendButton: {
        backgroundColor: '#4A90E2',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    sendButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#000',
    },
    closeModalButton: {
        backgroundColor: '#F44336',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    closeModalText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    backButton: {
        padding: 5,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    approvalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    rejectButton: {
        backgroundColor: '#D32F2F', // Darker red for reject
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: 'center',
    },
    approveButton: {
        backgroundColor: '#00C853', // Bright green for approve
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: 'center',
    },
    rejectButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16, // Slightly larger text for better readability
    },
    approveButtonText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16, // Slightly larger text for better readability
    },
});

export default AdhocDashboard;
