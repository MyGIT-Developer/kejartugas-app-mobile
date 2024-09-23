// src/api/task.js
import apiService from '../utils/apiService';

export const fetchTotalTasksForEmployee = async (employeeId) => {
    try {
        const response = await apiService.get(`/total-taskinemployee/${employeeId}`); // {{ edit_1 }} Corrected the endpoint
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Fetching total tasks failed'); // {{ edit_2 }} Update penanganan kesalahan
    }
};
