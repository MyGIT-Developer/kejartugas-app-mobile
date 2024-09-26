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
