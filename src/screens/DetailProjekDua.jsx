import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, SafeAreaView, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { fetchTaskById, deleteTask } from '../api/task'; // Import the fetchTaskById function
import AsyncStorage from '@react-native-async-storage/async-storage';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import FloatingButtonTask from '../components/FloatingButtonTask';
import { useNavigation } from '@react-navigation/native';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import { FONTS } from '../constants/fonts';

const STATUS_MAPPING = {
    Completed: { text: 'Selesai', bgColor: '#C9F8C1', textColor: '#0A642E' },
    workingOnIt: { text: 'Dalam Pengerjaan', bgColor: '#aeaeae', textColor: '#000000' },
    rejected: { text: 'Ditolak', bgColor: '#F69292', textColor: '#811616' },
    onReview: { text: 'Dalam Peninjauan', bgColor: '#f6e092', textColor: '#ee9000' },
    onHold: { text: 'Ditunda', bgColor: '#F69292', textColor: '#811616' },
    onPending: { text: 'Tersedia', bgColor: '#FEEE91', textColor: '#ee9000' },
    earlyFinish: { text: 'Early Finish', bgColor: '#C9F8C1', textColor: '#0A642E' },
    finish: { text: 'On Time', bgColor: '#95d6fc', textColor: '#0b4b76' },
    'finish in delay': { text: 'Finish Delay', bgColor: '#f6e092', textColor: '#ee9000' },
    overdue: { text: 'Overdue', bgColor: '#F69292', textColor: '#811616' },
};

const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

const calculateRemainingDays = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end - today) / (1000 * 3600 * 24));
};

const getDurationBadge = (remainingDays) => {
    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FFE9CB', textColor: '#E07706', label: `Tersisa ${remainingDays} hari` };
    }
};

const getCollectionStatusBadgeColor = (status) => {
    switch (status) {
        case 'finish':
            return { color: '#A7C8E5', textColor: '#092D58', label: 'Selesai' };
        case 'earlyFinish':
            return { color: '#9ADFAD', textColor: '#0A642E', label: 'Selesai Lebih Awal' };
        case 'finish in delay':
            return { color: '#F0E089', textColor: '#80490A', label: 'Selesai Terlambat' };
        case 'overdue':
            return { color: '#F69292', textColor: '#811616', label: 'Terlambat' };
        default:
            return { color: '#E0E0E0', textColor: '#000000', label: status || 'Belum Dikumpulkan' };
    }
};

const getStatusBadgeColor = (status, endDate) => {
    if (status === 'Completed') {
        return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' };
    }

    const remainingDays = calculateRemainingDays(endDate, status);

    if (remainingDays === 0) {
        return { color: '#F69292', textColor: '#811616', label: 'Deadline Tugas Hari Ini' };
    } else if (remainingDays < 0) {
        return { color: '#F69292', textColor: '#811616', label: `Terlambat selama ${Math.abs(remainingDays)} hari` };
    } else if (remainingDays > 0) {
        return { color: '#FFE9CB', textColor: '#E07706', label: `Tersisa ${remainingDays} hari` };
    }

    // Existing status handling logic
    switch (status) {
        case 'workingOnIt':
            return { color: '#CCC8C8', textColor: '#333333', label: 'Dalam Pengerjaan' };
        case 'onReview':
            return { color: '#9AE1EA', textColor: '#333333', label: 'Dalam Peninjauan' };
        case 'rejected':
            return { color: '#050404FF', textColor: '#811616', label: 'Ditolak' };
        case 'onHold':
            return { color: '#F69292', textColor: '#811616', label: 'Ditunda' };
        case 'Completed':
            return { color: '#C9F8C1', textColor: '#333333', label: 'Selesai' }; // Updated label
        case 'onPending':
            return { color: '#F0E08A', textColor: '#333333', label: 'Tersedia' };
        default:
            return { color: '#E0E0E0', textColor: '#333333', label: status };
    }
};

const TableRow = React.memo(({ item, index, onTaskPress, projectData, fetchProjectData }) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);
    const navigation = useNavigation();
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });

    const statusInfo = STATUS_MAPPING[item.task_status] || {
        text: 'Tidak Diketahui',
        bgColor: '#9E9E9E',
        textColor: 'black',
    };

    const handleGoToUpdate = () => {
        navigation.navigate('TaskForm', {
            mode: 'update',
            initialTaskData: item,
            projectData: projectData,
        });
    };

    const handleDeleteTask = useCallback((taskId) => {
        const deleteTaskHandler = async () => {
            try {
                const response = await deleteTask(taskId);
                setAlert({
                    show: true,
                    type: 'success',
                    message: response.message,
                });
            } catch (error) {
                console.error('Error deleting task:', error);
                setAlert({
                    show: true,
                    type: 'error',
                    message: 'Gagal menghapus tugas. Coba lagi.',
                });
            } finally {
                fetchProjectData();
            }
        };

        Alert.alert(
            'Konfirmasi Hapus',
            'Apakah Anda yakin ingin menghapus tugas ini?',
            [
                {
                    text: 'Batal',
                    style: 'cancel',
                },
                {
                    text: 'Hapus',
                    onPress: deleteTaskHandler,
                    style: 'destructive',
                },
            ],
            { cancelable: false },
        );
    }, []);

    return (
        <View style={styles.rowContainer}>
            {item.task_name == 'No data available' ? (
                <View style={styles.row}>
                    <Text style={styles.taskNameText}>No data available</Text>
                </View>
            ) : (
                <>
                    <TouchableOpacity onPress={toggleExpanded} style={styles.row}>
                        <View style={styles.indexCell}>
                            <Feather name={expanded ? 'chevron-down' : 'chevron-right'} size={18} color="#0E509E" />
                            <Text style={styles.indexText}>{index + 1}</Text>
                        </View>
                        <View style={styles.taskNameCell}>
                            <Text style={styles.taskNameText} numberOfLines={1} ellipsizeMode="tail">
                                {item.task_name}
                            </Text>
                        </View>
                        <View style={[styles.statusCell, { backgroundColor: statusInfo.bgColor }]}>
                            <Text style={[styles.statusText, { color: statusInfo.textColor }]}>{statusInfo.text}</Text>
                        </View>
                    </TouchableOpacity>
                    {expanded && (
                        <View style={styles.expandedContent}>
                            <Text style={[styles.expandedText, { fontSize: 16, fontWeight: 600 }]}>
                                {item.task_name || '-'}
                            </Text>
                            <Text style={styles.expandedLabel}>Description:</Text>
                            <Text style={styles.expandedText}>{item.task_desc || '-'}</Text>
                            <View style={styles.expandedColumnText}>
                                <View>
                                    <Text style={styles.expandedLabel}>PIC:</Text>
                                    <Text style={styles.expandedText}>
                                        {item.assigned_employees
                                            ?.map((employee) => employee.employee_name)
                                            .join(', ') || '-'}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.expandedColumnText}>
                                <View>
                                    <Text style={styles.expandedLabel}>Tanggal Mulai:</Text>
                                    <Text style={styles.expandedText}>{formatDate(item.start_date)}</Text>
                                </View>
                                <View>
                                    <Text style={styles.expandedLabel}>Tanggal Selesai:</Text>
                                    <Text style={styles.expandedText}>{formatDate(item.end_date)}</Text>
                                </View>
                            </View>
                            <View style={styles.expandedColumnText}>
                                <View style={styles.expandedButtonContainer}>
                                    <TouchableOpacity
                                        onPress={() => onTaskPress(item)}
                                        style={[styles.buttonAction, { backgroundColor: 'none' }]}
                                    >
                                        <Text style={[styles.expandedText, { color: '#0E509E' }]}>Detail</Text>
                                        <Feather name={'eye'} color="blue" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleGoToUpdate()}
                                        style={[styles.buttonAction, { backgroundColor: 'none' }]}
                                    >
                                        <Text style={[styles.expandedText, { color: '#0E509E' }]}>Edit</Text>
                                        <Feather name={'edit'} color="black" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => handleDeleteTask(item.id)}
                                        style={[styles.buttonAction, { backgroundColor: 'none' }]}
                                    >
                                        <Text style={[styles.expandedText, { color: '#0E509E' }]}>Delete</Text>
                                        <Feather name={'trash'} color="red" />
                                    </TouchableOpacity>
                                    {/* <TouchableOpacity style={[styles.buttonAction, { backgroundColor: 'none' }]}>
                                        <Text style={[styles.expandedText, { color: '#0E509E' }]}>Approve</Text>
                                        <Feather name={'check'} color={'blue'} />
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.buttonAction, { backgroundColor: 'none' }]}>
                                        <Text style={[styles.expandedText, { color: '#0E509E' }]}>Reject</Text>
                                        <Feather name={'x'} color={'red'} />
                                    </TouchableOpacity> */}
                                </View>
                            </View>
                        </View>
                    )}

                    <ReusableBottomPopUp
                        show={alert.show}
                        alertType={alert.type}
                        message={alert.message}
                        onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
                    />
                </>
            )}
        </View>
    );
});

const DetailProjekDua = ({ data, onFetch }) => {
    const taskData = useMemo(() => data.tasks, [data.tasks]);
    const [modalType, setModalType] = useState('default'); // Initialize modalType state
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [activeFilters, setActiveFilters] = useState({
        status: 'all',
        deadlineRange: 'all',
        startDate: '',
        endDate: ''
    });
    const [tempFilters, setTempFilters] = useState({
        status: 'all',
        deadlineRange: 'all',
        startDate: '',
        endDate: ''
    });
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [sortDirection, setSortDirection] = useState('asc');
    const navigation = useNavigation();
    // Status priority for sorting
    const statusPriority = {
        'onPending': 1,    // Tersedia
        'workingOnIt': 2,  // Dalam Pengerjaan
        'onReview': 3,     // Dalam Peninjauan
        'onHold': 4,       // Ditunda
        'rejected': 5,     // Ditolak
        'Completed': 6     // Selesai
    };

    // Status options for filter
    const statusOptions = [
        { value: 'all', label: 'Semua Status' },
        { value: 'Completed', label: 'Selesai' },
        { value: 'workingOnIt', label: 'Dalam Pengerjaan' },
        { value: 'rejected', label: 'Ditolak' },
        { value: 'onReview', label: 'Dalam Peninjauan' },
        { value: 'onHold', label: 'Ditunda' },
        { value: 'onPending', label: 'Tersedia' }
    ];

    // Deadline range options
    const deadlineOptions = [
        { value: 'all', label: 'Semua Deadline' },
        { value: 'overdue', label: 'Terlambat' },
        { value: 'today', label: 'Hari Ini' },
        { value: 'week', label: 'Minggu Ini' },
        { value: 'month', label: 'Bulan Ini' }
    ];

    const isTaskOverdue = (endDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskEnd = new Date(endDate);
        return taskEnd < today;
    };

    const isTaskDueToday = (endDate) => {
        const today = new Date();
        const taskEnd = new Date(endDate);
        return (
            taskEnd.getDate() === today.getDate() &&
            taskEnd.getMonth() === today.getMonth() &&
            taskEnd.getFullYear() === today.getFullYear()
        );
    };

    const isTaskDueThisWeek = (endDate) => {
        const today = new Date();
        const taskEnd = new Date(endDate);
        const weekFromNow = new Date(today);
        weekFromNow.setDate(today.getDate() + 7);
        return taskEnd >= today && taskEnd <= weekFromNow;
    };

    const isTaskDueThisMonth = (endDate) => {
        const today = new Date();
        const taskEnd = new Date(endDate);
        return (
            taskEnd.getMonth() === today.getMonth() &&
            taskEnd.getFullYear() === today.getFullYear()
        );
    };

    // Function to sort tasks by status priority
    const sortTasks = (tasks) => {
        return [...tasks].sort((a, b) => {
            const priorityA = statusPriority[a.task_status] || 999;
            const priorityB = statusPriority[b.task_status] || 999;
            return sortDirection === 'asc'
                ? priorityA - priorityB
                : priorityB - priorityA;
        });
    };

    // Filter and sort tasks based on selected criteria
    const filteredAndSortedTasks = useMemo(() => {
        let result = data.tasks;

        // Apply filters
        result = result.filter(task => {
            // Status filter
            if (activeFilters.status !== 'all' && task.task_status !== activeFilters.status) {
                return false;
            }

            // Deadline filter
            if (activeFilters.deadlineRange !== 'all') {
                switch (activeFilters.deadlineRange) {
                    case 'overdue':
                        if (!isTaskOverdue(task.end_date)) return false;
                        break;
                    case 'today':
                        if (!isTaskDueToday(task.end_date)) return false;
                        break;
                    case 'week':
                        if (!isTaskDueThisWeek(task.end_date)) return false;
                        break;
                    case 'month':
                        if (!isTaskDueThisMonth(task.end_date)) return false;
                        break;
                }
            }

            return true;
        });

        // Apply sorting
        return sortTasks(result);
    }, [data.tasks, activeFilters, sortDirection]);

    const handleApplyFilters = () => {
        setActiveFilters(tempFilters);
        setFilterModalVisible(false);
    };

    const handleResetFilters = () => {
        const resetFilters = {
            status: 'all',
            deadlineRange: 'all',
            startDate: '',
            endDate: ''
        };
        setTempFilters(resetFilters);
        setActiveFilters(resetFilters);
    };

    // Toggle sort direction
    const toggleSort = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    // Filter Modal Component
    // FilterModal component with improved behavior
    const FilterModal = () => {
        // Local state for handling chip selections without re-renders
        const [localFilters, setLocalFilters] = useState(tempFilters);

        // Reset local filters when modal opens
        useEffect(() => {
            setLocalFilters(tempFilters);
        }, [filterModalVisible]);

        const handleChipPress = (type, value) => {
            setLocalFilters(prev => ({
                ...prev,
                [type]: value
            }));
        };

        const handleApply = () => {
            setTempFilters(localFilters);
            setActiveFilters(localFilters);
            setFilterModalVisible(false);
        };

        const handleReset = () => {
            const resetFilters = {
                status: 'all',
                deadlineRange: 'all',
                startDate: '',
                endDate: ''
            };
            setLocalFilters(resetFilters);
            setTempFilters(resetFilters);
            setActiveFilters(resetFilters);
        };

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={filterModalVisible}
                onRequestClose={() => {
                    setFilterModalVisible(false);
                    setLocalFilters(activeFilters);
                }}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => {
                        setFilterModalVisible(false);
                        setLocalFilters(activeFilters);
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.modalContent}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Tugas</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setFilterModalVisible(false);
                                    setLocalFilters(activeFilters);
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="x" size={24} color="black" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Status</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.chipScrollView}
                            >
                                <View style={styles.chipContainer}>
                                    {statusOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.chip,
                                                localFilters.status === option.value && styles.chipSelected
                                            ]}
                                            onPress={() => handleChipPress('status', option.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    localFilters.status === option.value && styles.chipTextSelected
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.filterSection}>
                            <Text style={styles.filterLabel}>Deadline</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={styles.chipScrollView}
                            >
                                <View style={styles.chipContainer}>
                                    {deadlineOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.chip,
                                                localFilters.deadlineRange === option.value && styles.chipSelected
                                            ]}
                                            onPress={() => handleChipPress('deadlineRange', option.value)}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipText,
                                                    localFilters.deadlineRange === option.value && styles.chipTextSelected
                                                ]}
                                            >
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.clearButton}
                                onPress={handleReset}
                            >
                                <Text style={styles.clearButtonText}>Reset Filter</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.applyButton}
                                onPress={handleApply}
                            >
                                <Text style={styles.applyButtonText}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        );
    };


    // Action Buttons Component
    const ActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setFilterModalVisible(true)}
            >
                <Feather name="filter" size={20} color="#0E509E" />
                <Text style={styles.actionButtonText}>Filter</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={toggleSort}
            >
                <Feather
                    name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                    size={20}
                    color="#0E509E"
                />
                <Text style={styles.actionButtonText}>Sort</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('TaskForm', {
                    projectData: data,
                })} // Navigasi ke layar TaskForm dengan data proyek
            >
                <Feather name="plus-circle" size={20}
                    color="#0E509E" />
                <Text style={styles.actionButtonText}>Tugas Baru</Text>
            </TouchableOpacity>
        </View>
    );

    const handleTaskDetailPress = async (task) => {
        const baseUrl = 'https://app.kejartugas.com/';
        try {
            const response = await fetchTaskById(task.id); // Fetch task details by ID
            const taskDetails = response.data; // Access the data field from the response
            const collectionStatus = getCollectionStatusBadgeColor(taskDetails.task_submit_status || 'N/A');
            // Transform the task details to match the structure expected by DraggableModalTask
            const transformedTaskDetails = {
                id: taskDetails.id,
                title: taskDetails.task_name,
                startDate: taskDetails.start_date,
                endDate: taskDetails.end_date,
                assignedById: taskDetails.assign_by ? taskDetails.assign_by.id : 'N/A', // Accessing nested object
                assignedByName: taskDetails.assign_by ? taskDetails.assign_by.name : 'N/A', // Accessing nested object
                description: taskDetails.task_desc || 'N/A',
                progress: taskDetails.percentage_task || 0,
                status: taskDetails.task_status,
                statusColor: getStatusBadgeColor(taskDetails.task_status, taskDetails.end_date).color,
                collectionDate: task.task_submit_date || 'N/A',
                collectionStatus: collectionStatus.label,
                collectionStatusColor: collectionStatus.color,
                collectionStatusTextColor: collectionStatus.textColor,
                collectionDescription: taskDetails.task_desc || 'N/A',
                task_image: taskDetails.task_image ? `${baseUrl}${taskDetails.task_image}` : null,

                // Additional fields based on your previous structure
                baselineWeight: taskDetails.baseline_weight || '0',
                actualWeight: taskDetails.actual_weight || '0',
                durationTask: taskDetails.duration_task || 0,
                assignedEmployees:
                    taskDetails.assignedEmployees.map((emp) => ({
                        employeeId: emp.employee_id,
                        employeeName: emp.employee_name,
                    })) || [],
                taskProgress:
                    taskDetails.taskProgress.map((progress) => ({
                        tasksId: progress.tasks_id,
                        updateDate: progress.update_date,
                        percentage: progress.percentage,
                    })) || [],
            };

            setSelectedTask(transformedTaskDetails);

            setModalType('default');
            setDraggableModalVisible(true);
        } catch (error) {
            console.error('Error fetching task details:', error);
            // Optionally, show an alert or a message to the user
        }
    };

    return (
        <View style={styles.screenContainer}>
            <ActionButtons />

            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.mainContainer}>

                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollViewContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.headerSection}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.headerCell, styles.indexHeaderCell]}>No</Text>
                                <Text style={[styles.headerCell, styles.taskNameHeaderCell]}>Nama Tugas</Text>
                                <Text style={[styles.headerCell, styles.statusHeaderCell]}>Status</Text>
                            </View>
                        </View>

                        {/* Table Section */}
                        <View style={styles.tableSection}>
                            {filteredAndSortedTasks && filteredAndSortedTasks.length > 0 ? (
                                filteredAndSortedTasks.map((item, index) => (
                                    <TableRow
                                        key={item.id || index}
                                        item={item}
                                        index={index}
                                        onTaskPress={handleTaskDetailPress}
                                        projectData={data}
                                        fetchProjectData={onFetch}
                                    />
                                ))
                            ) : (
                                <TableRow item={{ task_name: 'No data available' }} index={0} />
                            )}
                        </View>
                    </ScrollView>
                </View>

                <FilterModal />

                {/* Modals */}
                <DraggableModalTask
                    visible={draggableModalVisible}
                    onClose={() => {
                        setDraggableModalVisible(false);
                        setSelectedTask(null);
                    }}
                    taskDetails={selectedTask || {}}
                />
            </ScrollView>

            {/* Floating Button */}

        </View>
    );
};

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        position: 'relative',
    },
    container: {
        display: 'flex',
        flexGrow: 1,
        flexDirection: 'column',
        minHeight: 1000,
        width: SCREEN_WIDTH,
    },
    mainContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 20,
    },
    headerSection: {
        paddingTop: 10,
        zIndex: 2,
    },
    tableSection: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
        height: height
    },
    scrollViewContent: {
        flexGrow: 1,
        height: height,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#3D8BDA',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    headerCell: {
        color: 'white',
        fontFamily: FONTS.family.semiBold,
        fontSize: FONTS.size.md,
        letterSpacing: -0.5,
    },
    indexHeaderCell: {
        flex: 1,
        textAlign: 'center',
    },
    taskNameHeaderCell: {
        flex: 3,
        textAlign: 'left',
    },
    statusHeaderCell: {
        flex: 2,
        textAlign: 'center',
    },
    rowContainer: {
        // marginBottom: 8,
        backgroundColor: 'white',
        // borderRadius: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        shadowColor: '#444',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.0,
        elevation: 1,
    },
    expandedContent: {
        marginTop: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    expandedText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        letterSpacing: -0.5,
        color: '#111827',
    },
    expandedLabel: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.medium,
        color: '#6B7280',
        marginBottom: 2,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 8,
        backgroundColor: 'white',
        marginVertical: 6,
        marginHorizontal: 4,
        elevation: 1,
        shadowColor: '#ccc',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    indexCell: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 50,
    },
    indexText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#0E509E',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    taskNameCell: {
        flex: 1,
        marginRight: 10,
    },
    taskNameText: {
        fontSize: FONTS.size.md,
        fontFamily: FONTS.family.semiBold,
        color: '#333',
        letterSpacing: -0.5,
    },
    statusCell: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: 'flex-start',
        minWidth: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statusText: {
        fontSize: FONTS.size.sm,
        fontFamily: FONTS.family.semiBold,
        color: '#333',
        letterSpacing: -0.5,
        textAlign: 'center',
    },
    expandedColumnText: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    expandedButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
    },
    buttonAction: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#DBEAFE',
    },
    expandedButtonContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
        marginTop: 12,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 20,
        gap: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: 8,
        borderRadius: 8,
        gap: 5,
    },
    actionButtonText: {
        color: '#0E509E',
        fontSize: 14,
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    filterSection: {
        marginBottom: 20,
    },
    filterLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
        paddingHorizontal: 4,
        color: '#333',
    },
    chipScrollView: {
        flexGrow: 0,
    },
    chipContainer: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        paddingVertical: 4,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F5F5F5',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    chipSelected: {
        backgroundColor: '#0E509E',
        borderColor: '#0E509E',
    },
    chipText: {
        color: '#666',
        fontSize: 14,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: 'white',
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        paddingHorizontal: 4,
    },
    clearButton: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#0E509E',
        minWidth: 100,
        alignItems: 'center',
    },
    clearButtonText: {
        color: '#0E509E',
        fontSize: 14,
        fontWeight: '500',
    },
    applyButton: {
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#0E509E',
        minWidth: 100,
        alignItems: 'center',
    },
    applyButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    filterButton: {
        padding: 8,
    },
    addButton: {
        width: 56,
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
});

export default DetailProjekDua;
