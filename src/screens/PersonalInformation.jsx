// PersonalInformation.js
import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const StatisticCard = ({ value, label }) => (
    <View style={styles.statCard}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
    </View>
);

const PersonalInformation = ({ route }) => {
    const { employeeData } = route.params;

    const navigation = useNavigation();

    const getInitials = (name) => {
        return (
            name
                ?.split(' ')
                .map((word) => word[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || 'AD'
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
            </View>

            <View style={styles.headerSection}>
                <Feather name="chevron-left" style={styles.backIcon} onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Personal Information</Text>
            </View>
            <ScrollView>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.profileImage}>
                        {employeeData.profile_picture ? (
                            <Image source={{ uri: employeeData.profile_picture }} style={styles.profilePhoto} />
                        ) : (
                            <Text style={styles.profileInitials}>{getInitials(employeeData.employee_name)}</Text>
                        )}
                    </View>
                    <Text style={styles.name}>{employeeData.employee_name}</Text>
                    <Text style={styles.jobTitle}>{employeeData.job_name}</Text>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{employeeData.company_name}</Text>
                        <Text style={styles.teamName}>Tim: {employeeData.team_name}</Text>
                    </View>
                </View>

                {/* Statistics Section */}
                <View style={styles.statsContainer}>
                    <StatisticCard value={employeeData.total_projects} label="Total Projek" />
                    <View style={styles.statsDevider} />
                    <StatisticCard value={employeeData.total_tasks} label="Total Tugas" />
                </View>

                {/* Information Sections */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Kontak</Text>
                    <InfoItem label="Email" value={employeeData.email} />
                    <InfoItem label="No. Handphone" value={employeeData.mobile_number || '-'} />
                    <InfoItem label="Alamat" value={employeeData.address || '-'} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Data Pribadi</Text>
                    <InfoItem label="NIK" value={employeeData.identity_number || '-'} />
                    <InfoItem label="NPWP" value={employeeData.npwp_number || '-'} />
                    <InfoItem label="Tanggal Lahir" value={employeeData.date_of_birth || '-'} />
                    <InfoItem label="Jenis Kelamin" value={employeeData.gender || '-'} />
                    <InfoItem label="Agama" value={employeeData.religion || '-'} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informasi Pekerjaan</Text>
                    <InfoItem label="Jabatan" value={employeeData.job_name} />
                    <InfoItem label="Departemen" value={employeeData.team_name} />
                    <InfoItem label="Role" value={employeeData.role_name} />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoItem = ({ label, value }) => (
    <View style={styles.infoItem}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    backgroundBox: {
        height: 155, // Set your desired height
        width: '100%', // Set your desired width
        position: 'absolute', // Position it behind other elements
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1, // Ensure the gradient covers the entire view
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerSection: {
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        letterSpacing: -1,
        marginTop: 35,
    },
    backIcon: {
        position: 'absolute',
        top: 35,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    header: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        marginHorizontal: 15,
        borderRadius: 8,
        shadowColor: '#444',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    profileImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    profileInitials: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        textAlign: 'center',
    },
    jobTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 5,
    },
    companyInfo: {
        alignItems: 'center',
    },
    companyName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    teamName: {
        fontSize: 14,
        color: '#666',
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginTop: 15,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 15,
        borderRadius: 8,
        shadowColor: '#444',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    statsDevider: {
        width: 1,
        height: '100%',
        backgroundColor: '#e0e0e0',
        marginHorizontal: 30,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 5,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    section: {
        backgroundColor: 'white',
        marginTop: 15,
        padding: 15,
        marginHorizontal: 15,
        borderRadius: 8,
        shadowColor: '#444',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 15,
        color: '#333',
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    label: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    value: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        backgroundColor: 'white',
        borderRadius: 8,
        marginVertical: 5,
    },
    buttonText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#333',
    },
});

export default PersonalInformation;
