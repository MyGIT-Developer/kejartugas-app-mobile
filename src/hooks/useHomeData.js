import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHomeData } from '../api/general';
import { fetchTotalTasksForEmployee } from '../api/task';
import { getNotificationByEmployee } from '../api/notification';
import NotificationService from '../utils/notificationService';

// Custom hook for employee data
export const useEmployeeData = () => {
    const [employeeData, setEmployeeData] = useState({
        name: '',
        id: '',
        companyId: '',
        roleId: '',
        token: '',
    });

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const keys = ['employee_name', 'employeeId', 'companyId', 'userRole', 'token'];
                const values = await AsyncStorage.multiGet(keys);
                const data = Object.fromEntries(values);
                setEmployeeData({
                    name: data.employee_name,
                    id: data.employeeId,
                    companyId: data.companyId,
                    roleId: data.userRole,
                    token: data.token,
                });
            } catch (error) {
                console.error('Error fetching data from AsyncStorage:', error);
            }
        };

        fetchEmployeeData();
    }, []);

    return employeeData;
};

// Custom hook for dashboard data
export const useDashboardData = (employeeData) => {
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        if (!employeeData.companyId || !employeeData.id || !employeeData.roleId || !employeeData.token) return;

        setIsLoading(true);
        try {
            const response = await getHomeData(
                employeeData.companyId,
                employeeData.id,
                employeeData.roleId,
                employeeData.token,
            );
            setDashboardData(response);
        } catch (error) {
            console.error('Error fetching home data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [employeeData]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { dashboardData, isLoading, refetch: fetchData };
};

// Custom hook for tasks data
export const useTasksData = (employeeData) => {
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchTasks = useCallback(async () => {
        if (!employeeData.id) return;

        setIsLoading(true);
        try {
            const data = await fetchTotalTasksForEmployee(employeeData.id);

            const sortedTasks = data.employeeTasks
                .filter((task) => task.task_status === 'onReview' || task.task_status === 'workingOnIt')
                .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

            setTasks(sortedTasks);

            const projectsMap = new Map();
            sortedTasks.forEach((task) => {
                if (!projectsMap.has(task.project_id)) {
                    projectsMap.set(task.project_id, {
                        project_id: task.project_id,
                        project_name: task.project_name,
                        tasks: [],
                    });
                }
                projectsMap.get(task.project_id).tasks.push(task);
            });
            setProjects(Array.from(projectsMap.values()));

            // Store task IDs in AsyncStorage
            await Promise.all(
                sortedTasks.map((task) => AsyncStorage.setItem(`task_${task.id}`, JSON.stringify(task.id))),
            );
        } catch (error) {
            console.error('Error fetching tasks:', error);
        } finally {
            setIsLoading(false);
        }
    }, [employeeData.id]);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    return { tasks, projects, isLoading, refetch: fetchTasks };
};

// Custom hook for notifications
export const useNotifications = (employeeData) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationsSeen, setNotificationsSeen] = useState(new Set());
    const [lastFetchTime, setLastFetchTime] = useState(Date.now());

    const handleLocalNotification = async (notification) => {
        try {
            let title = 'New Notification';
            let body = notification.message;

            switch (notification.notif_type) {
                case 'TASK_ASSIGNED':
                    title = '🔔 New Task Assignment';
                    break;
                case 'TASK_UPDATE':
                    title = '📝 Task Update';
                    break;
                case 'TASK_COMMENT':
                    title = '💬 New Comment';
                    break;
                default:
                    title = '🔔 New Notification';
            }

            await NotificationService.sendLocalNotification(title, body, {
                data: {
                    type: notification.notif_type,
                    taskId: notification.task_id,
                    notificationId: notification.id,
                },
            });
        } catch (error) {
            console.error('Error sending local notification:', error);
        }
    };

    const fetchNotifications = useCallback(async () => {
        if (!employeeData.id) return;

        try {
            const currentTime = Date.now();
            const response = await getNotificationByEmployee(employeeData.id);
            const notifications = response.data;

            // Find new unread notifications
            const newUnreadNotifications = notifications.filter(
                (notification) =>
                    !notification.is_read &&
                    !notificationsSeen.has(notification.id) &&
                    new Date(notification.created_at) > new Date(lastFetchTime),
            );

            // Show notifications only for new ones
            if (newUnreadNotifications.length > 0) {
                for (const notification of newUnreadNotifications) {
                    await handleLocalNotification(notification);
                    setNotificationsSeen((prev) => new Set([...prev, notification.id]));
                }
            }

            setNotifications(notifications);
            setLastFetchTime(currentTime);
            const unread = notifications.filter((notif) => !notif.is_read).length;
            setUnreadCount(unread);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [employeeData.id, lastFetchTime, notificationsSeen]);

    useEffect(() => {
        let intervalId;

        if (employeeData.id) {
            fetchNotifications();
            intervalId = setInterval(fetchNotifications, 60000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [fetchNotifications]);

    // Load saved seen notifications on mount
    useEffect(() => {
        const loadSeenNotifications = async () => {
            try {
                const stored = await AsyncStorage.getItem('seenNotifications');
                if (stored) {
                    setNotificationsSeen(new Set(JSON.parse(stored)));
                }
            } catch (error) {
                console.error('Error loading seen notifications:', error);
            }
        };

        loadSeenNotifications();
    }, []);

    // Save seen notifications
    useEffect(() => {
        const saveSeenNotifications = async () => {
            try {
                await AsyncStorage.setItem('seenNotifications', JSON.stringify(Array.from(notificationsSeen)));
            } catch (error) {
                console.error('Error saving seen notifications:', error);
            }
        };

        if (notificationsSeen.size > 0) {
            saveSeenNotifications();
        }
    }, [notificationsSeen]);

    return {
        notifications,
        unreadCount,
        refetch: fetchNotifications,
        setNotifications,
        setUnreadCount,
    };
};
