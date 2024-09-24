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
