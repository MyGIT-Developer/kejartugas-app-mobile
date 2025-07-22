import NotificationService from '../utils/notificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../utils/apiService';
import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

const taskNotifTypes = [
    'new_task_notif',
    'submit_task_notif',
    'approve_task_notif',
    'reject_task_notif',
    'hold_task_notif',
];

// Register the task before using it
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
    if (error) {
        console.error('Error handling background notification:', error);
        return;
    }

    if (!data) {
        console.log('No data with background notification');
        return;
    }

    const { type, taskId, projectId } = data;

    // Note: useNavigation() cannot be used in a background task
    // Instead, you should handle the navigation when the app is opened
    console.log('Background notification received:', { type, taskId, projectId });
});

export const registerDeviceToken = async () => {
    try {
        // Get the required data
        const [employeeId, authToken, companyId] = await Promise.all([
            AsyncStorage.getItem('employeeId'),
            AsyncStorage.getItem('token'),
            AsyncStorage.getItem('companyId'),
        ]);

        if (!employeeId || !authToken) {
            console.log('Missing required data:', { employeeId, authToken });
            return null;
        }

        // Get device token
        const deviceToken = await NotificationService.getExpoPushToken();

        if (!deviceToken) {
            console.log('Failed to get device token');
            return null;
        }

        // Prepare request data
        const requestData = {
            employee_id: employeeId,
            company_id: companyId,
            token: deviceToken,
            device_type: Platform.OS,
        };

        // Make the API call
        const response = await apiService.post('/device/register', requestData, {
            headers: {
                Authorization: `Bearer ${authToken}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data;
    } catch (error) {
        console.error('Device registration error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        throw error;
    }
};

export const setupNotifications = async () => {
    try {
        // Request permissions first
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }

        // Register device
        await registerDeviceToken();

        // Get employee ID for notification refresh
        const employeeId = await AsyncStorage.getItem('employeeId');

        // Register background task
        await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

        // Setup foreground handler
        const foregroundSubscription = Notifications.addNotificationReceivedListener(async (notification) => {
            console.log('Received notification:', notification);

            if (employeeId) {
                try {
                    await getNotificationByEmployee(employeeId);
                } catch (error) {
                    console.error('Error fetching notifications:', error);
                }
            }
        });

        // Setup notification response handler
        const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            handleNotificationInteraction(data);
        });

        // Return cleanup function
        return () => {
            foregroundSubscription.remove();
            responseSubscription.remove();
        };
    } catch (error) {
        console.error('Error setting up notifications:', error);
        return () => {};
    }
};

export const handleNotificationInteraction = (data) => {
    if (!data || !data.type) return;

    const navigation = useNavigation();

    if (taskNotifTypes.includes(data.type)) {
        navigation.navigate('TaskDetails', { taskId: data.taskId });
    } else if (data.type === 'project_update_notif') {
        navigation.navigate('ProjectDetails', { projectId: data.projectId });
    } else {
        console.log('Unknown notification type:', data.type);
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
// Mark all notifications as read for an employee
export const markAllAsRead = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        await apiService.post(`/notifications/mark-all-read/${employeeId}`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Marking all notifications as read failed');
    }
};
