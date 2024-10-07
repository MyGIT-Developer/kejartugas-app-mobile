import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Button } from 'react-native';
import { Feather } from '@expo/vector-icons';
import FloatingButtonProject from '../components/FloatingButtonProject';

const { height } = Dimensions.get('window');

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

const TableRow = React.memo(({ item, index }) => {
    const [expanded, setExpanded] = useState(false);
    const toggleExpanded = useCallback(() => setExpanded((prev) => !prev), []);

    const statusInfo = STATUS_MAPPING[item.task_status] || {
        text: 'Tidak Diketahui',
        bgColor: '#9E9E9E',
        textColor: 'black',
    };
    console.log(item);
    return (
        <ScrollView contentContainerStyle={styles.rowContainer}>
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
                    <Text style={styles.expandedLabel}>PIC:</Text>
                    <Text style={styles.expandedText}>
                        {item.assigned_employees?.map((employee) => employee.employee_name).join(', ') || '-'}
                    </Text>
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
                    <View style={styles.expandedButtonContainer}>
                        <TouchableOpacity style={[styles.buttonAction, {backgroundColor: "none"}]}>
                            {/* <Text style={[styles.expandedText, { color: '#0E509E' }]}>Edit</Text> */}
                            <Feather name={"eye"} color="blue"/>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buttonAction, {backgroundColor: "none"}]}>
                            {/* <Text style={[styles.expandedText, { color: '#0E509E' }]}>Delete</Text> */}
                            <Feather name={"edit"} color="black"/>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.buttonAction, {backgroundColor: "none"}]}>
                            {/* <Text style={[styles.expandedText, { color: '#0E509E' }]}>Approve</Text> */}
                            <Feather name={"trash"} color={"red"}/>
                        </TouchableOpacity>
                        {/* <TouchableOpacity style={[styles.buttonAction, {backgroundColor: "#d7d7d7"}]}>
                            <Text style={[styles.expandedText, { color: '#0E509E' }]}>Reject</Text>
                        </TouchableOpacity> */}
                    </View>
                </View>
            )}
        </ScrollView>
    );
});

const DetailProjekDua = ({ data }) => {
    const taskData = useMemo(() => data.tasks, [data.tasks]);

    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <ScrollView style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.indexHeaderCell]}>No</Text>
                        <Text style={[styles.headerCell, styles.taskNameHeaderCell]}>Nama Tugas</Text>
                        <Text style={[styles.headerCell, styles.statusHeaderCell]}>Status</Text>
                    </View>
                    {taskData.map((item, index) => (
                        <TableRow key={item.id || index} item={item} index={index} />
                    ))}
                </ScrollView>
            </ScrollView>
        </>
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
    },
    buttonAction: {
        padding: 8,
        backgroundColor: '#E3E3E3',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedButtonContainer : {
        position: "flex-start",
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10,
        gap: 10,
    }
});

export default DetailProjekDua;
