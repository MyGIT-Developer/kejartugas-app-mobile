import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Progress from 'react-native-progress';
import FloatingButtonProject from '../components/FloatingButtonProject';

const { height } = Dimensions.get('window');

const TableRow = ({ item, index }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <View style={styles.rowContainer}>
            <TouchableOpacity onPress={() => setExpanded(!expanded)} style={styles.row}>
                <Text style={styles.cell}>{index + 1}</Text>
                <Text style={styles.cell}>{item.name}</Text>
                <Text style={styles.cell}>{item.status}</Text>
                <Progress.Bar progress={item.progress} width={80} color="#0E509E" />
                <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={24} color="#0E509E" />
            </TouchableOpacity>
            {expanded && (
                <View style={styles.expandedContent}>
                    <Text style={styles.expandedText}>Description: {item.description}</Text>
                    <Text style={styles.expandedText}>Due Date: {item.dueDate}</Text>
                </View>
            )}
        </View>
    );
};

const DetailProjekDua = ({ data }) => {
    return (
        <>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={styles.headerCell}>No</Text>
                        <Text style={styles.headerCell}>Nama Tugas</Text>
                        <Text style={styles.headerCell}>Status</Text>
                        <Text style={styles.headerCell}>Status Pengerjaan</Text>
                    </View>
                    {data.tasks.map((item, index) => (
                        <TableRow key={index} item={item} index={index} />
                    ))}
                </View>
            </ScrollView>
            <FloatingButtonProject />
        </>
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
        borderRadius: 15,
        width: '100%', // Ensure responsiveness across screens
        shadowColor: '#000',
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
        backgroundColor: 'white',
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
