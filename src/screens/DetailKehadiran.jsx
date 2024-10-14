import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Feather } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCameraAsync, MediaTypeOptions } from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { checkIn } from '../api/absent';
import MyMap from '../components/Maps';
import ReusableBottomPopUp from '../components/ReusableBottomPopUp';
import CheckBox from '../components/Checkbox';

const DetailKehadiran = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { location, locationName, jamTelat = [], radius } = route.params || {};

    const [currentTime, setCurrentTime] = useState('');
    const [employeeId, setEmployeeId] = useState(null);
    const [companyId, setCompanyId] = useState(null);
    const [isWFH, setIsWFH] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [alert, setAlert] = useState({ show: false, type: 'success', message: '' });
    const [reasonInput, setReasonInput] = useState('');

    const [latitude, longitude] = location.split(',').map(coord => parseFloat(coord.trim()));
    const parsedLocation = {
        latitude: isNaN(latitude) ? 0 : latitude,
        longitude: isNaN(longitude) ? 0 : longitude
    };

    useEffect(() => {
        const interval = setInterval(updateCurrentTime, 1000);
        getStoredData();
        return () => clearInterval(interval);
    }, []);

    const updateCurrentTime = () => {
        const now = new Date();
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
        setCurrentTime(now.toLocaleTimeString([], options));
    };

    const getStoredData = async () => {
        try {
            const storedEmployeeId = await AsyncStorage.getItem('employeeId');
            const storedCompanyId = await AsyncStorage.getItem('companyId');
            setEmployeeId(storedEmployeeId);
            setCompanyId(storedCompanyId);
        } catch (error) {
            console.error('Error fetching AsyncStorage data:', error);
        }
    };

    const calculateLateStatus = useCallback(() => {
        const currentDate = new Date();
        const [hours, minutes] = jamTelat.split(':');
        const officeStartTime = new Date();
        officeStartTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
        return currentDate > officeStartTime;
    }, [jamTelat]);

    const isUserLate = calculateLateStatus();

    const triggerCamera = async () => {
        try {
            const result = await launchCameraAsync({
                mediaTypes: MediaTypeOptions.Images,
                allowsEditing: false,
                quality: 1,
                base64: true,
            });

            if (!result.canceled && result.assets && result.assets[0].uri) {
                setCapturedImage(result.assets[0].uri);
            } else {
                Alert.alert('Camera was canceled or no valid image was captured.');
            }
        } catch (error) {
            console.error('Camera error:', error);
            Alert.alert('Error', `Error when using camera: ${error.message || 'Unknown error'}`);
        }
    };

    const handleClockIn = async () => {
        if (!capturedImage) {
            showAlert('Silahkan mengambil foto terlebih dahulu!', 'error');
            return;
        }

        if (isUserLate && !reasonInput.trim()) {
            showAlert('Silahkan memberikan Alasan Keterlambatan!', 'error');
            return;
        }

        try {
            await checkIn(
                employeeId,
                companyId,
                isUserLate ? reasonInput : null,
                capturedImage,
                location,
                isWFH,
            );
            showAlert('Anda berhasil check-in!', 'success');
            setTimeout(() => {
                setAlert((prev) => ({ ...prev, show: false }));
                navigation.navigate('App', { screen: 'Kehadiran' });
            }, 1500);
        } catch (error) {
            console.error('Check-in error:', error.message);
            showAlert(`Error when checking in: ${error.message || 'Unknown error'}`, 'error');
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, type, message });
    };

    const handleGoBack = () => {
        navigation.goBack();
    };

    return (
        <ScrollView style={styles.container}>
            <LinearGradient
                colors={['#0E509E', '#5FA0DC', '#9FD2FF']}
                style={styles.linearGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContainer}>
                    <Feather name="chevron-left" style={styles.backIcon} onPress={handleGoBack} />
                    <Text style={styles.headerText}>Lokasi Kehadiran</Text>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>{currentTime}</Text>
                    {isUserLate && (
                        <View style={styles.lateStatusContainer}>
                            <View style={styles.lateStatusDot} />
                            <Text style={styles.lateStatusText}>Late</Text>
                        </View>
                    )}
                </View>

                <View style={styles.locationContainer}>
                    <Icon name="location-on" size={24} color="gray" />
                    <Text style={styles.locationTitle}>Lokasi saat ini</Text>
                </View>
                <Text style={styles.locationName}>{locationName}</Text>

                <View style={styles.mapContainer}>
                    <MyMap location={parsedLocation} radius={radius} />
                </View>

                <CheckBox
                    onPress={() => setIsWFH(!isWFH)}
                    title="Sedang berada di luar kantor"
                    isChecked={isWFH}
                />

                {!capturedImage && (
                    <TouchableOpacity style={styles.cameraButton} onPress={triggerCamera}>
                        <Icon name="camera-alt" size={24} color="white" />
                        <Text style={styles.cameraButtonText}>Ambil Foto</Text>
                    </TouchableOpacity>
                )}

                {capturedImage && (
                    <Image source={{ uri: capturedImage }} style={styles.previewImage} />
                )}

                {isUserLate && (
                    <TextInput
                        style={styles.input}
                        placeholder="Silahkan berikan alasan keterlambatan"
                        value={reasonInput}
                        onChangeText={setReasonInput}
                        multiline
                    />
                )}

                <TouchableOpacity
                    style={[
                        styles.checkInButton,
                        (!capturedImage || (isUserLate && !reasonInput)) && styles.disabledButton,
                    ]}
                    onPress={handleClockIn}
                    disabled={!capturedImage || (isUserLate && !reasonInput)}
                >
                    <Text style={styles.buttonText}>Clock In</Text>
                </TouchableOpacity>
            </View>

            <ReusableBottomPopUp
                show={alert.show}
                alertType={alert.type}
                message={alert.message}
                onConfirm={() => setAlert((prev) => ({ ...prev, show: false }))}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    linearGradient: {
        height: 110,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
    },
    backIcon: {
        position: 'absolute',
        left: 20,
        color: 'white',
        fontSize: 24,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    content: {
        padding: 20,
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timeText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    lateStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffbda5',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 20,
    },
    lateStatusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#ff0002',
        marginRight: 5,
    },
    lateStatusText: {
        color: '#000',
        fontWeight: '500',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    locationTitle: {
        fontSize: 18,
        fontWeight: '500',
        marginLeft: 5,
    },
    locationName: {
        fontSize: 14,
        color: 'gray',
        marginBottom: 15,
    },
    mapContainer: {
        height: 200,
        marginBottom: 20,
        borderRadius: 10,
        overflow: 'hidden',
    },
    cameraButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#27A0CF',
        padding: 15,
        borderRadius: 10,
        marginVertical: 20,
    },
    cameraButtonText: {
        color: 'white',
        marginLeft: 10,
        fontSize: 16,
    },
    previewImage: {
        width: '100%',
        height: 200,
        resizeMode: 'cover',
        borderRadius: 10,
        marginTop:20,
        marginBottom: 20,
    },
    input: {
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        marginBottom: 20,
        height: 100,
        textAlignVertical: 'top',
    },
    checkInButton: {
        backgroundColor: '#27A0CF',
        borderRadius: 30,
        padding: 15,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: 'gray',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default DetailKehadiran;