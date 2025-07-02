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
                        <Feather name="plus" size={24} color="#FFFFFF" />
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
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
    },
    placeholder: {
        width: 40,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        padding: 4,
        marginHorizontal: 8,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        minHeight: 40,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveTab: {
        backgroundColor: 'transparent',
    },
    tabText: {
        textAlign: 'center',
        fontSize: 13,
        fontWeight: '600',
    },
    activeTabText: {
        color: '#4A90E2',
    },
    inactiveTabText: {
        color: 'rgba(255, 255, 255, 0.9)',
    },
    content: {
        flex: 1,
        position: 'relative',
    },
    taskList: {
        flex: 1,
    },
    taskListContent: {
        paddingHorizontal: 16,
        paddingTop: 20,
        paddingBottom: 100,
    },
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
        marginBottom: 20,
    },
    taskContent: {
        padding: 20,
    },
    taskHeader: {
        marginBottom: 16,
    },
    taskTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: '#1E293B',
        lineHeight: 24,
    },
    taskMiddleSection: {
        marginBottom: 16,
        alignItems: 'flex-start',
    },
    taskActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    moreButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#F8FAFC',
    },
    detailButton: {
        backgroundColor: '#4A90E2',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        flex: 1,
        marginRight: 12,
        alignItems: 'center',
    },
    detailButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
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
    // Floating Action Button
    addButton: {
        position: 'absolute',
        right: 20,
        bottom: 30,
        backgroundColor: '#4A90E2',
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    // Empty States
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyStateIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    errorText: {
        fontSize: 16,
        color: '#EF4444',
        textAlign: 'center',
        fontWeight: '500',
        marginTop: 16,
    },
    noTasksText: {
        fontSize: 18,
        color: '#374151',
        textAlign: 'center',
        fontWeight: '600',
        marginBottom: 8,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        fontWeight: '400',
        lineHeight: 20,
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
    // Task Card Styles
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
        marginBottom: 16,
    },
    myTaskTitle: {
        fontSize: calculateFontSize(17),
        color: '#1E293B',
        flex: 1,
        marginRight: 12,
        fontWeight: '600',
        lineHeight: 24,
    },
    myTaskInfo: {
        marginTop: 8,
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 13,
        color: '#475569',
        flex: 1,
        fontWeight: '500',
    },
    statusBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        marginLeft: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    statusText: {
        fontSize: calculateFontSize(12),
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
    // History Section Styles
    historySection: {
        marginBottom: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        marginHorizontal: 2,
        overflow: 'hidden',
    },
    historySectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#F8FAFC',
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    historySectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    historySectionTitle: {
        fontSize: calculateFontSize(16),
        color: '#1E293B',
        fontWeight: '600',
    },
    historySectionBadge: {
        backgroundColor: '#EBF4FF',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 10,
    },
    historySectionBadgeText: {
        color: '#2563EB',
        fontSize: calculateFontSize(12),
        fontWeight: '600',
    },
    expandButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#EBF4FF',
    },
    expandButtonText: {
        color: '#2563EB',
        fontSize: calculateFontSize(13),
        fontWeight: '600',
    },
    historyPreviewContainer: {
        padding: 16,
    },
    historyPreviewItem: {
        marginBottom: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    historyPreviewContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    historyIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    historyPreviewInfo: {
        flex: 1,
        marginRight: 12,
    },
    historyPreviewTitle: {
        fontSize: calculateFontSize(15),
        color: '#1E293B',
        fontWeight: '600',
        marginBottom: 6,
    },
    historyPreviewDate: {
        fontSize: calculateFontSize(13),
        color: '#64748B',
        fontWeight: '500',
    },
    historySeparator: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 20,
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
    chatButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#4A90E2',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    chatButtonText: {
        color: '#4A90E2',
        fontSize: calculateFontSize(16),
        fontFamily: 'Poppins-SemiBold',
        marginLeft: 8,
    },
    // ...existing code...
});

export default AdhocDashboard;
