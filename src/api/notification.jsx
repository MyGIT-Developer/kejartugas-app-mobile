import NotificationService from '../utils/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../utils/apiService';
import { Platform } from 'react-native';

export const registerDeviceToken = async () => {
    try {
        // Get the required data
        const [employeeId, authToken, companyId] = await Promise.all([
            AsyncStorage.getItem('employeeId'),
            AsyncStorage.getItem('token'),
            AsyncStorage.getItem('companyId')
        ]);

        // Debug log
        console.log('Stored data:', { employeeId, companyId });

        if (!employeeId || !authToken) {
            console.log('Missing required data:', { employeeId, authToken });
            return null;
        }

        // Get device token
        const deviceToken = await NotificationService.getExpoPushToken();
        console.log('Device token:', deviceToken);

        if (!deviceToken) {
            console.log('Failed to get device token');
            return null;
        }

        // Prepare request data
        const requestData = {
            employee_id: employeeId,
            company_id: companyId,
            token: deviceToken,
            device_type: Platform.OS
        };

        console.log('Registering device with data:', requestData);

        // Make the API call
        const response = await apiService.post('/device/register', requestData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Device registration response:', response.data);
        return response.data;

    } catch (error) {
        // Detailed error logging
        console.error('Device registration error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            requestData: error.config?.data,
            endpoint: error.config?.url
        });

        throw error;
    }
};

export const setupNotifications = async () => {
    try {
        // Register device first
        const registrationResult = await registerDeviceToken();
        console.log('Registration result:', registrationResult);

        // Get employee ID for notification refresh
        const employeeId = await AsyncStorage.getItem('employeeId');

        // Setup notification handlers
        const cleanup = NotificationService.setupNotificationListeners(async (data) => {
            console.log('Received notification:', data);
            
            if (employeeId) {
                try {
                    const notifications = await getNotificationByEmployee(employeeId);
                    console.log('Updated notifications:', notifications);
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            }
        });

        return cleanup;
    } catch (error) {
        console.error('Error setting up notifications:', error);
        // Don't throw error to prevent blocking app startup
        return () => {};
    }
};

export const getNotificationByEmployee = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/notifications/employees/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching notification failed');
    }
};

export const markAsRead = async (notificationId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        await apiService.put(`/notifications/${notificationId}/read`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Marking notification as read failed');
    }
};