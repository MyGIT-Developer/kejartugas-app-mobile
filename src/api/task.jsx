import apiService from '../utils/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fetchTotalTasksForEmployee = async (employeeId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/total-taskinemployee/${employeeId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching total tasks failed');
    }
};
export const submitTask = async (taskId, payload) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.put(`/tasks/${taskId}/submit`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Task submission failed');
    }
};

export const fetchTaskById = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/tasks/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching task failed');
    }
};

// apiService.js or the appropriate file for your API functions
export const fetchChatByTaskId = async (taskId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const response = await apiService.get(`/chat/${taskId}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; // Return the data field directly
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching chat messages failed');
    }
};

export const sendChatMessage = async (employeeId, taskId, message, companyId) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const payload = {
            employee_id: employeeId,
            tasks_id: taskId,
            message: message,
            company_id: companyId,
        };

        console.log('Sending chat message with payload:', payload);

        const response = await apiService.post(`/chat`, payload, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return response.data; // Return the data field directly
    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        throw new Error(error.response?.data?.message || 'Sending chat message failed');
    }
};
