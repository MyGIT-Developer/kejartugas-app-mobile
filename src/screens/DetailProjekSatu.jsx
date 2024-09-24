import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ActivityIndicator, Dimensions, StyleSheet, RefreshControl } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
const { height } = Dimensions.get('window');

const DetailProjekSatu = ({ filterType, onScrollBeginDrag, onScrollEndDrag, data }) => {
    const formatDate = (date) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(date).toLocaleDateString('id-ID', options);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.infoContainer}>
                <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Tipe Proyek</Text>
                        <Text style={styles.fieldValueText}>{data.project_type}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Ditugaskan Oleh</Text>
                        <Text style={styles.fieldValueText}>{data.assign_by_name}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Periode Proyek</Text>
                        <Text style={styles.fieldValueText}>
                            {formatDate(data.start_date)} - {formatDate(data.end_date)}
                        </Text>
                    </View>
                </View>
                <View style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Divisi</Text>
                        <Text style={styles.fieldValueText}>{data.team_name}</Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Ditugaskan Kepada</Text>
                        <Text style={styles.fieldValueText}>
                            {data.assignedEmployees.map((employee) => employee.employee_name)}
                        </Text>
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <Text style={styles.fieldText}>Keterangan</Text>
                        <Text style={styles.fieldValueText}>{data.project_desc ?? '-'}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.midContainer}>
                <View style={[styles.countContainer, styles.borderOrange]}>
                    <Text style={styles.countLabel}>Tugas Dalam Proses</Text>
                    <Text style={styles.countValue}>{data.total_tasks_working_on_it}</Text>
                </View>
                <View style={[styles.countContainer, styles.borderGreen]}>
                    <Text style={styles.countLabel}>Semua Tugas Selesai</Text>
                    <Text style={styles.countValue}>{data.total_task_completed}</Text>
                </View>
                <View style={[styles.countContainer, styles.borderRed]}>
                    <Text style={styles.countLabel}>Total Tugas</Text>
                    <Text style={styles.countValue}>{data.total_task_created}</Text>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: height, // Ensure the content is at least as tall as the screen
        flexGrow: 1,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    backgroundBox: {
        height: 125, // Set your desired height
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1, // Ensure the gradient covers the entire view
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 30,
    },
    header: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginTop: 50,
    },
    mainContainer: {
        height: '200vh',
        borderRadius: 20,
        margin: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    upperContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        borderRadius: 20,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.3,
    },
    infoContainer: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 10,
        borderRadius: 20,
        padding: 20,
        backgroundColor: 'white',
        borderRadius: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
    },
    midContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between', // Ensure equal space between containers
        paddingHorizontal: 20,
    },
    countContainer: {
        flexBasis: '30%', // Adjusts container width to take up roughly 1/3rd of available space
        padding: 10,
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1, // Slightly reduce shadow opacity for performance
        elevation: 3, // Reduce elevation to avoid heavy rendering
        alignItems: 'center', // Center text horizontally in each container
    },
    countLabel: {
        fontSize: 8,
        color: '#333', // Make the text color slightly darker for readability
    },
    countValue: {
        fontSize: 20,
        fontWeight: '600',
    },
    borderOrange: {
        borderWidth: 2,
        borderColor: '#DD9968',
    },
    borderGreen: {
        borderWidth: 2,
        borderColor: '#3AD665',
    },
    borderRed: {
        borderWidth: 2,
        borderColor: '#DD6868',
    },
    subHeader: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    subHeaderTextLeft: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    subHeaderTextRight: {
        fontSize: 14,
        color: 'gray',
    },
    fieldText: {
        fontSize: 12,
    },
    fieldValueText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default DetailProjekSatu;
