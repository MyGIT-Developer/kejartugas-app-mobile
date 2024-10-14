import React, { useState, useEffect } from 'react';
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
    const navigation = useNavigation();
    const [userData, setUserData] = useState([]);
    const Avatar = require('./../../assets/images/avatar.png');
    // const userData = {
    //     name: 'Emma Phillips',
    //     role: 'Fashion Model',
    //     avatar: 'data:image/jpeg;base64,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', // Replace with actual image URL
    //     phone: '(581)-307-6902',
    //     email: 'emma.phillips@gmail.com',
    //     wallet: 140.00,
    //     orders: 12
    // };

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

    const ProfileButton = ({ icon, title, onPress }) => (
        <TouchableOpacity style={styles.profileButton} onPress={onPress}>
            <Icon name={icon} size={24} color="#4A4A4A" />
            <Text style={styles.profileButtonText}>{title}</Text>
        </TouchableOpacity>
    );
    

    const handleLogout = async () => {
        try {
            await AsyncStorage.clear();
            // Use reset or navigate based on your app's structure
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error) {
            console.log(error);
        }
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
            <ScrollView>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backIcon} onPress={() => navigation.goBack()}>
                        <Icon name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editIcon}>
                        <Icon name="edit" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profile}>
                    <Image source={{ uri: userData.profile_picture }} style={styles.avatar} />
                    <View>
                        <Text style={styles.name}>{userData.employee_name}</Text>
                        <Text style={styles.role}>{userData.job_name}</Text>
                    </View>
                </View>

                <View style={styles.infoContainer}>
                    <View style={styles.infoItem}>
                        <Icon name="phone" size={20} color="#fff" />
                        <Text style={styles.infoText}>{userData.phone_number || '-'}</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Icon name="email" size={20} color="#fff" />
                        <Text style={styles.infoText}>{userData.email || '-'}</Text>
                    </View>
                </View>

                {/* <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>${userData.account_number}</Text>
                        <Text style={styles.statLabel}>Wallet</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{userData.job_name}</Text>
                        <Text style={styles.statLabel}>Orders</Text>
                    </View>
                </View> */}

                <View style={styles.buttonContainer}>
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
                    {/* <ProfileButton icon="logout" title="Log Out" onPress={() => {handleLogout}} /> */}
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={()=>handleLogout()}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
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
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    role: {
        fontSize: 16,
        color: '#fff',
        marginTop: 4,
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
    },
    logoutButton: {
        backgroundColor: '#e74c3c',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginHorizontal: 20,
        marginTop: 30,
    },
    logoutButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Profile;
