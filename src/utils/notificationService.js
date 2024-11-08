// src/utils/notificationService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { navigate } from '../navigation/navigationRef'; // Update this import

class NotificationService {
    constructor() {
        this.configure();
        this.expoPushToken = null;
        this.lastNotificationTime = Date.now();
        this.notificationQueue = new Set();
    }

    async configure() {
        try {
            // Configure how notifications are presented when app is in foreground
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
            });

            // Request permissions
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
        } catch (error) {
            console.error('Error configuring notifications:', error);
        }
    }

    async requestPermissions() {
        try {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            if (finalStatus !== 'granted') {
                console.log('Failed to get push token for push notification!');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error requesting permissions:', error);
            return false;
        }
    }

    async sendLocalNotification(title, body, options = {}) {
        try {
            const notificationId = options.data?.notificationId;
            
            // Prevent duplicate notifications
            if (this.notificationQueue.has(notificationId)) {
                return;
            }

            // Add to queue
            this.notificationQueue.add(notificationId);

            // Ensure minimum time between notifications
            const currentTime = Date.now();
            const timeSinceLastNotification = currentTime - this.lastNotificationTime;
            if (timeSinceLastNotification < 2000) { // 2 seconds minimum
                await new Promise(resolve => 
                    setTimeout(resolve, 2000 - timeSinceLastNotification)
                );
            }

            await this.requestPermissions();
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: options.data || {},
                    sound: true,
                    priority: 'high',
                    vibrate: [0, 250, 250, 250],
                    badge: 1,
                    color: '#0E509E',
                },
                trigger: null,
            });

            this.lastNotificationTime = Date.now();

            // Remove from queue after a delay
            setTimeout(() => {
                this.notificationQueue.delete(notificationId);
            }, 5000);

        } catch (error) {
            console.error('Error sending local notification:', error);
            this.notificationQueue.delete(options.data?.notificationId);
        }
    }

    async scheduleNotification(title, body, date) {
        try {
            await this.requestPermissions();

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: title,
                    body: body,
                    sound: true,
                    priority: 'high',
                },
                trigger: {
                    date: date,
                },
            });
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }

    async getExpoPushToken() {
        if (this.expoPushToken) return this.expoPushToken;

        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) return null;

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig.extra.eas.projectId,
            });
            
            this.expoPushToken = token.data;
            return token.data;
        } catch (error) {
            console.error('Error getting push token:', error);
            return null;
        }
    }

    // Task-specific notification methods
    async notifyTaskAssigned(taskData) {
        const { title, description, dueDate, assignedBy } = taskData;
        await this.sendLocalNotification(
            'New Task Assigned',
            `Task: ${title}\nAssigned by: ${assignedBy}\nDue: ${new Date(dueDate).toLocaleDateString()}`
        );
    }

    async notifyTaskSubmitted(taskData) {
        const { title, submittedBy } = taskData;
        await this.sendLocalNotification(
            'Task Submitted',
            `Task "${title}" has been submitted by ${submittedBy}`
        );
    }

    async notifyTaskStatusUpdate(taskData) {
        const { title, status, remarks } = taskData;
        const statusMessage = status === 'APPROVED' ? 'approved' : 'rejected';
        const message = remarks 
            ? `Task "${title}" has been ${statusMessage}.\nRemarks: ${remarks}`
            : `Task "${title}" has been ${statusMessage}.`;

        await this.sendLocalNotification(
            `Task ${status.charAt(0) + status.slice(1).toLowerCase()}`,
            message
        );
    }

    async sendLocalNotification(title, body, options = {}) {
        try {
            await this.requestPermissions();
            
            await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: options.data || {},
                    sound: true,
                    priority: 'high',
                    vibrate: [0, 250, 250, 250],
                    badge: 1,
                    color: '#0E509E',
                },
                trigger: null, // null means send immediately
            });
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
    }

    setupNotificationListeners(onNotificationReceived) {
        // When app is in foreground
        const notificationListener = Notifications.addNotificationReceivedListener(
            notification => {
                const { data } = notification.request.content;
                onNotificationReceived?.(data);
            }
        );

        // When notification is tapped
        const responseListener = Notifications.addNotificationResponseReceivedListener(
            response => {
                const { data } = response.notification.request.content;
                this.handleNotificationResponse(data);
            }
        );

        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    }

    handleNotificationResponse(data) {
        if (!data) return;

        try {
            switch (data.type) {
                case 'TASK_ASSIGNED':
                case 'TASK_UPDATE':
                    navigation.navigate('TaskDetails', { taskId: data.taskId });
                    break;
                case 'PROJECT_UPDATE':
                    navigation.navigate('ProjectDetails', { projectId: data.projectId });
                    break;
                default:
                    console.log('Unknown notification type:', data.type);
            }
        } catch (error) {
            console.error('Error handling notification response:', error);
        }
    }
}

export default new NotificationService();