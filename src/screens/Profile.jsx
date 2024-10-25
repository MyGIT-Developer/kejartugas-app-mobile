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
    Alert,
    RefreshControl,
    ActivityIndicator,
    Modal,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getEmployeeById } from '../api/general';
const { height, width: SCREEN_WIDTH } = Dimensions.get('window');

const showNotImplementedAlert = (featureName) => {
    Alert.alert(
        'Feature Not Available',
        `The ${featureName} feature is not implemented yet. Please check back later.`,
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
    );
};



const Profile = () => {
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
    const [userData, setUserData] = useState([]);
    const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
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

    const [slideAnim] = useState(new Animated.Value(300)); // Start below screen

    React.useEffect(() => {
        if (modalVisible) {
            Animated.timing(slideAnim, {
                toValue: 0, // Slide up to its normal position
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 300, // Slide back down
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
    }, []);

    const ProfileButton = ({ icon, title, onPress }) => (
        <TouchableOpacity style={styles.profileButton} onPress={onPress}>
            <Icon name={icon} size={24} color="#4A4A4A" />
            <Text style={styles.profileButtonText}>{title}</Text>
        </TouchableOpacity>
    );

    const navigateToScreen = (screenName, data) => {
        navigation.navigate(screenName, { employeeData: data });
    };

    const handleLogout = async () => {
        setIsLoading(true); // Start loading
    
        // Delay function using Promise and setTimeout
        const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    
        try {
            // Optional delay (e.g., 2 seconds before logging out)
            await delay(2000); // Adjust the time in milliseconds (2000ms = 2 seconds)
    
            await AsyncStorage.clear();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
    
            // Close the modal after successful logout
            setModalVisible(false); 
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false); // Stop loading
        }
    };
    

    const confirmLogout = () => {
        setModalVisible(true); // Show the confirmation modal
    };

    const cancelLogout = () => {
        setModalVisible(false); // Hide modal
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
            <ScrollView
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#0E509E']} // Android
                        tintColor="#0E509E" // iOS
                    />
                }
            >
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profile}>
                    <Image source={{ uri: `${baseUrl}${userData.profile_picture}` }} style={styles.avatar} />
                    <View>
                        <Text style={styles.name}>{userData.employee_name}</Text>
                        <Text style={styles.role}>{userData.job_name}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                        <Icon name="phone" size={20} color="#fff" />
                        <Text style={styles.infoText}>{userData.mobile_number || '-'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Icon name="email" size={20} color="#fff" />
                        <Text style={styles.infoText}>{userData.email || '-'}</Text>
                    </View>
                </View>

                <View style={styles.buttonContainer}>
                    <ProfileButton
                        icon="person"
                        title="Personal Information"
                        onPress={() => navigateToScreen('PersonalInformation', userData)}
                    />
                    <ProfileButton
                        icon="edit"
                        title="Edit Profile"
                        onPress={() => showNotImplementedAlert('Edit Profile')}
                    />
                    <ProfileButton
                        icon="help"
                        title="Help & Support"
                        onPress={() => showNotImplementedAlert('Help & Support')}
                    />
                    <ProfileButton
                        icon="book"
                        title="Terms and Privacy Policy"
                        onPress={() => showNotImplementedAlert('Terms and Privacy Policy')}
                    />
                </View>

                <View>
                    <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
                        {/* <Icon name="logout" size={24} color="#fff" style={{ transform: [{ scaleX: -1 }] }}/> */}
                        <Text style={styles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>

                    {/* Logout Confirmation Modal */}
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
                </View>
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
        justifyContent: 'center',
        alignItems: 'center',
        width: SCREEN_WIDTH,
        marginTop: 20,
        gap: 20,
    },
    backIcon: {
        position: 'absolute',
        top: 35,
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    editIcon: {
        position: 'absolute',
        top: 35,
        right: 20,
        color: 'white',
        fontSize: 24,
    },
    profile: {
        paddingHorizontal: 16,
        alignItems: 'center',
        gap: 10,
        flexDirection: 'row',
        marginTop: 80,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontFamily: 'Poppins-Bold',
        color: '#333',
    },
    role: {
        fontSize: 16,
        fontFamily: 'Poppins-Medium',
        color: '#fff',
    },
    infoContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    infoText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#fff',
        fontFamily: 'Poppins-Medium',
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 20,
        paddingVertical: 20,
        backgroundColor: '#FFF',
        borderRadius: 12,
        marginHorizontal: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4A90E2',
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    buttonContainer: {
        marginTop: 20,
        paddingHorizontal: 16,
    },
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    profileButtonText: {
        marginLeft: 16,
        fontSize: 16,
        color: '#4A4A4A',
        fontFamily: 'Poppins-Medium',
        letterSpacing: -0.5,
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 30,
        flexDirection: 'row',
        gap: 10,
        justifyContent: 'center',
    },
    logoutButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontFamily: 'Poppins-Bold',
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
    },
    modalContainer: {
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
        position: 'absolute',
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: 'Poppins-Bold',
        marginBottom: 20,
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
        fontFamily: 'Poppins-Bold',
    },
});

export default Profile;
