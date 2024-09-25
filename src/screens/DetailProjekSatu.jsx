import React from 'react';
import { View, Text, Dimensions, StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import LineChartExample from '../components/Linechart';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

// Utility function for date formatting
const formatDate = (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(date).toLocaleDateString('id-ID', options);
};

// Reusable component for info rows
const InfoRow = ({ label, value }) => (
    <View style={styles.infoRow}>
        <Text style={styles.fieldText}>{label}</Text>
        <Text style={styles.fieldValueText}>{value}</Text>
    </View>
);

// Reusable component for count boxes
const CountContainer = ({ label, value, borderColor }) => (
    <View style={[styles.countContainer, { borderColor }]}>
        <Text style={styles.countLabel}>{label}</Text>
        <Text style={styles.countValue}>{value}</Text>
    </View>
);

const DetailProjekSatu = ({ data }) => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.infoContainer}>
                <View style={styles.column}>
                    <InfoRow label="Tipe" value={data.project_type} />
                    <InfoRow label="Ditugaskan Oleh" value={data.assign_by_name} />
                    <InfoRow label="Periode Proyek" value={`${formatDate(data.start_date)} - ${formatDate(data.end_date)}`} />
                </View>
                <View style={styles.column}>
                    <InfoRow label="Divisi" value={data.team_name} />
                    <InfoRow label="Ditugaskan Kepada" value={data.assignedEmployees.map((employee) => employee.employee_name).join(', ')} />
                    <InfoRow label="Keterangan" value={data.project_desc ?? '-'} />
                </View>
            </View>

            <View style={styles.midContainer}>
                <CountContainer label="Tugas Dalam Proses" value={data.total_tasks_working_on_it} borderColor="#DD9968" />
                <CountContainer label="Semua Tugas Selesai" value={data.total_task_completed} borderColor="#3AD665" />
                <CountContainer label="Total Tugas" value={data.total_task_created} borderColor="#DD6868" />
            </View> 

            <View style={styles.lowerContainer}>
                <LineChartExample taskData={data.tasks}/>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        minHeight: height,
        flexGrow: 1,
    },
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
        width: SCREEN_WIDTH - 40,
        marginBottom: 20,
    },
    column: {
        flex: 1,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'column',
        gap: 5,
    },
    midContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',  // Adjust spacing between boxes
        flexWrap: 'wrap', // Allow wrapping to prevent overflow
        gap: 10,
        paddingHorizontal: 20, // Add padding for better alignment
    },
    countContainer: {
        flex: 1,  // Allow each count box to take equal space
        paddingVertical: 10,
        paddingHorizontal:2,
        borderWidth: 2,
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        elevation: 3,
        // alignItems: 'center',
    },
    countLabel: {
        fontSize: 12,  // Adjust for readability
        color: '#333',
    },
    countValue: {
        fontSize: 30,
        fontWeight: '600',
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
