import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';

const { height, width } = Dimensions.get('window');

const TableRow = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.rowContainer}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.row}>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.status}</Text>
                <Progress.Bar progress={item.progress} width={80} color="#0E509E" />
                <Feather name={expanded ? "chevron-up" : "chevron-down"} size={24} color="#0E509E" />
            </TouchableOpacity>
            {expanded && (
                <View style={styles.expandedContent}>
                    <Text style={styles.expandedText}>Description: {item.description}</Text>
                    <Text style={styles.expandedText}>Due Date: {item.dueDate}</Text>
                    {/* Add more details here as needed */}
                </View>
            )}
        </View>
    );
};

const DetailProjekDua = ({ data }) => {
    const [taskData, setTaskData] = useState([]);

    useEffect(() => {
        setTaskData(data.tasks);
    }, [data]);

    const tableData = [
        { name: "Task 1", status: "In Progress", progress: 0.3, description: "This is task 1", dueDate: "2023-12-31" },
        { name: "Task 2", status: "Completed", progress: 1, description: "This is task 2", dueDate: "2023-11-30" },
        { name: "Task 3", status: "Not Started", progress: 0, description: "This is task 3", dueDate: "2024-01-15" },
    ];

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.table}>
                <View style={styles.tableHeader}>
                    <Text style={styles.headerCell}>No</Text>
                    <Text style={styles.headerCell}>Nama Tugas</Text>
                    <Text style={styles.headerCell}>PIC</Text>
                    <Text style={styles.headerCell}>Status Pengerjaan</Text>
                </View>
                {tableData.map((item, index) => (
                    <TableRow key={index} item={item} index={index} />
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: height,
        flexGrow: 1,
        padding: 10,
    },
    table: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        overflow: 'hidden',
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#3D8BDA',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    headerCell: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
    },
    rowContainer: {
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 5,
    },
    cell: {
        flex: 1,
        textAlign: 'center',
    },
    expandedContent: {
        padding: 10,
        backgroundColor: '#f9f9f9',
    },
    expandedText: {
        marginBottom: 5,
    },
});

export default DetailProjekDua;