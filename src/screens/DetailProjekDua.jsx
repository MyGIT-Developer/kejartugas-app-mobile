import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert , SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DraggableModalTask from '../components/DraggableModalTask';
import ReusableModalSuccess from '../components/TaskModalSuccess';
import { fetchTaskById, deleteTask } from '../api/task'; // Import the fetchTaskById function
import AsyncStorage from '@react-native-async-storage/async-storage';
const { height } = Dimensions.get('window');
import FloatingButtonTask from '../components/FloatingButtonTask';
import { useNavigation } from '@react-navigation/native';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';

const STATUS_MAPPING = {
    Completed: { text: 'Selesai', bgColor: '#C9F8C1', textColor: '#0A642E' },
    workingOnIt: { text: 'Dalam Pengerjaan', bgColor: '#aeaeae', textColor: '#000000' },
    rejected: { text: 'Ditolak', bgColor: '#F69292', textColor: '#811616' },
    onReview: { text: 'Dalam Peninjauan', bgColor: '#f6e092', textColor: '#ee9000' },
    onHold: { text: 'Ditunda', bgColor: '#F69292', textColor: '#811616' },
    onPending: { text: 'Tersedia', bgColor: 'yellow.300', textColor: 'gray' },
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
          "Konfirmasi Hapus",
          "Apakah Anda yakin ingin menghapus tugas ini?",
          [
            {
              text: "Batal",
              style: "cancel"
            },
            {
              text: "Hapus",
              onPress: deleteTaskHandler,
              style: "destructive"
            }
          ],
          { cancelable: false }
        );
      }, []);
      
    return (
        <ScrollView contentContainerStyle={styles.rowContainer}>
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
        </ScrollView>
    );
});

const DetailProjekDua = ({ data, onFetch }) => {
    const taskData = useMemo(() => data.tasks, [data.tasks]);
    const [modalType, setModalType] = useState('default'); // Initialize modalType state
    const [selectedTask, setSelectedTask] = useState(null);
    const [draggableModalVisible, setDraggableModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleTaskDetailPress = async (task) => {
        const baseUrl = 'http://202.10.36.103:8000/';
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
                assignedBy: taskDetails.assign_by ? taskDetails.assign_by.name : 'N/A', // Accessing nested object
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

            // Optionally check task status for modal type
            if (taskDetails.task_status === 'Completed') {
                setModalType('success');
            } else {
                setModalType('default');
            }

            setDraggableModalVisible(true);
        } catch (error) {
            console.error('Error fetching task details:', error);
            // Optionally, show an alert or a message to the user
        }
    };

    return (
        <SafeAreaView>
            <ScrollView contentContainerStyle={styles.container}>
                <ScrollView style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.indexHeaderCell]}>No</Text>
                        <Text style={[styles.headerCell, styles.taskNameHeaderCell]}>Nama Tugas</Text>
                        <Text style={[styles.headerCell, styles.statusHeaderCell]}>Status</Text>
                    </View>
                    {taskData && taskData.length > 0 ? (
                        taskData.map((item, index) => (
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
                </ScrollView>

                {modalType === 'default' ? (
                    <DraggableModalTask
                        visible={draggableModalVisible}
                        onClose={() => {
                            setDraggableModalVisible(false);
                            setSelectedTask(null); // Optional: Reset selectedTask on close
                        }}
                        taskDetails={selectedTask || {}}
                    />
                ) : (
                    <ReusableModalSuccess
                        visible={draggableModalVisible}
                        onClose={() => setDraggableModalVisible(false)}
                        taskDetails={selectedTask || {}}
                    />
                )}
            </ScrollView>
            <FloatingButtonTask projectData={data} />

          
        </SafeAreaView>

    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 200,
    },
    table: {
        borderRadius: 15,
        width: '100%',
        shadowColor: '#000',
        backgroundColor: 'white',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
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
        fontWeight: 'bold',
        color: 'white',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    indexHeaderCell: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    taskNameHeaderCell: {
        flex: 3,
        textAlign: 'left',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    statusHeaderCell: {
        flex: 2,
        textAlign: 'center',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    rowContainer: {
        marginBottom: 8,
        backgroundColor: 'white',
        borderRadius: 8,
        // shadowColor: "#000",
        // shadowOffset: {
        //   width: 0,
        //   height: 2,
        // },
        // shadowOpacity: 0.23,
        // shadowRadius: 2.62,
        // elevation: 4,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
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
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    statusCell: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 15,
        minWidth: 80,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    expandedContent: {
        padding: 12,
        backgroundColor: '#F5F5F5',
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
    },
    expandedLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0E509E',
        marginBottom: 4,
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    expandedText: {
        fontSize: 14,
        color: '#333',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.3,
    },
    expandedColumnText: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    buttonAction: {
        padding: 8,
        backgroundColor: '#E3E3E3',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedButtonContainer: {
        position: 'flex-start',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
    },
});

export default DetailProjekDua;
