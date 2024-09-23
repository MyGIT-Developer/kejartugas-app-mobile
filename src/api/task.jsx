// src/api/task.js
import apiService from '../utils/apiService';

export const fetchTotalTasksForEmployee = async (employeeId) => {
    try {
        const response = await apiService.get(`/api/total-taskinemployee/${employeeId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching total tasks:', error);
        throw error;
    }
};
