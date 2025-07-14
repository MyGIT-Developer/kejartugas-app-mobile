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
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeById } from '../api/general';
import { useFonts } from '../utils/UseFonts';
import * as Haptics from 'expo-haptics';

const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const InfoItem = ({ label, value, icon, fontsLoaded }) => (
    <View style={styles.infoItem}>
        <View style={styles.infoLeft}>
            <View style={styles.iconContainer}>
                <Ionicons name={icon} size={20} color="#0E509E" />
            </View>
            <Text style={[styles.label, fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null]}>{label}</Text>
        </View>
        <Text style={[styles.value, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>{value}</Text>
    </View>
);

const StatisticCard = ({ value, label, icon, fontsLoaded }) => (
    <View style={styles.statCard}>
        <View style={styles.statIconContainer}>
            <Ionicons name={icon} size={24} color="#0E509E" />
        </View>
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
    const baseUrl = 'https://app.kejartugas.com/';

    const fetchUserData = useCallback(async () => {
        try {
            const employeeId = await AsyncStorage.getItem('employeeId');
            const response = await getEmployeeById(employeeId);
            setUserData(response);
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    }, []);

    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(300));
    const [scaleAnim] = useState(new Animated.Value(0.9));

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 80,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

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
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
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
            {/* Enhanced Header Background */}
            <View style={styles.backgroundBox}>
                <LinearGradient
                    colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                    style={styles.linearGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                />
                <View style={styles.headerOverlay} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']}
                        tintColor="#0E509E"
                        progressBackgroundColor="#ffffff"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Modern Header */}
                <Animated.View
                    style={[
                        styles.header,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => {
                            if (Platform.OS === 'ios') {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }
                            navigation.goBack();
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={[styles.headerText, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                        Profil Saya
                    </Text>
                    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.7}>
                        <Ionicons name="log-out-outline" size={24} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>

                {/* Enhanced Profile Card */}
                <Animated.View
                    style={[
                        styles.profileCard,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.avatarContainer}>
                        {userData.profile_picture ? (
                            <Image source={{ uri: `${baseUrl}${userData.profile_picture}` }} style={styles.avatar} />
                        ) : (
                            <View style={styles.initialsContainer}>
                                <Text
                                    style={[styles.initialsText, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}
                                >
                                    {getInitials(userData.employee_name)}
                                </Text>
                            </View>
                        )}
                        <View style={styles.statusIndicator} />
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={[styles.name, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}>
                            {userData.employee_name}
                        </Text>
                        <View style={styles.jobContainer}>
                            <Ionicons name="briefcase-outline" size={16} color="#6B7280" />
                            <Text style={[styles.jobTitle, fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null]}>
                                {userData.job_name}
                            </Text>
                        </View>
                        <View style={styles.companyContainer}>
                            <Ionicons name="business-outline" size={16} color="#6B7280" />
                            <Text style={[styles.companyText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                                {userData.company_name}
                            </Text>
                        </View>
                        <View style={styles.teamContainer}>
                            <Ionicons name="people-outline" size={16} color="#6B7280" />
                            <Text style={[styles.teamText, fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null]}>
                                {userData.team_name}
                            </Text>
                        </View>
                    </View>
                </Animated.View>

                {/* Enhanced Stats */}
                <Animated.View
                    style={[
                        styles.statsContainer,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <StatisticCard
                        value={userData.total_projects || '0'}
                        label="Projek"
                        icon="folder-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <View style={styles.statsDevider} />
                    <StatisticCard
                        value={userData.total_tasks || '0'}
                        label="Tugas"
                        icon="checkmark-circle-outline"
                        fontsLoaded={fontsLoaded}
                    />
                </Animated.View>

                {/* Information Sections with Icons */}
                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="call-outline" size={20} color="#0E509E" />
                        <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                            Informasi Kontak
                        </Text>
                    </View>
                    <InfoItem
                        label="Email"
                        value={userData.email || '-'}
                        icon="mail-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="No. Handphone"
                        value={userData.mobile_number || '-'}
                        icon="phone-portrait-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Alamat"
                        value={userData.address || '-'}
                        icon="location-outline"
                        fontsLoaded={fontsLoaded}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="person-outline" size={20} color="#0E509E" />
                        <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                            Data Pribadi
                        </Text>
                    </View>
                    <InfoItem
                        label="NIK"
                        value={userData.identity_number || '-'}
                        icon="card-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="NPWP"
                        value={userData.npwp_number || '-'}
                        icon="document-text-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Tanggal Lahir"
                        value={userData.date_of_birth || '-'}
                        icon="calendar-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Jenis Kelamin"
                        value={userData.gender || '-'}
                        icon="transgender-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Agama"
                        value={userData.religion || '-'}
                        icon="home-outline"
                        fontsLoaded={fontsLoaded}
                    />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.section,
                        { marginBottom: 30 },
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="briefcase-outline" size={20} color="#0E509E" />
                        <Text style={[styles.sectionTitle, fontsLoaded ? { fontFamily: 'Poppins-SemiBold' } : null]}>
                            Informasi Pekerjaan
                        </Text>
                    </View>
                    <InfoItem
                        label="Jabatan"
                        value={userData.job_name || '-'}
                        icon="medal-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Departemen"
                        value={userData.team_name || '-'}
                        icon="people-outline"
                        fontsLoaded={fontsLoaded}
                    />
                    <InfoItem
                        label="Role"
                        value={userData.role_name || '-'}
                        icon="shield-outline"
                        fontsLoaded={fontsLoaded}
                    />
                </Animated.View>

                {/* Enhanced Modal */}
                <Modal visible={modalVisible} transparent={true} animationType="none">
                    <View style={styles.overlay}>
                        <Animated.View style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}>
                            {isLoading ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color="#0E509E" />
                                    <Text
                                        style={[
                                            styles.loadingText,
                                            fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                                        ]}
                                    >
                                        Sedang logout...
                                    </Text>
                                </View>
                            ) : (
                                <>
                                    <View style={styles.modalIcon}>
                                        <Ionicons name="log-out-outline" size={48} color="#EF4444" />
                                    </View>
                                    <Text
                                        style={[styles.modalTitle, fontsLoaded ? { fontFamily: 'Poppins-Bold' } : null]}
                                    >
                                        Konfirmasi Logout
                                    </Text>
                                    <Text
                                        style={[
                                            styles.modalSubtitle,
                                            fontsLoaded ? { fontFamily: 'Poppins-Regular' } : null,
                                        ]}
                                    >
                                        Apakah Anda yakin ingin keluar dari aplikasi?
                                    </Text>
                                    <View style={styles.modalButtonContainer}>
                                        <TouchableOpacity
                                            style={styles.cancelButton}
                                            onPress={cancelLogout}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.cancelButtonText,
                                                    fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                                                ]}
                                            >
                                                Batal
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.confirmButton}
                                            onPress={handleLogout}
                                            activeOpacity={0.8}
                                        >
                                            <Text
                                                style={[
                                                    styles.confirmButtonText,
                                                    fontsLoaded ? { fontFamily: 'Poppins-Medium' } : null,
                                                ]}
                                            >
                                                Logout
                                            </Text>
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
        backgroundColor: '#F8FAFC',
    },
    backgroundBox: {
        height: 280,
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    linearGradient: {
        flex: 1,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 120,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
    },
    headerText: {
        fontSize: 20,
        fontWeight: '600',
        color: 'white',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 40,
    },
    backButton: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoutButton: {
        width: 35,
        height: 35,
        borderRadius: 20,
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    profileCard: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 10,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(14, 80, 158, 0.1)',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    initialsContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#0E509E',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#fff',
        shadowColor: '#0E509E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    initialsText: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#fff',
    },
    profileInfo: {
        alignItems: 'center',
        width: '100%',
    },
    name: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        textAlign: 'center',
    },
    jobContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    jobTitle: {
        fontSize: 16,
        color: '#4B5563',
        marginLeft: 6,
        fontWeight: '500',
    },
    companyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    companyText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    teamContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    teamText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
    },
    statsContainer: {
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(14, 80, 158, 0.1)',
    },
    statsDevider: {
        width: 1,
        backgroundColor: '#E5E7EB',
        marginHorizontal: 20,
    },
    statCard: {
        alignItems: 'center',
        flex: 1,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(14, 80, 158, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0E509E',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    section: {
        backgroundColor: 'white',
        marginHorizontal: 20,
        marginTop: 16,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(14, 80, 158, 0.1)',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginLeft: 8,
    },
    infoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(14, 80, 158, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    label: {
        fontSize: 14,
        color: '#4B5563',
        fontWeight: '500',
        flex: 1,
    },
    value: {
        fontSize: 14,
        color: '#1F2937',
        textAlign: 'right',
        maxWidth: '50%',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 15,
    },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6B7280',
    },
    modalButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        gap: 12,
    },
    confirmButton: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        flex: 1,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    cancelButtonText: {
        color: '#6B7280',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default Profile;
