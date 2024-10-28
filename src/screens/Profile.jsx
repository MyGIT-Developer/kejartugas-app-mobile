import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    Text,
    Image,
    TouchableOpacity,
    Dimensions,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Modal,
    Animated,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeById } from '../api/general';
import { useFonts } from '../utils/UseFonts';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const InfoItem = ({ label, value, fontsLoaded }) => (
    <View style={styles.infoItem}>
        <Text style={[styles.label, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>{label}</Text>
        <Text style={[styles.value, fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null]}>{value}</Text>
    </View>
);

const StatisticCard = ({ value, label, fontsLoaded }) => (
    <View style={styles.statCard}>
        <Text style={[styles.statValue, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>{value}</Text>
        <Text style={[styles.statLabel, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>{label}</Text>
    </View>
);

const Profile = () => {
    const fontsLoaded = useFonts();
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const [userData, setUserData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const baseUrl = 'http://202.10.36.103:8000/';

    const fetchUserData = useCallback(async () => {
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            const response = await getEmployeeById(employeeId);
            setUserData(response);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, []);

    const [slideAnim] = useState(new Animated.Value(300));

    useEffect(() => {
        if (modalVisible) {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [modalVisible]);

    useEffect(() => {
        const getUserData = async () => {
            try {
                const response = await getEmployeeById(await AsyncStorage.getItem('employeeId'));
                setUserData(response);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };
        getUserData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchUserData().then(() => setRefreshing(false));
    }, [fetchUserData]);

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

    const handleLogout = async () => {
        setIsLoading(true);
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        try {
            await delay(2000);
            await AsyncStorage.clear();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
            setModalVisible(false);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };

    const confirmLogout = () => {
        setModalVisible(true);
    };

    const cancelLogout = () => {
        setModalVisible(false);
    };

    if (!fontsLoaded) {
        return <ActivityIndicator size="large" color="#0E509E" style={{ flex: 1 }} />;
    }

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
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100 }} // Tambahkan paddingBottom untuk bagian bawah
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                    />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                        Profile
                    </Text>
                </View>
                <View style={styles.profileSection}>
                    <View style={styles.profileHeader}>
                        <TouchableOpacity style={styles.logoutIcon} onPress={confirmLogout}>
                            <Icon name="exit-to-app" size={24} color="#e74c3c" />
                        </TouchableOpacity>
                    </View>
                    {userData.profile_picture ? (
                        <Image source={{ uri: `${baseUrl}${userData.profile_picture}` }} style={styles.avatar} />
                    ) : (
                        <View style={styles.initialsContainer}>
                            <Text style={[styles.initialsText, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                                {getInitials(userData.employee_name)}
                            </Text>
                        </View>
                    )}
                    <Text style={[styles.name, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                        {userData.employee_name}
                    </Text>
                    <Text style={[styles.jobTitle, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                        {userData.job_name}
                    </Text>
                    <View style={styles.companyInfo}>
                        <Text style={[styles.companyText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                            {userData.company_name}
                        </Text>
                        <Text style={[styles.teamText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                            Tim: {userData.team_name}
                        </Text>
                    </View>
                </View>

                <View style={styles.statsContainer}>
                    <StatisticCard value={userData.total_projects} label="Total Projek" fontsLoaded={fontsLoaded} />
                    <View style={styles.statsDevider} />
                    <StatisticCard value={userData.total_tasks} label="Total Tugas" fontsLoaded={fontsLoaded} />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        Informasi Kontak
                    </Text>
                    <InfoItem label="Email" value={userData.email} fontsLoaded={fontsLoaded} />
                    <InfoItem label="No. Handphone" value={userData.mobile_number || '-'} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Alamat" value={userData.address || '-'} fontsLoaded={fontsLoaded} />
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        Data Pribadi
                    </Text>
                    <InfoItem label="NIK" value={userData.identity_number || '-'} fontsLoaded={fontsLoaded} />
                    <InfoItem label="NPWP" value={userData.npwp_number || '-'} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Tanggal Lahir" value={userData.date_of_birth || '-'} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Jenis Kelamin" value={userData.gender || '-'} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Agama" value={userData.religion || '-'} fontsLoaded={fontsLoaded} />
                </View>

                <View style={[styles.section, { marginBottom: 30 }]}>
                    <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        Informasi Pekerjaan
                    </Text>
                    <InfoItem label="Jabatan" value={userData.job_name} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Departemen" value={userData.team_name} fontsLoaded={fontsLoaded} />
                    <InfoItem label="Role" value={userData.role_name} fontsLoaded={fontsLoaded} />
                </View>

                <Modal visible={modalVisible} transparent={true} animationType="none">
                    <View style={styles.overlay}>
                        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                            {isLoading ? (
                                <ActivityIndicator size="large" color="#0000ff" />
                            ) : (
                                <>
                                    <Text style={styles.modalTitle}>Are you sure you want to logout?</Text>
                                    <View style={styles.modalButtonContainer}>
                                        <TouchableOpacity style={styles.confirmButton} onPress={handleLogout}>
                                            <Text style={styles.buttonText}>Logout</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.cancelButton} onPress={cancelLogout}>
                                            <Text style={styles.buttonText}>Cancel</Text>
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </Animated.View>
                    </View>
                </Modal>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    backgroundBox: {
        height: 300,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: SCREEN_WIDTH,
        paddingTop: 60,
        paddingBottom: 20,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
    },
    backIcon: {
        position: 'absolute',
        left: 20,
        color: 'white',
    },
    profileSection: {
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        marginHorizontal: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginBottom: 15,
    },
    profileHeader: {
        width: '100%',
        alignItems: 'flex-end',
        marginBottom: -10,
    },
    logoutIcon: {
        padding: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    initialsContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#2196F3',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    initialsText: {
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
    companyText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 2,
    },
    teamText: {
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
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
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmButton: {
        backgroundColor: '#e74c3c',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        marginRight: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#808080',
        padding: 10,
        borderRadius: 5,
        flex: 1,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Profile;
