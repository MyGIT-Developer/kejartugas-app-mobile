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
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <View style={styles.column}>
                        <InfoRow label="Tipe Projek" value={data.project_type} />
                        <InfoRow label="Ditugaskan Oleh" value={data.assign_by_name} />
                    </View>
                    <View style={styles.column}>
                        <InfoRow label="Divisi" value={data.team_name} />
                    </View>
                </View>

                <InfoRow
                    label="Ditugaskan Kepada"
                    value={data.assignedEmployees.map((employee) => employee.employee_name).join(', ')}
                />

                <InfoRow label="Keterangan" value={data.project_desc ?? '-'} />
            </View>

            <View style={styles.midContainer}>
                <CountContainer
                    label="Tugas Dalam Proses"
                    value={data.total_tasks_working_on_it}
                    borderColor="#DD9968"
                />
                <CountContainer label="Semua Tugas Selesai" value={data.total_task_completed} borderColor="#3AD665" />
                <CountContainer label="Total Tugas" value={data.total_task_created} borderColor="#DD6868" />
            </View>

            {/* <View style={styles.lowerContainer}>
                <LineChartExample taskData={data.tasks} />
            </View> */}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        display: 'flex',
        flexGrow: 1,
        paddingHorizontal: 20,
        flexDirection: 'column',
        height: height - 100,
        width: SCREEN_WIDTH,
    },
    infoContainer: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 20,
        gap: 10,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.3,
        elevation: 5,
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
        gap: 10,
    },
    countContainer: {
        flex: 1, // Allow each count box to take equal space
        paddingVertical: 5,
        paddingHorizontal: 5,
        borderWidth: 2,
        borderRadius: 10,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        elevation: 3,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
    },
    countLabel: {
        fontSize: 12, // Adjust for readability
        fontWeight: '600',
        fontFamily: 'Poppins-Medium',
        color: '#333',
        lineHeight: 20,
    },
    countValue: {
        fontSize: 30,
        fontWeight: '600',
        fontFamily: 'Poppins-Bold',
    },
    fieldText: {
        fontSize: 12,
        fontFamily: 'Poppins-Medium',
    },
    fieldValueText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: 'Poppins-Bold',
    },
});

export default DetailProjekSatu;
